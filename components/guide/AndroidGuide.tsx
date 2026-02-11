'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AndroidGuide() {
  const steps = [
    {
      number: 1,
      title: '설정 앱 열기',
      description: 'Android 스마트폰에서 "설정" 앱을 엽니다.',
      icon: '⚙️',
    },
    {
      number: 2,
      title: '디지털 웰빙 선택',
      description: '설정에서 "디지털 웰빙 및 자녀 보호 기능"을 탭합니다.',
      icon: '🧘',
    },
    {
      number: 3,
      title: '대시보드 진입',
      description: '상단의 그래프를 탭하여 전체 대시보드로 이동합니다.',
      icon: '📊',
    },
    {
      number: 4,
      title: '앱별 사용시간 확인',
      description: '스크롤하여 각 앱의 사용 시간과 열람 횟수를 확인합니다.',
      icon: '📱',
    },
    {
      number: 5,
      title: 'SubScout에 입력',
      description:
        '구독 앱의 사용 시간을 SubScout 대시보드에 입력하여 가치를 분석하세요.',
      icon: '✅',
    },
  ];

  const bonusApps = [
    {
      name: 'ActionDash',
      description: '더 자세한 통계와 CSV 내보내기 기능을 제공하는 무료 앱',
      features: ['상세한 사용 통계', 'CSV 파일 내보내기', '사용 패턴 분석'],
      icon: '📈',
    },
    {
      name: 'StayFree',
      description: '앱 사용 시간 추적 및 자동 제한 기능',
      features: ['실시간 추적', '앱 사용 알림', '데이터 내보내기'],
      icon: '⏱️',
    },
  ];

  const tips = [
    {
      title: '디지털 웰빙이 없는 경우',
      content:
        '일부 제조사(삼성, LG 등)는 자체 기능을 사용합니다. 삼성의 경우 "설정 > 배터리 및 디바이스 케어 > 앱 사용 시간"에서 확인할 수 있어요.',
    },
    {
      title: '권한 허용 필요',
      content:
        '디지털 웰빙이 제대로 작동하려면 "사용 데이터 액세스" 권한이 필요합니다. 최초 실행 시 권한을 허용해주세요.',
    },
    {
      title: '주간 데이터 확인',
      content:
        '대시보드 상단의 날짜를 변경하여 지난 주 또는 특정 기간의 사용 시간을 확인할 수 있습니다.',
    },
    {
      title: '제조사별 차이',
      content:
        'Android 제조사마다 메뉴 이름이 다를 수 있습니다. "디지털 웰빙", "스크린 타임", "앱 타이머" 등을 찾아보세요.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-green-500/10 p-3">
              <Smartphone className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">
                Android 디지털 웰빙 가이드
              </h3>
              <p className="text-muted-foreground">
                Android 9.0 (Pie) 이상 기기에서 앱 사용 시간을 확인하는 방법을
                안내합니다.
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
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bonus Apps Section */}
      <Card className="border-2 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Download className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">보너스: 추천 서드파티 앱</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            더 상세한 분석을 원한다면 다음 앱들을 활용해보세요:
          </p>
          <div className="space-y-4">
            {bonusApps.map((app, index) => (
              <div key={index} className="rounded-lg border bg-card p-4">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-3xl">{app.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{app.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {app.description}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {app.features.map((feature, idx) => (
                    <Badge key={idx} variant="secondary">
                      {feature}
                    </Badge>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Google Play에서 다운로드
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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

      {/* Samsung Specific Note */}
      <Card className="border-dashed">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📱</span>
            <div>
              <h4 className="font-medium mb-2">삼성 갤럭시 사용자</h4>
              <p className="text-sm text-muted-foreground mb-2">
                삼성 기기는 다음 경로에서 앱 사용 시간을 확인할 수 있습니다:
              </p>
              <div className="rounded bg-muted/50 p-3 font-mono text-sm">
                설정 → 배터리 및 디바이스 케어 → 앱 사용 시간
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
