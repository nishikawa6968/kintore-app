import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ExerciseSheet } from '../components/ExerciseSheet';
import { ChevronRight, Plus } from '../components/Icons';
import { Header, Loading, SubPage } from '../components/Layout';
import { daysAgoLabel } from '../lib/date';
import { lastTrainedByPart } from '../lib/records';
import { useData } from '../lib/useData';
import { BODY_PARTS, type BodyPart } from '../types';

export function ExercisePickerPage() {
  const { date = '' } = useParams();
  const data = useData();
  const navigate = useNavigate();
  const [adding, setAdding] = useState<BodyPart | null>(null);

  const { lastByPart, lastByExercise } = useMemo(() => {
    const lastByExercise = new Map<number, string>();
    if (!data) return { lastByPart: new Map<BodyPart, string>(), lastByExercise };
    for (const s of data.sets) {
      const prev = lastByExercise.get(s.exerciseId);
      if (!prev || s.date > prev) lastByExercise.set(s.exerciseId, s.date);
    }
    return { lastByPart: lastTrainedByPart(data.sets, data.exercises), lastByExercise };
  }, [data]);

  const pick = (id: number) => navigate(`/day/${date}/ex/${id}`, { replace: true });

  return (
    <SubPage
      wide
      header={
        <Header
          title="種目を選択"
          back={`/day/${date}`}
          right={
            <button onClick={() => setAdding('chest')} className="p-2 active:opacity-60" aria-label="種目を追加">
              <Plus />
            </button>
          }
        />
      }
    >
      {!data ? (
        <Loading />
      ) : (
        BODY_PARTS.map((part) => {
          const list = data.exercises.filter((e) => e.bodyPart === part.id && !e.archived);
          const last = lastByPart.get(part.id);
          return (
            <section key={part.id}>
              <div className="sticky top-[calc(3rem+env(safe-area-inset-top))] z-10 flex items-center bg-brand-500/95 px-4 py-1.5 text-white backdrop-blur">
                <span className="font-bold">{part.label}</span>
                <span className="ml-2 text-sm opacity-90">（{last ? daysAgoLabel(last) : '記録なし'}）</span>
                <button onClick={() => setAdding(part.id)} className="ml-auto p-1 active:opacity-60" aria-label={`${part.label}の種目を追加`}>
                  <Plus width={20} height={20} />
                </button>
              </div>
              <ul className="bg-white">
                {list.map((ex) => {
                  const exLast = lastByExercise.get(ex.id);
                  return (
                    <li key={ex.id} className="border-b border-gray-100 last:border-0">
                      <button onClick={() => pick(ex.id)} className="flex w-full items-center px-4 py-3.5 text-left active:bg-brand-50">
                        <span className="flex-1 text-[16px]">{ex.name}</span>
                        {exLast && <span className="mr-1 text-xs text-gray-400">{daysAgoLabel(exLast)}</span>}
                        <ChevronRight className="text-gray-300" width={20} height={20} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })
      )}
      {adding && <ExerciseSheet defaultPart={adding} onClose={() => setAdding(null)} onSaved={pick} />}
    </SubPage>
  );
}
