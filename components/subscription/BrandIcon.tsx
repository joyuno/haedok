'use client';

import { useState } from 'react';
import { getServicePreset } from '@/lib/constants/servicePresets';

interface BrandIconProps {
  name: string;
  icon: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Build favicon URL list. If the preset has a logoUrl override, use it first.
 * Otherwise cycle through icon.horse (best for KR services) → Google FaviconV2 → Google S2.
 */
function getFaviconUrls(domain: string, logoUrl?: string): string[] {
  const urls: string[] = [];
  if (logoUrl) urls.push(logoUrl);
  urls.push(
    `https://icon.horse/icon/${domain}?size=large`,
    `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  );
  return urls;
}

export function BrandIcon({ name, icon, size = 'md' }: BrandIconProps) {
  const preset = getServicePreset(name);
  const brandColor = preset?.brandColor;
  const domain = preset?.domain;
  const logoUrl = preset?.logoUrl;
  const [faviconIndex, setFaviconIndex] = useState(0);
  const [allFailed, setAllFailed] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-14 h-14 text-2xl',
    lg: 'w-16 h-16 text-3xl',
  };

  const faviconUrls = domain ? getFaviconUrls(domain, logoUrl) : [];

  const handleImgError = () => {
    if (faviconIndex < faviconUrls.length - 1) {
      setFaviconIndex((prev) => prev + 1);
    } else {
      setAllFailed(true);
    }
  };

  // If we have a domain and images haven't all failed, show the favicon
  if (domain && !allFailed && faviconUrls.length > 0) {
    return (
      <div className={`${sizeClasses[size]} rounded-2xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden bg-card border border-border`}>
        <img
          src={faviconUrls[faviconIndex]}
          alt={`${name} logo`}
          className="w-full h-full object-contain p-1.5"
          onError={handleImgError}
          loading="lazy"
        />
      </div>
    );
  }

  // If we have a brand color, show colored initial (fallback for failed images)
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
