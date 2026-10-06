import { useEffect, useRef, useState } from 'react';
import { BODY_PARTS, type BodyPart } from '../types';

/** これらの上から始めたスワイプは、それぞれの部品の操作なので無視する */
const DEFAULT_IGNORE = '[role="listbox"], [data-swipe-ignore], header, button, input';

/**
 * 画面全体で左右のスワイプを見つけて onSwipe を呼ぶ（種目選択の白い部分）。
 * dir は 1 = 次（指を左へ）、-1 = 前（指を右へ）。縦のスクロールや、ゆっくり・短い動きは無視する。
 * 表やカレンダーのように指についてくる動きにしたい所は SwipePager を使う。
 */
export function useHorizontalSwipe(onSwipe: (dir: 1 | -1) => void, ignore = DEFAULT_IGNORE) {
  const handler = useRef(onSwipe);
  handler.current = onSwipe;

  useEffect(() => {
    const el = window;
    let start: { x: number; y: number; t: number } | null = null;
    const begin = (x: number, y: number, t: EventTarget | null) => {
      start = t instanceof Element && t.closest(ignore) ? null : { x, y, t: Date.now() };
    };
    const end = (x: number, y: number) => {
      if (!start) return;
      const dx = x - start.x;
      const dy = y - start.y;
      const quick = Date.now() - start.t < 800;
      start = null;
      if (!quick || Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      handler.current(dx < 0 ? 1 : -1);
    };
    const onTouchStart = (e: Event) => {
      const t = (e as TouchEvent).touches[0];
      begin(t.clientX, t.clientY, e.target);
    };
    const onTouchEnd = (e: Event) => {
      const t = (e as TouchEvent).changedTouches[0];
      end(t.clientX, t.clientY);
    };
    const onDown = (e: Event) => {
      const p = e as PointerEvent;
      if (p.pointerType === 'mouse') begin(p.clientX, p.clientY, e.target);
    };
    const onUp = (e: Event) => {
      const p = e as PointerEvent;
      if (p.pointerType === 'mouse') end(p.clientX, p.clientY);
    };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointerup', onUp);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointerup', onUp);
    };
  }, [ignore]);
}

/** 部位の並びで、current から dir（1 = 次 / -1 = 前）へ1つ動いた部位（端は反対側へ回り込む） */
export function neighborPart(current: BodyPart, dir: 1 | -1): BodyPart {
  const n = BODY_PARTS.length;
  const i = BODY_PARTS.findIndex((p) => p.id === current);
  return BODY_PARTS[(i + dir + n) % n].id;
}

/**
 * 部位が変わったとき、どちら向きに動いたか（次なら右から、前なら左から入ってくる）を返す。
 * スライドのアニメーションの向きに使う。
 */
export function useSlideDirection(part: BodyPart) {
  const [prev, setPrev] = useState(part);
  const [dir, setDir] = useState<'next' | 'prev' | null>(null);
  if (prev !== part) {
    const n = BODY_PARTS.length;
    const from = BODY_PARTS.findIndex((p) => p.id === prev);
    const to = BODY_PARTS.findIndex((p) => p.id === part);
    setPrev(part);
    setDir((to - from + n) % n <= n / 2 ? 'next' : 'prev');
  }
  return dir;
}
