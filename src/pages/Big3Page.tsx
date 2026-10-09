import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Header, Loading, ScrollArea, SubPage } from '../components/Layout';
import { db, setBodyweight } from '../db/db';
import {
  BIG3,
  IDEAL_RATIO,
  LEVELS,
  STANDARDS,
  big3Balance,
  big3Bests,
  levelOf,
  type Balance,
  type Big3Lift,
  type LevelInfo,
} from '../lib/big3';
import { slashDate } from '../lib/date';
import { fmtKg } from '../lib/records';
import { useData } from '../lib/useData';

const LEVEL_COLORS = ['#9ca3af', '#38bdf8', '#1e6fd9', '#8b3aa8', '#f59e0b'];

/** BIG3（ベンチプレス・スクワット・デッドリフト）の記録・バランス・レベル */
export function Big3Page() {
  const data = useData();
  const bodyweight = useLiveQuery(async () => (await db.settings.get('bodyweight'))?.value ?? 0, []);

  const view = useMemo(() => {
    if (!data) return null;
    const bests = big3Bests(data.exercises, data.sets);
    const total = BIG3.reduce((sum, l) => sum + (bests[l.id]?.weight ?? 0), 0);
    return { bests, total, balance: big3Balance(bests), complete: BIG3.every((l) => bests[l.id]) };
  }, [data]);

  return (
    <SubPage header={<Header title="BIG3" back="/" />}>
      {!view || bodyweight === undefined ? (
        <Loading />
      ) : (
        <ScrollArea className="space-y-3">
          {/* 合計と各種目の一番重い記録 */}
          <section className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-400 p-4 text-white shadow-sm">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xs font-bold opacity-80">BIG3 合計</div>
                <div className="text-4xl font-black tabular-nums">
                  {fmtKg(view.total)}
                  <span className="ml-0.5 text-lg font-bold">kg</span>
                </div>
              </div>
              <BodyweightInput value={bodyweight} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {BIG3.map((l) => {
                const b = view.bests[l.id];
                return (
                  <div key={l.id} className="rounded-xl bg-white/15 px-2 py-2 text-center">
                    <div className="text-[11px] font-bold opacity-90">{l.name}</div>
                    <div className="text-xl font-black tabular-nums">{b ? `${fmtKg(b.weight)}kg` : '—'}</div>
                    <div className="text-[11px] leading-tight tabular-nums opacity-85">{b ? `${b.reps}回` : '未記録'}</div>
                    {b && <div className="text-[10px] leading-tight tabular-nums opacity-70">{slashDate(b.date)}</div>}
                  </div>
                );
              })}
            </div>
          </section>

          <BalanceCard balance={view.balance} />

          <LevelCard bests={view.bests} total={view.complete ? view.total : 0} bodyweight={bodyweight} />

          <p className="px-1 text-[11px] leading-relaxed text-gray-400">
            記録は回数を問わず持ち上げた一番重い重さ。レベルは成人男性の一般的な目安（体重の何倍を1回挙げられるか）です。
          </p>
        </ScrollArea>
      )}
    </SubPage>
  );
}

/** 体重の入力（入れると、すぐ保存してレベルを出す） */
function BodyweightInput({ value }: { value: number }) {
  const [text, setText] = useState(value ? fmtKg(value) : '');
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setText(value ? fmtKg(value) : '');
  }, [value]);
  return (
    <label className="flex items-baseline gap-1 rounded-xl bg-white/20 px-3 py-1.5">
      <span className="text-xs font-bold opacity-90">体重</span>
      <input
        value={text}
        inputMode="decimal"
        placeholder="入力"
        onFocus={(e) => {
          focused.current = true;
          e.target.select();
        }}
        onBlur={() => {
          focused.current = false;
          setText(value ? fmtKg(value) : '');
        }}
        onChange={(e) => {
          const t = e.target.value.replace(/[^\d.]/g, '');
          setText(t);
          const n = parseFloat(t);
          setBodyweight(Number.isNaN(n) ? 0 : n);
        }}
        className="w-14 bg-transparent text-right text-xl font-black tabular-nums text-white outline-none placeholder:text-base placeholder:font-bold placeholder:text-white/60"
      />
      <span className="text-xs font-bold opacity-90">kg</span>
    </label>
  );
}

const BALANCE_LABEL: Record<Balance, { text: string; className: string }> = {
  strong: { text: '強め', className: 'bg-brand-50 text-brand-600' },
  weak: { text: '弱め', className: 'bg-rose-50 text-rose-600' },
  even: { text: 'ちょうど良い', className: 'bg-emerald-50 text-emerald-600' },
};

