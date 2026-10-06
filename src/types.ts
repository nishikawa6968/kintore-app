export type BodyPart = 'chest' | 'back' | 'shoulder' | 'arm' | 'leg' | 'abs';

export const BODY_PARTS: { id: BodyPart; label: string }[] = [
  { id: 'chest', label: '胸' },
  { id: 'back', label: '背中' },
  { id: 'shoulder', label: '肩' },
  { id: 'arm', label: '腕' },
  { id: 'leg', label: '脚' },
  { id: 'abs', label: '腹' },
];

export const bodyPartLabel = (id: BodyPart) =>
  BODY_PARTS.find((p) => p.id === id)?.label ?? id;

export interface Exercise {
  id: number;
  name: string;
  bodyPart: BodyPart;
  archived: boolean;
  order: number;
}

export interface SetRecord {
  id: number;
  /** 'YYYY-MM-DD' */
  date: string;
  exerciseId: number;
  /** kg。自重は 0 */
  weight: number;
  reps: number;
  memo?: string;
  /** その日・その種目の中での並び順 */
  order: number;
  createdAt: number;
}
