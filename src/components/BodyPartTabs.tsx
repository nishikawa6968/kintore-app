import { useEffect, useRef, useState } from 'react';
import { tick } from '../lib/haptics';
import { flingDuration, flingTarget, nearestIndex, realIndex } from '../lib/roll';
import { BODY_PARTS, type BodyPart } from '../types';
import { ChevronLeft, ChevronRight } from './Icons';

type Value = BodyPart | 'all';

/** 1項目の幅(px) */
const ITEM_W = 84;
/** 真ん中から左右に何個まで描くか */
const SIDE = 4;
/** これ以上指が動いたらタップではなくスワイプ(px) */
const TAP_SLOP = 6;

interface Drag {
  pointerId: number;
  startX: number;
  startPos: number;
  lastX: number;
  lastT: number;
  /** 速さ（項目/ms）。位置が増える向きが正 */
  v: number;
  moved: boolean;
  /** タップされた項目の位置（スワイプなら使わない） */
  tapped: number | null;
}

/**
 * 部位の横ロール選択。指で回すと慣性で滑り、真ん中で止まった部位が選ばれる。
 * 位置は小数で持ち、表示は真ん中の前後だけを都度描くので、端のない無限ロールになる。
 * 部位名のタップ、両端の矢印、左右キーでも切り替えられる。
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

  const [pos, setPos] = useState(() => indexOf(value));
  const posRef = useRef(pos);
  /** 今向かっている（または止まっている）項目の位置 */
  const target = useRef(pos);
  const frame = useRef<number | null>(null);
  const drag = useRef<Drag | null>(null);
  const wheelTimer = useRef<number | undefined>(undefined);
  const latest = useRef({ value, onChange });
  latest.current = { value, onChange };

  /** 位置を動かす。真ん中の部位が切り替わったら軽く振動 */
  const moveTo = (p: number) => {
    if (Math.round(p) !== Math.round(posRef.current)) tick();
    posRef.current = p;
    setPos(p);
  };

  const stop = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  };

  const commit = (k: number) => {
    const picked = items[realIndex(k, n)].id as T;
    if (picked !== latest.current.value) latest.current.onChange(picked);
  };

  /** k 番目へ、だんだんゆっくりになる動きで回して止める */
  const animateTo = (k: number, duration = flingDuration(k - posRef.current, 0)) => {
    stop();
    target.current = k;
    const from = posRef.current;
    const dist = k - from;
    if (duration <= 0) {
      moveTo(k);
      commit(k);
      return;
    }
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      moveTo(from + dist * (1 - Math.pow(1 - t, 3)));
      if (t < 1) frame.current = requestAnimationFrame(step);
      else {
        frame.current = null;
        commit(k);
      }
    };
    frame.current = requestAnimationFrame(step);
  };

  // ホームの部位チップなど、外から選択が変わったら近い方向へ回す
  useEffect(() => {
    const t = indexOf(value);
    if (drag.current || realIndex(target.current, n) === t) return;
    animateTo(nearestIndex(target.current, t, n));
  }, [value]);

  useEffect(
    () => () => {
      stop();
      clearTimeout(wheelTimer.current);
    },
    [],
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    stop();
    try {
      // ロールの外まで指が出ても追いかける
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // キャプチャできない環境でもロールは動かせる
    }
    const slot = (e.target as Element).closest('[data-k]');
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startPos: posRef.current,
      lastX: e.clientX,
      lastT: e.timeStamp,
      v: 0,
      moved: false,
      tapped: slot ? Number(slot.getAttribute('data-k')) : null,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    if (Math.abs(e.clientX - d.startX) > TAP_SLOP) d.moved = true;
    const dt = e.timeStamp - d.lastT;
    if (dt > 0) {
      const instant = -(e.clientX - d.lastX) / ITEM_W / dt;
      d.v = 0.7 * instant + 0.3 * d.v; // 直近の動きを重視してならす
    }
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;
    moveTo(d.startPos - (e.clientX - d.startX) / ITEM_W);
  };

  const release = (e: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    drag.current = null;
    if (!d.moved && !cancelled && d.tapped !== null) {
      animateTo(d.tapped);
      return;
    }
    // 指を止めてから離したときは滑らせない
    const v = e.timeStamp - d.lastT > 80 || cancelled ? 0 : d.v;
    const k = flingTarget(posRef.current, v);
    animateTo(k, flingDuration(k - posRef.current, v));
  };

  // パソコンのトラックパッドで横スクロールしたとき
  const onWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    stop();
    moveTo(posRef.current + e.deltaX / ITEM_W);
    clearTimeout(wheelTimer.current);
    wheelTimer.current = window.setTimeout(() => animateTo(Math.round(posRef.current)), 120);
  };

  const center = Math.round(pos);
  const slots: number[] = [];
  for (let k = center - SIDE; k <= center + SIDE; k++) slots.push(k);

  return (
    <div className="relative py-1">
      <div
        role="listbox"
        aria-label="部位"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') animateTo(target.current - 1);
          if (e.key === 'ArrowRight') animateTo(target.current + 1);
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => release(e, false)}
        onPointerCancel={(e) => release(e, true)}
        onWheel={onWheel}
        className="relative h-14 touch-pan-y overflow-hidden outline-none select-none"
      >
        {slots.map((k) => {
          const offset = k - pos;
          const dist = Math.min(Math.abs(offset), 3);
          const active = k === center;
          const item = items[realIndex(k, n)];
          return (
            <div
              key={k}
              data-k={k}
              role="option"
              aria-selected={active}
              className="absolute top-0 left-1/2 flex h-14 items-center justify-center"
              style={{
                width: ITEM_W,
                transform: `translateX(${offset * ITEM_W - ITEM_W / 2}px) scale(${1 - dist * 0.07})`,
                opacity: 1 - dist * 0.18,
              }}
            >
              <span
                className={`flex h-12 items-center justify-center rounded-2xl font-bold transition-colors duration-150 ${
                  active ? 'w-[76px] bg-brand-500 text-xl text-white shadow-md shadow-brand-500/30' : 'w-[68px] text-base text-gray-400'
                }`}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
      {/* 両端：ふわっと消えるグラデーション＋矢印 */}
      <button
        onClick={() => animateTo(target.current - 1)}
        className="absolute inset-y-0 left-0 flex w-12 items-center justify-start bg-gradient-to-r from-[#f3f5f9] via-[#f3f5f9]/80 to-transparent pl-1 text-brand-500"
        aria-label="前の部位"
      >
        <ChevronLeft />
      </button>
      <button
        onClick={() => animateTo(target.current + 1)}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-end bg-gradient-to-l from-[#f3f5f9] via-[#f3f5f9]/80 to-transparent pr-1 text-brand-500"
        aria-label="次の部位"
      >
        <ChevronRight />
      </button>
    </div>
  );
}
