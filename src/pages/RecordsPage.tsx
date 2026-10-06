import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BodyPartTabs } from '../components/BodyPartTabs';
import { ChevronRight } from '../components/Icons';
import { Header, Loading, TabPage } from '../components/Layout';
import { daysAgoLabel, daysSince, slashDate } from '../lib/date';
import { computeBest, fmtKg, fmtWeight, lastTrainedByPart } from '../lib/records';
import { useData } from '../lib/useData';
import { BODY_PARTS, type BodyPart } from '../types';

/** この日数以内に更新した記録には🎉を付ける */
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
      .map((e) => ({ exercise: e, best: computeBest(data.sets.filter((s) => s.exerciseId === e.id)) }))
      .sort((a, b) => Number(!!b.best) - Number(!!a.best));
  }, [data, part]);

  const last = data ? lastTrainedByPart(data.sets, data.exercises).get(part) : undefined;

  return (
    <TabPage header={<Header title="自己ベスト" />}>
      <div className="sticky top-[calc(3rem+env(safe-area-inset-top))] z-10 bg-[#f3f5f9]/95 backdrop-blur">
        <BodyPartTabs value={part} onChange={(p) => setParams({ part: p }, { replace: true })} />
      </div>
      {!data ? (
        <Loading />
      ) : (
        <div className="px-4 pb-4">
          <p className="mb-2 px-1 text-sm text-gray-500">
            {partLabel}の最終トレーニング：
            <span className="font-bold text-brand-600">{last ? `${daysAgoLabel(last)}（${slashDate(last)}）` : 'まだありません'}</span>
          </p>
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="grid grid-cols-[1fr_auto] border-b border-gray-100 bg-brand-50 px-4 py-2 text-[11px] font-bold text-brand-600">
              <span>種目 / 達成日</span>
              <span className="text-right">最高重量×回数 / 推定1RM</span>
            </div>
            {rows.map(({ exercise, best }) => {
              const recent =
                best && Math.min(daysSince(best.maxDate), daysSince(best.best1RMDate)) < RECENT_DAYS;
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
                      {recent && '🎉 '}
                      {exercise.name}
                    </div>
                    <div className="text-xs text-gray-400">{best ? slashDate(best.maxDate) : '未記録'}</div>
                  </div>
                  {best ? (
                    <div className="text-right tabular-nums">
                      <div className="text-lg font-bold leading-tight text-gray-800">
                        {fmtWeight(best.maxWeight)}
                        <span className="text-sm font-normal text-gray-400"> × </span>
                        {best.repsAtMax}
                        <span className="text-sm font-normal text-gray-500">回</span>
                      </div>
                      <div className="text-xs text-brand-600">1RM {best.best1RM > 0 ? `${fmtKg(best.best1RM)}kg` : '—'}</div>
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
