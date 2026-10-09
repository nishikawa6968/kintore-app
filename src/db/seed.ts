import type { BodyPart, BuiltinKey, Exercise } from '../types';

const PRESETS: Record<BodyPart, string[]> = {
  chest: ['ベンチプレス', 'ダンベルプレス', 'インクラインベンチプレス', 'ダンベルフライ', 'チェストプレス'],
  back: ['デッドリフト', 'ラットプルダウン', 'ベントオーバーロウ', 'シーテッドロウ', '懸垂'],
  shoulder: ['ショルダープレス', 'サイドレイズ', 'フロントレイズ', 'リアレイズ'],
  arm: ['アームカール', 'ハンマーカール', 'トライセプスエクステンション', 'ケーブルプッシュダウン'],
  leg: ['スクワット', 'レッグプレス', 'レッグエクステンション', 'レッグカール', 'ブルガリアンスクワット', 'ヒップスラスト', 'ヒップアダクター', 'ヒップアブダクター', 'ランニング'],
  abs: ['クランチ', 'レッグレイズ', 'アブローラー', 'プランク'],
};

/** 距離×時間で記録する種目 */
export const CARDIO_NAMES = new Set(['ランニング']);

/**
 * アプリに固定で入れておく種目。BIG3 の判定などに使うので、
 * 消したり名前・部位を変えたりはできない（使わない人は非表示にできる）。
 */
export const BUILTINS: { key: BuiltinKey; name: string; bodyPart: BodyPart }[] = [
  { key: 'bench', name: 'ベンチプレス', bodyPart: 'chest' },
  { key: 'squat', name: 'スクワット', bodyPart: 'leg' },
  { key: 'deadlift', name: 'デッドリフト', bodyPart: 'back' },
  { key: 'running', name: 'ランニング', bodyPart: 'leg' },
];

export function presetExercises(): Omit<Exercise, 'id'>[] {
  return Object.entries(PRESETS).flatMap(([bodyPart, names]) =>
    names.map((name, order) => ({
      name,
      bodyPart: bodyPart as BodyPart,
      kind: CARDIO_NAMES.has(name) ? ('cardio' as const) : ('weight' as const),
      builtin: BUILTINS.find((b) => b.name === name && b.bodyPart === bodyPart)?.key,
      archived: false,
      order,
    })),
  );
}
