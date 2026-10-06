import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BodyPartTabs } from '../components/BodyPartTabs';
import { ChevronRight } from '../components/Icons';
import { BodyMap } from '../illustrations/BodyMap';
import { Trophy } from '../illustrations/Illustrations';
import { Header, Loading, TabPage } from '../components/Layout';
import { daysAgoLabel, daysSince, slashDate } from '../lib/date';
import { bestSummary, lastTrainedByPart } from '../lib/records';
import { useData } from '../lib/useData';
import { neighborPart, useSlideDirection } from '../lib/useSwipe';
import { SwipePager } from '../components/SwipePager';
import { bodyPartLabel, type BodyPart, type Exercise, type SetRecord } from '../types';

/** この日数以内に更新した記録にはトロフィーを付ける */
const RECENT_DAYS = 7;

export function RecordsPage() {
  const data = useData();
  const [params, setParams] = useSearchParams();
  const part = (params.get('part') as BodyPart) || 'chest';
  const setPart = (p: BodyPart) => setParams({ part: p }, { replace: true });
  const slide = useSlideDirection(part);


  const last = data ? lastTrainedByPart(data.sets, data.exercises).get(part) : undefined;

  return (
    <TabPage header={<Header title="自己ベスト" />}>
      {!data ? (
        <Loading />
      ) : (
        // 画面の高さぴったりに「最終トレーニング → 表（いつも5行分の高さ。中だけ縦にスクロール）→ 人の図（残りいっぱい）→ ロール」
        // 表の高さを固定するので、部位を変えても人の図の大きさは変わらない
        <>
          <p className="shrink-0 px-5 pt-3 pb-2 text-sm text-gray-500">
            <span className="font-bold text-gray-700">{bodyPartLabel(part)}</span>の最終トレーニング：
            <span className="font-bold text-brand-600">{last ? `${daysAgoLabel(last)}（${slashDate(last)}）` : 'まだありません'}</span>
          </p>
          {/* 表は指で左右に動かして隣の部位へ。ロールのように隣の部位の表がつながって出てくる */}
          <SwipePager
            pageKey={part}
            direction={slide}
            onSwipe={(dir) => setPart(neighborPart(part, dir))}
            renderPage={(o) => (
              <div className="px-4">
                <RecordsTable part={o === 0 ? part : neighborPart(part, o)} exercises={data.exercises} sets={data.sets} />
              </div>
            )}
            className="shrink-0 py-1"
          />
          <p className="mt-1 shrink-0 text-center text-[11px] text-gray-400">← 表を左右にスワイプで隣の部位 →</p>
          {/* 人の図（ホームと同じくらいの大きさ。筋肉をタップするとその部位へ）とロール */}
          <div className="min-h-[160px] flex-1 px-4 py-1">
            <BodyMap selected={part} onSelect={setPart} className="h-full w-full" />
          </div>
          <div className="shrink-0 pb-1">
            <BodyPartTabs value={part} onChange={setPart} />
          </div>
        </>
      )}
    </TabPage>
  );
}

/** 部位の種目ごとの自己ベストの表（いつも5行分の高さ。種目の行だけ縦にスクロール） */
function RecordsTable({ part, exercises, sets }: { part: BodyPart; exercises: Exercise[]; sets: SetRecord[] }) {
  const rows = useMemo(
    () =>
      exercises
        .filter((e) => e.bodyPart === part && !e.archived)
        .map((e) => ({ exercise: e, best: bestSummary(e, sets.filter((s) => s.exerciseId === e.id)) }))
        .sort((a, b) => Number(!!b.best) - Number(!!a.best)),
    [part, exercises, sets],
  );
  return (
    <div className="flex h-[20rem] flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
      {/* 見出しの帯はスクロールの外に置き、引っ張っても動かないようにする */}
      <div className="grid shrink-0 grid-cols-[1fr_auto] border-b border-gray-100 bg-brand-50 px-4 py-2 text-[11px] font-bold text-brand-600">
        <span>種目 / 達成日</span>
        <span className="text-right">最高記録 / 推定1RM・平均ペース</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {rows.map(({ exercise, best }) => {
          const recent = best && daysSince(best.latest) < RECENT_DAYS;
          return (
            <Link
              key={exercise.id}
              to={`/exercise/${exercise.id}`}
              className={`flex items-center gap-2 border-b border-gray-100 px-4 py-2 last:border-0 active:bg-gray-50 ${
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
  );
}
