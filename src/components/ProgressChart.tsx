import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { chartData, RANGES, type Range } from '../lib/chart';
import { estimate1RM, fmtKg, fmtPace, paceOf } from '../lib/records';
import type { SetRecord } from '../types';

/** 横軸の目盛りの書き方（期間に合わせる） */
const TICK: Record<Range, string> = { '1m': 'M/d', '1y': 'M月', '3y': 'yy/M', all: 'yy/M' };
/** ツールチップの日時の書き方 */
const TIP: Record<Range, string> = { '1m': 'M/d(E)', '1y': 'yyyy/M/d', '3y': 'yyyy/M/d', all: 'yyyy/M/d' };

/**
 * 種目の推移のグラフ。横軸は時間、縦軸は最高推定1RM（自重は最高回数、ランニングは平均ペース）。
 * 期間は 全て・3年・1年・月 から選ぶ。記録は丸い点で、点と点は点線でつなぐ。
 */
export function ProgressChart({ sets, kind }: { sets: SetRecord[]; kind: '1rm' | 'reps' | 'pace' }) {
  const [range, setRange] = useState<Range>('all');

  const { points, domain } = useMemo(() => {
    const value = kind === 'pace' ? paceOf : kind === 'reps' ? (s: SetRecord) => s.reps : (s: SetRecord) => estimate1RM(s.weight, s.reps);
    return chartData(sets, value, kind === 'pace' ? 'min' : 'max', range);
  }, [sets, kind, range]);

  const title = kind === 'pace' ? '1kmの平均ペースの推移（上ほど速い）' : kind === 'reps' ? '最高回数の推移' : '最高推定1RMの推移';
  const fmtValue = (v: number) => (kind === 'pace' ? `${fmtPace(v)}/km` : kind === 'reps' ? `${v}回` : `${fmtKg(v)}kg`);

  // 縦軸は点の範囲に少しゆとりを持たせ、きりのいい数で区切る
  const values = points.map((p) => p.value);
  const step = kind === 'pace' ? 15 : 5;
  const lo = values.length ? Math.floor((Math.min(...values) - step / 2) / step) * step : 0;
  const hi = values.length ? Math.ceil((Math.max(...values) + step / 2) / step) * step : step;

  return (
    <div className="flex h-full flex-col">
      <h2 className="px-1 text-sm font-bold text-gray-600">{title}</h2>
      <div className="mt-2 grid shrink-0 grid-cols-4 gap-1 rounded-xl bg-gray-100 p-1">
        {RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            className={`rounded-lg py-1.5 text-xs font-bold transition-colors ${range === r.id ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500'}`}
          >
            {r.label}
          </button>
        ))}
      </div>
      <div className="relative mt-2 min-h-0 flex-1">
        {points.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-gray-400">この期間の記録はありません</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: kind === 'pace' ? -2 : -14 }}>
              <CartesianGrid stroke="#eef1f5" vertical={false} />
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={domain}
                tickFormatter={(t: number) => format(t, TICK[range], { locale: ja })}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
              />
              <YAxis
                domain={[Math.max(0, lo), hi]}
                reversed={kind === 'pace'}
                tickFormatter={(v: number) => (kind === 'pace' ? fmtPace(v) : String(v))}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                labelFormatter={(t) => format(Number(t), TIP[range], { locale: ja })}
                formatter={(v) => [fmtValue(Number(v)), kind === 'pace' ? '平均ペース' : kind === 'reps' ? '最高回数' : '推定1RM']}
              />
              <Line
                type="linear"
                dataKey="value"
                stroke="#1e6fd9"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4.5, fill: '#1e6fd9', stroke: '#ffffff', strokeWidth: 1.5 }}
                activeDot={{ r: 6 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
