"""
参考画像（体の前と後ろの筋肉図）の人を、腕を太くして足を閉じたポーズに組み替えてなぞる。
- src/illustrations/bodyShapes.ts：腕を体から30度離したポーズの前と後ろ（アプリ内の人の図）
- src/illustrations/iconShapes.ts：腕を真横に上げた T ポーズの前（アプリアイコン）

使い方：PYTHONPATH=scripts python3 scripts/make-tpose.py <参考画像のパス> [確認用PNGの出力先フォルダ]

前と後ろそれぞれを胴体・両腕・両脚に切り分け、腕は肩を軸に真横へ回して太く（特に肩）し、
脚は足先を内側に寄せる。筋肉ごとの番号（どの部位か）も同じように動かして、組み替えた後も
部位が分かるようにする。参考画像そのものはリポジトリに入れない。
"""
import math
import sys

import numpy as np
from PIL import Image
from scipy import ndimage
from skimage import measure

from trace_lib import contour_paths, muscle_path, segment, shift

src = sys.argv[1]
debug_dir = sys.argv[2] if len(sys.argv) > 2 else None
a = np.array(Image.open(src).convert('RGB')).astype(float)
_, lab0 = segment(a)

# 元画像の筋肉の番号 → 部位（番号は trace_lib.segment の結果。確認用画像で対応を確かめた）
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

# 前と後ろの図の、切り分けと回転の基準になる位置（元画像の座標）
VIEWS = {
    'front': dict(
        x=(0, 370),
        arms=[  # 肩の上→わきの下の線より外側が腕。pivot を軸に、hand が真横に来るよう回す
            dict(cut=((140, 126), (150, 200)), outside=1, pivot=(146, 150), hand=(95, 290)),
            dict(cut=((256, 126), (246, 200)), outside=-1, pivot=(250, 150), hand=(300, 290)),
        ],
        crotch_y=300, split_x=198,
        legs=[dict(pivot=(192, 302), k=28 / 238), dict(pivot=(204, 302), k=-28 / 238)],
    ),
    'back': dict(
        x=(370, 733),
        arms=[
            dict(cut=((480, 126), (490, 200)), outside=1, pivot=(486, 150), hand=(435, 290)),
            dict(cut=((596, 126), (586, 200)), outside=-1, pivot=(590, 150), hand=(640, 290)),
        ],
        crotch_y=302, split_x=538,
        legs=[dict(pivot=(532, 304), k=29 / 236), dict(pivot=(544, 304), k=-29 / 236)],
    ),
}

PAD = 170
BG = (13, 10, 21)


