/** 最近鍛えたほど濃い青、前ほど薄い青（2週間以上前がいちばん薄い） */
const RECENT = [0x1e, 0x6f, 0xd9]; // 今日・昨日
const OLD = [0xbc, 0xd6, 0xf7]; // 2週間以上前（記録なしのグレーと見分けがつく薄い青）
/** まだ一度も鍛えていない部位 */
export const NEVER_COLOR = '#e5e7eb';
/** この日数で一番薄くなる */
export const FADE_DAYS = 14;

/** 最後に鍛えてからの日数 → 色。null（記録なし）はグレー */
export function recencyColor(days: number | null): string {
  if (days === null) return NEVER_COLOR;
  // 今日と昨日は同じ濃さ。そこから FADE_DAYS 日かけて薄くしていく
  const t = Math.min(1, Math.max(0, (days - 1) / (FADE_DAYS - 1)));
  const hex = RECENT.map((c, i) => Math.round(c + (OLD[i] - c) * t).toString(16).padStart(2, '0')).join('');
  return `#${hex}`;
}

/** 見本の帯に使うグラデーション（最近 → 前） */
export const RECENCY_GRADIENT = `linear-gradient(to right, ${recencyColor(0)}, ${recencyColor(FADE_DAYS)})`;
