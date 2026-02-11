'use client';

import { useState } from 'react';

/**
 * Mapping of emoji characters to Twemoji SVG codepoints.
 * Twemoji renders consistent, high-quality emoji across all platforms.
 */
const EMOJI_MAP: Record<string, string> = {
  // DNA types
  '🎬': '1f3ac',
  '💼': '1f4bc',
  '🎯': '1f3af',
  '🧘‍♂️': '1f9d8-200d-2642-fe0f',
  '🧘': '1f9d8',
  '🚀': '1f680',
  '⚙️': '2699-fe0f',
  '🛍️': '1f6cd-fe0f',
  // Badges
  '🥉': '1f949',
  '🥈': '1f948',
  '🥇': '1f947',
  '💎': '1f48e',
  // UI
  '🔍': '1f50d',
  '✂️': '2702-fe0f',
  '💳': '1f4b3',
  '📦': '1f4e6',
  '🏰': '1f3f0',
  '💚': '1f49a',
  '📶': '1f4f6',
  '📱': '1f4f1',
  '📡': '1f4e1',
  '🤝': '1f91d',
  '🍔': '1f354',
  '🍎': '1f34e',
  '▶️': '25b6-fe0f',
  '🎧': '1f3a7',
  '🎭': '1f3ad',
  '⚡': '26a1',
  '⚖️': '2696-fe0f',
  '🤖': '1f916',
  '🛒': '1f6d2',
};

const TWEMOJI_BASE = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg';

interface TossEmojiProps {
  emoji: string;
  size?: number;
  className?: string;
  alt?: string;
}

export function TossEmoji({ emoji, size = 48, className = '', alt }: TossEmojiProps) {
  const [failed, setFailed] = useState(false);
  const codepoint = EMOJI_MAP[emoji];

  if (!codepoint || failed) {
    // Fallback to text emoji
    return (
      <span className={className} style={{ fontSize: size * 0.75, lineHeight: 1 }}>
        {emoji}
      </span>
    );
  }

  return (
    <img
      src={`${TWEMOJI_BASE}/${codepoint}.svg`}
      alt={alt || emoji}
      width={size}
      height={size}
      className={className}
      onError={() => setFailed(true)}
      loading="lazy"
      style={{ display: 'inline-block' }}
    />
  );
}
