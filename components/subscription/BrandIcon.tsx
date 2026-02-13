'use client';

import { useState, useEffect } from 'react';
import { getServicePreset } from '@/lib/constants/servicePresets';
import { resolveFavicon, getFaviconFromCache } from '@/lib/utils/faviconCache';

interface BrandIconProps {
  name: string;
  icon: string;
  size?: 'sm' | 'md' | 'lg';
  /** 프리셋 없이 직접 도메인 지정 (번들/외부 브랜드용) */
  overrideDomain?: string;
  /** 프리셋 없이 직접 브랜드 색상 지정 */
  overrideBrandColor?: string;
}

/**
 * Build favicon URL list.
 * Fallback order: logoUrl (preset) -> Google FaviconV2 (128px) -> icon.horse -> Google S2.
 */
function getFaviconUrls(domain: string, logoUrl?: string): string[] {
  const urls: string[] = [];
  if (logoUrl) urls.push(logoUrl);

  urls.push(
    `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`,
    `https://icon.horse/icon/${domain}?size=large`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  );
  return urls;
}

export function BrandIcon({ name, icon, size = 'md', overrideDomain, overrideBrandColor }: BrandIconProps) {
  const preset = getServicePreset(name);
  const brandColor = overrideBrandColor || preset?.brandColor;
  const domain = overrideDomain || preset?.domain;
  const logoUrl = preset?.logoUrl;

  const faviconUrls = domain ? getFaviconUrls(domain, logoUrl) : [];

  // Synchronous cache check -- avoids flash if already resolved
  const cached = domain ? getFaviconFromCache(domain) : undefined;

  const [resolvedUrl, setResolvedUrl] = useState<string | null>(
    cached && cached !== 'failed' ? cached : null,
  );
  const [probeComplete, setProbeComplete] = useState<boolean>(
    cached !== undefined, // true when cache had an answer (hit or failed)
  );

  useEffect(() => {
    // Skip if no domain, no URLs, or already resolved from cache
    if (!domain || faviconUrls.length === 0 || probeComplete) return;

    let cancelled = false;

    resolveFavicon(domain, faviconUrls).then((url) => {
      if (cancelled) return;
      setResolvedUrl(url);
      setProbeComplete(true);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain]);

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-14 h-14 text-2xl',
    lg: 'w-16 h-16 text-3xl',
  };

  // Show favicon if resolved successfully
  if (resolvedUrl) {
    return (
      <div className={`${sizeClasses[size]} rounded-2xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden bg-card border border-border`}>
        <img
          src={resolvedUrl}
          alt={`${name} logo`}
          className="w-full h-full object-contain p-1"
          loading="lazy"
        />
      </div>
    );
  }

  // While probing, show a neutral placeholder matching the final fallback style
  if (domain && !probeComplete) {
    return (
      <div className={`${sizeClasses[size]} rounded-2xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden bg-card border border-border animate-pulse`} role="img" aria-label={`${name} 아이콘 로딩 중`} />
    );
  }

  // Probe complete but all failed -- brandColor initial fallback
  if (brandColor) {
    const initial = name.charAt(0).toUpperCase();
    return (
      <div
        className={`${sizeClasses[size]} rounded-2xl flex items-center justify-center font-bold text-white shrink-0 shadow-sm`}
        style={{ backgroundColor: brandColor }}
        role="img"
        aria-label={`${name} 아이콘`}
      >
        {initial}
      </div>
    );
  }

  // Fallback to emoji
  return (
    <div className={`${sizeClasses[size]} rounded-2xl flex items-center justify-center shrink-0 shadow-sm bg-muted`} role="img" aria-label={`${name} 아이콘`}>
      <span className={size === 'lg' ? 'text-4xl' : size === 'md' ? 'text-3xl' : 'text-xl'} aria-hidden="true">{icon}</span>
    </div>
  );
}
