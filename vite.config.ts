import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

// アイコン画像の中身から作る印。アイコンを作り直すと変わり、iPhone が古い画像を使い回さなくなる
const iconVersion = createHash('md5').update(readFileSync('public/apple-touch-icon.png')).digest('hex').slice(0, 8);

export default defineConfig({
  // GitHub Pages では https://<user>.github.io/kintore-app/ に置かれる
  base: process.env.GITHUB_PAGES ? '/kintore-app/' : '/',
  plugins: [
    react(),
    tailwindcss(),
    { name: 'icon-version', transformIndexHtml: (html) => html.replaceAll('__ICON_VERSION__', iconVersion) },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'favicon.svg'],
      manifest: {
        name: '筋トレ記録',
        short_name: '筋トレ',
        description: '筋トレの記録と自己ベスト管理',
        lang: 'ja',
        theme_color: '#1e6fd9',
        background_color: '#f3f5f9',
        display: 'standalone',
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
