"""
参考画像（体の前と後ろの筋肉図）をなぞって、src/illustrations/bodyShapes.ts を作る。
使い方：python3 scripts/trace-bodymap.py <参考画像のパス>
白い区切り線で分かれた色のかたまりを1つの筋肉として輪郭を取り出し、部位に割り当てる。
（参考画像そのものはリポジトリに入れない）
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage
from skimage import measure, morphology

src = sys.argv[1]
a = np.array(Image.open(src).convert('RGB')).astype(float)
gray = a.mean(axis=2)
V = a.max(axis=2)
mn = a.min(axis=2)
bg = V < 70

# まわりより明るい細い線を区切りとみなし、色のかたまりを筋肉として番号をふる
lines = morphology.white_tophat(gray, morphology.disk(3)) > 14
colored = ~bg & ~lines & (mn <= 236)
colored = morphology.binary_opening(colored, morphology.disk(1))
lab = measure.label(colored, connectivity=1)

# 番号 → 部位（trace-debug で確認した対応）。頭（髪）は hair、それ以外の小さなかけらは捨てる
PART = {}
def put(part, *ids):
    for i in ids:
        PART[i] = part
put('hair', 1, 2)
put('shoulder', 6, 7, 8, 9, 10, 11)
put('chest', 14, 15)
put('arm', 23, 24, 27, 28, 40, 41, 42, 43, 25, 29, 30, 26, 38, 39)
put('abs', 31, 32, 35, 36, 46, 47, 48, 49, 56, 57, 33, 34, 44, 45)
put('back', 4, 5, 12, 13, 17, 18, 20, 21, 22)
put('leg', 52, 53, 59, 60, 63, 64, 70, 79, 80, 85, 86, 87, 88,
    50, 51, 68, 69, 71, 72, 73, 74, 75, 76, 77, 78, 81, 82, 83, 84)

SPLIT_X = 370  # 前と後ろの図の境目（元画像の x）

def contour_paths(mask, tol=0.7):
    """マスクの外側の輪郭を、なめらかな SVG パス（2次ベジェ）にする"""
    m = ndimage.gaussian_filter(mask.astype(float), 0.9)
    out = []
    for c in measure.find_contours(np.pad(m, 1), 0.5):
        if len(c) < 12:
            continue
        p = measure.approximate_polygon(c, tolerance=tol)[:-1] - 1  # (row, col)
        if len(p) < 4:
            continue
        pts = [(x, y) for y, x in p]
        mids = [((pts[i][0] + pts[(i + 1) % len(pts)][0]) / 2, (pts[i][1] + pts[(i + 1) % len(pts)][1]) / 2) for i in range(len(pts))]
        d = f'M{mids[-1][0]:.1f} {mids[-1][1]:.1f}'
        for i in range(len(pts)):
            d += f'Q{pts[i][0]:.1f} {pts[i][1]:.1f} {mids[i][0]:.1f} {mids[i][1]:.1f}'
        out.append((d + 'Z', abs(np.sum(p[:, 1] * np.roll(p[:, 0], 1) - p[:, 0] * np.roll(p[:, 1], 1))) / 2))
    return out

# 体のシルエット（前・後ろそれぞれ一番大きい輪郭）
body = ndimage.binary_fill_holes(~bg)
body = morphology.binary_opening(body, morphology.disk(2))
xs = np.where(body.any(axis=0))[0]
ys = np.where(body.any(axis=1))[0]
ox, oy = xs.min() - 2, ys.min() - 2
W, H = xs.max() - ox + 2, ys.max() - oy + 2

def shift(d):
    # 座標を左上が 0,0 になるようにずらす
    nums = iter(float(n) for n in __import__('re').findall(r'-?\d+\.\d+', d))
    def rep(m, state=[0]):
        v = float(m.group())
        state[0] ^= 1
        return f'{v - (ox if state[0] else oy):.1f}'
    return __import__('re').sub(r'-?\d+\.\d+', rep, d)

views = {}
for side, sl in (('front', np.s_[:, :SPLIT_X]), ('back', np.s_[:, SPLIT_X:])):
    m = np.zeros_like(body)
    m[sl] = body[sl]
    paths = sorted(contour_paths(m, 1.0), key=lambda t: -t[1])
    views[side] = {'base': shift(paths[0][0]), 'regions': [], 'hair': None}

for p in measure.regionprops(lab):
    part = PART.get(p.label)
    if not part:
        continue
    side = 'front' if p.centroid[1] < SPLIT_X else 'back'
    mask = morphology.binary_dilation(lab == p.label, morphology.disk(1))
    paths = sorted(contour_paths(mask), key=lambda t: -t[1])
    if not paths:
        continue
    d = shift(paths[0][0])
    if part == 'hair':
        views[side]['hair'] = d
    else:
        views[side]['regions'].append((part, d))

with open('src/illustrations/bodyShapes.ts', 'w') as f:
    f.write('// このファイルは scripts/trace-bodymap.py で自動生成（参考画像をなぞった体の前と後ろの筋肉図）\n')
    f.write("import type { BodyPart } from '../types';\n\n")
    f.write('export interface Region {\n  part: BodyPart;\n  d: string;\n}\n\n')
    f.write(f'/** 図全体の大きさ（前と後ろを横に並べた座標） */\nexport const BODY_VIEWBOX = {{ width: {W:.0f}, height: {H:.0f} }};\n\n')
    for side in ('front', 'back'):
        v = views[side]
        name = side.upper()
        f.write(f'export const {name}_BASE = {v["base"]!r};\n'.replace("'", "'"))
        f.write(f'export const {name}_HAIR = {v["hair"]!r};\n')
        f.write(f'export const {name}_REGIONS: Region[] = [\n')
        for part, d in v['regions']:
            f.write(f"  {{ part: '{part}', d: '{d}' }},\n")
        f.write('];\n\n')
print('written', W, H, {k: len(v['regions']) for k, v in views.items()})
