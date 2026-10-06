import { useRef, useState } from 'react';
import { format } from 'date-fns';
import { db, exportData, importData, type BackupData } from '../db/db';
import { BodyPartTabs } from '../components/BodyPartTabs';
import { ExerciseSheet } from '../components/ExerciseSheet';
import { ChevronDown, ChevronUp, Eye, EyeOff, Plus } from '../components/Icons';
import { Header, Loading, TabPage } from '../components/Layout';
import { useData } from '../lib/useData';
import { bodyPartLabel, type BodyPart, type Exercise } from '../types';

export function SettingsPage() {
  const data = useData();
  const [part, setPart] = useState<BodyPart>('chest');
  const [editing, setEditing] = useState<Exercise | 'new' | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const list = data?.exercises.filter((e) => e.bodyPart === part) ?? [];

  /** 隣の種目と並び順を入れ替える */
  const move = async (index: number, dir: -1 | 1) => {
    const ordered = list.map((e, i) => ({ ...e, order: i }));
    const j = index + dir;
    if (j < 0 || j >= ordered.length) return;
    [ordered[index].order, ordered[j].order] = [ordered[j].order, ordered[index].order];
    await db.exercises.bulkPut(ordered);
  };

  const download = async () => {
    const backup = await exportData();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `kintore-backup-${format(new Date(), 'yyyyMMdd')}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const restore = async (file: File) => {
    try {
      const backup = JSON.parse(await file.text()) as BackupData;
      if (!confirm(`${backup.sets?.length ?? 0}件のセット記録を読み込みます。\n今のデータはすべて置き換えられます。よろしいですか？`)) return;
      await importData(backup);
      alert('読み込みました');
    } catch (e) {
      alert(`読み込みに失敗しました：${e instanceof Error ? e.message : e}`);
    }
  };

  return (
    <TabPage header={<Header title="設定" />} bottom={<BodyPartTabs value={part} onChange={setPart} />}>
      {!data ? (
        <Loading />
      ) : (
        <div className="space-y-6 py-4">
          <section>
            <div className="flex items-center px-4">
              <h2 className="text-sm font-bold text-gray-500">
                種目の管理（<span className="text-brand-600">{bodyPartLabel(part)}</span>）
              </h2>
              <button
                onClick={() => setEditing('new')}
                className="ml-auto flex items-center gap-1 rounded-full bg-brand-500 px-3 py-1.5 text-xs font-bold text-white"
              >
                <Plus width={16} height={16} /> 追加
              </button>
            </div>
            <ul className="mx-4 mt-2 overflow-hidden rounded-2xl bg-white shadow-sm">
              {list.map((ex, i) => (
                <li key={ex.id} className="flex items-center border-b border-gray-100 pl-4 last:border-0">
                  <button onClick={() => setEditing(ex)} className={`flex-1 py-3 text-left ${ex.archived ? 'text-gray-300 line-through' : ''}`}>
                    {ex.name}
                  </button>
                  <button
                    onClick={() => db.exercises.update(ex.id, { archived: !ex.archived })}
                    className="p-2.5 text-gray-400 active:text-brand-500"
                    aria-label={ex.archived ? '表示する' : '非表示にする'}
                  >
                    {ex.archived ? <EyeOff width={20} height={20} /> : <Eye width={20} height={20} />}
                  </button>
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="p-2.5 text-gray-400 disabled:opacity-20" aria-label="上へ">
                    <ChevronUp width={20} height={20} />
                  </button>
                  <button onClick={() => move(i, 1)} disabled={i === list.length - 1} className="p-2.5 pr-3 text-gray-400 disabled:opacity-20" aria-label="下へ">
                    <ChevronDown width={20} height={20} />
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 px-5 text-xs text-gray-400">名前をタップで編集。目のアイコンで種目選択画面から隠せます（記録は残ります）。</p>
          </section>

          <section className="px-4">
            <h2 className="mb-2 text-sm font-bold text-gray-500">バックアップ</h2>
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <button onClick={download} className="w-full border-b border-gray-100 px-4 py-3.5 text-left active:bg-gray-50">
                <div className="font-bold text-brand-600">データを書き出す</div>
                <div className="text-xs text-gray-400">全記録をJSONファイルで保存します（{data.sets.length}セット）</div>
              </button>
              <button onClick={() => fileRef.current?.click()} className="w-full px-4 py-3.5 text-left active:bg-gray-50">
                <div className="font-bold text-brand-600">データを読み込む</div>
                <div className="text-xs text-gray-400">書き出したファイルから復元します（今のデータは置き換え）</div>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) restore(f);
                  e.target.value = '';
                }}
              />
            </div>
            <p className="mt-2 px-1 text-xs leading-relaxed text-gray-400">
              記録はこの端末のブラウザ内だけに保存されています。機種変更やブラウザのデータ削除に備えて、ときどき書き出しておくと安心です。
            </p>
          </section>
        </div>
      )}
      {editing && (
        <ExerciseSheet initial={editing === 'new' ? undefined : editing} defaultPart={part} onClose={() => setEditing(null)} />
      )}
    </TabPage>
  );
}
