import { describe, expect, it } from 'vitest';
import type { SetRecord } from '../types';
import { chartData } from './chart';
import { estimate1RM } from './records';
import { fromKey } from './date';

let id = 1;
const set = (date: string, weight: number, reps: number): SetRecord => ({
  id: id++, date, exerciseId: 1, weight, reps, order: 0, createdAt: fromKey(date).getTime(),
});
const rm = (s: SetRecord) => estimate1RM(s.weight, s.reps);
const NOW = fromKey('2026-10-06').getTime() + 20 * 3600 * 1000; // 10/6 20:00

describe('グラフの点', () => {
  const sets = [
    set('2023-01-10', 50, 10),
    set('2025-12-01', 60, 8),
    set('2026-09-20', 65, 5),
    set('2026-10-02', 70, 3),
    set('2026-10-02', 60, 10), // 同じ日：推定1RMの高い方（80kg）が点になる
    set('2026-10-05', 72.5, 5),
    set('2026-10-05', 75, 3),
  ];

  it('日ごとに一番高い推定1RMを1つの点にする', () => {
    const { points } = chartData(sets, rm, 'max', 'all', NOW);
    expect(points).toHaveLength(5);
    expect(points[3].value).toBe(80);
  });

  it('期間で絞る（月・1年・3年）', () => {
    expect(chartData(sets, rm, 'max', '1m', NOW).points).toHaveLength(3);
    expect(chartData(sets, rm, 'max', '1y', NOW).points).toHaveLength(4);
    expect(chartData(sets, rm, 'max', '3y', NOW).points).toHaveLength(4);
    expect(chartData(sets, rm, 'max', 'all', NOW).points).toHaveLength(5);
  });

  it('ペースは小さいほど良いので、日ごとに一番小さい値を点にする', () => {
    const pace = (s: SetRecord) => s.weight; // 仮にweightをペースとみなす
    const { points } = chartData([set('2026-10-01', 330, 1), set('2026-10-01', 300, 1)], pace, 'min', 'all', NOW);
    expect(points[0].value).toBe(300);
  });

  it('記録がなければ点はない', () => {
    expect(chartData([], rm, 'max', 'all', NOW).points).toHaveLength(0);
  });
});
