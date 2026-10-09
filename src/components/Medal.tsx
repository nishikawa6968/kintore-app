import { useId } from 'react';
import type { Rarity } from '../lib/achievements';

/** メダルの色（銅・銀・金）。明るい色 → 暗い色 */
export const RARITY_COLORS: Record<Rarity, [string, string]> = {
  bronze: ['#f0b27a', '#9a5523'],
  silver: ['#f1f5f9', '#8492a6'],
  gold: ['#fde68a', '#d97706'],
  platinum: ['#ecfeff', '#3fa7c2'],
  legend: ['#f9a8d4', '#6d28d9'],
};
export const RARITY_LABEL: Record<Rarity, string> = { bronze: 'ブロンズ', silver: 'シルバー', gold: 'ゴールド', platinum: 'プラチナ', legend: 'レジェンド' };

/**
 * 実績バッジのメダル。リボンの付いた丸いメダルの真ん中に短い文字。
 * - shine：光の筋がキランと横切る（解除済み）
 * - locked：暗くして鍵を付ける（まだ解除していない）
 */
export function Medal({ rarity, label, size, shine = false, locked = false }: { rarity: Rarity; label: string; size: number; shine?: boolean; locked?: boolean }) {
  const id = useId();
  const [light, dark] = RARITY_COLORS[rarity];
  const fontSize = label.length <= 2 ? 13 : label.length === 3 ? 11 : label.length === 4 ? 9 : 8;
  const legend = rarity === 'legend';
  return (
    <svg
      viewBox="0 0 48 56"
      width={size}
      height={(size * 56) / 48}
      className="shrink-0"
      style={{
        filter: locked ? 'grayscale(0.7) brightness(0.85)' : legend ? 'drop-shadow(0 0 5px rgb(217 70 239 / 0.7))' : 'drop-shadow(0 2px 3px rgb(0 0 0 / 0.2))',
        opacity: locked ? 0.5 : 1,
      }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-face`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
        <linearGradient id={`${id}-glint`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-rainbow`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f472b6" />
          <stop offset="0.35" stopColor="#facc15" />
          <stop offset="0.7" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <circle cx="24" cy="34" r="18" />
        </clipPath>
      </defs>
      {/* リボン */}
      <path d="M12 2 H22 L28 20 H18 Z" fill="#1e6fd9" />
      <path d="M36 2 H26 L20 20 H30 Z" fill="#ef4444" />
      {/* メダル */}
      <circle cx="24" cy="34" r="18" fill={`url(#${id}-face)`} />
      {/* レジェンドは虹色のふち */}
      {legend && <circle cx="24" cy="34" r="17" fill="none" stroke={`url(#${id}-rainbow)`} strokeWidth="2.5" />}
      <circle cx="24" cy="34" r="14.5" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.2" />
      <text
        x="24"
        y={34 + fontSize * 0.36}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight="900"
        fill="#fff"
        stroke={dark}
        strokeWidth="0.6"
        paintOrder="stroke"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        {label}
      </text>
      {shine && !locked && (
        <g clipPath={`url(#${id}-clip)`}>
          <g transform="rotate(20 24 34)">
            <rect className="emblem-glint" x="-24" y="0" width="12" height="70" fill={`url(#${id}-glint)`} />
          </g>
        </g>
      )}
      {locked && (
        <g transform="translate(31 38)">
          <circle cx="7" cy="7" r="8" fill="#334155" stroke="#fff" strokeWidth="1.5" />
          <rect x="3.5" y="6.5" width="7" height="5.5" rx="1" fill="#fff" />
          <path d="M5 6.5 V5 a2 2 0 0 1 4 0 V6.5" fill="none" stroke="#fff" strokeWidth="1.4" />
        </g>
      )}
    </svg>
  );
}

/** ヘッダーに置く小さな白いメダルのアイコン */
export function MedalIcon(p: { width?: number; height?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={p.width ?? 24} height={p.height ?? 24} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" aria-hidden="true">
      <path d="M7 2h4l2 6M17 2h-4l-2 6" />
      <circle cx="12" cy="15" r="6.5" />
      <path d="M12 12v6" strokeLinecap="round" />
    </svg>
  );
}
