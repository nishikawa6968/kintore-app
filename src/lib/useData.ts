import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSetting } from '../db/db';
import type { SettingKey, SettingValues } from '../types';

/**
 * 全種目・全セット・体操などの日を読み込む。個人の記録なので数千件程度を想定し、
 * 集計はメモリ上で行う（自己ベストなどを保存しないのでズレない）。
 */
export function useData() {
  const exercises = useLiveQuery(() => db.exercises.orderBy('order').toArray(), []);
  const sets = useLiveQuery(() => db.sets.toArray(), []);
  const days = useLiveQuery(() => db.days.toArray(), []);
  return exercises && sets && days ? { exercises, sets, days } : null;
}

/** 設定を1つ読み込む（無ければ fallback。読み込み中は undefined） */
export function useSetting<K extends SettingKey>(key: K, fallback: SettingValues[K]): SettingValues[K] | undefined {
  return useLiveQuery(async () => (await getSetting(key)) ?? fallback, [key]);
}
