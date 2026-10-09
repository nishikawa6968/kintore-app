import { useLiveQuery } from 'dexie-react-hooks';
import { useId, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Header, Loading, ScrollArea, SubPage } from '../components/Layout';
import { db } from '../db/db';
import { BIG3, LEVEL_COLORS, LEVEL_RANKS, LEVELS, STANDARDS, big3Bests, levelOf, type Big3Lift } from '../lib/big3';
import { fmtKg } from '../lib/records';
import { useData } from '../lib/useData';

const TIER_EN = ['BEGINNER', 'NOVICE', 'INTERMEDIATE', 'ADVANCED', 'ELITE'];
/** 紺色の背景の上でも読みやすい、明るめのレベルの色 */
const LIGHT_COLORS = ['#d1d5db', '#7dd3fc', '#93c5fd', '#d8b4fe', '#fcd34d'];
const COLUMNS: { key: Big3Lift | 'total'; label: string }[] = [
  { key: 'bench', label: 'ベンチ' },
  { key: 'squat', label: 'スクワット' },
  { key: 'deadlift', label: 'デッド' },
  { key: 'total', label: '合計' },
];

/** その称号に必要な重さ（プレートで組める 2.5kg 単位に切り上げ） */
const required = (kind: Big3Lift | 'total', tier: number, bodyweight: number) => Math.ceil((STANDARDS[kind][tier] * bodyweight) / 2.5) * 2.5;

/** BIG3 の称号（初心者〜エリート）ごとに、何kg挙げれば届くかのティア表 */
export function Big3TiersPage() {
  const data = useData();
  const bodyweight = useLiveQuery(async () => (await db.settings.get('bodyweight'))?.value ?? 0, []);

  const mine = useMemo(() => {
    if (!data) return null;
    const bests = big3Bests(data.exercises, data.sets);
    const complete = BIG3.every((l) => bests[l.id]);
    const weights: Record<Big3Lift | 'total', number> = {
      bench: bests.bench?.weight ?? 0,
      squat: bests.squat?.weight ?? 0,
      deadlift: bests.deadlift?.weight ?? 0,
      total: complete ? BIG3.reduce((sum, l) => sum + bests[l.id]!.weight, 0) : 0,
    };
    return { weights, complete };
  }, [data]);

  if (!mine || bodyweight === undefined) {
    return (
      <SubPage header={<Header title="称号ティア表" back="/big3" />}>
        <Loading />
      </SubPage>
    );
  }

  // 今の称号は BIG3 合計で決める
  const current = bodyweight && mine.complete ? levelOf('total', mine.weights.total, bodyweight) : null;

  return (
    <SubPage header={<Header title="称号ティア表" back="/big3" />}>
      <ScrollArea className="space-y-3">
        <RankHero bodyweight={bodyweight} total={mine.weights.total} complete={mine.complete} />

        {[4, 3, 2, 1, 0].map((tier) => (
          <TierCard key={tier} tier={tier} bodyweight={bodyweight} weights={mine.weights} current={current?.index === tier} cleared={!!current && current.index > tier} />
        ))}
      </ScrollArea>
    </SubPage>
  );
}

