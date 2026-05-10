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
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN') return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    const orgId = user?.organizationId;
    if (!orgId) return NextResponse.json({ users: [] });

    const users = await prisma.user.findMany({
      where: { organizationId: orgId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const sUser = session.user as any;
    if (sUser?.role !== 'ADMIN') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json();
    const { userId, role } = body ?? {};
    if (!userId || !role) return NextResponse.json({ error: 'userId and role required' }, { status: 400 });
    if (!['SUPERADMIN', 'ADMIN', 'ANALYST'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });

    const target = await prisma.user.findFirst({ where: { id: userId, organizationId: sUser?.organizationId } });
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const updated = await prisma.user.update({ where: { id: userId }, data: { role } });
    return NextResponse.json({ user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role } });
  } catch (error: any) {
    console.error('Admin update user error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
