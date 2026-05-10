'use client';
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckSquare, Search, X } from 'lucide-react';
import { FadeIn } from '@/components/ui/animate';
import type { ThreatItem } from '@/lib/types';
import Link from 'next/link';

const severityBadge: Record<string, string> = {
  CRITICAL: 'bg-red-500/10 text-red-500 border-red-500/20',
  HIGH: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  MEDIUM: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  LOW: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
};
const statusBadge: Record<string, string> = {
  NEW: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  INVESTIGATING: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  RESOLVED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
};

export default function ActionedThreatsContent() {
  const [threats, setThreats] = useState<ThreatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchThreats = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/threats?${params}`);
      if (res.ok) {
        const data = await res.json();
        const actioned = (data?.threats ?? []).filter((t: ThreatItem) => t.status !== 'NEW');
        setThreats(actioned);
      }
    } catch (err: any) { console.error(err); }
    finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { fetchThreats(); }, [fetchThreats]);

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      <FadeIn>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <CheckSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Actioned Threats</h1>
            <p className="text-sm text-muted-foreground">Threats that have been reviewed, investigated, or resolved</p>
          </div>
        </div>
      </FadeIn>

      <Card className="border-border/50">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search actioned threats..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v === 'ALL' ? '' : v)}>
              <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="INVESTIGATING">Investigating</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
              </SelectContent>
            </Select>
            {(search || statusFilter) && (
              <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => { setSearch(''); setStatusFilter(''); }}>
                <X className="w-3 h-3" /> Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="w-[80px]">Type</TableHead>
                <TableHead className="w-[100px]">Severity</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[100px]">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={6}><div className="h-8 bg-muted animate-pulse rounded" /></TableCell></TableRow>
              )) : threats.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No actioned threats yet</TableCell></TableRow>
              ) : threats.map((t: ThreatItem) => (
                <TableRow key={t.id} className="hover:bg-muted/30">
                  <TableCell><Link href={`/threats/${t.id}`} className="font-mono text-xs text-primary hover:underline">{t.threatId}</Link></TableCell>
                  <TableCell className="text-sm truncate max-w-[300px]">{t.title}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{t.type}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className={`text-[10px] ${severityBadge[t.severity] ?? ''}`}>{t.severity}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className={`text-[10px] ${statusBadge[t.status] ?? ''}`}>{t.status}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(t.lastUpdated).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
