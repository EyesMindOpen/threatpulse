'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  FileText, Plus, Trash2, Power, PowerOff, RefreshCw, Pencil,
  CheckCircle, XCircle, AlertCircle, ExternalLink, X, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface Connection {
  id: string;
  displayName?: string;
  baseUrl: string;
  email: string;
  apiToken: string;
  enabled: boolean;
  lastTestedAt?: string;
  lastTestStatus: string;
  lastError?: string;
  confluenceUserKey?: string;
}

const emptyForm = { displayName: '', baseUrl: '', email: '', apiToken: '' };

export default function ConfluenceSetup() {
  const { data: session } = useSession();
  const user = session?.user as any;

  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [formTesting, setFormTesting] = useState(false);

  const loadConnections = useCallback(async () => {
    try {
      const res = await fetch('/api/integrations/confluence');
      const data = await res.json();
      if (data.connections) setConnections(data.connections);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) loadConnections();
    else setLoading(false);
  }, [user?.id, loadConnections]);

  const handleTest = async (conn: Connection) => {
    setTesting((t) => ({ ...t, [conn.id]: true }));
    try {
      const res = await fetch('/api/integrations/confluence/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl: conn.baseUrl, email: conn.email, apiToken: conn.apiToken }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success('Connection verified as ' + (data.user || conn.email));
        await fetch('/api/integrations/confluence/' + conn.id, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lastTestStatus: 'success',
            lastError: null,
            confluenceUserKey: data.userKey || null,
          }),
        });
      } else {
        toast.error(data.error || 'Test failed');
        await fetch('/api/integrations/confluence/' + conn.id, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lastTestStatus: 'failed', lastError: data.error || 'Test failed' }),
        });
      }
      loadConnections();
    } catch (e: any) {
      toast.error(e.message || 'Request failed');
    } finally {
      setTesting((t) => ({ ...t, [conn.id]: false }));
    }
  };

  const handleTestForm = async () => {
    if (!form.baseUrl || !form.email || !form.apiToken) {
      setFormError('Enter base URL, email, and API token to test.');
      return;
    }
    setFormError('');
    setFormTesting(true);
    try {
      const res = await fetch('/api/integrations/confluence/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success('Connection verified as ' + (data.user || form.email));
      } else {
        setFormError(data.error || 'Test failed');
      }
    } catch (e: any) {
      setFormError(e.message || 'Request failed');
    } finally {
      setFormTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.baseUrl.trim() || !form.email.trim() || !form.apiToken.trim()) {
      setFormError('Base URL, email, and API token are required.');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch('/api/integrations/confluence/' + editingId, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, baseUrl: form.baseUrl.trim().replace(/\/$/, "") }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        toast.success('Connection updated');
      } else {
        const res = await fetch('/api/integrations/confluence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, baseUrl: form.baseUrl.trim().replace(/\/$/, "") }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        toast.success('Connection added');
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      loadConnections();
    } catch (e: any) {
      setFormError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (conn: Connection) => {
    await fetch('/api/integrations/confluence/' + conn.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !conn.enabled }),
    });
    loadConnections();
  };

  const handleDelete = async (conn: Connection) => {
    if (!confirm('Remove this Confluence connection?')) return;
    await fetch('/api/integrations/confluence/' + conn.id, { method: 'DELETE' });
    loadConnections();
    toast.success('Connection removed');
  };

  const startEdit = (conn: Connection) => {
    setEditingId(conn.id);
    setForm({
      displayName: conn.displayName || '',
      baseUrl: conn.baseUrl,
      email: conn.email,
      apiToken: '',
    });
    setShowForm(true);
    setFormError('');
  };

  const startAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setFormError('');
  };

  if (!user?.id) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-4 h-4 text-primary" /> Confluence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Sign in to manage your Confluence connection.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-4 h-4 text-primary" /> Confluence (per-user)
          </CardTitle>
          {!showForm && (
            <Button size="sm" onClick={startAdd}>
              <Plus className="w-4 h-4 mr-1" /> Add Connection
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Connect your own Confluence instance (Cloud or Server / Data Center). Credentials are stored per-user —
          only you can access them. Disable a connection to pause sync without losing your settings.
        </p>

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-border p-4 bg-muted/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{editingId ? 'Edit connection' : 'New connection'}</span>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Display name (optional)</Label>
                <Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="Engineering Wiki" />
              </div>
              <div>
                <Label className="text-xs">Base URL</Label>
                <Input value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} placeholder="https://your-team.atlassian.net" required />
              </div>
              <div>
                <Label className="text-xs">Email / Username</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" required />
              </div>
              <div>
                <Label className="text-xs">API Token {editingId && '(leave blank to keep)'}</Label>
                <Input type="password" value={form.apiToken} onChange={(e) => setForm({ ...form, apiToken: e.target.value })} placeholder="••••••••" required={!editingId} />
              </div>
            </div>
            {formError && (
              <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{formError}</p>
            )}
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                {editingId ? 'Update' : 'Save'}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleTestForm} disabled={formTesting}>
                {formTesting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />}
                Test
              </Button>
              <a href="https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/" target="_blank" rel="noreferrer" className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                How to get an API token <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : connections.length === 0 && !showForm ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No Confluence connection configured yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {connections.map((conn) => (
              <div key={conn.id} className="rounded-lg border border-border p-4 bg-muted/10">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{conn.displayName || conn.baseUrl}</span>
                      {conn.enabled ? (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-500"><CheckCircle className="w-3 h-3" />Enabled</span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground"><PowerOff className="w-3 h-3" />Disabled</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{conn.baseUrl}</p>
                    <p className="text-xs text-muted-foreground">{conn.email}</p>
                    {conn.lastTestStatus === 'success' && (
                      <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Verified{conn.lastTestedAt && ' · ' + new Date(conn.lastTestedAt).toLocaleDateString()}</p>
                    )}
                    {conn.lastTestStatus === 'failed' && (
                      <p className="text-xs text-destructive mt-1 flex items-start gap-1">
                        <XCircle className="w-3 h-3 mt-0.5 shrink-0" /> {conn.lastError || 'Test failed'}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => handleTest(conn)} disabled={testing[conn.id]} title="Test">
                      {testing[conn.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => startEdit(conn)} title="Edit">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleToggle(conn)} title={conn.enabled ? "Disable" : "Enable"}>
                      {conn.enabled ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(conn)} title="Delete" className="text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
