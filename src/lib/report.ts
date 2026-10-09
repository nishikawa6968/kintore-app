import { addMonths, format } from 'date-fns';
import { isCardio, type BodyPart, type DayRecord, type Exercise, type SetRecord } from '../types';
import { computeBest, recordIdsFor, type RecordKind } from './records';

/** 'yyyy-MM' の前後の月 */
export const shiftMonth = (month: string, n: number) => format(addMonths(new Date(`${month}-01T00:00:00`), n), 'yyyy-MM');

export interface MonthReport {
  month: string;
  trainingDays: number;
  gymDays: number;
  sets: number;
  volume: number;
  runKm: number;
  /** 前の月の数字（くらべる用） */
  prev: { trainingDays: number; volume: number };
  /** その月の新記録（燃える weight と青く光る rm） */
  records: { exercise: Exercise; set: SetRecord; kind: RecordKind }[];
  /** 推定1RMが一番伸びた種目（月の前と月の終わりをくらべる） */
  topGain: { exercise: Exercise; before: number; after: number } | null;
  /** 部位ごとのセット数 */
  partSets: Partial<Record<BodyPart, number>>;
}

const inMonth = (date: string, month: string) => date.startsWith(month);

/** 月間レポート */
export function monthReport(month: string, exercises: Exercise[], sets: SetRecord[], days: DayRecord[]): MonthReport {
  const exOf = new Map(exercises.map((e) => [e.id, e]));
  const summary = (m: string) => {
    const list = sets.filter((s) => inMonth(s.date, m));
    return {
      list,
      trainingDays: new Set(list.map((s) => s.date)).size,
      volume: list.reduce((sum, s) => sum + s.weight * s.reps, 0),
    };
  };
  const cur = summary(month);
  const prev = summary(shiftMonth(month, -1));

  const byExercise = new Map<number, SetRecord[]>();
  for (const s of sets) {
    if (!byExercise.has(s.exerciseId)) byExercise.set(s.exerciseId, []);
    byExercise.get(s.exerciseId)!.push(s);
  }

  const records: MonthReport['records'] = [];
  let topGain: MonthReport['topGain'] = null;
  const monthStart = `${month}-01`;
  const monthEnd = `${month}-31`;
  for (const [id, list] of byExercise) {
    const exercise = exOf.get(id);
    if (!exercise) continue;
    for (const [setId, kind] of recordIdsFor(exercise, list)) {
      const set = list.find((s) => s.id === setId)!;
      if (inMonth(set.date, month)) records.push({ exercise, set, kind });
    }
    if (isCardio(exercise)) continue;
    const before = computeBest(list.filter((s) => s.date < monthStart))?.best1RM ?? 0;
    const after = computeBest(list.filter((s) => s.date <= monthEnd))?.best1RM ?? 0;
    if (before > 0 && after > before && (!topGain || after / before > topGain.after / topGain.before)) {
      topGain = { exercise, before, after };
    }
  }
  // 燃える記録を先に、同じ種類なら日付順
  records.sort((a, b) => (a.kind === b.kind ? a.set.date.localeCompare(b.set.date) : a.kind === 'weight' ? -1 : 1));

  const partSets: MonthReport['partSets'] = {};
  for (const s of cur.list) {
    const part = exOf.get(s.exerciseId)?.bodyPart;
    if (part) partSets[part] = (partSets[part] ?? 0) + 1;
  }

  return {
    month,
    trainingDays: cur.trainingDays,
    gymDays: days.filter((d) => d.kind === 'gymnastics' && inMonth(d.date, month)).length,
    sets: cur.list.filter((s) => !(s.distance ?? 0)).length,
    volume: cur.volume,
    runKm: cur.list.reduce((sum, s) => sum + (s.distance ?? 0), 0),
    prev: { trainingDays: prev.trainingDays, volume: prev.volume },
    records,
    topGain,
    partSets,
  };
}
