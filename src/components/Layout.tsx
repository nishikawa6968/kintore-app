import type { ReactNode, Ref } from 'react';
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

/** 下部タブ */
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
 * どの画面も「ヘッダー → 上の固定部分 → 真ん中のスクロール部分（ScrollArea）→ 下の固定部分」で組み立て、
 * 画面の高さぴったりに収める。ページ全体はスクロールしないので、iPhone で引っ張っても
 * ヘッダーや固定部分は動かない。高さは実際に見えている高さ（--app-h、main.tsx で測る）から計算する。
 */
function PageBody({ header, height, children }: { header: ReactNode; height: string; children: ReactNode }) {
  return (
    <>
      {header}
      <main className={`mx-auto flex max-w-md flex-col ${height}`}>{children}</main>
    </>
  );
}

/** 下部タブ付きの画面の中身の高さ（ヘッダーと下部タブ約3.65rem を除く） */
const TAB_PAGE_HEIGHT = 'h-[calc(var(--app-h)-3rem-env(safe-area-inset-top)-env(safe-area-inset-bottom)-3.65rem)]';
/** 下部タブなしの画面の中身の高さ（ヘッダーを除く） */
const SUB_PAGE_HEIGHT = 'h-[calc(var(--app-h)-3rem-env(safe-area-inset-top))]';

/** 下部タブ付きの画面（ホーム・自己ベスト・設定） */
export function TabPage({ header, children }: { header: ReactNode; children: ReactNode }) {
  return (
    <>
      <PageBody header={header} height={TAB_PAGE_HEIGHT}>
        {children}
      </PageBody>
      <BottomNav />
    </>
  );
}

/** 下部タブなしの画面（その日の記録・種目選択・記録の入力・種目の詳細・使い方） */
export function SubPage({ header, children }: { header: ReactNode; children: ReactNode }) {
  return (
    <PageBody header={header} height={SUB_PAGE_HEIGHT}>
      {children}
    </PageBody>
  );
}

/**
 * 真ん中のスクロール部分。上下の固定部分とのあいだにすき間を取り、
 * スクロールした中身は上下の端でふわっと消える（固定部分に重なって見えないように）。
 */
export function ScrollArea({
  children,
  className = '',
  flush = false,
  ref,
}: {
  children: ReactNode;
  className?: string;
  /** 中身が自分で左右の余白を持っているとき true（左右の余白を付けない） */
  flush?: boolean;
  ref?: Ref<HTMLDivElement>;
}) {
  return (
    <div ref={ref} className={`scroll-fade-y min-h-0 flex-1 overflow-y-auto overscroll-contain py-4 ${flush ? '' : 'px-4'} ${className}`}>
      {children}
    </div>
  );
}

/** 画面の一番下に固定する大きなボタンの置き場（下部タブなしの画面用。iPhone の下の余白も取る） */
export function BottomAction({ children }: { children: ReactNode }) {
  return <div className="shrink-0 px-4 pt-1 pb-[calc(1rem+env(safe-area-inset-bottom))]">{children}</div>;
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
