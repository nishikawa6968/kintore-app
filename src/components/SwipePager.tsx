import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/** ページが入れ替わるときの動き */
const EASE = 'transform 280ms cubic-bezier(0.22, 0.61, 0.36, 1)';
/** これより左右に動かしたら（幅に対する割合）、離したときに次のページへ */
const COMMIT_RATIO = 0.22;
/** これより速く弾いたら（px/ms）、短くても次のページへ */
const FLICK_SPEED = 0.35;

/**
 * 横にスワイプしてページ（部位や月）を切り替える枠。
 * - 指を動かしているあいだは中身が指についてくる
 * - 離したとき、十分動かしたか速く弾いたら、今のページが出ていき、反対側から次のページが入ってくる
 *   （少しだけなら元の位置に戻る）
 * - 縦の動きのときは横に動かさない（中のスクロールを邪魔しない）
 * - ロールなど外から pageKey が変わったときも、direction の向きから滑らかに入ってくる
 */
export function SwipePager({
  pageKey,
  direction,
  onSwipe,
  draggable = true,
  className = '',
  children,
}: {
  /** ページを表す値（部位や月）。変わるとページが入れ替わる */
  pageKey: string;
  /** 外から切り替わったときの向き（next：右から入る／prev：左から入る） */
  direction: 'next' | 'prev' | null;
  /** スワイプで次（1）・前（-1）へ進むとき */
  onSwipe?: (dir: 1 | -1) => void;
  /** false なら指で動かせない（切り替わるときの動きだけ） */
  draggable?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [x, setX] = useState(0);
  const [animate, setAnimate] = useState(false);
  const drag = useRef<{ id: number; x0: number; y0: number; t0: number; lastX: number; lastT: number; v: number; horizontal: boolean | null } | null>(null);
  /** 自分のスワイプで切り替えた直後なら、その向き */
  const swiped = useRef<1 | -1 | null>(null);
  const suppressClick = useRef(false);
  const prevKey = useRef(pageKey);
  const timer = useRef<number | undefined>(undefined);
  const width = () => box.current?.clientWidth ?? 320;

  /** 画面の外（from）から真ん中へ、滑らかに入ってくる */
  const enterFrom = (from: number) => {
    setAnimate(false);
    setX(from);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setAnimate(true);
        setX(0);
      }),
    );
  };

  // ページが入れ替わったら、入ってくる動きをする
  useLayoutEffect(() => {
    if (prevKey.current === pageKey) return;
    prevKey.current = pageKey;
    const dir = swiped.current ?? (direction === 'next' ? 1 : direction === 'prev' ? -1 : 0);
    swiped.current = null;
    if (dir) enterFrom(dir * width());
  }, [pageKey]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!draggable || (e.pointerType === 'mouse' && e.button !== 0)) return;
    if (e.target instanceof Element && e.target.closest('[data-swipe-ignore]')) return;
    drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: e.timeStamp, lastX: e.clientX, lastT: e.timeStamp, v: 0, horizontal: null };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (d.horizontal === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      d.horizontal = Math.abs(dx) > Math.abs(dy);
      if (!d.horizontal) {
        drag.current = null; // 縦の動きは中のスクロールに任せる
        return;
      }
      try {
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
      } catch {
        // キャプチャできなくても動かせる
      }
      setAnimate(false);
    }
    const dt = e.timeStamp - d.lastT;
    if (dt > 0) d.v = 0.7 * ((e.clientX - d.lastX) / dt) + 0.3 * d.v;
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;
    setX(dx);
  };

  const onPointerEnd = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.id !== e.pointerId || !d.horizontal) return;
    // 横に動かした後の「押した」扱いを止める（タップが来なかったときのため、少したったら解除）
    suppressClick.current = true;
    window.setTimeout(() => (suppressClick.current = false), 350);
    const dx = e.clientX - d.x0;
    const w = width();
    const v = e.timeStamp - d.lastT > 80 ? 0 : d.v;
    const commit = e.type === 'pointerup' && (Math.abs(dx) > w * COMMIT_RATIO || (Math.abs(v) > FLICK_SPEED && Math.sign(v) === Math.sign(dx)));
    setAnimate(true);
    if (!commit || !onSwipe) {
      setX(0);
      return;
    }
    const dir: 1 | -1 = dx < 0 ? 1 : -1;
    setX(-dir * w); // 今のページが出ていく
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      swiped.current = dir;
      onSwipe(dir); // 次のページに入れ替わる（入ってくる動きは useLayoutEffect）
    }, 200);
  };

  return (
    <div className={`overflow-x-clip ${className}`}>
      <div
        ref={box}
        className="touch-pan-y"
        style={{ transform: `translateX(${x}px)`, transition: animate ? EASE : 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onClickCapture={(e) => {
          if (suppressClick.current) {
            e.preventDefault();
            e.stopPropagation();
            suppressClick.current = false;
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
