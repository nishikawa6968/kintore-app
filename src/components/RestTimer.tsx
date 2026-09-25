import { useEffect, useState } from 'react';
import { Timer } from './Icons';

const PRESETS = [60, 90, 120, 180];

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/** インターバルタイマー。終了時刻で管理するので画面を離れてもズレない */
export function RestTimer() {
  const [length, setLength] = useState(90);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (endAt === null) return;
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= endAt) {
        setEndAt(null);
        setDone(true);
        navigator.vibrate?.([300, 150, 300]);
      }
    }, 250);
    return () => clearInterval(t);
  }, [endAt]);

  const remaining = endAt ? Math.max(0, Math.ceil((endAt - now) / 1000)) : length;
  const running = endAt !== null;

  return (
    <div className={`flex items-center gap-1.5 rounded-2xl px-3 py-2 shadow-sm ${done ? 'animate-pulse bg-today text-white' : 'bg-white'}`}>
      <Timer className={done ? 'text-white' : 'text-brand-500'} />
      <div className="w-12 text-lg font-bold tabular-nums">{done ? '終了!' : mmss(remaining)}</div>
      {!running && !done && (
        <div className="flex flex-1 justify-between">
          {PRESETS.map((s) => (
            <button
              key={s}
              onClick={() => setLength(s)}
              className={`h-8 shrink-0 rounded-full px-1.5 text-xs font-bold ${length === s ? 'bg-brand-100 text-brand-700' : 'text-gray-400'}`}
            >
              {s / 60}分
            </button>
          ))}
        </div>
      )}
      {(running || done) && <div className="flex-1" />}
      <button
        onClick={() => {
          setDone(false);
          if (running) setEndAt(null);
          else if (!done) {
            setNow(Date.now());
            setEndAt(Date.now() + length * 1000);
          }
        }}
        className={`h-9 shrink-0 rounded-full px-3.5 text-sm font-bold ${
          done ? 'bg-white text-today' : running ? 'bg-gray-100 text-gray-600' : 'bg-brand-500 text-white'
        }`}
      >
        {done ? 'OK' : running ? '停止' : '開始'}
      </button>
    </div>
  );
}
