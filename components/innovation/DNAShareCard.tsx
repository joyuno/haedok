'use client';

import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Copy, Check, X } from 'lucide-react';
import type { DNAProfile } from '@/lib/calculations/subscriptionDNA';
import { CATEGORY_LABELS, CATEGORY_COLORS, type SubscriptionCategory } from '@/lib/types/subscription';
import { formatKRW } from '@/lib/utils/formatCurrency';

interface CategoryBreakdownItem {
  category: SubscriptionCategory;
  label: string;
  color: string;
  spend: number;
  percentage: number;
}

interface DNAShareCardProps {
  dnaProfile: DNAProfile;
  totalCost: number;
  subscriptionCount: number;
  categoryBreakdown: CategoryBreakdownItem[];
  onClose: () => void;
}

const CARD_W = 400;
const CARD_H = 560;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawCard(
  canvas: HTMLCanvasElement,
  dnaProfile: DNAProfile,
  totalCost: number,
  subscriptionCount: number,
  categoryBreakdown: CategoryBreakdownItem[],
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = 2;
  canvas.width = CARD_W * dpr;
  canvas.height = CARD_H * dpr;
  canvas.style.width = `${CARD_W}px`;
  canvas.style.height = `${CARD_H}px`;
  ctx.scale(dpr, dpr);

  // Background gradient -- premium dark navy to deep blue to subtle teal
  const gradient = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  gradient.addColorStop(0, '#0F172A');
  gradient.addColorStop(0.5, '#1E3A5F');
  gradient.addColorStop(1, '#0D4044');
  ctx.fillStyle = gradient;
  roundRect(ctx, 0, 0, CARD_W, CARD_H, 24);
  ctx.fill();

  // Subtle grid pattern instead of decorative circles
  ctx.globalAlpha = 0.04;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= CARD_W; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CARD_H);
    ctx.stroke();
  }
  for (let y = 0; y <= CARD_H; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CARD_W, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // DNA Emoji (slightly smaller, positioned higher)
  ctx.font = '52px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(dnaProfile.emoji, CARD_W / 2, 70);

  // DNA Type Name -- larger with letter-spacing
  ctx.font = 'bold 32px -apple-system, "Segoe UI", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  // Simulate letter-spacing by drawing each character with offset
  const nameText = dnaProfile.name;
  const letterSpacing = 1.5;
  const nameWidth = ctx.measureText(nameText).width + (nameText.length - 1) * letterSpacing;
  let nameX = (CARD_W - nameWidth) / 2;
  for (const char of nameText) {
    ctx.textAlign = 'left';
    ctx.fillText(char, nameX, 120);
    nameX += ctx.measureText(char).width + letterSpacing;
  }
  ctx.textAlign = 'center';

  // Stats pill -- refined with border
  const pillY = 148;
  const costText = `월 ${formatKRW(totalCost)}`;
  const countText = `구독 ${subscriptionCount}개`;
  const statsText = `${costText}  |  ${countText}`;

  ctx.font = '600 13px -apple-system, "Segoe UI", sans-serif';
  const statsW = ctx.measureText(statsText).width + 36;
  const pillX = (CARD_W - statsW) / 2;
  const pillH = 30;

  // Pill background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  roundRect(ctx, pillX, pillY - 13, statsW, pillH, 15);
  ctx.fill();

  // Pill border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  roundRect(ctx, pillX, pillY - 13, statsW, pillH, 15);
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.fillText(statsText, CARD_W / 2, pillY + 5);

  // Inner card background -- more subtle with border
  const cardX = 24;
  const cardY = 192;
  const cardW = CARD_W - 48;
  const cardH = 270;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  roundRect(ctx, cardX, cardY, cardW, cardH, 16);
  ctx.fill();

  // Inner card border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  roundRect(ctx, cardX, cardY, cardW, cardH, 16);
  ctx.stroke();

  // Category section title
  ctx.font = 'bold 12px -apple-system, "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.textAlign = 'left';
  ctx.fillText('카테고리별 지출', cardX + 20, cardY + 28);

  // Category bars (top 5) -- thinner with more rounded corners
  const topCategories = categoryBreakdown.slice(0, 5);
  const barStartY = cardY + 46;
  const barH = 12;
  const barGap = 32;
  const barMaxW = cardW - 40;

  topCategories.forEach((item, idx) => {
    const y = barStartY + idx * barGap;

    // Label
    ctx.font = '600 11px -apple-system, "Segoe UI", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.fillText(item.label, cardX + 20, y);

    // Percentage + amount
    ctx.font = '600 10px -apple-system, "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'right';
    ctx.fillText(
      `${formatKRW(item.spend)} (${item.percentage.toFixed(0)}%)`,
      cardX + cardW - 20,
      y,
    );

    // Bar background
    const barY = y + 5;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    roundRect(ctx, cardX + 20, barY, barMaxW, barH, 6);
    ctx.fill();

    // Bar fill
    const fillW = Math.max((item.percentage / 100) * barMaxW, 8);
    ctx.fillStyle = item.color;
    roundRect(ctx, cardX + 20, barY, fillW, barH, 6);
    ctx.fill();
  });

  // Description (below inner card)
  const descY = cardY + cardH + 26;
  ctx.font = '500 13px -apple-system, "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.textAlign = 'center';

  // Simple text wrapping
  const maxLineW = CARD_W - 60;
  const words = dnaProfile.description.split('');
  let line = '';
  const lines: string[] = [];

  for (const char of words) {
    const testLine = line + char;
    if (ctx.measureText(testLine).width > maxLineW) {
      lines.push(line);
      line = char;
    } else {
      line = testLine;
    }
  }
  if (line) lines.push(line);

  lines.slice(0, 2).forEach((l, i) => {
    ctx.fillText(l, CARD_W / 2, descY + i * 20);
  });

  // Watermark -- refined
  ctx.font = '500 11px -apple-system, "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.textAlign = 'center';
  ctx.fillText('haedok.app', CARD_W / 2, CARD_H - 18);
}

export function DNAShareCard({
  dnaProfile,
  totalCost,
  subscriptionCount,
  categoryBreakdown,
  onClose,
}: DNAShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [drawn, setDrawn] = useState(false);

  const handleCanvasRef = useCallback(
    (node: HTMLCanvasElement | null) => {
      if (node && !drawn) {
        (canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = node;
        drawCard(node, dnaProfile, totalCost, subscriptionCount, categoryBreakdown);
        setDrawn(true);
      }
    },
    [dnaProfile, totalCost, subscriptionCount, categoryBreakdown, drawn],
  );

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `haedok-dna-${dnaProfile.type}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }, [dnaProfile.type]);

  const handleCopyToClipboard = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png'),
      );
      if (!blob) return;

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: download
      handleDownload();
    }
  }, [handleDownload]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-label="공유 카드 미리보기">
      <div className="rounded-2xl bg-card border border-border p-6 shadow-xl max-w-[440px] w-full space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">공유 카드 미리보기</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-lg" aria-label="닫기">
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="flex justify-center">
          <canvas
            ref={handleCanvasRef}
            className="rounded-2xl shadow-lg"
            style={{ width: CARD_W * 0.85, height: CARD_H * 0.85 }}
          />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleDownload}
            variant="outline"
            className="flex-1 rounded-xl font-semibold"
          >
            <Download className="mr-2 h-4 w-4" />
            다운로드
          </Button>
          <Button
            onClick={handleCopyToClipboard}
            className="flex-1 rounded-xl font-semibold"
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                복사 완료!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                클립보드 복사
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
