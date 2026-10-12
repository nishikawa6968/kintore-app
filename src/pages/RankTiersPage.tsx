import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Emblem } from '../components/Emblem';
import { Header, Loading, ScrollArea, SubPage } from '../components/Layout';
import { LEVEL_COLORS, LEVEL_RANKS, LEVELS } from '../lib/big3';
import { nextTarget, rankOf, thresholdLabel, valueLabel } from '../lib/ranks';
import { useData, useSetting } from '../lib/useData';
import { LIGHT_COLORS, TIER_EN } from './Big3TiersPage';

/** 1種目のランクの表：ランクごとに、何kg×何回でそのランクになるか */
export function RankTiersPage() {
  const { id = '' } = useParams();
  const data = useData();
  const bodyweight = useSetting('bodyweight', 0);
  const r = useMemo(() => {
    const exercise = data?.exercises.find((e) => e.id === Number(id));
    return exercise && data && bodyweight !== undefined ? rankOf(exercise, data.sets, bodyweight) : undefined;
  }, [data, id, bodyweight]);

  if (!data || bodyweight === undefined) return <SubPage header={<Header title="ランク" back="/ranks" />}><Loading /></SubPage>;
  if (!r) {
    return (
      <SubPage header={<Header title="ランク" back="/ranks" />}>
        <p className="p-10 text-center text-sm text-gray-400">この種目にはランクの基準がありません</p>
      </SubPage>
    );
  }
  const next = nextTarget(r);
  const idx = r.index;

  return (
    <SubPage header={<Header title={r.exercise.name} back="/ranks" />}>
      <ScrollArea className="space-y-3">
        <section
          className="rounded-3xl p-4 text-white shadow-lg shadow-brand-800/30"
          style={{
            background:
              'repeating-linear-gradient(135deg, rgb(255 255 255 / 0.04) 0 10px, transparent 10px 20px), linear-gradient(135deg, var(--color-brand-800), var(--color-brand-700) 55%, var(--color-brand-500))',
          }}
        >
          <div className="text-[10px] font-black tracking-[0.3em] text-brand-200">YOUR RANK</div>
          <div className="mt-1 flex items-center gap-3">
            <Emblem tier={idx} size={72} glow={idx !== null} shine={idx !== null} />
            <div className="min-w-0 flex-1">
              {idx !== null && (
                <div className="text-[11px] font-black tracking-widest" style={{ color: LIGHT_COLORS[idx] }}>
                  {TIER_EN[idx]}
                </div>
              )}
              <div className="text-3xl font-black">{idx === null ? '—' : LEVELS[idx]}</div>
              <div className="text-xs text-white/80 tabular-nums">あなたの記録：{valueLabel(r)}</div>
            </div>
          </div>
          {idx !== null && (
            <div className="mt-3">
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-bold text-white/90">
                  {next ? (
                    <>
                      次のランク <span style={{ color: LIGHT_COLORS[next.index] }}>{LEVEL_RANKS[next.index]}・{next.level}</span>
                    </>
                  ) : (
                    '最高ランクに到達！'
                  )}
                </span>
                {next && <span className="text-base font-black tabular-nums">{next.label}</span>}
              </div>
              <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${r.progress * 100}%`, background: `linear-gradient(90deg, ${LEVEL_COLORS[idx]}, ${LEVEL_COLORS[next?.index ?? idx]})` }}
                />
              </div>
            </div>
          )}
          {idx === null && (
            <p className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-sm font-bold">
              {r.std.kind === 'big3' && bodyweight <= 0 ? (
                <>
                  BIG3 の種目は体重からランクを決めます。
                  <Link to="/big3" className="ml-1 underline">
                    体重を入れる
                  </Link>
                </>
              ) : (
                '記録するとランクが出ます'
              )}
            </p>
          )}
        </section>

        {r.thresholds &&
          [4, 3, 2, 1, 0].map((tier) => {
            const color = LEVEL_COLORS[tier];
            const current = idx === tier;
            const cleared = idx !== null && idx > tier;
            const locked = !current && !cleared;
            return (
              <section
                key={tier}
                className="relative flex items-center gap-3 overflow-hidden rounded-2xl bg-white p-3 pl-4 shadow-sm"
                style={current ? { boxShadow: `0 0 0 2px ${color}, 0 6px 22px ${color}55` } : undefined}
              >
                <div className="absolute inset-y-0 left-0 w-1.5" style={{ background: color, opacity: locked ? 0.35 : 1 }} />
                <Emblem tier={tier} size={40} shine={!locked} glow={current} locked={locked} />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-black tracking-widest" style={{ color, opacity: locked ? 0.5 : 1 }}>
                    {TIER_EN[tier]}
                  </div>
                  <div className={`text-lg leading-tight font-black ${locked ? 'text-gray-400' : 'text-gray-800'}`}>{LEVELS[tier]}</div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-black tabular-nums ${locked ? 'text-gray-500' : 'text-gray-800'}`}>{thresholdLabel(r.std, r.thresholds![tier])}</div>
                  {current && (
                    <span className="animate-pulse rounded-full px-2 py-0.5 text-[10px] font-black tracking-wider text-white" style={{ background: color }}>
                      NOW
                    </span>
                  )}
                  {cleared && <span className="text-[10px] font-black tracking-wider text-gray-400">CLEAR</span>}
                </div>
              </section>
            );
          })}

        <p className="px-1 text-[11px] leading-relaxed text-gray-400">
          {r.std.note && <>{r.std.note}。</>}
          {r.std.kind === 'weight' && `ほかの回数のセットも、${r.std.reps}回に換算してくらべます。`}
          成人男性の一般的な目安をもとにした、おおまかな値です。
        </p>
      </ScrollArea>
    </SubPage>
  );
}