/** ベンチ : スクワット : デッドリフト の割合を、目安の 3 : 4 : 5 と比べる */
function BalanceCard({ balance }: { balance: ReturnType<typeof big3Balance> }) {
  if (!balance) {
    return (
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-bold">バランス</h2>
        <p className="mt-2 text-sm text-gray-500">3種目すべてを記録すると、バランスが分かります。</p>
      </section>
    );
  }
  const weak = balance.filter((r) => r.balance === 'weak').sort((a, b) => a.share - a.ideal - (b.share - b.ideal));
  const strong = balance.filter((r) => r.balance === 'strong');
  const name = (id: Big3Lift) => BIG3.find((l) => l.id === id)!.name;
  const comment = weak.length
    ? `${weak.map((r) => name(r.lift)).join('と')}を伸ばすと、バランスが良くなります。`
    : strong.length
      ? `${strong.map((r) => name(r.lift)).join('と')}が得意です。ほかの種目も伸ばしていきましょう。`
      : '理想的なバランスです！';

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h2 className="font-bold">バランス</h2>
        <span className="text-[11px] text-gray-400">ベンチ : スクワット : デッド</span>
      </div>

      {/* 割合の帯：上があなた、下が目安 */}
      <div className="mt-3 space-y-1.5">
        <RatioBar label="あなた" parts={balance.map((r) => ({ lift: r.lift, share: r.share, text: fmtRatio(r.ratio) }))} />
        <RatioBar label="目安" muted parts={balance.map((r) => ({ lift: r.lift, share: r.ideal, text: String(IDEAL_RATIO[r.lift]) }))} />
      </div>

      <div className="mt-3 divide-y divide-gray-100">
        {balance.map((r) => {
          const l = BIG3.find((x) => x.id === r.lift)!;
          const label = BALANCE_LABEL[r.balance];
          return (
            <div key={r.lift} className="flex items-center gap-2 py-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: l.color }} />
              <span className="flex-1 text-sm font-bold">{l.name}</span>
              <span className="text-xs tabular-nums text-gray-500">
                {Math.round(r.share)}%<span className="text-gray-300">（目安 {Math.round(r.ideal)}%）</span>
              </span>
              <span className={`w-[5.5rem] rounded-full py-0.5 text-center text-xs font-bold ${label.className}`}>{label.text}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-1 rounded-xl bg-brand-50 px-3 py-2 text-sm font-bold text-brand-700">{comment}</p>
    </section>
  );
}

const fmtRatio = (n: number) => n.toFixed(1).replace(/\.0$/, '');

function RatioBar({ label, parts, muted = false }: { label: string; parts: { lift: Big3Lift; share: number; text: string }[]; muted?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-10 shrink-0 text-[11px] font-bold text-gray-500">{label}</span>
      <div className={`flex flex-1 overflow-hidden rounded-lg ${muted ? 'h-5 opacity-45' : 'h-7'}`}>
        {parts.map((p) => (
          <div
            key={p.lift}
            className="flex items-center justify-center text-xs font-black text-white tabular-nums"
            style={{ width: `${p.share}%`, background: BIG3.find((l) => l.id === p.lift)!.color }}
          >
            {p.text}
          </div>
        ))}
      </div>
    </div>
  );
}

/** 体重から、種目ごと・合計のレベル（初心者〜エリート）を出す */
function LevelCard({ bests, total, bodyweight }: { bests: ReturnType<typeof big3Bests>; total: number; bodyweight: number }) {
  if (!bodyweight) {
    return (
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-bold">レベル</h2>
        <p className="mt-2 text-sm text-gray-500">上の「体重」を入れると、初心者〜エリートのどのレベルかが分かります。</p>
      </section>
    );
  }
  const rows: { key: Big3Lift | 'total'; name: string; weight: number }[] = [
    ...BIG3.map((l) => ({ key: l.id, name: l.name, weight: bests[l.id]?.weight ?? 0 })),
    { key: 'total' as const, name: 'BIG3 合計', weight: total },
  ];
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="font-bold">レベル</h2>
      <div className="mt-1 divide-y divide-gray-100">
        {rows.map((r) => (
          <LevelRow key={r.key} kind={r.key} name={r.name} info={r.weight > 0 ? levelOf(r.key, r.weight, bodyweight) : null} />
        ))}
      </div>
    </section>
  );
}

function LevelRow({ kind, name, info }: { kind: Big3Lift | 'total'; name: string; info: LevelInfo | null }) {
  const std = STANDARDS[kind];
  return (
    <div className={`py-2.5 ${kind === 'total' ? 'mt-1' : ''}`}>
      <div className="flex items-center gap-2">
        <span className={`flex-1 text-sm font-bold ${kind === 'total' ? 'text-brand-700' : ''}`}>{name}</span>
        {info ? (
          <>
            <span className="text-xs tabular-nums text-gray-500">体重の{info.multiple.toFixed(2)}倍</span>
            <span className="w-[4.5rem] rounded-full py-0.5 text-center text-xs font-black text-white" style={{ background: LEVEL_COLORS[info.index] }}>
              {info.level}
            </span>
          </>
        ) : (
          <span className="text-xs text-gray-400">{kind === 'total' ? '3種目そろうと出ます' : '未記録'}</span>
        )}
      </div>
      {/* 5段階の目盛り。届いた段は塗り、今の段は次の段までの進み具合だけ塗る */}
      <div className="mt-1.5 grid grid-cols-5 gap-0.5">
        {LEVELS.map((lv, i) => {
          const lower = i === 0 ? 0 : std[i];
          const upper = std[i + 1];
          let fill = 0;
          if (info) {
            if (info.multiple >= (upper ?? Infinity) || (upper === undefined && info.multiple >= lower)) fill = 1;
            else if (info.multiple > lower) fill = (info.multiple - lower) / (upper - lower);
          }
          return (
            <div key={lv}>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full" style={{ width: `${Math.min(1, fill) * 100}%`, background: LEVEL_COLORS[i] }} />
              </div>
              <div className={`mt-0.5 text-center text-[9px] ${info?.index === i ? 'font-black text-gray-700' : 'text-gray-400'}`}>{lv}</div>
            </div>
          );
        })}
      </div>
      {info?.next && (
        <div className="mt-0.5 text-right text-[11px] text-gray-500">
          あと <span className="font-bold text-brand-600">{fmtKg(info.next.remaining)}kg</span> で{info.next.level}
        </div>
      )}
    </div>
  );
}
