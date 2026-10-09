/** 使えるプレート（kg、重い順） */
export const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
/** バーの重さの選択肢 */
export const BAR_WEIGHTS = [20, 15, 10];

export interface PlateResult {
  /** 片側に付けるプレート（重い順） */
  perSide: number[];
  /** プレートで作れずに残った重さ（両側の合計） */
  rest: number;
}

/** 合計の重さにするために、バーの片側に付けるプレート。バーより軽ければ null */
export function platesFor(total: number, bar: number): PlateResult | null {
  if (total < bar) return null;
  // 小数の誤差が出ないよう、0.01kg 単位の整数で計算する
  let side = Math.round(((total - bar) / 2) * 100);
  const perSide: number[] = [];
  for (const p of PLATES) {
    const unit = Math.round(p * 100);
    while (side >= unit) {
      perSide.push(p);
      side -= unit;
    }
  }
  return { perSide, rest: (side * 2) / 100 };
}

/** プレートの色（よくあるジムの色分け） */
export const PLATE_COLORS: Record<number, string> = {
  25: '#ef4444',
  20: '#1e6fd9',
  15: '#f59e0b',
  10: '#22c55e',
  5: '#e5e7eb',
  2.5: '#f87171',
  1.25: '#9ca3af',
};
