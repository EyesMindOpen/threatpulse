'use client';
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Rss, Search, X, ExternalLink, Eye } from 'lucide-react';
import { FadeIn } from '@/components/ui/animate';
import type { ThreatItem } from '@/lib/types';
import Link from 'next/link';

const severityBadge: Record<string, string> = {
  CRITICAL: 'bg-red-500/10 text-red-500 border-red-500/20',
  HIGH: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  MEDIUM: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  LOW: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
};

export default function ThreatFeedContent() {
  const [threats, setThreats] = useState<ThreatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  const fetchThreats = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (typeFilter) params.set('type', typeFilter);
      if (severityFilter) params.set('severity', severityFilter);
      const res = await fetch(`/api/threats?${params}`);
      if (res.ok) {
        const data = await res.json();
        setThreats(data?.threats ?? []);
      }
    } catch (err: any) { console.error(err); }
    finally { setLoading(false); }
  }, [search, typeFilter, severityFilter]);

  useEffect(() => { fetchThreats(); }, [fetchThreats]);

  const formatTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hours ago`;
    return `${Math.floor(hrs / 24)} days ago`;
  };

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      <FadeIn>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Rss className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Threat Feed</h1>
            <p className="text-sm text-muted-foreground">Live intelligence feed from all 18 sources</p>
          </div>
        </div>
      </FadeIn>

      <Card className="border-border/50">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search threats..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={typeFilter} onValueChange={v => setTypeFilter(v === 'ALL' ? '' : v)}>
              <SelectTrigger className="w-[120px] h-9"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="CVE">CVE</SelectItem>
                <SelectItem value="IOC">IOC</SelectItem>
                <SelectItem value="TTP">TTP</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={v => setSeverityFilter(v === 'ALL' ? '' : v)}>
              <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Severity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Severities</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
            {(search || typeFilter || severityFilter) && (
              <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => { setSearch(''); setTypeFilter(''); setSeverityFilter(''); }}>
                <X className="w-3 h-3" /> Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-1">
        {loading ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />) :
         threats.length === 0 ? (
           <Card className="border-border/50"><CardContent className="py-12 text-center text-muted-foreground">No threats found</CardContent></Card>
         ) : threats.map((t: ThreatItem) => (
          <Link key={t.id} href={`/threats/${t.id}`} className="block">
            <div className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/30 group">
              <Badge className={`text-[10px] font-mono px-2 py-0.5 ${severityBadge[t.severity] ?? ''}`}>{t.severity}</Badge>
              <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider w-32 flex-shrink-0 truncate">{t.source ?? 'Unknown'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate group-hover:text-primary transition-colors">{t.title}</p>
                <p className="text-[10px] text-muted-foreground">{formatTime(t.dateAdded)}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><Eye className="w-3 h-3" /> Review</Button>
                <Button variant="ghost" size="icon-sm" className="h-7 w-7"><ExternalLink className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
