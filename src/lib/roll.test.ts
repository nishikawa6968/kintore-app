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
  it('ゆっくり離せばその場の近い項目に止まる', () => {
    expect(flingTarget(3.2, 0)).toBe(3);
  });

  it('強く弾くほど遠くまで滑る', () => {
    const weak = flingTarget(0, 0.01);
    const strong = flingTarget(0, 0.03);
    expect(weak).toBeGreaterThan(1);
    expect(strong).toBeGreaterThan(weak * 2);
    expect(flingTarget(0, -0.03)).toBe(-strong);
  });

  it('止まるまでの時間は速さに合わせ、極端な値は丸める', () => {
    expect(flingDuration(6, 0.02)).toBe(900);
    expect(flingDuration(0.3, 0)).toBe(278);
    expect(flingDuration(50, 0.001)).toBe(2200);
    expect(flingDuration(1, 1)).toBe(260);
  });
});
