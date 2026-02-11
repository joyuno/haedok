'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Clock, ChevronDown } from 'lucide-react';

export function IOSGuide() {
  const steps = [
    {
      number: 1,
      title: '설정 앱 열기',
      description: 'iPhone 또는 iPad에서 "설정" 앱을 엽니다.',
      icon: '⚙️',
    },
    {
      number: 2,
      title: '스크린 타임 선택',
      description: '설정 메뉴에서 "스크린 타임"을 탭합니다.',
      icon: '⏰',
    },
    {
      number: 3,
      title: '모든 활동 보기',
      description: '화면 중앙의 "모든 활동 보기"를 클릭합니다.',
      icon: '📊',
    },
    {
      number: 4,
      title: '기간 선택',
      description: '상단에서 "지난 주" 또는 "지난 7일"을 선택합니다.',
      icon: '📅',
    },
    {
      number: 5,
      title: '앱별 사용시간 확인',
      description: '스크롤하여 각 앱의 사용 시간을 확인합니다.',
      icon: '📱',
    },
    {
      number: 6,
      title: 'SubScout에 입력',
      description:
        '구독 앱의 사용 시간을 SubScout 대시보드에 입력하여 가치를 분석하세요.',
      icon: '✅',
    },
  ];

  const tips = [
    {
      title: '스크린 타임이 비활성화된 경우',
      content:
        '설정 > 스크린 타임 > "스크린 타임 켜기"를 눌러 먼저 활성화해야 합니다.',
    },
    {
      title: '앱 카테고리별 확인',
      content:
        '스크린 타임은 앱을 카테고리별로 분류합니다. "엔터테인먼트" 카테고리에서 대부분의 OTT 앱을 찾을 수 있어요.',
    },
    {
      title: '정확한 측정을 위해',
      content: '최소 일주일 이상의 데이터를 확인하면 더 정확한 평균 사용 시간을 알 수 있습니다.',
    },
    {
      title: '가족 공유 계정',
      content:
        'iPhone의 가족 공유 기능을 사용하면 자녀의 스크린 타임도 확인할 수 있습니다.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-blue-500/10 p-3">
              <Smartphone className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">iOS 스크린 타임 가이드</h3>
              <p className="text-muted-foreground">
                iPhone이나 iPad에서 앱 사용 시간을 확인하는 방법을 안내합니다.
                iOS 12 이상의 모든 기기에서 사용 가능합니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step by Step Guide */}
      <div className="space-y-4">
        {steps.map((step) => (
          <Card key={step.number} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-start gap-4 p-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="rounded-full bg-primary text-primary-foreground w-10 h-10 flex items-center justify-center font-bold">
                    {step.number}
                  </div>
                  {step.number < steps.length && (
                    <div className="w-0.5 h-12 bg-border" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{step.icon}</span>
                    <h4 className="font-semibold text-lg">{step.title}</h4>
                  </div>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                {step.number < steps.length && (
                  <ChevronDown className="h-5 w-5 text-muted-foreground mt-3" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tips Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">💡</span>
            <h3 className="text-lg font-semibold">유용한 팁</h3>
          </div>
          <div className="space-y-4">
            {tips.map((tip, index) => (
              <div key={index} className="rounded-lg bg-muted/50 p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Badge variant="outline">{index + 1}</Badge>
                  {tip.title}
                </h4>
                <p className="text-sm text-muted-foreground">{tip.content}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Card className="border-dashed">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium mb-2">스크린 타임 데이터 주기</h4>
              <p className="text-sm text-muted-foreground">
                스크린 타임은 실시간으로 업데이트되며, 자정을 기준으로 일일 데이터가 초기화됩니다.
                "지난 주" 데이터를 보면 더 정확한 평균을 확인할 수 있어요.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
