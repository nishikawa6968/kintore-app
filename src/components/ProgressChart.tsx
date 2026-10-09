import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { chartData, RANGES, timeTicks, type ChartPoint, type Range } from '../lib/chart';
import { estimate1RM, fmtKg, fmtPace, paceOf } from '../lib/records';
import type { SetRecord } from '../types';

type Kind = '1rm' | 'reps' | 'pace';
/** 縦軸の目盛りの刻みの候補（小さい順。目盛りが5本以下になる一番細かい刻みを使う） */
const STEPS: Record<Kind, number[]> = { '1rm': [5, 10, 20, 25, 50, 100], reps: [1, 2, 5, 10, 20], pace: [15, 30, 60, 120] };

/** 点の範囲に少しゆとりを持たせ、きりのいい刻みの目盛りを作る */
function niceAxis(values: number[], steps: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  for (const step of steps) {
    const lo = Math.max(0, Math.floor((min - step / 2) / step) * step);
    const hi = Math.ceil((max + step / 2) / step) * step;
    if ((hi - lo) / step <= 5 || step === steps[steps.length - 1]) {
      const ticks = [];
      for (let v = lo; v <= hi; v += step) ticks.push(v);
      return { domain: [lo, hi] as [number, number], ticks };
    }
  }
  return { domain: [0, max] as [number, number], ticks: undefined };
}

interface Selected extends ChartPoint {
  /** 点の位置（グラフの中の座標 px） */
  cx: number;
  cy: number;
}

/**
 * 種目の推移のグラフ。横軸は時間、縦軸は最高推定1RM（自重は最高回数、ランニングは平均ペース）。
 * 期間は 全て・3年・1年・月 から選ぶ。記録は丸い点で、点と点は点線でつなぐ。
 * 点を押すとその日の値の吹き出しが出て、点以外の所を押すと消える。
 */
export function ProgressChart({ sets, kind }: { sets: SetRecord[]; kind: Kind }) {
  const [range, setRange] = useState<Range>('all');
  const [selected, setSelected] = useState<Selected | null>(null);

  const { points, domain } = useMemo(() => {
    const value = kind === 'pace' ? paceOf : kind === 'reps' ? (s: SetRecord) => s.reps : (s: SetRecord) => estimate1RM(s.weight, s.reps);
    return chartData(sets, value, kind === 'pace' ? 'min' : 'max', range);
  }, [sets, kind, range]);

  const title = kind === 'pace' ? '1kmの平均ペースの推移（上ほど速い）' : kind === 'reps' ? '最高回数の推移' : '最高推定1RMの推移';
  const fmtValue = (v: number) => (kind === 'pace' ? `${fmtPace(v)}/km` : kind === 'reps' ? `${v}回` : `${fmtKg(v)}kg`);
  const axis = points.length ? niceAxis(points.map((p) => p.value), STEPS[kind]) : null;
  const xAxis = timeTicks(domain);

  /** 点（見える円＋押しやすいように広めの見えない当たり） */
  const renderDot = (props: { cx?: number; cy?: number; index?: number; payload?: ChartPoint }) => {
    const { cx = 0, cy = 0, index = 0, payload } = props;
    const on = !!payload && selected?.t === payload.t;
    return (
      <g
        key={index}
        style={{ cursor: 'pointer' }}
        onClick={(e) => {
          e.stopPropagation();
          if (payload) setSelected({ ...payload, cx, cy });
        }}
      >
        <circle cx={cx} cy={cy} r={18} fill="transparent" />
        {on && <circle cx={cx} cy={cy} r={9} fill="#1e6fd9" opacity={0.18} />}
        <circle cx={cx} cy={cy} r={on ? 6 : 5} fill="#1e6fd9" stroke="#ffffff" strokeWidth={2} />
      </g>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <h2 className="px-1 text-sm font-bold text-gray-600">{title}</h2>
      <div className="mt-2 grid shrink-0 grid-cols-4 gap-1 rounded-xl bg-gray-100 p-1">
        {RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => {
              setRange(r.id);
              setSelected(null);
            }}
            className={`rounded-lg py-1.5 text-xs font-bold transition-colors ${range === r.id ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500'}`}
          >
            {r.label}
          </button>
        ))}
      </div>
      {/* 点以外の所を押すと吹き出しを消す */}
      <div className="relative mt-2 min-h-0 flex-1" onClick={() => setSelected(null)}>
        {points.length === 0 || !axis ? (
          <p className="flex h-full items-center justify-center text-sm text-gray-400">この期間の記録はありません</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%" onResize={() => setSelected(null)}>
              <LineChart data={points} margin={{ top: 12, right: 14, bottom: 0, left: kind === 'pace' ? -2 : -14 }}>
                <CartesianGrid stroke="#eef1f5" vertical={false} />
                <XAxis
                  dataKey="t"
                  type="number"
                  scale="time"
                  domain={domain}
                  ticks={xAxis.ticks}
                  tickFormatter={(t: number) => format(t, xAxis.format, { locale: ja })}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={axis.domain}
                  ticks={axis.ticks}
                  reversed={kind === 'pace'}
                  tickFormatter={(v: number) => (kind === 'pace' ? fmtPace(v) : String(v))}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Line
                  type="linear"
                  dataKey="value"
                  stroke="#1e6fd9"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={renderDot}
                  activeDot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
            {selected && (
              // 選んだ点の上に吹き出し（上に余裕がなければ下に。グラフの左右の端からはみ出さないようにする）
              <div
                className={`pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg bg-gray-800 px-2.5 py-1.5 text-center text-white shadow-lg ${
                  selected.cy < 56 ? '' : '-translate-y-full'
                }`}
                style={{ left: `clamp(56px, ${selected.cx}px, calc(100% - 56px))`, top: selected.cy < 56 ? selected.cy + 12 : selected.cy - 12 }}
              >
                <div className="text-[10px] whitespace-nowrap text-white/80">{format(selected.t, 'yyyy/M/d(E)', { locale: ja })}</div>
                <div className="text-sm font-bold whitespace-nowrap">{fmtValue(selected.value)}</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
