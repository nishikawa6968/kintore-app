import { useRef, useState } from 'react';
import { format } from 'date-fns';
import { db, exportData, importData, setSetting, type BackupData } from '../db/db';
import { BodyPartTabs } from '../components/BodyPartTabs';
import { ExerciseSheet } from '../components/ExerciseSheet';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, ChevronUp, Eye, EyeOff, Lock, Plus } from '../components/Icons';
import { Header, Loading, ScrollArea, TabPage } from '../components/Layout';
import { useData, useSetting } from '../lib/useData';
import { DEFAULT_WEEK_START } from '../lib/streak';
import { DEFAULT_THEME, THEMES } from '../lib/themes';
import { neighborPart, useSlideDirection } from '../lib/useSwipe';
import { SwipePager } from '../components/SwipePager';
import { bodyPartLabel, type BodyPart, type Exercise } from '../types';

export function SettingsPage() {
  const data = useData();
  const [part, setPart] = useState<BodyPart>('chest');
  const [editing, setEditing] = useState<Exercise | 'new' | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // 種目の管理は、いつもは閉じておく
  const [manageOpen, setManageOpen] = useState(false);
  const weekStart = useSetting('weekStart', DEFAULT_WEEK_START);
  const theme = useSetting('theme', DEFAULT_THEME);

  const listOf = (p: BodyPart) => data?.exercises.filter((e) => e.bodyPart === p) ?? [];

  // 種目の表を切り替えた向き（入ってくる向き）
  const slide = useSlideDirection(part);

  /** 部位の種目の表（名前で編集・目のアイコンで隠す・矢印で並べ替え） */
  const renderList = (p: BodyPart) => {
    const list = listOf(p);
    return (
      <ul className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {list.map((ex, i) => (
          <li key={ex.id} className="flex items-center border-b border-gray-100 pl-4 last:border-0">
            {ex.builtin ? (
              // アプリ固定の種目（BIG3・ランニング）は名前・部位を変えられない
              <div className={`flex flex-1 items-center gap-1.5 py-3 ${ex.archived ? 'text-gray-300 line-through' : ''}`}>
                {ex.name}
                <Lock width={14} height={14} className="text-gray-300" aria-label="固定の種目" />
              </div>
            ) : (
              <button onClick={() => setEditing(ex)} className={`flex-1 py-3 text-left ${ex.archived ? 'text-gray-300 line-through' : ''}`}>
                {ex.name}
              </button>
            )}
            <button
              onClick={() => db.exercises.update(ex.id, { archived: !ex.archived })}
              className="p-2.5 text-gray-400 active:text-brand-500"
              aria-label={ex.archived ? '表示する' : '非表示にする'}
            >
              {ex.archived ? <EyeOff width={20} height={20} /> : <Eye width={20} height={20} />}
            </button>
            <button onClick={() => move(list, i, -1)} disabled={i === 0} className="p-2.5 text-gray-400 disabled:opacity-20" aria-label="上へ">
              <ChevronUp width={20} height={20} />
            </button>
            <button
              onClick={() => move(list, i, 1)}
              disabled={i === list.length - 1}
              className="p-2.5 pr-3 text-gray-400 disabled:opacity-20"
              aria-label="下へ"
            >
              <ChevronDown width={20} height={20} />
            </button>
          </li>
        ))}
      </ul>
    );
  };

  /** 隣の種目と並び順を入れ替える */
  const move = async (list: Exercise[], index: number, dir: -1 | 1) => {
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
    <TabPage header={<Header title="設定" />}>
      {!data ? (
        <Loading />
      ) : (
        <>
        {/* 真ん中：設定の中身（ここだけスクロール）／下：部位のロール（固定） */}
        <ScrollArea flush className="space-y-6">
          {/* 種目の管理：見出しを押すと開く。開いているときは、下に部位のロールが出る */}
          <section>
            <div className="px-4">
              <button
                onClick={() => setManageOpen((o) => !o)}
                className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-left shadow-sm active:bg-gray-50"
                aria-expanded={manageOpen}
              >
                <div className="flex-1">
                  <div className="font-bold text-brand-600">種目の管理</div>
                  <div className="text-xs text-gray-400">種目の追加・名前の変更・並び替え・非表示</div>
                </div>
                <ChevronDown className={`shrink-0 text-gray-400 transition-transform ${manageOpen ? 'rotate-180' : ''}`} width={20} height={20} />
              </button>
            </div>
            {manageOpen && (
              <>
                <div className="mt-3 flex items-center px-4">
                  <h2 className="text-sm font-bold text-gray-500">
                    <span className="text-brand-600">{bodyPartLabel(part)}</span>の種目
                  </h2>
                  <button
                    onClick={() => setEditing('new')}
                    className="ml-auto flex items-center gap-1 rounded-full bg-brand-500 px-3 py-1.5 text-xs font-bold text-white"
                  >
                    <Plus width={16} height={16} /> 追加
                  </button>
                </div>
                {/* 表は指で左右に動かして隣の部位へ。ロールのように隣の部位の表がつながって出てくる */}
                <SwipePager
                  pageKey={part}
                  direction={slide}
                  onSwipe={(dir) => setPart(neighborPart(part, dir))}
                  renderPage={(o) => <div className="px-4">{renderList(o === 0 ? part : neighborPart(part, o))}</div>}
                  className="pt-2 pb-1"
                />
              </>
            )}
          </section>

          {/* 詳細設定：週の始まりとテーマの色 */}
          <section className="px-4">
            <h2 className="mb-2 text-sm font-bold text-gray-500">詳細設定</h2>
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
                <div className="flex-1">
                  <div className="font-bold text-gray-800">週の始まり</div>
                  <div className="text-xs text-gray-400">カレンダーと週の目標</div>
                </div>
                <div className="flex rounded-full bg-gray-100 p-1">
                  {([0, 1] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setSetting('weekStart', d)}
                      className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${weekStart === d ? 'bg-brand-500 text-white shadow-sm' : 'text-gray-500'}`}
                    >
                      {d === 0 ? '日曜' : '月曜'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="px-4 py-3">
                <div className="font-bold text-gray-800">テーマの色</div>
                <div className="text-xs text-gray-400">アプリ全体と、開くときの画面の色が変わります</div>
                <div className="mt-3 grid grid-cols-4 gap-x-2 gap-y-3">
                  {THEMES.map((t) => {
                    const on = t.id === theme;
                    return (
                      <button key={t.id} onClick={() => setSetting('theme', t.id)} className="flex flex-col items-center gap-1 active:scale-95" aria-pressed={on}>
                        <span
                          className={`flex h-11 w-11 items-center justify-center rounded-full shadow-sm transition-shadow ${on ? 'ring-[3px] ring-offset-2' : ''}`}
                          style={{ background: `linear-gradient(135deg, ${t.colors[4]}, ${t.colors[7]})`, ['--tw-ring-color' as string]: t.colors[5] }}
                        >
                          {on && (
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M5 12l5 5 9-10" />
                            </svg>
                          )}
                        </span>
                        <span className={`text-[11px] ${on ? 'font-black text-gray-800' : 'text-gray-500'}`}>{t.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
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
          </section>

          <section className="px-4">
            <h2 className="mb-2 text-sm font-bold text-gray-500">このアプリについて</h2>
            <Link to="/help" className="flex items-center rounded-2xl bg-white px-4 py-3.5 shadow-sm active:bg-gray-50">
              <div className="flex-1">
                <div className="font-bold text-brand-600">使い方・アプリの説明</div>
              </div>
              <ChevronRight className="shrink-0 text-gray-300" width={20} height={20} />
            </Link>
          </section>
        </ScrollArea>
        {manageOpen && (
          <div className="shrink-0 pb-1">
            <BodyPartTabs value={part} onChange={setPart} />
          </div>
        )}
        </>
      )}
      {editing && (
        <ExerciseSheet initial={editing === 'new' ? undefined : editing} defaultPart={part} onClose={() => setEditing(null)} />
      )}
    </TabPage>
  );
}
