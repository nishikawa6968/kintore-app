import { Flame, Sparkle } from '../illustrations/Illustrations';

export interface BestStat {
  label: string;
  value: string;
  /** その日に更新した項目 */
  up: boolean;
}

/**
 * 種目の自己ベスト欄（左に持った重量の記録、右に推定1RM。ランニングは最長距離と平均ペース）。
 * - 今までで一番重い重さを持った：赤く燃える欄に「本日更新！」
 * - 同じ重さで回数が増えた・推定1RM（右）だけを更新：青く光る欄に「1RM更新！」（控えめだけど目立つように）
 * どちらも前回のベストからの更新を表示する。
 */
export function BestCard({ left, right, before }: { left: BestStat; right: BestStat; before?: string | null }) {
  const fire = left.up;

  if (!fire && right.up) {
    return (
      <div className="glow-blue shine relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-sky-400 px-4 pt-2.5 pb-3 text-white">
        <div className="mb-1 flex items-center gap-1.5">
          <Sparkle className="twinkle h-5 w-5 text-sky-100" />
          <span className="shrink-0 text-[15px] font-black tracking-wide whitespace-nowrap drop-shadow">{right.label.replace('ベスト', '')}更新！</span>
          {before && <span className="ml-auto min-w-0 text-right text-[11px] leading-tight font-bold opacity-90">前回 {before} から更新</span>}
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs opacity-80">{left.label}</div>
            <div className="text-xl font-bold tabular-nums">{left.value}</div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-xs opacity-90">
              {right.label}
              <UpBadge tone="blue" />
            </div>
            <div className="text-2xl font-black tabular-nums drop-shadow">{right.value}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!fire) {
    return (
      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-brand-500 to-brand-400 px-4 py-3 text-white shadow-sm">
        <div>
          <div className="text-xs opacity-80">{left.label}</div>
          <div className="text-xl font-bold tabular-nums">{left.value}</div>
        </div>
        <div className="text-right">
          <div className="text-xs opacity-80">{right.label}</div>
          <div className="text-xl font-bold tabular-nums">{right.value}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-fire animate-ember relative overflow-hidden rounded-2xl px-4 pt-2.5 pb-3 text-white">
      <div className="mb-1 flex items-center gap-1.5">
        <Flame className="animate-flame h-6 w-6" />
        <span className="shrink-0 text-[15px] font-black tracking-wide whitespace-nowrap drop-shadow">本日更新！</span>
        <Flame className="animate-flame h-6 w-6 [animation-delay:-0.45s]" />
        {before && <span className="ml-auto min-w-0 text-right text-[11px] leading-tight font-bold opacity-90">前回 {before} から更新</span>}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-1 text-xs opacity-90">
            {left.label}
            {left.up && <UpBadge />}
          </div>
          <div className="text-2xl font-black tabular-nums drop-shadow">{left.value}</div>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-1 text-xs opacity-90">
            {right.label}
            {right.up && <UpBadge />}
          </div>
          <div className="text-2xl font-black tabular-nums drop-shadow">{right.value}</div>
        </div>
      </div>
    </div>
  );
}

function UpBadge({ tone = 'red' }: { tone?: 'red' | 'blue' }) {
  return <span className={`rounded-full bg-white px-1.5 text-[10px] leading-4 font-black ${tone === 'red' ? 'text-red-600' : 'text-brand-600'}`}>UP</span>;
}
