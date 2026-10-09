import { describe, expect, it } from 'vitest';
import type { Exercise, SetRecord } from '../types';
import { big3Balance, big3Bests, levelOf } from './big3';

const ex = (id: number, name: string): Exercise => ({ id, name, bodyPart: 'chest', archived: false, order: id });
let nextId = 1;
const set = (exerciseId: number, date: string, weight: number, reps: number): SetRecord => ({
  id: nextId++, date, exerciseId, weight, reps, order: 0, createdAt: 0,
});

const exercises = [ex(1, 'ベンチプレス'), ex(2, 'スクワット'), ex(3, 'デッドリフト'), ex(4, 'インクラインベンチプレス')];

describe('BIG3', () => {
  it('種目名で見分けて、回数を問わず一番重い重量を記録にする', () => {
    const bests = big3Bests(exercises, [
      set(1, '2026-01-01', 80, 8),
      set(1, '2026-02-01', 90, 1),
      set(1, '2026-03-01', 90, 2),
      set(4, '2026-03-01', 120, 1), // インクラインは数えない
      set(2, '2026-01-01', 100, 5),
      set(3, '2026-01-01', 0, 10), // 0kg は数えない
    ]);
    expect(bests.bench).toEqual({ weight: 90, reps: 2, date: '2026-03-01' });
    expect(bests.squat?.weight).toBe(100);
    expect(bests.deadlift).toBeNull();
  });

  it('3 : 4 : 5 と比べて強め・弱めを出す', () => {
    const bests = big3Bests(exercises, [set(1, 'd', 100, 1), set(2, 'd', 100, 1), set(3, 'd', 150, 1)]);
    const rows = big3Balance(bests)!;
    expect(rows.map((r) => r.balance)).toEqual(['strong', 'weak', 'even']);
    expect(rows[0].ratio).toBeCloseTo(3.43, 2);
    expect(big3Balance({ ...bests, squat: null })).toBeNull();
  });

  it('体重の倍率からレベルと次のレベルまでの重さを出す', () => {
    expect(levelOf('bench', 80, 70)).toMatchObject({ level: '初級者', next: { level: '中級者', remaining: 7.5 } });
    expect(levelOf('bench', 20, 70).level).toBe('初心者');
    expect(levelOf('deadlift', 210, 70)).toMatchObject({ level: 'エリート', next: null });
  });
});
