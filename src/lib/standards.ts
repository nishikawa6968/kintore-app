import type { BodyPart, Exercise } from '../types';

/**
 * 種目ごとのランクの基準（初心者 → 初級者 → 中級者 → 上級者 → エリート。BIG3 の称号と同じ）。
 *
 * - weight：「reps 回」で挙げられる重さ（kg）。ほかの回数のセットも推定で reps 回に換算してくらべる
 * - reps：自重の種目。1セットでできた回数
 * - pace：ランニング。1km の平均ペース（秒。小さいほど速い）
 * - big3：BIG3 の画面と同じ（体重の何倍を挙げたか）
 *
 * values は各ランクに届く値（初心者はスタートの目安）。成人男性の一般的な目安をもとにした、おおまかな値。
 * 種目を増やすときは、ここに基準を足す（名前が同じ種目には自動でランクが付く）。
 */
export type StandardKind = 'weight' | 'reps' | 'pace' | 'big3';

export interface ExerciseStandard {
  key: string;
  /** この基準を使う種目名（別名も含む） */
  names: string[];
  bodyPart: BodyPart;
  kind: StandardKind;
  /** weight のときの回数 */
  reps?: number;
  /** 初心者・初級者・中級者・上級者・エリート */
  values?: [number, number, number, number, number];
  /** 重さの数え方などの注意（ランクの表に出す） */
  note?: string;
}

const DB = 'ダンベル片手の重さ';

