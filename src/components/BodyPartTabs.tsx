import { BODY_PARTS, type BodyPart } from '../types';

type Value = BodyPart | 'all';

export function BodyPartTabs<T extends Value>({
  value,
  onChange,
  includeAll = false,
}: {
  value: T;
  onChange: (v: T) => void;
  includeAll?: boolean;
}) {
  const items = [...(includeAll ? [{ id: 'all' as const, label: 'ALL' }] : []), ...BODY_PARTS];
  return (
    <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 py-2">
      {items.map((p) => {
        const active = p.id === value;
        return (
          <button
            key={p.id}
            onClick={() => onChange(p.id as T)}
            className={`h-9 shrink-0 rounded-full px-4 text-sm font-bold transition-colors ${
              active ? 'bg-brand-500 text-white shadow' : 'bg-white text-brand-600 ring-1 ring-brand-100'
            }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
