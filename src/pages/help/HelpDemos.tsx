/**
 * 使い方ページのお手本。本物のアプリの部品を使い、指のマークが押したりスワイプしたりする様子を
 * 自動でくり返し再生する（動画の代わり）。画面の動きが変わってもお手本の見た目がずれない。
 */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { BestCard } from '../../components/BestCard';
import { BodyPartTabs } from '../../components/BodyPartTabs';
import { RecordBadge } from '../../components/RecordBadge';
import { Emblem } from '../../components/Emblem';
import { ChevronRight, Eye, EyeOff, Lock, Plus } from '../../components/Icons';
import { MonthCalendar } from '../../components/MonthCalendar';
import { NumberStepper } from '../../components/NumberStepper';
import { SwipePager } from '../../components/SwipePager';
import { BodyMap } from '../../illustrations/BodyMap';
import { Flame, Sparkle } from '../../illustrations/Illustrations';
import { Medal } from '../../components/Medal';
import { Barbell } from '../../components/PlateView';
import { LEVELS, LEVEL_COLORS } from '../../lib/big3';
import { fmtDuration, fmtKm, fmtPace } from '../../lib/records';
import { RatioBar } from '../Big3Page';
import { fromKey, todayKey, toKey } from '../../lib/date';
import { NEVER_COLOR, RECENCY_GRADIENT, recencyColor } from '../../lib/recency';
import { neighborPart, useSlideDirection } from '../../lib/useSwipe';
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
  const gym = new Set([day(-3)]);
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
            <span className="h-3 w-3 rounded-full bg-pink-400" />
            体操の日
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-3 w-3 rounded-full ring-2 ring-today" />
            今日
          </span>
        </span>
      }
    >
      <div className="pointer-events-none">
        <MonthCalendar month={t} onMonthChange={() => {}} marked={marked} trained={trained} gym={gym} today={today} onSelect={() => {}} />
      </div>
    </DemoBox>
  );
}

/* ---------- ALL のときの色分け ---------- */

