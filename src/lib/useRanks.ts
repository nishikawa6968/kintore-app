import { useMemo } from 'react';
import { allRanks, partRanks } from './ranks';
import { useData, useSetting } from './useData';

/** 全種目のランクと、部位ごとのランク。読み込み中は null */
export function useRanks() {
  const data = useData();
  const bodyweight = useSetting('bodyweight', 0);
  return useMemo(() => {
    if (!data || bodyweight === undefined) return null;
    const ranks = allRanks(data.exercises, data.sets, bodyweight);
    return { data, bodyweight, ranks, parts: partRanks(ranks) };
  }, [data, bodyweight]);
}
