import type { SVGProps } from 'react';
import { FLAME, GROUND_ARC, MUSCLE_MAN, TROPHY } from './shapes.ts';

type P = SVGProps<SVGSVGElement>;

/** ムキムキの人（アプリのキャラクター）。体は currentColor、筋肉のすじは lineColor */
export function MuscleMan({ lineColor = '#ffffff', ...p }: P & { lineColor?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" aria-hidden="true" {...p}>
      <path d={GROUND_ARC} opacity={0.45} />
      {MUSCLE_MAN.body.map((d) => (
        <path key={d} d={d} />
      ))}
      {MUSCLE_MAN.lines.map((d) => (
        <path key={d} d={d} fill="none" stroke={lineColor} strokeWidth={1.3} strokeLinecap="round" opacity={0.7} />
      ))}
    </svg>
  );
}

/** 燃える炎（自己ベスト更新の欄） */
export function Flame(p: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
      <path d={FLAME.outer} fill="#fde047" />
      <path d={FLAME.inner} fill="#ffffff" />
    </svg>
  );
}

/** トロフィー（新記録の印）。色は currentColor */
export function Trophy(p: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
      {TROPHY.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