export function RecencyDemo() {
  const colors: Record<BodyPart, string> = {
    leg: recencyColor(0),
    chest: recencyColor(2),
    shoulder: recencyColor(4),
    back: recencyColor(5),
    arm: recencyColor(10),
    abs: recencyColor(null),
  };
  return (
    <DemoBox
      caption={
        <>
          <span className="inline-flex items-center gap-1.5">
            最近
            <span className="h-2 w-16 rounded-full" style={{ background: RECENCY_GRADIENT }} />
            1週間〜
            <span className="ml-1 h-2 w-2 rounded-full" style={{ background: NEVER_COLOR }} />
            未
          </span>
          <br />
          例：脚＝今日、胸＝2日前、背中＝5日前、腕＝10日前
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
        <SwipePager
          pageKey={part}
          direction={slide}
          draggable={false}
          renderPage={(o) => {
            const p = o === 0 ? part : neighborPart(part, o);
            return (
              <div className="px-1">
                <div className="rounded-xl bg-white shadow-sm">
                  <div className="rounded-t-xl bg-brand-50 px-3 py-1.5 text-[11px] font-bold text-brand-600">{bodyPartLabel(p)}の種目</div>
                  {SAMPLE[p].map((n) => (
                    <div key={n} className="flex items-center border-t border-gray-100 px-3 py-2 text-sm font-bold text-gray-700">
                      <span className="flex-1">{n}</span>
                      <ChevronRight className="text-gray-300" width={16} height={16} />
                    </div>
                  ))}
                </div>
              </div>
            );
          }}
        />
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

/** 新記録の2種類：同じ重さで回数が増えた・推定1RMだけ → 青く光る／一番重い重さ → 赤く燃える */
export function RecordKindDemo() {
  const step = useTicker(3, 2600);
  const states = [
    {
      caption: 'ふだんの自己ベストの欄',
      left: { label: '自己ベスト', value: '75kg × 6回', up: false },
      right: { label: '推定1RM', value: '90kg', up: false },
      before: null,
      kind: null,
    },
    {
      caption: '同じ重さで回数が増えた・推定1RMが上がった → 青く光る',
      left: { label: '自己ベスト', value: '75kg × 8回', up: false },
      right: { label: '推定1RM', value: '95kg', up: true },
      before: '1RM 90kg',
      kind: 'rm' as const,
    },
    {
      caption: '今までで一番重い重さを持った → 赤く燃える',
      left: { label: '自己ベスト', value: '80kg × 5回', up: true },
      right: { label: '推定1RM', value: '93.3kg', up: true },
      before: '75kg×8回',
      kind: 'weight' as const,
    },
  ];
  const st = states[step];
  return (
    <DemoBox caption={<span className="font-bold text-gray-700">{st.caption}</span>}>
      <BestCard left={st.left} right={st.right} before={st.before} />
      <div className="mt-2 flex h-5 items-center justify-center gap-1 text-[11px] text-gray-500">
        {st.kind ? (
          <>
            そのセットには <RecordBadge kind={st.kind} small /> の印
          </>
        ) : (
          '記録を更新すると…'
        )}
      </div>
    </DemoBox>
  );
}

/* ---------- できること（4つのまとめ） ---------- */

export function OverviewDemo() {
  const colors: Record<BodyPart, string> = {
    leg: recencyColor(0),
    chest: recencyColor(1),
    shoulder: recencyColor(3),
    back: recencyColor(6),
    arm: recencyColor(9),
    abs: recencyColor(null),
  };
  const tiles = [
    {
      title: '毎日の記録',
      body: (
        <div className="w-full space-y-1 px-1">
          {['72.5kg × 5', '72.5kg × 5', '70kg × 6'].map((t, i) => (
            <div key={i} className="flex items-center gap-1 rounded-md bg-white px-1.5 py-1 text-[10px] font-bold shadow-sm">
              <span className="text-brand-500">{i + 1}</span>
              <span className="flex-1 text-center">{t}</span>
            </div>
          ))}
        </div>
      ),
    },
    { title: '部位ごとの間隔', body: <BodyMap selected="all" allColors={colors} className="h-16 w-full" /> },
    {
      title: '自己ベストの更新',
      body: (
        <div className="bg-fire animate-ember flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-black text-white">
          <Flame className="animate-flame h-3.5 w-3.5" />
          本日更新！
        </div>
      ),
    },
    { title: 'BIG3と称号', body: <Emblem tier={2} size={40} glow shine /> },
  ];
  return (
    <DemoBox caption="記録するほど、伸びや弱点が見えてくる">
      <div className="grid grid-cols-2 gap-2">
        {tiles.map((t) => (
          <div key={t.title} className="flex flex-col items-center rounded-xl bg-white p-2 shadow-sm">
            <div className="flex h-20 w-full items-center justify-center">{t.body}</div>
            <div className="mt-1 text-[11px] font-bold text-gray-700">{t.title}</div>
          </div>
        ))}
      </div>
    </DemoBox>
  );
}

/* ---------- 体操の日 ---------- */

export function GymDemo() {
  const on = useTicker(2, 2200) === 1;
  return (
    <DemoBox caption={on ? 'カレンダーがピンクの丸になる' : '「体操をする」を押すと…'}>
      <div className="mx-auto w-56">
        <div className="grid grid-cols-7 gap-1 rounded-xl bg-white p-2 shadow-sm">
          {['日', '月', '火', '水', '木', '金', '土'].map((d) => (
            <span key={d} className="text-center text-[9px] text-gray-400">
              {d}
            </span>
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <span
              key={i}
              className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-colors duration-500 ${
                i === 4 ? (on ? 'bg-pink-400 text-white' : 'ring-2 ring-today') : i === 1 ? 'bg-brand-500 text-white' : 'text-gray-600'
              }`}
            >
              {i + 5}
            </span>
          ))}
        </div>
        <div className="relative mt-2">
          <div className={`rounded-xl py-2 text-center text-xs font-bold transition-colors ${on ? 'bg-pink-100 text-pink-500' : 'bg-pink-400 text-white'}`}>
            {on ? '体操の日（メモを書ける）' : '体操をする'}
          </div>
          {!on && <Finger x={50} y={50} />}
        </div>
      </div>
    </DemoBox>
  );
}

/* ---------- ランニング ---------- */

const RUNS = [
  { km: 3, sec: 17 * 60 },
  { km: 5, sec: 25 * 60 + 30 },
  { km: 10, sec: 55 * 60 },
];

export function RunDemo() {
  const r = RUNS[useTicker(RUNS.length, 2000)];
  return (
    <DemoBox caption="距離と時間を入れると、平均ペースが自動で出る">
      <div className="mx-auto flex w-64 items-center gap-1.5 rounded-xl bg-white p-2.5 shadow-sm">
        <div className="flex-1 rounded-lg bg-gray-50 py-1.5 text-center text-sm font-bold ring-1 ring-gray-200">{fmtKm(r.km)}</div>
        <div className="flex-1 rounded-lg bg-gray-50 py-1.5 text-center text-sm font-bold ring-1 ring-gray-200">{fmtDuration(r.sec)}</div>
        <span className="text-gray-300">→</span>
        <div className="text-center">
          <div className="text-[9px] text-gray-400">平均ペース</div>
          <div className="text-sm font-black text-brand-600 tabular-nums">{fmtPace(r.sec / r.km)}</div>
        </div>
      </div>
    </DemoBox>
  );
}

/* ---------- BIG3 ---------- */

/** ホームの BIG3 ボタン → 体重を入れる → エンブレムでティア表、の流れ */
export function Big3FlowDemo() {
  const step = useTicker(4, 2600);
  const Big3Card = ({ weight }: { weight: boolean }) => (
    <div className="m-2 rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 p-2 text-white">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[8px] opacity-80">BIG3 合計</div>
          <div className="text-base leading-none font-black">300kg</div>
        </div>
        <Emblem tier={weight ? 1 : null} size={22} glow={weight} shine={weight} />
        <div className={`rounded-md px-1.5 py-1 text-[9px] font-bold ${weight ? 'bg-white/20' : 'bg-white/40 ring-2 ring-white'}`}>体重 {weight ? '70' : '--'}kg</div>
      </div>
      <div className="mt-1.5 grid grid-cols-3 gap-1 text-center text-[8px]">
        {[
          ['ベンチ', '72.5'],
          ['スクワット', '97.5'],
          ['デッド', '130'],
        ].map(([n, w]) => (
          <div key={n} className="rounded-md bg-white/15 py-1">
            {n}
            <div className="text-[11px] font-black">{w}kg</div>
          </div>
        ))}
      </div>
    </div>
  );
  const frames = [
    {
      caption: '① ホーム右上の「BIG3」を押す',
      finger: { x: 84, y: 5 },
      body: (
        <>
          <div className="flex items-center bg-brand-500 py-1.5 pr-1.5 pl-10 text-[10px] font-bold text-white">
            <span className="flex-1 text-center">筋トレ記録</span>
            <span className="rounded-full bg-white/25 px-1.5 text-[9px] font-black">BIG3</span>
          </div>
          <div className="m-2 grid grid-cols-7 gap-0.5 rounded-lg bg-white p-1.5">
            {Array.from({ length: 28 }, (_, i) => (
              <span key={i} className={`h-3 rounded-full ${[3, 8, 12, 17, 22].includes(i) ? 'bg-brand-500' : 'bg-gray-100'}`} />
            ))}
          </div>
          <BodyMap selected="all" className="mx-auto h-24 w-full" />
        </>
      ),
    },
    {
      caption: '② 体重を入れる（レベルの判定に使う）',
      finger: { x: 80, y: 18 },
      body: (
        <>
          <MiniHeader title="BIG3" />
          <Big3Card weight={false} />
        </>
      ),
    },
    {
      caption: '③ 今の称号のエンブレムを押すと…',
      finger: { x: 50, y: 17 },
      body: (
        <>
          <MiniHeader title="BIG3" />
          <Big3Card weight />
          <div className="mx-2 space-y-1 rounded-xl bg-white p-2">
            {['ベンチ', 'スクワット', 'デッド'].map((n, i) => (
              <div key={n} className="flex items-center gap-1">
                <span className="w-12 font-bold">{n}</span>
                <span className="h-1.5 flex-1 rounded-full bg-gray-100">
                  <span className="block h-full rounded-full bg-sky-400" style={{ width: `${[45, 55, 50][i]}%` }} />
                </span>
              </div>
            ))}
          </div>
        </>
      ),
    },
    {
      caption: '④ 称号ごとに必要な重さのティア表が開く',
      finger: null,
      body: (
        <>
          <MiniHeader title="称号ティア表" />
          <div className="space-y-1 p-2">
            {[4, 3, 2, 1, 0].map((t) => (
              <div key={t} className="flex items-center gap-1.5 rounded-lg bg-white px-1.5 py-1">
                <Emblem tier={t} size={16} shine={t <= 1} locked={t > 1} />
                <span className={`flex-1 font-black ${t > 1 ? 'text-gray-400' : 'text-gray-700'}`}>{LEVELS[t]}</span>
                <span className="tabular-nums text-gray-500">{[157.5, 245, 332.5, 455, 542.5][t]}kg</span>
              </div>
            ))}
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
        {f.finger && <Finger x={f.finger.x} y={f.finger.y} />}
      </MiniPhone>
      <div className="mt-2 flex justify-center gap-1.5">
        {frames.map((_, i) => (
          <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === step ? 'bg-brand-500' : 'bg-gray-300'}`} />
        ))}
      </div>
    </DemoBox>
  );
}

/** バランス：あなたの割合と目安の 3 : 4 : 5 */
export function BalanceDemo() {
  return (
    <DemoBox caption="目安より少ない種目が「弱め」、多い種目が「強め」">
      <div className="space-y-1.5 rounded-xl bg-white p-3 shadow-sm">
        <RatioBar
          label="あなた"
          parts={[
            { lift: 'bench', share: 30, text: '3.6' },
            { lift: 'squat', share: 28, text: '3.4' },
            { lift: 'deadlift', share: 42, text: '5' },
          ]}
        />
        <RatioBar
          label="目安"
          muted
          parts={[
            { lift: 'bench', share: 25, text: '3' },
            { lift: 'squat', share: 33.3, text: '4' },
            { lift: 'deadlift', share: 41.7, text: '5' },
          ]}
        />
        <div className="flex flex-wrap justify-center gap-1 pt-1 text-[10px] font-bold whitespace-nowrap">
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-brand-600">ベンチ 強め</span>
          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-600">スクワット 弱め</span>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-600">デッド ちょうど良い</span>
        </div>
      </div>
    </DemoBox>
  );
}

/** 称号が D → S へ上がっていく様子。取得した称号は光り、まだの称号は暗く鍵付き */
export function RankDemo() {
  const current = useTicker(5, 1500);
  return (
    <DemoBox
      caption={
        <>
          今の称号：<span className="font-bold" style={{ color: LEVEL_COLORS[current] }}>{LEVELS[current]}</span>（取得した称号は光り、まだの称号は暗い）
        </>
      }
    >
      <div className="flex items-end justify-center gap-2 py-1">
        {LEVELS.map((lv, t) => (
          <div key={lv} className="flex flex-col items-center">
            <Emblem tier={t} size={t === current ? 46 : 36} glow={t === current} shine={t <= current} locked={t > current} />
            <span className={`mt-0.5 text-[9px] font-bold ${t <= current ? 'text-gray-700' : 'text-gray-300'}`}>{lv}</span>
          </div>
        ))}
      </div>
    </DemoBox>
  );
}

/* ---------- 種目の管理 ---------- */

export function ManageDemo() {
  const hidden = useTicker(2, 2000) === 1;
  const rows = [
    { name: 'ベンチプレス', locked: true, hidden: false },
    { name: 'ダンベルプレス', locked: false, hidden: false },
    { name: 'ダンベルフライ', locked: false, hidden },
  ];
  return (
    <DemoBox caption={hidden ? '目のアイコンで隠す（記録は消えない）' : '鍵マークはアプリ固定の種目'}>
      <ul className="relative mx-auto w-64 overflow-hidden rounded-xl bg-white text-sm shadow-sm">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center border-b border-gray-100 py-2 pr-2 pl-3 last:border-0">
            <span className={`flex flex-1 items-center gap-1 ${r.hidden ? 'text-gray-300 line-through' : ''}`}>
              {r.name}
              {r.locked && <Lock width={12} height={12} className="text-gray-300" />}
            </span>
            <span className="text-gray-400">{r.hidden ? <EyeOff width={18} height={18} /> : <Eye width={18} height={18} />}</span>
          </li>
        ))}
        <Finger x={91} y={83} />
      </ul>
    </DemoBox>
  );
}

