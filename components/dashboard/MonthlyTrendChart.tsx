'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatKRW } from '@/lib/utils/formatCurrency';

interface MonthlyTrendData {
  month: string;
  cost: number;
}

interface MonthlyTrendChartProps {
  data: MonthlyTrendData[];
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-muted-foreground">
        <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
          <span className="text-2xl text-muted-foreground/40">📈</span>
        </div>
        <p className="font-semibold text-sm">월별 데이터가 없습니다</p>
      </div>
    );
  }

  return (
    <figure className="w-full h-80" role="img" aria-label="월별 구독 비용 추이 차트">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="tossMonthlyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3182F6" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#3182F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="none"
            stroke="var(--color-border, hsl(var(--border)))"
            strokeOpacity={0.5}
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fill: 'var(--color-muted-foreground, #6b7280)', fontSize: 11, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--color-muted-foreground, #6b7280)', fontSize: 11, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `₩${(value / 1000).toFixed(0)}K`}
            width={55}
          />
          <Tooltip
            formatter={(value) => (value ? formatKRW(value as number) : '₩0')}
            contentStyle={{
              backgroundColor: 'var(--color-card, hsl(var(--card)))',
              color: 'var(--color-foreground, hsl(var(--foreground)))',
              border: '1px solid var(--color-border, hsl(var(--border)))',
              borderRadius: '16px',
              padding: '12px 16px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
              fontSize: '13px',
              fontWeight: 500,
            }}
            itemStyle={{
              color: 'var(--color-foreground, hsl(var(--foreground)))',
              fontWeight: 600,
            }}
            labelStyle={{
              color: 'var(--color-muted-foreground, #6b7280)',
              fontWeight: 700,
            }}
          />
          <Area
            type="monotone"
            dataKey="cost"
            stroke="#3182F6"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#tossMonthlyGrad)"
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, stroke: '#3182F6', fill: 'var(--color-card, white)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </figure>
  );
}
