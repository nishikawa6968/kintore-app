import { describe, expect, it } from 'vitest';
import { flingDuration, flingTarget, nearestIndex, realIndex } from './roll';

describe('横ロールの位置計算', () => {
  const n = 6;

  it('位置から本当の項目を出す（負の位置や何周先でもOK）', () => {
    expect(realIndex(2, n)).toBe(2);
    expect(realIndex(47, n)).toBe(5);
    expect(realIndex(-1, n)).toBe(5);
  });

  it('最後の項目から次へ行くと最初の項目に回り込む（逆戻りしない）', () => {
    expect(nearestIndex(5, 0, n)).toBe(6);
  });

  it('最初の項目から前へ行くと最後の項目に回り込む', () => {
    expect(nearestIndex(0, n - 1, n)).toBe(-1);
  });

  it('何周回した後でも近い方向へ回る', () => {
    expect(nearestIndex(31, 3, n)).toBe(33);
    expect(nearestIndex(-20, 2, n)).toBe(-22);
  });
});

describe('弾いたときの滑り', () => {
  it('遅く離したときは滑らずに一番近い項目へ', () => {
    expect(flingTarget(3.2, 0)).toBe(3);
    expect(flingTarget(3.4, 0.005)).toBe(3);
    expect(flingTarget(3.6, -0.005)).toBe(4);
  });

  it('遅い操作はすぐ止まる（0.2秒以内）', () => {
    expect(flingDuration(0.5, 0.004)).toBeLessThanOrEqual(200);
    expect(flingDuration(0.3, 0)).toBeLessThanOrEqual(200);
  });

  it('速く弾くほど遠くまで滑る（向きも保つ）', () => {
    const medium = flingTarget(0, 0.012);
    const strong = flingTarget(0, 0.03);
    expect(medium).toBeGreaterThanOrEqual(2);
    expect(strong).toBeGreaterThan(medium * 3);
    expect(flingTarget(0, -0.03)).toBe(-strong);
  });

  it('速く弾いても止まるまでは長くて1.4秒', () => {
    expect(flingDuration(11, 0.03)).toBe(1100);
    expect(flingDuration(40, 0.007)).toBe(1400);
    expect(flingDuration(1, 0.05)).toBe(200);
  });

  it('タップや矢印で1つ動くときは短く', () => {
    expect(flingDuration(1, 0)).toBe(220);
    expect(flingDuration(10, 0)).toBe(500);
  });
});
