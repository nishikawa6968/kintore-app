import { useEffect, useMemo, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { addSet, db } from '../db/db';
import { Copy, History, Plus } from '../components/Icons';
import { Header, Loading, PrimaryButton, SubPage } from '../components/Layout';
import { RestTimer } from '../components/RestTimer';
import { SetRow } from '../components/SetRow';
import { daysAgoLabel, slashDate } from '../lib/date';
import { chronological, computeBest, fmtKg, fmtWeight, recordSetIds } from '../lib/records';
import { useData } from '../lib/useData';

export function SetInputPage() {
  const { date = '', exerciseId: idParam = '' } = useParams();
  const exerciseId = Number(idParam);
  const data = useData();

  const view = useMemo(() => {
    if (!data) return null;
    const all = data.sets.filter((s) => s.exerciseId === exerciseId);
    const todays = all.filter((s) => s.date === date).sort(chronological);
    const prevDate = all.reduce<string | null>((max, s) => (s.date < date && (!max || s.date > max) ? s.date : max), null);
    const prevSets = prevDate ? all.filter((s) => s.date === prevDate).sort(chronological) : [];
    return {
      exercise: data.exercises.find((e) => e.id === exerciseId),
      todays,
      prevDate,
      prevSets,
      records: recordSetIds(all),
      best: computeBest(all),
    };
  }, [data, exerciseId, date]);

  // セットを追加したら一番下までスクロール
  const count = view?.todays.length ?? 0;
  const prevCount = useRef(count);
  useEffect(() => {
    if (count > prevCount.current) window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    prevCount.current = count;
  }, [count]);

  if (!view) return <Loading />;
  const { exercise, todays, prevDate, prevSets, records, best } = view;

  /** 直前のセット → 前回の同じセット番号 → 前回の最終セット の順で値を引き継ぐ */
  const addNext = () => {
    const base = todays[todays.length - 1] ?? prevSets[todays.length] ?? prevSets[prevSets.length - 1];
    addSet(exerciseId, date, base?.weight ?? 0, base?.reps ?? 10);
  };

  const copyPrev = async () => {
    if (todays.length && !confirm('前回のセットを今日の記録に追加しますか？')) return;
    for (const s of prevSets) await addSet(exerciseId, date, s.weight, s.reps);
  };

  return (
    <SubPage
      action={
        <PrimaryButton onClick={addNext}>
          <Plus /> セットを追加
        </PrimaryButton>
      }
    >
      <Header
        title={exercise?.name ?? '種目'}
        back={`/day/${date}`}
        right={
          <Link to={`/exercise/${exerciseId}`} className="flex items-center gap-1 p-2 text-sm active:opacity-60">
            <History width={20} height={20} /> 履歴
          </Link>
        }
      />
      <div className="space-y-3 p-4">
        {best && (
          <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-brand-500 to-brand-400 px-4 py-3 text-white shadow-sm">
            <div>
              <div className="text-xs opacity-80">自己ベスト</div>
              <div className="text-xl font-bold tabular-nums">
                {fmtWeight(best.maxWeight)} × {best.repsAtMax}回
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs opacity-80">推定1RM</div>
              <div className="text-xl font-bold tabular-nums">{best.best1RM > 0 ? `${fmtKg(best.best1RM)}kg` : '—'}</div>
            </div>
          </div>
        )}

        {prevDate && (
          <div className="rounded-2xl bg-gray-200/70 px-4 py-3">
            <div className="mb-1 flex items-center">
              <span className="text-sm font-bold text-gray-600">
                前回 {slashDate(prevDate)}
                <span className="ml-1 font-normal text-gray-500">（{daysAgoLabel(prevDate, date)}）</span>
              </span>
              <button
                onClick={copyPrev}
                className="ml-auto flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-brand-600 shadow-sm active:bg-brand-50"
              >
                <Copy width={16} height={16} /> コピー
              </button>
            </div>
            <div className="grid grid-cols-[auto_1fr] gap-x-3 text-[15px] tabular-nums text-gray-600">
              {prevSets.map((s, i) => (
                <div key={s.id} className="contents">
                  <span className="text-gray-400">{i + 1}</span>
                  <span>
                    {fmtWeight(s.weight)} × {s.reps}回{s.memo && <span className="ml-2 text-xs text-gray-400">{s.memo}</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <RestTimer />

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex border-b border-gray-100 px-3 py-1.5 text-[11px] font-bold text-gray-400">
            <span className="w-8 whitespace-nowrap">セット</span>
            <span className="flex-[1.15] text-center">重さ</span>
            <span className="w-3" />
            <span className="flex-1 text-center">回数</span>
          </div>
          {todays.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-400">
              「セットを追加」で記録を始めましょう
              {prevDate && (
                <>
                  <br />
                  前回の値が自動で入ります
                </>
              )}
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {todays.map((s, i) => (
                <SetRow key={s.id} set={s} index={i + 1} isRecord={records.has(s.id)} />
              ))}
            </div>
          )}
        </div>
        {todays.length > 0 && (
          <button
            onClick={() => confirm(`${exercise?.name}の今日の記録をすべて削除しますか？`) && db.sets.bulkDelete(todays.map((s) => s.id))}
            className="w-full py-2 text-center text-xs text-gray-400"
          >
            この日の記録をすべて削除
          </button>
        )}
      </div>
    </SubPage>
  );
}
