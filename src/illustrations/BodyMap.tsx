import type { BodyPart } from '../types';
import { BACK_LINES, BACK_REGIONS, BODY_BASE, FRONT_LINES, FRONT_REGIONS, HEAD_BACK, HEAD_FRONT, type Region } from './bodyShapes';

const MUSCLE = '#dde1ec';
const SELECTED = '#1e6fd9';
const ALL = '#7eb0ee';

/**
 * 体の前と後ろの図。選んでいる部位の筋肉を青くハイライトする（'all' なら全部を薄い青に）。
 * 筋肉をタップすると onSelect でその部位を選べる。
 */
export function BodyMap({ selected, onSelect, className }: { selected: BodyPart | 'all'; onSelect?: (p: BodyPart) => void; className?: string }) {
  const view = (regions: Region[], head: typeof HEAD_FRONT, lines: string[], dx: number, label: string) => (
    <g transform={`translate(${dx} 0)`} aria-label={label}>
      {BODY_BASE.map((d) => (
        <path key={d} d={d} fill="#ffffff" stroke="#d4d8e4" strokeWidth={0.6} />
      ))}
      <path d={head.face} fill="#cfd3de" />
      <path d={head.hair} fill="#a9afc0" />
      {regions.map((r, i) => {
        const on = selected === 'all' || r.part === selected;
        return (
          <path
            key={i}
            d={r.d}
            fill={on ? (selected === 'all' ? ALL : SELECTED) : MUSCLE}
            stroke="#ffffff"
            strokeWidth={0.8}
            onClick={() => onSelect?.(r.part)}
            style={{ transition: 'fill 200ms', cursor: onSelect ? 'pointer' : undefined }}
          />
        );
      })}
      {lines.map((d) => (
        <path key={d} d={d} fill="none" stroke="#ffffff" strokeWidth={0.7} pointerEvents="none" />
      ))}
    </g>
  );

  return (
    <svg viewBox="0 0 210 156" className={className} role="img" aria-label="選んでいる部位の図">
      {view(FRONT_REGIONS, HEAD_FRONT, FRONT_LINES, 0, '前から')}
      {view(BACK_REGIONS, HEAD_BACK, BACK_LINES, 110, '後ろから')}
    </svg>
  );
}
