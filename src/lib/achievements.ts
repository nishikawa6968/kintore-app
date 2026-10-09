import type { BodyPart, DayRecord, Exercise, SetRecord } from '../types';
import { BIG3, STANDARDS, big3Bests } from './big3';
import { recordIdsFor } from './records';
import { activeDays, weekOf, weeklySummary } from './streak';

/**
 * 実績バッジ。記録から毎回計算するので、記録を直したり消したりしてもズレない。
 * （お知らせ済みかどうかだけを設定に保存する）
 */

/** 珍しさ：銅 → 銀 → 金 → プラチナ → レジェンド */
export type Rarity = 'bronze' | 'silver' | 'gold' | 'platinum' | 'legend';
export const RARITIES: Rarity[] = ['legend', 'platinum', 'gold', 'silver', 'bronze'];

export interface AchievementStats {
  /** 筋トレ・ランニングのセットがある日数 */
  trainingDays: number;
  /** 記録したセットの数（ランニングを除く） */
  totalSets: number;
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

/** 体重の何倍を挙げたか（体重を入れていなければ解除されない）。進み具合は kg で出す */
const timesBW = (key: 'bench' | 'squat' | 'deadlift', multiple: number) => (s: AchievementStats) =>
  s.bodyweight > 0 ? { value: s[key], target: Math.round(multiple * s.bodyweight * 10) / 10 } : { value: 0, target: Infinity };

/** BIG3 合計が称号（STANDARDS.total）に届いたか */
const rankAt = (tier: number) => (s: AchievementStats) =>
  s.bodyweight > 0 ? { value: s.big3Total, target: Math.round(STANDARDS.total[tier] * s.bodyweight * 10) / 10 } : { value: 0, target: Infinity };

type Def = Omit<Achievement, 'group'>;
const group = (name: string, defs: Def[]): Achievement[] => defs.map((d) => ({ ...d, group: name }));

/** 重さの段階の実績をまとめて作る（[重さ, 珍しさ, 題名?]） */
const liftSeries = (key: 'bench' | 'squat' | 'deadlift', idPrefix: string, name: string, steps: [number, Rarity, string?][]): Def[] =>
  steps.map(([kg, rarity, title]) => ({
    id: `${idPrefix}${kg}`,
    title: title ?? `${name} ${kg}kg`,
    desc: `${name}で${kg}kgを挙げる`,
    rarity,
    label: String(kg),
    progress: at(key, kg),
    unit: 'kg',
  }));

export const ACHIEVEMENTS: Achievement[] = [
  ...group('はじめて', [
    { id: 'first', title: 'はじめの一歩', desc: '最初の記録をつける', rarity: 'bronze', label: '1st', progress: at('hasRecord', 1) },
    { id: 'pr1', title: '初めての新記録', desc: '持った重さの新記録を出す', rarity: 'bronze', label: 'PR', progress: at('weightRecords', 1), unit: '回' },
    { id: 'big3debut', title: 'BIG3デビュー', desc: 'ベンチ・スクワット・デッドを全部記録する', rarity: 'bronze', label: 'BIG3', progress: (s) => ({ value: s.big3Total > 0 ? 1 : 0, target: 1 }) },
  ]),

  ...group('継続', [
    { id: 'days10', title: '10日の努力', desc: 'トレーニングした日が10日', rarity: 'bronze', label: '10日', progress: at('trainingDays', 10), unit: '日' },
    { id: 'days30', title: '30日の習慣', desc: 'トレーニングした日が30日', rarity: 'silver', label: '30日', progress: at('trainingDays', 30), unit: '日' },
    { id: 'days100', title: '100日の鉄人', desc: 'トレーニングした日が100日', rarity: 'gold', label: '100日', progress: at('trainingDays', 100), unit: '日' },
    { id: 'days200', title: '200日の求道者', desc: 'トレーニングした日が200日', rarity: 'gold', label: '200日', progress: at('trainingDays', 200), unit: '日' },
    { id: 'days365', title: '365日の覚悟', desc: 'トレーニングした日が365日', rarity: 'platinum', label: '365', progress: at('trainingDays', 365), unit: '日' },
    { id: 'days1000', title: '1000日の伝説', desc: 'トレーニングした日が1000日', rarity: 'legend', label: '1000', progress: at('trainingDays', 1000), unit: '日' },
    { id: 'streak4', title: '1か月皆勤', desc: '週の目標を4週続けて達成', rarity: 'silver', label: '4週', progress: at('bestStreak', 4), unit: '週' },
    { id: 'streak12', title: '3か月皆勤', desc: '週の目標を12週続けて達成', rarity: 'gold', label: '12週', progress: at('bestStreak', 12), unit: '週' },
    { id: 'streak26', title: '半年皆勤', desc: '週の目標を26週続けて達成', rarity: 'platinum', label: '26週', progress: at('bestStreak', 26), unit: '週' },
    { id: 'streak52', title: '1年皆勤', desc: '週の目標を52週続けて達成', rarity: 'legend', label: '52週', progress: at('bestStreak', 52), unit: '週' },
    { id: 'allparts', title: '全身制覇', desc: '1週間で6部位すべてを鍛える', rarity: 'silver', label: '全身', progress: at('allParts', 1) },
  ]),

  ...group('記録', [
    { id: 'pr10', title: '記録ハンター', desc: '持った重さの新記録を10回', rarity: 'bronze', label: 'PR10', progress: at('weightRecords', 10), unit: '回' },
    { id: 'pr50', title: '記録の鬼', desc: '持った重さの新記録を50回', rarity: 'silver', label: 'PR50', progress: at('weightRecords', 50), unit: '回' },
    { id: 'pr100', title: '記録の覇者', desc: '持った重さの新記録を100回', rarity: 'gold', label: '100', progress: at('weightRecords', 100), unit: '回' },
    { id: 'pr300', title: '記録の怪物', desc: '持った重さの新記録を300回', rarity: 'platinum', label: '300', progress: at('weightRecords', 300), unit: '回' },
    { id: 'pr500', title: '記録の神', desc: '持った重さの新記録を500回', rarity: 'legend', label: '500', progress: at('weightRecords', 500), unit: '回' },
    { id: 'sets100', title: '100セット', desc: '記録したセットが100', rarity: 'bronze', label: '100', progress: at('totalSets', 100), unit: 'セット' },
    { id: 'sets1000', title: '1000セット', desc: '記録したセットが1000', rarity: 'silver', label: '1000', progress: at('totalSets', 1000), unit: 'セット' },
    { id: 'sets5000', title: '5000セット', desc: '記録したセットが5000', rarity: 'gold', label: '5000', progress: at('totalSets', 5000), unit: 'セット' },
    { id: 'sets10000', title: '1万セット', desc: '記録したセットが1万', rarity: 'platinum', label: '1万', progress: at('totalSets', 10000), unit: 'セット' },
    { id: 'vol10k', title: '1万kgの汗', desc: '総挙上重量が1万kg', rarity: 'bronze', label: '1万', progress: at('volume', 10_000), unit: 'kg' },
    { id: 'vol100k', title: '10万kgの汗', desc: '総挙上重量が10万kg', rarity: 'silver', label: '10万', progress: at('volume', 100_000), unit: 'kg' },
    { id: 'vol1m', title: '100万kgの汗', desc: '総挙上重量が100万kg', rarity: 'gold', label: '100万', progress: at('volume', 1_000_000), unit: 'kg' },
    { id: 'vol5m', title: '500万kgの汗', desc: '総挙上重量が500万kg', rarity: 'platinum', label: '500万', progress: at('volume', 5_000_000), unit: 'kg' },
    { id: 'vol10m', title: '1000万kgの伝説', desc: '総挙上重量が1000万kg', rarity: 'legend', label: '1千万', progress: at('volume', 10_000_000), unit: 'kg' },
  ]),

  ...group('ベンチプレス', liftSeries('bench', 'bench', 'ベンチプレス', [
    [40, 'bronze'], [60, 'bronze'], [80, 'silver'], [100, 'gold', '100kgクラブ'], [120, 'gold'], [140, 'platinum'], [160, 'legend'],
  ])),
  ...group('スクワット', liftSeries('squat', 'squat', 'スクワット', [
    [60, 'bronze'], [80, 'bronze'], [100, 'silver'], [140, 'gold'], [180, 'gold'], [200, 'platinum', '200kgの壁'], [250, 'legend'],
  ])),
  ...group('デッドリフト', liftSeries('deadlift', 'dead', 'デッドリフト', [
    [80, 'bronze'], [100, 'bronze'], [140, 'silver'], [180, 'gold'], [200, 'gold'], [250, 'platinum'], [300, 'legend', '300kgの怪力'],
  ])),

  ...group('BIG3', [
    { id: 'total200', title: 'BIG3 200', desc: 'BIG3合計200kg', rarity: 'bronze', label: '200', progress: at('big3Total', 200), unit: 'kg' },
    { id: 'total300', title: 'BIG3 300', desc: 'BIG3合計300kg', rarity: 'silver', label: '300', progress: at('big3Total', 300), unit: 'kg' },
    { id: 'total400', title: 'BIG3 400', desc: 'BIG3合計400kg', rarity: 'silver', label: '400', progress: at('big3Total', 400), unit: 'kg' },
    { id: 'total500', title: 'BIG3 500', desc: 'BIG3合計500kg', rarity: 'gold', label: '500', progress: at('big3Total', 500), unit: 'kg' },
    { id: 'total600', title: 'BIG3 600', desc: 'BIG3合計600kg', rarity: 'platinum', label: '600', progress: at('big3Total', 600), unit: 'kg' },
    { id: 'total700', title: 'BIG3 700', desc: 'BIG3合計700kg', rarity: 'platinum', label: '700', progress: at('big3Total', 700), unit: 'kg' },
    { id: 'total800', title: 'BIG3 800', desc: 'BIG3合計800kg', rarity: 'legend', label: '800', progress: at('big3Total', 800), unit: 'kg' },
    { id: 'rank1', title: '称号：初級者', desc: 'BIG3合計で初級者になる（体重の入力が必要）', rarity: 'bronze', label: 'C', progress: rankAt(1), unit: 'kg' },
    { id: 'rank2', title: '称号：中級者', desc: 'BIG3合計で中級者になる（体重の入力が必要）', rarity: 'silver', label: 'B', progress: rankAt(2), unit: 'kg' },
    { id: 'rank3', title: '称号：上級者', desc: 'BIG3合計で上級者になる（体重の入力が必要）', rarity: 'gold', label: 'A', progress: rankAt(3), unit: 'kg' },
    { id: 'rank4', title: '称号：エリート', desc: 'BIG3合計でエリートになる（体重の入力が必要）', rarity: 'legend', label: 'S', progress: rankAt(4), unit: 'kg' },
  ]),

  ...group('体重比', [
    { id: 'benchBW', title: '体重ベンチ', desc: '体重と同じ重さでベンチプレス', rarity: 'silver', label: '×1', progress: timesBW('bench', 1), unit: 'kg' },
    { id: 'bench1.5BW', title: 'ベンチ 体重×1.5', desc: '体重の1.5倍でベンチプレス', rarity: 'gold', label: '×1.5', progress: timesBW('bench', 1.5), unit: 'kg' },
    { id: 'bench2BW', title: 'ベンチ 体重×2', desc: '体重の2倍でベンチプレス', rarity: 'legend', label: '×2', progress: timesBW('bench', 2), unit: 'kg' },
    { id: 'squat1.5BW', title: 'スクワット 体重×1.5', desc: '体重の1.5倍でスクワット', rarity: 'silver', label: '×1.5', progress: timesBW('squat', 1.5), unit: 'kg' },
    { id: 'squat2BW', title: 'スクワット 体重×2', desc: '体重の2倍でスクワット', rarity: 'gold', label: '×2', progress: timesBW('squat', 2), unit: 'kg' },
    { id: 'squat2.5BW', title: 'スクワット 体重×2.5', desc: '体重の2.5倍でスクワット', rarity: 'legend', label: '×2.5', progress: timesBW('squat', 2.5), unit: 'kg' },
    { id: 'dead2BW', title: 'デッド 体重×2', desc: '体重の2倍でデッドリフト', rarity: 'gold', label: '×2', progress: timesBW('deadlift', 2), unit: 'kg' },
    { id: 'dead2.5BW', title: 'デッド 体重×2.5', desc: '体重の2.5倍でデッドリフト', rarity: 'platinum', label: '×2.5', progress: timesBW('deadlift', 2.5), unit: 'kg' },
    { id: 'dead3BW', title: 'デッド 体重×3', desc: '体重の3倍でデッドリフト', rarity: 'legend', label: '×3', progress: timesBW('deadlift', 3), unit: 'kg' },
  ]),

  ...group('ランニング', [
    { id: 'run5k', title: '5km完走', desc: '1回で5kmを走る', rarity: 'bronze', label: '5km', progress: at('longestRun', 5), unit: 'km' },
    { id: 'run10k', title: '10km完走', desc: '1回で10kmを走る', rarity: 'silver', label: '10km', progress: at('longestRun', 10), unit: 'km' },
    { id: 'runHalf', title: 'ハーフマラソン', desc: '1回で21.0975kmを走る', rarity: 'gold', label: 'ハーフ', progress: at('longestRun', 21.0975), unit: 'km' },
    { id: 'runFull', title: 'フルマラソン', desc: '1回で42.195kmを走る', rarity: 'legend', label: 'フル', progress: at('longestRun', 42.195), unit: 'km' },
    { id: 'run50', title: '累計50km', desc: '走った距離の合計が50km', rarity: 'bronze', label: '50km', progress: at('runTotal', 50), unit: 'km' },
    { id: 'run100', title: '累計100km', desc: '走った距離の合計が100km', rarity: 'silver', label: '100', progress: at('runTotal', 100), unit: 'km' },
    { id: 'run500', title: '累計500km', desc: '走った距離の合計が500km', rarity: 'gold', label: '500', progress: at('runTotal', 500), unit: 'km' },
    { id: 'run1000', title: '累計1000km', desc: '走った距離の合計が1000km', rarity: 'platinum', label: '1000', progress: at('runTotal', 1000), unit: 'km' },
  ]),

  ...group('体操', [
    { id: 'gym10', title: '体操マスター', desc: '体操の日が10日', rarity: 'bronze', label: '10日', progress: at('gymDays', 10), unit: '日' },
    { id: 'gym30', title: '体操の達人', desc: '体操の日が30日', rarity: 'silver', label: '30日', progress: at('gymDays', 30), unit: '日' },
    { id: 'gym100', title: '体操の仙人', desc: '体操の日が100日', rarity: 'gold', label: '100日', progress: at('gymDays', 100), unit: '日' },
  ]),
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
    totalSets: sets.filter((s) => !(s.distance ?? 0)).length,
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

/** 体重を入れていないと進まない実績（「あと〇〇」の代わりに案内を出す） */
export const needsBodyweight = (a: AchievementState) => a.target === Infinity;

/** 「あと〇〇」の表示 */
export function remainingLabel(a: AchievementState) {
  if (needsBodyweight(a)) return 'BIG3で体重を入力';
  const rest = Math.max(0, a.target - a.value);
  if (!a.unit) return '';
  const n = a.unit === 'km' ? Number(rest.toFixed(1)) : Math.ceil(rest);
  // 大きな数は「万」でまとめて短くする（例：4,927,578 → 492.8万）
  const text = n >= 10000 ? `${Number((n / 10000).toFixed(1))}万` : n.toLocaleString();
  return `あと ${text}${a.unit}`;
}
