import { useState } from 'react';
import { db } from '../db/db';
import { fmtPace, paceOf, speedKmh } from '../lib/records';
import type { SetRecord } from '../types';
import { Memo, Trash } from './Icons';
import { NumberStepper } from './NumberStepper';
import { RecordBadge } from './RecordBadge';

/** ランニング1本の入力行：距離（km）と時間（分・秒）。ペースと時速は自動で出す */
export function RunRow({ set, index, isRecord }: { set: SetRecord; index: number; isRecord: boolean }) {
  const [memoOpen, setMemoOpen] = useState(!!set.memo);
  const duration = set.duration ?? 0;
  const minutes = Math.floor(duration / 60);
  const seconds = Math.round(duration % 60);
  const update = (changes: Partial<SetRecord>) => db.sets.update(set.id, changes);
  // 秒が60を超えたり0を下回ったりしても、合計秒数で持つので分に繰り上がる
  const setTime = (m: number, s: number) => update({ duration: Math.max(0, Math.round(m) * 60 + Math.round(s)) });

  const remove = () => {
    if (confirm(`${index}本目を削除しますか？`)) db.sets.delete(set.id);
  };

  return (
    <div className={`px-3 py-3 transition-colors ${isRecord ? 'bg-amber-50' : ''}`}>
      <div className="flex items-center gap-2">
        <div className={`w-6 shrink-0 text-center text-lg font-bold ${isRecord ? 'text-amber-500' : 'text-brand-500'}`}>{index}</div>
        <span className="w-9 shrink-0 text-xs font-bold text-gray-400">距離</span>
        <div className="flex-1">
          <NumberStepper value={set.distance ?? 0} step={0.5} unit="km" decimal onChange={(distance) => update({ distance })} />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 pl-8">
        <span className="w-9 shrink-0 text-xs font-bold text-gray-400">時間</span>
        <div className="flex-1">
          <NumberStepper value={minutes} step={1} unit="分" onChange={(m) => setTime(m, seconds)} />
        </div>
        <div className="flex-1">
          <NumberStepper value={seconds} step={5} unit="秒" onChange={(s) => setTime(minutes, s)} />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 pl-8 text-xs text-gray-500">
        <span className="whitespace-nowrap tabular-nums">
          平均ペース <span className="font-bold text-gray-700">{fmtPace(paceOf(set))}</span>/km
        </span>
        {speedKmh(set) > 0 && <span className="whitespace-nowrap tabular-nums">時速 {speedKmh(set)}km</span>}
        {isRecord && <RecordBadge small />}
        <div className="ml-auto flex gap-1">
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
      {memoOpen && (
        <input
          defaultValue={set.memo ?? ''}
          placeholder="メモ（コース、体調など）"
          onChange={(e) => update({ memo: e.target.value || undefined })}
          className="mt-1.5 ml-8 w-[calc(100%-2rem)] rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-brand-400"
        />
      )}
    </div>
  );
}
