import { describe, expect, it } from 'vitest';
import { FADE_DAYS, NEVER_COLOR, recencyColor } from './recency';

describe('最後に鍛えた日の近さで色を決める', () => {
  it('今日と昨日はいちばん濃い青', () => {
    expect(recencyColor(0)).toBe('#1e6fd9');
    expect(recencyColor(1)).toBe('#1e6fd9');
  });

  it('日がたつほど薄くなり、2週間以上前はいちばん薄い青', () => {
    const brightness = (c: string) => parseInt(c.slice(1, 3), 16) + parseInt(c.slice(3, 5), 16) + parseInt(c.slice(5, 7), 16);
    expect(brightness(recencyColor(3))).toBeGreaterThan(brightness(recencyColor(1)));
    expect(brightness(recencyColor(7))).toBeGreaterThan(brightness(recencyColor(3)));
    expect(recencyColor(FADE_DAYS)).toBe('#bcd6f7');
    expect(recencyColor(60)).toBe('#bcd6f7');
  });

  it('記録がない部位はグレー', () => {
    expect(recencyColor(null)).toBe(NEVER_COLOR);
  });
});
