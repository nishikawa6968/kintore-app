import { useRef } from 'react';
import { addDays, addMonths, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from 'date-fns';
import { toKey } from '../lib/date';
import { ChevronLeft, ChevronRight } from './Icons';

const WEEK = ['日', '月', '火', '水', '木', '金', '土'];

export function MonthCalendar({
  month,
  onMonthChange,
  marked,
  today,
  onSelect,
}: {
  month: Date;
  onMonthChange: (d: Date) => void;
  marked: Set<string>;
  today: string;
  onSelect: (key: string) => void;
}) {
  const days: Date[] = [];
  for (let d = startOfWeek(startOfMonth(month)); d <= endOfWeek(endOfMonth(month)); d = addDays(d, 1)) days.push(d);

  // 左右スワイプで月移動
  const touchX = useRef<number | null>(null);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 50) onMonthChange(addMonths(month, dx < 0 ? 1 : -1));
  };

  return (
    <div
      className="rounded-2xl bg-white p-3 shadow-sm"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={onTouchEnd}
    >
      <div className="mb-2 flex items-center justify-between">
        <button onClick={() => onMonthChange(addMonths(month, -1))} className="p-2 text-brand-500 active:opacity-50" aria-label="前の月">
          <ChevronLeft />
        </button>
        <div className="text-lg font-bold text-brand-600">{format(month, 'yyyy年M月')}</div>
        <button onClick={() => onMonthChange(addMonths(month, 1))} className="p-2 text-brand-500 active:opacity-50" aria-label="次の月">
          <ChevronRight />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs font-bold">
        {WEEK.map((w, i) => (
          <div key={w} className={`py-1 ${i === 0 ? 'text-rose-400' : i === 6 ? 'text-brand-400' : 'text-gray-400'}`}>
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((d) => {
          const key = toKey(d);
          const inMonth = isSameMonth(d, month);
          const isMarked = marked.has(key);
          const isToday = key === today;
          return (
            <button key={key} onClick={() => onSelect(key)} className="flex h-11 items-center justify-center">
              <span
                className={[
                  'flex h-10 w-10 items-center justify-center rounded-full text-[15px] tabular-nums transition-transform active:scale-90',
                  isMarked ? 'bg-brand-500 font-bold text-white' : inMonth ? 'text-gray-700' : 'text-gray-300',
                  isMarked && !inMonth ? 'opacity-40' : '',
                  isToday ? 'ring-[3px] ring-today ring-offset-1' : '',
                  isToday && !isMarked ? 'font-bold text-today' : '',
                ].join(' ')}
              >
                {d.getDate()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
