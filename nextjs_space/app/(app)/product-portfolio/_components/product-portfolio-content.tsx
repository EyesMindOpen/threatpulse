'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Shield, AlertTriangle, Plus } from 'lucide-react';
import { FadeIn, SlideIn } from '@/components/ui/animate';
import Link from 'next/link';

export default function ProductPortfolioContent() {
  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold tracking-tight">Product Portfolio</h1>
              <p className="text-sm text-muted-foreground">Cybellum-connected products and SBOM risk overview</p>
            </div>
          </div>
          <Link href="/integrations"><Button size="sm" className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Product</Button></Link>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: '0', icon: Package, color: 'text-primary' },
          { label: 'High Risk (≥7)', value: '0', icon: AlertTriangle, color: 'text-red-500' },
          { label: 'Avg Risk Score', value: '0.0', icon: Shield, color: 'text-orange-500' },
          { label: 'Scan Ready', value: '0', icon: Shield, color: 'text-emerald-500' },
        ].map((card, i) => (
          <SlideIn key={card.label} from="bottom" delay={i * 0.05}>
            <Card className="border-border/50">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-display font-bold mt-1">{card.value}</p>
              </CardContent>
            </Card>
          </SlideIn>
        ))}
      </div>

      <Card className="border-border/50">
        <CardContent className="py-12 text-center">
          <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground">No products configured</p>
          <p className="text-sm text-muted-foreground mt-1">Connect your Cybellum instance in <span className="text-primary">Integrations</span> to import your product catalog and SBOMs</p>
          <Link href="/integrations"><Button variant="outline" size="sm" className="mt-4">Configure Cybellum Integration</Button></Link>
        </CardContent>
      </Card>
    </div>
  );
}
