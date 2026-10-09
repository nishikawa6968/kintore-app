import type { Exercise, SetRecord } from '../types';

/**
 * BIG3（ベンチプレス・スクワット・デッドリフト）の記録・バランス・レベルの計算。
 * 記録は「これまでに持ち上げた一番重い重量」（回数は問わない）。
 */

export type Big3Lift = 'bench' | 'squat' | 'deadlift';

export const BIG3: { id: Big3Lift; name: string; short: string; color: string }[] = [
  { id: 'bench', name: 'ベンチプレス', short: 'ベンチ', color: '#1e6fd9' },
  { id: 'squat', name: 'スクワット', short: 'スクワット', color: '#f59e0b' },
  { id: 'deadlift', name: 'デッドリフト', short: 'デッド', color: '#ef4444' },
];

/**
 * 一般的な目安のバランス：ベンチ : スクワット : デッドリフト ＝ 3 : 4 : 5。
 * 合計に占める割合にすると 25% / 33% / 42%。
 */
export const IDEAL_RATIO: Record<Big3Lift, number> = { bench: 3, squat: 4, deadlift: 5 };
const IDEAL_SUM = 12;

/** 目安の割合からこれ以上（％ポイント）ずれていたら「強め」「弱め」 */
const BALANCE_MARGIN = 2.5;

export const LEVELS = ['初心者', '初級者', '中級者', '上級者', 'エリート'] as const;
export type Level = (typeof LEVELS)[number];

/** レベルごとの色（初心者 → エリート）と、ゲームのランクのような記号 */
export const LEVEL_COLORS = ['#9ca3af', '#38bdf8', '#1e6fd9', '#8b3aa8', '#f59e0b'];
export const LEVEL_RANKS = ['D', 'C', 'B', 'A', 'S'];

/**
 * 成人男性の目安（体重の何倍を1回挙げられるか）。各レベルに届く倍率。
 * 一般に知られている筋力の基準表をもとにした、おおまかな値。
 */
export const STANDARDS: Record<Big3Lift | 'total', number[]> = {
  //        初心者 初級者 中級者 上級者 エリート
  bench: [0.5, 0.75, 1.25, 1.75, 2.0],
  squat: [0.75, 1.25, 1.5, 2.25, 2.75],
  deadlift: [1.0, 1.5, 2.0, 2.5, 3.0],
  total: [2.25, 3.5, 4.75, 6.5, 7.75],
};

export interface LiftBest {
  weight: number;
  reps: number;
  date: string;
}

/** 種目名が BIG3 のどれかなら、その種類を返す（前後の空白は無視） */
export function big3Of(exercise: Exercise): Big3Lift | undefined {
  const name = exercise.name.trim();
  return BIG3.find((l) => l.name === name)?.id;
}

/** BIG3 それぞれの、これまでに持ち上げた一番重い重量（同じ重さなら回数の多い方、さらに同じなら古い日） */
export function big3Bests(exercises: Exercise[], sets: SetRecord[]): Record<Big3Lift, LiftBest | null> {
  const liftOf = new Map<number, Big3Lift>();
  for (const e of exercises) {
    const lift = big3Of(e);
    if (lift) liftOf.set(e.id, lift);
  }
  const bests: Record<Big3Lift, LiftBest | null> = { bench: null, squat: null, deadlift: null };
  for (const s of sets) {
    const lift = liftOf.get(s.exerciseId);
    if (!lift || s.reps <= 0 || s.weight <= 0) continue;
    const b = bests[lift];
    if (!b || s.weight > b.weight || (s.weight === b.weight && (s.reps > b.reps || (s.reps === b.reps && s.date < b.date)))) {
      bests[lift] = { weight: s.weight, reps: s.reps, date: s.date };
    }
  }
  return bests;
}

export type Balance = 'strong' | 'weak' | 'even';

export interface BalanceRow {
  lift: Big3Lift;
  /** 合計に占める割合（％） */
  share: number;
  /** 目安の割合（％） */
  ideal: number;
  /** 3 : 4 : 5 と比べやすいよう、合計を 12 にそろえた値 */
  ratio: number;
  balance: Balance;
}

/** 3種目すべてに記録があるときだけ、バランスを出す */
export function big3Balance(bests: Record<Big3Lift, LiftBest | null>): BalanceRow[] | null {
  if (!BIG3.every((l) => bests[l.id])) return null;
  const total = BIG3.reduce((sum, l) => sum + bests[l.id]!.weight, 0);
  return BIG3.map(({ id }) => {
    const share = (bests[id]!.weight / total) * 100;
    const ideal = (IDEAL_RATIO[id] / IDEAL_SUM) * 100;
    const diff = share - ideal;
    return {
      lift: id,
      share,
      ideal,
      ratio: (bests[id]!.weight / total) * IDEAL_SUM,
      balance: diff >= BALANCE_MARGIN ? 'strong' : diff <= -BALANCE_MARGIN ? 'weak' : 'even',
    };
  });
}

export interface LevelInfo {
  /** 体重の何倍か */
  multiple: number;
  /** 届いているレベル（初心者の目安に届かなくても「初心者」） */
  level: Level;
  index: number;
  /** 次のレベルとそこまでの重さ（エリートなら null） */
  next: { level: Level; remaining: number } | null;
}

/** 重さと体重から、レベルを出す */
export function levelOf(kind: Big3Lift | 'total', weight: number, bodyweight: number): LevelInfo {
  const std = STANDARDS[kind];
  const multiple = weight / bodyweight;
  let index = 0;
  for (let i = 1; i < std.length; i++) if (multiple >= std[i]) index = i;
  const next =
    index < std.length - 1 ? { level: LEVELS[index + 1], remaining: Math.max(0, Math.ceil((std[index + 1] * bodyweight - weight) * 2) / 2) } : null;
  return { multiple, level: LEVELS[index], index, next };
}
