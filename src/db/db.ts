import Dexie, { type EntityTable } from 'dexie';
import type { Exercise, SetRecord } from '../types';
import { presetExercises } from './seed';

class KintoreDB extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>;
  sets!: EntityTable<SetRecord, 'id'>;

  constructor() {
    super('kintore');
    const stores = {
      exercises: '++id, bodyPart, order',
      sets: '++id, date, exerciseId, [exerciseId+date]',
    };
    this.version(1).stores(stores);
    // v2: 「お尻」をなくし、お尻の種目は記録ごと「脚」の末尾へ移す
    this.version(2)
      .stores(stores)
      .upgrade(async (tx) => {
        const table = tx.table('exercises');
        const legs = await table.where('bodyPart').equals('leg').toArray();
        let order = legs.reduce((max, e) => Math.max(max, e.order), -1) + 1;
        await table
          .where('bodyPart')
          .equals('glute')
          .modify((e) => {
            e.bodyPart = 'leg';
            e.order = order++;
          });
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
    // 「お尻」があった頃のバックアップは「脚」として読み込む
    await db.exercises.bulkAdd(
      data.exercises.map((e) => ((e.bodyPart as string) === 'glute' ? { ...e, bodyPart: 'leg' } : e)),
    );
    await db.sets.bulkAdd(data.sets);
  });
}
