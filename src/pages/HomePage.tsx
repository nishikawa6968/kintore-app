import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BodyPartTabs } from '../components/BodyPartTabs';
import { Plus } from '../components/Icons';
import { Header, Loading, PrimaryButton, TabPage } from '../components/Layout';
import { MonthCalendar } from '../components/MonthCalendar';
import { BodyMap } from '../illustrations/BodyMap';
import { daysAgoLabel, daysSince, fromKey, slashDate, todayKey } from '../lib/date';
import { NEVER_COLOR, RECENCY_GRADIENT, recencyColor } from '../lib/recency';
import { lastTrainedByPart, partsByDate } from '../lib/records';
import { useData } from '../lib/useData';
import { BODY_PARTS, bodyPartLabel, type BodyPart } from '../types';

export function HomePage() {
  const data = useData();
  const navigate = useNavigate();
  const today = todayKey();
  const [filter, setFilter] = useState<BodyPart | 'all'>('all');
  const [month, setMonth] = useState(() => fromKey(today));

  const { last, marked, trained, gym, recency } = useMemo(() => {
    if (!data) return { last: undefined, marked: new Set<string>(), trained: new Set<string>(), gym: new Set<string>(), recency: {} };
    const byDate = partsByDate(data.sets, data.exercises);
    const marked = new Set([...byDate].filter(([, parts]) => filter === 'all' || parts.has(filter)).map(([d]) => d));
    const lastByPart = lastTrainedByPart(data.sets, data.exercises);
    const last = filter === 'all' ? [...lastByPart.values()].sort().at(-1) : lastByPart.get(filter);
    // ALL のときの図の色：最後に鍛えた日が近い部位ほど赤、前ほど青みがかり、1週間〜は暗い紺色（記録なしはグレー）
    const recency = Object.fromEntries(BODY_PARTS.map((p) => [p.id, recencyColor(lastByPart.has(p.id) ? daysSince(lastByPart.get(p.id)!, today) : null)]));
    return { last, marked, trained: new Set(byDate.keys()), gym: new Set(data.days.filter((d) => d.kind === 'gymnastics').map((d) => d.date)), recency };
  }, [data, filter, today]);

  return (
    <TabPage
      header={
        <Header
          title="筋トレ記録"
          right={
            <button onClick={() => navigate('/big3')} className="mr-1 rounded-full bg-white/20 px-3 py-1 text-sm font-black tracking-wide active:bg-white/35">
              BIG3
            </button>
          }
        />
      }
    >
      {!data ? (
        <Loading />
      ) : (
        <>
          {/* 画面の高さぴったりに並べ、残った高さはすべて人の図に使う（画面が大きいほど図も大きくなる） */}
            <section className="shrink-0 px-4 pt-3">
              <MonthCalendar month={month} onMonthChange={setMonth} marked={marked} trained={trained} gym={gym} today={today} onSelect={(d) => navigate(`/day/${d}`)} />
            </section>

            {/* 選んでいる部位の最終トレーニング → 人の図 → ロール（親指の届く下の方に） */}
            <p className="mt-3 shrink-0 text-center text-sm text-gray-500">
              {filter !== 'all' && <span className="font-bold text-gray-700">{bodyPartLabel(filter)}の</span>}
              最終トレーニング：
              <span className="font-bold text-brand-600">{last ? `${daysAgoLabel(last)}（${slashDate(last)}）` : '記録なし'}</span>
            </p>
            {/* 筋肉のまわりはその部位、それ以外の空いた所をタップすると ALL */}
            <div className="relative min-h-0 flex-1 px-4 py-1" onClick={() => setFilter('all')}>
              <BodyMap selected={filter} onSelect={setFilter} allColors={recency} className="h-full w-full" />
              {filter === 'all' && (
                // 色の見本：赤ほど最近、暗い紺色ほど前（1週間〜）
                <div className="pointer-events-none absolute right-4 bottom-1 flex items-center gap-1.5 text-[10px] text-gray-500">
                  最近
                  <span className="h-2 w-16 rounded-full" style={{ background: RECENCY_GRADIENT }} />
                  1週間〜
                  <span className="ml-1 h-2 w-2 rounded-full" style={{ background: NEVER_COLOR }} />
                  未
                </div>
              )}
            </div>
            <div className="shrink-0">
              <BodyPartTabs value={filter} onChange={setFilter} includeAll />
            </div>
            <div className="shrink-0 px-4 pt-1 pb-3">
              <PrimaryButton onClick={() => navigate(`/day/${today}`)}>
                <Plus /> 今日の記録をつける
              </PrimaryButton>
            </div>
        </>
      )}
    </TabPage>
  );
}
