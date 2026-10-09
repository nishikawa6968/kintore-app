import { describe, expect, it } from 'vitest';
import type { DayRecord, Exercise, SetRecord } from '../types';
import { achievementStates, achievementStats, remainingLabel } from './achievements';
import { nextRunGoals, nextWeightGoals } from './goals';
import { platesFor } from './plates';
import { monthReport, shiftMonth } from './report';
import { activeDays, weekOf, weeklySummary } from './streak';

let nextId = 1;
const set = (date: string, weight: number, reps: number, exerciseId = 1, order = 0): SetRecord => ({
  id: nextId++, date, exerciseId, weight, reps, order, createdAt: 0,
});

describe('週の目標と連続記録', () => {
  it('月曜はじまりの週で数える', () => {
    expect(weekOf('2026-10-11')).toBe('2026-10-05'); // 日曜 → その週の月曜
    expect(weekOf('2026-10-12')).toBe('2026-10-12');
  });

  it('今週が未達成でも、先週まで続いていれば連続は途切れない', () => {
    // 目標 2日：9/21週・9/28週・10/5週は達成、今週(10/12〜)は1日
    const active = new Set(['2026-09-21', '2026-09-23', '2026-09-28', '2026-10-01', '2026-10-05', '2026-10-07', '2026-10-12']);
    const s = weeklySummary(active, 2, '2026-10-13');
    expect(s.thisWeek).toBe(1);
    expect(s.achievedThisWeek).toBe(false);
    expect(s.streak).toBe(3);
    expect(s.bestStreak).toBe(3);
    expect(s.recent).toHaveLength(8);
    expect(s.recent.at(-1)).toMatchObject({ start: '2026-10-12', count: 1, achieved: false });
  });

  it('達成しなかった週があると、そこで途切れる', () => {
    const active = new Set(['2026-09-21', '2026-09-23', '2026-10-05', '2026-10-07']);
    const s = weeklySummary(active, 2, '2026-10-09');
    expect(s.streak).toBe(1);
    expect(s.bestStreak).toBe(1);
  });

  it('体操の日もトレーニングした日に数える', () => {
    const days: DayRecord[] = [{ date: '2026-10-06', kind: 'gymnastics' }];
    expect(activeDays([set('2026-10-05', 60, 5)], days)).toEqual(new Set(['2026-10-05', '2026-10-06']));
  });
});

describe('次の目標', () => {
  it('燃える目標は一番重い重さ＋2.5kg、青く光る目標はいつもの重さで回数を増やす', () => {
    // 最高 80kg×5回（1RM 93.3）、最後の日は 75kg
    const goals = nextWeightGoals([set('2026-10-01', 80, 5), set('2026-10-08', 75, 8)]);
    expect(goals?.fire).toEqual({ weight: 82.5, reps: 1 });
    // 75kg×8 = 95.0 が今の最高1RM → 75kg×9 = 97.5 で更新
    expect(goals?.blue).toEqual({ weight: 75, reps: 9 });
  });

  it('いつもの重さが一番重い重さなら、回数を1回増やせば青く光る', () => {
    const goals = nextWeightGoals([set('2026-10-01', 60, 8), set('2026-10-08', 80, 3)]);
    expect(goals?.blue).toEqual({ weight: 80, reps: 4 });
  });

  it('自重の種目は回数だけ', () => {
    const goals = nextWeightGoals([set('2026-10-01', 0, 12)]);
    expect(goals).toEqual({ fire: null, blue: { weight: 0, reps: 13 } });
  });

  it('記録がなければ目標なし', () => {
    expect(nextWeightGoals([])).toBeNull();
  });

  it('ランニングは最長距離＋0.5km と、ペース5秒短縮', () => {
    const run = { ...set('2026-10-01', 0, 0), distance: 5, duration: 1500 };
    expect(nextRunGoals([run])).toEqual({ distance: 5.5, pace: 295 });
  });
});

describe('プレート計算', () => {
  it('片側に付けるプレートを重い順に出す', () => {
    expect(platesFor(82.5, 20)).toEqual({ perSide: [25, 5, 1.25], rest: 0 });
    expect(platesFor(140, 20)).toEqual({ perSide: [25, 25, 10], rest: 0 });
    expect(platesFor(20, 20)).toEqual({ perSide: [], rest: 0 });
  });

  it('プレートで作れない分は rest に残り、バーより軽ければ null', () => {
    expect(platesFor(61, 20)).toEqual({ perSide: [20], rest: 1 });
    expect(platesFor(15, 20)).toBeNull();
  });
});

const ex = (id: number, name: string, bodyPart: Exercise['bodyPart'], builtin?: Exercise['builtin']): Exercise => ({
  id, name, bodyPart, builtin, archived: false, order: id,
});

