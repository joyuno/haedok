'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatKRW } from '@/lib/utils/formatCurrency';
import type { BundleOptimization } from '@/lib/calculations/bundleOptimize';
import { BUNDLE_DEALS, type BundleDeal } from '@/lib/constants/bundleDeals';
import { Button } from '@/components/ui/button';
import { Package, TrendingDown, ArrowRight, ExternalLink, Sparkles } from 'lucide-react';
import { BrandIcon } from '@/components/subscription/BrandIcon';

interface BundleOptimizerProps {
  optimizations: BundleOptimization[];
}

function BundleDealCard({ deal, isRecommended }: { deal: BundleDeal; isRecommended?: boolean }) {
  return (
    <Card className={`overflow-hidden transition-all hover:shadow-md ${isRecommended ? 'border-primary/30 bg-primary/5' : ''}`}>
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="text-2xl shrink-0">{deal.icon || '📦'}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-base">{deal.name}</h4>
              {isRecommended && (
                <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0">
                  <Sparkles className="w-3 h-3 mr-0.5" />
                  추천
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{deal.provider}</p>
            <p className="text-sm text-foreground mt-2">{deal.description}</p>

            {/* Price */}
            <div className="mt-3 flex items-center gap-3">
              {deal.price > 0 ? (
                <span className="text-lg font-bold text-primary">{formatKRW(deal.price)}/월</span>
              ) : (
                <span className="text-lg font-bold text-green-600">요금제 포함</span>
              )}
              {deal.savingsEstimate && (
                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-950/30">
                  {deal.savingsEstimate}
                </Badge>
              )}
            </div>

            {/* Included Services */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {deal.includedServices.map((service, i) => (
                <Badge key={i} variant="secondary" className="text-xs font-normal">
                  {service}
                </Badge>
              ))}
            </div>

            {/* Note */}
            {deal.note && (
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{deal.note}</p>
            )}

            {/* Link */}
            {deal.url && (
              <a
                href={deal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 mt-3 w-full rounded-xl bg-primary/[0.08] hover:bg-primary/[0.15] text-primary text-sm font-bold py-2.5 transition-colors"
              >
                가입 페이지 이동 <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function BundleOptimizer({ optimizations }: BundleOptimizerProps) {
  const matchedBundleIds = new Set(optimizations.map((opt) => opt.bundle.id));
  const otherDeals = BUNDLE_DEALS.filter((deal) => !matchedBundleIds.has(deal.id));

  return (
    <div className="space-y-8">
      {/* Matched Optimizations - savings specific to user's subscriptions */}
      {optimizations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-bold">내 구독에 적용 가능한 번들</h3>
          </div>
          {optimizations.map((opt) => (
            <Card key={opt.bundle.id} className="overflow-hidden border-green-200 dark:border-green-800">
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-green-500/10 p-2">
                        <Package className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {opt.bundle.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {opt.bundle.provider}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-500 hover:bg-green-600 whitespace-nowrap">
                      월 {formatKRW(opt.monthlySavings)} 절약
                    </Badge>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="pt-4 space-y-4">
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm text-foreground leading-relaxed">
                    {opt.explanation}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">현재 비용</p>
                    <p className="text-lg font-bold line-through text-muted-foreground">
                      {formatKRW(opt.currentTotalCost)}
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">번들 가입 시</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatKRW(opt.bundleCost)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">
                    통합 가능한 내 구독 ({opt.matchedSubscriptions.length}개)
                  </p>
                  <div className="space-y-2">
                    {opt.matchedSubscriptions.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between text-sm bg-muted/30 rounded-lg p-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <BrandIcon name={sub.name} icon={sub.icon} size="sm" />
                          <span>{sub.name}</span>
                        </div>
                        <span className="text-muted-foreground">
                          {formatKRW(sub.monthlyPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t">
                  <TrendingDown className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-600">
                      연간 {formatKRW(opt.monthlySavings * 12)} 절약 가능
                    </p>
                  </div>
                </div>

                {opt.bundle.url && (
                  <a
                    href={opt.bundle.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="w-full rounded-xl font-bold mt-2" size="lg">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      번들 가입하러 가기
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* All Available Bundle Deals */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">
            {optimizations.length > 0 ? '기타 번들 딜 목록' : '전체 번들 딜 목록'}
          </h3>
          <Badge variant="secondary" className="text-xs">
            {otherDeals.length > 0 ? otherDeals.length : BUNDLE_DEALS.length}개
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground -mt-2">
          국내에서 이용 가능한 구독 번들 및 통신사 혜택 목록이에요
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {(optimizations.length > 0 ? otherDeals : BUNDLE_DEALS).map((deal) => (
            <BundleDealCard
              key={deal.id}
              deal={deal}
              isRecommended={matchedBundleIds.has(deal.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
