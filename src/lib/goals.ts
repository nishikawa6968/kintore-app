import type { SetRecord } from '../types';
import { chronological, computeBest, computeRunBest, estimate1RM } from './records';

/**
 * 次に狙う目標。
 * - fire：持った重さの新記録（今までで一番重い重さ＋2.5kg を1回）→ 赤く燃える
 * - blue：いつも使っている重さで、回数を増やして推定1RM などを更新 → 青く光る
 */
export interface WeightGoals {
  fire: { weight: number; reps: number } | null;
  blue: { weight: number; reps: number } | null;
}

/** 重さの増やし方（プレートで組める幅） */
const STEP = 2.5;
/** これより多い回数が必要な目標は出さない */
const MAX_REPS = 30;

export function nextWeightGoals(sets: SetRecord[]): WeightGoals | null {
  const valid = sets.filter((s) => s.reps > 0).sort(chronological);
  const best = computeBest(valid);
  if (!best) return null;

  // 自重の種目（0kg）は回数だけを目標にする
  const fire = best.maxWeight > 0 ? { weight: best.maxWeight + STEP, reps: 1 } : null;

  // いつもの重さ：一番新しい日の一番重いセット
  const lastDate = valid[valid.length - 1].date;
  const working = Math.max(...valid.filter((s) => s.date === lastDate).map((s) => s.weight));
  let blue: WeightGoals['blue'] = null;
  for (let reps = 1; reps <= MAX_REPS; reps++) {
    const moreReps = working === best.maxWeight && reps > best.repsAtMax;
    if (moreReps || estimate1RM(working, reps) > best.best1RM) {
      blue = { weight: working, reps };
      break;
    }
  }
  return { fire, blue };
}

/** ランニングの次の目標：最長距離＋0.5km（燃える）と、平均ペースを5秒縮める（青く光る） */
export function nextRunGoals(sets: SetRecord[]) {
  const best = computeRunBest(sets);
  if (!best) return null;
  return { distance: Math.round((best.longest + 0.5) * 100) / 100, pace: Math.max(1, best.bestPace - 5) };
}
