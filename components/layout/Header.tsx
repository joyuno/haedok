'use client';

import { Search } from 'lucide-react';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="lg:hidden sticky top-0 z-10 bg-card border-b border-border">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-lg">SubScout</span>
        </div>
        <h1 className="font-semibold text-slate-900">{title}</h1>
      </div>
    </header>
  );
}
