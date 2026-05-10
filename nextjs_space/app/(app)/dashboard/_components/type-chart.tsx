'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS: Record<string, string> = {
  CVE: '#60B5FF',
  IOC: '#FF9149',
  TTP: '#A19AD3',
};

export default function TypeChart({ data }: { data: Record<string, number> }) {
  const chartData = Object.entries(data ?? {}).map(([name, value]: [string, number]) => ({ name, value }));
  if ((chartData?.length ?? 0) === 0) return <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
        <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 10 }} />
        <YAxis tickLine={false} tick={{ fontSize: 10 }} allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: 'none' }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {(chartData ?? []).map((entry: any) => (
            <Cell key={entry?.name} fill={COLORS[entry?.name] ?? '#8884d8'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
