import { describe, expect, it } from 'vitest';
import { COPIES, MID, midIndex, nearestIndex, realIndex } from './roll';

describe('横ロールの周回計算', () => {
  const n = 6;

  it('左右に5周ずつ余分に並べる', () => {
    expect(COPIES).toBe(11);
    expect(MID).toBe(5);
  });

  it('仮の位置から本当の位置を出す', () => {
    expect(realIndex(midIndex(2, n), n)).toBe(2);
    expect(realIndex(n * 7 + 5, n)).toBe(5);
  });

  it('最後の部位から次へ行くと最初の部位に回り込む（逆戻りしない）', () => {
    const lastOfMid = midIndex(n - 1, n);
    expect(nearestIndex(lastOfMid, 0, n)).toBe(lastOfMid + 1);
  });

  it('最初の部位から前へ行くと最後の部位に回り込む', () => {
    const firstOfMid = midIndex(0, n);
    expect(nearestIndex(firstOfMid, n - 1, n)).toBe(firstOfMid - 1);
  });

  it('近い方向へ回る', () => {
    expect(nearestIndex(midIndex(1, n), 3, n)).toBe(midIndex(3, n));
  });
});
