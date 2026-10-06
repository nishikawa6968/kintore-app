import { Flame } from '../illustrations/Illustrations';

export interface BestStat {
  label: string;
  value: string;
  /** その日に更新した項目 */
  up: boolean;
}

/**
 * 種目の自己ベスト欄（左右に2つの記録）。その日に記録を更新していたら、
 * 赤く燃える欄にして「本日更新！」と、前回のベストからの更新を表示する。
 */
export function BestCard({ left, right, before }: { left: BestStat; right: BestStat; before?: string | null }) {
  const fire = left.up || right.up;

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
        <span className="text-[15px] font-black tracking-wide drop-shadow">本日更新！</span>
        <Flame className="animate-flame h-6 w-6 [animation-delay:-0.45s]" />
        {before && <span className="ml-auto text-[11px] font-bold opacity-90">前回 {before} から更新</span>}
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

function UpBadge() {
  return <span className="rounded-full bg-white px-1.5 text-[10px] leading-4 font-black text-red-600">UP</span>;
}