def build_view(v, arm_deg):
    """1つの図を組み替えた (RGB 画像, 筋肉番号の画像) を返す。arm_deg：腕と体の角度（90 で T ポーズ）"""
    H, W = lab0.shape
    fg = a.max(axis=2) >= 70
    keep = np.zeros_like(fg)
    keep[:, v['x'][0]:v['x'][1]] = True
    fg &= keep
    size = (H + 2 * PAD, W + 2 * PAD)
    rgba = np.zeros(size + (4,), np.uint8)
    rgba[PAD:PAD + H, PAD:PAD + W, :3] = a.astype(np.uint8)
    rgba[PAD:PAD + H, PAD:PAD + W, 3] = fg * 255
    labels = np.zeros(size, np.int32)
    labels[PAD:PAD + H, PAD:PAD + W] = np.where(fg, lab0, 0)
    yy, xx = np.mgrid[0:size[0], 0:size[1]]
    X, Y = xx - PAD, yy - PAD
    alpha = rgba[..., 3] > 0

    def side(p, q):
        (px, py), (qx, qy) = p, q
        return (qx - px) * (Y - py) - (qy - py) * (X - px)

    # わきの下より下は、腕（手まで）が胴体・脚と離れているので、手につながる部分を腕とする
    below = measure.label(alpha & (Y >= 198), connectivity=2)
    arm_masks = []
    for arm in v['arms']:
        hx, hy = arm['hand']
        upper = (Y < 198) & (Y > 120) & (side(*arm['cut']) * arm['outside'] > 0)
        arm_masks.append(alpha & (upper | (below == below[hy + PAD, hx + PAD])))
    any_arm = arm_masks[0] | arm_masks[1]
    leg_masks = [
        alpha & (Y >= v['crotch_y']) & (X < v['split_x']) & ~any_arm,
        alpha & (Y >= v['crotch_y']) & (X >= v['split_x']) & ~any_arm,
    ]
    torso = alpha & ~any_arm & ~leg_masks[0] & ~leg_masks[1]

    canvas = Image.new('RGBA', (size[1], size[0]), BG + (255,))
    lab_out = np.zeros(size, np.int32)

    def put_layer(img, lab):
        nonlocal lab_out
        canvas.alpha_composite(img)
        m = np.array(img)[..., 3] > 128
        lab_out = np.where(m, lab, lab_out)

    def layer(mask):
        l = rgba.copy()
        l[..., 3] = np.where(mask, 255, 0)
        return Image.fromarray(l, 'RGBA'), Image.fromarray(np.where(mask, labels, 0).astype(np.int32), 'I')

    # 脚：腰の位置はそのまま、下へいくほど内側へずらす（内ももの線が縦になるまで）
    for mask, leg in zip(leg_masks, v['legs']):
        img, lab = layer(mask)
        y0 = leg['pivot'][1] + PAD
        k = leg['k']
        m = (1, -k, k * y0, 0, 1, 0)
        put_layer(img.transform(img.size, Image.AFFINE, m, resample=Image.BICUBIC),
                  np.array(lab.transform(lab.size, Image.AFFINE, m, resample=Image.NEAREST)))
    img, lab = layer(torso)
    put_layer(img, np.array(lab))

    # 腕：肩を軸にいったん真横へ回して太さ方向（縦）に引き伸ばし（肩ほど太く）、
    # そこから arm_deg（体との角度）まで下ろす
    for mask, arm in zip(arm_masks, v['arms']):
        img, lab = layer(mask)
        (px, py), (hx, hy) = arm['pivot'], arm['hand']
        ang = math.degrees(math.atan2(hy - py, hx - px))
        deg = (ang - 180) if arm['outside'] > 0 else ang  # 左腕は左へ、右腕は右へ
        center = (px + PAD, py + PAD)
        r_img = img.rotate(deg, resample=Image.BICUBIC, center=center)
        r_lab = np.array(lab.rotate(deg, resample=Image.NEAREST, center=center))
        t_img, t_lab = thicken(r_img, r_lab, px + PAD, -arm['outside'])
        lower = (90 - arm_deg) * (1 if arm['outside'] > 0 else -1)
        if lower:
            t_img = t_img.rotate(lower, resample=Image.BICUBIC, center=center)
            t_lab = np.array(Image.fromarray(t_lab.astype(np.int32), 'I').rotate(lower, resample=Image.NEAREST, center=center))
        put_layer(t_img, t_lab)
    return canvas.convert('RGB'), lab_out


def thicken(img, lab, shoulder_x, outward):
    """真横の腕を縦に引き伸ばす。outward：腕が伸びる向き（左腕 -1、右腕 +1）"""
    arr = np.array(img).astype(float)
    alpha = arr[..., 3] > 8
    h, w = alpha.shape
    ys = np.arange(h, dtype=float)[:, None].repeat(w, 1)
    xs = np.arange(w, dtype=float)[None, :].repeat(h, 0)
    src_y = ys.copy()
    cols = np.where(alpha.any(axis=0))[0]
    length = max(1, cols.max() - cols.min())
    for x in cols:
        rows = np.where(alpha[:, x])[0]
        c = (rows.min() + rows.max()) / 2
        d = max(0.0, (x - shoulder_x) * outward) / length  # 0 = 肩、1 = 手
        k = 1.45 - 0.30 * min(d, 1.0)
        src_y[:, x] = c + (ys[:, x] - c) / k
    out = np.stack([ndimage.map_coordinates(arr[..., ch], [src_y, xs], order=1) for ch in range(4)], axis=-1)
    lab_t = ndimage.map_coordinates(lab, [src_y, xs], order=0)
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), 'RGBA'), lab_t


