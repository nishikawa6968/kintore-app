import Dexie, { type EntityTable } from 'dexie';
import type { DayRecord, Exercise, SetRecord, Setting } from '../types';
import { presetExercises } from './seed';

class KintoreDB extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>;
  sets!: EntityTable<SetRecord, 'id'>;
  days!: EntityTable<DayRecord, 'date'>;
  settings!: EntityTable<Setting, 'key'>;

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
    // v3: 脚に「ランニング」（距離×時間で記録）を追加
    this.version(3)
      .stores(stores)
      .upgrade(async (tx) => {
        const table = tx.table('exercises');
        const existing = await table.where('bodyPart').equals('leg').toArray();
        const running = existing.find((e) => e.name === 'ランニング');
        if (running) {
          await table.update(running.id, { kind: 'cardio' });
          return;
        }
        const order = existing.reduce((max, e) => Math.max(max, e.order), -1) + 1;
        await table.add({ name: 'ランニング', bodyPart: 'leg', kind: 'cardio', archived: false, order });
      });
    // v4: 体操などの日（筋トレ以外の日）を追加
    this.version(4).stores({ ...stores, days: 'date' });
    // v5: 体重などの設定を追加（BIG3 のレベル判定に使う）
    this.version(5).stores({ ...stores, days: 'date', settings: 'key' });
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

/** ランニングの1本を追加（距離 km・時間 秒） */
export async function addRun(exerciseId: number, date: string, distance: number, duration: number) {
  const existing = await setsOf(exerciseId, date);
  const order = existing.length ? existing[existing.length - 1].order + 1 : 0;
  return db.sets.add({ exerciseId, date, weight: 0, reps: 0, distance, duration, order, createdAt: Date.now() } as SetRecord);
}

/** その日を体操の日にする／取り消す */
export async function setGymnasticsDay(date: string, on: boolean) {
  if (on) await db.days.put({ date, kind: 'gymnastics' });
  else await db.days.delete(date);
}

export interface BackupData {
  app: 'kintore';
  version: 1;
  exportedAt: string;
  exercises: Exercise[];
  sets: SetRecord[];
  /** 体操などの日（これより前のバックアップには無い） */
  days?: DayRecord[];
  /** 体重などの設定（これより前のバックアップには無い） */
  settings?: Setting[];
}

/** 体重を保存する（0 や空なら消す） */
export async function setBodyweight(kg: number) {
  if (kg > 0) await db.settings.put({ key: 'bodyweight', value: kg });
  else await db.settings.delete('bodyweight');
}

export async function exportData(): Promise<BackupData> {
  const [exercises, sets, days, settings] = await Promise.all([db.exercises.toArray(), db.sets.toArray(), db.days.toArray(), db.settings.toArray()]);
  return { app: 'kintore', version: 1, exportedAt: new Date().toISOString(), exercises, sets, days, settings };
}

/** バックアップで全データを置き換える */
export async function importData(data: BackupData) {
  if (data.app !== 'kintore' || !Array.isArray(data.exercises) || !Array.isArray(data.sets)) {
    throw new Error('筋トレ記録のバックアップファイルではありません');
  }
  await db.transaction('rw', [db.exercises, db.sets, db.days, db.settings], async () => {
    await db.exercises.clear();
    await db.sets.clear();
    await db.days.clear();
    await db.days.bulkAdd(data.days ?? []);
    // 設定が入っていない古いバックアップなら、今の設定（体重）はそのまま残す
    if (data.settings) {
      await db.settings.clear();
      await db.settings.bulkAdd(data.settings);
    }
    // 「お尻」があった頃のバックアップは「脚」として読み込む
    await db.exercises.bulkAdd(
      data.exercises.map((e) => ((e.bodyPart as string) === 'glute' ? { ...e, bodyPart: 'leg' } : e)),
    );
    await db.sets.bulkAdd(data.sets);
  });
}
