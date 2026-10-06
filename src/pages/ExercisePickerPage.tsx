import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { BodyPartTabs } from '../components/BodyPartTabs';
import { ExerciseSheet } from '../components/ExerciseSheet';
import { ChevronRight, Plus } from '../components/Icons';
import { Header, Loading, SubPage } from '../components/Layout';
import { daysAgoLabel } from '../lib/date';
import { bestSummary, lastTrainedByPart } from '../lib/records';
import { useData } from '../lib/useData';
import { bodyPartLabel, type BodyPart } from '../types';

export function ExercisePickerPage() {
  const { date = '' } = useParams();
  const data = useData();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [adding, setAdding] = useState(false);

  const info = useMemo(() => {
    if (!data) return null;
    const lastByExercise = new Map<number, string>();
    for (const s of data.sets) {
      const prev = lastByExercise.get(s.exerciseId);
      if (!prev || s.date > prev) lastByExercise.set(s.exerciseId, s.date);
    }
    // その日に最後に記録した種目と同じ部位から始める（胸の日は胸の種目を続けることが多いため）
    const todays = data.sets.filter((s) => s.date === date).sort((a, b) => b.createdAt - a.createdAt);
    const lastPart = data.exercises.find((e) => e.id === todays[0]?.exerciseId)?.bodyPart;
    return { lastByPart: lastTrainedByPart(data.sets, data.exercises), lastByExercise, defaultPart: lastPart ?? 'chest' };
  }, [data, date]);

  const part = (params.get('part') as BodyPart | null) ?? info?.defaultPart ?? 'chest';
  const setPart = (p: BodyPart) => setParams({ part: p }, { replace: true });
  const pick = (id: number) => navigate(`/day/${date}/ex/${id}`, { replace: true });

  const list = data?.exercises.filter((e) => e.bodyPart === part && !e.archived) ?? [];
  const last = info?.lastByPart.get(part);

  return (
    <SubPage
      header={
        <Header
          title="種目を選択"
          back={`/day/${date}`}
          right={
            <button onClick={() => setAdding(true)} className="p-2 active:opacity-60" aria-label="種目を追加">
              <Plus />
            </button>
          }
        />
      }
      bar={data && <BodyPartTabs value={part} onChange={setPart} />}
    >
      {!data || !info ? (
        <Loading />
      ) : (
        // 種目が少ない部位でも、画面の真ん中あたりに並ぶようにする
        <div className="flex min-h-[calc(100dvh-3rem-env(safe-area-inset-top)-8rem)] flex-col justify-center px-4 py-4">
          <div className="mb-3 flex items-baseline gap-2 px-1">
            <h2 className="text-2xl font-bold text-brand-600">{bodyPartLabel(part)}</h2>
            <span className="text-sm text-gray-500">最終トレーニング：{last ? daysAgoLabel(last) : '記録なし'}</span>
          </div>
          <ul className="space-y-2">
            {list.map((ex) => {
              const exLast = info.lastByExercise.get(ex.id);
              const best = exLast ? bestSummary(ex, data.sets.filter((s) => s.exerciseId === ex.id)) : null;
              return (
                <li key={ex.id}>
                  <button
                    onClick={() => pick(ex.id)}
                    className="flex min-h-16 w-full items-center rounded-2xl bg-white px-4 py-3 text-left shadow-sm transition-transform active:scale-[0.98] active:bg-brand-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[17px] font-bold text-gray-800">{ex.name}</div>
                      <div className="mt-0.5 text-xs text-gray-400">
                        {exLast ? daysAgoLabel(exLast) : 'まだ記録なし'}
                        {best && (
                          <span className="ml-2 text-brand-600">
                            ベスト {best.main}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="shrink-0 text-gray-300" width={22} height={22} />
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            onClick={() => setAdding(true)}
            className="mt-3 flex h-12 items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-brand-200 text-sm font-bold text-brand-500 active:bg-brand-50"
          >
            <Plus width={18} height={18} /> {bodyPartLabel(part)}の種目を追加
          </button>
        </div>
      )}
      {adding && <ExerciseSheet defaultPart={part} onClose={() => setAdding(false)} onSaved={pick} />}
    </SubPage>
  );
}
