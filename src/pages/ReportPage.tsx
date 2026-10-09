import { format } from 'date-fns';
import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from '../components/Icons';
import { Header, Loading, ScrollArea, SubPage } from '../components/Layout';
import { RecordBadge } from '../components/RecordBadge';
import { Flame } from '../illustrations/Illustrations';
import { fromKey, todayKey } from '../lib/date';
import { fmtKg, setLabel } from '../lib/records';
import { monthReport, shiftMonth } from '../lib/report';
import { useData } from '../lib/useData';
import { BODY_PARTS, isCardio } from '../types';

/** 月間レポート：その月のトレーニングをまとめて振り返る */
export function ReportPage() {
  const { month = format(new Date(), 'yyyy-MM') } = useParams();
  const data = useData();
  const navigate = useNavigate();
  const report = useMemo(() => (data ? monthReport(month, data.exercises, data.sets, data.days) : null), [data, month]);
  const thisMonth = todayKey().slice(0, 7);
  const go = (n: number) => navigate(`/report/${shiftMonth(month, n)}`, { replace: true });

  return (
    <SubPage header={<Header title="月間レポート" back="/" />}>
      {!report ? (
        <Loading />
      ) : (
        <ScrollArea className="space-y-3">
          {/* 月と、いちばん大事な数字 */}
          <section
            className="rounded-3xl p-4 text-white shadow-lg shadow-brand-800/30"
            style={{
              background:
                'repeating-linear-gradient(135deg, rgb(255 255 255 / 0.04) 0 10px, transparent 10px 20px), linear-gradient(135deg, #0f3669, #13478e 55%, #1e6fd9)',
            }}
          >
            <div className="flex items-center justify-between">
              <button onClick={() => go(-1)} className="-ml-2 p-2 active:opacity-50" aria-label="前の月">
                <ChevronLeft />
              </button>
              <div className="text-center">
                <div className="text-[10px] font-black tracking-[0.3em] text-sky-200">MONTHLY REPORT</div>
                <div className="text-xl font-black">{format(fromKey(`${month}-01`), 'yyyy年M月')}</div>
              </div>
              <button onClick={() => go(1)} disabled={month >= thisMonth} className="-mr-2 p-2 active:opacity-50 disabled:opacity-20" aria-label="次の月">
                <ChevronRight />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <HeroStat label="トレーニング" value={`${report.trainingDays}`} unit="日" diff={report.trainingDays - report.prev.trainingDays} />
              <HeroStat label="新記録" value={`${report.records.length}`} unit="回" />
              <HeroStat
                label="総挙上重量"
                value={report.volume >= 10000 ? `${(report.volume / 1000).toFixed(1)}` : report.volume.toLocaleString()}
                unit={report.volume >= 10000 ? 't' : 'kg'}
                diffPct={report.prev.volume > 0 ? Math.round(((report.volume - report.prev.volume) / report.prev.volume) * 100) : undefined}
              />
            </div>
          </section>

          {report.trainingDays === 0 && report.gymDays === 0 ? (
            <section className="rounded-2xl bg-white p-6 text-center text-sm text-gray-400 shadow-sm">この月の記録はありません</section>
          ) : (
            <>
              {/* 一番伸びた種目 */}
              {report.topGain && (
                <section className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white shadow-sm">
                  <Flame className="animate-flame h-9 w-9 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold opacity-90">今月いちばん伸びた種目</div>
                    <div className="truncate text-lg font-black">{report.topGain.exercise.name}</div>
                    <div className="text-xs tabular-nums opacity-90">
                      推定1RM {fmtKg(report.topGain.before)} → {fmtKg(report.topGain.after)}kg
                    </div>
                  </div>
                  <div className="text-2xl font-black tabular-nums">+{Math.round((report.topGain.after / report.topGain.before - 1) * 100)}%</div>
                </section>
              )}

              {/* 部位ごとのセット数 */}
              <section className="rounded-2xl bg-white p-4 shadow-sm">
                <h2 className="mb-2 font-bold">部位ごとのセット数</h2>
                <PartBars partSets={report.partSets} />
                <div className="mt-3 flex justify-around border-t border-gray-100 pt-3 text-center text-xs text-gray-500">
                  <MiniStat label="セット" value={`${report.sets}`} />
                  <MiniStat label="走った距離" value={`${Number(report.runKm.toFixed(1))}km`} />
                  <MiniStat label="体操の日" value={`${report.gymDays}日`} />
                </div>
              </section>

              {/* 新記録の一覧 */}
              <section className="rounded-2xl bg-white p-4 shadow-sm">
                <h2 className="mb-1 font-bold">今月の新記録</h2>
                {report.records.length === 0 ? (
                  <p className="py-3 text-center text-sm text-gray-400">新記録はまだありません。次の月に狙おう！</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {report.records.map(({ exercise, set, kind }) => (
                      <li key={set.id}>
                        <Link to={`/exercise/${exercise.id}`} className="flex items-center gap-2 py-2 active:bg-gray-50">
                          <span className="w-10 shrink-0 text-xs text-gray-400 tabular-nums">{format(fromKey(set.date), 'M/d')}</span>
                          <span className="min-w-0 flex-1 truncate text-sm font-bold">{exercise.name}</span>
                          <span className="text-sm tabular-nums text-gray-600">{setLabel(set, isCardio(exercise))}</span>
                          <RecordBadge kind={kind} cardio={isCardio(exercise)} small />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </ScrollArea>
      )}
    </SubPage>
  );
}

function HeroStat({ label, value, unit, diff, diffPct }: { label: string; value: string; unit: string; diff?: number; diffPct?: number }) {
  const d = diffPct ?? diff;
  return (
    <div className="rounded-xl bg-white/10 px-1 py-2">
      <div className="text-[10px] font-bold opacity-80">{label}</div>
      <div className="text-2xl leading-tight font-black tabular-nums">
        {value}
        <span className="ml-0.5 text-xs font-bold">{unit}</span>
      </div>
      {d !== undefined && (
        <div className={`text-[10px] font-bold tabular-nums ${d > 0 ? 'text-emerald-300' : d < 0 ? 'text-rose-300' : 'opacity-60'}`}>
          前月比 {d > 0 ? '+' : ''}
          {d}
          {diffPct !== undefined ? '%' : '日'}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-base font-black text-gray-800 tabular-nums">{value}</div>
      {label}
    </div>
  );
}

function PartBars({ partSets }: { partSets: Partial<Record<string, number>> }) {
  const max = Math.max(1, ...Object.values(partSets).map((n) => n ?? 0));
  return (
    <div className="space-y-1.5">
      {BODY_PARTS.map((p) => {
        const n = partSets[p.id] ?? 0;
        return (
          <div key={p.id} className="flex items-center gap-2">
            <span className="w-8 shrink-0 text-sm font-bold text-gray-600">{p.label}</span>
            <div className="h-5 flex-1 overflow-hidden rounded-md bg-gray-100">
              <div className="h-full rounded-md bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-500" style={{ width: `${(n / max) * 100}%` }} />
            </div>
            <span className={`w-8 shrink-0 text-right text-sm font-black tabular-nums ${n ? 'text-gray-800' : 'text-gray-300'}`}>{n}</span>
          </div>
        );
      })}
    </div>
  );
}
