import { useEffect, useMemo, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { addRun, addSet, db } from '../db/db';
import { BestCard, type BestStat } from '../components/BestCard';
import { Copy, History, Plus } from '../components/Icons';
import { BottomAction, Header, Loading, PrimaryButton, ScrollArea, SubPage } from '../components/Layout';
import { RestTimer } from '../components/RestTimer';
import { RunRow } from '../components/RunRow';
import { SetRow } from '../components/SetRow';
import { NextGoals } from '../components/NextGoals';
import { daysAgoLabel, slashDate } from '../lib/date';
import {
  chronological,
  computeBest,
  computeRunBest,
  fmtDuration,
  fmtKg,
  fmtKm,
  fmtPace,
  fmtWeight,
  paceOf,
  recordIdsFor,
} from '../lib/records';
import { useData } from '../lib/useData';
import { isCardio, type SetRecord } from '../types';

/** 最高記録の欄の中身。その日に更新した項目には up を付ける */
function bestCardFor(cardio: boolean, all: SetRecord[], date: string, weightToday: boolean, anyToday: boolean) {
  const before = all.filter((s) => s.date < date);
  if (cardio) {
    const best = computeRunBest(all);
    if (!best) return null;
    const prev = computeRunBest(before);
    const longUp = weightToday && best.longestDate === date;
    const paceUp = anyToday && best.bestPaceDate === date;
    const left: BestStat = { label: '最長距離', value: fmtKm(best.longest), up: longUp };
    const right: BestStat = { label: 'ベスト平均ペース', value: `${fmtPace(best.bestPace)}/km`, up: paceUp };
    return { left, right, before: prev && (longUp ? fmtKm(prev.longest) : `${fmtPace(prev.bestPace)}/km`) };
  }
  const best = computeBest(all);
  if (!best) return null;
  const prev = computeBest(before);
  const weightUp = weightToday && best.heaviestDate === date;
  const rmUp = anyToday && best.best1RMDate === date;
  const left: BestStat = { label: '自己ベスト', value: `${fmtWeight(best.maxWeight)} × ${best.repsAtMax}回`, up: weightUp };
  const right: BestStat = { label: '推定1RM', value: best.best1RM > 0 ? `${fmtKg(best.best1RM)}kg` : '—', up: rmUp };
  return { left, right, before: prev && (weightUp ? `${fmtWeight(prev.maxWeight)}×${prev.repsAtMax}回` : `1RM ${fmtKg(prev.best1RM)}kg`) };
}

/** 前回の記録の1行 */
const setText = (s: SetRecord, cardio: boolean) =>
  cardio ? `${fmtKm(s.distance ?? 0)}　${fmtDuration(s.duration ?? 0)}（${fmtPace(paceOf(s))}/km）` : `${fmtWeight(s.weight)} × ${s.reps}回`;

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
    const exercise = data.exercises.find((e) => e.id === exerciseId);
    const cardio = isCardio(exercise);
    const records = recordIdsFor(exercise, all);
    // この日のセットで自己ベストを更新し、それが今も自己ベストなら「本日更新」
    const weightToday = todays.some((s) => records.get(s.id) === 'weight');
    const anyToday = todays.some((s) => records.has(s.id));
    return { exercise, cardio, all, todays, prevDate, prevSets, records, card: bestCardFor(cardio, all, date, weightToday, anyToday) };
  }, [data, exerciseId, date]);

  // セットを追加したら、入力欄の一覧を一番下までスクロール
  const scrollRef = useRef<HTMLDivElement>(null);
  const count = view?.todays.length ?? 0;
  const prevCount = useRef(count);
  useEffect(() => {
    const el = scrollRef.current;
    if (count > prevCount.current && el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    prevCount.current = count;
  }, [count]);

  if (!view) return <Loading />;
  const { exercise, cardio, all, todays, prevDate, prevSets, records, card } = view;
  const unit = cardio ? '本' : 'セット';

  /** 直前のセット → 前回の同じセット番号 → 前回の最終セット の順で値を引き継ぐ */
  const addNext = () => {
    const base = todays[todays.length - 1] ?? prevSets[todays.length] ?? prevSets[prevSets.length - 1];
    if (cardio) addRun(exerciseId, date, base?.distance ?? 5, base?.duration ?? 30 * 60);
    else addSet(exerciseId, date, base?.weight ?? 0, base?.reps ?? 10);
  };

  const copyPrev = async () => {
    if (todays.length && !confirm(`前回の${unit}を今日の記録に追加しますか？`)) return;
    for (const s of prevSets) {
      if (cardio) await addRun(exerciseId, date, s.distance ?? 0, s.duration ?? 0);
      else await addSet(exerciseId, date, s.weight, s.reps);
    }
  };

  return (
    <SubPage
      header={
        <Header
          title={exercise?.name ?? '種目'}
          back={`/day/${date}`}
          right={
            <Link to={`/exercise/${exerciseId}`} className="flex items-center gap-1 p-2 text-sm active:opacity-60">
              <History width={20} height={20} /> 履歴
            </Link>
          }
        />
      }
    >
      {/* 上：自己ベストとタイマー（固定）／真ん中：前回の記録と入力欄（ここだけスクロール）／下：追加ボタン（固定） */}
      <div className="shrink-0 space-y-3 px-4 pt-4">
        {card && <BestCard {...card} />}
        {!cardio && <RestTimer />}
      </div>

      <ScrollArea ref={scrollRef} className="space-y-3">
        <NextGoals sets={all} cardio={cardio} exerciseId={exerciseId} date={date} />
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
                    {setText(s, cardio)}
                    {s.memo && <span className="ml-2 text-xs text-gray-400">{s.memo}</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {!cardio && (
            <div className="flex border-b border-gray-100 px-3 py-1.5 text-[11px] font-bold text-gray-400">
              <span className="w-8 whitespace-nowrap">セット</span>
              <span className="flex-[1.15] text-center">重さ</span>
              <span className="w-3" />
              <span className="flex-1 text-center">回数</span>
            </div>
          )}
          {todays.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-400">
              「{cardio ? 'ランを追加' : 'セットを追加'}」で記録を始めましょう
              {prevDate && (
                <>
                  <br />
                  前回の値が自動で入ります
                </>
              )}
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {todays.map((s, i) =>
                cardio ? (
                  <RunRow key={s.id} set={s} index={i + 1} recordKind={records.get(s.id)} />
                ) : (
                  <SetRow key={s.id} set={s} index={i + 1} recordKind={records.get(s.id)} />
                ),
              )}
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
      </ScrollArea>

      <BottomAction>
        <PrimaryButton onClick={addNext}>
          <Plus /> {cardio ? 'ランを追加' : 'セットを追加'}
        </PrimaryButton>
      </BottomAction>
    </SubPage>
  );
}
