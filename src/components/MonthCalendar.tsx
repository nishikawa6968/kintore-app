import { useState } from 'react';
import { addDays, addMonths, format, isSameMonth, startOfMonth, startOfWeek } from 'date-fns';
import { toKey } from '../lib/date';
import { ChevronLeft, ChevronRight } from './Icons';
import { SwipePager } from './SwipePager';

const WEEK = ['日', '月', '火', '水', '木', '金', '土'];

export function MonthCalendar({
  month,
  onMonthChange,
  marked,
  trained,
  today,
  onSelect,
}: {
  month: Date;
  onMonthChange: (d: Date) => void;
  /** 選んでいる部位を鍛えた日（濃い青） */
  marked: Set<string>;
  /** 何かしら筋トレをした日（水色） */
  trained: Set<string>;
  today: string;
  onSelect: (key: string) => void;
}) {
  // いつも6週（42日）並べて、月を切り替えても高さが変わらないようにする
  const first = startOfWeek(startOfMonth(month));
  const days = Array.from({ length: 42 }, (_, i) => addDays(first, i));

  // 月が変わった向き（次の月なら右から、前の月なら左から入ってくる）
  const key = format(month, 'yyyy-MM');
  const [prevKey, setPrevKey] = useState(key);
  const [dir, setDir] = useState<'next' | 'prev' | null>(null);
  if (prevKey !== key) {
    setPrevKey(key);
    setDir(key > prevKey ? 'next' : 'prev');
  }

  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
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
      {/* 日付は指で左右に動かして前後の月へ（指についてきて、離すと滑らかに入れ替わる） */}
      <SwipePager pageKey={key} direction={dir} onSwipe={(d) => onMonthChange(addMonths(month, d))}>
        <div className="grid grid-cols-7 gap-y-0.5">
          {days.map((d) => {
            const key = toKey(d);
            const inMonth = isSameMonth(d, month);
            const isMarked = marked.has(key);
            const isTrained = !isMarked && trained.has(key);
            const isToday = key === today;
            return (
              <button key={key} onClick={() => onSelect(key)} className="flex h-10 items-center justify-center">
                <span
                  className={[
                    'flex h-9 w-9 items-center justify-center rounded-full text-[15px] tabular-nums transition-transform active:scale-90',
                    isMarked
                      ? 'bg-brand-500 font-bold text-white'
                      : isTrained
                        ? 'bg-sky-200 font-bold text-brand-700'
                        : inMonth
                          ? 'text-gray-700'
                          : 'text-gray-300',
                    (isMarked || isTrained) && !inMonth ? 'opacity-40' : '',
                    isToday ? 'ring-[3px] ring-today ring-offset-1' : '',
                    isToday && !isMarked && !isTrained ? 'font-bold text-today' : '',
                  ].join(' ')}
                >
                  {d.getDate()}
                </span>
              </button>
            );
          })}
        </div>
      </SwipePager>
    </div>
  );
}
