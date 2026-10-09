import { ICON_BASE, ICON_HAIR, ICON_MUSCLES, ICON_VIEWBOX } from './iconShapes.ts';

/**
 * アプリを開くときの画面（スプラッシュ）。青い背景に、アイコンと同じ白い人と「TRAINING APPLICATION」。
 * iPhone が最初に出す起動画像（PNG）と、ページの中で出す画面（index.html）の両方をここから作り、
 * 起動画像からページの画面へ切り替わっても見た目が変わらないようにする。
 */

/** 背景のグラデーション（アイコンと同じ） */
export const SPLASH_TOP = '#4c8fe4';
export const SPLASH_BOTTOM = '#13478e';
export const SPLASH_FONT = "'Avenir Next', 'Helvetica Neue', Arial, sans-serif";

/** 人と文字の部分の幅（画面の幅に対する割合）と、その中心の高さ（画面の高さに対する割合） */
export const ART_WIDTH = 0.64;
export const ART_CENTER_Y = 0.46;
/** 人と文字の部分の座標の大きさ（幅 100） */
export const ART_VIEWBOX = { width: 100, height: 166 };

/** 人と文字（背景なし）。x, y, width を渡すと、その位置・大きさに置く */
export function splashArt(attrs = '') {
  const { width, height } = ICON_VIEWBOX;
  const s = 100 / width;
  const muscles = ICON_MUSCLES.map((d) => `<path d="${d}" fill="#dbe8fb" stroke="#ffffff" stroke-width="2.6" stroke-linejoin="round"/>`).join('');
  const figureH = height * s;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ART_VIEWBOX.width} ${ART_VIEWBOX.height}" ${attrs}>
<g transform="scale(${s.toFixed(5)})"><path d="${ICON_BASE}" fill="#ffffff"/><path d="${ICON_HAIR}" fill="#c6d4ea"/>${muscles}</g>
<text x="50" y="${(figureH + 22).toFixed(1)}" text-anchor="middle" font-family="${SPLASH_FONT}" font-weight="800" font-size="16.5" letter-spacing="1.2" fill="#ffffff">TRAINING</text>
<text x="50" y="${(figureH + 36).toFixed(1)}" text-anchor="middle" font-family="${SPLASH_FONT}" font-weight="600" font-size="6.6" letter-spacing="3.1" fill="#dbe8fb">APPLICATION</text>
</svg>`;
}

/** 右下の「Loading…」の位置と大きさ（画面の幅に対する割合） */
export const LOADING = { right: 0.07, bottom: 0.07, font: 0.036, dot: 0.014, gap: 0.012 };

/** iPhone の起動画像（PNG にする SVG）。w, h は画面のピクセル数 */
export function splashScreenSvg(w: number, h: number) {
  const artW = w * ART_WIDTH;
  const artH = (artW * ART_VIEWBOX.height) / ART_VIEWBOX.width;
  const art = splashArt(`x="${((w - artW) / 2).toFixed(1)}" y="${(h * ART_CENTER_Y - artH / 2).toFixed(1)}" width="${artW.toFixed(1)}" height="${artH.toFixed(1)}"`);
  // 右下の Loading と点（起動画像は動かせないので、点は止まった状態で描く）
  const font = w * LOADING.font;
  const dot = w * LOADING.dot;
  const gap = w * LOADING.gap;
  const right = w - w * LOADING.right;
  const baseline = h - w * LOADING.bottom;
  const dots = [0, 1, 2]
    .map((i) => `<circle cx="${(right - dot / 2 - (2 - i) * (dot + gap)).toFixed(1)}" cy="${(baseline - dot / 2).toFixed(1)}" r="${(dot / 2).toFixed(1)}" fill="#ffffff" fill-opacity="0.6"/>`)
    .join('');
  const textRight = right - 3 * dot - 2 * gap - gap * 1.5;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${SPLASH_TOP}"/><stop offset="1" stop-color="${SPLASH_BOTTOM}"/></linearGradient></defs>
<rect width="${w}" height="${h}" fill="url(#bg)"/>
${art}
<text x="${textRight.toFixed(1)}" y="${baseline.toFixed(1)}" text-anchor="end" font-family="${SPLASH_FONT}" font-weight="600" font-size="${font.toFixed(1)}" letter-spacing="${(font * 0.08).toFixed(1)}" fill="#ffffff" fill-opacity="0.85">Loading</text>
${dots}
</svg>`;
}

/**
 * iPhone の画面の大きさ（縦向き、ポイント）と倍率。起動画像はぴったり合う大きさのものしか使われないので、
 * 機種ごとに用意する。
 */
export const IPHONE_SCREENS = [
  { w: 440, h: 956, dpr: 3 }, // 16 Pro Max・17 Pro Max
  { w: 420, h: 912, dpr: 3 }, // Air
  { w: 402, h: 874, dpr: 3 }, // 16 Pro・17・17 Pro
  { w: 430, h: 932, dpr: 3 }, // 14 Pro Max・15 Plus・15 Pro Max・16 Plus
  { w: 393, h: 852, dpr: 3 }, // 14 Pro・15・15 Pro・16
  { w: 428, h: 926, dpr: 3 }, // 12 Pro Max・13 Pro Max・14 Plus
  { w: 390, h: 844, dpr: 3 }, // 12・13・14・16e
  { w: 375, h: 812, dpr: 3 }, // X・XS・11 Pro・12 mini・13 mini
  { w: 414, h: 896, dpr: 3 }, // XS Max・11 Pro Max
  { w: 414, h: 896, dpr: 2 }, // XR・11
  { w: 414, h: 736, dpr: 3 }, // 8 Plus
  { w: 375, h: 667, dpr: 2 }, // 8・SE（第2・3世代）
];

export const splashFileName = (s: { w: number; h: number; dpr: number }) => `splash-${s.w * s.dpr}x${s.h * s.dpr}.png`;
