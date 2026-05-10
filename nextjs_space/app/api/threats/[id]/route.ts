export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;
    const threat = await prisma.threat.findFirst({
      where: { id: params?.id, organizationId: user?.organizationId },
    });
    if (!threat) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ threat });
  } catch (error: any) {
    console.error('GET threat error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;
    const existing = await prisma.threat.findFirst({
      where: { id: params?.id, organizationId: user?.organizationId },
    });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const body = await req.json();
    const { status, severity, description, affectedAssets } = body ?? {};
    const threat = await prisma.threat.update({
      where: { id: params?.id },
      data: {
        ...(status ? { status } : {}),
        ...(severity ? { severity } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(affectedAssets !== undefined ? { affectedAssets } : {}),
      },
    });
    return NextResponse.json({ threat });
  } catch (error: any) {
    console.error('PATCH threat error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN') return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    const existing = await prisma.threat.findFirst({
      where: { id: params?.id, organizationId: user?.organizationId },
    });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.threat.delete({ where: { id: params?.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE threat error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