/* ---------- バックアップ ---------- */

export function BackupDemo() {
  const moved = useTicker(2, 1800) === 1;
  const Phone = ({ label, filled }: { label: string; filled: boolean }) => (
    <div className="flex flex-col items-center">
      <div className="flex h-24 w-14 flex-col overflow-hidden rounded-xl border-4 border-gray-800 bg-[#f3f5f9]">
        <div className="bg-brand-500 py-0.5 text-center text-[7px] font-bold text-white">筋トレ記録</div>
        <div className="grid flex-1 grid-cols-4 content-start gap-0.5 p-1">
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-colors duration-500 ${filled && i % 3 === 0 ? 'bg-brand-500' : 'bg-gray-200'}`} />
          ))}
        </div>
      </div>
      <span className="mt-1 text-[10px] font-bold text-gray-500">{label}</span>
    </div>
  );
  return (
    <DemoBox caption="今の端末で「書き出す」→ 新しい端末で「読み込む」">
      <div className="relative mx-auto flex w-60 items-start justify-between">
        <Phone label="今の端末" filled />
        <div
          className="absolute top-7 flex h-9 w-8 items-center justify-center rounded-md bg-white text-[8px] font-black text-brand-600 shadow ring-1 ring-brand-200 transition-all duration-1000 ease-in-out"
          style={{ left: moved ? 'calc(100% - 6rem)' : '4rem' }}
        >
          JSON
        </div>
        <Phone label="新しい端末" filled={moved} />
      </div>
    </DemoBox>
  );
}

/* ---------- アプリを開き直す ---------- */

export function ReopenDemo() {
  const step = useTicker(3, 1400);
  return (
    <DemoBox caption={['下から上にスワイプしてアプリを閉じる', '完全に閉じたら…', 'ホーム画面のアイコンから開き直す'][step]}>
      <div className="relative mx-auto h-36 w-24 overflow-hidden rounded-2xl border-4 border-gray-800 bg-gray-700">
        <div
          className="absolute inset-2 rounded-xl bg-[#f3f5f9] transition-all duration-700 ease-in-out"
          style={{ transform: step === 1 ? 'translateY(-130%) scale(0.8)' : step === 0 ? 'scale(0.8)' : 'scale(1)', opacity: step === 1 ? 0 : 1 }}
        >
          <div className="rounded-t-xl bg-brand-500 py-1 text-center text-[8px] font-bold text-white">筋トレ記録</div>
        </div>
        {step === 0 && <Finger x={50} y={80} />}
      </div>
    </DemoBox>
  );
}

/* ---------- 次の目標 ---------- */

export function GoalDemo() {
  const step = useTicker(3, 1800);
  return (
    <DemoBox caption={step === 2 ? '押した目標がセットに入る' : step === 1 ? '「青を狙う」を押すと…' : '「炎を狙う」は重さの新記録、「青を狙う」は回数を増やす'}>
      <div className="relative rounded-2xl bg-white px-3 pt-2 pb-3 shadow-sm">
        <div className="mb-1.5 px-1 text-sm font-bold text-gray-700">次の目標</div>
        <div className="flex gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-50 to-red-50 px-2 py-2 ring-1 ring-orange-200">
            <Flame className="animate-flame h-5 w-5 text-orange-500" />
            <span>
              <span className="block text-[10px] font-black text-orange-500">炎を狙う</span>
              <span className="block text-[13px] font-black tracking-tight whitespace-nowrap">82.5kg×1回〜</span>
            </span>
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-50 to-brand-50 px-2 py-2 ring-1 ring-sky-200">
            <Sparkle className="twinkle h-5 w-5 text-sky-500" />
            <span>
              <span className="block text-[10px] font-black text-sky-600">青を狙う</span>
              <span className="block text-[13px] font-black tracking-tight whitespace-nowrap">75kg×10回</span>
            </span>
          </div>
        </div>
        {step === 1 && <Finger x={75} y={68} />}
      </div>
      <div className={`mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all duration-500 ${step === 2 ? 'bg-sky-50 opacity-100' : 'bg-white opacity-30'}`}>
        <span className="font-bold text-sky-500">3</span>
        <span className="flex-1 text-center font-black">75kg × 10回</span>
        <RecordBadge kind="rm" small />
      </div>
    </DemoBox>
  );
}

/* ---------- プレート計算 ---------- */

const PLATE_SAMPLES = [60, 82.5, 100, 140];

export function PlateDemo() {
  const w = PLATE_SAMPLES[useTicker(PLATE_SAMPLES.length, 1800)];
  return (
    <DemoBox caption={`${w}kg（バー20kg）のときに付けるプレート`}>
      <div className="rounded-xl bg-white p-3 shadow-sm">
        <Barbell weight={w} bar={20} />
      </div>
    </DemoBox>
  );
}

/* ---------- 週の目標と連続記録 ---------- */

export function StreakDemo() {
  const step = useTicker(5, 1100);
  const count = Math.min(step, 3);
  const done = count >= 3;
  return (
    <DemoBox caption={done ? '目標を達成すると🔥が付き、連続の週が増える' : 'トレーニングした日が数えられていく'}>
      <div className="flex flex-col items-center gap-3">
        <span
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold tabular-nums transition-colors ${
            done ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm shadow-orange-500/40' : 'bg-white text-gray-600 shadow-sm'
          }`}
        >
          今週 <span className="text-base font-black">{count}</span>/3
          <span className={`flex items-center gap-0.5 ${done ? '' : 'text-orange-500'}`}>
            <Flame className="animate-flame h-4 w-4" />
            {done ? 5 : 4}週
          </span>
        </span>
        <div className="grid w-full grid-cols-8 gap-1.5">
          {Array.from({ length: 8 }, (_, i) => {
            const now = i === 7;
            const achieved = i >= 3 && (!now || done);
            return (
              <div
                key={i}
                className={`flex h-8 items-center justify-center rounded-lg text-xs font-black ${
                  achieved ? 'bg-gradient-to-b from-orange-400 to-red-500 text-white' : now ? 'bg-brand-50 text-brand-600 ring-2 ring-brand-300' : 'bg-gray-100 text-gray-400'
                }`}
              >
                {achieved ? <Flame className="h-4 w-4" /> : now ? count : 1}
              </div>
            );
          })}
        </div>
      </div>
    </DemoBox>
  );
}

