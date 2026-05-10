'use client';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS: Record<string, string> = {
  NEW: '#60B5FF',
  INVESTIGATING: '#FF9898',
  RESOLVED: '#80D8C3',
};

export default function StatusChart({ data }: { data: Record<string, number> }) {
  const chartData = Object.entries(data ?? {}).map(([name, value]: [string, number]) => ({ name, value }));
  if ((chartData?.length ?? 0) === 0) return <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={chartData} cx="50%" cy="55%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
          {(chartData ?? []).map((entry: any) => (
            <Cell key={entry?.name} fill={COLORS[entry?.name] ?? '#8884d8'} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: 'none' }} />
        <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
