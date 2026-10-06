import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ProgressChart } from '../components/ProgressChart';
import { Trophy } from '../illustrations/Illustrations';
import { Header, Loading, SubPage } from '../components/Layout';
import { slashDate } from '../lib/date';
import {
  chronological,
  computeBest,
  computeRunBest,
  estimate1RM,
  fmtDuration,
  fmtKg,
  fmtKm,
  fmtPace,
  fmtWeight,
  paceOf,
  recordIdsFor,
  volume,
} from '../lib/records';
import { useData } from '../lib/useData';
import { bodyPartLabel, isCardio, type SetRecord } from '../types';

export function ExerciseDetailPage() {
  const { id = '' } = useParams();
  const exerciseId = Number(id);
  const data = useData();

  const view = useMemo(() => {
    if (!data) return null;
    const exercise = data.exercises.find((e) => e.id === exerciseId);
    const all = data.sets.filter((s) => s.exerciseId === exerciseId).sort(chronological);
    const byDate = new Map<string, SetRecord[]>();
    for (const s of all) {
      if (!byDate.has(s.date)) byDate.set(s.date, []);
      byDate.get(s.date)!.push(s);
    }
    const days = [...byDate].map(([date, sets]) => {
      const paces = sets.map(paceOf).filter((p) => p > 0);
      return {
        date,
        sets,
        volume: volume(sets),
        max1RM: Math.max(...sets.map((s) => estimate1RM(s.weight, s.reps))),
        maxWeight: Math.max(...sets.map((s) => s.weight)),
        distance: sets.reduce((sum, s) => sum + (s.distance ?? 0), 0),
        bestPace: paces.length ? Math.min(...paces) : 0,
      };
    });
    return { exercise, all, cardio: isCardio(exercise), best: computeBest(all), runBest: computeRunBest(all), records: recordIdsFor(exercise, all), days };
  }, [data, exerciseId]);

  if (!view) return <Loading />;
  const { exercise, all, cardio, best, runBest, records, days } = view;
  const bodyweight = !cardio && days.length > 0 && days.every((d) => d.maxWeight === 0);

  return (
    <SubPage header={<Header title={exercise?.name ?? '種目'} back="/records" />} fill>
      {/* 上：自己ベスト（固定）／真ん中：日付ごとの記録（ここだけ縦にスクロール）／下：推移のグラフ */}
      <div className="flex h-[calc(100dvh-3rem-env(safe-area-inset-top))] min-h-[600px] flex-col">
        <div className="shrink-0 px-4 pt-4">
          <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-4 text-white shadow">
            <div className="mb-2 flex items-center gap-2 text-sm opacity-90">
              <span className="rounded bg-white/20 px-1.5 py-0.5 text-xs font-bold">{exercise && bodyPartLabel(exercise.bodyPart)}</span>
              自己ベスト
            </div>
            {cardio && runBest ? (
              <div className="grid grid-cols-2 gap-3">
                <Stat label="最長距離" value={fmtKm(runBest.longest)} date={runBest.longestDate} />
                <Stat label="ベスト平均ペース" value={`${fmtPace(runBest.bestPace)}/km`} date={runBest.bestPaceDate} />
              </div>
            ) : !cardio && best ? (
              <div className="grid grid-cols-2 gap-3">
                <Stat label="最高重量 × 回数" value={`${fmtWeight(best.maxWeight)} × ${best.repsAtMax}回`} date={best.maxDate} />
                <Stat label="推定1RM" value={best.best1RM > 0 ? `${fmtKg(best.best1RM)}kg` : '—'} date={best.best1RMDate} />
              </div>
            ) : (
              <div className="py-2 text-lg font-bold">まだ記録がありません</div>
            )}
          </div>
        </div>

        {/* 上下の端は記録がふわっと消えるようにして、自己ベストやグラフと重なって見えないようにする */}
        <div className="scroll-fade-y min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {[...days].reverse().map((d) => (
            <div key={d.date} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <Link to={`/day/${d.date}/ex/${exerciseId}`} className="flex items-center bg-brand-500 px-4 py-2 text-white active:bg-brand-600">
                <span className="text-lg font-bold">{slashDate(d.date)}</span>
                <span className="ml-auto text-right text-[11px] font-bold leading-tight whitespace-nowrap opacity-90">
                  {cardio ? (
                    <>
                      TOTAL {fmtKm(d.distance)}
                      <br />
                      BEST 平均 {fmtPace(d.bestPace)}/km
                    </>
                  ) : (
                    <>
                      TOTAL {d.volume.toLocaleString()}kg
                      <br />
                      MAX 1RM {d.max1RM > 0 ? `${fmtKg(d.max1RM)}kg` : '—'}
                    </>
                  )}
                </span>
              </Link>
              <table className="w-full text-center tabular-nums">
                <thead>
                  <tr className="text-[11px] text-gray-400">
                    <th className="w-12 py-1 font-medium">{cardio ? '本' : 'セット'}</th>
                    <th className="font-medium">{cardio ? '距離' : '重さ'}</th>
                    <th className="font-medium">{cardio ? '時間' : '回数'}</th>
                    <th className="font-medium">{cardio ? '平均ペース' : '推定1RM'}</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {d.sets.map((s, i) => (
                    <tr key={s.id} className={`border-t border-gray-100 ${records.has(s.id) ? 'bg-amber-50' : ''}`}>
                      <td className="py-2.5 text-gray-500">{i + 1}</td>
                      {cardio ? (
                        <>
                          <td className="text-lg font-bold">{fmtKm(s.distance ?? 0)}</td>
                          <td className="text-lg font-bold">{fmtDuration(s.duration ?? 0)}</td>
                          <td className="text-sm text-gray-600">{fmtPace(paceOf(s))}/km</td>
                        </>
                      ) : (
                        <>
                          <td className="text-lg font-bold">{fmtWeight(s.weight)}</td>
                          <td className="text-lg font-bold">
                            {s.reps}
                            <span className="text-xs font-normal text-gray-400">回</span>
                          </td>
                          <td className="text-sm text-gray-600">{s.weight > 0 ? `${fmtKg(estimate1RM(s.weight, s.reps))}kg` : '—'}</td>
                        </>
                      )}
                      <td className="pr-2">{records.has(s.id) && <Trophy className="mx-auto h-5 w-5 text-amber-500" aria-label="新記録" />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
        <div className="flex h-[44%] shrink-0 flex-col rounded-t-3xl bg-white px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          <ProgressChart sets={all} kind={cardio ? 'pace' : bodyweight ? 'reps' : '1rm'} />
        </div>
      </div>
    </SubPage>
  );
}

function Stat({ label, value, date }: { label: string; value: string; date: string }) {
  return (
    <div>
      <div className="text-xs opacity-75">{label}</div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs opacity-75">{slashDate(date)}</div>
    </div>
  );
}
