import { useId } from 'react';
import { LEVEL_COLORS, LEVEL_RANKS } from '../lib/big3';

const SHIELD = 'M24 2 L44 9 V27 C44 41 35 50 24 54 C13 50 4 41 4 27 V9 Z';

/**
 * BIG3 の称号の、ゲームのランクのような盾のエンブレム（tier が null なら「？」）。
 * - shine：光の筋がときどき「キラン」と横切る（取得している称号）
 * - locked：暗くして鍵を付ける（まだ取得していない称号）
 * - glow：まわりを称号の色で光らせる
 */
export function Emblem({
  tier,
  size,
  glow = false,
  shine = false,
  locked = false,
}: {
  tier: number | null;
  size: number;
  glow?: boolean;
  shine?: boolean;
  locked?: boolean;
}) {
  const id = useId();
  const color = tier === null ? '#64748b' : LEVEL_COLORS[tier];
  const rank = tier === null ? '?' : LEVEL_RANKS[tier];
  const shadow = glow ? `drop-shadow(0 0 ${size / 7}px ${color})` : locked ? 'none' : 'drop-shadow(0 2px 3px rgb(0 0 0 / 0.18))';
  return (
    <svg
      viewBox="0 0 48 56"
      width={size}
      height={(size * 56) / 48}
      className="shrink-0"
      style={{ filter: `${shadow}${locked ? ' grayscale(0.55) brightness(0.8)' : ''}`, opacity: locked ? 0.55 : 1 }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.18" />
        </linearGradient>
        <linearGradient id={`${id}-glint`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <path d={SHIELD} />
        </clipPath>
      </defs>
      <path d={SHIELD} fill={color} />
      <path d={SHIELD} fill={`url(#${id}-shine)`} />
      {locked && <path d={SHIELD} fill="#0f172a" fillOpacity="0.35" />}
      <path
        d="M24 7 L39.5 12.5 V27 C39.5 38.5 32.5 45.5 24 49 C15.5 45.5 8.5 38.5 8.5 27 V12.5 Z"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.55"
        strokeWidth="1.5"
      />
      <text x="24" y="35" textAnchor="middle" fontSize="22" fontWeight="900" fill="#fff" fillOpacity={locked ? 0.7 : 1} style={{ fontFamily: 'system-ui, sans-serif' }}>
        {rank}
      </text>
      {/* キランと光の筋が横切る */}
      {shine && !locked && (
        <g clipPath={`url(#${id}-clip)`}>
          <g transform="rotate(20 24 28)">
            <rect className="emblem-glint" x="-24" y="-10" width="14" height="80" fill={`url(#${id}-glint)`} />
          </g>
        </g>
      )}
      {/* まだ取得していない称号の鍵 */}
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