export const STANDARDS_CATALOG: ExerciseStandard[] = [
  // 肩
  { key: 'shoulder-press', names: ['ショルダープレス', 'ダンベルショルダープレス'], bodyPart: 'shoulder', kind: 'weight', reps: 10, values: [7, 11, 18, 25, 34], note: DB },
  { key: 'side-raise', names: ['サイドレイズ', 'ダンベルラテラルレイズ', 'ラテラルレイズ'], bodyPart: 'shoulder', kind: 'weight', reps: 12, values: [3, 5, 8, 12, 16], note: DB },
  { key: 'front-raise', names: ['フロントレイズ'], bodyPart: 'shoulder', kind: 'weight', reps: 12, values: [4, 6, 10, 14, 20], note: DB },
  { key: 'rear-raise', names: ['リアレイズ'], bodyPart: 'shoulder', kind: 'weight', reps: 12, values: [3, 5, 7, 11, 15], note: DB },

  // 胸
  { key: 'bench', names: ['ベンチプレス'], bodyPart: 'chest', kind: 'big3' },
  { key: 'dumbbell-press', names: ['ダンベルプレス', 'ダンベルベンチプレス'], bodyPart: 'chest', kind: 'weight', reps: 10, values: [10, 16, 24, 34, 44], note: DB },
  { key: 'incline-bench', names: ['インクラインベンチプレス'], bodyPart: 'chest', kind: 'weight', reps: 10, values: [30, 44, 60, 80, 100] },
  { key: 'chest-press', names: ['チェストプレス'], bodyPart: 'chest', kind: 'weight', reps: 10, values: [24, 40, 60, 84, 110], note: 'マシンの重さ' },
  { key: 'dumbbell-fly', names: ['ダンベルフライ'], bodyPart: 'chest', kind: 'weight', reps: 12, values: [5, 8, 13, 20, 26], note: DB },
  { key: 'pec-deck', names: ['ペックデッキフライマシン', 'ペックデッキ', 'ペックフライ'], bodyPart: 'chest', kind: 'weight', reps: 12, values: [18, 32, 50, 74, 100], note: 'マシンの重さ' },

  // 腕
  { key: 'arm-curl', names: ['アームカール', 'アームカール（片腕ずつ）', 'ダンベルカール'], bodyPart: 'arm', kind: 'weight', reps: 10, values: [5, 9, 14, 20, 27], note: DB },
  { key: 'hammer-curl', names: ['ハンマーカール'], bodyPart: 'arm', kind: 'weight', reps: 10, values: [6, 10, 15, 22, 28], note: DB },
  { key: 'triceps-extension', names: ['トライセプスエクステンション'], bodyPart: 'arm', kind: 'weight', reps: 10, values: [7, 12, 19, 28, 38], note: 'ダンベル1つを両手で持った重さ' },
  // 両手で1本のケーブルを引き、ジムのケーブルは表示の重さより軽く感じることが多いので、高めの基準にする
  { key: 'pushdown', names: ['ケーブルプッシュダウン', 'プッシュダウン'], bodyPart: 'arm', kind: 'weight', reps: 10, values: [25, 45, 65, 90, 120], note: 'ケーブルの重さ（両手で1本）' },
  { key: 'wrist-curl', names: ['リストカール'], bodyPart: 'arm', kind: 'weight', reps: 12, values: [6, 10, 15, 22, 30], note: DB },

  // 背中
  { key: 'deadlift', names: ['デッドリフト'], bodyPart: 'back', kind: 'big3' },
  { key: 'lat-pulldown', names: ['ラットプルダウン'], bodyPart: 'back', kind: 'weight', reps: 10, values: [27, 38, 51, 67, 84], note: 'マシンの重さ' },
  { key: 'bent-over-row', names: ['ベントオーバーロウ'], bodyPart: 'back', kind: 'weight', reps: 10, values: [26, 38, 53, 71, 92], note: 'バーベルの重さ' },
  { key: 'seated-row', names: ['シーテッドロウ'], bodyPart: 'back', kind: 'weight', reps: 10, values: [25, 37, 53, 71, 93], note: 'マシンの重さ' },
  { key: 'pull-up', names: ['懸垂', 'チンニング'], bodyPart: 'back', kind: 'reps', values: [1, 5, 10, 15, 20], note: '自重で1セットにできた回数' },

  // 腹
  { key: 'crunch', names: ['クランチ'], bodyPart: 'abs', kind: 'reps', values: [10, 20, 35, 50, 70], note: '1セットにできた回数' },
  { key: 'leg-raise', names: ['レッグレイズ'], bodyPart: 'abs', kind: 'reps', values: [3, 8, 15, 25, 35], note: '1セットにできた回数' },
  { key: 'ab-roller', names: ['アブローラー'], bodyPart: 'abs', kind: 'reps', values: [3, 8, 15, 25, 40], note: '1セットにできた回数（膝つき）' },

  // 脚
  { key: 'squat', names: ['スクワット'], bodyPart: 'leg', kind: 'big3' },
  { key: 'leg-press', names: ['レッグプレス'], bodyPart: 'leg', kind: 'weight', reps: 10, values: [50, 85, 135, 200, 270], note: 'マシンの重さ' },
  { key: 'leg-extension', names: ['レッグエクステンション'], bodyPart: 'leg', kind: 'weight', reps: 10, values: [19, 33, 52, 77, 105], note: 'マシンの重さ' },
  { key: 'leg-curl', names: ['レッグカール'], bodyPart: 'leg', kind: 'weight', reps: 10, values: [17, 28, 43, 62, 83], note: 'マシンの重さ' },
  { key: 'bulgarian-squat', names: ['ブルガリアンスクワット'], bodyPart: 'leg', kind: 'weight', reps: 10, values: [6, 12, 21, 32, 44], note: DB },
  { key: 'hip-thrust', names: ['ヒップスラスト'], bodyPart: 'leg', kind: 'weight', reps: 10, values: [34, 64, 100, 146, 200], note: 'バーベルの重さ' },
  { key: 'hip-adduction', names: ['ヒップアダクター'], bodyPart: 'leg', kind: 'weight', reps: 12, values: [25, 40, 60, 85, 110], note: 'マシンの重さ' },
  { key: 'hip-abduction', names: ['ヒップアブダクター'], bodyPart: 'leg', kind: 'weight', reps: 12, values: [25, 40, 60, 85, 110], note: 'マシンの重さ' },
  { key: 'running', names: ['ランニング'], bodyPart: 'leg', kind: 'pace', values: [420, 360, 315, 270, 230], note: '1km以上走ったときの平均ペース' },
];

export const standardOf = (key: string | undefined) => STANDARDS_CATALOG.find((s) => s.key === key);

/** 種目名と部位から、使う基準を探す（前後の空白は無視） */
export function findStandard(name: string, bodyPart: BodyPart) {
  const n = name.trim();
  return STANDARDS_CATALOG.find((s) => s.bodyPart === bodyPart && s.names.includes(n));
}

/** 種目の基準（std が付いていなければ名前で探す） */
export const standardFor = (e: Exercise | undefined) => (e ? (standardOf(e.std) ?? findStandard(e.name, e.bodyPart)) : undefined);
