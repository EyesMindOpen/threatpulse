'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function BySourceChart({ data }: { data: Record<string, number> }) {
  const chartData = Object.entries(data ?? {})
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 15);

  if (chartData.length === 0) {
    return <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18}>
          {chartData.map((_: any, i: number) => (
            <Cell key={i} fill="hsl(192 91% 36%)" fillOpacity={1 - (i * 0.04)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
