import { describe, expect, it } from 'vitest';
import type { Exercise, SetRecord } from '../types';
import { computeBest, estimate1RM, lastTrainedByPart, partsByDate, recordSetIds } from './records';
import { daysAgoLabel } from './date';

let nextId = 1;
const set = (date: string, weight: number, reps: number, order = 0, exerciseId = 1): SetRecord => ({
  id: nextId++, date, exerciseId, weight, reps, order, createdAt: 0,
});

describe('estimate1RM', () => {
  it('Epley式で計算し、1回ならその重量', () => {
    expect(estimate1RM(100, 1)).toBe(100);
    expect(estimate1RM(80, 5)).toBe(93.3);
    expect(estimate1RM(0, 10)).toBe(0);
    expect(estimate1RM(60, 0)).toBe(0);
  });
});

describe('computeBest', () => {
  it('記録なしなら null', () => {
    expect(computeBest([])).toBeNull();
  });

  it('最高重量と、その重量での最多回数・最初の達成日', () => {
    const best = computeBest([
      set('2026-09-01', 70, 10),
      set('2026-09-05', 80, 3),
      set('2026-09-10', 80, 5),
      set('2026-09-12', 80, 5),
      set('2026-09-12', 75, 8, 1),
    ])!;
    expect(best).toMatchObject({ maxWeight: 80, repsAtMax: 5, maxDate: '2026-09-10' });
  });

  it('推定1RMは最高重量のセットと別でも拾う', () => {
    const best = computeBest([set('2026-09-01', 80, 1), set('2026-09-02', 70, 12)])!;
    expect(best.maxWeight).toBe(80);
    expect(best.best1RM).toBe(98);
    expect(best.best1RMDate).toBe('2026-09-02');
  });

  it('記録を消すと再計算される（保存していないのでズレない）', () => {
    const sets = [set('2026-09-01', 60, 10), set('2026-09-02', 100, 1)];
    expect(computeBest(sets)!.maxWeight).toBe(100);
    expect(computeBest(sets.slice(0, 1))!.maxWeight).toBe(60);
  });
});

describe('recordSetIds', () => {
  it('最初のセットは新記録にしない', () => {
    expect(recordSetIds([set('2026-09-01', 60, 10)]).size).toBe(0);
  });

  it('重量増・同重量で回数増・推定1RM更新を新記録にする', () => {
    const a = set('2026-09-01', 60, 10);
    const heavier = set('2026-09-03', 65, 3);
    const moreReps = set('2026-09-05', 65, 4);
    const same = set('2026-09-07', 65, 4);
    const higher1RM = set('2026-09-09', 60, 14);
    const ids = recordSetIds([higher1RM, same, moreReps, heavier, a]);
    expect([...ids].sort()).toEqual([heavier.id, moreReps.id, higher1RM.id].sort());
  });

  it('同じ日の中では並び順で比較する', () => {
    const first = set('2026-09-01', 60, 8, 0);
    const second = set('2026-09-01', 62.5, 8, 1);
    expect(recordSetIds([second, first])).toEqual(new Set([second.id]));
  });
});

describe('部位の集計', () => {
  const exercises: Exercise[] = [
    { id: 1, name: 'ベンチプレス', bodyPart: 'chest', archived: false, order: 0 },
    { id: 2, name: 'スクワット', bodyPart: 'leg', archived: false, order: 0 },
  ];
  const sets = [
    set('2026-09-20', 60, 10, 0, 1),
    set('2026-09-23', 60, 10, 0, 1),
    set('2026-09-21', 100, 5, 0, 2),
  ];

  it('部位ごとの最終トレーニング日', () => {
    const last = lastTrainedByPart(sets, exercises);
    expect(last.get('chest')).toBe('2026-09-23');
    expect(last.get('leg')).toBe('2026-09-21');
    expect(last.has('back')).toBe(false);
  });

  it('日付ごとの部位', () => {
    const byDate = partsByDate(sets, exercises);
    expect([...byDate.get('2026-09-21')!]).toEqual(['leg']);
  });

  it('◯日前の表示', () => {
    expect(daysAgoLabel('2026-09-25', '2026-09-25')).toBe('今日');
    expect(daysAgoLabel('2026-09-24', '2026-09-25')).toBe('昨日');
    expect(daysAgoLabel('2026-09-21', '2026-09-25')).toBe('4日前');
  });
});
