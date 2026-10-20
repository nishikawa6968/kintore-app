/**
 * 新記録を狙う「逆ピラミッド」のメニュー。狙う重さ（100%）に向けて、軽い重さから回数を減らしながら上げていく。
 * 75%×5回 → 80%×4回 → 85%×3回 → 90%×2回 →（95% はとばす）→ 100%×1回
 */
export const PYRAMID_STEPS = [
  { pct: 75, reps: 5 },
  { pct: 80, reps: 4 },
  { pct: 85, reps: 3 },
  { pct: 90, reps: 2 },
  { pct: 100, reps: 1 },
];

/** 重さの刻み：軽い重さ（ダンベルなど）は 1kg、それ以外はプレートで組める 2.5kg */
export const pyramidStep = (target: number) => (target < 30 ? 1 : 2.5);

export interface PyramidSet {
  pct: number;
  weight: number;
  reps: number;
}

/** 狙う重さから、メニューのセットを作る（最後の 100% はその重さちょうど） */
export function pyramidSets(target: number, step = pyramidStep(target)): PyramidSet[] {
  return PYRAMID_STEPS.map(({ pct, reps }) => ({
    pct,
    reps,
    weight: pct === 100 ? target : Math.round((target * pct) / 100 / step) * step,
  }));
}
