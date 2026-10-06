import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { BodyPartTabs } from '../components/BodyPartTabs';
import { ExerciseSheet } from '../components/ExerciseSheet';
import { Plus } from '../components/Icons';
import { Header, Loading, SubPage } from '../components/Layout';
import { BodyMap } from '../illustrations/BodyMap';
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
      bar={
        data && (
          <>
            <BodyMap selected={part} onSelect={setPart} className="mx-auto mt-2 h-60 w-auto" />
            <BodyPartTabs value={part} onChange={setPart} />
          </>
        )
      }
    >
      {!data || !info ? (
        <Loading />
      ) : (
        // 下の人の図とロールに隠れないよう、残りの高さの真ん中あたりに置く
        <div className="flex min-h-[calc(100dvh-3rem-env(safe-area-inset-top)-env(safe-area-inset-bottom)-21rem)] flex-col justify-center py-4">
          <div className="mb-3 flex items-baseline gap-2 px-5">
            <h2 className="text-2xl font-bold text-brand-600">{bodyPartLabel(part)}</h2>
            <span className="text-sm text-gray-500">最終トレーニング：{last ? daysAgoLabel(last) : '記録なし'}</span>
          </div>
          {/* 種目は横にスライドして選ぶ（2段で並べ、はみ出した分は右へ） */}
          <div
            key={part}
            className="no-scrollbar grid snap-x snap-mandatory auto-cols-[46%] grid-flow-col grid-rows-2 gap-2 overflow-x-auto scroll-px-4 px-4 pb-1"
          >
            {list.map((ex) => {
              const exLast = info.lastByExercise.get(ex.id);
              const best = exLast ? bestSummary(ex, data.sets.filter((s) => s.exerciseId === ex.id)) : null;
              return (
                <button
                  key={ex.id}
                  onClick={() => pick(ex.id)}
                  className="flex h-20 snap-start flex-col justify-center rounded-2xl bg-white px-3 text-left shadow-sm transition-transform active:scale-[0.97] active:bg-brand-50"
                >
                  <span className="line-clamp-2 text-[15px] leading-tight font-bold text-gray-800">{ex.name}</span>
                  <span className="mt-1 truncate text-[11px] text-gray-400">
                    {exLast ? daysAgoLabel(exLast) : 'まだ記録なし'}
                    {best && <span className="ml-1 text-brand-600">{best.main}</span>}
                  </span>
                </button>
              );
            })}
            <button
              onClick={() => setAdding(true)}
              className="flex h-20 snap-start flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-dashed border-brand-200 text-xs font-bold text-brand-500 active:bg-brand-50"
            >
              <Plus width={20} height={20} />
              種目を追加
            </button>
          </div>
          {list.length + 1 > 4 && <p className="mt-2 text-center text-[11px] text-gray-400">← 横にスライドで他の種目 →</p>}
        </div>
      )}
      {adding && <ExerciseSheet defaultPart={part} onClose={() => setAdding(false)} onSaved={pick} />}
    </SubPage>
  );
}
