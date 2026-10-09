import type { BodyPart, DayRecord, Exercise, SetRecord } from '../types';
import { BIG3, big3Bests } from './big3';
import { recordIdsFor } from './records';
import { activeDays, weekOf, weeklySummary } from './streak';

/**
 * 実績バッジ。記録から毎回計算するので、記録を直したり消したりしてもズレない。
 * （お知らせ済みかどうかだけを設定に保存する）
 */

export type Rarity = 'bronze' | 'silver' | 'gold';

export interface AchievementStats {
  /** 筋トレ・ランニングのセットがある日数 */
  trainingDays: number;
  /** 総挙上重量（重さ×回数の合計） */
  volume: number;
  /** 持った重さの新記録（燃える方）の回数 */
  weightRecords: number;
  bench: number;
  squat: number;
  deadlift: number;
  big3Total: number;
  bodyweight: number;
  /** 1回で走った一番長い距離 */
  longestRun: number;
  runTotal: number;
  gymDays: number;
  /** 週の目標を続けて達成した一番長い週の数 */
  bestStreak: number;
  /** 1週間で6部位すべてを鍛えたことがあるか（1 か 0） */
  allParts: number;
  hasRecord: number;
}

export interface Achievement {
  id: string;
  group: string;
  title: string;
  desc: string;
  rarity: Rarity;
  /** メダルの真ん中に書く短い文字 */
  label: string;
  /** 今の値と、解除に必要な値 */
  progress: (s: AchievementStats) => { value: number; target: number };
  /** 「あと〇〇」の単位 */
  unit?: string;
}

const at = (key: keyof AchievementStats, target: number) => (s: AchievementStats) => ({ value: s[key], target });

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first', group: 'はじめて', title: 'はじめの一歩', desc: '最初の記録をつける', rarity: 'bronze', label: '1st', progress: at('hasRecord', 1) },

  { id: 'days10', group: '継続', title: '10日の努力', desc: 'トレーニングした日が10日', rarity: 'bronze', label: '10日', progress: at('trainingDays', 10), unit: '日' },
  { id: 'days30', group: '継続', title: '30日の習慣', desc: 'トレーニングした日が30日', rarity: 'silver', label: '30日', progress: at('trainingDays', 30), unit: '日' },
  { id: 'days100', group: '継続', title: '100日の鉄人', desc: 'トレーニングした日が100日', rarity: 'gold', label: '100日', progress: at('trainingDays', 100), unit: '日' },
  { id: 'streak4', group: '継続', title: '1か月皆勤', desc: '週の目標を4週続けて達成', rarity: 'silver', label: '4週', progress: at('bestStreak', 4), unit: '週' },
  { id: 'streak12', group: '継続', title: '3か月皆勤', desc: '週の目標を12週続けて達成', rarity: 'gold', label: '12週', progress: at('bestStreak', 12), unit: '週' },
  { id: 'allparts', group: '継続', title: '全身制覇', desc: '1週間で6部位すべてを鍛える', rarity: 'silver', label: '全身', progress: at('allParts', 1) },

  { id: 'pr10', group: '記録', title: '記録ハンター', desc: '持った重さの新記録を10回', rarity: 'bronze', label: 'PR10', progress: at('weightRecords', 10), unit: '回' },
  { id: 'pr50', group: '記録', title: '記録の鬼', desc: '持った重さの新記録を50回', rarity: 'gold', label: 'PR50', progress: at('weightRecords', 50), unit: '回' },
  { id: 'vol10k', group: '記録', title: '1万kgの汗', desc: '総挙上重量が1万kg', rarity: 'bronze', label: '1万', progress: at('volume', 10_000), unit: 'kg' },
  { id: 'vol100k', group: '記録', title: '10万kgの汗', desc: '総挙上重量が10万kg', rarity: 'silver', label: '10万', progress: at('volume', 100_000), unit: 'kg' },
  { id: 'vol1m', group: '記録', title: '100万kgの伝説', desc: '総挙上重量が100万kg', rarity: 'gold', label: '100万', progress: at('volume', 1_000_000), unit: 'kg' },

  { id: 'bench60', group: 'BIG3', title: 'ベンチ 60kg', desc: 'ベンチプレスで60kgを挙げる', rarity: 'bronze', label: '60', progress: at('bench', 60), unit: 'kg' },
  { id: 'bench80', group: 'BIG3', title: 'ベンチ 80kg', desc: 'ベンチプレスで80kgを挙げる', rarity: 'silver', label: '80', progress: at('bench', 80), unit: 'kg' },
  { id: 'bench100', group: 'BIG3', title: '100kgクラブ', desc: 'ベンチプレスで100kgを挙げる', rarity: 'gold', label: '100', progress: at('bench', 100), unit: 'kg' },
  {
    id: 'benchBW',
    group: 'BIG3',
    title: '体重ベンチ',
    desc: '体重と同じ重さでベンチプレス（体重の入力が必要）',
    rarity: 'silver',
    label: '×1',
    progress: (s) => ({ value: s.bodyweight > 0 ? s.bench : 0, target: s.bodyweight > 0 ? s.bodyweight : 1 }),
    unit: 'kg',
  },
  { id: 'squat100', group: 'BIG3', title: 'スクワット 100kg', desc: 'スクワットで100kgを挙げる', rarity: 'silver', label: '100', progress: at('squat', 100), unit: 'kg' },
  { id: 'squat140', group: 'BIG3', title: 'スクワット 140kg', desc: 'スクワットで140kgを挙げる', rarity: 'gold', label: '140', progress: at('squat', 140), unit: 'kg' },
  { id: 'dead100', group: 'BIG3', title: 'デッド 100kg', desc: 'デッドリフトで100kgを挙げる', rarity: 'bronze', label: '100', progress: at('deadlift', 100), unit: 'kg' },
  { id: 'dead140', group: 'BIG3', title: 'デッド 140kg', desc: 'デッドリフトで140kgを挙げる', rarity: 'silver', label: '140', progress: at('deadlift', 140), unit: 'kg' },
  { id: 'dead180', group: 'BIG3', title: 'デッド 180kg', desc: 'デッドリフトで180kgを挙げる', rarity: 'gold', label: '180', progress: at('deadlift', 180), unit: 'kg' },
  { id: 'total300', group: 'BIG3', title: 'BIG3 300', desc: 'BIG3合計300kg', rarity: 'silver', label: '300', progress: at('big3Total', 300), unit: 'kg' },
  { id: 'total400', group: 'BIG3', title: 'BIG3 400', desc: 'BIG3合計400kg', rarity: 'gold', label: '400', progress: at('big3Total', 400), unit: 'kg' },

  { id: 'run10k', group: 'ランニング・体操', title: '10km完走', desc: '1回で10kmを走る', rarity: 'silver', label: '10km', progress: at('longestRun', 10), unit: 'km' },
  { id: 'run100', group: 'ランニング・体操', title: '累計100km', desc: '走った距離の合計が100km', rarity: 'gold', label: '100km', progress: at('runTotal', 100), unit: 'km' },
  { id: 'gym10', group: 'ランニング・体操', title: '体操マスター', desc: '体操の日が10日', rarity: 'bronze', label: '体操', progress: at('gymDays', 10), unit: '日' },
];

