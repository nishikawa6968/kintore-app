import { useState } from 'react';
import { createPortal } from 'react-dom';
import { addSet } from '../db/db';
import { Flame } from '../illustrations/Illustrations';
import { pyramidSets, PYRAMID_STEPS } from '../lib/pyramid';
import { fmtKg, fmtWeight } from '../lib/records';
import { NumberStepper } from './NumberStepper';

/**
 * 「新記録を狙う」ボタン。押すと狙う重さを入れる画面が出て、
 * 逆ピラミッド（75%×5 → 80%×4 → 85%×3 → 90%×2 → 100%×1）のセットをまとめて入れる。
 */
export function PRPyramidButton({ exerciseId, date, maxWeight }: { exerciseId: number; date: string; maxWeight: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 py-3 font-black text-white shadow-sm shadow-orange-500/30 active:scale-[0.98]"
      >
        <Flame className="animate-flame h-5 w-5" />
        新記録を狙う
        <span className="text-xs font-bold text-white/85">（ピラミッドのメニュー）</span>
      </button>
      {/* ボタンはスクロールする欄の中にあるので、画面いっぱいに出すために body の直下に出す */}
      {open && createPortal(<PRPyramidSheet exerciseId={exerciseId} date={date} maxWeight={maxWeight} onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

function PRPyramidSheet({ exerciseId, date, maxWeight, onClose }: { exerciseId: number; date: string; maxWeight: number; onClose: () => void }) {
  // 最初は「今までで一番重い重さ＋2.5kg」（記録がなければ空）
  const [target, setTarget] = useState(maxWeight > 0 ? maxWeight + 2.5 : 0);
  const sets = target > 0 ? pyramidSets(target) : [];

  const addAll = async () => {
    for (const s of sets) await addSet(exerciseId, date, s.weight, s.reps);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/40" onClick={onClose} data-swipe-ignore>
      <div className="mx-auto w-full max-w-md rounded-t-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200" />
        <h2 className="flex items-center gap-1.5 text-lg font-black">
          <Flame className="h-5 w-5 text-orange-500" />
          新記録を狙う
        </h2>
        <p className="mt-1 text-sm text-gray-500">今日挙げたい重さ（100%）を入れると、軽い重さから順にメニューが入ります。</p>

        <div className="mt-3 flex items-center gap-3">
          <span className="text-sm font-bold text-gray-600">狙う重さ</span>
          <div className="flex-1">
            <NumberStepper value={target} step={2.5} unit="kg" decimal onChange={setTarget} />
          </div>
        </div>
        {maxWeight > 0 && <p className="mt-1 text-right text-xs text-gray-400">今までの最高：{fmtWeight(maxWeight)}</p>}

        {/* メニュー：下へいくほど重く、回数は少なく。95% はとばす */}
        <div className="mt-3 space-y-1">
          {PYRAMID_STEPS.map((step, i) => {
            const s = sets[i];
            const last = step.pct === 100;
            return (
              <div key={step.pct}>
                {last && (
                  <div className="flex items-center gap-2 px-3 py-0.5 text-xs text-gray-300 line-through">
                    <span className="w-12">95%</span>
                    <span>とばす</span>
                  </div>
                )}
                <div
                  className={`mx-auto flex items-center gap-2 rounded-xl px-3 py-2 tabular-nums ${last ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' : 'bg-orange-50 text-gray-700'}`}
                  // 逆ピラミッドの形：重くなるほど幅を狭く
                  style={{ width: `${100 - i * 8}%` }}
                >
                  <span className={`w-12 text-xs font-bold ${last ? 'text-white/90' : 'text-orange-500'}`}>{step.pct}%</span>
                  <span className="flex-1 text-center text-lg font-black">{s ? `${fmtKg(s.weight)}kg` : '—'}</span>
                  <span className="w-14 text-right font-black">× {step.reps}回</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="h-12 flex-1 rounded-xl bg-gray-100 font-bold text-gray-600">
            キャンセル
          </button>
          <button onClick={addAll} disabled={!sets.length} className="h-12 flex-[2] rounded-xl bg-gradient-to-r from-orange-500 to-red-500 font-black text-white disabled:opacity-40">
            このメニューを入れる
          </button>
        </div>
      </div>
    </div>
  );
}
