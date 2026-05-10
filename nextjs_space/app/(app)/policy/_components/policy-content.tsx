'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, FileText, Shield, AlertTriangle } from 'lucide-react';
import { FadeIn, SlideIn } from '@/components/ui/animate';

const policies = [
  {
    title: 'Vulnerability Response SLA',
    category: 'SLA',
    description: 'Defines maximum response and remediation timelines based on threat severity.',
    rules: [
      { severity: 'CRITICAL', response: '4 hours', remediation: '24 hours' },
      { severity: 'HIGH', response: '8 hours', remediation: '72 hours' },
      { severity: 'MEDIUM', response: '24 hours', remediation: '14 days' },
      { severity: 'LOW', response: '72 hours', remediation: '30 days' },
    ],
  },
  {
    title: 'Threat Triage Workflow',
    category: 'WORKFLOW',
    description: 'Standard operating procedure for triaging incoming threat intelligence.',
    steps: [
      'New threat is ingested and classified by type (CVE, IOC, TTP)',
      'Severity is auto-assigned or derived from CVSS score',
      'Analyst reviews and marks as Investigating if applicable to org assets',
      'Cross-reference with Cybellum SBOM for affected product identification',
      'Create Jira ticket if action is required',
      'Mark as Resolved once mitigated or determined non-applicable',
    ],
  },
  {
    title: 'Escalation Policy',
    category: 'ESCALATION',
    description: 'Defines when and how threats should be escalated to management.',
    steps: [
      'Critical/High threats with confirmed asset impact: immediate escalation to CISO',
      'SLA breach on any severity: auto-escalation to org Admin',
      'Active exploitation (CISA KEV / Exploit-DB confirmed): immediate all-hands alert',
      'Multiple related threats in 24h window: correlation review by senior analyst',
    ],
  },
  {
    title: 'Data Retention & Classification',
    category: 'GOVERNANCE',
    description: 'How threat data is classified, stored, and retained.',
    steps: [
      'All threat records retained for minimum 2 years',
      'TLP classifications honored — TLP:RED content restricted to Admin+ roles',
      'H-ISAC data marked as member-confidential, not exportable',
      'Audit logs retained for 1 year with immutable storage',
    ],
  },
];

export default function PolicyContent() {
  return (
    <div className="p-6 space-y-6 max-w-[1100px] mx-auto">
      <FadeIn>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Policy & Procedures</h1>
            <p className="text-sm text-muted-foreground">Organizational threat response policies, SLAs, and workflows</p>
          </div>
        </div>
      </FadeIn>

      <div className="space-y-4">
        {policies.map((policy, i) => (
          <SlideIn key={policy.title} delay={i * 0.05}>
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{policy.title}</CardTitle>
                  <Badge variant="outline" className="text-[10px] font-mono">{policy.category}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{policy.description}</p>
              </CardHeader>
              <CardContent>
                {policy.rules && (
                  <div className="grid grid-cols-4 gap-3">
                    {policy.rules.map(rule => {
                      const colors: Record<string, string> = { CRITICAL: 'border-red-500/30', HIGH: 'border-orange-500/30', MEDIUM: 'border-yellow-500/30', LOW: 'border-emerald-500/30' };
                      return (
                        <div key={rule.severity} className={`rounded-lg p-3 border ${colors[rule.severity] ?? 'border-border/30'} bg-muted/20`}>
                          <Badge className={`text-[10px] font-mono mb-2 ${
                            rule.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-500' :
                            rule.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-500' :
                            rule.severity === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-500' :
                            'bg-emerald-500/10 text-emerald-500'
                          }`}>{rule.severity}</Badge>
                          <p className="text-xs"><Clock className="w-3 h-3 inline mr-1" />Response: <span className="font-semibold">{rule.response}</span></p>
                          <p className="text-xs mt-1"><Shield className="w-3 h-3 inline mr-1" />Remediation: <span className="font-semibold">{rule.remediation}</span></p>
                        </div>
                      );
                    })}
                  </div>
                )}
                {policy.steps && (
                  <div className="space-y-2">
                    {policy.steps.map((step, j) => (
                      <div key={j} className="flex items-start gap-3 text-sm">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-mono flex items-center justify-center flex-shrink-0 mt-0.5">{j + 1}</span>
                        <p className="text-muted-foreground">{step}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </SlideIn>
        ))}
      </div>
    </div>
  );
}
