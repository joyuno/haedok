'use client';

import { useState, useMemo } from 'react';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { getStockDataByYears, simulateDCA, STOCK_CONFIGS } from '@/lib/utils/stockData';
import { formatKRW, formatKRWCompact } from '@/lib/utils/formatCurrency';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { BrandIcon } from '@/components/subscription/BrandIcon';

type ChartPeriod = '1Y' | '3Y' | '5Y';

const PERIOD_OPTIONS: { key: ChartPeriod; label: string; years: number }[] = [
  { key: '1Y', label: '1년', years: 1 },
  { key: '3Y', label: '3년', years: 3 },
  { key: '5Y', label: '5년', years: 5 },
];

export function StockInvestmentChart() {
  const subscriptions = useSubscriptionStore((s) => s.subscriptions);
  const getActiveSubscriptions = useSubscriptionStore((s) => s.getActiveSubscriptions);
  const activeSubscriptions = useMemo(() => getActiveSubscriptions(), [subscriptions, getActiveSubscriptions]);

  // 구독 선택 상태
  const [selectedSubIds, setSelectedSubIds] = useState<Set<string>>(new Set());
  const [period, setPeriod] = useState<ChartPeriod>('5Y');
  const selectedPeriod = PERIOD_OPTIONS.find((p) => p.key === period)!;

  // 선택된 구독의 월 절약액
  const monthlySavings = useMemo(() => {
    return activeSubscriptions
      .filter((sub) => selectedSubIds.has(sub.id))
      .reduce((sum, sub) => sum + sub.monthlyPrice, 0);
  }, [activeSubscriptions, selectedSubIds]);

  const stockData = useMemo(
    () => getStockDataByYears(selectedPeriod.years),
    [selectedPeriod.years],
  );

  const chartData = useMemo(
    () => simulateDCA(monthlySavings, stockData),
    [monthlySavings, stockData],
  );

  const displayData = useMemo(() => {
    if (chartData.length <= 18) return chartData;
    return chartData.filter((_, i) => i === 0 || i % 3 === 0 || i === chartData.length - 1);
  }, [chartData]);

  const handleToggle = (subId: string) => {
    const newSet = new Set(selectedSubIds);
    if (newSet.has(subId)) {
      newSet.delete(subId);
    } else {
      newSet.add(subId);
    }
    setSelectedSubIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedSubIds.size === activeSubscriptions.length) {
      setSelectedSubIds(new Set());
    } else {
      setSelectedSubIds(new Set(activeSubscriptions.map((s) => s.id)));
    }
  };

  if (activeSubscriptions.length === 0) return null;

  const lastPoint = chartData.length > 0 ? chartData[chartData.length - 1] : null;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-extrabold text-foreground mb-1.5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/[0.08] flex items-center justify-center">
            <TrendingUp className="h-4.5 w-4.5 text-primary" />
          </div>
          만약에 계산기
        </h3>
        <p className="text-sm text-muted-foreground font-medium">
          구독 대신 실제 ETF/주식에 투자했다면 얼마나 모을 수 있었을까요?
        </p>
      </div>

      {/* 구독 선택 -- Premium card */}
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]">
        <div className="absolute inset-0 opacity-[0.012] pointer-events-none bg-[radial-gradient(circle_at_30%_70%,var(--color-foreground)_1px,transparent_1px)] bg-[length:20px_20px]" />

        <div className="flex items-center justify-between mb-5 relative">
          <h4 className="text-sm font-bold text-foreground">절약할 구독 선택</h4>
          <button
            onClick={handleSelectAll}
            className="text-xs font-bold text-primary hover:text-primary/80 transition-colors px-3 py-1 rounded-lg hover:bg-primary/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={selectedSubIds.size === activeSubscriptions.length ? '모든 구독 선택 해제' : '모든 구독 선택'}
          >
            {selectedSubIds.size === activeSubscriptions.length ? '전체 해제' : '전체 선택'}
          </button>
        </div>
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3 relative">
          {activeSubscriptions.map((sub) => {
            const isSelected = selectedSubIds.has(sub.id);
            return (
              <div
                key={sub.id}
                className={`flex items-center space-x-3 p-3.5 rounded-2xl transition-all duration-200 cursor-pointer border ${
                  isSelected
                    ? 'bg-primary/[0.05] border-primary/20 shadow-[0_0_0_1px_rgba(49,130,246,0.08)]'
                    : 'border-transparent hover:bg-accent/50'
                }`}
                onClick={() => handleToggle(sub.id)}
              >
                <Checkbox
                  id={`stock-sub-${sub.id}`}
                  checked={isSelected}
                  onCheckedChange={() => handleToggle(sub.id)}
                />
                <label htmlFor={`stock-sub-${sub.id}`} className="flex-1 cursor-pointer flex items-center gap-2.5">
                  <BrandIcon name={sub.name} icon={sub.icon} size="sm" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground">{sub.name}</div>
                    <div className="text-xs text-muted-foreground font-medium">{formatKRW(sub.monthlyPrice)}/월</div>
                  </div>
                </label>
              </div>
            );
          })}
        </div>

        {/* 월 절약액 뱃지 -- Premium accent */}
        <div className="mt-5 relative overflow-hidden rounded-2xl bg-primary/[0.04] border border-primary/10 p-5">
          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-[0.08] pointer-events-none bg-primary" />
          <div className="relative">
            <div className="text-[11px] text-muted-foreground font-semibold tracking-wide mb-1.5">월 투자 금액</div>
            <div className="text-[2rem] font-extrabold text-primary tracking-tight leading-none">
              {formatKRW(monthlySavings)}
            </div>
          </div>
        </div>
      </div>

      {/* 차트 영역 -- Premium chart card */}
      {monthlySavings > 0 && (
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.06)]">
          {/* Ambient glow */}
          <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full blur-[100px] opacity-[0.05] pointer-events-none bg-primary" />

          <div className="p-6 pb-0 relative">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-bold text-foreground">
                실제 주가 기반 적립식 투자 결과
              </h4>
              {/* Period toggle -- refined pill group */}
              <div className="flex gap-0.5 bg-muted/60 rounded-xl p-1 border border-border/40" role="group" aria-label="투자 기간 선택">
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setPeriod(opt.key)}
                    aria-pressed={period === opt.key}
                    aria-label={`${opt.label} 기간`}
                    className={`text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      period === opt.key
                        ? 'bg-card text-foreground shadow-[0_1px_4px_rgba(0,0,0,0.08)]'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium mb-5">
              네이버 금융 실제 주가 기반 · 매월 초 {formatKRW(monthlySavings)} 투자 가정
            </p>
          </div>

          <div className="px-4 pb-2">
            <ResponsiveContainer width="100%" height={360}>
              <AreaChart data={displayData}>
                <defs>
                  {STOCK_CONFIGS.map((config) => (
                    <linearGradient key={config.symbol} id={`grad-${config.symbol}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={config.color} stopOpacity={0.2} />
                      <stop offset="50%" stopColor={config.color} stopOpacity={0.05} />
                      <stop offset="100%" stopColor={config.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid
                  strokeDasharray="none"
                  stroke="var(--color-border, hsl(var(--border)))"
                  strokeOpacity={0.3}
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'var(--color-muted-foreground, #6b7280)', fontSize: 10, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: 'var(--color-muted-foreground, #6b7280)', fontSize: 10, fontWeight: 500 }}
                  tickFormatter={(v) => formatKRWCompact(v)}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-2xl border border-border/60 bg-card/95 backdrop-blur-md p-4 shadow-[0_8px_32px_rgba(0,0,0,0.12)]" style={{ minWidth: 200 }}>
                        <div className="text-[11px] font-bold text-muted-foreground mb-2.5">{label}</div>
                        {payload.map((entry: any) => (
                          <div key={entry.dataKey} className="flex items-center justify-between gap-4 mb-1.5 last:mb-0">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                              <span className="text-xs font-medium text-foreground">{entry.name}</span>
                            </div>
                            <span className="text-xs font-bold text-foreground tabular-nums">
                              {formatKRW(Math.round(entry.value))}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="원금"
                  name="원금"
                  stroke="#94a3b8"
                  fill="none"
                  strokeWidth={1.5}
                  strokeDasharray="6 3"
                  dot={false}
                />
                {STOCK_CONFIGS.map((config) => (
                  <Area
                    key={config.symbol}
                    type="monotone"
                    dataKey={config.name}
                    name={config.name}
                    stroke={config.color}
                    fill={`url(#grad-${config.symbol})`}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 2.5, stroke: config.color, fill: 'var(--color-card, white)' }}
                  />
                ))}
                <Legend
                  wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '12px' }}
                  iconType="circle"
                  iconSize={8}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* 최종 결과 카드 -- Premium result cards */}
          {lastPoint && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-6 pb-6 pt-2">
              {STOCK_CONFIGS.map((config) => {
                const finalValue = lastPoint[config.name] as number;
                const principal = lastPoint['원금'] as number;
                const returnPercent = Math.round(((finalValue / principal) - 1) * 100);

                return (
                  <div
                    key={config.symbol}
                    className="relative overflow-hidden rounded-2xl p-4 text-center border border-transparent"
                    style={{ backgroundColor: `${config.color}0A` }}
                  >
                    {/* Glow accent */}
                    <div
                      className="absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full blur-2xl opacity-15 pointer-events-none"
                      style={{ backgroundColor: config.color }}
                    />
                    <div className="relative">
                      <div
                        className="text-[10px] font-bold uppercase tracking-wider mb-1.5"
                        style={{ color: config.color }}
                      >
                        {config.name}
                      </div>
                      <div className="text-base font-extrabold text-foreground tabular-nums mb-0.5">
                        {formatKRWCompact(finalValue)}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-medium">
                        원금 {formatKRWCompact(principal)} 대비{' '}
                        <span className="font-bold" style={{ color: config.color }}>
                          {returnPercent > 0 ? '+' : ''}{returnPercent}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 감성 훅 메시지 -- Cinematic CTA */}
          {lastPoint && selectedSubIds.size > 0 && (
            <div className="mx-6 mb-6">
              <div className="relative overflow-hidden rounded-2xl bg-primary/[0.04] border border-primary/12 p-7 text-center">
                {/* Ambient glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-[80px] opacity-[0.06] pointer-events-none bg-primary" />
                <div className="relative">
                  <p className="text-[13px] font-semibold text-foreground/80 mb-3">
                    {Array.from(selectedSubIds)
                      .slice(0, 2)
                      .map((id) => activeSubscriptions.find((s) => s.id === id)?.name)
                      .filter(Boolean)
                      .join(', ')}{' '}
                    대신 투자했다면...
                  </p>
                  <p className="text-[1.75rem] sm:text-[2.5rem] font-extrabold text-primary tracking-tight leading-none mb-2">
                    {formatKRWCompact(lastPoint[STOCK_CONFIGS[1].name] as number)}
                  </p>
                  <p className="text-sm text-muted-foreground font-medium">
                    를 모을 수 있었어요 ({STOCK_CONFIGS[1].name} 기준, {selectedPeriod.label})
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="px-6 pb-5">
            <p className="text-[10px] text-muted-foreground/60 font-medium text-center">
              * 네이버 금융 실제 주가 기반 (2021.01~2026.02). 미래 수익을 보장하지 않으며 수수료/세금 미반영.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
