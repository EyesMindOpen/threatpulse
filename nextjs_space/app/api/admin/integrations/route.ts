export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;
    if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    const orgId = user.organizationId;
    if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const configs = await prisma.integrationConfig.findMany({
      where: { organizationId: orgId },
      select: { integrationId: true, enabled: true, configData: true, updatedAt: true },
    });
    return NextResponse.json({ configs });
  } catch (err: any) {
    console.error('Get integrations error:', err);
    return NextResponse.json({ error: 'Failed to load integrations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;
    if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    const orgId = user.organizationId;
    if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const body = await req.json();
    const { integrationId, config, enabled } = body;
    if (!integrationId) {
      return NextResponse.json({ error: 'Missing integrationId' }, { status: 400 });
    }

    const configJson = config ? JSON.stringify(config) : '{}';
    const isEnabled = typeof enabled === 'boolean' ? enabled : true;

    const saved = await prisma.integrationConfig.upsert({
      where: {
        organizationId_integrationId: { organizationId: orgId, integrationId },
      },
      update: {
        ...(config ? { configData: configJson } : {}),
        enabled: isEnabled,
      },
      create: { organizationId: orgId, integrationId, configData: configJson, enabled: isEnabled },
    });

    return NextResponse.json({ success: true, id: saved.id, enabled: saved.enabled });
  } catch (err: any) {
    console.error('Save integration error:', err);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;
    if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    const orgId = user.organizationId;
    if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const body = await req.json();
    const { integrationId, enabled } = body;
    if (!integrationId || typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Missing integrationId or enabled flag' }, { status: 400 });
    }

    const saved = await prisma.integrationConfig.upsert({
      where: {
        organizationId_integrationId: { organizationId: orgId, integrationId },
      },
      update: { enabled },
      create: { organizationId: orgId, integrationId, configData: '{}', enabled },
    });

    return NextResponse.json({ success: true, enabled: saved.enabled });
  } catch (err: any) {
    console.error('Toggle integration error:', err);
    return NextResponse.json({ error: 'Failed to toggle' }, { status: 500 });
  }
}