'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FadeIn, SlideIn } from '@/components/ui/animate';
import {
  Plug, Ticket, Database, Lock, Mail, CheckCircle, XCircle, Eye, EyeOff,
  Save, TestTube, Rss, Globe, Shield, Zap, ToggleLeft, ToggleRight,
  RefreshCw, ChevronDown, ChevronRight, ExternalLink, Clock, Search
} from 'lucide-react';
import { toast } from 'sonner';

/* ─── Feed Sources (18) ─── */
const feedSources = [
  { id: 'feed:cisa-kev', name: 'CISA KEV', type: 'REST API', access: 'PUBLIC', endpoint: 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json', frequency: '2h', category: 'vulnerability', description: 'Known Exploited Vulnerabilities catalog' },
  { id: 'feed:nvd', name: 'NVD (NIST)', type: 'REST API v2', access: 'PUBLIC', endpoint: 'https://services.nvd.nist.gov/rest/json/cves/2.0', frequency: '2h', category: 'vulnerability', description: 'Full CVE entries with CVSS scores' },
  { id: 'feed:hisac', name: 'H-ISAC', type: 'Authenticated API', access: 'AUTH', endpoint: 'https://portal.h-isac.org', frequency: '2h', category: 'healthcare', description: 'Healthcare-sector threat bulletins and IOCs', authRequired: true },
  { id: 'feed:hackernews', name: 'The Hacker News', type: 'RSS Feed', access: 'PUBLIC', endpoint: 'https://thehackernews.com/feeds/posts/default', frequency: '2h', category: 'news', description: 'Security news, CVE disclosures, malware campaigns' },
  { id: 'feed:bleeping', name: 'Bleeping Computer', type: 'RSS Feed', access: 'PUBLIC', endpoint: 'https://www.bleepingcomputer.com/feed/', frequency: '2h', category: 'news', description: 'Vulnerability disclosures, ransomware activity' },
  { id: 'feed:darkreading', name: 'Dark Reading', type: 'RSS Feed', access: 'PUBLIC', endpoint: 'https://www.darkreading.com/rss.xml', frequency: '2h', category: 'news', description: 'Security research, industry threat analysis' },
  { id: 'feed:krebs', name: 'Krebs on Security', type: 'RSS Feed', access: 'PUBLIC', endpoint: 'https://krebsonsecurity.com/feed/', frequency: '2h', category: 'news', description: 'Investigative security journalism' },
  { id: 'feed:securityweek', name: 'SecurityWeek', type: 'RSS Feed', access: 'PUBLIC', endpoint: 'https://www.securityweek.com/feed/', frequency: '2h', category: 'news', description: 'Enterprise security news and vulnerability coverage' },
  { id: 'feed:sans-isc', name: 'SANS ISC', type: 'RSS Feed', access: 'PUBLIC', endpoint: 'https://isc.sans.edu/rssfeed_full.xml', frequency: '2h', category: 'research', description: 'Internet storm center diaries, active threat analysis' },
  { id: 'feed:rapid7', name: 'Rapid7', type: 'RSS Feed', access: 'PUBLIC', endpoint: 'https://www.rapid7.com/blog/feed/', frequency: '2h', category: 'research', description: 'Vulnerability research, exploit development' },
  { id: 'feed:msrc', name: 'Microsoft MSRC', type: 'RSS Feed', access: 'PUBLIC', endpoint: 'https://msrc.microsoft.com/blog/feed', frequency: '2h', category: 'vendor', description: 'Microsoft security advisories and patch guidance' },
  { id: 'feed:uscert', name: 'US-CERT / CISA', type: 'RSS Feed', access: 'PUBLIC', endpoint: 'https://www.cisa.gov/cybersecurity-advisories/all.xml', frequency: '2h', category: 'government', description: 'US government cybersecurity advisories' },
  { id: 'feed:ncsc', name: 'UK NCSC', type: 'RSS Feed', access: 'PUBLIC', endpoint: 'https://www.ncsc.gov.uk/api/1/services/v1/all-rss-feed.xml', frequency: '2h', category: 'government', description: 'UK national cyber security centre advisories' },
  { id: 'feed:exploitdb', name: 'Exploit-DB', type: 'RSS Feed', access: 'PUBLIC', endpoint: 'https://www.exploit-db.com/rss.xml', frequency: '2h', category: 'exploit', description: 'Public exploit disclosures and PoC code' },
  { id: 'feed:packetstorm', name: 'Packet Storm', type: 'RSS Feed', access: 'PUBLIC', endpoint: 'https://rss.packetstormsecurity.com/files/', frequency: '2h', category: 'exploit', description: 'Security tools, advisories, and exploit archives' },
  { id: 'feed:crowdstrike', name: 'CrowdStrike', type: 'RSS Feed', access: 'PUBLIC', endpoint: 'https://www.crowdstrike.com/blog/feed/', frequency: '2h', category: 'research', description: 'Threat intelligence research, adversary tracking' },
  { id: 'feed:mandiant', name: 'Mandiant', type: 'RSS Feed', access: 'PUBLIC', endpoint: 'https://www.mandiant.com/resources/blog/rss.xml', frequency: '2h', category: 'research', description: 'APT research, nation-state threat tracking' },
  { id: 'feed:infosec-mag', name: 'Infosecurity Magazine', type: 'RSS Feed', access: 'PUBLIC', endpoint: 'https://www.infosecurity-magazine.com/rss/news/', frequency: '2h', category: 'news', description: 'Industry news and vulnerability coverage' },
];

/* ─── Service Integrations ─── */
const serviceIntegrations = [
  {
    id: 'jira', name: 'Jira', description: 'Create and search security tickets via REST API v3',
    icon: Ticket, category: 'ticketing',
    fields: [
      { key: 'JIRA_URL', label: 'Jira URL', placeholder: 'https://company.atlassian.net' },
      { key: 'JIRA_EMAIL', label: 'Jira Email', placeholder: 'user@company.com' },
      { key: 'JIRA_API_KEY', label: 'API Token', placeholder: 'Your Jira API token', secret: true },
    ],
  },
  {
    id: 'cybellum', name: 'Cybellum', description: 'Cross-reference CVEs against SBOM and product catalog',
    icon: Database, category: 'sbom',
    fields: [
      { key: 'CYBELLUM_BASE_URL', label: 'Base URL', placeholder: 'https://your-instance.cybellum.io' },
      { key: 'CYBELLUM_API_KEY', label: 'API Key', placeholder: 'Your Cybellum API key', secret: true },
    ],
  },
  {
    id: 'hisac', name: 'H-ISAC', description: 'Healthcare-sector threat bulletins and IOC feeds',
    icon: Lock, category: 'isac',
    fields: [
      { key: 'HISAC_ACCESS_ID', label: 'Access ID', placeholder: 'Your H-ISAC Access ID' },
      { key: 'HISAC_SECRET_KEY', label: 'Secret Key', placeholder: 'HMAC-SHA1 secret key', secret: true },
    ],
  },
  {
    id: 'brevo', name: 'Brevo (Email)', description: 'Send threat alert emails and digest notifications',
    icon: Mail, category: 'notification',
    fields: [
      { key: 'BREVO_API_KEY', label: 'API Key', placeholder: 'Your Brevo API key', secret: true },
    ],
  },
];

const categoryLabels: Record<string, string> = {
  vulnerability: 'Vulnerability DBs',
  healthcare: 'Healthcare',
  news: 'Security News',
  research: 'Research',
  vendor: 'Vendor Advisories',
  government: 'Government',
  exploit: 'Exploit Sources',
};

const categoryColors: Record<string, string> = {
  vulnerability: 'bg-red-500/10 text-red-400 border-red-500/20',
  healthcare: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  news: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  research: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  vendor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  government: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  exploit: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

const frequencyOptions = [
  { value: '1h', label: 'Every hour' },
  { value: '2h', label: 'Every 2 hours' },
  { value: '4h', label: 'Every 4 hours' },
  { value: '6h', label: 'Every 6 hours' },
  { value: '12h', label: 'Every 12 hours' },
  { value: '24h', label: 'Every 24 hours' },
];

type Tab = 'feeds' | 'services';

export default function IntegrationsContent() {
  const { data: session } = useSession() || {};
  const user = session?.user as any;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

  const [tab, setTab] = useState<Tab>('feeds');
  const [feedStates, setFeedStates] = useState<Record<string, { enabled: boolean; frequency: string; endpoint: string }>>({});
  const [serviceConfigs, setServiceConfigs] = useState<Record<string, Record<string, string>>>({});
  const [serviceStatuses, setServiceStatuses] = useState<Record<string, 'connected' | 'disconnected' | 'error'>>({});
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedFeed, setExpandedFeed] = useState<string | null>(null);
  const [feedSearch, setFeedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Load saved configs on mount
  const loadConfigs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/integrations');
      if (res.ok) {
        const data = await res.json();
        const configs = data.configs || [];
        const newFeedStates: typeof feedStates = {};
        const newServiceConfigs: typeof serviceConfigs = {};
        const newServiceStatuses: typeof serviceStatuses = {};

        configs.forEach((c: any) => {
          if (c.integrationId.startsWith('feed:')) {
            const parsed = c.configData ? JSON.parse(c.configData) : {};
            const source = feedSources.find(f => f.id === c.integrationId);
            newFeedStates[c.integrationId] = {
              enabled: c.enabled,
              frequency: parsed.frequency || source?.frequency || '2h',
              endpoint: parsed.endpoint || source?.endpoint || '',
            };
          } else {
            const parsed = c.configData ? JSON.parse(c.configData) : {};
            newServiceConfigs[c.integrationId] = parsed;
            newServiceStatuses[c.integrationId] = c.enabled ? 'connected' : 'disconnected';
          }
        });

        setFeedStates(newFeedStates);
        setServiceConfigs(newServiceConfigs);
        setServiceStatuses(newServiceStatuses);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadConfigs(); }, [loadConfigs]);

  // Feed helpers
  const getFeedState = (feedId: string) => {
    const source = feedSources.find(f => f.id === feedId)!;
    return feedStates[feedId] || { enabled: false, frequency: source.frequency, endpoint: source.endpoint };
  };

  const toggleFeed = async (feedId: string) => {
    const current = getFeedState(feedId);
    const newEnabled = !current.enabled;
    setFeedStates(prev => ({ ...prev, [feedId]: { ...current, enabled: newEnabled } }));

    try {
      const res = await fetch('/api/admin/integrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId: feedId, enabled: newEnabled }),
      });
      if (res.ok) {
        toast.success(`${feedSources.find(f => f.id === feedId)?.name} ${newEnabled ? 'enabled' : 'disabled'}`);
      } else {
        setFeedStates(prev => ({ ...prev, [feedId]: { ...current, enabled: !newEnabled } }));
        toast.error('Failed to toggle feed');
      }
    } catch {
      setFeedStates(prev => ({ ...prev, [feedId]: { ...current, enabled: !newEnabled } }));
      toast.error('Failed to toggle feed');
    }
  };

  const saveFeedConfig = async (feedId: string) => {
    setSaving(feedId);
    const state = getFeedState(feedId);
    try {
      const res = await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integrationId: feedId,
          config: { endpoint: state.endpoint, frequency: state.frequency },
          enabled: state.enabled,
        }),
      });
      if (res.ok) {
        toast.success('Feed configuration saved');
      } else {
        toast.error('Failed to save feed config');
      }
    } catch {
      toast.error('Failed to save feed config');
    } finally {
      setSaving(null);
    }
  };

  const testFeed = async (feedId: string) => {
    setTesting(feedId);
    const state = getFeedState(feedId);
    try {
      const res = await fetch('/api/admin/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId: feedId, config: { endpoint: state.endpoint } }),
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        toast.success(data.message || 'Feed is reachable');
      } else {
        toast.error(data?.message || data?.error || 'Feed test failed');
      }
    } catch {
      toast.error('Feed test failed');
    } finally {
      setTesting(null);
    }
  };

  const enableAllFeeds = async () => {
    const updates = feedSources.map(f => {
      const state = getFeedState(f.id);
      return { ...state, enabled: true };
    });
    const newStates: typeof feedStates = {};
    feedSources.forEach((f, i) => { newStates[f.id] = updates[i]; });
    setFeedStates(newStates);

    // Batch save
    for (const f of feedSources) {
      await fetch('/api/admin/integrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId: f.id, enabled: true }),
      });
    }
    toast.success('All 18 feeds enabled');
  };

  const disableAllFeeds = async () => {
    const newStates: typeof feedStates = {};
    feedSources.forEach(f => {
      newStates[f.id] = { ...getFeedState(f.id), enabled: false };
    });
    setFeedStates(newStates);

    for (const f of feedSources) {
      await fetch('/api/admin/integrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId: f.id, enabled: false }),
      });
    }
    toast.success('All feeds disabled');
  };

  // Service helpers
  const updateServiceField = (svcId: string, key: string, value: string) => {
    setServiceConfigs(prev => ({ ...prev, [svcId]: { ...prev[svcId], [key]: value } }));
  };

  const handleServiceSave = async (svcId: string) => {
    setSaving(svcId);
    try {
      const res = await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId: svcId, config: serviceConfigs[svcId] || {} }),
      });
      if (res.ok) {
        toast.success(`${svcId} configuration saved`);
        setServiceStatuses(prev => ({ ...prev, [svcId]: 'connected' }));
      } else {
        toast.error('Failed to save');
      }
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(null);
    }
  };

  const handleServiceTest = async (svcId: string) => {
    setTesting(svcId);
    try {
      const res = await fetch('/api/admin/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId: svcId, config: serviceConfigs[svcId] || {} }),
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        toast.success(data.message || 'Connection successful');
        setServiceStatuses(prev => ({ ...prev, [svcId]: 'connected' }));
      } else {
        toast.error(data?.error || data?.message || 'Test failed');
        setServiceStatuses(prev => ({ ...prev, [svcId]: 'error' }));
      }
    } catch {
      toast.error('Connection test failed');
      setServiceStatuses(prev => ({ ...prev, [svcId]: 'error' }));
    } finally {
      setTesting(null);
    }
  };

  // Filter feeds
  const filteredFeeds = feedSources.filter(f => {
    if (categoryFilter !== 'all' && f.category !== categoryFilter) return false;
    if (feedSearch) {
      const q = feedSearch.toLowerCase();
      return f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q) || f.type.toLowerCase().includes(q);
    }
    return true;
  });

  const enabledCount = feedSources.filter(f => getFeedState(f.id).enabled).length;
  const categories = Array.from(new Set(feedSources.map(f => f.category)));

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-[960px] mx-auto">
        <div className="h-8 w-48 bg-muted/50 rounded animate-pulse" />
        <div className="grid gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-muted/30 rounded-lg animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[960px] mx-auto">
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Plug className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold tracking-tight">Integrations</h1>
              <p className="text-sm text-muted-foreground">Manage intelligence feeds, API sources, and service connections</p>
            </div>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-mono">
            {enabledCount}/{feedSources.length} feeds active
          </Badge>
        </div>
      </FadeIn>

      {!isAdmin && (
        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardContent className="py-4">
            <p className="text-sm text-orange-500">Only Admin or SuperAdmin users can configure integrations. Contact your organization administrator.</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/30 p-1 rounded-lg border border-border/30 w-fit">
        <button
          onClick={() => setTab('feeds')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            tab === 'feeds' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Rss className="w-4 h-4" />
          Intelligence Feeds
          <Badge variant="outline" className="text-[10px] ml-1 font-mono">{feedSources.length}</Badge>
        </button>
        <button
          onClick={() => setTab('services')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            tab === 'services' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Zap className="w-4 h-4" />
          Service Integrations
          <Badge variant="outline" className="text-[10px] ml-1 font-mono">{serviceIntegrations.length}</Badge>
        </button>
      </div>

      {/* ═══ FEEDS TAB ═══ */}
      {tab === 'feeds' && (
        <div className="space-y-4">
          {/* Feed toolbar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search feeds..."
                value={feedSearch}
                onChange={e => setFeedSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{categoryLabels[c] || c}</option>
              ))}
            </select>
            {isAdmin && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={enableAllFeeds} className="gap-1.5 text-xs">
                  <ToggleRight className="w-3.5 h-3.5" /> Enable All
                </Button>
                <Button size="sm" variant="outline" onClick={disableAllFeeds} className="gap-1.5 text-xs">
                  <ToggleLeft className="w-3.5 h-3.5" /> Disable All
                </Button>
              </div>
            )}
          </div>

          {/* Feed list */}
          <div className="space-y-2">
            {filteredFeeds.map((source, i) => {
              const state = getFeedState(source.id);
              const isExpanded = expandedFeed === source.id;

              return (
                <SlideIn key={source.id} delay={i * 0.02}>
                  <div className={`border rounded-lg transition-all ${state.enabled ? 'border-primary/30 bg-primary/[0.02]' : 'border-border/40 bg-card'}`}>
                    {/* Feed row */}
                    <div className="flex items-center gap-3 px-4 py-3">
                      {/* Toggle */}
                      {isAdmin && (
                        <button
                          onClick={() => toggleFeed(source.id)}
                          className="flex-shrink-0"
                          title={state.enabled ? 'Disable feed' : 'Enable feed'}
                        >
                          {state.enabled
                            ? <ToggleRight className="w-6 h-6 text-primary" />
                            : <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                          }
                        </button>
                      )}

                      {/* Icon */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${state.enabled ? 'bg-primary/10' : 'bg-muted/50'}`}>
                        {source.type.includes('API') ? <Globe className="w-4 h-4 text-primary" /> : <Rss className="w-4 h-4 text-muted-foreground" />}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${state.enabled ? 'text-foreground' : 'text-muted-foreground'}`}>{source.name}</span>
                          <Badge className={`text-[9px] font-mono ${categoryColors[source.category] || 'bg-muted text-muted-foreground'}`}>
                            {categoryLabels[source.category] || source.category}
                          </Badge>
                          {source.access === 'AUTH' && (
                            <Badge className="text-[9px] font-mono bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                              <Lock className="w-2.5 h-2.5 mr-0.5" /> AUTH
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{source.description}</p>
                      </div>

                      {/* Meta */}
                      <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
                        <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {state.frequency}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {source.type}
                        </Badge>
                      </div>

                      {/* Expand */}
                      <button
                        onClick={() => setExpandedFeed(isExpanded ? null : source.id)}
                        className="flex-shrink-0 p-1 rounded hover:bg-muted/50"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Expanded config */}
                    {isExpanded && (
                      <div className="border-t border-border/30 px-4 py-3 bg-muted/10 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-mono">Endpoint URL</Label>
                            <Input
                              value={state.endpoint}
                              onChange={e => setFeedStates(prev => ({
                                ...prev,
                                [source.id]: { ...getFeedState(source.id), endpoint: e.target.value },
                              }))}
                              disabled={!isAdmin}
                              className="h-8 text-xs font-mono"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-mono">Collection Frequency</Label>
                            <select
                              value={state.frequency}
                              onChange={e => setFeedStates(prev => ({
                                ...prev,
                                [source.id]: { ...getFeedState(source.id), frequency: e.target.value },
                              }))}
                              disabled={!isAdmin}
                              className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs font-mono text-foreground"
                            >
                              {frequencyOptions.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <ExternalLink className="w-3 h-3" />
                          <a href={source.endpoint} target="_blank" rel="noopener noreferrer" className="hover:text-primary truncate">{source.endpoint}</a>
                        </div>

                        {isAdmin && (
                          <div className="flex gap-2 pt-1">
                            <Button size="sm" variant="outline" onClick={() => testFeed(source.id)} disabled={testing === source.id} className="gap-1.5 text-xs">
                              <TestTube className="w-3.5 h-3.5" />
                              {testing === source.id ? 'Testing...' : 'Test Feed'}
                            </Button>
                            <Button size="sm" onClick={() => saveFeedConfig(source.id)} disabled={saving === source.id} className="gap-1.5 text-xs">
                              <Save className="w-3.5 h-3.5" />
                              {saving === source.id ? 'Saving...' : 'Save Config'}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </SlideIn>
              );
            })}

            {filteredFeeds.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No feeds matching your search.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ SERVICES TAB ═══ */}
      {tab === 'services' && (
        <div className="space-y-4">
          {serviceIntegrations.map((svc, i) => {
            const Icon = svc.icon;
            const status = serviceStatuses[svc.id] || 'disconnected';

            return (
              <SlideIn key={svc.id} delay={i * 0.05}>
                <Card className="border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Icon className="w-4 h-4 text-primary" />
                        {svc.name}
                      </CardTitle>
                      <Badge className={`text-[10px] font-mono ${
                        status === 'connected' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        status === 'error' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                        'bg-muted text-muted-foreground border-border/50'
                      }`}>
                        {status === 'connected' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {status === 'error' && <XCircle className="w-3 h-3 mr-1" />}
                        {status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{svc.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {svc.fields.map(field => (
                      <div key={field.key} className="space-y-1.5">
                        <Label className="text-xs font-mono">{field.label}</Label>
                        <div className="relative">
                          <Input
                            type={field.secret && !visibleFields[`${svc.id}_${field.key}`] ? 'password' : 'text'}
                            placeholder={field.placeholder}
                            value={serviceConfigs[svc.id]?.[field.key] || ''}
                            onChange={e => updateServiceField(svc.id, field.key, e.target.value)}
                            disabled={!isAdmin}
                            className="h-8 text-sm font-mono pr-10"
                          />
                          {field.secret && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                              onClick={() => setVisibleFields(prev => ({ ...prev, [`${svc.id}_${field.key}`]: !prev[`${svc.id}_${field.key}`] }))}
                            >
                              {visibleFields[`${svc.id}_${field.key}`] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {isAdmin && (
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleServiceTest(svc.id)} disabled={testing === svc.id}>
                          <TestTube className="w-3.5 h-3.5" />
                          {testing === svc.id ? 'Testing...' : 'Test Connection'}
                        </Button>
                        <Button size="sm" className="gap-1.5" onClick={() => handleServiceSave(svc.id)} disabled={saving === svc.id}>
                          <Save className="w-3.5 h-3.5" />
                          {saving === svc.id ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </SlideIn>
            );
          })}
        </div>
      )}
    </div>
  );
}