def trace_view(rgb, lab_t):
    """組み替えた図をなぞる。(体の輪郭, 髪, [(部位, パス)], 左上の座標, 幅, 高さ)
    筋肉は、元画像で切り分けた番号の地図（絵と同じように動かしたもの）からそのまま取り出す。
    組み替えた絵を切り分け直すと、回したり太くした所で区切りがつぶれて筋肉がくっつくため。"""
    t = np.array(rgb).astype(float)
    body, _ = segment(t)
    xs = np.where(body.any(axis=0))[0]
    ys = np.where(body.any(axis=1))[0]
    ox, oy = xs.min() - 2, ys.min() - 2
    w, h = xs.max() - ox + 2, ys.max() - oy + 2
    regions, hair = [], None
    for label in np.unique(lab_t):
        part = PART.get(int(label))
        if not part or (lab_t == label).sum() <= 40:
            continue
        d = muscle_path(lab_t, label)
        if not d:
            continue
        if part == 'hair':
            hair = d
        else:
            regions.append((part, d))
    return contour_paths(body, 1.0)[0][0], hair, regions, (ox, oy), w, h


def write_body(path, arm_deg, debug_name):
    traced = {}
    for name, v in VIEWS.items():
        rgb, lab_t = build_view(v, arm_deg)
        if debug_dir:
            rgb.save(f'{debug_dir}/{debug_name}-{name}.png')
        traced[name] = trace_view(rgb, lab_t)
    GAP = 30  # 前と後ろの図のすき間
    top = min(t[3][1] for t in traced.values())
    height = max(t[3][1] + t[5] for t in traced.values()) - top
    fw = traced['front'][4]
    offsets = {'front': (traced['front'][3][0], top), 'back': (traced['back'][3][0] - fw - GAP, top)}
    total_w = fw + GAP + traced['back'][4]
    with open(path, 'w') as f:
        f.write('// このファイルは scripts/make-tpose.py で自動生成（参考画像の人の腕を体から30度離し、太くしてなぞった、体の前と後ろの筋肉図）\n')
        f.write("import type { BodyPart } from '../types';\n\n")
        f.write('export interface Region {\n  part: BodyPart;\n  d: string;\n}\n\n')
        f.write(f'/** 前と後ろを横に並べた図全体の大きさ */\nexport const BODY_VIEWBOX = {{ width: {total_w:.0f}, height: {height:.0f} }};\n')
        f.write(f'/** 前の図だけの大きさ（左上は同じ。空の日のイラスト用） */\nexport const FRONT_VIEWBOX = {{ width: {fw:.0f}, height: {height:.0f} }};\n\n')
        for name in ('front', 'back'):
            base, hair, regions, _, _, _ = traced[name]
            ox, oy = offsets[name]
            N = name.upper()
            f.write(f'export const {N}_BASE = {shift(base, ox, oy)!r};\n')
            f.write(f'export const {N}_HAIR = {shift(hair, ox, oy)!r};\n')
            f.write(f'export const {N}_REGIONS: Region[] = [\n')
            for part, d in regions:
                f.write(f"  {{ part: '{part}', d: '{shift(d, ox, oy)}' }},\n")
            f.write('];\n\n')
    return {n: sorted({p for p, _ in t[2]}) for n, t in traced.items()}


def write_icon(path):
    rgb, lab_t = build_view(VIEWS['front'], 90)
    if debug_dir:
        rgb.save(f'{debug_dir}/icon-front.png')
    base, hair, regions, (ox, oy), w, h = trace_view(rgb, lab_t)
    with open(path, 'w') as f:
        f.write('// このファイルは scripts/make-tpose.py で自動生成（人の図を腕を真横に上げた T ポーズにしたもの。アプリアイコン用）\n\n')
        f.write(f'export const ICON_VIEWBOX = {{ width: {w:.0f}, height: {h:.0f} }};\n')
        f.write(f'export const ICON_BASE = {shift(base, ox, oy)!r};\n')
        f.write(f'export const ICON_HAIR = {shift(hair, ox, oy)!r};\n')
        f.write('export const ICON_MUSCLES = [\n' + ''.join(f"  '{shift(d, ox, oy)}',\n" for _, d in regions) + '];\n')
    return len(regions)


print('body', write_body('src/illustrations/bodyShapes.ts', 30, 'body'))
print('icon muscles', write_icon('src/illustrations/iconShapes.ts'))
