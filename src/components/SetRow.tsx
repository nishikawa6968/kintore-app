import { useState } from 'react';
import { db } from '../db/db';
import { estimate1RM, fmtKg, type RecordKind } from '../lib/records';
import type { SetRecord } from '../types';
import { Memo, PlateIcon, Trash } from './Icons';
import { PlateView } from './PlateView';
import { NumberStepper } from './NumberStepper';
import { RecordBadge, recordIndexClass, recordRowClass } from './RecordBadge';

export function SetRow({ set, index, recordKind }: { set: SetRecord; index: number; recordKind?: RecordKind }) {
  const [memoOpen, setMemoOpen] = useState(!!set.memo);
  const [platesOpen, setPlatesOpen] = useState(false);
  const rm = estimate1RM(set.weight, set.reps);
  const update = (changes: Partial<SetRecord>) => db.sets.update(set.id, changes);

  const remove = () => {
    if (confirm(`${index}セット目を削除しますか？`)) db.sets.delete(set.id);
  };

  return (
    <div className={`px-3 py-2.5 transition-colors ${recordRowClass(recordKind)}`}>
      <div className="flex items-center gap-2">
        <div className={`w-6 shrink-0 text-center text-lg font-bold ${recordIndexClass(recordKind)}`}>{index}</div>
        <div className="flex-[1.15]">
          <NumberStepper value={set.weight} step={2.5} unit="kg" decimal onChange={(weight) => update({ weight })} />
        </div>
        <span className="text-gray-300">×</span>
        <div className="flex-1">
          <NumberStepper value={set.reps} step={1} unit="回" onChange={(reps) => update({ reps: Math.round(reps) })} />
        </div>
      </div>
      <div className="mt-1.5 flex items-center gap-2 pl-8 text-xs text-gray-500">
        <span className="tabular-nums">推定1RM {rm > 0 ? `${fmtKg(rm)}kg` : '—'}</span>
        {recordKind && <RecordBadge kind={recordKind} small />}
        <div className="ml-auto flex gap-1">
          {set.weight > 0 && (
            <button
              onClick={() => setPlatesOpen((o) => !o)}
              className={`rounded-lg p-1.5 active:bg-gray-100 ${platesOpen ? 'text-brand-500' : 'text-gray-400'}`}
              aria-label="プレート計算"
            >
              <PlateIcon width={18} height={18} />
            </button>
          )}
          <button
            onClick={() => setMemoOpen((o) => !o)}
            className={`rounded-lg p-1.5 active:bg-gray-100 ${set.memo ? 'text-brand-500' : 'text-gray-400'}`}
            aria-label="メモ"
          >
            <Memo width={18} height={18} />
          </button>
          <button onClick={remove} className="rounded-lg p-1.5 text-gray-400 active:bg-rose-50 active:text-rose-500" aria-label="削除">
            <Trash width={18} height={18} />
          </button>
        </div>
      </div>
      {platesOpen && set.weight > 0 && <PlateView weight={set.weight} />}
      {memoOpen && (
        <input
          defaultValue={set.memo ?? ''}
          placeholder="メモ（フォーム、補助ありなど）"
          onChange={(e) => update({ memo: e.target.value || undefined })}
          className="mt-1.5 ml-8 w-[calc(100%-2rem)] rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-brand-400"
        />
      )}
    </div>
  );
}
