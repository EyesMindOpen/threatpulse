export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

// PATCH /api/integrations/confluence/[id] — update (enable/disable, edit fields)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const connection = await prisma.confluenceConnection.findUnique({ where: { id: params.id } });
    if (!connection || connection.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const update: any = {};
    if (body.displayName !== undefined) update.displayName = body.displayName || null;
    if (body.baseUrl !== undefined) update.baseUrl = body.baseUrl.replace(/\/$/, "");
    if (body.email !== undefined) update.email = body.email;
    if (body.apiToken !== undefined) update.apiToken = body.apiToken;
    if (body.enabled !== undefined) update.enabled = body.enabled;
    if (body.lastTestStatus !== undefined) {
      update.lastTestStatus = body.lastTestStatus;
      update.lastTestedAt = new Date();
    }
    if (body.lastError !== undefined) update.lastError = body.lastError || null;
    if (body.confluenceUserKey !== undefined) update.confluenceUserKey = body.confluenceUserKey || null;

    const updated = await prisma.confluenceConnection.update({
      where: { id: params.id },
      data: update,
    });

    return NextResponse.json({ connection: { ...updated, apiToken: '••••••••' } });
  } catch (error: any) {
    console.error('Confluence update error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update connection' }, { status: 500 });
  }
}

// DELETE /api/integrations/confluence/[id] — remove a connection
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const connection = await prisma.confluenceConnection.findUnique({ where: { id: params.id } });
    if (!connection || connection.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.confluenceConnection.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Confluence delete error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete connection' }, { status: 500 });
  }
}
