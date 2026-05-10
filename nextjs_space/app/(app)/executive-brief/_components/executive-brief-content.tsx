'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Shield, AlertTriangle, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { FadeIn, SlideIn } from '@/components/ui/animate';

export default function ExecutiveBriefContent() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6"><div className="h-64 bg-muted animate-pulse rounded-xl" /></div>;

  const total = stats?.total ?? 0;
  const bySeverity = stats?.bySeverity ?? {};
  const byStatus = stats?.byStatus ?? {};
  const resolved = byStatus?.RESOLVED ?? 0;
  const resolvedPct = total > 0 ? Math.round((resolved / total) * 100) : 0;
  const critical = bySeverity?.CRITICAL ?? 0;
  const high = bySeverity?.HIGH ?? 0;
  const openCritHigh = critical + high - Math.round((critical + high) * (resolvedPct / 100));

  return (
    <div className="p-6 space-y-6 max-w-[1100px] mx-auto">
      <FadeIn>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Executive Brief</h1>
            <p className="text-sm text-muted-foreground">High-level threat posture summary for leadership</p>
          </div>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Threats', value: total, icon: Shield, color: 'text-primary' },
          { label: 'Open Critical+High', value: openCritHigh, icon: AlertTriangle, color: 'text-red-500' },
          { label: 'Resolution Rate', value: `${resolvedPct}%`, icon: CheckCircle, color: 'text-emerald-500' },
          { label: 'Today New', value: stats?.todayCount ?? 0, icon: TrendingUp, color: 'text-orange-500' },
        ].map((card, i) => (
          <SlideIn key={card.label} from="bottom" delay={i * 0.05}>
            <Card className="border-border/50">
              <CardContent className="pt-5 pb-4 px-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{card.label}</p>
                    <p className="text-3xl font-display font-bold mt-1">{card.value}</p>
                  </div>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </CardContent>
            </Card>
          </SlideIn>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SlideIn from="left" delay={0.1}>
          <Card className="border-border/50">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Severity Breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => {
                const count = bySeverity[sev] ?? 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                const colors: Record<string, string> = { CRITICAL: 'bg-red-500', HIGH: 'bg-orange-500', MEDIUM: 'bg-yellow-500', LOW: 'bg-emerald-500' };
                return (
                  <div key={sev}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{sev}</span>
                      <span className="text-xs text-muted-foreground">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${colors[sev]}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </SlideIn>

        <SlideIn from="right" delay={0.15}>
          <Card className="border-border/50">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Status Overview</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {['NEW', 'INVESTIGATING', 'RESOLVED'].map(status => {
                const count = byStatus[status] ?? 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                const colors: Record<string, string> = { NEW: 'bg-blue-500', INVESTIGATING: 'bg-purple-500', RESOLVED: 'bg-emerald-500' };
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{status}</span>
                      <span className="text-xs text-muted-foreground">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${colors[status]}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </SlideIn>
      </div>

      <FadeIn delay={0.2}>
        <Card className="border-border/50 bg-primary/5">
          <CardContent className="py-6 text-center">
            <p className="text-sm text-muted-foreground">Full MTTA/MTTR metrics, SLA compliance tracking, and exportable PDF reports will be available once more threat response data is collected.</p>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
