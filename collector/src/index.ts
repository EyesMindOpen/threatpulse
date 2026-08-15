/**
 * ThreatPulse Intelligence Collector
 * ----------------------------------
 * A standalone scheduled worker that ingests threat intelligence into the
 * ThreatPulse PostgreSQL database (the same DB the Next.js app uses).
 *
 * Sources:
 *   - CISA KEV  (known exploited vulnerabilities, JSON)
 *   - NVD       (CVE feed, REST API v2)
 *   - RSS feeds (US-CERT, Krebs, Bleeping Computer, Dark Reading, SANS ISC,
 *                Threatpost, SecurityWeek, Recorded Future, Unit42, Talos, CISA)
 *
 * Schedule: every COLLECTOR_INTERVAL_MINUTES (default 15) via node-cron.
 * Set RUN_ONCE=true to run a single collection cycle and exit (useful for
 * cron-in-container, manual `make` targets, or debugging).
 *
 * Observability: each source run is recorded as a CollectorRun row so the
 * app's Collector Health dashboard can show live status. A tiny HTTP control
 * server (COLLECTOR_CONTROL_PORT, default 9464) exposes POST /run to let the
 * app trigger a manual collection ("Run Now").
 */
import cron from 'node-cron';
import {
  waitForDatabase,
  resolveOrganizationId,
  upsertThreats,
  closePool,
  startCollectorRun,
  completeCollectorRun,
  failCollectorRun,
  ThreatRecord,
} from './db';
import { createLogger } from './logger';
import { collectKev } from './sources/kev';
import { collectNvd } from './sources/nvd';
import { collectRss } from './sources/rss';
import { startControlServer } from './control';
import { runWeeklyExecutiveSummary } from './summaries/weekly-executive';

const log = createLogger('collector');

const INTERVAL_MINUTES = Math.max(
  1,
  Number(process.env.COLLECTOR_INTERVAL_MINUTES || 15),
);
const RUN_ONCE = String(process.env.RUN_ONCE || '').toLowerCase() === 'true';
const WEEKLY_SUMMARY_ENABLED = envFlag('WEEKLY_SUMMARY_ENABLED', true);
const WEEKLY_SUMMARY_CRON = process.env.WEEKLY_SUMMARY_CRON || '0 8 * * 1';
const RUN_ONCE_SUMMARY = String(process.env.RUN_ONCE_SUMMARY || '').toLowerCase() === 'true';

type SourceFn = () => Promise<ThreatRecord[]>;

interface Source {
  key: string; // stable key stored on CollectorRun.source
  name: string; // human-readable label
  fn: SourceFn;
  enabled: boolean;
}

const SOURCES: Source[] = [
  { key: 'cisa_kev', name: 'CISA KEV', fn: collectKev, enabled: envFlag('COLLECT_KEV', true) },
  { key: 'nvd', name: 'NVD', fn: collectNvd, enabled: envFlag('COLLECT_NVD', true) },
  { key: 'rss', name: 'RSS', fn: collectRss, enabled: envFlag('COLLECT_RSS', true) },
];

function envFlag(name: string, def: boolean): boolean {
  const v = process.env[name];
  if (v === undefined) return def;
  return !['0', 'false', 'no', 'off'].includes(v.toLowerCase());
}

let running = false;

/**
 * Run a collection cycle. When `onlySourceKey` is provided, only that source
 * runs (used by the manual "Run Now" trigger); otherwise all enabled sources
 * run. Returns a short summary for the caller.
 */
