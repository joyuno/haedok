'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ROIAnalysis } from '@/lib/types/usage';
import { analyzeBenchmark } from '@/lib/calculations/benchmark';
import { formatMinutesToHM } from '@/lib/utils/formatDuration';

interface BenchmarkComparisonProps {
  analyses: ROIAnalysis[];
}

export function BenchmarkComparison({ analyses }: BenchmarkComparisonProps) {
  const benchmarkData = analyses
    .map((analysis) => {
      const benchmark = analyzeBenchmark(
        analysis.subscriptionName,
        analysis.weeklyUsageMinutes,
      );
      return benchmark ? { analysis, benchmark } : null;
    })
    .filter((item) => item !== null);

  if (benchmarkData.length === 0) {
    return null;
  }

  const levelConfig = {
    heavy: {
      label: '헤비 유저',
      color: '#8b5cf6',
      bgColor: '#f5f3ff',
    },
    average: {
      label: '평균 수준',
      color: '#22c55e',
      bgColor: '#f0fdf4',
    },
    below: {
      label: '평균 이하',
      color: '#f59e0b',
      bgColor: '#fefce8',
    },
    minimal: {
      label: '거의 미사용',
      color: '#ef4444',
      bgColor: '#fef2f2',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>평균 사용량 비교</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          한국 평균 사용량과 비교한 결과입니다
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {benchmarkData.map(({ analysis, benchmark }) => {
            const config = levelConfig[benchmark!.level];
            const userPercent =
              benchmark!.averageMinutes > 0
                ? (analysis.weeklyUsageMinutes / benchmark!.averageMinutes) * 100
                : 0;
            const avgPercent = 100;

            return (
              <div
                key={analysis.subscriptionId}
                className="rounded-lg border p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{analysis.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold">{analysis.subscriptionName}</h4>
                    <p className="text-xs text-muted-foreground">
                      {benchmark!.feedback}
                    </p>
                  </div>
                  <Badge
                    style={{
                      backgroundColor: config.bgColor,
                      color: config.color,
                      borderColor: config.color,
                    }}
                  >
                    {config.label}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">내 사용량</span>
                      <span className="font-medium">
                        주 {formatMinutesToHM(analysis.weeklyUsageMinutes)}
                      </span>
                    </div>
                    <div className="relative h-8 bg-muted rounded-md overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 flex items-center justify-end px-2 text-xs font-medium text-white rounded-md transition-all"
                        style={{
                          width: `${Math.min(userPercent, 100)}%`,
                          backgroundColor: config.color,
                        }}
                      >
                        {Math.round(userPercent)}%
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">한국 평균</span>
                      <span className="font-medium">
                        주 {formatMinutesToHM(benchmark!.averageMinutes)}
                      </span>
                    </div>
                    <div className="relative h-8 bg-muted rounded-md overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 flex items-center justify-end px-2 text-xs font-medium text-white bg-gray-400 rounded-md"
                        style={{
                          width: `${avgPercent}%`,
                        }}
                      >
                        100%
                      </div>
                    </div>
                  </div>

                  <div className="text-center pt-2 border-t">
                    <span className="text-lg font-bold" style={{ color: config.color }}>
                      평균 대비 {benchmark!.percentOfAverage}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
