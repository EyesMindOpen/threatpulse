'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e',
};

export default function TrendChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="CRITICAL" stroke={COLORS.CRITICAL} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="HIGH" stroke={COLORS.HIGH} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="MEDIUM" stroke={COLORS.MEDIUM} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="LOW" stroke={COLORS.LOW} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
