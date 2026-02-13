'use client';

import { useState, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from 'recharts';
import { CATEGORY_LABELS, type SubscriptionCategory } from '@/lib/types';
import { formatKRW } from '@/lib/utils/formatCurrency';

// Toss-aligned color palette -- softer, more harmonious than the raw category colors
const TOSS_CHART_COLORS: Record<SubscriptionCategory, string> = {
  video: '#F04452',
  music: '#9B59E0',
  cloud: '#3182F6',
  productivity: '#FFA826',
  shopping: '#1FC08E',
  gaming: '#E74D8B',
  reading: '#5B6DFF',
  other: '#8B95A1',
};

interface CategoryPieChartProps {
  data: Record<SubscriptionCategory, number>;
}

// Custom active shape for hover effect -- Toss-style with expanded radius
function renderActiveShape(props: any) {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value,
  } = props;

  return (
    <g>
      {/* Center label */}
      <text x={cx} y={cy - 12} textAnchor="middle" className="fill-foreground" style={{ fontSize: 18, fontWeight: 700 }}>
        {payload.name}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" className="fill-foreground" style={{ fontSize: 14, fontWeight: 600 }}>
        {formatKRW(value)}
      </text>
      <text x={cx} y={cy + 30} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 12, fontWeight: 500 }}>
        {(percent * 100).toFixed(0)}%
      </text>

      {/* Expanded active sector */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))', transition: 'all 0.3s ease' }}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 12}
        outerRadius={outerRadius + 16}
        fill={fill}
        opacity={0.3}
      />
    </g>
  );
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []);

  // Convert data to chart format
  const chartData = Object.entries(data)
    .filter(([_, value]) => value > 0)
    .map(([category, value]) => ({
      name: CATEGORY_LABELS[category as SubscriptionCategory],
      value,
      category: category as SubscriptionCategory,
    }))
    .sort((a, b) => b.value - a.value);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-muted-foreground">
        <div className="w-24 h-24 rounded-full border-4 border-dashed border-border mb-4 flex items-center justify-center">
          <span className="text-3xl text-muted-foreground/40">0</span>
        </div>
        <p className="font-semibold text-base">카테고리별 데이터가 없습니다</p>
        <p className="text-sm mt-1">구독을 추가하면 여기에 분포가 표시됩니다</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Donut chart */}
      <figure className="w-full h-72" role="img" aria-label={`카테고리별 구독 비용 분포 차트. ${chartData.map(e => `${e.name} ${((e.value / total) * 100).toFixed(0)}%`).join(', ')}`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              {...{ activeIndex, activeShape: renderActiveShape } as any}
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={3}
              dataKey="value"
              onMouseEnter={onPieEnter}
              strokeWidth={0}
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.category}
                  fill={TOSS_CHART_COLORS[entry.category]}
                  style={{ outline: 'none', cursor: 'pointer' }}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => (value ? formatKRW(value as number) : '\u20A90')}
              contentStyle={{
                backgroundColor: 'var(--color-card, hsl(var(--card)))',
                color: 'var(--color-foreground, hsl(var(--foreground)))',
                border: '1px solid var(--color-border, hsl(var(--border)))',
                borderRadius: '16px',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: 500,
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
              }}
              itemStyle={{
                color: 'var(--color-foreground, hsl(var(--foreground)))',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </figure>

      {/* Custom Legend -- Toss-style horizontal pill layout */}
      <div className="flex flex-wrap gap-2 justify-center mt-4" role="list" aria-label="카테고리 범례">
        {chartData.map((entry, index) => {
          const percent = total > 0 ? ((entry.value / total) * 100).toFixed(0) : '0';
          return (
            <button
              key={entry.category}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                index === activeIndex
                  ? 'bg-primary/10 border-primary/30 text-foreground shadow-sm scale-105'
                  : 'bg-card border-border text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              aria-label={`${entry.name} ${percent}% ${formatKRW(entry.value)}`}
              role="listitem"
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: TOSS_CHART_COLORS[entry.category] }}
              />
              <span>{entry.name}</span>
              <span className="text-muted-foreground/70">{percent}%</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
