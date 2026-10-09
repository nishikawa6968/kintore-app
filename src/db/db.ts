import Dexie, { type EntityTable } from 'dexie';
import type { DayRecord, Exercise, SetRecord, Setting, SettingKey, SettingValues } from '../types';
import { BUILTINS, CARDIO_NAMES, presetExercises } from './seed';

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
    // v6: ベンチプレス・スクワット・デッドリフト・ランニングをアプリ固定の種目にする
    this.version(6)
      .stores({ ...stores, days: 'date', settings: 'key' })
      .upgrade((tx) => ensureBuiltins(tx.table('exercises') as EntityTable<Exercise, 'id'>));
    this.on('populate', (tx) => {
      tx.table('exercises').bulkAdd(presetExercises());
    });
  }
}

export const db = new KintoreDB();

/**
 * 固定の種目がそろっているようにする。同じ名前・部位の種目があればそれを固定の種目にし
 * （名前を変えていたら元に戻す必要はないので、見つからなければ部位の末尾に追加する）。
 */
async function ensureBuiltins(table: EntityTable<Exercise, 'id'>) {
  const all = await table.toArray();
  for (const b of BUILTINS) {
    if (all.some((e) => e.builtin === b.key)) continue;
    const kind = CARDIO_NAMES.has(b.name) ? ('cardio' as const) : ('weight' as const);
    const same = all.find((e) => !e.builtin && e.name.trim() === b.name && e.bodyPart === b.bodyPart);
    if (same) {
      same.builtin = b.key;
      await table.update(same.id, { builtin: b.key, kind, name: b.name });
      continue;
    }
    const order = all.filter((e) => e.bodyPart === b.bodyPart).reduce((max, e) => Math.max(max, e.order), -1) + 1;
    const id = await table.add({ name: b.name, bodyPart: b.bodyPart, kind, builtin: b.key, archived: false, order } as Exercise);
    all.push({ id, name: b.name, bodyPart: b.bodyPart, kind, builtin: b.key, archived: false, order });
  }
}

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

/** 設定を読む（無ければ undefined） */
export async function getSetting<K extends SettingKey>(key: K): Promise<SettingValues[K] | undefined> {
  return (await db.settings.get(key))?.value as SettingValues[K] | undefined;
}

/** 設定を保存する */
export async function setSetting<K extends SettingKey>(key: K, value: SettingValues[K]) {
  await db.settings.put({ key, value });
}

/** 体重を保存する（0 や空なら消す） */
export async function setBodyweight(kg: number) {
  if (kg > 0) await setSetting('bodyweight', kg);
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
    // 固定の種目が入っていない古いバックアップでも、固定の種目をそろえる
    await ensureBuiltins(db.exercises);
  });
}
