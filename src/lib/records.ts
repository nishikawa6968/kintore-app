import type { BodyPart, Exercise, SetRecord } from '../types';

/** 推定1RM（Epley式）。小数第1位で丸める */
export function estimate1RM(weight: number, reps: number) {
  if (weight <= 0 || reps <= 0) return 0;
  const rm = reps === 1 ? weight : weight * (1 + reps / 30);
  return Math.round(rm * 10) / 10;
}

/** 記録した順（日付 → 並び順 → 登録順） */
export function chronological(a: SetRecord, b: SetRecord) {
  return a.date.localeCompare(b.date) || a.order - b.order || a.id - b.id;
}

export interface Best {
  maxWeight: number;
  repsAtMax: number;
  /** 最高重量×回数を最初に達成した日 */
  maxDate: string;
  best1RM: number;
  best1RMDate: string;
}

/** 種目のセット記録から自己ベストを計算（reps 0 のセットは除外） */
export function computeBest(sets: SetRecord[]): Best | null {
  const valid = sets.filter((s) => s.reps > 0).sort(chronological);
  if (!valid.length) return null;
  let best: Best | null = null;
  for (const s of valid) {
    const rm = estimate1RM(s.weight, s.reps);
    if (!best) {
      best = { maxWeight: s.weight, repsAtMax: s.reps, maxDate: s.date, best1RM: rm, best1RMDate: s.date };
      continue;
    }
    if (s.weight > best.maxWeight || (s.weight === best.maxWeight && s.reps > best.repsAtMax)) {
      best.maxWeight = s.weight;
      best.repsAtMax = s.reps;
      best.maxDate = s.date;
    }
    if (rm > best.best1RM) {
      best.best1RM = rm;
      best.best1RMDate = s.date;
    }
  }
  return best;
}

/**
 * 1種目のセット記録を時系列にたどり、それまでの自己ベストを更新したセットの id を返す。
 * 「最高重量を超えた」「最高重量と同じで回数が増えた」「推定1RMが更新」のいずれか。
 * その種目の最初のセットは比較対象がないので新記録扱いにしない。
 */
export function recordSetIds(sets: SetRecord[]): Set<number> {
  const ids = new Set<number>();
  let maxWeight = -1;
  let repsAtMax = 0;
  let best1RM = 0;
  let seen = false;
  for (const s of sets.filter((s) => s.reps > 0).sort(chronological)) {
    const rm = estimate1RM(s.weight, s.reps);
    const beatsWeight = s.weight > maxWeight || (s.weight === maxWeight && s.reps > repsAtMax);
    const beats1RM = rm > best1RM;
    if (seen && (beatsWeight || beats1RM)) ids.add(s.id);
    if (beatsWeight) {
      maxWeight = s.weight;
      repsAtMax = s.reps;
    }
    if (beats1RM) best1RM = rm;
    seen = true;
  }
  return ids;
}

/** 部位ごとの最終トレーニング日 */
export function lastTrainedByPart(sets: SetRecord[], exercises: Exercise[]) {
  const partOf = new Map(exercises.map((e) => [e.id, e.bodyPart]));
  const result = new Map<BodyPart, string>();
  for (const s of sets) {
    const part = partOf.get(s.exerciseId);
    if (!part) continue;
    const prev = result.get(part);
    if (!prev || s.date > prev) result.set(part, s.date);
  }
  return result;
}

/** 日付 → その日に鍛えた部位 */
export function partsByDate(sets: SetRecord[], exercises: Exercise[]) {
  const partOf = new Map(exercises.map((e) => [e.id, e.bodyPart]));
  const result = new Map<string, Set<BodyPart>>();
  for (const s of sets) {
    const part = partOf.get(s.exerciseId);
    if (!part) continue;
    if (!result.has(s.date)) result.set(s.date, new Set());
    result.get(s.date)!.add(part);
  }
  return result;
}

/** 総ボリューム（重量×回数の合計） */
export const volume = (sets: SetRecord[]) => sets.reduce((sum, s) => sum + s.weight * s.reps, 0);

/** 表示用：80 → "80", 72.5 → "72.5" */
export const fmtKg = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, ''));

/** 0kg は自重として表示 */
export const fmtWeight = (w: number) => (w === 0 ? '自重' : `${fmtKg(w)}kg`);
