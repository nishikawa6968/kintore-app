/**
 * 使い方ページのお手本。本物のアプリの部品を使い、指のマークが押したりスワイプしたりする様子を
 * 自動でくり返し再生する（動画の代わり）。画面の動きが変わってもお手本の見た目がずれない。
 */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { BestCard } from '../../components/BestCard';
import { BodyPartTabs } from '../../components/BodyPartTabs';
import { ChevronRight, Plus } from '../../components/Icons';
import { MonthCalendar } from '../../components/MonthCalendar';
import { NumberStepper } from '../../components/NumberStepper';
import { SwipePager } from '../../components/SwipePager';
import { BodyMap } from '../../illustrations/BodyMap';
import { Trophy } from '../../illustrations/Illustrations';
import { fromKey, todayKey, toKey } from '../../lib/date';
import { NEVER_COLOR, RECENCY_GRADIENT, recencyColor } from '../../lib/recency';
import { useSlideDirection } from '../../lib/useSwipe';
import { BODY_PARTS, bodyPartLabel, type BodyPart } from '../../types';
import { addDays } from 'date-fns';

/** ms ごとに 0, 1, 2, … と進む（count で一周） */
function useTicker(count: number, ms: number) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % count), ms);
    return () => clearInterval(t);
  }, [count, ms]);
  return i;
}

/** お手本の枠と説明文 */
function DemoBox({ caption, children }: { caption: ReactNode; children: ReactNode }) {
  return (
    <figure className="rounded-xl bg-[#f3f5f9] p-3">
      <div className="relative">{children}</div>
      <figcaption className="mt-2 text-center text-xs text-gray-500">{caption}</figcaption>
    </figure>
  );
}

/** 指のマーク。x, y は親要素の中の位置（%）。tap なら押す動き、swipe なら左へなぞる動き */
function Finger({ x, y, mode = 'tap' }: { x: number; y: number; mode?: 'tap' | 'swipe' }) {
  return <span className={`demo-finger ${mode === 'tap' ? 'demo-finger-tap' : 'demo-finger-swipe'}`} style={{ left: `${x}%`, top: `${y}%` }} />;
}

/* ---------- 基本の流れ（4コマ） ---------- */

function MiniPhone({ children }: { children: ReactNode }) {
  return <div className="relative mx-auto h-64 w-44 overflow-hidden rounded-2xl border-4 border-gray-800 bg-[#f3f5f9] text-[9px]">{children}</div>;
}
const MiniHeader = ({ title }: { title: string }) => <div className="bg-brand-500 py-1.5 text-center text-[10px] font-bold text-white">{title}</div>;
const MiniButton = ({ children }: { children: ReactNode }) => (
  <div className="flex items-center justify-center gap-0.5 rounded-lg bg-brand-500 py-1.5 text-[9px] font-bold text-white">{children}</div>
);

