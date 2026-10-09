export type BodyPart = 'chest' | 'back' | 'shoulder' | 'arm' | 'leg' | 'abs';

/** 体の上から下へ流れる順番（ロールや一覧はこの順に並ぶ） */
export const BODY_PARTS: { id: BodyPart; label: string }[] = [
  { id: 'shoulder', label: '肩' },
  { id: 'chest', label: '胸' },
  { id: 'arm', label: '腕' },
  { id: 'back', label: '背中' },
  { id: 'abs', label: '腹' },
  { id: 'leg', label: '脚' },
];

export const bodyPartLabel = (id: BodyPart) =>
  BODY_PARTS.find((p) => p.id === id)?.label ?? id;

/** アプリに固定で入っている種目 */
export type BuiltinKey = 'bench' | 'squat' | 'deadlift' | 'running';

/** weight：重量×回数で記録 / cardio：距離×時間で記録（ランニング） */
export type ExerciseKind = 'weight' | 'cardio';

export interface Exercise {
  id: number;
  name: string;
  bodyPart: BodyPart;
  /** 未設定は weight */
  kind?: ExerciseKind;
  /** アプリに固定で入っている種目（BIG3・ランニング）。名前や部位は変えられない（非表示はできる） */
  builtin?: BuiltinKey;
  archived: boolean;
  order: number;
}

export const isCardio = (e?: Exercise) => e?.kind === 'cardio';

export interface SetRecord {
  id: number;
  /** 'YYYY-MM-DD' */
  date: string;
  exerciseId: number;
  /** kg。自重は 0 */
  weight: number;
  reps: number;
  /** ランニングの距離(km)。重量の種目では使わない */
  distance?: number;
  /** ランニングの時間(秒)。重量の種目では使わない */
  duration?: number;
  memo?: string;
  /** その日・その種目の中での並び順 */
  order: number;
  createdAt: number;
}

/** 筋トレ以外の日（体操など）。筋トレと同じ日にはしない */
export interface DayRecord {
  /** 'YYYY-MM-DD' */
  date: string;
  kind: 'gymnastics';
  /** その日にやったことのメモ */
  memo?: string;
}

/** アプリの設定と、その値の型 */
export interface SettingValues {
  /** 体重（kg）。BIG3 のレベル判定に使う */
  bodyweight: number;
  /** 1週間（月〜日）に何日トレーニングするか */
  weeklyGoal: number;
  /** プレート計算のバーの重さ（kg） */
  barWeight: number;
  /** もうお知らせした実績の id */
  seenAchievements: string[];
}
export type SettingKey = keyof SettingValues;

/** アプリの設定。key ごとに1行 */
export interface Setting {
  key: SettingKey;
  value: SettingValues[SettingKey];
}
