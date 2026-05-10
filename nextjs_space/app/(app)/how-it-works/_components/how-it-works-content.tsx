'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FadeIn, SlideIn } from '@/components/ui/animate';
import {
  Globe, Rss, Shield, Lock, Mail, FileText, Users, Database,
  AlertTriangle, Bug, Crosshair, Activity, RefreshCw, Key, Send, Ticket
} from 'lucide-react';

const intelligenceSources = [
  {
    name: 'CISA KEV',
    type: 'REST API',
    access: 'PUBLIC',
    endpoint: 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
    auth: 'None (public)',
    frequency: 'Every 2 hours',
    dataCollected: 'Known Exploited Vulnerabilities catalog — CVE IDs, vendors, required actions',
    severityLogic: 'Derived from CVSS score (NVD enrichment applied post-ingest)',
  },
  {
    name: 'NVD (NIST)',
    type: 'REST API v2',
    access: 'PUBLIC',
    endpoint: 'https://services.nvd.nist.gov/rest/json/cves/2.0',
    auth: 'None (rate-limited)',
    frequency: 'Every 2 hours',
    dataCollected: 'Full CVE entries with CVSS v2/3.x/4.0 scores, descriptions, CPE configurations',
    severityLogic: 'Derived from CVSS score',
  },
  {
    name: 'H-ISAC',
    type: 'Authenticated API + Email Parsing',
    access: 'AUTH REQUIRED',
    endpoint: 'https://portal.h-isac.org',
    auth: 'HMAC-SHA1 (Access ID + Secret Key)',
    frequency: 'Every 2 hours + email ingest',
    dataCollected: 'Healthcare-sector threat bulletins, IOCs, TLP-tagged advisories',
    severityLogic: 'Parsed from bulletin content',
  },
  {
    name: 'The Hacker News',
    type: 'RSS Feed',
    access: 'PUBLIC',
    endpoint: 'https://thehackernews.com/feeds/posts/default',
    auth: 'None (public)',
    frequency: 'Every 2 hours',
    dataCollected: 'Security news, CVE disclosures, malware/ransomware campaigns',
    severityLogic: 'Keyword-classified',
  },
  {
    name: 'Bleeping Computer',
    type: 'RSS Feed',
    access: 'PUBLIC',
    endpoint: 'https://www.bleepingcomputer.com/feed/',
    auth: 'None (public)',
    frequency: 'Every 2 hours',
    dataCollected: 'Vulnerability disclosures, ransomware activity, breach news',
    severityLogic: 'Keyword-classified',
  },
  {
    name: 'Dark Reading',
    type: 'RSS Feed',
    access: 'PUBLIC',
    endpoint: 'https://www.darkreading.com/rss.xml',
    auth: 'None (public)',
    frequency: 'Every 2 hours',
    dataCollected: 'Security research, industry threat analysis',
    severityLogic: 'Keyword-classified',
  },
  {
    name: 'Krebs on Security',
    type: 'RSS Feed',
    access: 'PUBLIC',
    endpoint: 'https://krebsonsecurity.com/feed/',
    auth: 'None (public)',
    frequency: 'Every 2 hours',
    dataCollected: 'Investigative security journalism, breach reporting',
    severityLogic: 'Keyword-classified',
  },
  {
    name: 'SecurityWeek',
    type: 'RSS Feed',
    access: 'PUBLIC',
    endpoint: 'https://www.securityweek.com/feed/',
    auth: 'None (public)',
    frequency: 'Every 2 hours',
    dataCollected: 'Enterprise security news and vulnerability coverage',
    severityLogic: 'Keyword-classified',
  },
  {
    name: 'SANS ISC',
    type: 'RSS Feed',
    access: 'PUBLIC',
    endpoint: 'https://isc.sans.edu/rssfeed_full.xml',
    auth: 'None (public)',
    frequency: 'Every 2 hours',
    dataCollected: 'Internet storm center diaries, active threat analysis',
    severityLogic: 'Keyword-classified',
  },
  {
    name: 'Rapid7',
    type: 'RSS Feed',
    access: 'PUBLIC',
    endpoint: 'https://www.rapid7.com/blog/feed/',
    auth: 'None (public)',
    frequency: 'Every 2 hours',
    dataCollected: 'Vulnerability research, exploit development updates',
    severityLogic: 'Keyword-classified',
  },
  {
    name: 'Microsoft MSRC',
    type: 'RSS Feed',
    access: 'PUBLIC',
    endpoint: 'https://msrc.microsoft.com/blog/feed',
    auth: 'None (public)',
    frequency: 'Every 2 hours',
    dataCollected: 'Microsoft security advisories and patch guidance',
    severityLogic: 'Keyword-classified',
  },
  {
    name: 'US-CERT / CISA Advisories',
    type: 'RSS Feed',
    access: 'PUBLIC',
    endpoint: 'https://www.cisa.gov/cybersecurity-advisories/all.xml',
    auth: 'None (public)',
    frequency: 'Every 2 hours',
    dataCollected: 'US government cybersecurity advisories and alerts',
    severityLogic: 'Keyword-classified',
  },
  {
    name: 'UK NCSC',
    type: 'RSS Feed',
    access: 'PUBLIC',
    endpoint: 'https://www.ncsc.gov.uk/api/1/services/v1/all-rss-feed.xml',
    auth: 'None (public)',
    frequency: 'Every 2 hours',
    dataCollected: 'UK national cyber security centre advisories',
    severityLogic: 'Keyword-classified',
  },
  {
    name: 'Exploit-DB',
    type: 'RSS Feed',
    access: 'PUBLIC',
    endpoint: 'https://www.exploit-db.com/rss.xml',
    auth: 'None (public)',
    frequency: 'Every 2 hours',
    dataCollected: 'Public exploit disclosures and proof-of-concept code',
    severityLogic: 'Elevated to High by default',
  },
  {
    name: 'Packet Storm',
    type: 'RSS Feed',
    access: 'PUBLIC',
    endpoint: 'https://rss.packetstormsecurity.com/files/',
    auth: 'None (public)',
    frequency: 'Every 2 hours',
    dataCollected: 'Security tools, advisories, and exploit archives',
    severityLogic: 'Keyword-classified',
  },
  {
    name: 'CrowdStrike',
    type: 'RSS Feed',
    access: 'PUBLIC',
    endpoint: 'https://www.crowdstrike.com/blog/feed/',
    auth: 'None (public)',
    frequency: 'Every 2 hours',
    dataCollected: 'Threat intelligence research, adversary tracking',
    severityLogic: 'Keyword-classified',
  },
  {
    name: 'Mandiant',
    type: 'RSS Feed',
    access: 'PUBLIC',
    endpoint: 'https://www.mandiant.com/resources/blog/rss.xml',
    auth: 'None (public)',
    frequency: 'Every 2 hours',
    dataCollected: 'APT research, nation-state threat tracking',
    severityLogic: 'Keyword-classified',
  },
  {
    name: 'Infosecurity Magazine',
    type: 'RSS Feed',
    access: 'PUBLIC',
    endpoint: 'https://www.infosecurity-magazine.com/rss/news/',
    auth: 'None (public)',
    frequency: 'Every 2 hours',
    dataCollected: 'Industry news and vulnerability coverage',
    severityLogic: 'Keyword-classified',
  },
];

