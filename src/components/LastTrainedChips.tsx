import { BODY_PARTS, type BodyPart } from '../types';
import { daysAgoLabel, daysSince } from '../lib/date';

/** 日数が空くほど濃い青に（＝そろそろ鍛えどき） */
function tone(days: number | null) {
  if (days === null) return 'bg-gray-100 text-gray-400';
  if (days <= 1) return 'bg-brand-50 text-brand-600';
  if (days <= 3) return 'bg-brand-200 text-brand-800';
  if (days <= 6) return 'bg-brand-400 text-white';
  return 'bg-brand-700 text-white';
}

export function LastTrainedChips({
  lastByPart,
  today,
  selected,
  onSelect,
}: {
  lastByPart: Map<BodyPart, string>;
  today: string;
  selected: BodyPart | 'all';
  onSelect: (p: BodyPart) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {BODY_PARTS.map((p) => {
        const last = lastByPart.get(p.id);
        const days = last ? daysSince(last, today) : null;
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={`flex flex-col items-center rounded-xl py-2 transition-transform active:scale-95 ${tone(days)} ${
              selected === p.id ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-[#f3f5f9]' : ''
            }`}
          >
            <span className="text-[15px] font-bold">{p.label}</span>
            <span className="text-[11px] font-medium opacity-90">{last ? daysAgoLabel(last, today) : '記録なし'}</span>
          </button>
        );
      })}
    </div>
  );
}
