import { setSetting } from '../db/db';
import { BAR_WEIGHTS, PLATE_COLORS, platesFor } from '../lib/plates';
import { fmtKg } from '../lib/records';
import { useSetting } from '../lib/useData';

/** プレートの高さ（重いほど大きい） */
const PLATE_HEIGHT: Record<number, number> = { 25: 56, 20: 54, 15: 48, 10: 40, 5: 32, 2.5: 26, 1.25: 22 };

/** プレート計算：その重さにするには、バーの片側に何kgのプレートを付けるかを絵で出す */
export function PlateView({ weight }: { weight: number }) {
  const bar = useSetting('barWeight', 20);
  if (bar === undefined) return null;
  return (
    <div className="mt-2 ml-8 rounded-xl bg-gray-50 px-3 py-2.5">
      <Barbell weight={weight} bar={bar} />
      <div className="mt-2 flex items-center justify-center gap-1.5 text-xs">
        <span className="text-gray-400">バー</span>
        {BAR_WEIGHTS.map((w) => (
          <button
            key={w}
            onClick={() => setSetting('barWeight', w)}
            className={`rounded-full px-2.5 py-1 font-bold ${w === bar ? 'bg-brand-500 text-white' : 'bg-white text-gray-500 ring-1 ring-gray-200'}`}
          >
            {w}kg
          </button>
        ))}
      </div>
    </div>
  );
}

/** バーベルの絵と「片側：25 + 2.5kg」 */
export function Barbell({ weight, bar }: { weight: number; bar: number }) {
  const result = platesFor(weight, bar);
  // 左側のプレートは内側（バーの真ん中寄り）から重い順に並ぶので、左右対称に描く
  const side = result?.perSide ?? [];
  const plate = (p: number, i: number) => (
    <span
      key={i}
      className="w-[9px] shrink-0 rounded-[3px] ring-1 ring-black/10"
      style={{ height: PLATE_HEIGHT[p], background: PLATE_COLORS[p] }}
      title={`${p}kg`}
    />
  );
  return (
    <>
      <div className="flex h-14 items-center justify-center">
        {result ? (
          <>
            <span className="h-2 w-4 rounded-l-full bg-gray-400" />
            <div className="flex items-center gap-px">{[...side].reverse().map(plate)}</div>
            <span className="h-3 w-2 bg-gray-500" />
            <span className="h-1.5 w-20 bg-gradient-to-b from-gray-300 to-gray-500" />
            <span className="h-3 w-2 bg-gray-500" />
            <div className="flex items-center gap-px">{side.map(plate)}</div>
            <span className="h-2 w-4 rounded-r-full bg-gray-400" />
          </>
        ) : (
          <span className="text-sm text-gray-400">バー（{bar}kg）より軽い重さです</span>
        )}
      </div>
      {result && (
        <div className="mt-1 text-center text-[13px] text-gray-600">
          片側：
          <span className="font-black text-gray-800 tabular-nums">{side.length ? side.map(fmtKg).join(' + ') : 'なし'}</span>
          {side.length > 0 && 'kg'}
          {result.rest > 0 && <span className="ml-1 text-xs text-rose-500">（{fmtKg(result.rest)}kg はプレートで作れません）</span>}
        </div>
      )}
    </>
  );
}
