import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/** ページが入れ替わるときの動き */
const EASE = 'transform 300ms cubic-bezier(0.22, 0.61, 0.36, 1)';
/** これより左右に動かしたら（幅に対する割合）、離したときに隣のページへ */
const COMMIT_RATIO = 0.22;
/** これより速く弾いたら（px/ms）、短くても隣のページへ */
const FLICK_SPEED = 0.35;

type Offset = -1 | 0 | 1;

/**
 * 横にスワイプしてページ（部位や月）を切り替える枠。ロールと同じように、
 * 「前・今・次」の3ページを横につなげて並べ、指で動かすと隣のページがつながったまま見えてくる。
 * - 離したとき、十分動かしたか速く弾いたら、隣のページがそのまま真ん中まで滑ってきて止まる
 *   （少しだけなら元に戻る）。いったん空になる時間はない
 * - 縦の動きのときは横に動かさない（中のスクロールを邪魔しない）
 * - ロールや矢印など外から pageKey が変わったときも、前のページとつながったまま流れてくる
 */
export function SwipePager({
  pageKey,
  direction,
  renderPage,
  onSwipe,
  draggable = true,
  className = '',
}: {
  /** 今のページを表す値（部位や月）。変わるとページが入れ替わる */
  pageKey: string;
  /** 外から切り替わったときの向き（next：右から入る／prev：左から入る） */
  direction: 'next' | 'prev' | null;
  /** -1：前のページ、0：今のページ、1：次のページ の中身 */
  renderPage: (offset: Offset) => ReactNode;
  /** スワイプで次（1）・前（-1）へ進むとき */
  onSwipe?: (dir: 1 | -1) => void;
  /** false なら指で動かせない（切り替わるときの動きだけ） */
  draggable?: boolean;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  /** 今のページの位置からのずれ（px） */
  const [x, setX] = useState(0);
  const [animate, setAnimate] = useState(false);
  const drag = useRef<{ id: number; x0: number; y0: number; lastX: number; lastT: number; v: number; horizontal: boolean | null } | null>(null);
  /** 自分のスワイプで切り替えた直後なら true（つなぎ目なしで位置だけ戻す） */
  const swiped = useRef(false);
  const busy = useRef(false);
  const suppressClick = useRef(false);
  const prevKey = useRef(pageKey);
  const timer = useRef<number | undefined>(undefined);
  const width = () => box.current?.clientWidth ?? 320;

  // ページが入れ替わったとき
  useLayoutEffect(() => {
    if (prevKey.current === pageKey) return;
    prevKey.current = pageKey;
    setAnimate(false);
    if (swiped.current) {
      // 隣のページが真ん中まで来たところで中身を入れ替えたので、位置を戻すだけ（見た目は変わらない）
      swiped.current = false;
      setX(0);
      return;
    }
    // 外から切り替わった：前のページが見えている位置から、新しいページへ流す
    const dir = direction === 'next' ? 1 : direction === 'prev' ? -1 : 0;
    if (!dir) {
      setX(0);
      return;
    }
    setX(dir * width());
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setAnimate(true);
        setX(0);
      }),
    );
  }, [pageKey]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!draggable || busy.current || (e.pointerType === 'mouse' && e.button !== 0)) return;
    if (e.target instanceof Element && e.target.closest('[data-swipe-ignore]')) return;
    drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, lastX: e.clientX, lastT: e.timeStamp, v: 0, horizontal: null };
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
    setX(Math.max(-width(), Math.min(width(), dx)));
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
    busy.current = true;
    setX(-dir * w); // 隣のページが真ん中まで滑ってくる
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      busy.current = false;
      swiped.current = true;
      onSwipe(dir); // 中身を入れ替える（位置は useLayoutEffect で戻す）
    }, 300);
  };

  const offsets: Offset[] = [-1, 0, 1];
  return (
    <div className={`overflow-x-clip ${className}`}>
      <div ref={box} className="relative">
        <div
          className="flex touch-pan-y"
          style={{ transform: `translateX(calc(-100% + ${x}px))`, transition: animate ? EASE : 'none' }}
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
          {offsets.map((o) => (
            <div key={o} className="w-full shrink-0" aria-hidden={o !== 0} inert={o !== 0}>
              {renderPage(o)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
