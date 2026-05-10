'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Shield, User } from 'lucide-react';
import { FadeIn } from '@/components/ui/animate';
import type { OrgUser } from '@/lib/types';
import { toast } from 'sonner';

export default function UsersContent() {
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/admin/users');
        if (res.ok) {
          const data = await res.json();
          setUsers(data?.users ?? []);
        }
      } catch (err: any) {
        console.error('Fetch users error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const updateRole = async (userId: string, role: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      });
      if (res.ok) {
        setUsers((prev: OrgUser[]) => (prev ?? []).map((u: OrgUser) => u?.id === userId ? { ...(u ?? {}), role } : u));
        toast.success('Role updated');
      } else {
        toast.error('Failed to update role');
      }
    } catch {
      toast.error('Failed');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[900px] mx-auto">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">View and manage organization members and their roles</p>
        </div>
      </FadeIn>

      <FadeIn delay={0.05}>
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              Members ({users?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-2 p-6">
                {[1,2,3].map((i: number) => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}
              </div>
            ) : (users?.length ?? 0) === 0 ? (
              <div className="text-center py-12">
                <User className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No users found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(users ?? []).map((u: OrgUser) => (
                    <TableRow key={u?.id}>
                      <TableCell className="font-medium text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                            {u?.role === 'ADMIN' ? <Shield className="w-3.5 h-3.5 text-primary" /> : <User className="w-3.5 h-3.5 text-muted-foreground" />}
                          </div>
                          {u?.name ?? 'Unknown'}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u?.email ?? ''}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={u?.role === 'ADMIN' ? 'bg-primary/10 text-primary border-primary/20 text-[10px]' : 'text-[10px]'}>
                          {u?.role ?? 'ANALYST'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u?.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        <Select value={u?.role ?? 'ANALYST'} onValueChange={(v: string) => updateRole(u?.id ?? '', v)}>
                          <SelectTrigger className="h-7 text-xs w-[120px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="ANALYST">Analyst</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
