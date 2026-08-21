/**
 * Confluence Cloud / Server REST API integration service
 * Docs: https://developer.atlassian.com/cloud/confluence/rest/
 */

export interface ConfluenceConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
}

export interface ConfluenceTestResult {
  ok: boolean;
  user?: string;
  userKey?: string;
  error?: string;
}

export class ConfluenceService {
  private config: ConfluenceConfig;

  constructor(config: ConfluenceConfig) {
    this.config = config;
  }

  async testConnection(): Promise<ConfluenceTestResult> {
    const authHeader = 'Basic ' + Buffer.from(`${this.config.email}:${this.config.apiToken}`).toString('base64');
    const baseUrl = this.config.baseUrl.replace(/\/$/, "");
    const isCloud = baseUrl.includes('atlassian.net');
    const paths = isCloud
      ? ['/wiki/rest/api/user/current']
      : ['/rest/api/user/current', '/wiki/rest/api/user/current'];

    let lastError = "";
    for (const path of paths) {
      try {
        const res = await fetch(`${baseUrl}${path}`, {
          method: "GET",
          headers: {
            Authorization: authHeader,
            Accept: "application/json",
            'User-Agent': 'ThreatPulse/1.0',
          },
        });
        if (res.ok) {
          const profile = await res.json();
          return {
            ok: true,
            user: profile.displayName || profile.fullName || profile.email || this.config.email,
            userKey: profile.accountId || profile.userKey || profile.username || null,
          };
        }
        if (res.status === 401 || res.status === 403) {
          return { ok: false, error: 'Authentication failed — check email and API token' };
        }
        if (res.status === 404) {
          lastError = `Endpoint not found (${path})`;
          continue;
        }
        lastError = `Confluence returned ${res.status}`;
      } catch (e: any) {
        lastError = e.message || 'Network error reaching Confluence';
      }
    }
    return { ok: false, error: lastError || 'Could not verify credentials' };
  }
}
