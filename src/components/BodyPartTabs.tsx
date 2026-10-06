import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BODY_PARTS, type BodyPart } from '../types';
import { ChevronLeft, ChevronRight } from './Icons';

type Value = BodyPart | 'all';

/** 1項目の幅(px)。scrollLeft = index × ITEM_W のとき、その項目がちょうど真ん中に来る */
const ITEM_W = 84;

/**
 * 部位の横ロール選択。左右にスワイプして、真ん中で止まった部位が選ばれる。
 * 部位名のタップや両端の矢印でも切り替えられる。
 */
export function BodyPartTabs<T extends Value>({
  value,
  onChange,
  includeAll = false,
}: {
  value: T;
  onChange: (v: T) => void;
  includeAll?: boolean;
}) {
  const items = [...(includeAll ? [{ id: 'all' as const, label: 'ALL' }] : []), ...BODY_PARTS];
  const indexOf = (v: Value) => Math.max(0, items.findIndex((p) => p.id === v));

  const ref = useRef<HTMLDivElement>(null);
  const [center, setCenter] = useState(() => indexOf(value));
  const scrolling = useRef(false);
  const settleTimer = useRef<number | undefined>(undefined);
  const latest = useRef({ value, onChange });
  latest.current = { value, onChange };

  const scrollToIndex = (i: number, smooth = true) => {
    const clamped = Math.min(items.length - 1, Math.max(0, i));
    ref.current?.scrollTo({ left: clamped * ITEM_W, behavior: smooth ? 'smooth' : 'instant' });
  };

  // 最初は選択中の部位を真ん中に置いておく
  useLayoutEffect(() => {
    if (ref.current) ref.current.scrollLeft = indexOf(value) * ITEM_W;
  }, []);

  // ホームの部位チップなど、外から選択が変わったらそこまで回す
  useEffect(() => {
    const i = indexOf(value);
    if (!scrolling.current && ref.current && Math.round(ref.current.scrollLeft / ITEM_W) !== i) scrollToIndex(i);
    setCenter(i);
  }, [value]);

  useEffect(() => () => clearTimeout(settleTimer.current), []);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    scrolling.current = true;
    const i = Math.min(items.length - 1, Math.max(0, Math.round(el.scrollLeft / ITEM_W)));
    setCenter(i);
    // 止まったところで確定（iOS は scrollend が使えないことがあるのでタイマーで判定）
    clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      scrolling.current = false;
      const picked = items[i].id as T;
      if (picked !== latest.current.value) latest.current.onChange(picked);
    }, 120);
  };

  return (
    <div className="relative py-1">
      <div
        ref={ref}
        onScroll={onScroll}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        style={{ paddingInline: `calc(50% - ${ITEM_W / 2}px)` }}
      >
        {items.map((p, i) => {
          const active = i === center;
          return (
            <button
              key={p.id}
              onClick={() => scrollToIndex(i)}
              className="flex h-14 shrink-0 snap-center items-center justify-center"
              style={{ width: ITEM_W }}
              aria-pressed={active}
            >
              <span
                className={`flex h-12 items-center justify-center rounded-2xl font-bold transition-all duration-150 ${
                  active ? 'w-[76px] bg-brand-500 text-xl text-white shadow-md shadow-brand-500/30' : 'w-[68px] text-base text-gray-400'
                }`}
              >
                {p.label}
              </span>
            </button>
          );
        })}
      </div>
      {/* 両端：ふわっと消えるグラデーション＋矢印 */}
      <button
        onClick={() => scrollToIndex(center - 1)}
        disabled={center === 0}
        className="absolute inset-y-0 left-0 flex w-12 items-center justify-start bg-gradient-to-r from-[#f3f5f9] via-[#f3f5f9]/80 to-transparent pl-1 text-brand-500 disabled:text-transparent"
        aria-label="前の部位"
      >
        <ChevronLeft />
      </button>
      <button
        onClick={() => scrollToIndex(center + 1)}
        disabled={center === items.length - 1}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-end bg-gradient-to-l from-[#f3f5f9] via-[#f3f5f9]/80 to-transparent pr-1 text-brand-500 disabled:text-transparent"
        aria-label="次の部位"
      >
        <ChevronRight />
      </button>
    </div>
  );
}