export function FlowDemo() {
  const step = useTicker(4, 2400);
  const frames = [
    {
      caption: '① ホームの「今日の記録をつける」を押す',
      finger: { x: 50, y: 88 },
      body: (
        <>
          <MiniHeader title="筋トレ記録" />
          <div className="m-2 grid grid-cols-7 gap-0.5 rounded-lg bg-white p-1.5">
            {Array.from({ length: 28 }, (_, i) => (
              <span key={i} className={`h-3 rounded-full ${[3, 8, 12, 17, 22].includes(i) ? 'bg-brand-500' : 'bg-gray-100'}`} />
            ))}
          </div>
          <div className="absolute inset-x-2 bottom-4">
            <MiniButton>
              <Plus width={10} height={10} /> 今日の記録をつける
            </MiniButton>
          </div>
        </>
      ),
    },
    {
      caption: '② その日の画面で「種目を追加」を押す',
      finger: { x: 50, y: 90 },
      body: (
        <>
          <MiniHeader title="10月6日(火)" />
          <p className="mt-16 text-center text-gray-400">この日の記録はまだありません</p>
          <div className="absolute inset-x-2 bottom-3">
            <MiniButton>
              <Plus width={10} height={10} /> 種目を追加
            </MiniButton>
          </div>
        </>
      ),
    },
    {
      caption: '③ 部位を選んで、やった種目を押す',
      finger: { x: 30, y: 26 },
      body: (
        <>
          <MiniHeader title="種目を選択" />
          <p className="px-2 pt-1.5 text-[11px] font-bold text-brand-600">胸</p>
          <div className="grid grid-cols-2 gap-1 px-2 pt-1">
            {['ベンチプレス', 'ダンベルプレス', 'インクライン', 'ダンベルフライ'].map((n) => (
              <div key={n} className="rounded-md bg-white px-1.5 py-2 font-bold shadow-sm">
                {n}
              </div>
            ))}
          </div>
          <BodyMap selected="chest" className="mx-auto mt-2 h-20 w-full" />
          <div className="mx-auto mt-1 w-12 rounded-md bg-brand-500 py-1 text-center font-bold text-white">胸</div>
        </>
      ),
    },
    {
      caption: '④「セットを追加」で、重さと回数を入れる',
      finger: { x: 50, y: 90 },
      body: (
        <>
          <MiniHeader title="ベンチプレス" />
          <div className="m-2 rounded-lg bg-brand-500 px-2 py-1.5 font-bold text-white">自己ベスト 75kg × 6回</div>
          {[1, 2].map((n) => (
            <div key={n} className="mx-2 mb-1 flex items-center gap-1 rounded-md bg-white px-1.5 py-1.5">
              <span className="font-bold text-brand-500">{n}</span>
              <span className="flex-1 rounded bg-gray-50 text-center font-bold">72.5 kg</span>×<span className="flex-1 rounded bg-gray-50 text-center font-bold">5 回</span>
            </div>
          ))}
          <div className="absolute inset-x-2 bottom-3">
            <MiniButton>
              <Plus width={10} height={10} /> セットを追加
            </MiniButton>
          </div>
        </>
      ),
    },
  ];
  const f = frames[step];
  return (
    <DemoBox caption={<span className="font-bold text-gray-700">{f.caption}</span>}>
      <MiniPhone>
        {f.body}
        <Finger x={f.finger.x} y={f.finger.y} />
      </MiniPhone>
      <div className="mt-2 flex justify-center gap-1.5">
        {frames.map((_, i) => (
          <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === step ? 'bg-brand-500' : 'bg-gray-300'}`} />
        ))}
      </div>
    </DemoBox>
  );
}

/* ---------- カレンダーの色 ---------- */

export function CalendarDemo() {
  const today = todayKey();
  const t = fromKey(today);
  const day = (n: number) => toKey(addDays(t, n));
  const marked = new Set([day(-1), day(-4), day(-8)]);
  const trained = new Set([day(-2), day(-6)]);
  return (
    <DemoBox
      caption={
        <span className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-brand-500" />
            選んだ部位をやった日
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-sky-200" />
            ほかの筋トレをした日
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-3 w-3 rounded-full ring-2 ring-today" />
            今日
          </span>
        </span>
      }
    >
      <div className="pointer-events-none">
        <MonthCalendar month={t} onMonthChange={() => {}} marked={marked} trained={trained} today={today} onSelect={() => {}} />
      </div>
    </DemoBox>
  );
}

/* ---------- ALL のときの色分け ---------- */

export function RecencyDemo() {
  const colors: Record<BodyPart, string> = {
    leg: recencyColor(0),
    chest: recencyColor(3),
    shoulder: recencyColor(6),
    back: recencyColor(9),
    arm: recencyColor(30),
    abs: recencyColor(null),
  };
  return (
    <DemoBox
      caption={
        <>
          <span className="inline-flex items-center gap-1.5">
            最近
            <span className="h-2 w-16 rounded-full" style={{ background: RECENCY_GRADIENT }} />
            2週間〜
            <span className="ml-1 h-2 w-2 rounded-full" style={{ background: NEVER_COLOR }} />
            未
          </span>
          <br />
          例：脚＝今日、胸＝3日前、背中＝9日前、腕＝30日前
        </>
      }
    >
      <BodyMap selected="all" allColors={colors} className="mx-auto h-44 w-full" />
    </DemoBox>
  );
}

/* ---------- 人の図のタップ ---------- */

const TAP_STEPS: (BodyPart | null)[] = ['chest', 'shoulder', 'arm', 'leg', null];

export function BodyTapDemo() {
  const step = useTicker(TAP_STEPS.length, 1800);
  const target = TAP_STEPS[step];
  const box = useRef<HTMLDivElement>(null);
  const [finger, setFinger] = useState({ x: 50, y: 10 });
  const [selected, setSelected] = useState<BodyPart | 'all'>('all');
  // 説明文は、指が届いて部位が切り替わったときに一緒に変える
  const [shown, setShown] = useState<BodyPart | null | undefined>(undefined);

  // 指を次の筋肉（null なら筋肉から離れた空いた所）へ動かし、少し遅れてその部位を選ぶ
  useLayoutEffect(() => {
    const el = box.current;
    const svg = el?.querySelector('svg');
    if (!el || !svg) return;
    const rect = el.getBoundingClientRect();
    let x = 50;
    let y = 8;
    const path = target && svg.querySelector<SVGPathElement>(`path[data-part="${target}"]`);
    if (path) {
      const b = path.getBoundingClientRect();
      x = ((b.left + b.width / 2 - rect.left) / rect.width) * 100;
      y = ((b.top + b.height / 2 - rect.top) / rect.height) * 100;
    }
    setFinger({ x, y });
    const t = setTimeout(() => {
      setSelected(target ?? 'all');
      setShown(target);
    }, 500);
    return () => clearTimeout(t);
  }, [target]);

  return (
    <DemoBox
      caption={
        shown === undefined ? (
          '筋肉を押すと、その部位を選べる'
        ) : shown ? (
          <>
            筋肉を押すと<span className="font-bold text-gray-700">{bodyPartLabel(shown)}</span>を選べる
          </>
        ) : (
          <>
            空いた所を押すと<span className="font-bold text-gray-700">ALL</span>（ホームのみ）
          </>
        )
      }
    >
      <div ref={box} className="relative">
        <BodyMap selected={selected} className="mx-auto h-44 w-full" />
        <Finger x={finger.x} y={finger.y} />
      </div>
    </DemoBox>
  );
}

/* ---------- ロール ---------- */

export function RollerDemo() {
  const step = useTicker(BODY_PARTS.length, 2000);
  const part = BODY_PARTS[step].id;
  return (
    <DemoBox caption="なぞって回し、真ん中の部位を選ぶ">
      <div className="pointer-events-none relative">
        <BodyPartTabs value={part} onChange={() => {}} haptics={false} />
        <Finger key={step} x={58} y={50} mode="swipe" />
      </div>
    </DemoBox>
  );
}

/* ---------- 表のスワイプ ---------- */

const SAMPLE: Record<BodyPart, string[]> = {
  shoulder: ['ショルダープレス', 'サイドレイズ', 'リアレイズ'],
  chest: ['ベンチプレス', 'ダンベルプレス', 'ダンベルフライ'],
  arm: ['アームカール', 'ハンマーカール', 'トライセプス'],
  back: ['デッドリフト', 'ラットプルダウン', '懸垂'],
  abs: ['クランチ', 'レッグレイズ', 'プランク'],
  leg: ['スクワット', 'レッグプレス', 'ランニング'],
};

export function SwipeTableDemo({ caption }: { caption: string }) {
  const step = useTicker(BODY_PARTS.length, 2200);
  const part = BODY_PARTS[step].id;
  const slide = useSlideDirection(part);
  return (
    <DemoBox caption={caption}>
      <div className="relative py-1">
        <SwipePager pageKey={part} direction={slide} draggable={false}>
          <div className="rounded-xl bg-white shadow-sm">
            <div className="rounded-t-xl bg-brand-50 px-3 py-1.5 text-[11px] font-bold text-brand-600">{bodyPartLabel(part)}の種目</div>
            {SAMPLE[part].map((n) => (
              <div key={n} className="flex items-center border-t border-gray-100 px-3 py-2 text-sm font-bold text-gray-700">
                <span className="flex-1">{n}</span>
                <ChevronRight className="text-gray-300" width={16} height={16} />
              </div>
            ))}
          </div>
        </SwipePager>
        <Finger key={step} x={60} y={55} mode="swipe" />
      </div>
    </DemoBox>
  );
}

/* ---------- 記録の画面：＋ボタンと自己ベスト更新 ---------- */

export function StepperDemo() {
  const step = useTicker(4, 1100);
  const weight = 60 + step * 2.5;
  return (
    <DemoBox caption="「＋」で重さが増える">
      <div className="relative mx-auto w-48">
        <div className="pointer-events-none">
          <NumberStepper value={weight} step={2.5} unit="kg" decimal onChange={() => {}} />
        </div>
        <Finger x={91} y={50} />
      </div>
    </DemoBox>
  );
}

export function FireDemo() {
  const fire = useTicker(2, 2600) === 1;
  return (
    <DemoBox caption={fire ? '自己ベストを更新すると、赤く燃える' : 'ふだんの自己ベストの欄'}>
      <BestCard
        left={{ label: '自己ベスト', value: fire ? '80kg × 5回' : '75kg × 6回', up: fire }}
        right={{ label: '推定1RM', value: fire ? '93.3kg' : '90kg', up: fire }}
        before={fire ? '75kg×6回' : null}
      />
      <div className="mt-2 flex items-center justify-center gap-1 text-[11px] text-gray-500">
        更新したセットには
        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-400 px-1.5 py-px text-[10px] font-bold text-white">
          <Trophy className="h-2.5 w-2.5" />
          新記録
        </span>
        の印
      </div>
    </DemoBox>
  );
}
