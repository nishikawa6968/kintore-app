import type { SetRecord } from '../types';
import { fromKey } from './date';

export type Range = 'all' | '3y' | '1y' | '1m';

export const RANGES: { id: Range; label: string }[] = [
  { id: 'all', label: '全て' },
  { id: '3y', label: '3年' },
  { id: '1y', label: '1年' },
  { id: '1m', label: '月' },
];

const DAY = 24 * 60 * 60 * 1000;
const SPAN: Record<Exclude<Range, 'all'>, number> = { '3y': 3 * 365 * DAY, '1y': 365 * DAY, '1m': 30 * DAY };

export interface ChartPoint {
  /** 横軸の時刻（ミリ秒） */
  t: number;
  value: number;
}

export interface ChartData {
  points: ChartPoint[];
  /** 横軸の範囲 */
  domain: [number, number];
}

/**
 * グラフの点を作る。value はセットごとの値（0 は記録として数えない）、
 * better は良い向き（'max'：大きいほど良い・推定1RMや回数／'min'：小さいほど良い・ペース）。
 * 全て・3年・1年・月：今日からさかのぼった期間の、日ごとの一番良い値を1つの点にする。
 */
export function chartData(sets: SetRecord[], value: (s: SetRecord) => number, better: 'max' | 'min', range: Range, now = Date.now()): ChartData {
  const valid = sets.filter((s) => value(s) > 0);

  // 日ごとに一番良い値をまとめる（点はその日の正午に置く）
  const byDay = new Map<string, number>();
  for (const s of valid) {
    const v = value(s);
    const prev = byDay.get(s.date);
    if (prev === undefined || (better === 'max' ? v > prev : v < prev)) byDay.set(s.date, v);
  }
  const all = [...byDay]
    .map(([date, v]) => ({ t: fromKey(date).getTime() + DAY / 2, value: v }))
    .sort((a, b) => a.t - b.t);

  if (range === 'all') {
    if (!all.length) return { points: [], domain: [now - SPAN['1m'], now] };
    return { points: all, domain: [all[0].t - DAY, Math.max(now, all[all.length - 1].t + DAY / 2)] };
  }
  const start = now - SPAN[range];
  return { points: all.filter((p) => p.t >= start && p.t <= now + DAY), domain: [start, now] };
}
