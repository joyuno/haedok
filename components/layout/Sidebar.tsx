'use client';

import { useState, useEffect } from 'react';
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
  Search,
  Moon,
  Sun,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useSubscriptionStore } from '@/stores';
import { formatKRW } from '@/lib/utils/formatCurrency';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: '대시보드', icon: LayoutDashboard },
  { href: '/subscriptions', label: '구독 관리', icon: CreditCard },
  { href: '/analysis', label: '이용률 분석', icon: BarChart3 },
  { href: '/optimize', label: '공유 최적화', icon: Users },
  { href: '/party', label: '공유 파티', icon: PartyPopper },
  { href: '/guide', label: '입력 가이드', icon: BookOpen },
  { href: '/insights', label: '구독 인사이트', icon: Sparkles },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const totalMonthlyCost = useSubscriptionStore((state) =>
    state.getTotalMonthlyCost(),
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-sidebar border-r border-border">
      {/* Logo */}
      <div className="flex items-center gap-2 h-16 px-6 border-b border-border">
        <Search className="w-6 h-6 text-primary" />
        <span className="text-xl font-bold text-foreground">SubScout</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 overflow-y-auto">
        <ul className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground font-medium',
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Dark Mode Toggle */}
      <div className="px-4 pb-2">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground font-medium transition-all duration-200"
        >
          {mounted && theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
          <span>{mounted && theme === 'dark' ? '라이트 모드' : '다크 모드'}</span>
        </button>
      </div>

      {/* Total Cost Display */}
      <div className="p-4 border-t border-border">
        <div className="bg-accent rounded-2xl p-5">
          <p className="text-xs text-muted-foreground font-medium mb-2">
            월 총 구독료
          </p>
          <p className="text-3xl font-bold text-foreground">
            {formatKRW(totalMonthlyCost)}
          </p>
        </div>
      </div>
    </aside>
  );
}
