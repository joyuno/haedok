'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  UsageInputForm,
  ROIScoreCard,
  ROIRankingList,
  RecommendationCard,
  BenchmarkComparison,
  CsvUploader,
  SavingsReport,
  PersonalizedROICalculator,
} from '@/components/analysis';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useUsageStore } from '@/stores/usageStore';
import { PackageOpen, TrendingUp, Upload, Sparkles, RefreshCw, ChevronDown, ChevronUp, Calculator } from 'lucide-react';
import Link from 'next/link';

export default function AnalysisPage() {
  const { subscriptions, getActiveSubscriptions } = useSubscriptionStore();
  const { generateROIAnalysis, usageRecords } = useUsageStore();
  const [showInputForm, setShowInputForm] = useState(false);
  const [showCsvUploader, setShowCsvUploader] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const activeSubscriptions = getActiveSubscriptions();
  const hasSubscriptions = activeSubscriptions.length > 0;
  const hasUsageData = usageRecords.length > 0;

  const roiAnalyses = hasUsageData
    ? generateROIAnalysis(subscriptions)
    : [];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const onboarded = localStorage.getItem('haedok-analysis-onboarded');
      if (!onboarded && hasSubscriptions) {
        setShowOnboarding(true);
      }
    }
  }, [hasSubscriptions]);

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
    localStorage.setItem('haedok-analysis-onboarded', 'true');
  };

  const handleInputComplete = () => {
    setShowInputForm(false);
    setShowCsvUploader(false);
  };

  // Onboarding dialog shared across states
  const onboardingDialog = (
    <Dialog open={showOnboarding} onOpenChange={(open) => { if (!open) handleOnboardingClose(); }}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            이용량 데이터로 분석을 시작하세요
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="flex items-start gap-4">
            <span className="text-2xl shrink-0">📱</span>
            <div>
              <p className="font-medium">스크린타임에서 각 서비스 사용 시간 확인</p>
              <Link href="/guide" className="text-sm text-primary hover:underline">
                확인 방법 보기 →
              </Link>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <span className="text-2xl shrink-0">⏱️</span>
            <div>
              <p className="font-medium">주간 사용 시간을 아래 폼에 입력</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <span className="text-2xl shrink-0">📊</span>
            <div>
              <p className="font-medium">AI가 가성비를 분석해 추천을 제공</p>
            </div>
          </div>
        </div>
        <Button
          size="lg"
          onClick={handleOnboardingClose}
          className="w-full rounded-xl font-semibold mt-2"
        >
          시작하기
        </Button>
      </DialogContent>
    </Dialog>
  );

  if (!hasSubscriptions) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-4xl font-bold mb-8">ROI 분석</h1>
        <Card className="border-dashed rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <PackageOpen className="h-20 w-20 text-muted-foreground/30 mb-6" />
            <h3 className="text-2xl font-bold mb-3">
              등록된 구독이 없습니다
            </h3>
            <p className="text-muted-foreground mb-8 text-center text-lg">
              먼저 구독 서비스를 추가해주세요
            </p>
            <Link href="/subscriptions">
              <Button size="lg" className="rounded-xl font-semibold px-8 py-6">
                구독 추가하러 가기
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasUsageData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {onboardingDialog}

        <h1 className="text-4xl font-bold mb-3">ROI 분석</h1>
        <p className="text-muted-foreground mb-8 text-lg">
          사용량 데이터를 입력하고 구독의 가성비를 분석하세요
        </p>

        <Card className="border-dashed mb-6 rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <TrendingUp className="h-20 w-20 text-muted-foreground/30 mb-6" />
            <h3 className="text-2xl font-bold mb-3">
              사용량 데이터가 없습니다
            </h3>
            <p className="text-muted-foreground mb-8 text-center max-w-md text-lg">
              각 구독의 주간 사용 시간을 입력하면 ROI 분석 결과를 확인할 수
              있습니다
            </p>
            <div className="flex gap-4">
              <Button
                size="lg"
                onClick={() => setShowInputForm(true)}
                className="rounded-xl font-semibold px-8 py-6 text-base"
              >
                직접 입력하기
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowCsvUploader(true)}
                className="rounded-xl font-semibold px-8 py-6"
              >
                <Upload className="mr-2 h-5 w-5" />
                CSV 업로드
              </Button>
            </div>
          </CardContent>
        </Card>

        {showInputForm && (
          <UsageInputForm
            subscriptions={activeSubscriptions}
            onComplete={handleInputComplete}
          />
        )}

        {showCsvUploader && (
          <CsvUploader onComplete={handleInputComplete} />
        )}
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      {onboardingDialog}

      {/* Clean header - title and description only */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-2">ROI 분석</h1>
        <p className="text-muted-foreground text-lg">
          구독 서비스의 가성비를 분석한 결과입니다
        </p>
      </div>

      {/* Always-visible usage update card */}
      <Card className="mb-8 rounded-2xl border-primary/20 bg-primary/[0.03]">
        <CardContent className="py-4 px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-primary/10">
                <RefreshCw className="h-4.5 w-4.5 text-primary" />
              </div>
              <span className="font-medium text-sm sm:text-base">
                이번 주 사용량을 업데이트하세요
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCsvUploader(!showCsvUploader);
                  if (!showCsvUploader) setShowInputForm(false);
                }}
                className="rounded-lg font-medium text-xs h-8 px-3"
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                CSV
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setShowInputForm(!showInputForm);
                  if (!showInputForm) setShowCsvUploader(false);
                }}
                className="rounded-lg font-medium text-xs h-8 px-4"
              >
                {showInputForm ? (
                  <>
                    접기
                    <ChevronUp className="ml-1.5 h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    직접 입력
                    <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Inline expandable input form */}
          {showInputForm && (
            <div className="mt-5 pt-5 border-t">
              <UsageInputForm
                subscriptions={activeSubscriptions}
                onComplete={handleInputComplete}
              />
            </div>
          )}

          {/* Inline expandable CSV uploader */}
          {showCsvUploader && (
            <div className="mt-5 pt-5 border-t">
              <CsvUploader onComplete={handleInputComplete} />
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 rounded-xl p-1.5 bg-accent overflow-x-auto">
          <TabsTrigger value="overview" className="rounded-lg font-semibold">
            개요
          </TabsTrigger>
          <TabsTrigger value="ranking" className="rounded-lg font-semibold">
            랭킹
          </TabsTrigger>
          <TabsTrigger
            value="recommendations"
            className="rounded-lg font-semibold"
          >
            추천
          </TabsTrigger>
          <TabsTrigger value="benchmark" className="rounded-lg font-semibold">
            평균 비교
          </TabsTrigger>
          <TabsTrigger value="personalized" className="rounded-lg font-semibold">
            <Calculator className="mr-1 h-3.5 w-3.5" />
            맞춤 계산
          </TabsTrigger>
          <TabsTrigger value="savings" className="rounded-lg font-semibold">
            <Sparkles className="mr-1 h-3.5 w-3.5" />
            절약 보고서
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roiAnalyses.map((analysis) => (
              <ROIScoreCard key={analysis.subscriptionId} analysis={analysis} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ranking">
          <ROIRankingList analyses={roiAnalyses} />
        </TabsContent>

        <TabsContent value="recommendations">
          <RecommendationCard analyses={roiAnalyses} />
        </TabsContent>

        <TabsContent value="benchmark">
          <BenchmarkComparison analyses={roiAnalyses} />
        </TabsContent>

        <TabsContent value="personalized">
          <PersonalizedROICalculator />
        </TabsContent>

        <TabsContent value="savings">
          <SavingsReport />
        </TabsContent>
      </Tabs>
    </main>
  );
}
