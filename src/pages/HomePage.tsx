import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { BodyPartTabs } from '../components/BodyPartTabs';
import { Plus } from '../components/Icons';
import { Header, Loading, PrimaryButton, TabPage } from '../components/Layout';
import { LastTrainedChips } from '../components/LastTrainedChips';
import { MonthCalendar } from '../components/MonthCalendar';
import { fromKey, todayKey } from '../lib/date';
import { lastTrainedByPart, partsByDate } from '../lib/records';
import { useData } from '../lib/useData';
import { bodyPartLabel, type BodyPart } from '../types';

export function HomePage() {
  const data = useData();
  const navigate = useNavigate();
  const today = todayKey();
  const [filter, setFilter] = useState<BodyPart | 'all'>('all');
  const [month, setMonth] = useState(() => fromKey(today));

  const { lastByPart, marked } = useMemo(() => {
    if (!data) return { lastByPart: new Map<BodyPart, string>(), marked: new Set<string>() };
    const byDate = partsByDate(data.sets, data.exercises);
    const marked = new Set([...byDate].filter(([, parts]) => filter === 'all' || parts.has(filter)).map(([d]) => d));
    return { lastByPart: lastTrainedByPart(data.sets, data.exercises), marked };
  }, [data, filter]);

  const monthPrefix = format(month, 'yyyy-MM');
  const monthCount = [...marked].filter((d) => d.startsWith(monthPrefix)).length;

  return (
    <TabPage>
      <Header title="筋トレ記録" />
      {!data ? (
        <Loading />
      ) : (
        <>
          <section className="px-4 pt-4">
            <h2 className="mb-2 text-sm font-bold text-gray-500">部位ごとの最終トレーニング</h2>
            <LastTrainedChips
              lastByPart={lastByPart}
              today={today}
              selected={filter}
              onSelect={(p) => setFilter((f) => (f === p ? 'all' : p))}
            />
          </section>

          <div className="mt-3">
            <BodyPartTabs value={filter} onChange={setFilter} includeAll />
          </div>

          <section className="px-4">
            <MonthCalendar month={month} onMonthChange={setMonth} marked={marked} today={today} onSelect={(d) => navigate(`/day/${d}`)} />
            <p className="mt-2 text-center text-sm text-gray-500">
              {format(month, 'M月')}の{filter === 'all' ? '' : `${bodyPartLabel(filter)}の`}トレーニング：
              <span className="font-bold text-brand-600">{monthCount}日</span>
            </p>
          </section>

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
