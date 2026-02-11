'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  UsageInputForm,
  ROIScoreCard,
  ROIRankingList,
  RecommendationCard,
  BenchmarkComparison,
  CsvUploader,
  SavingsReport,
} from '@/components/analysis';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useUsageStore } from '@/stores/usageStore';
import { PackageOpen, TrendingUp, Upload, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function AnalysisPage() {
  const { subscriptions, getActiveSubscriptions } = useSubscriptionStore();
  const { generateROIAnalysis, usageRecords } = useUsageStore();
  const [showInputForm, setShowInputForm] = useState(false);
  const [showCsvUploader, setShowCsvUploader] = useState(false);

  const activeSubscriptions = getActiveSubscriptions();
  const hasSubscriptions = activeSubscriptions.length > 0;
  const hasUsageData = usageRecords.length > 0;

  const roiAnalyses = hasUsageData
    ? generateROIAnalysis(subscriptions)
    : [];

  const handleInputComplete = () => {
    setShowInputForm(false);
    setShowCsvUploader(false);
  };

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
                className="rounded-xl font-semibold px-8 py-6"
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">ROI 분석</h1>
          <p className="text-muted-foreground text-lg">
            구독 서비스의 가성비를 분석한 결과입니다
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowCsvUploader(true)}
            className="rounded-xl font-semibold"
          >
            <Upload className="mr-2 h-4 w-4" />
            CSV 업로드
          </Button>
          <Button
            onClick={() => setShowInputForm(true)}
            className="rounded-xl font-semibold"
          >
            사용량 업데이트
          </Button>
        </div>
      </div>

      {showInputForm && (
        <div className="mb-8">
          <UsageInputForm
            subscriptions={activeSubscriptions}
            onComplete={handleInputComplete}
          />
        </div>
      )}

      {showCsvUploader && (
        <div className="mb-8">
          <CsvUploader onComplete={handleInputComplete} />
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 rounded-xl p-1.5 bg-accent">
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

        <TabsContent value="savings">
          <SavingsReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