describe('実績', () => {
  const exercises = [ex(1, 'ベンチプレス', 'chest', 'bench'), ex(2, 'スクワット', 'leg', 'squat'), ex(3, 'デッドリフト', 'back', 'deadlift')];

  it('記録から解除を判定し、あと何kgかを出す', () => {
    const sets = [set('2026-10-01', 60, 5, 1), set('2026-10-02', 82.5, 1, 1), set('2026-10-03', 100, 5, 2), set('2026-10-04', 120, 3, 3)];
    const stats = achievementStats(exercises, sets, [], 80, 3, '2026-10-09');
    expect(stats.bench).toBe(82.5);
    expect(stats.big3Total).toBe(302.5);
    expect(stats.weightRecords).toBe(1); // 2回目のベンチだけが重さの新記録
    const states = achievementStates(stats);
    const get = (id: string) => states.find((a) => a.id === id)!;
    expect(get('first').unlocked).toBe(true);
    expect(get('bench80').unlocked).toBe(true);
    expect(get('benchBW').unlocked).toBe(true);
    expect(get('total300').unlocked).toBe(true);
    expect(get('bench100').unlocked).toBe(false);
    expect(remainingLabel(get('bench100'))).toBe('あと 18kg');
  });

  it('体重比と称号の実績：体重から必要な重さを出し、体重がなければ案内を出す', () => {
    const sets = [set('2026-10-01', 105, 1, 1), set('2026-10-02', 140, 1, 2), set('2026-10-03', 170, 1, 3)];
    const get = (bw: number, id: string) => achievementStates(achievementStats(exercises, sets, [], bw, 3, '2026-10-09')).find((a) => a.id === id)!;
    // 体重70kg：ベンチ105kg は ×1.5 にちょうど届く、×2 はあと35kg
    expect(get(70, 'bench1.5BW').unlocked).toBe(true);
    expect(remainingLabel(get(70, 'bench2BW'))).toBe('あと 35kg');
    // 合計415kg ÷ 70kg = 5.9倍 → 中級者（4.75）は解除、上級者（6.5）はまだ
    expect(get(70, 'rank2').unlocked).toBe(true);
    expect(get(70, 'rank3').unlocked).toBe(false);
    expect(remainingLabel(get(0, 'rank3'))).toBe('BIG3で体重を入力');
    expect(get(0, 'rank1').unlocked).toBe(false);
  });

  it('大きな残りは「万」で短く出す', () => {
    const stats = achievementStats(exercises, [set('2026-10-01', 100, 10, 1)], [], 0, 3, '2026-10-09');
    expect(remainingLabel(achievementStates(stats).find((a) => a.id === 'vol10m')!)).toBe('あと 999.9万kg');
  });

  it('体重を入れていなければ体重ベンチは解除されない', () => {
    const stats = achievementStats(exercises, [set('2026-10-01', 200, 1, 1)], [], 0, 3, '2026-10-09');
    expect(achievementStates(stats).find((a) => a.id === 'benchBW')!.unlocked).toBe(false);
  });
});

describe('月間レポート', () => {
  it('その月の日数・ボリューム・新記録・一番伸びた種目をまとめる', () => {
    const exercises = [ex(1, 'ベンチプレス', 'chest', 'bench'), ex(2, 'スクワット', 'leg', 'squat')];
    const sets = [
      set('2026-09-10', 70, 5, 1),
      set('2026-09-12', 90, 5, 2),
      set('2026-10-02', 75, 5, 1), // 重さの新記録
      set('2026-10-05', 75, 7, 1), // 回数が増えた（青）
      set('2026-10-06', 92.5, 5, 2), // 重さの新記録
    ];
    const r = monthReport('2026-10', exercises, sets, [{ date: '2026-10-03', kind: 'gymnastics' }]);
    expect(r.trainingDays).toBe(3);
    expect(r.gymDays).toBe(1);
    expect(r.volume).toBe(75 * 5 + 75 * 7 + 92.5 * 5);
    expect(r.prev).toEqual({ trainingDays: 2, volume: 70 * 5 + 90 * 5 });
    expect(r.records.map((x) => x.kind)).toEqual(['weight', 'weight', 'rm']);
    // ベンチ 70kg×5回 → 75kg×7回（推定1RM +13%）の方が、スクワット 90kg×5回 → 92.5kg×5回（+3%）より伸びた
    expect(r.topGain).toMatchObject({ exercise: { name: 'ベンチプレス' }, before: { weight: 70, reps: 5 }, after: { weight: 75, reps: 7 } });
    expect(Math.round(r.topGain!.pct)).toBe(13);
    expect(r.partSets).toEqual({ chest: 2, leg: 1 });
  });

  it('最高重量が変わらず回数だけ増えても「伸びた」に数え、最高記録が変わらなければ数えない', () => {
    const exercises = [ex(1, 'ベンチプレス', 'chest', 'bench')];
    const base = [set('2026-09-10', 80, 5, 1)];
    expect(monthReport('2026-10', exercises, [...base, set('2026-10-02', 80, 6, 1)], []).topGain).toMatchObject({ before: { reps: 5 }, after: { reps: 6 } });
    // 75kg×9回 は推定1RMは上がるが、最高記録（80kg×5回）は変わらない
    expect(monthReport('2026-10', exercises, [...base, set('2026-10-02', 75, 9, 1)], []).topGain).toBeNull();
    // 重くして回数が減った（推定1RMは下がる）ときも、重さの伸び（+3%）で数える
    expect(Math.round(monthReport('2026-10', exercises, [...base, set('2026-10-02', 82.5, 1, 1)], []).topGain!.pct)).toBe(3);
  });

  it('月をまたいで前後へ移れる', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
  });
});
