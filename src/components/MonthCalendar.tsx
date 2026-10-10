import { useState } from 'react';
import { addDays, addMonths, format, isSameMonth, startOfMonth, startOfWeek } from 'date-fns';
import { toKey } from '../lib/date';
import { ChevronLeft, ChevronRight, ReportIcon } from './Icons';
import { SwipePager } from './SwipePager';

const WEEK = ['日', '月', '火', '水', '木', '金', '土'];
/** 週の始まりに合わせた曜日の並び（0：日曜はじまり、1：月曜はじまり） */
const weekdays = (start: 0 | 1) => Array.from({ length: 7 }, (_, i) => (i + start) % 7);

export function MonthCalendar({
  month,
  onMonthChange,
  marked,
  trained,
  gym,
  today,
  onSelect,
  onTitleClick,
  weekStartsOn = 0,
}: {
  month: Date;
  onMonthChange: (d: Date) => void;
  /** 選んでいる部位を鍛えた日（濃い青） */
  marked: Set<string>;
  /** 何かしら筋トレをした日（テーマの色の薄い丸） */
  trained: Set<string>;
  /** 体操をした日（ピンク。どの部位を選んでいても表示） */
  gym: Set<string>;
  today: string;
  onSelect: (key: string) => void;
  /** 「〇年〇月」を押したとき（月間レポートを開く） */
  onTitleClick?: () => void;
  /** 週の始まり（0：日曜、1：月曜） */
  weekStartsOn?: 0 | 1;
}) {
  /** その月の日付のマス目。いつも6週（42日）並べて、月を切り替えても高さが変わらないようにする */
  const renderDays = (m: Date) => {
    const first = startOfWeek(startOfMonth(m), { weekStartsOn });
    const days = Array.from({ length: 42 }, (_, i) => addDays(first, i));
    return (
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((d) => {
          const key = toKey(d);
          const inMonth = isSameMonth(d, m);
          const isGym = gym.has(key);
          const isMarked = !isGym && marked.has(key);
          const isTrained = !isGym && !isMarked && trained.has(key);
          const isToday = key === today;
          return (
            <button key={key} onClick={() => onSelect(key)} className="flex h-10 items-center justify-center">
              <span
                className={[
                  'flex h-9 w-9 items-center justify-center rounded-full text-[15px] tabular-nums transition-transform active:scale-90',
                  isGym
                    ? 'bg-pink-400 font-bold text-white'
                    : isMarked
                    ? 'bg-brand-500 font-bold text-white'
                    : isTrained
                      ? 'bg-brand-200 font-bold text-brand-700'
                      : inMonth
                        ? 'text-gray-700'
                        : 'text-gray-300',
                  (isGym || isMarked || isTrained) && !inMonth ? 'opacity-40' : '',
                  isToday ? 'ring-[3px] ring-today ring-offset-1' : '',
                  isToday && !isGym && !isMarked && !isTrained ? 'font-bold text-today' : '',
                ].join(' ')}
              >
                {d.getDate()}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

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
        {onTitleClick ? (
          <button onClick={onTitleClick} className="flex items-center gap-1 rounded-full px-2 py-0.5 text-lg font-bold text-brand-600 active:bg-brand-50" aria-label="月間レポート">
            {format(month, 'yyyy年M月')}
            <ReportIcon width={16} height={16} className="text-brand-400" />
          </button>
        ) : (
          <div className="text-lg font-bold text-brand-600">{format(month, 'yyyy年M月')}</div>
        )}
        <button onClick={() => onMonthChange(addMonths(month, 1))} className="p-2 text-brand-500 active:opacity-50" aria-label="次の月">
          <ChevronRight />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs font-bold">
        {weekdays(weekStartsOn).map((d) => (
          <div key={d} className={`py-1 ${d === 0 ? 'text-rose-400' : d === 6 ? 'text-brand-400' : 'text-gray-400'}`}>
            {WEEK[d]}
          </div>
        ))}
      </div>
      {/* 日付は指で左右に動かして前後の月へ。ロールのように隣の月がつながって出てくる */}
      <SwipePager
        pageKey={key}
        direction={dir}
        onSwipe={(d) => onMonthChange(addMonths(month, d))}
        renderPage={(o) => renderDays(addMonths(month, o))}
      />
    </div>
  );
}
