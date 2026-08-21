export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET /api/integrations/confluence — list the current user's connections
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const connections = await prisma.confluenceConnection.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    const masked = connections.map((c) => ({
      ...c,
      apiToken: c.apiToken ? '••••••••' : '',
    }));

    return NextResponse.json({ connections: masked });
  } catch (error: any) {
    console.error('Confluence list error:', error);
    return NextResponse.json({ error: error.message || 'Failed to list connections' }, { status: 500 });
  }
}

// POST /api/integrations/confluence — create a new connection for the current user
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { displayName, baseUrl, email, apiToken, enabled } = body;
    if (!baseUrl || !email || !apiToken) {
      return NextResponse.json({ error: 'baseUrl, email, and apiToken are required' }, { status: 400 });
    }

    const connection = await prisma.confluenceConnection.create({
      data: {
        userId: user.id,
        displayName: displayName || null,
        baseUrl: baseUrl.replace(/\/$/, ""),
        email,
        apiToken,
        enabled: enabled !== false,
      },
    });

    return NextResponse.json({
      connection: { ...connection, apiToken: '••••••••' },
    });
  } catch (error: any) {
    console.error('Confluence create error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create connection' }, { status: 500 });
  }
}
