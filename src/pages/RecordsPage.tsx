import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BodyPartTabs } from '../components/BodyPartTabs';
import { ChevronRight } from '../components/Icons';
import { Trophy } from '../illustrations/Illustrations';
import { Header, Loading, TabPage } from '../components/Layout';
import { daysAgoLabel, daysSince, slashDate } from '../lib/date';
import { bestSummary, lastTrainedByPart } from '../lib/records';
import { useData } from '../lib/useData';
import { BODY_PARTS, type BodyPart } from '../types';

/** この日数以内に更新した記録にはトロフィーを付ける */
const RECENT_DAYS = 7;

export function RecordsPage() {
  const data = useData();
  const [params, setParams] = useSearchParams();
  const part = (params.get('part') as BodyPart) || 'chest';
  const partLabel = BODY_PARTS.find((p) => p.id === part)?.label;

  const rows = useMemo(() => {
    if (!data) return [];
    return data.exercises
      .filter((e) => e.bodyPart === part && !e.archived)
      .map((e) => ({ exercise: e, best: bestSummary(e, data.sets.filter((s) => s.exerciseId === e.id)) }))
      .sort((a, b) => Number(!!b.best) - Number(!!a.best));
  }, [data, part]);

  const last = data ? lastTrainedByPart(data.sets, data.exercises).get(part) : undefined;

  return (
    <TabPage
      header={<Header title="自己ベスト" />}
      bottom={<BodyPartTabs value={part} onChange={(p) => setParams({ part: p }, { replace: true })} />}
    >
      {!data ? (
        <Loading />
      ) : (
        <div className="px-4 pt-4 pb-4">
          <p className="mb-2 px-1 text-sm text-gray-500">
            {partLabel}の最終トレーニング：
            <span className="font-bold text-brand-600">{last ? `${daysAgoLabel(last)}（${slashDate(last)}）` : 'まだありません'}</span>
          </p>
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="grid grid-cols-[1fr_auto] border-b border-gray-100 bg-brand-50 px-4 py-2 text-[11px] font-bold text-brand-600">
              <span>種目 / 達成日</span>
              <span className="text-right">最高記録 / 推定1RM・ペース</span>
            </div>
            {rows.map(({ exercise, best }) => {
              const recent = best && daysSince(best.latest) < RECENT_DAYS;
              return (
                <Link
                  key={exercise.id}
                  to={`/exercise/${exercise.id}`}
                  className={`flex items-center gap-2 border-b border-gray-100 px-4 py-3 last:border-0 active:bg-gray-50 ${
                    recent ? 'bg-amber-50/70' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">
                      {recent && <Trophy className="mr-1 inline h-4 w-4 align-[-2px] text-amber-500" />}
                      {exercise.name}
                    </div>
                    <div className="text-xs text-gray-400">{best ? slashDate(best.date) : '未記録'}</div>
                  </div>
                  {best ? (
                    <div className="text-right tabular-nums">
                      <div className="text-lg font-bold leading-tight text-gray-800">{best.main}</div>
                      <div className="text-xs text-brand-600">{best.sub}</div>
                    </div>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                  <ChevronRight className="shrink-0 text-gray-300" width={18} height={18} />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </TabPage>
  );
}
