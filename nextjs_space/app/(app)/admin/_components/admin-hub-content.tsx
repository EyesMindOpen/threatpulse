'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Building2, Users, Plug, Upload } from 'lucide-react';
import { FadeIn, SlideIn } from '@/components/ui/animate';
import Link from 'next/link';

const adminLinks = [
  { href: '/admin/organization', label: 'Organization', description: 'Manage organization name and settings', icon: Building2 },
  { href: '/admin/users', label: 'Users', description: 'Manage team members and role assignments', icon: Users },
  { href: '/integrations', label: 'Integrations', description: 'Configure Jira, Cybellum, H-ISAC, and Brevo', icon: Plug },
  { href: '/upload', label: 'Upload Data', description: 'Import threats via CSV or JSON file upload', icon: Upload },
];

export default function AdminHubContent() {
  return (
    <div className="p-6 space-y-6 max-w-[900px] mx-auto">
      <FadeIn>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Admin</h1>
            <p className="text-sm text-muted-foreground">Platform administration and configuration</p>
          </div>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {adminLinks.map((item, i) => (
          <SlideIn key={item.href} from="bottom" delay={i * 0.05}>
            <Link href={item.href} className="block">
              <Card className="border-border/50 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer h-full">
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </SlideIn>
        ))}
      </div>
    </div>
  );
}