const roles = [
  {
    name: 'SUPERADMIN',
    description: "Full platform control — manages organizations, users, integrations, and all data. Can view and modify any org's records.",
    permissions: [
      'Create/edit/delete organizations',
      'Enable/disable integrations per org',
      'Manage user roles globally',
      'Assign org codes and nav permissions',
      'View all threats across all orgs',
      'Run admin data tools (backfill, enrichment)',
    ],
  },
  {
    name: 'ADMIN',
    description: 'Organization-level administrator. Manages org members, SLA configurations, and can trigger enrichment and collection tasks.',
    permissions: [
      'Invite and manage org users',
      'Update any threat status within org',
      'Access Admin dashboard and reports',
      'Configure SLA targets per severity',
      'Trigger manual threat collection',
      'Enable/disable integrations (Jira, Cybellum) for their org',
    ],
  },
  {
    name: 'USER',
    description: 'Standard analyst. Can review threats, update statuses, add notes, and use all read/search features within their organization.',
    permissions: [
      'View all threats for their org',
      'Add analyst notes and assign ownership',
      'Search CVE database and use CPE lookup',
      'Mark threats as Reviewing / Mitigated / Resolved',
      'Export threat advisories and create Jira tickets',
      'Receive email digests based on preferences',
    ],
  },
];

