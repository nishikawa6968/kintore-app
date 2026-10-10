/**
 * テーマの色。アプリの基調の色（--color-brand-50〜800）をまとめて入れ替える。
 * 開くときの画面（スプラッシュ）やステータスバーの色も、この色になる。
 */

export type ThemeId = 'blue' | 'indigo' | 'violet' | 'pink' | 'red' | 'orange' | 'green' | 'black';

export interface Theme {
  id: ThemeId;
  name: string;
  /** --color-brand-50, 100, 200, 300, 400, 500, 600, 700, 800 */
  colors: [string, string, string, string, string, string, string, string, string];
}

export const BRAND_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800] as const;

export const THEMES: Theme[] = [
  { id: 'blue', name: 'ブルー', colors: ['#eef5fd', '#d6e6fa', '#adcdf5', '#7eb0ee', '#4c8fe4', '#1e6fd9', '#1759b3', '#13478e', '#0f3669'] },
  { id: 'indigo', name: 'ネイビー', colors: ['#eef2ff', '#e0e7ff', '#c7d2fe', '#a5b4fc', '#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81'] },
  { id: 'violet', name: 'パープル', colors: ['#f5f3ff', '#ede9fe', '#ddd6fe', '#c4b5fd', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95'] },
  { id: 'pink', name: 'ピンク', colors: ['#fdf2f8', '#fce7f3', '#fbcfe8', '#f9a8d4', '#ec4899', '#db2777', '#be185d', '#9d174d', '#831843'] },
  { id: 'red', name: 'レッド', colors: ['#fef2f2', '#fee2e2', '#fecaca', '#fca5a5', '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'] },
  { id: 'orange', name: 'オレンジ', colors: ['#fff7ed', '#ffedd5', '#fed7aa', '#fdba74', '#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12'] },
  { id: 'green', name: 'グリーン', colors: ['#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac', '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d'] },
  { id: 'black', name: 'ブラック', colors: ['#f8fafc', '#f1f5f9', '#e2e8f0', '#94a3b8', '#64748b', '#334155', '#1e293b', '#0f172a', '#020617'] },
];

export const DEFAULT_THEME: ThemeId = 'blue';
export const themeOf = (id: string | undefined) => THEMES.find((t) => t.id === id) ?? THEMES[0];

/** 端末に覚えておく場所（アプリが開く前の画面でもすぐ色を変えられるように） */
export const THEME_STORAGE_KEY = 'kintore-theme';

/**
 * テーマの色を画面に当てる。index.html の最初のスクリプトにも同じ処理を入れていて、
 * そこでは React より先に色を変える（開くときの画面がいつもの青で一瞬出ないように）。
 */
export function applyTheme(id: string) {
  const t = themeOf(id);
  const root = document.documentElement.style;
  t.colors.forEach((c, i) => root.setProperty(`--color-brand-${BRAND_STEPS[i]}`, c));
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t.colors[5]);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, t.id);
  } catch {
    // 覚えておけなくても、色は変わっているので問題ない
  }
}

/** index.html の先頭で動かすスクリプト（端末に覚えたテーマの色を、画面が出る前に当てる） */
export function themeBootScript() {
  const table = Object.fromEntries(THEMES.map((t) => [t.id, t.colors]));
  return `(function(){try{var t=${JSON.stringify(table)},c=t[localStorage.getItem('${THEME_STORAGE_KEY}')];if(!c)return;var s=document.documentElement.style,k=[${BRAND_STEPS.join(',')}];for(var i=0;i<k.length;i++)s.setProperty('--color-brand-'+k[i],c[i]);document.querySelector('meta[name="theme-color"]').setAttribute('content',c[5]);}catch(e){}})();`;
}
