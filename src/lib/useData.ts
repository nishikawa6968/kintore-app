import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

/**
 * 全種目・全セットを読み込む。個人の記録なので数千件程度を想定し、
 * 集計はメモリ上で行う（自己ベストなどを保存しないのでズレない）。
 */
export function useData() {
  const exercises = useLiveQuery(() => db.exercises.orderBy('order').toArray(), []);
  const sets = useLiveQuery(() => db.sets.toArray(), []);
  return exercises && sets ? { exercises, sets } : null;
}
