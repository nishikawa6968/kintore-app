import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Plus } from '../components/Icons';
import { Header, Loading, PrimaryButton, SubPage } from '../components/Layout';
import { RecordBadge } from '../components/RecordBadge';
import { dayLabel } from '../lib/date';
import { chronological, fmtWeight, recordSetIds, volume } from '../lib/records';
import { useData } from '../lib/useData';
import { bodyPartLabel, type SetRecord } from '../types';

export function DayPage() {
  const { date = '' } = useParams();
  const data = useData();
  const navigate = useNavigate();

  const groups = useMemo(() => {
    if (!data) return [];
    const today = data.sets.filter((s) => s.date === date).sort((a, b) => a.createdAt - b.createdAt);
    const byEx = new Map<number, SetRecord[]>();
    for (const s of today) {
      if (!byEx.has(s.exerciseId)) byEx.set(s.exerciseId, []);
      byEx.get(s.exerciseId)!.push(s);
    }
    return [...byEx].map(([exerciseId, sets]) => {
      const records = recordSetIds(data.sets.filter((s) => s.exerciseId === exerciseId));
      return {
        exercise: data.exercises.find((e) => e.id === exerciseId),
        sets: sets.sort(chronological),
        records,
      };
    });
  }, [data, date]);

  const totalVolume = groups.reduce((sum, g) => sum + volume(g.sets), 0);

  return (
    <SubPage
      header={<Header title={dayLabel(date)} back="/" />}
      action={
        <PrimaryButton onClick={() => navigate(`/day/${date}/pick`)}>
          <Plus /> 種目を追加
        </PrimaryButton>
      }
    >
      {!data ? (
        <Loading />
      ) : groups.length === 0 ? (
        <div className="px-6 pt-20 text-center text-gray-400">
          <div className="mb-3 text-5xl">🏋️</div>
          <p>この日の記録はまだありません。</p>
          <p className="text-sm">下の「種目を追加」から始めましょう。</p>
        </div>
      ) : (
        <div className="space-y-3 p-4">
          <div className="flex justify-between px-1 text-sm text-gray-500">
            <span>{groups.length}種目</span>
            <span>
              総ボリューム <span className="font-bold text-gray-700">{totalVolume.toLocaleString()}kg</span>
            </span>
          </div>
          {groups.map(({ exercise, sets, records }) => (
            <Link
              key={exercise?.id}
              to={`/day/${date}/ex/${exercise?.id}`}
              className="block rounded-2xl bg-white p-4 shadow-sm active:bg-gray-50"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-600">
                  {exercise && bodyPartLabel(exercise.bodyPart)}
                </span>
                <span className="flex-1 truncate font-bold">{exercise?.name ?? '（削除された種目）'}</span>
                {sets.some((s) => records.has(s.id)) && <RecordBadge small />}
                <ChevronRight className="text-gray-300" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sets.map((s) => (
                  <span
                    key={s.id}
                    className={`rounded-lg px-2 py-1 text-sm tabular-nums ${
                      records.has(s.id) ? 'bg-amber-100 font-bold text-amber-700' : 'bg-gray-50 text-gray-600'
                    }`}
                  >
                    {fmtWeight(s.weight)}×{s.reps}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </SubPage>
  );
}
