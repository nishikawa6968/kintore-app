/**
 * 横ロールの位置計算。位置は「何個目の項目が真ん中にあるか」を小数で表し、
 * 一周しても値はそのまま増減し続ける（本当の項目は realIndex で求める）。
 */

/** 仮の位置 → 本当の位置（0〜n-1）。負の値もOK */
export const realIndex = (v: number, n: number) => ((v % n) + n) % n;

/** 今の位置 current から、本当の位置 target へ一番近い道のりで行く位置 */
export function nearestIndex(current: number, target: number, n: number) {
  const base = current - realIndex(current, n) + target;
  return [base - n, base, base + n].reduce((best, v) => (Math.abs(v - current) < Math.abs(best - current) ? v : best));
}

/**
 * これより遅く指を離したら滑らせず、一番近い項目にすぐ止める（項目/ms）。
 * 0.006 項目/ms ≒ 0.5px/ms（項目幅 84px のとき）。
 */
export const FAST_V = 0.006;

/** 速く弾いたとき、基準を超えた速さがどれだけ先まで届くか(ms)。大きいほどよく滑る */
export const GLIDE_MS = 450;

/** 指を離したときの速さ v（項目/ms）から、止まる項目を決める */
export function flingTarget(pos: number, v: number) {
  const speed = Math.abs(v);
  if (speed < FAST_V) return Math.round(pos);
  return Math.round(pos + Math.sign(v) * (speed - FAST_V) * GLIDE_MS);
}

/**
 * 止まるまでの時間(ms)。
 * - 遅い操作・タップ・矢印：短く素早く止める
 * - 速く弾いたとき：離した瞬間の速さと動き出しの速さがそろうように
 *   （ease-out-cubic の初速 = 3 × 距離 / 時間）決め、長すぎないよう丸める
 */
export function flingDuration(distance: number, v: number) {
  const d = Math.abs(distance);
  if (d < 0.01) return 0;
  const speed = Math.abs(v);
  if (speed < FAST_V) return Math.min(500, 140 + d * 80);
  return Math.min(1400, Math.max(200, (3 * d) / speed));
}
