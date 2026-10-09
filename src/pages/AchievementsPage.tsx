import { Header, Loading, ScrollArea, SubPage } from '../components/Layout';
import { Medal, RARITY_COLORS } from '../components/Medal';
import { needsBodyweight, RARITIES, remainingLabel, type AchievementState, type Rarity } from '../lib/achievements';
import { useAchievements } from '../lib/useAchievements';

/** 解除したメダルの背景（珍しいほど目立つ色） */
const UNLOCKED_BG: Record<Rarity, string> = {
  bronze: 'bg-orange-50/70',
  silver: 'bg-slate-50',
  gold: 'bg-amber-50',
  platinum: 'bg-cyan-50',
  legend: 'bg-gradient-to-b from-fuchsia-50 to-violet-100',
};

/** 実績バッジの一覧。解除したメダルはキランと光り、まだのメダルは暗く鍵付き */
export function AchievementsPage() {
  const states = useAchievements();
  return (
    <SubPage header={<Header title="実績" back="/" />}>
      {!states ? <Loading /> : <AchievementList states={states} />}
    </SubPage>
  );
}

function AchievementList({ states }: { states: AchievementState[] }) {
  const unlocked = states.filter((a) => a.unlocked);
  const groups = [...new Set(states.map((a) => a.group))];
  const count = (r: Rarity) => unlocked.filter((a) => a.rarity === r).length;
  return (
    <ScrollArea className="space-y-3">
      <section
        className="rounded-3xl p-4 text-white shadow-lg shadow-brand-800/30"
        style={{
          background:
            'repeating-linear-gradient(135deg, rgb(255 255 255 / 0.04) 0 10px, transparent 10px 20px), linear-gradient(135deg, #0f3669, #13478e 55%, #1e6fd9)',
        }}
      >
        <div className="text-[10px] font-black tracking-[0.3em] text-sky-200">ACHIEVEMENTS</div>
        <div className="mt-1 flex items-end justify-between">
          <div className="text-4xl font-black tabular-nums">
            {unlocked.length}
            <span className="text-lg font-bold text-white/70"> / {states.length}</span>
          </div>
          <div className="flex gap-1.5 pb-1">
            {RARITIES.map((r) => (
              <span key={r} className="flex items-center gap-1 text-sm font-black tabular-nums">
                <span className="h-3 w-3 rounded-full" style={{ background: `linear-gradient(135deg, ${RARITY_COLORS[r][0]}, ${RARITY_COLORS[r][1]})` }} />
                {count(r)}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500" style={{ width: `${(unlocked.length / states.length) * 100}%` }} />
        </div>
      </section>

      {groups.map((g) => (
        <section key={g} className="rounded-2xl bg-white p-3 shadow-sm">
          <h2 className="mb-2 px-1 font-bold">{g}</h2>
          <div className="grid grid-cols-3 gap-2">
            {states
              .filter((a) => a.group === g)
              .map((a) => (
                <div key={a.id} className={`flex flex-col items-center rounded-xl px-1 py-2 text-center ${a.unlocked ? UNLOCKED_BG[a.rarity] : 'bg-gray-50'}`}>
                  <Medal rarity={a.rarity} label={a.label} size={44} shine={a.unlocked} locked={!a.unlocked} />
                  <div className={`mt-1 text-[12px] leading-tight font-black ${a.unlocked ? 'text-gray-800' : 'text-gray-400'}`}>{a.title}</div>
                  <div className="mt-0.5 text-[10px] leading-tight text-gray-400">{a.desc}</div>
                  {!a.unlocked && (a.target > 1 || needsBodyweight(a)) && (
                    <div className="mt-1 w-full px-1">
                      <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
                        <div className="h-full rounded-full bg-brand-400" style={{ width: `${needsBodyweight(a) ? 0 : Math.min(1, a.value / a.target) * 100}%` }} />
                      </div>
                      <div className="mt-0.5 text-[10px] font-bold text-brand-600 tabular-nums">{remainingLabel(a)}</div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </section>
      ))}
    </ScrollArea>
  );
}
