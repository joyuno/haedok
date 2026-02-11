'use client';

import { Badge } from '@/components/ui/badge';
import {
  type SubscriptionCategory,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
} from '@/lib/types/subscription';

interface CategoryBadgeProps {
  category: SubscriptionCategory;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const color = CATEGORY_COLORS[category];
  const label = CATEGORY_LABELS[category];

  return (
    <Badge
      variant="outline"
      className={className}
      style={{
        borderColor: color,
        color: color,
      }}
    >
      <span
        className="mr-1 h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </Badge>
  );
}
