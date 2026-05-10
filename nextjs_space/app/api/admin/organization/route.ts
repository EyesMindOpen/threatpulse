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
    if (!orgId) return NextResponse.json({ error: 'No org' }, { status: 400 });

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: { _count: { select: { users: true, threats: true } } },
    });
    return NextResponse.json({ organization: org });
  } catch (error: any) {
    console.error('Admin org error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN') return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    const orgId = user?.organizationId;
    if (!orgId) return NextResponse.json({ error: 'No org' }, { status: 400 });

    const body = await req.json();
    const { name } = body ?? {};
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

    const org = await prisma.organization.update({ where: { id: orgId }, data: { name } });
    return NextResponse.json({ organization: org });
  } catch (error: any) {
    console.error('Admin update org error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
