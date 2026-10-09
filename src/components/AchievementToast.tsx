import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSetting, setSetting } from '../db/db';
import type { AchievementState } from '../lib/achievements';
import { useAchievements } from '../lib/useAchievements';
import { Medal } from './Medal';

/**
 * 実績を新しく解除したら、画面の上に「実績解除！」を出す（押すと実績の画面へ）。
 * お知らせ済みの実績は設定に保存する。初めて使うときは、今までの分はお知らせせずに保存だけする。
 */
export function AchievementToast() {
  const states = useAchievements();
  // null は「まだ一度も保存していない」
  const seen = useLiveQuery(async () => (await getSetting('seenAchievements')) ?? null, []);
  const [shown, setShown] = useState<{ items: AchievementState[]; key: number } | null>(null);
  const navigate = useNavigate();
  const counter = useRef(0);
  // お知らせした実績（保存が反映される前に、同じ実績をもう一度お知らせしないように）
  const announced = useRef(new Set<string>());

  useEffect(() => {
    if (!states || seen === undefined) return;
    const unlocked = states.filter((a) => a.unlocked).map((a) => a.id);
    if (seen === null) {
      setSetting('seenAchievements', unlocked);
      return;
    }
    const fresh = states.filter((a) => a.unlocked && !seen.includes(a.id) && !announced.current.has(a.id));
    if (!fresh.length) return;
    fresh.forEach((a) => announced.current.add(a.id));
    setSetting('seenAchievements', [...new Set([...seen, ...unlocked])]);
    setShown({ items: fresh, key: ++counter.current });
  }, [states, seen]);

  useEffect(() => {
    if (!shown) return;
    const t = setTimeout(() => setShown(null), 3800);
    return () => clearTimeout(t);
  }, [shown]);

  if (!shown) return null;
  const first = shown.items[0];
  const more = shown.items.length - 1;
  return (
    <button
      key={shown.key}
      onClick={() => {
        setShown(null);
        navigate('/achievements');
      }}
      className="toast-in fixed inset-x-4 top-[calc(env(safe-area-inset-top)+3.6rem)] z-40 mx-auto flex max-w-sm items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 text-left shadow-xl ring-1 ring-amber-200 backdrop-blur"
    >
      <Medal rarity={first.rarity} label={first.label} size={40} shine />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-black tracking-widest text-amber-500">実績解除！</div>
        <div className="truncate font-black text-gray-800">{first.title}</div>
        <div className="truncate text-xs text-gray-500">{more > 0 ? `ほか ${more}個の実績も解除` : first.desc}</div>
      </div>
    </button>
  );
}
