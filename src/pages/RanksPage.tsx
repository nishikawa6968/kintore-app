import { Link } from 'react-router-dom';
import { Emblem } from '../components/Emblem';
import { ChevronRight } from '../components/Icons';
import { Header, Loading, ScrollArea, SubPage } from '../components/Layout';
import { BodyMap } from '../illustrations/BodyMap';
import { LEVEL_COLORS, LEVELS } from '../lib/big3';
import { nextTarget, valueLabel, type ExerciseRank } from '../lib/ranks';
import { standardFor } from '../lib/standards';
import { useRanks } from '../lib/useRanks';
import { BODY_PARTS, type BodyPart, type Exercise } from '../types';
import { LIGHT_COLORS } from './Big3TiersPage';

/** ランクのない部位の色（人の図） */
const NO_RANK = '#cbd5e1';

/** 種目ごとのランク。人の図は部位のランクの色で塗る（その部位で一番ランクの高い種目） */
export function RanksPage() {
  const view = useRanks();
  return (
    <SubPage header={<Header title="ランク" back="/records" />}>
      {!view ? (
        <Loading />
      ) : (
        <ScrollArea className="space-y-3">
          <section
            className="rounded-3xl p-4 text-white shadow-lg shadow-brand-800/30"
            style={{
              background:
                'repeating-linear-gradient(135deg, rgb(255 255 255 / 0.04) 0 10px, transparent 10px 20px), linear-gradient(135deg, var(--color-brand-800), var(--color-brand-700) 55%, var(--color-brand-500))',
            }}
          >
            <div className="text-[10px] font-black tracking-[0.3em] text-brand-200">BODY RANK</div>
            <BodyMap
              selected="all"
              // 暗い背景でも見やすいよう、明るめのランクの色で塗る
              allColors={Object.fromEntries(BODY_PARTS.map((p) => [p.id, view.parts[p.id] === null ? NO_RANK : LIGHT_COLORS[view.parts[p.id]!]]))}
              className="mx-auto mt-1 h-52 w-full"
            />
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {BODY_PARTS.map((p) => {
                const idx = view.parts[p.id];
                return (
                  <button
                    key={p.id}
                    onClick={() => document.getElementById(`part-${p.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    className="flex items-center gap-1.5 rounded-xl bg-white/10 px-2 py-1.5 text-left active:bg-white/20"
                  >
                    <Emblem tier={idx} size={22} shine={idx !== null} />
                    <span className="min-w-0">
                      <span className="block text-[10px] font-bold text-white/80">{p.label}</span>
                      <span className="block truncate text-xs font-black" style={{ color: idx === null ? '#cbd5e1' : LIGHT_COLORS[idx] }}>
                        {idx === null ? '—' : LEVELS[idx]}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {BODY_PARTS.map((p) => (
            <PartSection
              key={p.id}
              part={p.id}
              label={p.label}
              ranks={view.ranks.filter((r) => r.exercise.bodyPart === p.id)}
              others={view.data.exercises.filter((e) => e.bodyPart === p.id && !e.archived && !standardFor(e))}
              bodyweight={view.bodyweight}
            />
          ))}
          <p className="px-1 text-[11px] leading-relaxed text-gray-400">
            ランクは成人男性の一般的な目安をもとにした、おおまかな値です。重さは、ほかの回数のセットも基準の回数に換算してくらべます。
          </p>
        </ScrollArea>
      )}
    </SubPage>
  );
}

function PartSection({ part, label, ranks, others, bodyweight }: { part: BodyPart; label: string; ranks: ExerciseRank[]; others: Exercise[]; bodyweight: number }) {
  if (!ranks.length && !others.length) return null;
  return (
    <section id={`part-${part}`} className="scroll-mt-4 overflow-hidden rounded-2xl bg-white shadow-sm">
      <h2 className="border-b border-gray-100 px-4 py-2.5 font-bold">{label}</h2>
      <ul className="divide-y divide-gray-100">
        {ranks.map((r) => (
          <RankRow key={r.exercise.id} r={r} bodyweight={bodyweight} />
        ))}
        {others.map((e) => (
          <li key={e.id} className="flex items-center gap-3 px-4 py-2.5 text-gray-400">
            <span className="w-[30px]" />
            <span className="flex-1 truncate text-sm font-bold">{e.name}</span>
            <span className="text-[11px]">ランクの基準なし</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RankRow({ r, bodyweight }: { r: ExerciseRank; bodyweight: number }) {
  const next = nextTarget(r);
  const color = r.index === null ? undefined : LEVEL_COLORS[r.index];
  return (
    <li>
      <Link to={`/ranks/${r.exercise.id}`} className="flex items-center gap-3 px-4 py-2.5 active:bg-gray-50">
        <Emblem tier={r.index} size={30} shine={r.index !== null} locked={r.index === null && r.value !== null} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="truncate text-sm font-bold">{r.exercise.name}</span>
            {r.index !== null && (
              <span className="shrink-0 text-xs font-black" style={{ color }}>
                {LEVELS[r.index]}
              </span>
            )}
          </div>
          {r.index !== null ? (
            <>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full" style={{ width: `${r.progress * 100}%`, background: next ? LEVEL_COLORS[next.index] : color }} />
              </div>
              <div className="mt-0.5 flex justify-between text-[10px] tabular-nums text-gray-400">
                <span>{valueLabel(r)}</span>
                <span className="font-bold text-gray-500">{next ? `次：${next.label}` : '最高ランク！'}</span>
              </div>
            </>
          ) : (
            <div className="text-[11px] text-gray-400">
              {r.std.kind === 'big3' && bodyweight <= 0 ? 'BIG3 の画面で体重を入れるとランクが出ます' : '記録するとランクが出ます'}
            </div>
          )}
        </div>
        <ChevronRight className="shrink-0 text-gray-300" width={18} height={18} />
      </Link>
    </li>
  );
}
