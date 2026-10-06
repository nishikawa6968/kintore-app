import type { BodyPart, Exercise } from '../types';

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

export function presetExercises(): Omit<Exercise, 'id'>[] {
  return Object.entries(PRESETS).flatMap(([bodyPart, names]) =>
    names.map((name, order) => ({
      name,
      bodyPart: bodyPart as BodyPart,
      kind: CARDIO_NAMES.has(name) ? ('cardio' as const) : ('weight' as const),
      archived: false,
      order,
    })),
  );
}
