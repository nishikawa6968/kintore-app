import { useMemo } from 'react';
import { achievementStates, achievementStats } from './achievements';
import { todayKey } from './date';
import { DEFAULT_WEEKLY_GOAL } from './streak';
import { useData, useSetting } from './useData';

/** 実績の一覧（解除済みかどうか・進み具合つき）。読み込み中は null */
export function useAchievements() {
  const data = useData();
  const bodyweight = useSetting('bodyweight', 0);
  const weeklyGoal = useSetting('weeklyGoal', DEFAULT_WEEKLY_GOAL);
  return useMemo(() => {
    if (!data || bodyweight === undefined || weeklyGoal === undefined) return null;
    return achievementStates(achievementStats(data.exercises, data.sets, data.days, bodyweight, weeklyGoal, todayKey()));
  }, [data, bodyweight, weeklyGoal]);
}
