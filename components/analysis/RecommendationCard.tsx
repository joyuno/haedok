'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ROIAnalysis, RecommendAction } from '@/lib/types/usage';
import { formatKRW } from '@/lib/utils/formatCurrency';
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface RecommendationCardProps {
  analyses: ROIAnalysis[];
}

type GroupedRecommendation = {
  action: RecommendAction;
  title: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  analyses: ROIAnalysis[];
};

export function RecommendationCard({ analyses }: RecommendationCardProps) {
  const groups: GroupedRecommendation[] = [
    {
      action: 'cancel',
      title: '해지 추천',
      icon: <XCircle className="h-5 w-5" />,
      color: '#ef4444',
      bgColor: '#fef2f2',
      analyses: analyses.filter((a) => a.recommendation === 'cancel'),
    },
    {
      action: 'review',
      title: '검토 필요',
      icon: <AlertCircle className="h-5 w-5" />,
      color: '#f97316',
      bgColor: '#fff7ed',
      analyses: analyses.filter((a) => a.recommendation === 'review'),
    },
    {
      action: 'downgrade',
      title: '다운그레이드 추천',
      icon: <AlertCircle className="h-5 w-5" />,
      color: '#f59e0b',
      bgColor: '#fefce8',
      analyses: analyses.filter((a) => a.recommendation === 'downgrade'),
    },
    {
      action: 'share',
      title: '공유 전환 추천',
      icon: <RefreshCw className="h-5 w-5" />,
      color: '#3b82f6',
      bgColor: '#eff6ff',
      analyses: analyses.filter((a) => a.recommendation === 'share'),
    },
    {
      action: 'keep',
      title: '유지 추천',
      icon: <CheckCircle className="h-5 w-5" />,
      color: '#22c55e',
      bgColor: '#f0fdf4',
      analyses: analyses.filter((a) => a.recommendation === 'keep'),
    },
  ];

  const visibleGroups = groups.filter((g) => g.analyses.length > 0);

  if (visibleGroups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {visibleGroups.map((group) => (
        <Card key={group.action}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div style={{ color: group.color }}>{group.icon}</div>
              <CardTitle className="text-lg">{group.title}</CardTitle>
              <Badge variant="secondary">{group.analyses.length}개</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {group.analyses.map((analysis) => (
                <div
                  key={analysis.subscriptionId}
                  className="rounded-lg border p-4"
                  style={{
                    backgroundColor: group.bgColor,
                    borderColor: group.color,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{analysis.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">
                          {analysis.subscriptionName}
                        </h4>
                        <span className="text-sm text-muted-foreground">
                          {formatKRW(analysis.monthlyPrice)}/월
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {analysis.recommendationReason}
                      </p>
                      {analysis.potentialSavings > 0 && (
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <span className="text-sm font-semibold" style={{ color: group.color }}>
                            월 {formatKRW(analysis.potentialSavings)} 절약 가능
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            style={{
                              borderColor: group.color,
                              color: group.color,
                            }}
                          >
                            액션 실행
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
