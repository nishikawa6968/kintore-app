import { format } from 'date-fns';
import { useState } from 'react';
import { setSetting } from '../db/db';
import { Flame } from '../illustrations/Illustrations';
import { fromKey } from '../lib/date';
import type { WeeklySummary } from '../lib/streak';

/** ホームに置く「今週 2/3・🔥5週連続」。押すと週の目標を変える画面が出る */
export function WeeklyGoalPill({ summary, goal }: { summary: WeeklySummary; goal: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums active:scale-95 ${
          summary.achievedThisWeek ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm shadow-orange-500/40' : 'bg-white text-gray-600 shadow-sm'
        }`}
        aria-label="週の目標"
      >
        <span>
          今週 <span className="text-sm font-black">{summary.thisWeek}</span>/{goal}
        </span>
        {summary.streak > 0 && (
          <span className={`flex items-center gap-0.5 ${summary.achievedThisWeek ? '' : 'text-orange-500'}`}>
            <Flame className="animate-flame h-3.5 w-3.5" />
            {summary.streak}週
          </span>
        )}
      </button>
      {open && <WeeklyGoalSheet summary={summary} goal={goal} onClose={() => setOpen(false)} />}
    </>
  );
}

/** 週の目標（1週間に何日トレーニングするか）を選ぶボトムシート。直近8週の達成状況も出す */
function WeeklyGoalSheet({ summary, goal, onClose }: { summary: WeeklySummary; goal: number; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/40" onClick={onClose} data-swipe-ignore>
      <div className="mx-auto w-full max-w-md rounded-t-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200" />
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-bold">週の目標</h2>
          <span className="flex items-center gap-1 text-sm font-bold text-orange-500">
            <Flame className="h-4 w-4" />
            {summary.streak}週連続
            <span className="ml-1 text-xs font-normal text-gray-400">（最長 {summary.bestStreak}週）</span>
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-500">1週間（月〜日）に何日トレーニングする？</p>
        <div className="mt-3 grid grid-cols-7 gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              onClick={() => setSetting('weeklyGoal', n)}
              className={`h-11 rounded-xl text-lg font-black ${n === goal ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="mt-5 text-sm font-bold text-gray-500">最近の8週</div>
        <div className="mt-2 grid grid-cols-8 gap-1.5">
          {summary.recent.map((w, i) => (
            <div key={w.start} className="flex flex-col items-center gap-1">
              <div
                className={`flex h-10 w-full items-center justify-center rounded-lg text-sm font-black tabular-nums ${
                  w.achieved ? 'bg-gradient-to-b from-orange-400 to-red-500 text-white' : i === summary.recent.length - 1 ? 'bg-brand-50 text-brand-600 ring-2 ring-brand-300' : 'bg-gray-100 text-gray-400'
                }`}
              >
                {w.achieved ? <Flame className="h-4 w-4" /> : w.count}
              </div>
              <span className="text-[9px] text-gray-400">{i === summary.recent.length - 1 ? '今週' : format(fromKey(w.start), 'M/d')}</span>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="mt-5 h-12 w-full rounded-xl bg-gray-100 font-bold text-gray-600">
          閉じる
        </button>
      </div>
    </div>
  );
}
