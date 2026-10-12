import { BODY_PARTS, isCardio, type Exercise, type SetRecord } from '../types';
import { LEVELS } from './big3';
import { rankOf } from './ranks';

/**
 * 登録している種目の一覧を、部位ごとのテキストにする（共有して、どの部位にどの種目があるか見るため）。
 * 並びはアプリの中と同じ（部位はロールの順、種目は並べ替えた順）。
 */
export function exerciseListText(exercises: Exercise[], sets: SetRecord[], dateLabel: string, bodyweight = 0) {
  const counts = new Map<number, number>();
  for (const s of sets) counts.set(s.exerciseId, (counts.get(s.exerciseId) ?? 0) + 1);

  const lines = [`筋トレ記録　種目一覧（${dateLabel}）`, `全${exercises.length}種目`, ''];
  for (const part of BODY_PARTS) {
    const list = exercises.filter((e) => e.bodyPart === part.id).sort((a, b) => a.order - b.order);
    lines.push(`■ ${part.label}（${list.length}種目）`);
    if (!list.length) lines.push('  （なし）');
    for (const e of list) {
      const tags = [e.builtin && '固定', isCardio(e) && '距離×時間', e.archived && '非表示'].filter(Boolean);
      const n = counts.get(e.id) ?? 0;
      // ランク：基準のある種目は今のランク（まだなければ —）、ない種目は「ランク基準なし」
      const r = rankOf(e, sets, bodyweight);
      const rank = !r ? '〔ランク基準なし〕' : `〔ランク ${r.index === null ? '—' : LEVELS[r.index]}〕`;
      lines.push(`- ${e.name}${tags.length ? `【${tags.join('・')}】` : ''}${n ? `（記録 ${n}${isCardio(e) ? '本' : 'セット'}）` : ''}${rank}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}
