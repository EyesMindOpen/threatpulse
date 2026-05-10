'use client';
import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { FadeIn } from '@/components/ui/animate';
import { toast } from 'sonner';

export default function UploadContent() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e?.target?.files?.[0] ?? null;
    if (f) {
      const ext = f?.name?.split('.')?.pop()?.toLowerCase();
      if (ext !== 'csv' && ext !== 'json') {
        toast.error('Only CSV and JSON files are supported');
        return;
      }
      setFile(f);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) { toast.error('Please select a file'); return; }
    setUploading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        toast.success(`Imported ${data?.created ?? 0} threats`);
      } else {
        toast.error(data?.error ?? 'Upload failed');
      }
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const csvTemplate = 'threatId,title,type,severity,status,description,affectedAssets,source\nCVE-2024-99999,Example Vulnerability,CVE,HIGH,NEW,Description here,Linux servers,NVD';
  const jsonTemplate = JSON.stringify({ threats: [{ threatId: 'IOC-999', title: 'Example IOC', type: 'IOC', severity: 'MEDIUM', status: 'NEW', description: 'Sample indicator', indicators: '192.168.1.1', source: 'Internal' }] }, null, 2);

  const downloadTemplate = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 max-w-[900px] mx-auto">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Upload Threat Data</h1>
          <p className="text-sm text-muted-foreground mt-1">Import threats from CSV or JSON files into your intelligence database</p>
        </div>
      </FadeIn>

      <FadeIn delay={0.05}>
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">File Upload</CardTitle>
            <CardDescription>Upload a CSV or JSON file containing threat data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onClick={() => inputRef?.current?.click?.()}
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
            >
              <input ref={inputRef} type="file" accept=".csv,.json" onChange={handleFileChange} className="hidden" />
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{file?.name ?? 'file'}</span>
                  <span className="text-xs text-muted-foreground">({((file?.size ?? 0) / 1024).toFixed(1)} KB)</span>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium">Click to select a file</p>
                  <p className="text-xs text-muted-foreground mt-1">Supports CSV and JSON formats</p>
                </>
              )}
            </div>
            <Button onClick={handleUpload} disabled={!file || uploading} loading={uploading} className="w-full">
              {uploading ? 'Uploading...' : 'Upload & Import'}
            </Button>
          </CardContent>
        </Card>
      </FadeIn>

      {result && (
        <FadeIn>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-sm">Import Complete</p>
                  <p className="text-sm text-muted-foreground">
                    <span className="text-emerald-500 font-medium">{result?.created ?? 0}</span> threats created,{' '}
                    <span className="text-yellow-500 font-medium">{result?.skipped ?? 0}</span> skipped (duplicates),{' '}
                    out of <span className="font-medium">{result?.total ?? 0}</span> total records.
                  </p>
                  {(result?.errors?.length ?? 0) > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Errors:</p>
                      {(result?.errors ?? []).slice(0, 5).map((err: string, i: number) => (
                        <p key={i} className="text-xs text-muted-foreground ml-4">{err}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      <FadeIn delay={0.1}>
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Templates</CardTitle>
            <CardDescription>Download sample templates to structure your data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => downloadTemplate(csvTemplate, 'threats-template.csv')} className="gap-2 justify-start h-auto py-3">
                <Download className="w-4 h-4" />
                <div className="text-left">
                  <p className="text-sm font-medium">CSV Template</p>
                  <p className="text-[10px] text-muted-foreground">Comma-separated values format</p>
                </div>
              </Button>
              <Button variant="outline" onClick={() => downloadTemplate(jsonTemplate, 'threats-template.json')} className="gap-2 justify-start h-auto py-3">
                <Download className="w-4 h-4" />
                <div className="text-left">
                  <p className="text-sm font-medium">JSON Template</p>
                  <p className="text-[10px] text-muted-foreground">JavaScript Object Notation format</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.15}>
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Expected Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="text-xs w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-medium">Field</th>
                    <th className="text-left py-2 pr-4 font-medium">Required</th>
                    <th className="text-left py-2 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  {[
                    ['threatId', 'Yes', 'Unique identifier (e.g., CVE-2024-1234)'],
                    ['title', 'Yes', 'Name/title of the threat'],
                    ['type', 'Yes', 'CVE, IOC, or TTP'],
                    ['severity', 'Yes', 'CRITICAL, HIGH, MEDIUM, or LOW'],
                    ['status', 'No', 'NEW, INVESTIGATING, or RESOLVED'],
                    ['description', 'No', 'Detailed description'],
                    ['affectedAssets', 'No', 'Affected systems/software'],
                    ['source', 'No', 'Intelligence source (NVD, VirusTotal, etc.)'],
                    ['indicators', 'No', 'IOC indicators (IPs, domains, hashes)'],
                    ['cvssScore', 'No', 'CVSS score (0-10)'],
                  ].map(([field, req, desc]: string[]) => (
                    <tr key={field} className="border-b border-border/50">
                      <td className="py-2 pr-4 font-mono text-primary">{field}</td>
                      <td className="py-2 pr-4">{req}</td>
                      <td className="py-2">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
