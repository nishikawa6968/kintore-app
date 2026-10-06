import type { SVGProps } from 'react';
import { FLAME, TROPHY } from './shapes.ts';
import { FRONT_BASE, FRONT_HAIR, FRONT_REGIONS, FRONT_VIEWBOX } from './bodyShapes.ts';

type P = SVGProps<SVGSVGElement>;

/** 正面を向いた人（人の図と同じ絵柄）。体は白、筋肉は currentColor */
export function FrontFigure(p: P) {
  return (
    <svg viewBox={`0 0 ${FRONT_VIEWBOX.width} ${FRONT_VIEWBOX.height}`} fill="currentColor" aria-hidden="true" {...p}>
      <path d={FRONT_BASE} fill="#ffffff" stroke="#d4d8e4" strokeWidth={2} />
      <path d={FRONT_HAIR} fill="#b9bdc9" />
      {FRONT_REGIONS.map((r) => (
        <path key={r.d} d={r.d} stroke="#ffffff" strokeWidth={2.4} strokeLinejoin="round" />
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