async function runCycle(onlySourceKey?: string): Promise<{
  ok: boolean;
  message: string;
  totalInserted: number;
  totalUpdated: number;
}> {
  if (running) {
    log.warn('Previous collection cycle still running — skipping this tick.');
    return { ok: false, message: 'A collection cycle is already running.', totalInserted: 0, totalUpdated: 0 };
  }
  running = true;
  const startedAt = Date.now();
  log.info('──────────── Collection cycle START ────────────');

  try {
    const organizationId = await resolveOrganizationId();
    if (!organizationId) {
      log.warn(
        'No organization found yet (app may not have seeded). Skipping cycle; will retry next tick.',
      );
      return { ok: false, message: 'No organization found yet.', totalInserted: 0, totalUpdated: 0 };
    }
    log.info(`Target organizationId=${organizationId}`);

    let totalInserted = 0;
    let totalUpdated = 0;

    const targets = onlySourceKey
      ? SOURCES.filter((s) => s.key === onlySourceKey)
      : SOURCES;

    if (onlySourceKey && targets.length === 0) {
      return { ok: false, message: `Unknown source "${onlySourceKey}".`, totalInserted: 0, totalUpdated: 0 };
    }

    for (const source of targets) {
      if (!source.enabled && !onlySourceKey) {
        log.info(`Source "${source.name}" disabled via env — skipping.`);
        continue;
      }
      const runStartedAt = Date.now();
      const runId = await startCollectorRun(source.key);
      try {
        const records = await source.fn();
        const { inserted, updated } = await upsertThreats(records, organizationId);
        totalInserted += inserted;
        totalUpdated += updated;
        await completeCollectorRun(
          runId,
          {
            itemsFound: records.length,
            itemsNew: inserted,
            itemsUpdated: updated,
            itemsSkipped: Math.max(0, records.length - inserted - updated),
          },
          runStartedAt,
        );
        log.info(
          `Source "${source.name}" done: ${inserted} new, ${updated} updated (${records.length} fetched).`,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await failCollectorRun(runId, msg, runStartedAt);
        log.error(`Source "${source.name}" failed: ${msg}`);
      }
    }

    const secs = ((Date.now() - startedAt) / 1000).toFixed(1);
    log.info(
      `──────────── Collection cycle DONE in ${secs}s — ${totalInserted} new, ${totalUpdated} updated ────────────`,
    );
    return {
      ok: true,
      message: `${totalInserted} new, ${totalUpdated} updated.`,
      totalInserted,
      totalUpdated,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error(`Collection cycle aborted: ${msg}`);
    return { ok: false, message: msg, totalInserted: 0, totalUpdated: 0 };
  } finally {
    running = false;
  }
}

async function main(): Promise<void> {
  log.info('ThreatPulse Intelligence Collector starting up.');
  log.info(
    `Config: interval=${INTERVAL_MINUTES}m, runOnce=${RUN_ONCE}, ` +
      `enabledSources=[${SOURCES.filter((s) => s.enabled).map((s) => s.name).join(', ')}]`,
  );

  await waitForDatabase();

  if (RUN_ONCE) {
    await runCycle();
    await closePool();
    log.info('RUN_ONCE complete — exiting.');
    process.exit(0);
  }

  // HTTP control server for manual "Run Now" triggers from the app.
  startControlServer({
    isRunning: () => running,
    trigger: (sourceKey?: string) => runCycle(sourceKey),
    knownSourceKeys: SOURCES.map((s) => s.key),
  });

  // Run one cycle immediately on boot, then on the schedule.
  await runCycle();

  const expr = `*/${INTERVAL_MINUTES} * * * *`;
  if (!cron.validate(expr)) {
    log.error(`Invalid cron expression "${expr}" — falling back to every 15m.`);
  }
  const schedule = cron.validate(expr) ? expr : '*/15 * * * *';
  cron.schedule(schedule, () => {
    runCycle().catch((err) => log.error('Scheduled cycle error', String(err)));
  });
  log.info(`Scheduled collection with cron "${schedule}".`);

  // Weekly executive summary email (leadership report).
  if (RUN_ONCE_SUMMARY) {
    log.info('RUN_ONCE_SUMMARY set - sending weekly executive summary then exiting.');
    try {
      const res = await runWeeklyExecutiveSummary();
      log.info('Weekly summary: ' + res.message);
    } catch (err) {
      log.error('Weekly summary failed: ' + (err instanceof Error ? err.message : String(err)));
    }
    await closePool();
    process.exit(0);
  }

  if (WEEKLY_SUMMARY_ENABLED) {
    if (cron.validate(WEEKLY_SUMMARY_CRON)) {
      cron.schedule(WEEKLY_SUMMARY_CRON, () => {
        runWeeklyExecutiveSummary().catch((err) => log.error('Weekly summary error', String(err)));
      });
      log.info('Scheduled weekly executive summary with cron: ' + WEEKLY_SUMMARY_CRON);
    } else {
      log.error('Invalid WEEKLY_SUMMARY_CRON: ' + WEEKLY_SUMMARY_CRON + ' - weekly summary disabled.');
    }
  } else {
    log.info('Weekly executive summary disabled via env.');
  }
}

// ── Graceful shutdown ──────────────────────────────────────────────────────
async function shutdown(signal: string): Promise<void> {
  log.info(`Received ${signal} — shutting down.`);
  try {
    await closePool();
  } catch {
    /* ignore */
  }
  process.exit(0);
}
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

main().catch(async (err) => {
  const msg = err instanceof Error ? err.message : String(err);
  log.error(`Fatal startup error: ${msg}`);
  await closePool().catch(() => undefined);
  process.exit(1);
});
