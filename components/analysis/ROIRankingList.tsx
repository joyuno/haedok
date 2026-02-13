'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ROIAnalysis } from '@/lib/types/usage';
import { ROI_GRADE_CONFIG } from '@/lib/types/usage';
import { formatKRW } from '@/lib/utils/formatCurrency';
import { TrendingDown } from 'lucide-react';
import { BrandIcon } from '@/components/subscription/BrandIcon';

interface ROIRankingListProps {
  analyses: ROIAnalysis[];
}

export function ROIRankingList({ analyses }: ROIRankingListProps) {
  // Sort by grade (A to F)
  const gradeOrder = { A: 5, B: 4, C: 3, D: 2, F: 1 };
  const sortedAnalyses = [...analyses].sort(
    (a, b) => gradeOrder[b.grade] - gradeOrder[a.grade],
  );

  const totalSavings = analyses.reduce(
    (sum, analysis) => sum + analysis.potentialSavings,
    0,
  );

  const maxCostPerMinute = Math.max(
    ...analyses.map((a) => a.costPerMinute).filter((c) => c > 0),
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>ROI 랭킹</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              가성비가 좋은 순서대로 정렬됩니다
            </p>
          </div>
          {totalSavings > 0 && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">절약 가능 금액</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatKRW(totalSavings)}/월
              </p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedAnalyses.map((analysis, index) => {
            const gradeConfig = ROI_GRADE_CONFIG[analysis.grade];
            const barWidth =
              analysis.costPerMinute > 0 && maxCostPerMinute > 0
                ? (analysis.costPerMinute / maxCostPerMinute) * 100
                : 0;

            return (
              <div
                key={analysis.subscriptionId}
                className="rounded-lg border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-bold">
                    {index + 1}
                  </div>
                  <BrandIcon name={analysis.subscriptionName} icon={analysis.icon} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {analysis.subscriptionName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatKRW(analysis.monthlyPrice)}/월
                    </p>
                  </div>
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black shrink-0 shadow-sm ${gradeConfig.badgeClass}`}
                    style={{ color: gradeConfig.color, border: `2px solid ${gradeConfig.color}20` }}
                    role="img"
                    aria-label={`등급 ${analysis.grade}`}
                  >
                    {analysis.grade}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {analysis.metricType === 'time' ? '시간당 비용' : analysis.metricType === 'count' ? '회당 비용' : '일당 비용'}
                    </span>
                    <span className="font-medium">
                      {analysis.costPerMinute > 0
                        ? analysis.costEfficiencyLabel
                        : '미사용'}
                    </span>
                  </div>

                  <div className="relative h-2 bg-muted rounded-full overflow-hidden" role="meter" aria-label={analysis.metricType === 'time' ? '시간당 비용' : analysis.metricType === 'count' ? '회당 비용' : '일당 비용'} aria-valuenow={Math.round(barWidth)} aria-valuemin={0} aria-valuemax={100}>
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: gradeConfig.color,
                      }}
                    />
                  </div>

                  {analysis.potentialSavings > 0 && (
                    <div
                      className={`flex items-center gap-2 text-sm mt-2 p-2 rounded-md ${gradeConfig.blockClass} ${gradeConfig.textClass}`}
                    >
                      <TrendingDown className="h-4 w-4" />
                      <span className="font-medium">
                        절약 가능: {formatKRW(analysis.potentialSavings)}/월
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
