import { fmtKg, fmtWeight, type Best } from '../lib/records';

/**
 * 種目の自己ベスト欄。その日に記録を更新していたら、赤く燃える欄にして強調する。
 * weightUp：最高重量×回数をその日に更新 / rmUp：推定1RMをその日に更新
 */
export function BestCard({ best, prevBest, weightUp, rmUp }: { best: Best; prevBest: Best | null; weightUp: boolean; rmUp: boolean }) {
  const fire = weightUp || rmUp;
  const rm = best.best1RM > 0 ? `${fmtKg(best.best1RM)}kg` : '—';

  if (!fire) {
    return (
      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-brand-500 to-brand-400 px-4 py-3 text-white shadow-sm">
        <div>
          <div className="text-xs opacity-80">自己ベスト</div>
          <div className="text-xl font-bold tabular-nums">
            {fmtWeight(best.maxWeight)} × {best.repsAtMax}回
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs opacity-80">推定1RM</div>
          <div className="text-xl font-bold tabular-nums">{rm}</div>
        </div>
      </div>
    );
  }

  const before = prevBest && (weightUp ? `${fmtWeight(prevBest.maxWeight)}×${prevBest.repsAtMax}回` : `1RM ${fmtKg(prevBest.best1RM)}kg`);

  return (
    <div className="bg-fire animate-ember relative overflow-hidden rounded-2xl px-4 pt-2.5 pb-3 text-white">
      <div className="mb-1 flex items-center gap-1.5">
        <span className="animate-flame text-xl">🔥</span>
        <span className="text-[15px] font-black tracking-wide drop-shadow">本日更新！</span>
        <span className="animate-flame text-xl [animation-delay:-0.45s]">🔥</span>
        {before && <span className="ml-auto text-[11px] font-bold opacity-90">前回 {before} から更新</span>}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-1 text-xs opacity-90">
            自己ベスト{weightUp && <UpBadge />}
          </div>
          <div className="text-2xl font-black tabular-nums drop-shadow">
            {fmtWeight(best.maxWeight)} × {best.repsAtMax}回
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-1 text-xs opacity-90">
            推定1RM{rmUp && <UpBadge />}
          </div>
          <div className="text-2xl font-black tabular-nums drop-shadow">{rm}</div>
        </div>
      </div>
    </div>
  );
}

function UpBadge() {
  return <span className="rounded-full bg-white px-1.5 text-[10px] leading-4 font-black text-red-600">UP</span>;
}
