'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { ROIAnalysis } from '@/lib/types/usage';
import { ROI_GRADE_CONFIG } from '@/lib/types/usage';
import { formatKRW } from '@/lib/utils/formatCurrency';
import { formatMinutesToHM } from '@/lib/utils/formatDuration';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { BrandIcon } from '@/components/subscription/BrandIcon';

interface ROIScoreCardProps {
  analysis: ROIAnalysis;
}

export function ROIScoreCard({ analysis }: ROIScoreCardProps) {
  const gradeConfig = ROI_GRADE_CONFIG[analysis.grade];

  // Calculate progress value (A=100, B=80, C=60, D=40, F=20)
  const gradeValues = { A: 100, B: 80, C: 60, D: 40, F: 20 };
  const progressValue = gradeValues[analysis.grade];

  const getRecommendIcon = () => {
    switch (analysis.recommendation) {
      case 'keep':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'cancel':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <BrandIcon name={analysis.subscriptionName} icon={analysis.icon} size="md" />
            <div>
              <CardTitle className="text-lg">{analysis.subscriptionName}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                월 {formatKRW(analysis.monthlyPrice)}
              </p>
            </div>
          </div>
          <Badge
            className={`text-lg font-bold ${gradeConfig.badgeClass}`}
          >
            {gradeConfig.emoji} {analysis.grade}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">가성비 점수</span>
            <span className={`font-semibold ${gradeConfig.textClass}`}>
              {gradeConfig.label}
            </span>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">주간 사용시간</p>
            <p className="text-lg font-semibold">
              {formatMinutesToHM(analysis.weeklyUsageMinutes)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">시간당 비용</p>
            <p className="text-lg font-semibold">
              {analysis.costPerMinute > 0 ? formatKRW(analysis.costPerMinute * 60, 1) : '-'}
            </p>
          </div>
        </div>

        <div
          className={`rounded-lg border p-3 flex items-start gap-2 ${gradeConfig.blockClass}`}
        >
          {getRecommendIcon()}
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">추천 액션</p>
            <p className="text-sm text-muted-foreground">
              {analysis.recommendationReason}
            </p>
            {analysis.potentialSavings > 0 && (
              <p className={`text-sm font-semibold mt-2 ${gradeConfig.textClass}`}>
                절약 가능 금액: 월 {formatKRW(analysis.potentialSavings)}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