/* ---------- 月間レポート ---------- */

export function ReportDemo() {
  const step = useTicker(2, 2200);
  const bars = step ? [16, 20, 4, 16, 10, 19] : [10, 14, 6, 9, 5, 12];
  return (
    <DemoBox caption="カレンダーの「〇年〇月」を押すと、その月のまとめが見られる">
      <div className="space-y-2">
        <div className="rounded-2xl bg-gradient-to-br from-brand-800 to-brand-500 p-3 text-white">
          <div className="text-center text-[9px] font-black tracking-[0.3em] text-sky-200">MONTHLY REPORT</div>
          <div className="mt-1.5 grid grid-cols-3 gap-1.5 text-center">
            {[
              ['トレーニング', step ? '17' : '12', '日'],
              ['新記録', step ? '37' : '21', '回'],
              ['総挙上重量', step ? '32.2' : '24.8', 't'],
            ].map(([l, v, u]) => (
              <div key={l} className="rounded-lg bg-white/10 py-1">
                <div className="text-[9px] opacity-80">{l}</div>
                <div className="text-lg leading-tight font-black">
                  {v}
                  <span className="text-[10px]">{u}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-1 rounded-2xl bg-white p-3 shadow-sm">
          {BODY_PARTS.map((p, i) => (
            <div key={p.id} className="flex items-center gap-2 text-xs">
              <span className="w-7 font-bold text-gray-600">{p.label}</span>
              <div className="h-3 flex-1 overflow-hidden rounded bg-gray-100">
                <div className="h-full rounded bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-700" style={{ width: `${(bars[i] / 20) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </DemoBox>
  );
}

/* ---------- 実績バッジ ---------- */

const DEMO_MEDALS = [
  { rarity: 'bronze' as const, label: '10日', title: '10日の努力' },
  { rarity: 'silver' as const, label: '80', title: 'ベンチ 80kg' },
  { rarity: 'gold' as const, label: '100', title: '100kgクラブ' },
  { rarity: 'legend' as const, label: 'S', title: '称号：エリート' },
];

export function AchievementDemo() {
  const step = useTicker(DEMO_MEDALS.length + 1, 1500);
  const latest = DEMO_MEDALS[step - 1];
  return (
    <DemoBox caption={latest ? <span className="font-bold text-amber-600">実績解除！「{latest.title}」</span> : '条件を満たすと、メダルが解除される'}>
      <div className="flex items-end justify-center gap-3 py-1">
        {DEMO_MEDALS.map((m, i) => (
          <div key={m.title} className="flex flex-col items-center">
            <Medal rarity={m.rarity} label={m.label} size={i < step ? 48 : 42} shine={i < step} locked={i >= step} />
            <span className={`mt-1 text-[10px] font-bold ${i < step ? 'text-gray-700' : 'text-gray-300'}`}>{m.title}</span>
          </div>
        ))}
      </div>
    </DemoBox>
  );
}
