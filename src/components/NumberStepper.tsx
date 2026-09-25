import { useEffect, useRef, useState } from 'react';
import { fmtKg } from '../lib/records';
import { Minus, Plus } from './Icons';

/** −/＋ボタン付きの数値入力。打ち込み中の "72." などは文字列で保持する */
export function NumberStepper({
  value,
  onChange,
  step,
  unit,
  decimal = false,
  placeholder,
}: {
  value: number;
  onChange: (n: number) => void;
  step: number;
  unit: string;
  decimal?: boolean;
  placeholder?: string;
}) {
  const [text, setText] = useState(fmtKg(value));
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setText(fmtKg(value));
  }, [value]);

  const bump = (dir: 1 | -1) => {
    const n = Math.max(0, Math.round((value + dir * step) * 100) / 100);
    setText(fmtKg(n));
    onChange(n);
  };

  return (
    <div className="flex items-center rounded-xl bg-gray-50 ring-1 ring-gray-200 focus-within:ring-2 focus-within:ring-brand-400">
      <button onClick={() => bump(-1)} className="flex h-11 w-9 items-center justify-center text-brand-500 active:bg-brand-50 rounded-l-xl" aria-label={`${unit}を減らす`}>
        <Minus width={18} height={18} />
      </button>
      <div className="flex min-w-0 flex-1 items-baseline justify-center">
        <input
          value={text}
          inputMode={decimal ? 'decimal' : 'numeric'}
          placeholder={placeholder}
          onFocus={(e) => {
            focused.current = true;
            e.target.select();
          }}
          onBlur={() => {
            focused.current = false;
            setText(fmtKg(value));
          }}
          onChange={(e) => {
            const t = e.target.value.replace(/[^\d.]/g, '');
            setText(t);
            const n = decimal ? parseFloat(t) : parseInt(t, 10);
            if (!Number.isNaN(n)) onChange(n);
            else if (t === '') onChange(0);
          }}
          className="w-full min-w-0 bg-transparent text-center text-xl font-bold tabular-nums text-gray-800 outline-none placeholder:font-normal placeholder:text-gray-300"
        />
        <span className="pr-0.5 text-xs text-gray-400">{unit}</span>
      </div>
      <button onClick={() => bump(1)} className="flex h-11 w-9 items-center justify-center text-brand-500 active:bg-brand-50 rounded-r-xl" aria-label={`${unit}を増やす`}>
        <Plus width={18} height={18} />
      </button>
    </div>
  );
}
