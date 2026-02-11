'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  SERVICE_PRESETS_LIST,
  type ServicePreset,
} from '@/lib/constants/servicePresets';
import {
  type SubscriptionCategory,
  CATEGORY_LABELS,
} from '@/lib/types/subscription';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ServicePresetsProps {
  onSelect: (preset: ServicePreset) => void;
}

export function ServicePresets({ onSelect }: ServicePresetsProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState<SubscriptionCategory | 'all'>('all');

  const filteredPresets = SERVICE_PRESETS_LIST.filter((preset) => {
    const matchesSearch =
      search === '' ||
      preset.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || preset.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories: Array<SubscriptionCategory | 'all'> = [
    'all',
    'video',
    'music',
    'shopping',
    'productivity',
    'cloud',
    'gaming',
    'reading',
    'other',
  ];

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="서비스 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs
        value={selectedCategory}
        onValueChange={(v) =>
          setSelectedCategory(v as SubscriptionCategory | 'all')
        }
      >
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-9">
          <TabsTrigger value="all">전체</TabsTrigger>
          {categories.slice(1).map((cat) => (
            <TabsTrigger key={cat} value={cat}>
              {CATEGORY_LABELS[cat as SubscriptionCategory]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-4">
          <ScrollArea className="h-[400px] pr-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {filteredPresets.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  className="h-auto flex-col items-center justify-center p-4 hover:border-primary"
                  onClick={() => onSelect(preset)}
                >
                  <span className="mb-2 text-3xl">{preset.icon}</span>
                  <span className="text-center text-sm font-medium">
                    {preset.name}
                  </span>
                  {preset.note && (
                    <span className="mt-1 text-center text-xs text-muted-foreground">
                      {preset.plans.length}개 요금제
                    </span>
                  )}
                </Button>
              ))}
            </div>
            {filteredPresets.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                검색 결과가 없습니다.
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
