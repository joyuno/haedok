'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CreditCard,
  BarChart3,
  Users,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: '대시보드', icon: LayoutDashboard },
  { href: '/subscriptions', label: '구독 관리', icon: CreditCard },
  { href: '/analysis', label: '분석', icon: BarChart3 },
  { href: '/insights', label: '인사이트', icon: Sparkles },
  { href: '/optimize', label: '최적화', icon: Users },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-pb shadow-lg" aria-label="모바일 내비게이션">
      <div className="flex items-center justify-around h-16 px-2" role="list">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              role="listitem"
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground font-medium',
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'scale-110')} aria-hidden="true" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
