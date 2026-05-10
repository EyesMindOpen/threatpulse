'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, AlertTriangle, Bug, Crosshair, Activity, ChevronRight, X, Plus } from 'lucide-react';
import { FadeIn } from '@/components/ui/animate';
import type { ThreatItem } from '@/lib/types';
import { toast } from 'sonner';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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

const typeIcons: Record<string, any> = { CVE: Bug, IOC: Crosshair, TTP: Activity };

export default function ThreatsContent() {
  const { data: session } = useSession() || {};
  const user = session?.user as any;
  const [threats, setThreats] = useState<ThreatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [addOpen, setAddOpen] = useState(false);

  const fetchThreats = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (severityFilter !== 'all') params.set('severity', severityFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/threats?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setThreats(data?.threats ?? []);
      }
    } catch (err: any) {
      console.error('Fetch threats error:', err);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, severityFilter, statusFilter, search]);

  useEffect(() => { fetchThreats(); }, [fetchThreats]);

  const clearFilters = () => {
    setTypeFilter('all');
    setSeverityFilter('all');
    setStatusFilter('all');
    setSearch('');
  };

  const hasFilters = typeFilter !== 'all' || severityFilter !== 'all' || statusFilter !== 'all' || search !== '';

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Threat Intelligence</h1>
            <p className="text-sm text-muted-foreground mt-1">Browse and manage all tracked CVEs, IOCs, and TTPs</p>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" />Add Threat</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Add New Threat</DialogTitle></DialogHeader>
              <AddThreatForm onSuccess={() => { setAddOpen(false); fetchThreats(); }} />
            </DialogContent>
          </Dialog>
        </div>
      </FadeIn>

      {/* Filters */}
      <FadeIn delay={0.05}>
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search threats..." value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} className="pl-10 h-9" />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="CVE">CVE</SelectItem>
                  <SelectItem value="IOC">IOC</SelectItem>
                  <SelectItem value="TTP">TTP</SelectItem>
                </SelectContent>
              </Select>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Severity" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="NEW">New</SelectItem>
                  <SelectItem value="INVESTIGATING">Investigating</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-xs">
                  <X className="w-3 h-3" /> Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Table */}
      <FadeIn delay={0.1}>
        <Card className="border-border/50">
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-2 p-6">
                {[1,2,3,4,5].map((i: number) => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}
              </div>
            ) : (threats?.length ?? 0) === 0 ? (
              <div className="text-center py-16">
                <AlertTriangle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No threats found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[130px]">ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="w-[80px]">Type</TableHead>
                      <TableHead className="w-[100px]">Severity</TableHead>
                      <TableHead className="w-[120px]">Status</TableHead>
                      <TableHead className="w-[160px]">Affected Assets</TableHead>
                      <TableHead className="w-[100px]">Date</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(threats ?? []).map((threat: ThreatItem) => {
                      const TypeIcon = typeIcons[threat?.type] ?? Bug;
                      return (
                        <TableRow key={threat?.id} className="cursor-pointer hover:bg-muted/30">
                          <TableCell className="font-mono text-xs text-primary">{threat?.threatId ?? ''}</TableCell>
                          <TableCell className="font-medium text-sm max-w-[300px] truncate">{threat?.title ?? ''}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <TypeIcon className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-xs font-mono">{threat?.type ?? ''}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] ${severityBadge[threat?.severity] ?? ''}`}>
                              {threat?.severity ?? ''}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] ${statusBadge[threat?.status] ?? ''}`}>
                              {threat?.status ?? ''}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground truncate max-w-[160px]">{threat?.affectedAssets ?? '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {threat?.dateAdded ? new Date(threat.dateAdded).toLocaleDateString() : '—'}
                          </TableCell>
                          <TableCell>
                            <Link href={`/threats/${threat?.id}`}>
                              <Button variant="ghost" size="icon-sm"><ChevronRight className="w-4 h-4" /></Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground text-right mt-2">{threats?.length ?? 0} threat{(threats?.length ?? 0) !== 1 ? 's' : ''} found</p>
      </FadeIn>
    </div>
  );
}

function AddThreatForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    threatId: '', title: '', type: 'CVE', severity: 'MEDIUM', status: 'NEW',
    description: '', affectedAssets: '', source: '', indicators: '',
    mitreTactic: '', mitreTechnique: '', cvssScore: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData?.threatId || !formData?.title) { toast.error('Threat ID and Title are required'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/threats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success('Threat added successfully');
        onSuccess?.();
      } else {
        const data = await res.json();
        toast.error(data?.error ?? 'Failed to add threat');
      }
    } catch {
      toast.error('Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const update = (field: string, value: string) => setFormData((prev: any) => ({ ...(prev ?? {}), [field]: value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Threat ID *</Label>
          <Input placeholder="CVE-2024-XXXX" value={formData?.threatId ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('threatId', e.target.value)} className="h-8 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Title *</Label>
          <Input placeholder="Vulnerability name" value={formData?.title ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('title', e.target.value)} className="h-8 text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Type</Label>
          <Select value={formData?.type ?? 'CVE'} onValueChange={(v: string) => update('type', v)}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="CVE">CVE</SelectItem><SelectItem value="IOC">IOC</SelectItem><SelectItem value="TTP">TTP</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Severity</Label>
          <Select value={formData?.severity ?? 'MEDIUM'} onValueChange={(v: string) => update('severity', v)}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="CRITICAL">Critical</SelectItem><SelectItem value="HIGH">High</SelectItem><SelectItem value="MEDIUM">Medium</SelectItem><SelectItem value="LOW">Low</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Status</Label>
          <Select value={formData?.status ?? 'NEW'} onValueChange={(v: string) => update('status', v)}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="NEW">New</SelectItem><SelectItem value="INVESTIGATING">Investigating</SelectItem><SelectItem value="RESOLVED">Resolved</SelectItem></SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Description</Label>
        <Textarea placeholder="Describe the threat..." value={formData?.description ?? ''} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => update('description', e.target.value)} className="text-sm min-h-[60px]" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Affected Assets</Label>
          <Input placeholder="Systems affected" value={formData?.affectedAssets ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('affectedAssets', e.target.value)} className="h-8 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Source</Label>
          <Input placeholder="NVD, VirusTotal..." value={formData?.source ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('source', e.target.value)} className="h-8 text-sm" />
        </div>
      </div>
      <Button type="submit" className="w-full" loading={submitting}>Add Threat</Button>
    </form>
  );
}
