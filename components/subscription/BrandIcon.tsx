'use client';

import { getServicePreset } from '@/lib/constants/servicePresets';

interface BrandIconProps {
  name: string;
  icon: string;
  size?: 'sm' | 'md' | 'lg';
}

export function BrandIcon({ name, icon, size = 'md' }: BrandIconProps) {
  const preset = getServicePreset(name);
  const brandColor = preset?.brandColor;

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-14 h-14 text-2xl',
    lg: 'w-16 h-16 text-3xl',
  };

  // If we have a brand color, show colored initial
  if (brandColor) {
    const initial = name.charAt(0).toUpperCase();
    return (
      <div
        className={`${sizeClasses[size]} rounded-2xl flex items-center justify-center font-bold text-white shrink-0 shadow-sm`}
        style={{ backgroundColor: brandColor }}
      >
        {initial}
      </div>
    );
  }

  // Fallback to emoji
  return (
    <div className={`${sizeClasses[size]} rounded-2xl flex items-center justify-center shrink-0 shadow-sm bg-muted`}>
      <span className={size === 'lg' ? 'text-4xl' : size === 'md' ? 'text-3xl' : 'text-xl'}>{icon}</span>
    </div>
  );
}
