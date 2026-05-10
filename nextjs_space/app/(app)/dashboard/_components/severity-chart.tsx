'use client';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

const COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e',
};

export default function SeverityChart({ data }: { data: Record<string, number> }) {
  const chartData = Object.entries(data ?? {}).map(([name, value]) => ({ name, value }));

  if (chartData.length === 0) {
    return <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data</div>;
  }

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}>
              {chartData.map((entry: any) => (
                <Cell key={entry.name} fill={COLORS[entry.name] ?? '#6b7280'} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} formatter={(v: string, e: any) => `${v} (${e?.payload?.value ?? 0})`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
            <YAxis hide />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={32}>
              {chartData.map((entry: any) => (
                <Cell key={entry.name} fill={COLORS[entry.name] ?? '#6b7280'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
