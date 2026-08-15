/**
 * Weekly Executive Cyber Risk Briefing
 * -------------------------------------
 * Scheduled collector job producing an org-wide leadership email report:
 *  - 7-day threat KPIs with week-over-week trend arrows
 *  - Stacked severity volume chart (rendered via quickchart.io)
 *  - Priority vulnerabilities table (top 5 critical/high)
 *  - Open Jira tickets table (critical/high, non-resolved threats)
 * Sent via Resend to admin/superadmin users.
 *
 * Env:
 *   RESEND_API_KEY             (required to send mail)
 *   SUMMARY_FROM_EMAIL         (default: ThreatPulse Intelligence <noreply@threatpulseintel.com>)
 *   WEEKLY_SUMMARY_WINDOW_DAYS (default 7)
 */
import { pool, resolveOrganizationId } from '../db';
import { createLogger } from '../logger';

const log = createLogger('weekly-summary');
const DAY_MS = 24 * 60 * 60 * 1000;

const FROM_EMAIL =
  process.env.SUMMARY_FROM_EMAIL ||
  'ThreatPulse Intelligence <noreply@threatpulseintel.com>';
const WINDOW_DAYS = Math.max(1, Number(process.env.WEEKLY_SUMMARY_WINDOW_DAYS || 7));

const esc = (s: unknown) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function fmtDate(iso: string | number | Date): string {
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return String(iso);
  }
}

function isoWeek(d = new Date()): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  return (
    1 +
    Math.round(
      ((date.getTime() - firstThursday.getTime()) / DAY_MS -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7,
    )
  );
}

function within(iso: string | Date | null | undefined, since: number, now: number): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= since && t <= now;
}

function chartUrl(config: unknown): string {
  return (
    'https://quickchart.io/chart?c=' +
    encodeURIComponent(JSON.stringify(config)) +
    '&backgroundColor=ffffff'
  );
}

function capSeverity(s: string): 'Critical' | 'High' | 'Medium' | 'Low' {
  const u = String(s || '').toUpperCase();
  if (u === 'CRITICAL') return 'Critical';
  if (u === 'HIGH') return 'High';
  if (u === 'MEDIUM') return 'Medium';
  return 'Low';
}

interface SevBucket {
  label: string;
  Critical: number;
  High: number;
  Medium: number;
  Low: number;
}

function bucketBySeverityDay(
  items: { dateAdded: string | Date; severity: string }[],
  since: number,
  now: number,
): SevBucket[] {
  const startDay = Math.floor(since / DAY_MS);
  const endDay = Math.floor(now / DAY_MS);
  let count = endDay - startDay + 1;
  if (count < 1) count = 1;
  if (count > 14) count = 14;
  const buckets: SevBucket[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date((startDay + i) * DAY_MS);
    buckets.push({
      label: `${d.getUTCMonth() + 1}/${d.getUTCDate()}`,
      Critical: 0,
      High: 0,
      Medium: 0,
      Low: 0,
    });
  }
  const span = endDay - startDay + 1 > count ? Math.ceil((endDay - startDay + 1) / count) : 1;
  for (const it of items) {
    const t = new Date(it.dateAdded).getTime();
    if (t < since || t > now) continue;
    const idx = Math.min(Math.floor((t - since) / DAY_MS / span), count - 1);
    const sev = capSeverity(it.severity);
    (buckets[idx] as SevBucket)[sev] += 1;
  }
  return buckets;
}

function trend(curr: number, prev: number) {
  if (prev === 0)
    return { arrow: curr > 0 ? '▲' : '→', color: curr > 0 ? '#ef4444' : '#64748b', text: curr > 0 ? 'new' : 'flat' };
  const delta = curr - prev;
  const pct = Math.round((Math.abs(delta) / prev) * 100);
  if (delta > 0) return { arrow: '▲', color: '#ef4444', text: `+${pct}%` };
  if (delta < 0) return { arrow: '▼', color: '#10b981', text: `-${pct}%` };
  return { arrow: '→', color: '#64748b', text: 'flat' };
}

interface ThreatRow {
  threatId: string;
  title: string;
  type: string;
  severity: string;
  status: string;
  cvssScore: number | null;
  dateAdded: string;
  lastUpdated: string;
}

interface JiraRow {
  jiraKey: string | null;
  title: string;
  cveId: string | null;
  threatTitle: string;
  threatSeverity: string;
  threatStatus: string;
}

