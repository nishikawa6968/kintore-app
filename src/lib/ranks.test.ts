import { describe, expect, it } from 'vitest';
import type { Exercise, SetRecord } from '../types';
import { allRanks, nextTarget, partRanks, rankOf, thresholdLabel, valueLabel, weightAtReps } from './ranks';
import { findStandard, STANDARDS_CATALOG } from './standards';

const ex = (id: number, name: string, bodyPart: Exercise['bodyPart'], extra: Partial<Exercise> = {}): Exercise => ({
  id, name, bodyPart, archived: false, order: id, ...extra,
});
let nextId = 1;
const set = (exerciseId: number, weight: number, reps: number, extra: Partial<SetRecord> = {}): SetRecord => ({
  id: nextId++, date: '2026-10-01', exerciseId, weight, reps, order: 0, createdAt: 0, ...extra,
});

describe('種目ごとのランク', () => {
  it('基準の回数に換算した重さでランクを決める（サイドレイズ：12回の重さ 3/5/8/12/16kg）', () => {
    const side = ex(1, 'サイドレイズ', 'shoulder');
    // 8kg×12回 → 中級者（8kg）にちょうど届く
    expect(rankOf(side, [set(1, 8, 12)], 0)).toMatchObject({ index: 2 });
    // 10kg×6回 → 12回換算 8.0kg（10×1.2÷1.4=8.57）→ 中級者
    expect(rankOf(side, [set(1, 10, 6)], 0)!.index).toBe(2);
    expect(weightAtReps(10, 6, 12)).toBeCloseTo(8.57, 2);
    // 2kg×10回 → 初心者（記録があれば最低でも初心者）
    expect(rankOf(side, [set(1, 2, 10)], 0)!.index).toBe(0);
    // 記録がなければランクなし
    expect(rankOf(side, [], 0)!.index).toBeNull();
  });

  it('次のランクの目標と、表示の文字', () => {
    const r = rankOf(ex(1, 'サイドレイズ', 'shoulder'), [set(1, 8, 12)], 0)!;
    expect(nextTarget(r)).toEqual({ index: 3, level: '上級者', label: '12kg × 12回' });
    expect(valueLabel(r)).toBe('12回換算 8kg');
  });

  it('自重の種目は回数、ランニングはペース（速いほど上）', () => {
    expect(rankOf(ex(2, '懸垂', 'back'), [set(2, 0, 11)], 0)!.index).toBe(2);
    const run = ex(3, 'ランニング', 'leg', { kind: 'cardio' });
    // 5km を 25分（5'00"/km = 300秒）→ 中級者（315秒）より速く、上級者（270秒）より遅い
    expect(rankOf(run, [set(3, 0, 0, { distance: 5, duration: 1500 })], 0)!.index).toBe(2);
    // 1km 未満のランは数えない
    expect(rankOf(run, [set(3, 0, 0, { distance: 0.5, duration: 100 })], 0)!.index).toBeNull();
    expect(thresholdLabel(findStandard('ランニング', 'leg')!, 270)).toBe(`4'30"/km`);
  });

  it('BIG3 は BIG3 の画面と同じ（体重の倍率）。体重がなければランクなし', () => {
    const bench = ex(4, 'ベンチプレス', 'chest', { builtin: 'bench', std: 'bench' });
    expect(rankOf(bench, [set(4, 80, 3)], 70)).toMatchObject({ index: 1 }); // 80/70 = 1.14倍 → 初級者
    expect(rankOf(bench, [set(4, 80, 3)], 0)!.index).toBeNull();
  });

  it('名前を変えても、覚えておいた基準を使う。基準のない種目はランクなし', () => {
    expect(rankOf(ex(5, 'サイド（軽め）', 'shoulder', { std: 'side-raise' }), [set(5, 8, 12)], 0)!.index).toBe(2);
    expect(rankOf(ex(6, 'プランク', 'abs'), [set(6, 0, 60)], 0)).toBeNull();
  });

  it('部位のランクは、その部位で一番高い種目のランク', () => {
    const exercises = [ex(7, 'サイドレイズ', 'shoulder'), ex(8, 'フロントレイズ', 'shoulder'), ex(9, 'レッグカール', 'leg')];
    const ranks = allRanks(exercises, [set(7, 3, 12), set(8, 14, 12)], 0);
    expect(partRanks(ranks)).toMatchObject({ shoulder: 3, leg: null, chest: null });
  });

  it('基準の表は、どの種目も5段階で、だんだん厳しくなる', () => {
    for (const s of STANDARDS_CATALOG) {
      if (s.kind === 'big3') continue;
      expect(s.values, s.key).toHaveLength(5);
      const v = s.values!;
      for (let i = 1; i < 5; i++) {
        if (s.kind === 'pace') expect(v[i], s.key).toBeLessThan(v[i - 1]);
        else expect(v[i], s.key).toBeGreaterThan(v[i - 1]);
      }
      if (s.kind === 'weight') expect(s.reps, s.key).toBeGreaterThan(0);
    }
  });
});
