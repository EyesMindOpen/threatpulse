export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { ConfluenceService } from '@/lib/integrations/confluence-service';

// POST /api/integrations/confluence/test — test credentials
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { baseUrl, email, apiToken } = body;
    if (!baseUrl || !email || !apiToken) {
      return NextResponse.json({ error: 'baseUrl, email, and apiToken are required' }, { status: 400 });
    }

    const confluence = new ConfluenceService({ baseUrl, email, apiToken });
    const result = await confluence.testConnection();

    if (result.ok) {
      return NextResponse.json({ ok: true, user: result.user, userKey: result.userKey });
    } else {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Confluence test error:', error);
    return NextResponse.json({ ok: false, error: error.message || 'Connection test failed' }, { status: 500 });
  }
}
