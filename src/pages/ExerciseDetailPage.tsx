import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format } from 'date-fns';
import { Plus } from '../components/Icons';
import { Header, Loading, PrimaryButton, SubPage } from '../components/Layout';
import { fromKey, slashDate, todayKey } from '../lib/date';
import { chronological, computeBest, estimate1RM, fmtKg, fmtWeight, recordSetIds, volume } from '../lib/records';
import { useData } from '../lib/useData';
import { bodyPartLabel, type SetRecord } from '../types';

export function ExerciseDetailPage() {
  const { id = '' } = useParams();
  const exerciseId = Number(id);
  const data = useData();
  const navigate = useNavigate();

  const view = useMemo(() => {
    if (!data) return null;
    const all = data.sets.filter((s) => s.exerciseId === exerciseId).sort(chronological);
    const byDate = new Map<string, SetRecord[]>();
    for (const s of all) {
      if (!byDate.has(s.date)) byDate.set(s.date, []);
      byDate.get(s.date)!.push(s);
    }
    const days = [...byDate].map(([date, sets]) => ({
      date,
      sets,
      volume: volume(sets),
      max1RM: Math.max(...sets.map((s) => estimate1RM(s.weight, s.reps))),
      maxWeight: Math.max(...sets.map((s) => s.weight)),
    }));
    return {
      exercise: data.exercises.find((e) => e.id === exerciseId),
      best: computeBest(all),
      records: recordSetIds(all),
      days,
    };
  }, [data, exerciseId]);

  if (!view) return <Loading />;
  const { exercise, best, records, days } = view;
  const bodyweight = days.length > 0 && days.every((d) => d.maxWeight === 0);
  const chart = days.map((d) => ({
    label: format(fromKey(d.date), 'M/d'),
    value: bodyweight ? Math.max(...d.sets.map((s) => s.reps)) : d.max1RM,
  }));

  return (
    <SubPage
      action={
        <PrimaryButton onClick={() => navigate(`/day/${todayKey()}/ex/${exerciseId}`)}>
          <Plus /> 今日この種目を記録
        </PrimaryButton>
      }
    >
      <Header title={exercise?.name ?? '種目'} back="/records" />
      <div className="space-y-3 p-4">
        <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-4 text-white shadow">
          <div className="mb-2 flex items-center gap-2 text-sm opacity-90">
            <span className="rounded bg-white/20 px-1.5 py-0.5 text-xs font-bold">{exercise && bodyPartLabel(exercise.bodyPart)}</span>
            自己ベスト
          </div>
          {best ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs opacity-75">最高重量 × 回数</div>
                <div className="text-2xl font-bold tabular-nums">
                  {fmtWeight(best.maxWeight)} × {best.repsAtMax}回
                </div>
                <div className="text-xs opacity-75">{slashDate(best.maxDate)}</div>
              </div>
              <div>
                <div className="text-xs opacity-75">推定1RM</div>
                <div className="text-2xl font-bold tabular-nums">{best.best1RM > 0 ? `${fmtKg(best.best1RM)}kg` : '—'}</div>
                <div className="text-xs opacity-75">{slashDate(best.best1RMDate)}</div>
              </div>
            </div>
          ) : (
            <div className="py-2 text-lg font-bold">まだ記録がありません</div>
          )}
        </div>

        {chart.length >= 2 && (
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <div className="mb-1 px-1 text-sm font-bold text-gray-500">{bodyweight ? '最高回数の推移' : '推定1RMの推移'}</div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid stroke="#eef1f5" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                  <YAxis domain={[(min: number) => Math.max(0, Math.floor((min - 1) / 5) * 5), (max: number) => Math.ceil((max + 1) / 5) * 5]} tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip formatter={(v) => [`${fmtKg(Number(v))}${bodyweight ? '回' : 'kg'}`, bodyweight ? '最高回数' : '推定1RM']} />
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
                TOTAL {d.volume.toLocaleString()}kg
                <br />
                MAX 1RM {d.max1RM > 0 ? `${fmtKg(d.max1RM)}kg` : '—'}
              </span>
            </Link>
            <table className="w-full text-center tabular-nums">
              <thead>
                <tr className="text-[11px] text-gray-400">
                  <th className="w-12 py-1 font-medium">セット</th>
                  <th className="font-medium">重さ</th>
                  <th className="font-medium">回数</th>
                  <th className="font-medium">推定1RM</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {d.sets.map((s, i) => (
                  <tr key={s.id} className={`border-t border-gray-100 ${records.has(s.id) ? 'bg-amber-50' : ''}`}>
                    <td className="py-2.5 text-gray-500">{i + 1}</td>
                    <td className="text-lg font-bold">{fmtWeight(s.weight)}</td>
                    <td className="text-lg font-bold">
                      {s.reps}
                      <span className="text-xs font-normal text-gray-400">回</span>
                    </td>
                    <td className="text-sm text-gray-600">{s.weight > 0 ? `${fmtKg(estimate1RM(s.weight, s.reps))}kg` : '—'}</td>
                    <td className="pr-2 text-lg">{records.has(s.id) && <span aria-label="新記録">🎉</span>}</td>
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
