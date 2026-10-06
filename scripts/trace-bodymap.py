"""
参考画像（体の前と後ろの筋肉図）をなぞって、src/illustrations/bodyShapes.ts を作る。
使い方：python3 scripts/trace-bodymap.py <参考画像のパス>
白い区切り線で分かれた色のかたまりを1つの筋肉として輪郭を取り出し、部位に割り当てる。
（参考画像そのものはリポジトリに入れない）
"""
import sys
import numpy as np
from PIL import Image
from skimage import measure
from trace_lib import contour_paths, muscle_path, segment, shift

src = sys.argv[1]
a = np.array(Image.open(src).convert('RGB')).astype(float)
body, lab = segment(a)

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

xs = np.where(body.any(axis=0))[0]
ys = np.where(body.any(axis=1))[0]
ox, oy = xs.min() - 2, ys.min() - 2
W, H = xs.max() - ox + 2, ys.max() - oy + 2

views = {}
for side, sl in (('front', np.s_[:, :SPLIT_X]), ('back', np.s_[:, SPLIT_X:])):
    m = np.zeros_like(body)
    m[sl] = body[sl]
    views[side] = {'base': shift(contour_paths(m, 1.0)[0][0], ox, oy), 'regions': [], 'hair': None}

for p in measure.regionprops(lab):
    part = PART.get(p.label)
    if not part:
        continue
    side = 'front' if p.centroid[1] < SPLIT_X else 'back'
    d = muscle_path(lab, p.label)
    if not d:
        continue
    d = shift(d, ox, oy)
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
        f.write(f'export const {name}_BASE = {v["base"]!r};\n')
        f.write(f'export const {name}_HAIR = {v["hair"]!r};\n')
        f.write(f'export const {name}_REGIONS: Region[] = [\n')
        for part, d in v['regions']:
            f.write(f"  {{ part: '{part}', d: '{d}' }},\n")
        f.write('];\n\n')
print('written', W, H, {k: len(v['regions']) for k, v in views.items()})
