export function RecordBadge({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap gap-0.5 rounded-full bg-amber-400 font-bold text-white shadow-sm ${
        small ? 'px-1.5 py-px text-[10px]' : 'px-2 py-0.5 text-xs'
      }`}
    >
      🎉 新記録
    </span>
  );
}

