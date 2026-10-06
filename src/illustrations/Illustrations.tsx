import type { SVGProps } from 'react';
import { FLAME, TROPHY } from './shapes.ts';
import { TPOSE_BASE, TPOSE_HAIR, TPOSE_MUSCLES, TPOSE_VIEWBOX } from './tposeShapes.ts';

type P = SVGProps<SVGSVGElement>;

/** T ポーズの人（アプリのキャラクター。アイコンと同じ絵柄）。体は白、筋肉は currentColor */
export function TPoseMan(p: P) {
  return (
    <svg viewBox={`0 0 ${TPOSE_VIEWBOX.width} ${TPOSE_VIEWBOX.height}`} fill="currentColor" aria-hidden="true" {...p}>
      <path d={TPOSE_BASE} fill="#ffffff" stroke="#d4d8e4" strokeWidth={2} />
      <path d={TPOSE_HAIR} fill="#b9bdc9" />
      {TPOSE_MUSCLES.map((d) => (
        <path key={d} d={d} stroke="#ffffff" strokeWidth={2.4} strokeLinejoin="round" />
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