/** 実績の判定に使う数字をまとめて計算する */
export function achievementStats(
  exercises: Exercise[],
  sets: SetRecord[],
  days: DayRecord[],
  bodyweight: number,
  weeklyGoal: number,
  today: string,
): AchievementStats {
  const partOf = new Map(exercises.map((e) => [e.id, e.bodyPart]));
  const byExercise = new Map<number, SetRecord[]>();
  for (const s of sets) {
    if (!byExercise.has(s.exerciseId)) byExercise.set(s.exerciseId, []);
    byExercise.get(s.exerciseId)!.push(s);
  }
  let weightRecords = 0;
  for (const [id, list] of byExercise) {
    const ex = exercises.find((e) => e.id === id);
    for (const kind of recordIdsFor(ex, list).values()) if (kind === 'weight') weightRecords++;
  }

  const bests = big3Bests(exercises, sets);
  const runs = sets.filter((s) => (s.distance ?? 0) > 0);

  // 1週間（月〜日）に鍛えた部位
  const partsByWeek = new Map<string, Set<BodyPart>>();
  for (const s of sets) {
    const part = partOf.get(s.exerciseId);
    if (!part) continue;
    const w = weekOf(s.date);
    if (!partsByWeek.has(w)) partsByWeek.set(w, new Set());
    partsByWeek.get(w)!.add(part);
  }

  return {
    trainingDays: new Set(sets.map((s) => s.date)).size,
    volume: sets.reduce((sum, s) => sum + s.weight * s.reps, 0),
    weightRecords,
    bench: bests.bench?.weight ?? 0,
    squat: bests.squat?.weight ?? 0,
    deadlift: bests.deadlift?.weight ?? 0,
    big3Total: BIG3.every((l) => bests[l.id]) ? BIG3.reduce((sum, l) => sum + bests[l.id]!.weight, 0) : 0,
    bodyweight,
    longestRun: Math.max(0, ...runs.map((s) => s.distance!)),
    runTotal: runs.reduce((sum, s) => sum + s.distance!, 0),
    gymDays: days.filter((d) => d.kind === 'gymnastics').length,
    bestStreak: weeklySummary(activeDays(sets, days), weeklyGoal, today).bestStreak,
    allParts: [...partsByWeek.values()].some((p) => p.size >= 6) ? 1 : 0,
    hasRecord: sets.length > 0 ? 1 : 0,
  };
}

export interface AchievementState extends Achievement {
  unlocked: boolean;
  value: number;
  target: number;
}

export function achievementStates(stats: AchievementStats): AchievementState[] {
  return ACHIEVEMENTS.map((a) => {
    const { value, target } = a.progress(stats);
    return { ...a, value, target, unlocked: value >= target };
  });
}

/** 「あと〇〇」の表示 */
export function remainingLabel(a: AchievementState) {
  const rest = Math.max(0, a.target - a.value);
  if (!a.unit) return '';
  const n = a.unit === 'km' ? Number(rest.toFixed(1)) : Math.ceil(rest);
  return `あと ${n.toLocaleString()}${a.unit}`;
}
