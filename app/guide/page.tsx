'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { IOSGuide, AndroidGuide } from '@/components/guide';
import { BookOpen, Smartphone, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function GuidePage() {
  const faqs = [
    {
      question: '스크린 타임 데이터는 어떻게 활용되나요?',
      answer:
        'SubScout은 앱 사용 시간을 분석하여 구독 대비 실제 사용 가치를 계산합니다. 사용하지 않는 구독을 찾아내고, 자주 사용하는 서비스는 더 저렴한 요금제나 공유 방법을 제안해드려요.',
    },
    {
      question: '데이터가 수집되거나 외부로 전송되나요?',
      answer:
        '아니요. SubScout은 모든 데이터를 사용자 기기에만 저장합니다. 사용 시간 데이터는 사용자가 직접 입력하며, 서버로 전송되지 않아요.',
    },
    {
      question: '매번 수동으로 입력해야 하나요?',
      answer:
        '네, 현재는 수동 입력만 지원합니다. iOS와 Android 모두 API 제한으로 자동 추적이 불가능하지만, 일주일에 한 번만 업데이트해도 충분히 정확한 분석이 가능해요.',
    },
    {
      question: '어떤 구독 서비스가 지원되나요?',
      answer:
        'Netflix, Disney+, Spotify, YouTube 프리미엄 등 주요 OTT, 음악, 클라우드, 생산성 구독 서비스를 모두 지원합니다. 사전 등록되지 않은 서비스도 직접 추가할 수 있어요.',
    },
    {
      question: '공유 파티는 안전한가요?',
      answer:
        'SubScout의 공유 파티는 계정 정보를 공유하지 않습니다. 초대 코드를 통해 신뢰할 수 있는 지인들과만 파티를 구성하세요. 실제 계정 공유는 각 서비스의 약관을 확인 후 진행해주세요.',
    },
    {
      question: '스크린 타임이 비활성화되어 있어요',
      answer:
        'iOS: 설정 > 스크린 타임 > "스크린 타임 켜기"를 선택하세요. Android: 설정 > 디지털 웰빙에서 활성화할 수 있습니다. 일부 제조사는 메뉴 이름이 다를 수 있어요.',
    },
    {
      question: '사용 시간이 0으로 표시돼요',
      answer:
        '스크린 타임이나 디지털 웰빙을 처음 켠 경우, 데이터가 쌓이는데 하루 정도 시간이 걸립니다. 24시간 후 다시 확인해보세요.',
    },
    {
      question: '여러 기기를 사용하는 경우는요?',
      answer:
        'iOS의 경우 iCloud 동기화로 모든 기기의 사용 시간이 합산됩니다. Android는 기기별로 확인 후 합산해야 해요.',
    },
  ];

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-3 flex items-center gap-3">
          <BookOpen className="h-9 w-9" />
          사용 가이드
        </h1>
        <p className="text-muted-foreground text-lg">
          앱 사용 시간을 확인하고 SubScout을 최대한 활용하는 방법
        </p>
      </div>

      {/* Platform Guides */}
      <Tabs defaultValue="ios" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 rounded-xl p-1.5 bg-accent">
          <TabsTrigger
            value="ios"
            className="flex items-center gap-2 rounded-lg font-semibold"
          >
            <Smartphone className="h-4 w-4" />
            iOS (iPhone/iPad)
          </TabsTrigger>
          <TabsTrigger
            value="android"
            className="flex items-center gap-2 rounded-lg font-semibold"
          >
            <Smartphone className="h-4 w-4" />
            Android
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ios">
          <IOSGuide />
        </TabsContent>

        <TabsContent value="android">
          <AndroidGuide />
        </TabsContent>
      </Tabs>

      {/* FAQ Section */}
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <HelpCircle className="h-7 w-7" />
          <h2 className="text-3xl font-bold">자주 묻는 질문</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index} className="rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Badge
                    variant="outline"
                    className="mt-0.5 rounded-lg font-semibold"
                  >
                    Q{index + 1}
                  </Badge>
                  <div className="flex-1 space-y-3">
                    <h3 className="font-bold text-lg">{faq.question}</h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Additional Help */}
      <Card className="border-dashed rounded-2xl">
        <CardContent className="p-8 text-center">
          <h3 className="font-bold text-xl mb-3">더 궁금한 점이 있으신가요?</h3>
          <p className="text-base text-muted-foreground mb-6">
            SubScout 팀에 문의하시면 빠르게 도와드릴게요
          </p>
          <div className="flex justify-center gap-3">
            <a
              href="mailto:support@subscout.com"
              className="inline-flex items-center justify-center rounded-xl text-base font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground px-8 py-4"
            >
              이메일 문의
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
