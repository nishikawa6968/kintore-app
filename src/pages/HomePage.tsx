import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BodyPartTabs } from '../components/BodyPartTabs';
import { Plus } from '../components/Icons';
import { Header, Loading, PrimaryButton, TabPage } from '../components/Layout';
import { MonthCalendar } from '../components/MonthCalendar';
import { BodyMap } from '../illustrations/BodyMap';
import { daysAgoLabel, fromKey, slashDate, todayKey } from '../lib/date';
import { lastTrainedByPart, partsByDate } from '../lib/records';
import { useData } from '../lib/useData';
import { bodyPartLabel, type BodyPart } from '../types';

export function HomePage() {
  const data = useData();
  const navigate = useNavigate();
  const today = todayKey();
  const [filter, setFilter] = useState<BodyPart | 'all'>('all');
  const [month, setMonth] = useState(() => fromKey(today));

  const { last, marked, trained } = useMemo(() => {
    if (!data) return { last: undefined, marked: new Set<string>(), trained: new Set<string>() };
    const byDate = partsByDate(data.sets, data.exercises);
    const marked = new Set([...byDate].filter(([, parts]) => filter === 'all' || parts.has(filter)).map(([d]) => d));
    const lastByPart = lastTrainedByPart(data.sets, data.exercises);
    const last = filter === 'all' ? [...lastByPart.values()].sort().at(-1) : lastByPart.get(filter);
    return { last, marked, trained: new Set(byDate.keys()) };
  }, [data, filter]);

  return (
    <TabPage header={<Header title="筋トレ記録" />}>
      {!data ? (
        <Loading />
      ) : (
        <>
          <section className="px-4 pt-3">
            <MonthCalendar month={month} onMonthChange={setMonth} marked={marked} trained={trained} today={today} onSelect={(d) => navigate(`/day/${d}`)} />
          </section>

          {/* 選んでいる部位の最終トレーニング → 人の図 → ロール（親指の届く下の方に） */}
          <p className="mt-3 text-center text-sm text-gray-500">
            {filter !== 'all' && <span className="font-bold text-gray-700">{bodyPartLabel(filter)}の</span>}
            最終トレーニング：
            <span className="font-bold text-brand-600">{last ? `${daysAgoLabel(last)}（${slashDate(last)}）` : '記録なし'}</span>
          </p>
          <BodyMap selected={filter} onSelect={setFilter} className="mx-auto mt-1 h-[200px] w-auto" />
          <BodyPartTabs value={filter} onChange={setFilter} includeAll />

          <div className="fixed inset-x-0 bottom-[72px] z-10 px-4 pb-safe">
            <div className="mx-auto max-w-md">
              <PrimaryButton onClick={() => navigate(`/day/${today}`)}>
                <Plus /> 今日の記録をつける
              </PrimaryButton>
            </div>
          </div>
        </>
      )}
    </TabPage>
  );
}
