import { BODY_PARTS, type BodyPart, type Exercise, type SetRecord } from '../types';
import { big3Of, LEVELS, STANDARDS } from './big3';
import { fmtKg, fmtPace } from './records';
import { standardFor, type ExerciseStandard } from './standards';

/**
 * 種目ごとのランク（初心者 → エリート。BIG3 の称号と同じ5段階）。
 * 記録から毎回計算するので、記録を直したり消したりしてもズレない。
 */

export interface ExerciseRank {
  exercise: Exercise;
  std: ExerciseStandard;
  /** 各ランクに届く値（kg・回数・秒/km）。BIG3 は体重から計算した kg（体重がなければ null） */
  thresholds: number[] | null;
  /** 今の記録（換算した重さ・回数・ペース）。記録がなければ null */
  value: number | null;
  /** 今のランク（0：初心者 〜 4：エリート）。記録がない・体重がない（BIG3）ときは null */
  index: number | null;
  /** 次のランクまでの進み具合（0〜1） */
  progress: number;
}

/** 推定で「reps 回」に換算した重さ（Epley 式で 1RM を出して、reps 回に戻す） */
export const weightAtReps = (weight: number, reps: number, target: number) => (weight * (1 + reps / 30)) / (1 + target / 30);

const lowerIsBetter = (std: ExerciseStandard) => std.kind === 'pace';

/** 記録から、その基準でくらべる値を出す */
function valueOf(std: ExerciseStandard, sets: SetRecord[]): number | null {
  if (std.kind === 'pace') {
    const paces = sets.filter((s) => (s.distance ?? 0) >= 1 && (s.duration ?? 0) > 0).map((s) => s.duration! / s.distance!);
    return paces.length ? Math.min(...paces) : null;
  }
  const lifts = sets.filter((s) => s.reps > 0);
  if (std.kind === 'reps') return lifts.length ? Math.max(...lifts.map((s) => s.reps)) : null;
  const heavy = lifts.filter((s) => s.weight > 0);
  if (!heavy.length) return null;
  // BIG3 は BIG3 の画面と同じく、回数を問わず一番重い重さ
  if (std.kind === 'big3') return Math.max(...heavy.map((s) => s.weight));
  return Math.max(...heavy.map((s) => weightAtReps(s.weight, s.reps, std.reps!)));
}

/** その基準の、各ランクに届く値 */
function thresholdsOf(std: ExerciseStandard, exercise: Exercise, bodyweight: number): number[] | null {
  if (std.kind !== 'big3') return std.values ?? null;
  const lift = big3Of(exercise);
  if (!lift || bodyweight <= 0) return null;
  return STANDARDS[lift].map((m) => Math.ceil((m * bodyweight) / 2.5) * 2.5);
}

/** 1種目のランク。基準のない種目は null */
export function rankOf(exercise: Exercise, sets: SetRecord[], bodyweight: number): ExerciseRank | null {
  const std = standardFor(exercise);
  if (!std) return null;
  const thresholds = thresholdsOf(std, exercise, bodyweight);
  const value = valueOf(std, sets.filter((s) => s.exerciseId === exercise.id));
  if (!thresholds || value === null) return { exercise, std, thresholds, value, index: null, progress: 0 };

  const reached = (t: number) => (lowerIsBetter(std) ? value <= t : value >= t);
  let index = 0;
  for (let i = 1; i < thresholds.length; i++) if (reached(thresholds[i])) index = i;
  let progress = 1;
  if (index < thresholds.length - 1) {
    const from = index === 0 ? (lowerIsBetter(std) ? thresholds[0] * 1.3 : 0) : thresholds[index];
    const to = thresholds[index + 1];
    progress = Math.min(1, Math.max(0, (value - from) / (to - from)));
  }
  return { exercise, std, thresholds, value, index, progress };
}

/** 全種目のランク（基準のある種目だけ。非表示の種目も、記録があれば含める） */
export function allRanks(exercises: Exercise[], sets: SetRecord[], bodyweight: number) {
  return exercises
    .filter((e) => !e.archived || sets.some((s) => s.exerciseId === e.id))
    .map((e) => rankOf(e, sets, bodyweight))
    .filter((r): r is ExerciseRank => !!r);
}

/** 部位のランク：その部位で一番ランクの高い種目のランク（ランクのある種目がなければ null） */
export function partRanks(ranks: ExerciseRank[]): Record<BodyPart, number | null> {
  return Object.fromEntries(
    BODY_PARTS.map((p) => {
      const idx = ranks.filter((r) => r.exercise.bodyPart === p.id && r.index !== null).map((r) => r.index!);
      return [p.id, idx.length ? Math.max(...idx) : null];
    }),
  ) as Record<BodyPart, number | null>;
}

/** 基準の値の表示（例：21kg × 10回 / 15回 / 4'30"/km / 100kg） */
export function thresholdLabel(std: ExerciseStandard, value: number) {
  if (std.kind === 'pace') return `${fmtPace(value)}/km`;
  if (std.kind === 'reps') return `${Math.ceil(value)}回`;
  if (std.kind === 'big3') return `${fmtKg(value)}kg`;
  return `${fmtKg(value)}kg × ${std.reps}回`;
}

/** 今の記録の表示（例：10回換算 18.5kg） */
export function valueLabel(r: ExerciseRank) {
  if (r.value === null) return '未記録';
  if (r.std.kind === 'pace') return `${fmtPace(r.value)}/km`;
  if (r.std.kind === 'reps') return `${r.value}回`;
  if (r.std.kind === 'big3') return `${fmtKg(r.value)}kg`;
  return `${r.std.reps}回換算 ${fmtKg(Math.floor(r.value * 10) / 10)}kg`;
}

/** 次のランクの目標（エリートなら null） */
export function nextTarget(r: ExerciseRank) {
  if (r.index === null || !r.thresholds || r.index >= LEVELS.length - 1) return null;
  return { index: r.index + 1, level: LEVELS[r.index + 1], label: thresholdLabel(r.std, r.thresholds[r.index + 1]) };
}
