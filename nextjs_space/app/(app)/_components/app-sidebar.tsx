'use client';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import {
  Shield, LayoutDashboard, AlertTriangle, Bug, Package, Rss,
  CheckSquare, Settings, LogOut, ChevronLeft, ChevronRight, ChevronDown,
  FileText, HelpCircle, Plug, Briefcase, BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';

const userItems = [
  { href: '/cve-database', label: 'CVE Database', icon: Bug },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/product-portfolio', label: 'Product Portfolio', icon: Package },
  { href: '/threat-feed', label: 'Threat Feed', icon: Rss },
];

const adminItems = [
  { href: '/actioned-threats', label: 'Actioned Threats', icon: CheckSquare },
  { href: '/admin', label: 'Admin', icon: Settings },
];

const executiveItems = [
  { href: '/executive-brief', label: 'Executive Brief', icon: Briefcase },
  { href: '/how-it-works', label: 'How It Works', icon: FileText },
  { href: '/policy', label: 'Policy & Procedures', icon: BookOpen },
];

function NavSection({ label, items, collapsed, pathname }: { label: string; items: typeof userItems; collapsed: boolean; pathname: string | null }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      {!collapsed && (
        <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full text-[10px] uppercase tracking-wider text-muted-foreground px-3 py-2 mt-3 hover:text-foreground transition-colors">
          <span>{label}</span>
          <ChevronDown className={cn('w-3 h-3 transition-transform', !open && '-rotate-90')} />
        </button>
      )}
      {(open || collapsed) && (items ?? []).map((item: any) => {
        const active = pathname === item?.href || (item?.href !== '/admin' && pathname?.startsWith(item?.href));
        return (
          <Link key={item.href} href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}>
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="truncate">{item?.label}</span>}
          </Link>
        );
      })}
    </div>
  );
}

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession() || {};
  const user = session?.user as any;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

  return (
    <aside className={cn(
      'flex flex-col border-r border-border/50 bg-card transition-all duration-300 h-full',
      collapsed ? 'w-16' : 'w-56'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-border/50">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <span className="font-display font-bold text-sm tracking-tight block">ThreatPulse</span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Intelligence</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto scrollbar-none">
        <NavSection label="User" items={userItems} collapsed={collapsed} pathname={pathname} />

        {isAdmin && (
          <NavSection label="Admin" items={adminItems} collapsed={collapsed} pathname={pathname} />
        )}

        <NavSection label="Executive" items={executiveItems} collapsed={collapsed} pathname={pathname} />
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-border/50 space-y-1">
        {/* Help dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors',
            )}
          >
            <HelpCircle className="w-4 h-4 flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left truncate">Help</span>
                <ChevronDown className={cn('w-3 h-3 transition-transform', showHelp && 'rotate-180')} />
              </>
            )}
          </button>
          {showHelp && !collapsed && (
            <div className="mx-2 mb-1 rounded-lg border border-border/50 bg-muted/30 p-2 space-y-1">
              {!collapsed && user && (
                <div className="px-2 py-1.5 border-b border-border/30 mb-1">
                  <p className="text-xs font-medium truncate">{user?.name ?? 'User'}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user?.email ?? ''}</p>
                  <p className="text-[10px] text-primary font-mono mt-0.5">{user?.role ?? 'ANALYST'}</p>
                </div>
              )}
              <Link href="/how-it-works" className="flex items-center gap-2 px-2 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50">
                <FileText className="w-3.5 h-3.5" /> Documentation
              </Link>
              <Link href="/integrations" className="flex items-center gap-2 px-2 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50">
                <Plug className="w-3.5 h-3.5" /> Integrations
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-2">
          <ThemeToggle />
          <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
            <Settings className="w-4 h-4" />
          </Link>
          <Button variant="ghost" size="icon-sm" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive" onClick={() => signOut({ callbackUrl: '/login' })}>
          <LogOut className="w-4 h-4" />
          {!collapsed && 'Sign Out'}
        </Button>
      </div>
    </aside>
  );
}
