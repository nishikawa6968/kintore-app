import { useState } from 'react';
import { db } from '../db/db';
import { BODY_PARTS, type BodyPart, type Exercise } from '../types';

/** 種目の追加・名前変更用のボトムシート */
export function ExerciseSheet({
  initial,
  defaultPart = 'chest',
  onClose,
  onSaved,
}: {
  initial?: Exercise;
  defaultPart?: BodyPart;
  onClose: () => void;
  onSaved?: (id: number) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [part, setPart] = useState<BodyPart>(initial?.bodyPart ?? defaultPart);

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (initial) {
      await db.exercises.update(initial.id, { name: trimmed, bodyPart: part });
      onSaved?.(initial.id);
    } else {
      const last = await db.exercises.where('bodyPart').equals(part).sortBy('order');
      const order = last.length ? last[last.length - 1].order + 1 : 0;
      const id = await db.exercises.add({ name: trimmed, bodyPart: part, archived: false, order } as Exercise);
      onSaved?.(id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/40" onClick={onClose} data-swipe-ignore>
      <div className="mx-auto w-full max-w-md rounded-t-3xl bg-white p-5 pb-safe" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200" />
        <h2 className="mb-4 text-lg font-bold">{initial ? '種目を編集' : '種目を追加'}</h2>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          placeholder="種目名（例：ケーブルクロスオーバー）"
          className="mb-4 w-full rounded-xl bg-gray-50 px-4 py-3 outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-brand-400"
        />
        <div className="mb-2 text-sm font-bold text-gray-500">部位</div>
        <div className="mb-6 flex flex-wrap gap-2">
          {BODY_PARTS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPart(p.id)}
              className={`h-10 rounded-full px-4 text-sm font-bold ${part === p.id ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="mb-4 flex gap-2">
          <button onClick={onClose} className="h-12 flex-1 rounded-xl bg-gray-100 font-bold text-gray-600">
            キャンセル
          </button>
          <button
            onClick={save}
            disabled={!name.trim()}
            className="h-12 flex-[2] rounded-xl bg-brand-500 font-bold text-white disabled:opacity-40"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
