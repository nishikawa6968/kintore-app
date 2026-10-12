import type { ReactNode } from 'react';

/**
 * 画面の真ん中に出す「本当に〜しますか？」の確認。
 * 「いいえ」か、まわりの暗い所を押すと閉じる。danger のときは「はい」を赤くする。
 */
export function ConfirmDialog({
  title,
  children,
  confirmLabel = 'はい',
  cancelLabel = 'いいえ',
  danger = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="dialog-fade fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-8" onClick={onCancel} data-swipe-ignore role="presentation">
      <div
        className="dialog-pop w-full max-w-xs rounded-3xl bg-white p-5 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
      >
        <h2 className="text-lg font-black text-gray-800">{title}</h2>
        {children && <div className="mt-2 text-sm leading-relaxed text-gray-500">{children}</div>}
        <div className="mt-5 flex gap-2">
          <button onClick={onCancel} className="h-12 flex-1 rounded-xl bg-gray-100 font-bold text-gray-600 active:bg-gray-200">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`h-12 flex-1 rounded-xl font-bold text-white ${danger ? 'bg-rose-500 active:bg-rose-600' : 'bg-brand-500 active:bg-brand-600'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
