/**
 * 横ロールの「何周目の何番目か」を扱う計算。
 * 項目を COPIES 周ぶん並べ、真ん中の周（MID）を基準にする。
 * 「仮の位置」= 周 × 項目数 + 本当の位置。
 */
export const COPIES = 11; // 真ん中の1周＋左右に5周ずつ
export const MID = Math.floor(COPIES / 2);

/** 仮の位置 → 本当の位置（0〜n-1） */
export const realIndex = (v: number, n: number) => ((v % n) + n) % n;

/** 本当の位置を真ん中の周の仮の位置にする */
export const midIndex = (real: number, n: number) => MID * n + real;

/** 今の仮の位置 current から、本当の位置 target へ一番近い道のりで行く仮の位置 */
export function nearestIndex(current: number, target: number, n: number) {
  const base = current - realIndex(current, n) + target;
  const candidates = [base - n, base, base + n].filter((v) => v >= 0 && v < n * COPIES);
  return candidates.reduce((best, v) => (Math.abs(v - current) < Math.abs(best - current) ? v : best));
}
