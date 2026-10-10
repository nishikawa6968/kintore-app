import { addDays, startOfWeek } from 'date-fns';
import type { DayRecord, SetRecord } from '../types';
import { fromKey, toKey } from './date';

/** 週の目標（1週間に何日トレーニングするか）の初めの値 */
export const DEFAULT_WEEKLY_GOAL = 3;

/** 週の始まり（0：日曜、1：月曜）の初めの値 */
export const DEFAULT_WEEK_START = 0;

/** その日を含む週の、最初の日（weekStartsOn：0 なら日曜、1 なら月曜） */
export const weekOf = (key: string, weekStartsOn: 0 | 1 = 1) => toKey(startOfWeek(fromKey(key), { weekStartsOn }));

/** トレーニングした日（筋トレ・ランニングのセットがある日と、体操の日） */
export function activeDays(sets: SetRecord[], days: DayRecord[]) {
  return new Set([...sets.map((s) => s.date), ...days.map((d) => d.date)]);
}

export interface WeekStatus {
  /** 週の最初の日 */
  start: string;
  count: number;
  achieved: boolean;
}

export interface WeeklySummary {
  /** 今週トレーニングした日数 */
  thisWeek: number;
  /** 今週の目標を達成したか */
  achievedThisWeek: boolean;
  /** 目標を達成した週が何週続いているか（今週がまだ未達成でも、先週まで続いていれば途切れない） */
  streak: number;
  /** これまでで一番長く続いた週の数 */
  bestStreak: number;
  /** 直近の週（古い → 今週） */
  recent: WeekStatus[];
}

/** 週の目標の達成状況 */
export function weeklySummary(active: Set<string>, goal: number, today: string, recentWeeks = 8, weekStartsOn: 0 | 1 = 1): WeeklySummary {
  const counts = new Map<string, number>();
  for (const d of active) {
    if (d > today) continue;
    const w = weekOf(d, weekStartsOn);
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  const thisWeekStart = weekOf(today, weekStartsOn);
  const status = (start: string): WeekStatus => {
    const count = counts.get(start) ?? 0;
    return { start, count, achieved: count >= goal };
  };
  const prevWeek = (start: string) => toKey(addDays(fromKey(start), -7));

  const current = status(thisWeekStart);
  let streak = current.achieved ? 1 : 0;
  for (let w = prevWeek(thisWeekStart); status(w).achieved; w = prevWeek(w)) streak++;

  // 一番長く続いた週の数：記録のある最初の週から今週まで順に見る
  let bestStreak = 0;
  const first = [...counts.keys()].sort()[0];
  if (first) {
    let run = 0;
    for (let w = first; w <= thisWeekStart; w = toKey(addDays(fromKey(w), 7))) {
      run = status(w).achieved ? run + 1 : 0;
      bestStreak = Math.max(bestStreak, run);
    }
  }

  const recent: WeekStatus[] = [];
  for (let i = recentWeeks - 1, w = thisWeekStart; i >= 0; i--) {
    recent[i] = status(w);
    w = prevWeek(w);
  }
  return { thisWeek: current.count, achievedThisWeek: current.achieved, streak, bestStreak, recent };
}