/** 一番上の「あなたの称号」 */
function RankHero({ bodyweight, total, complete }: { bodyweight: number; total: number; complete: boolean }) {
  const info = bodyweight && complete ? levelOf('total', total, bodyweight) : null;
  const std = STANDARDS.total;
  const progress = info?.next ? Math.min(1, Math.max(0, (info.multiple - (info.index === 0 ? 0 : std[info.index])) / (std[info.index + 1] - (info.index === 0 ? 0 : std[info.index])))) : 1;

  return (
    <section
      className="relative overflow-hidden rounded-3xl p-4 text-white shadow-lg shadow-brand-800/30"
      style={{
        background:
          'repeating-linear-gradient(135deg, rgb(255 255 255 / 0.04) 0 10px, transparent 10px 20px), linear-gradient(135deg, #0f3669, #13478e 55%, #1e6fd9)',
      }}
    >
      <div className="text-[10px] font-black tracking-[0.3em] text-sky-200">YOUR RANK</div>
      {info ? (
        <>
          <div className="mt-1 flex items-center gap-3">
            <Emblem tier={info.index} size={76} glow />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-black tracking-widest" style={{ color: LIGHT_COLORS[info.index] }}>
                {TIER_EN[info.index]}
              </div>
              <div className="text-3xl font-black">{info.level}</div>
              <div className="text-xs tabular-nums opacity-80">
                BIG3合計 {fmtKg(total)}kg ／ 体重 {fmtKg(bodyweight)}kg
              </div>
            </div>
          </div>
          {info.next ? (
            <div className="mt-3">
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-bold opacity-90">
                  次の称号 <span style={{ color: LIGHT_COLORS[info.index + 1] }}>{LEVEL_RANKS[info.index + 1]}・{info.next.level}</span> まで
                </span>
                <span className="tabular-nums">
                  合計あと <span className="text-lg font-black">{fmtKg(Math.max(0, required('total', info.index + 1, bodyweight) - total))}</span>kg
                </span>
              </div>
              <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${progress * 100}%`, background: `linear-gradient(90deg, ${LEVEL_COLORS[info.index]}, ${LEVEL_COLORS[info.index + 1]})` }}
                />
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-xl bg-white/10 py-2 text-center text-sm font-black text-amber-300">最高の称号に到達！</div>
          )}
        </>
      ) : (
        <div className="mt-2 flex items-center gap-3">
          <Emblem tier={null} size={64} />
          <p className="flex-1 text-sm font-bold leading-relaxed">
            {bodyweight ? '3種目すべてを記録すると、称号が決まります。' : '体重を入れると、あなたの称号と必要な重さが分かります。'}
            {!bodyweight && (
              <Link to="/big3" replace className="mt-1.5 block w-fit rounded-full bg-white/20 px-3 py-1 text-xs active:bg-white/30">
                体重を入れる
              </Link>
            )}
          </p>
        </div>
      )}
    </section>
  );
}

/** 称号1つ分の行：エンブレムと、種目ごと・合計の必要な重さ */
function TierCard({
  tier,
  bodyweight,
  weights,
  current,
  cleared,
}: {
  tier: number;
  bodyweight: number;
  weights: Record<Big3Lift | 'total', number>;
  current: boolean;
  cleared: boolean;
}) {
  const color = LEVEL_COLORS[tier];
  return (
    <section
      className={`relative overflow-hidden rounded-2xl bg-white p-3 pl-4 shadow-sm`}
      style={current ? { boxShadow: `0 0 0 2px ${color}, 0 6px 22px ${color}55` } : undefined}
    >
      {/* 左端の色の帯 */}
      <div className="absolute inset-y-0 left-0 w-1.5" style={{ background: color }} />
      <div className="flex items-center gap-2.5">
        <Emblem tier={tier} size={44} />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-black tracking-widest" style={{ color }}>
            {TIER_EN[tier]}
          </div>
          <div className="text-lg leading-tight font-black text-gray-800">{LEVELS[tier]}</div>
        </div>
        {current && (
          <span className="animate-pulse rounded-full px-2.5 py-0.5 text-[11px] font-black tracking-wider text-white" style={{ background: color }}>
            NOW
          </span>
        )}
        {cleared && <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-black tracking-wider text-gray-500">CLEAR</span>}
      </div>

      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {COLUMNS.map(({ key, label }) => {
          const need = bodyweight ? required(key, tier, bodyweight) : 0;
          const reached = !!bodyweight && weights[key] > 0 && weights[key] >= need;
          return (
            <div
              key={key}
              className={`relative rounded-xl px-1 py-1.5 text-center ${key === 'total' ? 'bg-brand-50' : 'bg-gray-50'}`}
              style={reached ? { background: `${color}1f` } : undefined}
            >
              {reached && (
                <span
                  className="absolute -top-1.5 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black text-white ring-2 ring-white"
                  style={{ background: color }}
                  aria-label="達成"
                >
                  ✓
                </span>
              )}
              <div className="text-[10px] font-bold text-gray-500">{label}</div>
              {bodyweight ? (
                <div className="text-[15px] leading-tight font-black tabular-nums text-gray-800">
                  {fmtKg(need)}
                  <span className="text-[10px] font-bold text-gray-400">kg</span>
                </div>
              ) : null}
              <div className={`tabular-nums ${bodyweight ? 'text-[9px] text-gray-400' : 'text-[15px] font-black text-gray-800'}`}>×{STANDARDS[key][tier]}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** ゲームのランクのような盾のエンブレム（tier が null なら「？」） */
function Emblem({ tier, size, glow = false }: { tier: number | null; size: number; glow?: boolean }) {
  const id = useId();
  const color = tier === null ? '#64748b' : LEVEL_COLORS[tier];
  const rank = tier === null ? '?' : LEVEL_RANKS[tier];
  return (
    <svg
      viewBox="0 0 48 56"
      width={size}
      height={(size * 56) / 48}
      className="shrink-0"
      style={glow ? { filter: `drop-shadow(0 0 10px ${color})` } : { filter: 'drop-shadow(0 2px 3px rgb(0 0 0 / 0.18))' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.18" />
        </linearGradient>
      </defs>
      <path d="M24 2 L44 9 V27 C44 41 35 50 24 54 C13 50 4 41 4 27 V9 Z" fill={color} />
      <path d="M24 2 L44 9 V27 C44 41 35 50 24 54 C13 50 4 41 4 27 V9 Z" fill={`url(#${id}-shine)`} />
      <path d="M24 7 L39.5 12.5 V27 C39.5 38.5 32.5 45.5 24 49 C15.5 45.5 8.5 38.5 8.5 27 V12.5 Z" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.5" />
      <text x="24" y="35" textAnchor="middle" fontSize="22" fontWeight="900" fill="#fff" style={{ fontFamily: 'system-ui, sans-serif' }}>
        {rank}
      </text>
    </svg>
  );
}
