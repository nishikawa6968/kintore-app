import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format } from 'date-fns';
import { Plus } from '../components/Icons';
import { Trophy } from '../illustrations/Illustrations';
import { Header, Loading, PrimaryButton, SubPage } from '../components/Layout';
import { fromKey, slashDate, todayKey } from '../lib/date';
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
  const navigate = useNavigate();

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
    return { exercise, cardio: isCardio(exercise), best: computeBest(all), runBest: computeRunBest(all), records: recordIdsFor(exercise, all), days };
  }, [data, exerciseId]);

  if (!view) return <Loading />;
  const { exercise, cardio, best, runBest, records, days } = view;
  const bodyweight = !cardio && days.length > 0 && days.every((d) => d.maxWeight === 0);
  const chart = days
    .map((d) => ({
      label: format(fromKey(d.date), 'M/d'),
      value: cardio ? d.bestPace : bodyweight ? Math.max(...d.sets.map((s) => s.reps)) : d.max1RM,
    }))
    .filter((p) => p.value > 0);
  const chartTitle = cardio ? 'ペースの推移（上ほど速い）' : bodyweight ? '最高回数の推移' : '推定1RMの推移';
  const fmtValue = (v: number) => (cardio ? `${fmtPace(v)}/km` : `${fmtKg(v)}${bodyweight ? '回' : 'kg'}`);

  return (
    <SubPage
      header={<Header title={exercise?.name ?? '種目'} back="/records" />}
      action={
        <PrimaryButton onClick={() => navigate(`/day/${todayKey()}/ex/${exerciseId}`)}>
          <Plus /> 今日この種目を記録
        </PrimaryButton>
      }
    >
      <div className="space-y-3 p-4">
        <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-4 text-white shadow">
          <div className="mb-2 flex items-center gap-2 text-sm opacity-90">
            <span className="rounded bg-white/20 px-1.5 py-0.5 text-xs font-bold">{exercise && bodyPartLabel(exercise.bodyPart)}</span>
            自己ベスト
          </div>
          {cardio && runBest ? (
            <div className="grid grid-cols-2 gap-3">
              <Stat label="最長距離" value={fmtKm(runBest.longest)} date={runBest.longestDate} />
              <Stat label="最速ペース" value={`${fmtPace(runBest.bestPace)}/km`} date={runBest.bestPaceDate} />
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

        {chart.length >= 2 && (
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <div className="mb-1 px-1 text-sm font-bold text-gray-500">{chartTitle}</div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart} margin={{ top: 8, right: 8, bottom: 0, left: cardio ? -4 : -16 }}>
                  <CartesianGrid stroke="#eef1f5" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                  {cardio ? (
                    // ペースは小さいほど速いので、上下を逆にして「上ほど速い」にする
                    <YAxis
                      reversed
                      domain={[(min: number) => Math.max(0, Math.floor((min - 10) / 15) * 15), (max: number) => Math.ceil((max + 10) / 15) * 15]}
                      tickFormatter={(v: number) => fmtPace(v)}
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      tickLine={false}
                      axisLine={false}
                    />
                  ) : (
                    <YAxis
                      domain={[(min: number) => Math.max(0, Math.floor((min - 1) / 5) * 5), (max: number) => Math.ceil((max + 1) / 5) * 5]}
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                  )}
                  <Tooltip formatter={(v) => [fmtValue(Number(v)), cardio ? 'ペース' : bodyweight ? '最高回数' : '推定1RM']} />
                  <Line type="monotone" dataKey="value" stroke="#1e6fd9" strokeWidth={2.5} dot={{ r: 3, fill: '#1e6fd9' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {[...days].reverse().map((d) => (
          <div key={d.date} className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <Link to={`/day/${d.date}/ex/${exerciseId}`} className="flex items-center bg-brand-500 px-4 py-2 text-white active:bg-brand-600">
              <span className="text-lg font-bold">{slashDate(d.date)}</span>
              <span className="ml-auto text-right text-[11px] font-bold leading-tight whitespace-nowrap opacity-90">
                {cardio ? (
                  <>
                    TOTAL {fmtKm(d.distance)}
                    <br />
                    BEST {fmtPace(d.bestPace)}/km
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
                  <th className="font-medium">{cardio ? 'ペース' : '推定1RM'}</th>
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
