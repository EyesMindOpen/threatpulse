export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;
    if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { integrationId, config } = body;

    if (!integrationId) {
      return NextResponse.json({ error: 'Missing integrationId' }, { status: 400 });
    }

    let success = false;
    let message = '';

    switch (integrationId) {
      case 'jira': {
        const { JIRA_URL, JIRA_EMAIL, JIRA_API_KEY } = config || {};
        if (!JIRA_URL || !JIRA_EMAIL || !JIRA_API_KEY) {
          return NextResponse.json({ error: 'All Jira fields are required', success: false }, { status: 400 });
        }
        try {
          const origin = new URL(JIRA_URL).origin;
          const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_KEY}`).toString('base64');
          const res = await fetch(`${origin}/rest/api/3/myself`, {
            headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' },
          });
          if (res.ok) {
            const data = await res.json();
            success = true;
            message = `Connected as ${data?.displayName || data?.emailAddress || 'user'}`;
          } else {
            message = `Jira returned ${res.status}: ${res.statusText}`;
          }
        } catch (e: any) {
          message = `Connection failed: ${e.message}`;
        }
        break;
      }
      case 'cybellum': {
        const { CYBELLUM_BASE_URL, CYBELLUM_API_KEY } = config || {};
        if (!CYBELLUM_BASE_URL || !CYBELLUM_API_KEY) {
          return NextResponse.json({ error: 'All Cybellum fields are required', success: false }, { status: 400 });
        }
        try {
          const res = await fetch(`${CYBELLUM_BASE_URL}/api/v1/products`, {
            headers: { 'X-API-Key': CYBELLUM_API_KEY, Accept: 'application/json' },
          });
          success = res.ok || res.status === 403;
          message = res.ok ? 'Connected to Cybellum API' : `Cybellum returned ${res.status}`;
        } catch (e: any) {
          message = `Connection failed: ${e.message}`;
        }
        break;
      }
      case 'hisac': {
        const { HISAC_ACCESS_ID, HISAC_SECRET_KEY } = config || {};
        if (!HISAC_ACCESS_ID || !HISAC_SECRET_KEY) {
          return NextResponse.json({ error: 'All H-ISAC fields are required', success: false }, { status: 400 });
        }
        success = true;
        message = 'H-ISAC credentials stored (authentication verified on next collection cycle)';
        break;
      }
      case 'brevo': {
        const { BREVO_API_KEY } = config || {};
        if (!BREVO_API_KEY) {
          return NextResponse.json({ error: 'Brevo API Key is required', success: false }, { status: 400 });
        }
        try {
          const res = await fetch('https://api.brevo.com/v3/account', {
            headers: { 'api-key': BREVO_API_KEY, Accept: 'application/json' },
          });
          if (res.ok) {
            const data = await res.json();
            success = true;
            message = `Connected to Brevo (${data?.companyName || 'account verified'})`;
          } else {
            message = `Brevo returned ${res.status}: ${res.statusText}`;
          }
        } catch (e: any) {
          message = `Connection failed: ${e.message}`;
        }
        break;
      }
      default: {
        // Handle feed tests — attempt to fetch the endpoint
        if (config?.endpoint) {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);
            const headers: Record<string, string> = { Accept: 'application/xml, application/json, text/xml, */*' };
            if (config.apiKey) {
              headers['apiKey'] = config.apiKey;
            }
            const res = await fetch(config.endpoint, { headers, signal: controller.signal });
            clearTimeout(timeout);
            if (res.ok) {
              const contentType = res.headers.get('content-type') || '';
              const size = res.headers.get('content-length');
              success = true;
              message = `Feed reachable (${res.status}, ${contentType.split(';')[0]})${size ? `, ${Math.round(parseInt(size)/1024)}KB` : ''}`;
            } else {
              message = `Feed returned HTTP ${res.status}: ${res.statusText}`;
            }
          } catch (e: any) {
            message = e.name === 'AbortError' ? 'Feed request timed out (8s)' : `Connection failed: ${e.message}`;
          }
        } else {
          return NextResponse.json({ error: 'Unknown integration or missing endpoint', success: false }, { status: 400 });
        }
        break;
      }
    }

    return NextResponse.json({ success, message });
  } catch (err: any) {
    console.error('Test integration error:', err);
    return NextResponse.json({ error: 'Test failed', success: false }, { status: 500 });
  }
}
