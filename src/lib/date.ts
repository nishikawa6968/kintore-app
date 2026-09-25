import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

export const toKey = (d: Date) => format(d, 'yyyy-MM-dd');
export const fromKey = (key: string) => parseISO(key);
export const todayKey = () => toKey(new Date());

/** 9月25日(金) */
export const dayLabel = (key: string) => format(fromKey(key), 'M月d日(E)', { locale: ja });
/** 2026/09/25 */
export const slashDate = (key: string) => format(fromKey(key), 'yyyy/MM/dd');

export const daysSince = (key: string, today: string = todayKey()) =>
  differenceInCalendarDays(fromKey(today), fromKey(key));

export function daysAgoLabel(key: string, today: string = todayKey()) {
  const n = daysSince(key, today);
  if (n <= 0) return '今日';
  if (n === 1) return '昨日';
  return `${n}日前`;
}
