import type { BodyPart, Exercise } from '../types';

const PRESETS: Record<BodyPart, string[]> = {
  chest: ['ベンチプレス', 'ダンベルプレス', 'インクラインベンチプレス', 'ダンベルフライ', 'チェストプレス'],
  back: ['デッドリフト', 'ラットプルダウン', 'ベントオーバーロウ', 'シーテッドロウ', '懸垂'],
  shoulder: ['ショルダープレス', 'サイドレイズ', 'フロントレイズ', 'リアレイズ'],
  arm: ['アームカール', 'ハンマーカール', 'トライセプスエクステンション', 'ケーブルプッシュダウン'],
  leg: ['スクワット', 'レッグプレス', 'レッグエクステンション', 'レッグカール', 'ブルガリアンスクワット'],
  glute: ['ヒップスラスト', 'ヒップアダクター', 'ヒップアブダクター'],
  abs: ['クランチ', 'レッグレイズ', 'アブローラー', 'プランク'],
};

export function presetExercises(): Omit<Exercise, 'id'>[] {
  return Object.entries(PRESETS).flatMap(([bodyPart, names]) =>
    names.map((name, order) => ({ name, bodyPart: bodyPart as BodyPart, archived: false, order })),
  );
}
