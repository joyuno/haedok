'use client';

import { useMemo, useState } from 'react';
import { Calculator, TrendingUp, TrendingDown, Minus, Sparkles, Info } from 'lucide-react';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { getServicePreset } from '@/lib/constants/servicePresets';
import { calculatePersonalizedROI } from '@/lib/calculations/personalizedROI';
import type { PersonalizedROIResult } from '@/lib/calculations/personalizedROI';
import { formatKRW } from '@/lib/utils/formatCurrency';
import { BrandIcon } from '@/components/subscription/BrandIcon';
import { Card, CardContent } from '@/components/ui/card';

export function PersonalizedROICalculator() {
  const { getActiveSubscriptions } = useSubscriptionStore();

  // State: Record<subscription.id, Record<fieldKey, fieldValue>>
  const [inputValues, setInputValues] = useState<Record<string, Record<string, number>>>({});

  // Filter subscriptions that have personalizedROI config
  const eligibleSubscriptions = useMemo(() => {
    const activeSubscriptions = getActiveSubscriptions();
    return activeSubscriptions
      .map((sub) => {
        const preset = getServicePreset(sub.name);
        if (!preset?.personalizedROI) return null;
        return { subscription: sub, preset };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [getActiveSubscriptions]);

  // Initialize default values on first render
  useMemo(() => {
    const initialValues: Record<string, Record<string, number>> = {};
    eligibleSubscriptions.forEach(({ subscription, preset }) => {
      const config = preset.personalizedROI!;
      const defaults: Record<string, number> = {};
      config.fields.forEach((field) => {
        if (field.defaultValue !== undefined) {
          defaults[field.key] = field.defaultValue;
        }
      });
      if (Object.keys(defaults).length > 0) {
        initialValues[subscription.id] = defaults;
      }
    });
    if (Object.keys(initialValues).length > 0) {
      setInputValues((prev) => ({ ...prev, ...initialValues }));
    }
  }, [eligibleSubscriptions]);

  const handleInputChange = (subscriptionId: string, fieldKey: string, value: string) => {
    // Parse numeric value (remove commas for currency type)
    const numericValue = value.replace(/,/g, '');
    const parsed = parseFloat(numericValue);

    setInputValues((prev) => ({
      ...prev,
      [subscriptionId]: {
        ...(prev[subscriptionId] || {}),
        [fieldKey]: isNaN(parsed) ? 0 : parsed,
      },
    }));
  };

  // No eligible subscriptions - return null
  if (eligibleSubscriptions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-extrabold flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/[0.08] flex items-center justify-center">
            <Calculator className="h-4.5 w-4.5 text-primary" />
          </div>
          맞춤 가성비 계산기
        </h3>
        <p className="text-sm text-muted-foreground font-medium mt-1.5">
          실제 사용 패턴을 입력하면 구독의 정확한 가성비를 계산해드려요
        </p>
      </div>

      {/* Service Cards */}
      {eligibleSubscriptions.map(({ subscription, preset }) => {
        const config = preset.personalizedROI!;
        const inputs = inputValues[subscription.id] || {};

        // Calculate result only if there's at least one input
        const hasInputs = Object.keys(inputs).length > 0 && Object.values(inputs).some(v => v > 0);
        const result: PersonalizedROIResult | null = hasInputs
          ? calculatePersonalizedROI(config.calculate, inputs, subscription.monthlyPrice)
          : null;

        return (
          <Card key={subscription.id} className="rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              {/* Card Header - Service name + price */}
              <div className="flex items-center gap-3 p-5 pb-4">
                <BrandIcon name={subscription.name} icon={subscription.icon} size="md" />
                <div className="flex-1">
                  <h4 className="font-bold text-base">{subscription.name}</h4>
                  <p className="text-xs text-muted-foreground">{formatKRW(subscription.monthlyPrice)}/월</p>
                </div>
              </div>

              {/* Input Fields */}
              <div className="px-5 pb-4 space-y-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  {config.description}
                </p>
                {config.fields.map((field) => (
                  <div key={field.key} className="flex items-center gap-3">
                    <label className="text-sm font-medium text-foreground/80 w-36 shrink-0">
                      {field.label}
                    </label>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder={field.placeholder}
                        value={inputs[field.key] || ''}
                        onChange={(e) => handleInputChange(subscription.id, field.key, e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border bg-accent/50 text-sm font-medium
                          focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50
                          text-right pr-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {field.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Result Display */}
              {result && (
                <div className={`p-5 border-t ${
                  result.verdict === 'excellent' ? 'bg-green-50/50 dark:bg-green-950/20' :
                  result.verdict === 'good' ? 'bg-blue-50/50 dark:bg-blue-950/20' :
                  result.verdict === 'break_even' ? 'bg-yellow-50/50 dark:bg-yellow-950/20' :
                  'bg-red-50/50 dark:bg-red-950/20'
                }`}>
                  {/* ROI Percent + Verdict */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {result.verdict === 'excellent' || result.verdict === 'good' ? (
                        <TrendingUp className={`h-5 w-5 ${
                          result.verdict === 'excellent' ? 'text-green-500' : 'text-blue-500'
                        }`} />
                      ) : result.verdict === 'break_even' ? (
                        <Minus className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      )}
                      <span className={`text-sm font-bold ${
                        result.verdict === 'excellent' ? 'text-green-600 dark:text-green-400' :
                        result.verdict === 'good' ? 'text-blue-600 dark:text-blue-400' :
                        result.verdict === 'break_even' ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {result.verdictLabel}
                      </span>
                    </div>
                    <span className="text-2xl font-extrabold tabular-nums">
                      ROI {Math.round(result.roi)}%
                    </span>
                  </div>

                  {/* Breakdown */}
                  <div className="space-y-1.5 mb-3">
                    {result.breakdownItems.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-semibold text-foreground">+{formatKRW(item.amount)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm border-t pt-1.5 mt-1.5">
                      <span className="text-muted-foreground">구독료</span>
                      <span className="font-semibold text-foreground">-{formatKRW(subscription.monthlyPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold">
                      <span>순이익</span>
                      <span className={result.savings - subscription.monthlyPrice >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {result.savings - subscription.monthlyPrice >= 0 ? '+' : ''}{formatKRW(result.savings - subscription.monthlyPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Tip */}
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-card/80 border">
                    <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed">{result.tip}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
