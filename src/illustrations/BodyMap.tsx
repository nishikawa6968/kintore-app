import type { BodyPart } from '../types';
import { BACK_BASE, BACK_HAIR, BACK_REGIONS, BODY_VIEWBOX, FRONT_BASE, FRONT_HAIR, FRONT_REGIONS, type Region } from './bodyShapes';

const MUSCLE = '#dde1ec';
const SELECTED = '#1e6fd9';
const ALL = '#7eb0ee';

/**
 * 体の前と後ろの図。選んでいる部位の筋肉を青くハイライトする（'all' なら全部を薄い青に）。
 * 筋肉をタップすると onSelect でその部位を選べる。形は bodyShapes.ts（参考画像をなぞったもの）。
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
            fill={on ? (selected === 'all' ? ALL : SELECTED) : MUSCLE}
            stroke="#ffffff"
            strokeWidth={2.4}
            strokeLinejoin="round"
            onClick={() => onSelect?.(r.part)}
            style={{ transition: 'fill 200ms', cursor: onSelect ? 'pointer' : undefined }}
          />
        );
      })}
    </g>
  );

  return (
    <svg viewBox={`0 0 ${BODY_VIEWBOX.width} ${BODY_VIEWBOX.height}`} className={className} role="img" aria-label="選んでいる部位の図">
      {view(FRONT_BASE, FRONT_HAIR, FRONT_REGIONS, '前から')}
      {view(BACK_BASE, BACK_HAIR, BACK_REGIONS, '後ろから')}
    </svg>
  );
}