export default function HowItWorksContent() {
  return (
    <div className="p-6 space-y-8 max-w-[1100px] mx-auto">
      <FadeIn>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Platform Documentation</h1>
            <p className="text-sm text-muted-foreground">How ThreatPulse collects, processes, and integrates threat intelligence</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {['18 SOURCES', 'JIRA INTEGRATION', 'CYBELLUM INTEGRATION', 'H-ISAC MEMBER FEED', 'NVD / CISA KEV', 'ROLE-BASED ACCESS'].map(tag => (
            <Badge key={tag} className="bg-primary/10 text-primary border-primary/20 text-[10px] font-mono">{tag}</Badge>
          ))}
        </div>
      </FadeIn>

      {/* Data Collection & Deduplication */}
      <SlideIn>
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-primary" />
              <span className="text-primary">Data Collection &amp; Deduplication</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              ThreatPulse runs an automated collection job every 2 hours via a scheduled backend task. It fetches from all 18 sources in parallel, normalizes each record into a common schema, and inserts only new entries — deduplicated by title, CVE ID, and source. If the same CVE or title is reported by a different source, it is stored as a separate record to preserve source attribution.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-muted/30 rounded-lg p-3 border border-border/30">
                <p className="text-sm font-semibold">18 Live Sources</p>
                <p className="text-xs text-muted-foreground">APIs, RSS feeds, authenticated portals</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 border border-border/30">
                <p className="text-sm font-semibold">Deduplication</p>
                <p className="text-xs text-muted-foreground">Title + CVE ID + Source matching — same CVE from a different source is stored separately</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 border border-border/30">
                <p className="text-sm font-semibold">NVD Enrichment</p>
                <p className="text-xs text-muted-foreground">CVSS scores and CPE data auto-fetched</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              For every new CVE that lacks CVSS data (from RSS sources), the system automatically queries the NVD API to backfill the score, version, affected products, and description. Severity is then recalculated: ≥9.0 → Critical, ≥7.0 → High, ≥4.0 → Medium, {'<'}4.0 → Low.
            </p>
          </CardContent>
        </Card>
      </SlideIn>

      {/* Intelligence Sources */}
      <SlideIn delay={0.05}>
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <span className="text-primary">Intelligence Sources</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-sm text-muted-foreground mb-4">All sources are fetched server-side. No credentials are sent to the browser.</p>
            <div className="space-y-4">
              {intelligenceSources.map((source, i) => (
                <div key={i} className="border border-border/30 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/20">
                    <span className="font-semibold text-sm">{source.name}</span>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {source.type.includes('RSS') ? <Rss className="w-3 h-3 mr-1" /> : <Globe className="w-3 h-3 mr-1" />}
                        {source.type}
                      </Badge>
                      <Badge className={`text-[10px] font-mono ${
                        source.access === 'PUBLIC' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                      }`}>
                        {source.access}
                      </Badge>
                    </div>
                  </div>
                  <div className="px-4 py-2 space-y-1.5 text-xs">
                    <SourceRow label="ENDPOINT" value={source.endpoint} mono />
                    <SourceRow label="AUTH" value={source.auth} />
                    <SourceRow label="FREQUENCY" value={source.frequency} />
                    <SourceRow label="DATA COLLECTED" value={source.dataCollected} />
                    <SourceRow label="SEVERITY LOGIC" value={source.severityLogic} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </SlideIn>

      {/* Jira Integration */}
      <SlideIn delay={0.1}>
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Ticket className="w-4 h-4 text-primary" />
              <span className="text-primary">Jira Integration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">ThreatPulse connects to your Jira instance using the Jira REST API v3 via Basic authentication (email + API token). The integration is configured once at the platform level using environment secrets and is available to all users within an organization if enabled.</p>
            <div className="space-y-1.5 text-xs border border-border/30 rounded-lg p-4">
              <SourceRow label="API VERSION" value="Jira REST API v3" />
              <SourceRow label="AUTH METHOD" value="HTTP Basic — Base64(email:api_token)" />
              <SourceRow label="CREDENTIALS" value="JIRA_URL, JIRA_EMAIL, JIRA_API_KEY stored as encrypted environment secrets" />
              <SourceRow label="BASE URL" value="Origin extracted from JIRA_URL (e.g. https://company.atlassian.net)" />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Search Tickets — GET /rest/api/3/search/jql</p>
                <p className="text-xs text-muted-foreground mt-1">When a user clicks the Jira button on a CVE or threat, ThreatPulse queries existing tickets using JQL. It searches by CVE ID and up to 3 keywords extracted from the threat title. Results show ticket key, summary, status, priority, assignee, and a direct link.</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Create Ticket — POST /rest/api/3/issue</p>
                <p className="text-xs text-muted-foreground mt-1">A new Bug-type issue is created with a structured Atlassian Document Format (ADF) description mirroring the threat advisory template: Classification, Identifiers (CVE, CVSS), Affected Products, and Description. Priority is mapped from ThreatPulse severity.</p>
              </div>
            </div>
            <div className="bg-muted/20 rounded-lg p-4 border border-border/30">
              <p className="text-xs font-semibold mb-2">Required Jira Permissions</p>
              <div className="space-y-1">
                {['Browse Projects — to search and view tickets', 'Create Issues — to file new security tickets', 'Edit Issues (optional) — not currently used but recommended', 'No admin, delete, or user-management permissions required'].map((perm, i) => (
                  <p key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    {perm}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </SlideIn>

      {/* Cybellum Integration */}
      <SlideIn delay={0.15}>
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              <span className="text-primary">Cybellum Integration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Cybellum is a product security platform for medical devices and embedded systems. ThreatPulse integrates with the Cybellum API to cross-reference threat intelligence against your organization&apos;s registered products and Software Bill of Materials (SBOM), identifying which products may be exposed to a given CVE.</p>
            <div className="space-y-1.5 text-xs border border-border/30 rounded-lg p-4">
              <SourceRow label="AUTH METHOD" value="API Key in request headers (X-API-Key)" />
              <SourceRow label="CREDENTIALS" value="CYBELLUM_BASE_URL and CYBELLUM_API_KEY stored as encrypted environment secrets" />
              <SourceRow label="SCOPE" value="Read-only access to product catalog and SBOM data" />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product Catalog Fetch</p>
                <p className="text-xs text-muted-foreground mt-1">Retrieves all registered products and their version history from the Cybellum platform. ThreatPulse then matches CVE-affected products against the product name list using a keyword comparison against the threat title, description, and affected_products field.</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">SBOM Package Search</p>
                <p className="text-xs text-muted-foreground mt-1">For a given CVE, ThreatPulse extracts a keyword from the threat title (filtering stop words) and searches each registered product&apos;s SBOM for matching packages. Products with a package name match are surfaced as affected in the UI.</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">CVE Vulnerability Lookup</p>
                <p className="text-xs text-muted-foreground mt-1">ThreatPulse can also query the Cybellum API directly for CVE-specific vulnerability data per product version, returning Cybellum&apos;s own risk score and affected component details.</p>
              </div>
            </div>
            <div className="bg-muted/20 rounded-lg p-4 border border-border/30">
              <p className="text-xs font-semibold mb-2">Data Flow</p>
              <div className="flex flex-wrap gap-2 items-center">
                {['CVE Selected', 'Fetch Products', 'Name Match', 'SBOM Search (batched)', 'Return Matching Products'].map((step, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <span className="text-primary">→</span>}
                    <Badge variant="outline" className="text-[10px] font-mono">{step}</Badge>
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </SlideIn>

      {/* H-ISAC Authenticated Feed */}
      <SlideIn delay={0.2}>
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="w-4 h-4 text-orange-500" />
              <span className="text-orange-500">H-ISAC Authenticated Feed</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">ThreatPulse holds an H-ISAC member integration that authenticates using HMAC-SHA1 signatures — the same mechanism used by the H-ISAC portal API. This provides access to healthcare-sector specific threat intelligence not available in public feeds, including TLP-tagged bulletins, IOCs, and health sector advisories.</p>
            <div className="space-y-1.5 text-xs border border-border/30 rounded-lg p-4">
              <SourceRow label="AUTH METHOD" value="HMAC-SHA1 signature with expiry timestamp" />
              <SourceRow label="CREDENTIALS" value="HISAC_ACCESS_ID and HISAC_SECRET_KEY stored as encrypted environment secrets" />
              <SourceRow label="SCOPE" value="Read-only — threat bulletins and alerts for H-ISAC member organizations" />
              <SourceRow label="ADDITIONAL CHANNEL" value="Email ingest — H-ISAC bulletins received via email are parsed and imported automatically" />
            </div>
          </CardContent>
        </Card>
      </SlideIn>

      {/* Email Notifications */}
      <SlideIn delay={0.25}>
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              <span className="text-primary">Email Notifications (Brevo)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Outbound email is sent via the Brevo (formerly Sendinblue) transactional email API. Emails are triggered by the threat collection job and can be configured per-user as immediate, daily, or weekly digests.</p>
            <div className="space-y-1.5 text-xs border border-border/30 rounded-lg p-4">
              <SourceRow label="PROVIDER" value="Brevo Transactional Email API" />
              <SourceRow label="SENDER" value="alerts@threatpulseintel.com (ThreatPulse Alerts)" />
              <SourceRow label="AUTH" value="BREVO_API_KEY stored as encrypted environment secret" />
              <SourceRow label="FREQUENCY OPTIONS" value="Immediate (on collection), Daily digest, Weekly digest, Never" />
              <SourceRow label="FILTERING" value="Users can opt in to Critical/High only — no Medium or Low alerts sent" />
            </div>
            <p className="text-xs text-muted-foreground">Each digest includes a severity summary table, a list of up to 15 threats (with overflow count), and a direct link back to the ThreatPulse platform. No threat content is stored in email — the email links back to the live platform for full details.</p>
          </CardContent>
        </Card>
      </SlideIn>

      {/* Access Control & Roles */}
      <SlideIn delay={0.3}>
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-primary">Access Control &amp; Roles</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">ThreatPulse uses row-level security (RLS) enforced at the database layer. Every entity read, write, and delete is gated by the authenticated user&apos;s role and org_id. No client-side filtering is relied upon for security decisions.</p>
            <div className="space-y-4">
              {roles.map((role, i) => (
                <div key={i} className="border border-border/30 rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <Badge className={`text-[10px] font-mono flex-shrink-0 ${
                      role.name === 'SUPERADMIN' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                      role.name === 'ADMIN' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                      'bg-blue-500/10 text-blue-500 border-blue-500/20'
                    }`}>{role.name}</Badge>
                    <span className="text-xs text-muted-foreground">{role.description}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mt-2">
                    {role.permissions.map((perm, j) => (
                      <p key={j} className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                        {perm}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-muted/20 rounded-lg p-4 border border-border/30">
              <p className="text-xs font-semibold mb-1">Multi-Tenancy Model</p>
              <p className="text-xs text-muted-foreground">Each user belongs to exactly one organization (org_id). Threat records are either global (visible to all orgs) or org-scoped. Org-specific responses, notes, and status updates are fully isolated — one organization cannot read or modify another&apos;s response data. The superadmin role bypasses org scoping for platform management purposes only.</p>
            </div>
          </CardContent>
        </Card>
      </SlideIn>

      {/* Credential & Secret Management */}
      <SlideIn delay={0.35}>
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" />
              <span className="text-primary">Credential &amp; Secret Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">All API keys, tokens, and credentials are stored as encrypted environment secrets on the server. They are never sent to the browser, never logged, and never included in any client-side code or response payloads.</p>
            <div className="space-y-3">
              {[
                { keys: 'BREVO_API_KEY', desc: 'Transactional email delivery' },
                { keys: 'JIRA_URL + JIRA_EMAIL + JIRA_API_KEY', desc: 'Jira REST API authentication' },
                { keys: 'CYBELLUM_BASE_URL + CYBELLUM_API_KEY', desc: 'Cybellum product/SBOM API access' },
                { keys: 'HISAC_ACCESS_ID + HISAC_SECRET_KEY', desc: 'H-ISAC HMAC-SHA1 authenticated feed' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="font-mono font-semibold">{item.keys}</p>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
              <p className="text-xs text-emerald-500">All backend functions validate the authenticated user&apos;s session before any API call is made. Admin-level operations (enrichment, collection triggers, role changes) require role === &apos;admin&apos; or role === &apos;superadmin&apos;.</p>
            </div>
          </CardContent>
        </Card>
      </SlideIn>

      {/* Threat Advisory Export */}
      <SlideIn delay={0.4}>
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" />
              <span className="text-primary">Threat Advisory Export</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Every threat and CVE record can be exported as a structured intelligence advisory. The same template is used across all export channels to ensure consistency.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-muted/20 rounded-lg p-3 border border-border/30">
                <p className="text-sm font-semibold flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> Email Export</p>
                <p className="text-xs text-muted-foreground">Opens mailto: with pre-formatted subject and advisory body</p>
              </div>
              <div className="bg-muted/20 rounded-lg p-3 border border-border/30">
                <p className="text-sm font-semibold flex items-center gap-2"><Send className="w-3.5 h-3.5" /> Teams Export</p>
                <p className="text-xs text-muted-foreground">Copies advisory text to clipboard, opens Microsoft Teams</p>
              </div>
              <div className="bg-muted/20 rounded-lg p-3 border border-border/30">
                <p className="text-sm font-semibold flex items-center gap-2"><Ticket className="w-3.5 h-3.5" /> Jira Ticket</p>
                <p className="text-xs text-muted-foreground">Creates a Bug issue with ADF-formatted description matching the advisory</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">The advisory includes: Title, Severity, Threat Type, Source, Date Published, CVE ID, CVSS Score + Version, Source URL, Jira Ticket URL (if created), Affected Products, CPE entries, and full Description. A &quot;Preview&quot; toggle in the export panel shows the exact formatted text before sending.</p>
          </CardContent>
        </Card>
      </SlideIn>
    </div>
  );
}

function SourceRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-4 py-1.5 border-b border-border/10 last:border-0">
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-28 flex-shrink-0 pt-0.5">{label}</span>
      <span className={`text-xs text-foreground/80 ${mono ? 'font-mono break-all' : ''}`}>{value}</span>
    </div>
  );
}
