import { GROUND_ARC } from './shapes.ts';
import { TPOSE_BASE, TPOSE_HAIR, TPOSE_MUSCLES, TPOSE_VIEWBOX } from './tposeShapes.ts';

/**
 * アプリアイコンの SVG。青い背景に、T ポーズで足を閉じて立つ白い人（人の図と同じ絵柄）。
 * scale は人の大きさ（Android の丸く切り抜かれるアイコンでは小さめにする）。
 */
export function appIconSvg(scale = 0.86) {
  const { width, height } = TPOSE_VIEWBOX;
  // 人の高さを 100 の座標で 92×scale にし、真ん中に置く
  const s = (92 * scale) / height;
  const tx = 50 - (width * s) / 2;
  const ty = 52 - (height * s) / 2;
  const muscles = TPOSE_MUSCLES.map((d) => `<path d="${d}" fill="#dbe8fb" stroke="#ffffff" stroke-width="2.6" stroke-linejoin="round"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4c8fe4"/><stop offset="1" stop-color="#13478e"/></linearGradient></defs>
<rect width="100" height="100" fill="url(#bg)"/>
<g transform="translate(50 52) scale(${scale}) translate(-50 -52)"><path d="${GROUND_ARC}" fill="#adcdf5" opacity="0.6"/></g>
<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(5)})">
<path d="${TPOSE_BASE}" fill="#ffffff"/><path d="${TPOSE_HAIR}" fill="#c6d4ea"/>${muscles}
</g>
</svg>`;
}
