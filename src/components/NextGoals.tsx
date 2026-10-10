import type { ReactNode } from 'react';
import { addSet } from '../db/db';
import { Flame, Sparkle } from '../illustrations/Illustrations';
import { nextRunGoals, nextWeightGoals } from '../lib/goals';
import { fmtKm, fmtPace, fmtWeight } from '../lib/records';
import type { SetRecord } from '../types';

/**
 * 次に狙う目標。「炎を狙う」（持った重さの新記録）と「青を狙う」（回数・推定1RMの更新）。
 * 重さの種目は、押すとその重さと回数のセットが入る。
 */
export function NextGoals({ sets, cardio, exerciseId, date }: { sets: SetRecord[]; cardio: boolean; exerciseId: number; date: string }) {
  if (cardio) {
    const g = nextRunGoals(sets);
    if (!g) return null;
    return (
      <GoalFrame>
        <GoalChip tone="fire" title="炎を狙う" value={`${fmtKm(g.distance)}以上`} />
        <GoalChip tone="blue" title="青を狙う" value={`${fmtPace(g.pace)}/km`} />
      </GoalFrame>
    );
  }
  const g = nextWeightGoals(sets);
  if (!g) return null;
  return (
    <GoalFrame note="押すとセットに入る">
      {g.fire && <GoalChip tone="fire" title="炎を狙う" value={`${fmtWeight(g.fire.weight)}×${g.fire.reps}回〜`} onClick={() => addSet(exerciseId, date, g.fire!.weight, g.fire!.reps)} />}
      {g.blue && <GoalChip tone="blue" title="青を狙う" value={`${fmtWeight(g.blue.weight)}×${g.blue.reps}回`} onClick={() => addSet(exerciseId, date, g.blue!.weight, g.blue!.reps)} />}
    </GoalFrame>
  );
}

function GoalFrame({ children, note }: { children: ReactNode; note?: string }) {
  return (
    <div className="rounded-2xl bg-white px-3 pt-2 pb-3 shadow-sm">
      <div className="mb-1.5 flex items-baseline justify-between px-1">
        <span className="text-sm font-bold text-gray-700">次の目標</span>
        {note && <span className="text-[11px] text-gray-400">{note}</span>}
      </div>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

function GoalChip({ tone, title, value, onClick }: { tone: 'fire' | 'blue'; title: string; value: string; onClick?: () => void }) {
  const fire = tone === 'fire';
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2.5 py-2 text-left active:scale-[0.97] disabled:active:scale-100 ${
        fire ? 'bg-gradient-to-r from-orange-50 to-red-50 ring-1 ring-orange-200' : 'bg-gradient-to-r from-sky-50 to-blue-50 ring-1 ring-sky-200'
      }`}
    >
      {fire ? <Flame className="animate-flame h-5 w-5 shrink-0 text-orange-500" /> : <Sparkle className="twinkle h-5 w-5 shrink-0 text-sky-500" />}
      <span className="min-w-0">
        <span className={`block text-[10px] font-black ${fire ? 'text-orange-500' : 'text-sky-600'}`}>{title}</span>
        <span className="block truncate text-[15px] leading-tight font-black tracking-tight text-gray-800 tabular-nums">{value}</span>
      </span>
    </button>
  );
}
