'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Users, AlertTriangle, Calendar, Save } from 'lucide-react';
import { FadeIn } from '@/components/ui/animate';
import { toast } from 'sonner';

export default function OrgContent() {
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const res = await fetch('/api/admin/organization');
        if (res.ok) {
          const data = await res.json();
          setOrg(data?.organization ?? null);
          setName(data?.organization?.name ?? '');
        }
      } catch (err: any) {
        console.error('Fetch org error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrg();
  }, []);

  const handleSave = async () => {
    if (!name?.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/organization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrg({ ...(org ?? {}), ...(data?.organization ?? {}) });
        toast.success('Organization updated');
      } else {
        toast.error('Failed to update');
      }
    } catch {
      toast.error('Failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6"><div className="h-64 bg-muted animate-pulse rounded-xl" /></div>;

  return (
    <div className="p-6 space-y-6 max-w-[800px] mx-auto">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Organization Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your organization details and view statistics</p>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FadeIn delay={0.05}>
          <Card className="border-border/50">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Slug</p>
                  <p className="text-sm font-mono">{org?.slug ?? '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
        <FadeIn delay={0.1}>
          <Card className="border-border/50">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Members</p>
                  <p className="text-xl font-bold">{org?._count?.users ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
        <FadeIn delay={0.15}>
          <Card className="border-border/50">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Threats</p>
                  <p className="text-xl font-bold">{org?._count?.threats ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      <FadeIn delay={0.2}>
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Organization Details</CardTitle>
            <CardDescription>Update your organization name</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Organization Name</Label>
              <Input value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              Created: {org?.createdAt ? new Date(org.createdAt).toLocaleDateString() : '—'}
            </div>
            <Button onClick={handleSave} loading={saving} className="gap-2">
              <Save className="w-4 h-4" /> Save Changes
            </Button>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
