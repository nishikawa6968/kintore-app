// アプリアイコン（ホーム画面に追加したときの画像）を PNG で書き出す。
// 使い方：node scripts/make-icons.ts
import { writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import { appIconSvg } from '../src/illustrations/icon.ts';

const png = (svg: string, size: number) => new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();

writeFileSync('public/apple-touch-icon.png', png(appIconSvg(), 180));
writeFileSync('public/icon-192.png', png(appIconSvg(), 192));
writeFileSync('public/icon-512.png', png(appIconSvg(), 512));
// Android は丸などに切り抜くので、人を小さめにして切れないようにする
writeFileSync('public/icon-maskable-512.png', png(appIconSvg(0.76), 512));
writeFileSync('public/favicon.svg', appIconSvg());
console.log('icons written');
