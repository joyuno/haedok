'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CATEGORY_LABELS, CATEGORY_COLORS, type SubscriptionCategory } from '@/lib/types';
import { formatKRW } from '@/lib/utils/formatCurrency';

interface CategoryPieChartProps {
  data: Record<SubscriptionCategory, number>;
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  // Convert data to chart format
  const chartData = Object.entries(data)
    .filter(([_, value]) => value > 0)
    .map(([category, value]) => ({
      name: CATEGORY_LABELS[category as SubscriptionCategory],
      value,
      category: category as SubscriptionCategory,
    }))
    .sort((a, b) => b.value - a.value);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-muted-foreground">
        <p className="font-medium">카테고리별 데이터가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
            }
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            strokeWidth={2}
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.category}
                fill={CATEGORY_COLORS[entry.category]}
                stroke="white"
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => (value ? formatKRW(value as number) : '₩0')}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '14px',
              fontWeight: 500,
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span className="text-sm font-medium">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
