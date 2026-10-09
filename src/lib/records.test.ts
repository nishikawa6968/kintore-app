import { describe, expect, it } from 'vitest';
import type { Exercise, SetRecord } from '../types';
import {
  computeBest,
  computeRunBest,
  estimate1RM,
  fmtDuration,
  fmtKm,
  fmtPace,
  lastTrainedByPart,
  paceOf,
  partsByDate,
  recordSetIds,
  runRecordIds,
  speedKmh,
  weightRecordKinds,
} from './records';
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

describe('ランニング', () => {
  const run = (date: string, distance: number, minutes: number, order = 0): SetRecord => ({
    ...set(date, 0, 0, order, 9),
    distance,
    duration: minutes * 60,
  });

  it('ペースと時速を出す', () => {
    const r = run('2026-10-01', 5, 25.5);
    expect(fmtPace(paceOf(r))).toBe(`5'06"`);
    expect(speedKmh(r)).toBe(11.8);
    expect(fmtDuration(25.5 * 60)).toBe('25:30');
    expect(fmtDuration(3723)).toBe('1:02:03');
    expect(fmtKm(5.25)).toBe('5.25km');
  });

  it('最長距離と最速ペースを別々に覚える', () => {
    const best = computeRunBest([run('2026-10-01', 5, 30), run('2026-10-03', 10, 55), run('2026-10-05', 3, 14)])!;
    expect(best).toMatchObject({ longest: 10, longestDate: '2026-10-03', bestPaceDate: '2026-10-05' });
    expect(fmtPace(best.bestPace)).toBe(`4'40"`);
  });

  it('距離か時間が0のものは数えない', () => {
    expect(computeRunBest([{ ...run('2026-10-01', 5, 25), duration: 0 }])).toBeNull();
  });

  it('距離を伸ばすかペースを上げたら新記録', () => {
    const first = run('2026-10-01', 5, 30);
    const slowerShorter = run('2026-10-02', 4, 26);
    const longer = run('2026-10-03', 6, 40);
    const faster = run('2026-10-04', 3, 15);
    expect(runRecordIds([faster, longer, slowerShorter, first])).toEqual(new Set([longer.id, faster.id]));
  });

  it('重量の種目のベストにはランニングを混ぜない', () => {
    expect(computeBest([run('2026-10-01', 5, 25)])).toBeNull();
  });
});

describe('新記録の種類', () => {
  it('持った重量の新記録は weight、推定1RMだけの新記録は rm', () => {
    const first = set('2026-10-01', 75, 3); // 1RM 82.5
    const rmOnly = set('2026-10-08', 70, 6); // 1RM 84：重量は 75 に届かない
    const heavier = set('2026-10-09', 77.5, 2); // 重量の新記録
    const kinds = weightRecordKinds([first, rmOnly, heavier]);
    expect(kinds.get(rmOnly.id)).toBe('rm');
    expect(kinds.get(heavier.id)).toBe('weight');
    expect(kinds.has(first.id)).toBe(false);
  });

  it('同じ重量で回数が増えたら weight（推定1RMも上がっても weight を優先）', () => {
    const a = set('2026-10-01', 60, 5);
    const b = set('2026-10-02', 60, 7);
    expect(weightRecordKinds([a, b]).get(b.id)).toBe('weight');
  });
});
