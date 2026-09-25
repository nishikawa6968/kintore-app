import Dexie, { type EntityTable } from 'dexie';
import type { Exercise, SetRecord } from '../types';
import { presetExercises } from './seed';

class KintoreDB extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>;
  sets!: EntityTable<SetRecord, 'id'>;

  constructor() {
    super('kintore');
    this.version(1).stores({
      exercises: '++id, bodyPart, order',
      sets: '++id, date, exerciseId, [exerciseId+date]',
    });
    this.on('populate', (tx) => {
      tx.table('exercises').bulkAdd(presetExercises());
    });
  }
}

export const db = new KintoreDB();

/** 種目の、ある日のセットを並び順で取得 */
export async function setsOf(exerciseId: number, date: string) {
  const rows = await db.sets.where({ exerciseId, date }).toArray();
  return rows.sort((a, b) => a.order - b.order);
}

export async function addSet(exerciseId: number, date: string, weight: number, reps: number) {
  const existing = await setsOf(exerciseId, date);
  const order = existing.length ? existing[existing.length - 1].order + 1 : 0;
  return db.sets.add({ exerciseId, date, weight, reps, order, createdAt: Date.now() } as SetRecord);
}

export interface BackupData {
  app: 'kintore';
  version: 1;
  exportedAt: string;
  exercises: Exercise[];
  sets: SetRecord[];
}

export async function exportData(): Promise<BackupData> {
  const [exercises, sets] = await Promise.all([db.exercises.toArray(), db.sets.toArray()]);
  return { app: 'kintore', version: 1, exportedAt: new Date().toISOString(), exercises, sets };
}

/** バックアップで全データを置き換える */
export async function importData(data: BackupData) {
  if (data.app !== 'kintore' || !Array.isArray(data.exercises) || !Array.isArray(data.sets)) {
    throw new Error('筋トレ記録のバックアップファイルではありません');
  }
  await db.transaction('rw', db.exercises, db.sets, async () => {
    await db.exercises.clear();
    await db.sets.clear();
    await db.exercises.bulkAdd(data.exercises);
    await db.sets.bulkAdd(data.sets);
  });
}
