import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { CalendarIcon, ChevronLeft, Gear, Trophy } from './Icons';

/** 青いヘッダー。back に戻り先を渡すと左に「戻る」ボタンが出る */
export function Header({ title, back, right }: { title: string; back?: string; right?: ReactNode }) {
  const navigate = useNavigate();
  const goBack = () => {
    // 履歴があればブラウザの戻る、直接開いた場合は既定の戻り先へ
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate(back!, { replace: true });
  };
  return (
    <header className="sticky top-0 z-20 bg-brand-500 pt-safe text-white shadow-sm">
      <div className="mx-auto flex h-12 max-w-md items-center px-2">
        <div className="w-20">
          {back && (
            <button onClick={goBack} className="flex h-10 items-center pr-2 active:opacity-60" aria-label="戻る">
              <ChevronLeft />
            </button>
          )}
        </div>
        <h1 className="flex-1 truncate text-center text-[17px] font-bold">{title}</h1>
        <div className="flex w-20 justify-end whitespace-nowrap">{right}</div>
      </div>
    </header>
  );
}

const tabs = [
  { to: '/', label: 'ホーム', Icon: CalendarIcon },
  { to: '/records', label: '自己ベスト', Icon: Trophy },
  { to: '/settings', label: '設定', Icon: Gear },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white/95 pb-safe backdrop-blur">
      <div className="mx-auto flex max-w-md">
        {tabs.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                isActive ? 'text-brand-500' : 'text-gray-400'
              }`
            }
          >
            <Icon width={24} height={24} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

/** iPhone のステータスバー（時刻・電池）の裏を画面幅いっぱい青で塗る */
export function StatusBarFill() {
  return <div aria-hidden className="fixed inset-x-0 top-0 z-30 h-[env(safe-area-inset-top)] bg-brand-500" />;
}

/**
 * ヘッダーは画面幅いっぱい、中身は読みやすい幅（max-w-md）に収める。
 * wide を付けると中身も画面幅いっぱいにする（青い見出し帯が並ぶ画面用）。
 */
function PageBody({ header, wide, className, children }: { header: ReactNode; wide?: boolean; className: string; children: ReactNode }) {
  return (
    <>
      {header}
      <main className={`${wide ? '' : 'mx-auto max-w-md'} ${className}`}>{children}</main>
    </>
  );
}

/** 下部タブ付きの画面 */
export function TabPage({ header, children }: { header: ReactNode; children: ReactNode }) {
  return (
    <>
      <PageBody header={header} className="pb-40">
        {children}
      </PageBody>
      <BottomNav />
    </>
  );
}

/** 下部タブなしの画面（下に大きな操作ボタンを置く） */
export function SubPage({ header, wide, children, action }: { header: ReactNode; wide?: boolean; children: ReactNode; action?: ReactNode }) {
  return (
    <>
      <PageBody header={header} wide={wide} className="pb-32">
        {children}
      </PageBody>
      {action && (
        <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[#f3f5f9] via-[#f3f5f9] to-transparent px-4 pt-6 pb-safe">
          <div className="mx-auto max-w-md pb-4">{action}</div>
        </div>
      )}
    </>
  );
}

export function PrimaryButton({ children, onClick, className = '' }: { children: ReactNode; onClick: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 text-[17px] font-bold text-white shadow-lg shadow-brand-500/30 active:scale-[0.98] active:bg-brand-600 ${className}`}
    >
      {children}
    </button>
  );
}

export function Loading() {
  return <div className="p-10 text-center text-sm text-gray-400">読み込み中…</div>;
}
