'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CreditCard,
  BarChart3,
  Users,
  PartyPopper,
  BookOpen,
  Sparkles,
  FlaskConical,
} from 'lucide-react';
import { useSubscriptionStore } from '@/stores';
import { formatKRW } from '@/lib/utils/formatCurrency';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: '대시보드', icon: LayoutDashboard },
  { href: '/subscriptions', label: '구독 관리', icon: CreditCard },
  { href: '/analysis', label: '이용률 분석', icon: BarChart3 },
  { href: '/insights', label: '구독 인사이트', icon: Sparkles },
  { href: '/optimize', label: '공유 최적화', icon: Users },
  { href: '/party', label: '공유 파티', icon: PartyPopper },
  { href: '/guide', label: '입력 가이드', icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const totalMonthlyCost = useSubscriptionStore((state) =>
    state.getTotalMonthlyCost(),
  );

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-sidebar border-r border-border" aria-label="주 사이드바 메뉴">
      {/* Logo */}
      <div className="flex items-center gap-2 h-16 px-6 border-b border-border">
        <FlaskConical className="w-6 h-6 text-emerald-500" aria-hidden="true" />
        <span className="text-xl font-bold text-foreground">해<span className="text-emerald-500">독</span></span>
        <span className="text-xs text-muted-foreground font-medium">(HaeDok)</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 overflow-y-auto" aria-label="메인 내비게이션">
        <ul className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    isActive
                      ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground font-medium',
                  )}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Total Cost Display */}
      <div className="p-4 border-t border-border">
        <section className="bg-accent rounded-2xl p-5" aria-label="월 구독료 요약">
          <p className="text-xs text-muted-foreground font-medium mb-2">
            월 총 구독료
          </p>
          <p className="text-3xl font-bold text-foreground" aria-live="polite">
            {formatKRW(totalMonthlyCost)}
          </p>
        </section>
      </div>

    </aside>
  );
}
