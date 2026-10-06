import type { BodyPart } from '../types';
import { BACK_BASE, BACK_HAIR, BACK_REGIONS, BODY_VIEWBOX, FRONT_BASE, FRONT_HAIR, FRONT_REGIONS, type Region } from './bodyShapes';

const MUSCLE = '#dde1ec';
const SELECTED = '#1e6fd9';
const ALL = '#7eb0ee';

/** タップした位置から、これ以上離れた筋肉は選ばない（図の座標。図の高さは約570） */
const MAX_TAP_DISTANCE = 45;
/** 筋肉の輪郭上の点を、どのくらいの間隔で調べるか（図の座標） */
const SAMPLE_STEP = 6;

const samples = new WeakMap<SVGPathElement, DOMPoint[]>();
function outlinePoints(path: SVGPathElement) {
  let pts = samples.get(path);
  if (!pts) {
    const len = path.getTotalLength();
    pts = [];
    for (let l = 0; l < len; l += SAMPLE_STEP) pts.push(path.getPointAtLength(l));
    samples.set(path, pts);
  }
  return pts;
}

/**
 * タップした位置の部位を決める。筋肉の上ならその筋肉、すき間や少し外れた所なら一番近い筋肉。
 * 肩のような小さい筋肉でも、まわりを押せば選べるようにするため。
 */
function partAt(svg: SVGSVGElement, clientX: number, clientY: number): BodyPart | null {
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
  const paths = [...svg.querySelectorAll<SVGPathElement>('path[data-part]')];
  const inside = paths.find((el) => el.isPointInFill?.(p));
  if (inside) return inside.dataset.part as BodyPart;
  let best: { part: BodyPart; dist: number } | null = null;
  for (const el of paths) {
    for (const q of outlinePoints(el)) {
      const dist = Math.hypot(q.x - p.x, q.y - p.y);
      if (!best || dist < best.dist) best = { part: el.dataset.part as BodyPart, dist };
    }
  }
  return best && best.dist <= MAX_TAP_DISTANCE ? best.part : null;
}

/**
 * 体の前と後ろの図。選んでいる部位の筋肉を青くハイライトする（'all' なら全部を薄い青に）。
 * 図をタップすると onSelect で一番近い筋肉の部位を選べる。形は bodyShapes.ts（参考画像をなぞったもの）。
 */
export function BodyMap({ selected, onSelect, className }: { selected: BodyPart | 'all'; onSelect?: (p: BodyPart) => void; className?: string }) {
  const view = (base: string, hair: string, regions: Region[], label: string) => (
    <g aria-label={label}>
      <path d={base} fill="#ffffff" stroke="#d4d8e4" strokeWidth={2} />
      <path d={hair} fill="#b9bdc9" />
      {regions.map((r, i) => {
        const on = selected === 'all' || r.part === selected;
        return (
          <path
            key={i}
            d={r.d}
            data-part={r.part}
            fill={on ? (selected === 'all' ? ALL : SELECTED) : MUSCLE}
            stroke="#ffffff"
            strokeWidth={2.4}
            strokeLinejoin="round"
            style={{ transition: 'fill 200ms' }}
          />
        );
      })}
    </g>
  );

  return (
    <svg
      viewBox={`0 0 ${BODY_VIEWBOX.width} ${BODY_VIEWBOX.height}`}
      className={className}
      role="img"
      aria-label="選んでいる部位の図"
      style={{ cursor: onSelect ? 'pointer' : undefined }}
      onClick={(e) => {
        if (!onSelect) return;
        const part = partAt(e.currentTarget, e.clientX, e.clientY);
        if (part) onSelect(part);
      }}
    >
      {view(FRONT_BASE, FRONT_HAIR, FRONT_REGIONS, '前から')}
      {view(BACK_BASE, BACK_HAIR, BACK_REGIONS, '後ろから')}
    </svg>
  );
}
