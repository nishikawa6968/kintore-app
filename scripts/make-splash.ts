// アプリを開くときに iPhone が最初に出す起動画像（スプラッシュ）を PNG で書き出す。
// 使い方：node scripts/make-splash.ts
import { mkdirSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import { IPHONE_SCREENS, splashFileName, splashScreenSvg } from '../src/illustrations/splash.ts';

mkdirSync('public/splash', { recursive: true });
const done = new Set<string>();
for (const s of IPHONE_SCREENS) {
  const name = splashFileName(s);
  if (done.has(name)) continue;
  done.add(name);
  const png = new Resvg(splashScreenSvg(s.w * s.dpr, s.h * s.dpr), {
    font: { fontFiles: ['/System/Library/Fonts/Avenir Next.ttc'], loadSystemFonts: false, defaultFontFamily: 'Avenir Next' },
  })
    .render()
    .asPng();
  writeFileSync(`public/splash/${name}`, png);
}
console.log(`splash written: ${[...done].join(', ')}`);
