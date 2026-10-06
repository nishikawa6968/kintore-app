import { describe, expect, it } from 'vitest';
import { FADE_DAYS, NEVER_COLOR, recencyColor } from './recency';

describe('最後に鍛えた日の近さで色を決める', () => {
  it('今日と昨日は赤', () => {
    expect(recencyColor(0)).toBe('#ef4444');
    expect(recencyColor(1)).toBe('#ef4444');
  });

  it('日がたつと 橙 → 黄 → 緑 → 青 と変わる', () => {
    // 2週間を5区間に分けた、それぞれの区切りの日
    const at = (k: number) => recencyColor(1 + ((FADE_DAYS - 1) * k) / 5);
    expect(at(1)).toBe('#f97316');
    expect(at(2)).toBe('#eab308');
    expect(at(3)).toBe('#22c55e');
    expect(at(4)).toBe('#3b82f6');
  });

  it('2週間以上前は紺むらさき', () => {
    expect(recencyColor(FADE_DAYS)).toBe('#312e81');
    expect(recencyColor(60)).toBe('#312e81');
  });

  it('記録がない部位はグレー', () => {
    expect(recencyColor(null)).toBe(NEVER_COLOR);
  });
});
