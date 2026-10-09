import { Sparkle, Trophy } from '../illustrations/Illustrations';
import type { RecordKind } from '../lib/records';

/**
 * 新記録の印。持った重量の新記録（weight）は金色の「新記録」、
 * 推定1RMだけの新記録（rm）は青い「1RM更新」（ランニングは「ペース更新」）。
 */
export function RecordBadge({ kind = 'weight', cardio = false, small = false }: { kind?: RecordKind; cardio?: boolean; small?: boolean }) {
  const icon = small ? 'h-2.5 w-2.5' : 'h-3 w-3';
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-full font-bold text-white shadow-sm ${
        kind === 'weight' ? 'bg-amber-400' : 'bg-sky-500'
      } ${small ? 'px-1.5 py-px text-[10px]' : 'px-2 py-0.5 text-xs'}`}
    >
      {kind === 'weight' ? <Trophy className={icon} /> : <Sparkle className={icon} />}
      {kind === 'weight' ? '新記録' : cardio ? 'ペース更新' : '1RM更新'}
    </span>
  );
}

/** 新記録のセットの行の色（weight：金色系、rm：青系） */
export const recordRowClass = (kind: RecordKind | undefined) => (kind === 'weight' ? 'bg-amber-50' : kind === 'rm' ? 'bg-sky-50' : '');
export const recordIndexClass = (kind: RecordKind | undefined) =>
  kind === 'weight' ? 'text-amber-500' : kind === 'rm' ? 'text-sky-500' : 'text-brand-500';
