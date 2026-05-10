export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;
    const orgId = user?.organizationId;
    if (!orgId) return NextResponse.json({ threats: [] });

    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    const severity = url.searchParams.get('severity');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');

    const where: any = { organizationId: orgId };
    if (type) where.type = type;
    if (severity) where.severity = severity;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { threatId: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const threats = await prisma.threat.findMany({
      where,
      orderBy: { dateAdded: 'desc' },
    });
    return NextResponse.json({ threats });
  } catch (error: any) {
    console.error('GET threats error:', error);
    return NextResponse.json({ error: 'Failed to fetch threats' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;
    const orgId = user?.organizationId;
    if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const body = await req.json();
    const { threatId, title, type, severity, status, description, affectedAssets, source, indicators, mitreTactic, mitreTechnique, cvssScore } = body ?? {};
    if (!threatId || !title || !type || !severity) {
      return NextResponse.json({ error: 'Required fields: threatId, title, type, severity' }, { status: 400 });
    }

    const threat = await prisma.threat.create({
      data: {
        threatId,
        title,
        type,
        severity,
        status: status || 'NEW',
        description: description || null,
        affectedAssets: affectedAssets || null,
        source: source || null,
        indicators: indicators || null,
        mitreTactic: mitreTactic || null,
        mitreTechnique: mitreTechnique || null,
        cvssScore: cvssScore ? parseFloat(cvssScore) : null,
        organizationId: orgId,
      },
    });
    return NextResponse.json({ threat }, { status: 201 });
  } catch (error: any) {
    console.error('POST threat error:', error);
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Threat ID already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create threat' }, { status: 500 });
  }
}
