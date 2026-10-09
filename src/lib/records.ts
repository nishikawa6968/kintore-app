import { isCardio, type BodyPart, type Exercise, type SetRecord } from '../types';

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
  return new Set(weightRecordKinds(sets).keys());
}

/**
 * 新記録の種類。
 * - weight：持った重量の新記録（最高重量を超えた／同じ重量で回数が増えた）。ランニングは最長距離
 * - rm：推定1RMだけの新記録（重量の記録は更新していない）。ランニングは平均ペース
 * 持った重量の新記録のほうが嬉しいので、両方更新したときは weight にする。
 */
export type RecordKind = 'weight' | 'rm';

/** 重量の種目で、新記録になったセットの id → 種類 */
export function weightRecordKinds(sets: SetRecord[]): Map<number, RecordKind> {
  const kinds = new Map<number, RecordKind>();
  let maxWeight = -1;
  let repsAtMax = 0;
  let best1RM = 0;
  let seen = false;
  for (const s of sets.filter((s) => s.reps > 0).sort(chronological)) {
    const rm = estimate1RM(s.weight, s.reps);
    const beatsWeight = s.weight > maxWeight || (s.weight === maxWeight && s.reps > repsAtMax);
    const beats1RM = rm > best1RM;
    if (seen && beatsWeight) kinds.set(s.id, 'weight');
    else if (seen && beats1RM) kinds.set(s.id, 'rm');
    if (beatsWeight) {
      maxWeight = s.weight;
      repsAtMax = s.reps;
    }
    if (beats1RM) best1RM = rm;
    seen = true;
  }
  return kinds;
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

/* ---------- ランニング（距離×時間） ---------- */

const validRun = (s: SetRecord) => (s.distance ?? 0) > 0 && (s.duration ?? 0) > 0;

/** 1kmあたりの秒数。記録が足りなければ 0 */
export const paceOf = (s: SetRecord) => (validRun(s) ? s.duration! / s.distance! : 0);

export interface RunBest {
  longest: number;
  longestDate: string;
  /** 1kmあたりの秒数（小さいほど速い） */
  bestPace: number;
  bestPaceDate: string;
}

/** ランニングの自己ベスト：最長距離と、1kmの平均ペースのベスト */
export function computeRunBest(sets: SetRecord[]): RunBest | null {
  const valid = sets.filter(validRun).sort(chronological);
  if (!valid.length) return null;
  const best: RunBest = { longest: 0, longestDate: '', bestPace: Infinity, bestPaceDate: '' };
  for (const s of valid) {
    if (s.distance! > best.longest) {
      best.longest = s.distance!;
      best.longestDate = s.date;
    }
    const p = paceOf(s);
    if (p < best.bestPace) {
      best.bestPace = p;
      best.bestPaceDate = s.date;
    }
  }
  return best;
}

/** それまでの最長距離か、平均ペースのベストを更新したランの id（最初の1本は除く） */
export function runRecordIds(sets: SetRecord[]): Set<number> {
  return new Set(runRecordKinds(sets).keys());
}

/** ランニングで、新記録になったランの id → 種類（最長距離は weight、平均ペースだけなら rm） */
export function runRecordKinds(sets: SetRecord[]): Map<number, RecordKind> {
  const kinds = new Map<number, RecordKind>();
  let longest = 0;
  let bestPace = Infinity;
  let seen = false;
  for (const s of sets.filter(validRun).sort(chronological)) {
    const p = paceOf(s);
    const longer = s.distance! > longest;
    const faster = p < bestPace;
    if (seen && longer) kinds.set(s.id, 'weight');
    else if (seen && faster) kinds.set(s.id, 'rm');
    if (longer) longest = s.distance!;
    if (faster) bestPace = p;
    seen = true;
  }
  return kinds;
}

/** 種目に合わせて「新記録のセット（id → 種類）」を求める */
export const recordIdsFor = (exercise: Exercise | undefined, sets: SetRecord[]) =>
  isCardio(exercise) ? runRecordKinds(sets) : weightRecordKinds(sets);

/** 5 → "5km"、5.25 → "5.25km" */
export const fmtKm = (km: number) => `${Number(km.toFixed(2))}km`;

/** 秒 → "25:30"、1時間以上は "1:02:03" */
export function fmtDuration(sec: number) {
  const s = Math.round(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** 1kmあたりの秒数 → 5'06" */
export function fmtPace(secPerKm: number) {
  if (!Number.isFinite(secPerKm) || secPerKm <= 0) return '—';
  const s = Math.round(secPerKm);
  return `${Math.floor(s / 60)}'${String(s % 60).padStart(2, '0')}"`;
}

/** 時速(km/h) */
export const speedKmh = (s: SetRecord) => (validRun(s) ? Math.round((s.distance! / (s.duration! / 3600)) * 10) / 10 : 0);

/* ---------- 画面表示用のまとめ ---------- */

export interface BestSummary {
  /** 大きく出す記録（例：75kg×6回 / 最長 10km） */
  main: string;
  /** 小さく添える記録（例：1RM 90kg / ベスト平均 4'50"/km） */
  sub: string;
  /** main を達成した日 */
  date: string;
  /** sub を達成した日 */
  subDate: string;
  /** どれかの記録を更新した一番新しい日 */
  latest: string;
}

/** 種目の自己ベストを、重量の種目・ランニングに合わせて表示用にまとめる */
export function bestSummary(exercise: Exercise | undefined, sets: SetRecord[]): BestSummary | null {
  if (isCardio(exercise)) {
    const b = computeRunBest(sets);
    if (!b) return null;
    return {
      main: `最長 ${fmtKm(b.longest)}`,
      sub: `ベスト平均 ${fmtPace(b.bestPace)}/km`,
      date: b.longestDate,
      subDate: b.bestPaceDate,
      latest: b.longestDate > b.bestPaceDate ? b.longestDate : b.bestPaceDate,
    };
  }
  const b = computeBest(sets);
  if (!b) return null;
  return {
    main: `${fmtWeight(b.maxWeight)}×${b.repsAtMax}回`,
    sub: `1RM ${b.best1RM > 0 ? `${fmtKg(b.best1RM)}kg` : '—'}`,
    date: b.maxDate,
    subDate: b.best1RMDate,
    latest: b.maxDate > b.best1RMDate ? b.maxDate : b.best1RMDate,
  };
}

/** セット1つの短い表示（例：75kg×6 / 5km 25:30） */
export const setLabel = (s: SetRecord, cardio: boolean) =>
  cardio ? `${fmtKm(s.distance ?? 0)} ${fmtDuration(s.duration ?? 0)}` : `${fmtWeight(s.weight)}×${s.reps}`;
