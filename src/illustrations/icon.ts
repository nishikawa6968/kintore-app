import { GROUND_ARC, MUSCLE_MAN } from './shapes.ts';

/**
 * アプリアイコンの SVG。青い背景に、T の字のポーズでムキムキの白い人。
 * scale は人の大きさ（Android の丸く切り抜かれるアイコンでは小さめにする）。
 */
export function appIconSvg(scale = 0.86) {
  const body = MUSCLE_MAN.body.map((d) => `<path d="${d}" fill="#ffffff"/>`).join('');
  const lines = MUSCLE_MAN.lines
    .map((d) => `<path d="${d}" fill="none" stroke="#7eb0ee" stroke-width="1.3" stroke-linecap="round"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4c8fe4"/><stop offset="1" stop-color="#13478e"/></linearGradient></defs>
<rect width="100" height="100" fill="url(#bg)"/>
<g transform="translate(50 52) scale(${scale}) translate(-50 -52)"><path d="${GROUND_ARC}" fill="#adcdf5" opacity="0.7"/>${body}${lines}</g>
</svg>`;
}