export async function runWeeklyExecutiveSummary(): Promise<{
  ok: boolean;
  delivered: number;
  errors: string[];
  message: string;
}> {
  const errors: string[] = [];
  const now = Date.now();
  const windowMs = WINDOW_DAYS * DAY_MS;
  const since = now - windowMs;
  const priorSince = now - 2 * windowMs;
  const priorUntil = since;

  const organizationId = await resolveOrganizationId();
  if (!organizationId) {
    return { ok: false, delivered: 0, errors: ['No organization found'], message: 'No organization found' };
  }

  // Recent threats (fetch last 500, filter in JS).
  const threatsQ = await pool.query(
    `SELECT "threatId", title, type, severity, status, "cvssScore", "dateAdded", "lastUpdated"
     FROM "Threat"
     WHERE "organizationId" = $1
     ORDER BY "dateAdded" DESC
     LIMIT 500`,
    [organizationId],
  );
  const threats = threatsQ.rows as ThreatRow[];

  const newThreats = threats.filter((t) => within(t.dateAdded, since, now));
  const priorThreats = threats.filter((t) => within(t.dateAdded, priorSince, priorUntil));
  const mitigatedThisWeek = threats.filter(
    (t) => t.status === 'RESOLVED' && within(t.lastUpdated, since, now),
  );
  const priorMitigated = threats.filter(
    (t) => t.status === 'RESOLVED' && within(t.lastUpdated, priorSince, priorUntil),
  );
  const criticalActive = threats.filter((t) => t.severity === 'CRITICAL' && t.status !== 'RESOLVED');

  // Priority vulnerabilities — top 5 critical/high.
  const priorityVulns = newThreats
    .filter((t) => t.type === 'Vulnerability' || /^CVE-/i.test(t.threatId))
    .filter(
      (t) =>
        t.severity === 'CRITICAL' ||
        t.severity === 'HIGH' ||
        (t.cvssScore != null && t.cvssScore >= 7),
    )
    .slice(0, 5);

  // Open Jira tickets linked to critical/high, non-resolved threats.
  const jiraQ = await pool.query(
    `SELECT jt."jiraKey", jt.title, jt."cveId",
            t.title AS "threatTitle", t.severity AS "threatSeverity", t.status AS "threatStatus"
     FROM "JiraTicket" jt
     JOIN "Threat" t ON t.id = jt."threatId"
     WHERE jt."organizationId" = $1
       AND t.severity IN ('CRITICAL', 'HIGH')
       AND t.status <> 'RESOLVED'
     ORDER BY (t.severity = 'CRITICAL') DESC, jt."createdAt" DESC
     LIMIT 10`,
    [organizationId],
  );
  const openTickets = jiraQ.rows as JiraRow[];

  // Recipients — admin/superadmin users with an email.
  const usersQ = await pool.query(
    `SELECT email FROM "User"
     WHERE role IN ('ADMIN', 'SUPERADMIN') AND email IS NOT NULL AND email <> ''`,
  );
  const recipients = (usersQ.rows as { email: string }[]).map((r) => r.email).filter(Boolean);
  if (recipients.length === 0) {
    log.warn('No admin recipients found — skipping send.');
    return { ok: false, delivered: 0, errors: ['No admin recipients'], message: 'No admin recipients found' };
  }

  // --- Chart: stacked severity volume ---
  const sevColors: Record<string, string> = {
    Critical: '#ef4444',
    High: '#f97316',
    Medium: '#eab308',
    Low: '#10b981',
  };
  const sevKeys = ['Critical', 'High', 'Medium', 'Low'];
  const sevBuckets = bucketBySeverityDay(newThreats, since, now);
  const volumeChart = chartUrl({
    type: 'bar',
    data: {
      labels: sevBuckets.map((b) => b.label),
      datasets: sevKeys.map((k) => ({
        label: k,
        data: sevBuckets.map((b) => (b as SevBucket)[k]),
        backgroundColor: sevColors[k],
        borderColor: sevColors[k],
        borderWidth: 0,
        stack: 'sev',
      })),
    },
    options: {
      scales: {
        y: { stacked: true, beginAtZero: true, ticks: { precision: 0, font: { size: 10 } }, grid: { color: '#f1f5f9' } },
        x: { stacked: true, grid: { display: false }, ticks: { font: { size: 10 } } },
      },
      plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } },
    },
  });

  // --- KPIs ---
  const sevColor: Record<string, string> = {
    Critical: '#ef4444',
    High: '#f97316',
    Medium: '#eab308',
    Low: '#10b981',
  };
  const tNew = trend(newThreats.length, priorThreats.length);
  const tMit = trend(mitigatedThisWeek.length, priorMitigated.length);
  const tCrit = trend(
    criticalActive.length,
    threats.filter((t) => t.severity === 'CRITICAL' && within(t.dateAdded, priorSince, priorUntil)).length || 0,
  );

  const weekLabel = `Week ${isoWeek()} • ${fmtDate(since)} – ${fmtDate(now)}`;
  const subject = `ThreatPulse Executive Cyber Risk Briefing — ${weekLabel}`;

  const kpi = (label: string, value: number, tr: { arrow: string; color: string; text: string }, color: string) =>
    `<td style="width:33%;padding:0 5px">` +
    `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;text-align:center">` +
    `<div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.05em">${esc(label)}</div>` +
    `<div style="font-size:24px;font-weight:700;color:${color};margin:3px 0 1px">${esc(value)}</div>` +
    `<div style="font-size:11px;color:${tr.color};font-weight:600">${tr.arrow} ${esc(tr.text)}</div>` +
    `</div></td>`;

  const vulnRows = priorityVulns.length
    ? priorityVulns
        .map((t) => {
          const sev = capSeverity(t.severity);
          return (
            `<tr>` +
            `<td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-family:monospace;font-size:11px;color:#0ea5e9;font-weight:600">${esc(t.threatId || '—')}</td>` +
            `<td style="padding:6px 8px;border-bottom:1px solid #e2e8f0"><span style="display:inline-block;padding:1px 7px;border-radius:5px;font-size:10px;font-weight:600;color:#fff;background:${sevColor[sev]}">${esc(sev)}</span></td>` +
            `<td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-family:monospace;font-size:11px">${t.cvssScore != null ? esc(t.cvssScore) : '—'}</td>` +
            `<td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:11px">${esc((t.title || '—').slice(0, 44))}</td>` +
            `</tr>`
          );
        })
        .join('')
    : `<tr><td colspan="4" style="padding:12px;font-size:11px;color:#94a3b8;text-align:center">No critical/high vulnerabilities this period.</td></tr>`;
  const vulnTable =
    `<table style="width:100%;border-collapse:collapse;margin-top:10px;font-size:11px">` +
    `<thead><tr style="background:#f1f5f9">` +
    `<th style="padding:6px 8px;text-align:left;font-size:10px;color:#475569;border-bottom:2px solid #e2e8f0">CVE</th>` +
    `<th style="padding:6px 8px;text-align:left;font-size:10px;color:#475569;border-bottom:2px solid #e2e8f0">Sev</th>` +
    `<th style="padding:6px 8px;text-align:left;font-size:10px;color:#475569;border-bottom:2px solid #e2e8f0">CVSS</th>` +
    `<th style="padding:6px 8px;text-align:left;font-size:10px;color:#475569;border-bottom:2px solid #e2e8f0">Title</th>` +
    `</tr></thead><tbody>${vulnRows}</tbody></table>`;

  const ticketRows = openTickets.length
    ? openTickets
        .map((t) => {
          const sev = capSeverity(t.threatSeverity);
          const statusColor =
            t.threatStatus === 'NEW' ? '#ef4444' : t.threatStatus === 'INVESTIGATING' ? '#f97316' : '#10b981';
          return (
            `<tr>` +
            `<td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-family:monospace;font-size:11px;color:#0ea5e9;font-weight:600">${esc(t.cveId || t.jiraKey || '—')}</td>` +
            `<td style="padding:6px 8px;border-bottom:1px solid #e2e8f0"><span style="display:inline-block;padding:1px 7px;border-radius:5px;font-size:10px;font-weight:600;color:#fff;background:${sevColor[sev]}">${esc(sev)}</span></td>` +
            `<td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:11px">${esc((t.threatTitle || t.title || '—').slice(0, 40))}</td>` +
            `<td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:11px">${esc(t.jiraKey || t.title || '—')}</td>` +
            `<td style="padding:6px 8px;border-bottom:1px solid #e2e8f0"><span style="display:inline-block;padding:1px 7px;border-radius:5px;font-size:10px;font-weight:600;color:#fff;background:${statusColor}">${esc(t.threatStatus)}</span></td>` +
            `</tr>`
          );
        })
        .join('')
    : `<tr><td colspan="5" style="padding:12px;font-size:11px;color:#94a3b8;text-align:center">No open Jira tickets linked to critical/high vulnerabilities.</td></tr>`;
  const ticketTable =
    `<table style="width:100%;border-collapse:collapse;margin-top:10px;font-size:11px">` +
    `<thead><tr style="background:#f1f5f9">` +
    `<th style="padding:6px 8px;text-align:left;font-size:10px;color:#475569;border-bottom:2px solid #e2e8f0">CVE</th>` +
    `<th style="padding:6px 8px;text-align:left;font-size:10px;color:#475569;border-bottom:2px solid #e2e8f0">Sev</th>` +
    `<th style="padding:6px 8px;text-align:left;font-size:10px;color:#475569;border-bottom:2px solid #e2e8f0">Threat</th>` +
    `<th style="padding:6px 8px;text-align:left;font-size:10px;color:#475569;border-bottom:2px solid #e2e8f0">Jira Ticket</th>` +
    `<th style="padding:6px 8px;text-align:left;font-size:10px;color:#475569;border-bottom:2px solid #e2e8f0">Status</th>` +
    `</tr></thead><tbody>${ticketRows}</tbody></table>`;

  const html =
    `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:auto;color:#1e293b;background:#ffffff">` +
    `<div style="background:linear-gradient(135deg,#0f172a,#0e93b8);padding:22px 26px;border-radius:0 0 12px 12px">` +
    `<div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#7dd3fc;font-weight:600">ThreatPulse • Board &amp; Executive Briefing</div>` +
    `<h1 style="color:#fff;font-size:20px;margin:5px 0 3px">Weekly Cyber Risk Snapshot</h1>` +
    `<div style="color:#cbd5e1;font-size:12px">${esc(weekLabel)}</div>` +
    `</div>` +
    `<div style="padding:0 26px 26px">` +
    `<table style="width:100%;border-collapse:separate;border-spacing:0;margin-top:18px"><tr>` +
    kpi('New Threats', newThreats.length, tNew, '#0ea5e9') +
    kpi('Mitigated', mitigatedThisWeek.length, tMit, '#10b981') +
    kpi('Critical Active', criticalActive.length, tCrit, '#ef4444') +
    `</tr></table>` +
    `<div style="margin-top:18px"><img src="${volumeChart}" alt="threat volume by severity" style="width:100%;max-width:420px;display:block;margin:0 auto;border:1px solid #e2e8f0;border-radius:8px"/></div>` +
    `<h2 style="font-size:13px;color:#0f172a;border-bottom:1px solid #e2e8f0;padding-bottom:5px;margin:22px 0 0">Priority Vulnerabilities</h2>` +
    vulnTable +
    `<h2 style="font-size:13px;color:#0f172a;border-bottom:1px solid #e2e8f0;padding-bottom:5px;margin:22px 0 0">Open Jira Tickets — Critical/High Vulnerabilities</h2>` +
    ticketTable +
    `<div style="margin-top:22px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;text-align:center">` +
    `ThreatPulse Automated Intelligence • Confidential — Prepared for CEO, CISO &amp; Board of Directors` +
    `</div>` +
    `</div></div>`;

  const text = [
    `ThreatPulse Weekly Security Snapshot`,
    weekLabel,
    '',
    `New threats: ${newThreats.length} (${tNew.arrow} ${tNew.text}) | Mitigated: ${mitigatedThisWeek.length} | Critical active: ${criticalActive.length}`,
    '',
    `--- Priority Vulnerabilities (${priorityVulns.length}) ---`,
    ...priorityVulns.map(
      (t) => `• [${capSeverity(t.severity)}] ${t.threatId || 'No CVE'} (CVSS ${t.cvssScore ?? '—'}) — ${(t.title || '').slice(0, 60)}`,
    ),
    '',
    `--- Open Jira Tickets (${openTickets.length}) ---`,
    ...openTickets.map(
      (t) => `• [${capSeverity(t.threatSeverity)}] ${t.cveId || t.jiraKey || 'No CVE'} — ${t.jiraKey || t.title || 'Linked'} [${t.threatStatus}]`,
    ),
    '',
    'Full dashboard: https://threatpulseintel.com/executive-brief',
  ].join('\n');

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, delivered: 0, errors: ['RESEND_API_KEY not set'], message: 'RESEND_API_KEY not set' };
  }

  let delivered = 0;
  for (const email of recipients) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM_EMAIL, to: email, subject, text, html }),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        errors.push(`${email}: ${res.status} ${detail.slice(0, 200)}`);
      } else {
        delivered++;
      }
    } catch (e) {
      errors.push(`${email}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const message = `Sent to ${delivered}/${recipients.length} recipient(s); ${errors.length} error(s).`;
  log.info(message);
  return { ok: errors.length === 0, delivered, errors, message };
}