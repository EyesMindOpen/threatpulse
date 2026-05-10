export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

interface ParsedThreat {
  threatId: string;
  title: string;
  type: string;
  severity: string;
  status?: string;
  description?: string;
  affectedAssets?: string;
  source?: string;
  indicators?: string;
  mitreTactic?: string;
  mitreTechnique?: string;
  cvssScore?: number;
}

function parseCSV(text: string): ParsedThreat[] {
  const lines = (text ?? '').split('\n').filter((l: string) => l?.trim());
  if ((lines?.length ?? 0) < 2) return [];
  const headers = (lines?.[0] ?? '').split(',').map((h: string) => h?.trim()?.toLowerCase()?.replace(/[^a-z0-9]/g, ''));
  const results: ParsedThreat[] = [];
  for (let i = 1; i < (lines?.length ?? 0); i++) {
    const values = (lines?.[i] ?? '').split(',').map((v: string) => v?.trim());
    const obj: any = {};
    (headers ?? []).forEach((h: string, idx: number) => {
      obj[h] = values?.[idx] ?? '';
    });
    const mapped = mapFields(obj);
    if (mapped) results.push(mapped);
  }
  return results;
}

function parseJSON(text: string): ParsedThreat[] {
  try {
    const parsed = JSON.parse(text ?? '{}');
    const items = Array.isArray(parsed) ? parsed : parsed?.threats ?? parsed?.data ?? [];
    return (items ?? []).map((item: any) => mapFields(item)).filter(Boolean) as ParsedThreat[];
  } catch {
    return [];
  }
}

function mapFields(obj: any): ParsedThreat | null {
  if (!obj) return null;
  const threatId = obj?.threatid ?? obj?.threatId ?? obj?.threat_id ?? obj?.id ?? '';
  const title = obj?.title ?? obj?.name ?? '';
  const type = (obj?.type ?? 'CVE')?.toUpperCase?.() ?? 'CVE';
  const severity = (obj?.severity ?? 'MEDIUM')?.toUpperCase?.() ?? 'MEDIUM';
  if (!threatId || !title) return null;
  const validTypes = ['CVE', 'IOC', 'TTP'];
  const validSeverities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  return {
    threatId: String(threatId),
    title: String(title),
    type: validTypes.includes(type) ? type : 'CVE',
    severity: validSeverities.includes(severity) ? severity : 'MEDIUM',
    status: (obj?.status ?? 'NEW')?.toUpperCase?.() ?? 'NEW',
    description: obj?.description ?? null,
    affectedAssets: obj?.affectedassets ?? obj?.affectedAssets ?? obj?.affected_assets ?? null,
    source: obj?.source ?? null,
    indicators: obj?.indicators ?? null,
    mitreTactic: obj?.mitretactic ?? obj?.mitreTactic ?? obj?.mitre_tactic ?? null,
    mitreTechnique: obj?.mitretechnique ?? obj?.mitreTechnique ?? obj?.mitre_technique ?? null,
    cvssScore: obj?.cvssscore ?? obj?.cvssScore ?? obj?.cvss_score ? parseFloat(String(obj?.cvssscore ?? obj?.cvssScore ?? obj?.cvss_score)) : undefined,
  };
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;
    const orgId = user?.organizationId;
    if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const text = await file.text();
    const fileName = file?.name ?? '';
    let threats: ParsedThreat[] = [];

    if (fileName?.endsWith('.csv')) {
      threats = parseCSV(text);
    } else if (fileName?.endsWith('.json')) {
      threats = parseJSON(text);
    } else {
      return NextResponse.json({ error: 'Only CSV and JSON files are supported' }, { status: 400 });
    }

    if ((threats?.length ?? 0) === 0) {
      return NextResponse.json({ error: 'No valid threats found in file' }, { status: 400 });
    }

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const t of threats) {
      try {
        const existing = await prisma.threat.findUnique({ where: { threatId: t.threatId } });
        if (existing) { skipped++; continue; }
        await prisma.threat.create({
          data: {
            threatId: t.threatId,
            title: t.title,
            type: t.type,
            severity: t.severity,
            status: t?.status ?? 'NEW',
            description: t?.description ?? null,
            affectedAssets: t?.affectedAssets ?? null,
            source: t?.source ?? null,
            indicators: t?.indicators ?? null,
            mitreTactic: t?.mitreTactic ?? null,
            mitreTechnique: t?.mitreTechnique ?? null,
            cvssScore: t?.cvssScore ?? null,
            organizationId: orgId,
          },
        });
        created++;
      } catch (err: any) {
        errors.push(`${t.threatId}: ${err?.message ?? 'Unknown error'}`);
      }
    }

    return NextResponse.json({ created, skipped, errors, total: threats?.length ?? 0 });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
