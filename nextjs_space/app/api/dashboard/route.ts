export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;
    const orgId = user?.organizationId;
    const emptyData = { total: 0, bySeverity: {}, byType: {}, byStatus: {}, bySource: {}, todayCount: 0, trendData: [], recentThreats: [] };
    if (!orgId) return NextResponse.json(emptyData);

    const threats = await prisma.threat.findMany({ where: { organizationId: orgId }, orderBy: { dateAdded: 'desc' } });
    const total = threats?.length ?? 0;

    const bySeverity: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const bySource: Record<string, number> = {};

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let todayCount = 0;

    // Build 14-day trend buckets
    const trendBuckets: Record<string, Record<string, number>> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      trendBuckets[key] = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    }

    (threats ?? []).forEach((t: any) => {
      bySeverity[t?.severity ?? 'UNKNOWN'] = (bySeverity[t?.severity ?? 'UNKNOWN'] ?? 0) + 1;
      byType[t?.type ?? 'UNKNOWN'] = (byType[t?.type ?? 'UNKNOWN'] ?? 0) + 1;
      byStatus[t?.status ?? 'UNKNOWN'] = (byStatus[t?.status ?? 'UNKNOWN'] ?? 0) + 1;

      const src = t?.source || 'Unknown';
      bySource[src] = (bySource[src] ?? 0) + 1;

      const addedDate = new Date(t?.dateAdded);
      if (addedDate >= todayStart) todayCount++;

      const dateKey = `${addedDate.getMonth() + 1}/${addedDate.getDate()}`;
      if (trendBuckets[dateKey]) {
        const sev = t?.severity ?? 'MEDIUM';
        trendBuckets[dateKey][sev] = (trendBuckets[dateKey][sev] ?? 0) + 1;
      }
    });

    const trendData = Object.entries(trendBuckets).map(([date, counts]) => ({
      date,
      ...counts,
    }));

    const recentThreats = (threats ?? []).slice(0, 15);
    return NextResponse.json({ total, bySeverity, byType, byStatus, bySource, todayCount, trendData, recentThreats });
  } catch (error: any) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
