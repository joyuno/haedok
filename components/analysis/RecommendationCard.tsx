'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ROIAnalysis, RecommendAction } from '@/lib/types/usage';
import { formatKRW } from '@/lib/utils/formatCurrency';
import { AlertCircle, CheckCircle, XCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { BrandIcon } from '@/components/subscription/BrandIcon';
import { getServicePreset } from '@/lib/constants/servicePresets';

interface RecommendationCardProps {
  analyses: ROIAnalysis[];
}

type GroupedRecommendation = {
  action: RecommendAction;
  title: string;
  icon: React.ReactNode;
  cardClass: string;
  textClass: string;
  badgeClass: string;
  analyses: ROIAnalysis[];
};

export function RecommendationCard({ analyses }: RecommendationCardProps) {
  const groups: GroupedRecommendation[] = [
    {
      action: 'cancel',
      title: '해지 추천',
      icon: <XCircle className="h-5 w-5" />,
      cardClass: 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800',
      textClass: 'text-red-600 dark:text-red-400',
      badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
      analyses: analyses.filter((a) => a.recommendation === 'cancel'),
    },
    {
      action: 'review',
      title: '검토 필요',
      icon: <AlertCircle className="h-5 w-5" />,
      cardClass: 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800',
      textClass: 'text-orange-600 dark:text-orange-400',
      badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
      analyses: analyses.filter((a) => a.recommendation === 'review'),
    },
    {
      action: 'downgrade',
      title: '다운그레이드 추천',
      icon: <AlertCircle className="h-5 w-5" />,
      cardClass: 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800',
      textClass: 'text-amber-600 dark:text-amber-400',
      badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
      analyses: analyses.filter((a) => a.recommendation === 'downgrade'),
    },
    {
      action: 'share',
      title: '공유 전환 추천',
      icon: <RefreshCw className="h-5 w-5" />,
      cardClass: 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800',
      textClass: 'text-blue-600 dark:text-blue-400',
      badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      analyses: analyses.filter((a) => a.recommendation === 'share'),
    },
    {
      action: 'keep',
      title: '유지 추천',
      icon: <CheckCircle className="h-5 w-5" />,
      cardClass: 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800',
      textClass: 'text-green-600 dark:text-green-400',
      badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
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
              <div className={group.textClass} aria-hidden="true">{group.icon}</div>
              <CardTitle className="text-lg">{group.title}</CardTitle>
              <Badge variant="secondary">{group.analyses.length}개</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {group.analyses.map((analysis) => (
                <div
                  key={analysis.subscriptionId}
                  className={`rounded-lg border p-4 ${group.cardClass}`}
                >
                  <div className="flex items-start gap-3">
                    <BrandIcon name={analysis.subscriptionName} icon={analysis.icon} size="sm" />
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
                      {analysis.potentialSavings > 0 && (() => {
                        const preset = getServicePreset(analysis.subscriptionName);
                        const actionUrl = preset?.cancellationUrl;
                        const actionLabel: Record<RecommendAction, string> = {
                          cancel: '해지하러 가기',
                          review: '요금제 확인하기',
                          downgrade: '요금제 변경하기',
                          share: '공유 전환하기',
                          keep: '관리 페이지 가기',
                        };
                        return (
                          <div className="flex items-center justify-between mt-3 pt-3 border-t">
                            <span className={`text-sm font-semibold ${group.textClass}`}>
                              월 {formatKRW(analysis.potentialSavings)} 절약 가능
                            </span>
                            {actionUrl ? (
                              <a href={actionUrl} target="_blank" rel="noopener noreferrer">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className={`border-current ${group.textClass}`}
                                >
                                  {actionLabel[group.action]} <ExternalLink className="w-3.5 h-3.5 ml-1" aria-hidden="true" />
                                </Button>
                              </a>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className={`border-current ${group.textClass}`}
                                disabled
                              >
                                {actionLabel[group.action]}
                              </Button>
                            )}
                          </div>
                        );
                      })()}
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
