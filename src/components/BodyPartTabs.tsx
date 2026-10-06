import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { COPIES, midIndex, nearestIndex, realIndex } from '../lib/roll';
import { BODY_PARTS, type BodyPart } from '../types';
import { ChevronLeft, ChevronRight } from './Icons';

type Value = BodyPart | 'all';

/** 1項目の幅(px)。scrollLeft = 仮の位置 × ITEM_W のとき、その項目がちょうど真ん中に来る */
const ITEM_W = 84;

/**
 * 部位の横ロール選択。左右にスワイプして、真ん中で止まった部位が選ばれる。
 * 部位を何周ぶんも並べておき、止まるたびに真ん中の周へこっそり戻すので、
 * どちらへ回しても端に着かず一周し続けられる。
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
  const n = items.length;
  const indexOf = (v: Value) => Math.max(0, items.findIndex((p) => p.id === v));

  const ref = useRef<HTMLDivElement>(null);
  /** 真ん中にある項目の仮の位置 */
  const [center, setCenter] = useState(() => midIndex(indexOf(value), n));
  const centerRef = useRef(center);
  const scrolling = useRef(false);
  const settleTimer = useRef<number | undefined>(undefined);
  const latest = useRef({ value, onChange });
  latest.current = { value, onChange };

  const updateCenter = (v: number) => {
    centerRef.current = v;
    setCenter(v);
  };

  const scrollToVirtual = (v: number, smooth = true) => {
    const clamped = Math.min(n * COPIES - 1, Math.max(0, v));
    ref.current?.scrollTo({ left: clamped * ITEM_W, behavior: smooth ? 'smooth' : 'instant' });
  };

  // 最初は真ん中の周の、選択中の部位に合わせておく
  useLayoutEffect(() => {
    if (ref.current) ref.current.scrollLeft = midIndex(indexOf(value), n) * ITEM_W;
  }, []);

  // ホームの部位チップなど、外から選択が変わったら近い方向へ回す
  useEffect(() => {
    const target = indexOf(value);
    if (scrolling.current || realIndex(centerRef.current, n) === target) return;
    const v = nearestIndex(centerRef.current, target, n);
    updateCenter(v);
    scrollToVirtual(v);
  }, [value]);

  useEffect(() => () => clearTimeout(settleTimer.current), []);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    scrolling.current = true;
    const v = Math.min(n * COPIES - 1, Math.max(0, Math.round(el.scrollLeft / ITEM_W)));
    if (v !== centerRef.current) updateCenter(v);
    // 止まったところで確定（iOS は scrollend が使えないことがあるのでタイマーで判定）
    clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      scrolling.current = false;
      const real = realIndex(v, n);
      // 端の周に近づいていたら、見た目が同じ真ん中の周へ一瞬で戻す
      const home = midIndex(real, n);
      if (v !== home) {
        el.scrollTo({ left: home * ITEM_W, behavior: 'instant' });
        updateCenter(home);
      }
      const picked = items[real].id as T;
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
        {Array.from({ length: COPIES }, (_, copy) =>
          items.map((p, i) => {
            const v = copy * n + i;
            const active = v === center;
            return (
              <button
                key={v}
                onClick={() => scrollToVirtual(v)}
                className="flex h-14 shrink-0 snap-center items-center justify-center"
                style={{ width: ITEM_W }}
                aria-pressed={active}
                aria-label={p.label}
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
          }),
        )}
      </div>
      {/* 両端：ふわっと消えるグラデーション＋矢印 */}
      <button
        onClick={() => scrollToVirtual(centerRef.current - 1)}
        className="absolute inset-y-0 left-0 flex w-12 items-center justify-start bg-gradient-to-r from-[#f3f5f9] via-[#f3f5f9]/80 to-transparent pl-1 text-brand-500"
        aria-label="前の部位"
      >
        <ChevronLeft />
      </button>
      <button
        onClick={() => scrollToVirtual(centerRef.current + 1)}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-end bg-gradient-to-l from-[#f3f5f9] via-[#f3f5f9]/80 to-transparent pr-1 text-brand-500"
        aria-label="次の部位"
      >
        <ChevronRight />
      </button>
    </div>
  );
}
