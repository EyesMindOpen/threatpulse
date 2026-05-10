'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Shield, Eye, EyeOff, Lock, Mail, User, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { toast } from 'sonner';

export default function SignupForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) { toast.error('Please fill in all required fields'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, organizationName: orgName || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data?.error || 'Signup failed'); setLoading(false); return; }
      const signInRes = await signIn('credentials', { email, password, redirect: false });
      if (signInRes?.error) {
        toast.error('Account created but login failed. Please sign in manually.');
        router.replace('/login');
      } else {
        router.replace('/dashboard');
      }
    } catch {
      toast.error('Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
      </div>
      <Card className="w-full max-w-md relative z-10 border-border/50">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-display tracking-tight">Create Account</CardTitle>
            <CardDescription className="mt-1">Join ThreatPulse Intel to manage threat intelligence</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="name" placeholder="Jane Doe" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} className="pl-10" /></div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="email" type="email" placeholder="analyst@company.com" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} className="pl-10" /></div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Min 6 characters" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} className="pl-10 pr-10" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button></div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="org">Organization Name</Label>
              <div className="relative"><Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="org" placeholder="Your company (optional)" value={orgName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrgName(e.target.value)} className="pl-10" /></div>
            </div>
            <Button type="submit" className="w-full" loading={loading}>Create Account</Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}<Link href="/login" className="text-primary hover:underline font-medium">Sign In</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
