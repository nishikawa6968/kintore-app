import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Plus } from '../components/Icons';
import { BottomAction, Header, Loading, PrimaryButton, ScrollArea, SubPage } from '../components/Layout';
import { RecordBadge } from '../components/RecordBadge';
import type { RecordKind } from '../lib/records';
import { FrontFigure } from '../illustrations/Illustrations';
import { dayLabel } from '../lib/date';
import { chronological, recordIdsFor, setLabel, volume } from '../lib/records';
import { useData } from '../lib/useData';
import { db, setGymnasticsDay } from '../db/db';
import { bodyPartLabel, isCardio, type SetRecord } from '../types';

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
      const exercise = data.exercises.find((e) => e.id === exerciseId);
      const records = recordIdsFor(exercise, data.sets.filter((s) => s.exerciseId === exerciseId));
      return {
        exercise,
        sets: sets.sort(chronological),
        records,
      };
    });
  }, [data, date]);

  const totalVolume = groups.reduce((sum, g) => sum + volume(g.sets), 0);

  const gymDay = data?.days.find((d) => d.date === date && d.kind === 'gymnastics');
  const startGym = () => setGymnasticsDay(date, true);
  const cancelGym = () => confirm('この日を体操の日から外しますか？（メモも消えます）') && setGymnasticsDay(date, false);

  return (
    <SubPage header={<Header title={dayLabel(date)} back="/" />}>
      {!data ? (
        <Loading />
      ) : gymDay ? (
        // 体操の日：カレンダーではピンクの丸。やったことをメモできる
        <>
          <ScrollArea className="flex flex-col items-center">
            <FrontFigure className="mt-6 mb-3 h-36 w-auto text-pink-200" />
            <p className="text-lg font-bold text-pink-500">体操の日</p>
            <textarea
              defaultValue={gymDay.memo ?? ''}
              onChange={(e) => db.days.update(date, { memo: e.target.value || undefined })}
              placeholder="やったこと（技・練習内容など）"
              rows={5}
              className="mt-4 w-full rounded-2xl bg-white p-4 text-[15px] shadow-sm outline-none ring-1 ring-pink-100 focus:ring-2 focus:ring-pink-300"
            />
          </ScrollArea>
          <BottomAction>
            <button
              onClick={cancelGym}
              className="flex h-14 w-full items-center justify-center rounded-2xl border-2 border-gray-200 bg-white text-[15px] font-bold text-gray-500 active:bg-gray-50"
            >
              体操の日を取り消す
            </button>
          </BottomAction>
        </>
      ) : groups.length === 0 ? (
        <>
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center text-gray-400">
            <FrontFigure className="mb-3 h-40 w-auto text-brand-200" />
            <p>この日の記録はまだありません。</p>
            <p className="text-sm">下の「種目を追加」から始めましょう。</p>
          </div>
          <BottomAction>
            {/* 筋トレと体操は同じ日にしないので、記録がない日だけ「体操をする」を出す */}
            <button
              onClick={startGym}
              className="mb-2.5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-pink-400 bg-white text-[17px] font-bold text-pink-500 active:bg-pink-50"
            >
              体操をする
            </button>
            <PrimaryButton onClick={() => navigate(`/day/${date}/pick`)}>
              <Plus /> 種目を追加
            </PrimaryButton>
          </BottomAction>
        </>
      ) : (
        <>
          {/* 上：その日のまとめ（固定）／真ん中：種目のカード（ここだけスクロール） */}
          <div className="flex shrink-0 justify-between px-5 pt-4 text-sm text-gray-500">
            <span>{groups.length}種目</span>
            <span>
              総ボリューム <span className="font-bold text-gray-700">{totalVolume.toLocaleString()}kg</span>
            </span>
          </div>
          <ScrollArea className="space-y-3">
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
                  {dayKind(sets, records) && <RecordBadge kind={dayKind(sets, records)} cardio={isCardio(exercise)} small />}
                  <ChevronRight className="text-gray-300" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sets.map((s) => (
                    <span
                      key={s.id}
                      className={`rounded-lg px-2 py-1 text-sm tabular-nums ${
                        records.get(s.id) === 'weight'
                          ? 'bg-amber-100 font-bold text-amber-700'
                          : records.get(s.id) === 'rm'
                            ? 'bg-sky-100 font-bold text-sky-700'
                            : 'bg-gray-50 text-gray-600'
                      }`}
                    >
                      {setLabel(s, isCardio(exercise))}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </ScrollArea>
          <BottomAction>
            <PrimaryButton onClick={() => navigate(`/day/${date}/pick`)}>
              <Plus /> 種目を追加
            </PrimaryButton>
          </BottomAction>
        </>
      )}
    </SubPage>
  );
}

/** その日の種目の新記録の種類（重量の新記録があればそちらを優先） */
function dayKind(sets: { id: number }[], records: Map<number, RecordKind>): RecordKind | undefined {
  const kinds = sets.map((s) => records.get(s.id));
  return kinds.includes('weight') ? 'weight' : kinds.includes('rm') ? 'rm' : undefined;
}
