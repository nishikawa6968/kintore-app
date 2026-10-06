import { describe, expect, it } from 'vitest';
import { FADE_DAYS, NEVER_COLOR, recencyColor } from './recency';

describe('最後に鍛えた日の近さで色を決める', () => {
  it('今日と昨日は赤', () => {
    expect(recencyColor(0)).toBe('#ef4444');
    expect(recencyColor(1)).toBe('#ef4444');
  });

  it('日がたつと 赤紫 → 紫 → 青紫 と青みがかっていく', () => {
    // 2週間を4区間に分けた、それぞれの区切りの日
    const at = (k: number) => recencyColor(1 + ((FADE_DAYS - 1) * k) / 4);
    expect(at(1)).toBe('#c4286f');
    expect(at(2)).toBe('#8b3aa8');
    expect(at(3)).toBe('#4b3a96');
    // 赤みが減り、青みが増えていく
    const red = (c: string) => parseInt(c.slice(1, 3), 16);
    expect(red(recencyColor(4))).toBeLessThan(red(recencyColor(1)));
    expect(red(recencyColor(9))).toBeLessThan(red(recencyColor(4)));
  });

  it('2週間以上前は暗い紺色', () => {
    expect(recencyColor(FADE_DAYS)).toBe('#1e2f5c');
    expect(recencyColor(60)).toBe('#1e2f5c');
  });

  it('記録がない部位はグレー', () => {
    expect(recencyColor(null)).toBe(NEVER_COLOR);
  });
});
