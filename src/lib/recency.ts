/**
 * 最後に鍛えた日の近さを色で表す。最近ほど赤、そこから 橙 → 黄 → 緑 → 青 と変わり、
 * 2週間以上前は紺むらさき。どの部位を最近やれていないかがひと目で分かるようにする。
 */
const STOPS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#312e81'];
/** まだ一度も鍛えていない部位 */
export const NEVER_COLOR = '#e5e7eb';
/** この日数で一番昔の色（紺むらさき）になる */
export const FADE_DAYS = 14;

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (c: number[]) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

/** 最後に鍛えてからの日数 → 色。null（記録なし）はグレー */
export function recencyColor(days: number | null): string {
  if (days === null) return NEVER_COLOR;
  // 今日と昨日は同じ赤。そこから FADE_DAYS 日かけて色の並びをたどる
  const t = Math.min(1, Math.max(0, (days - 1) / (FADE_DAYS - 1)));
  const pos = t * (STOPS.length - 1);
  const i = Math.min(STOPS.length - 2, Math.floor(pos));
  const f = pos - i;
  const a = rgb(STOPS[i]);
  const b = rgb(STOPS[i + 1]);
  return toHex(a.map((v, k) => v + (b[k] - v) * f));
}

/** 見本の帯に使うグラデーション（最近 → 2週間〜） */
export const RECENCY_GRADIENT = `linear-gradient(to right, ${STOPS.join(', ')})`;
