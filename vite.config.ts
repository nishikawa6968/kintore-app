import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import {
  ART_CENTER_Y,
  ART_WIDTH,
  IPHONE_SCREENS,
  LOADING,
  SPLASH_BOTTOM,
  SPLASH_FONT,
  SPLASH_TOP,
  splashArt,
  splashFileName,
} from './src/illustrations/splash.ts';
import { themeBootScript } from './src/lib/themes.ts';

// アイコン画像の中身から作る印。アイコンを作り直すと変わり、iPhone が古い画像を使い回さなくなる
const iconVersion = createHash('md5').update(readFileSync('public/apple-touch-icon.png')).digest('hex').slice(0, 8);

// 起動画像の中身から作る印（作り直すと変わり、iPhone が古い画像を使い回さなくなる）
const splashVersion = createHash('md5').update(readFileSync(`public/splash/${splashFileName(IPHONE_SCREENS[0])}`)).digest('hex').slice(0, 8);

/** 画面の幅に対する割合を、大きな画面では大きくなりすぎないようにした CSS の長さにする */
const vw = (r: number) => `min(${(r * 100).toFixed(2)}vw, ${(r * 440).toFixed(1)}px)`;

/**
 * アプリを開くときの画面（スプラッシュ）を index.html に入れる。
 * - iPhone の起動画像（apple-touch-startup-image）：開いた瞬間、黒い画面の代わりに出る
 * - ページの中の同じ画面：起動画像のあと、アプリの準備ができるまで出し、右下の点を動かす（main.tsx で消す）
 */
function splashHtml(base: string) {
  const links = IPHONE_SCREENS.map(
    (s) =>
      `<link rel="apple-touch-startup-image" media="screen and (device-width: ${s.w}px) and (device-height: ${s.h}px) and (-webkit-device-pixel-ratio: ${s.dpr}) and (orientation: portrait)" href="${base}splash/${splashFileName(s)}?v=${splashVersion}" />`,
  ).join('\n    ');
  const style = `<style>
      #splash { position: fixed; inset: 0; z-index: 9999; background: linear-gradient(var(--color-brand-400, ${SPLASH_TOP}), var(--color-brand-700, ${SPLASH_BOTTOM})); transition: opacity 0.45s ease; }
      #splash.hide { opacity: 0; pointer-events: none; }
      #splash .art { position: absolute; left: 50%; top: ${ART_CENTER_Y * 100}%; width: ${vw(ART_WIDTH)}; transform: translate(-50%, -50%); }
      #splash .loading { position: absolute; right: ${vw(LOADING.right)}; bottom: ${vw(LOADING.bottom - LOADING.font * 0.3)}; display: flex; align-items: center; font: 600 ${vw(LOADING.font)} ${SPLASH_FONT}; letter-spacing: 0.08em; color: rgb(255 255 255 / 0.85); }
      #splash .dots { display: flex; gap: ${vw(LOADING.gap)}; margin-left: ${vw(LOADING.gap * 1.5)}; }
      #splash .dots i { width: ${vw(LOADING.dot)}; height: ${vw(LOADING.dot)}; border-radius: 50%; background: #fff; opacity: 0.6; animation: splash-dot 1.2s ease-in-out infinite; }
      #splash .dots i:nth-child(2) { animation-delay: 0.2s; }
      #splash .dots i:nth-child(3) { animation-delay: 0.4s; }
      @keyframes splash-dot { 0%, 80%, 100% { opacity: 0.35; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-40%); } }
    </style>`;
  const body = `<div id="splash" aria-hidden="true">${splashArt('class="art"')}<div class="loading">Loading<span class="dots"><i></i><i></i><i></i></span></div></div>`;
  // テーマの色は、開くときの画面が出る前に当てる
  return { head: `<script>${themeBootScript()}</script>\n    ${links}\n    ${style}`, body };
}

export default defineConfig({
  // GitHub Pages では https://<user>.github.io/kintore-app/ に置かれる
  base: process.env.GITHUB_PAGES ? '/kintore-app/' : '/',
  plugins: [
    react(),
    tailwindcss(),
    { name: 'icon-version', transformIndexHtml: (html) => html.replaceAll('__ICON_VERSION__', iconVersion) },
    (() => {
      let base = '/';
      return {
        name: 'splash',
        configResolved(config: { base: string }) {
          base = config.base;
        },
        transformIndexHtml(html: string) {
          const { head, body } = splashHtml(base);
          return html.replace('<!--SPLASH_HEAD-->', head).replace('<!--SPLASH-->', body);
        },
      };
    })(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'favicon.svg'],
      manifest: {
        name: '筋トレ記録',
        short_name: '筋トレ',
        description: '筋トレの記録と自己ベスト管理',
        lang: 'ja',
        theme_color: '#1e6fd9',
        // 開くときの画面の色（Android）。起動画面と同じ青にする
        background_color: '#1e6fd9',
        display: 'standalone',
        // 縦向きに固定（Android など対応している端末。iPhone は横向きのとき案内を出す）
        orientation: 'portrait',
        start_url: '.',
        icons: [
          { src: `icon-192.png?v=${iconVersion}`, sizes: '192x192', type: 'image/png' },
          { src: `icon-512.png?v=${iconVersion}`, sizes: '512x512', type: 'image/png' },
          { src: `icon-maskable-512.png?v=${iconVersion}`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
