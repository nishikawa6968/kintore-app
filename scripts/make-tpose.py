"""
参考画像の前向きの人を、両腕を真横に上げて足を閉じた T ポーズに組み替えた画像を作る。
使い方：PYTHONPATH=scripts python3 scripts/make-tpose.py <参考画像のパス> [確認用PNGの出力先]
胴体・両腕・両脚に切り分け、腕は肩を軸に回し、脚は足先を内側に寄せて組み直す。
組み直した画像をなぞって src/illustrations/tposeShapes.ts（アプリアイコン用）を作る。
"""
import sys
import math
import numpy as np
from PIL import Image

src = sys.argv[1]
out = sys.argv[2] if len(sys.argv) > 2 else None
img = Image.open(src).convert('RGB')
a = np.array(img).astype(float)
fg = (a.max(axis=2) >= 70)
fg[:, 370:] = False  # 前向きの図だけ

PAD = 140
H, W = fg.shape
rgba = np.zeros((H + 2 * PAD, W + 2 * PAD, 4), np.uint8)
rgba[PAD:PAD + H, PAD:PAD + W, :3] = a.astype(np.uint8)
rgba[PAD:PAD + H, PAD:PAD + W, 3] = fg * 255
yy, xx = np.mgrid[0:rgba.shape[0], 0:rgba.shape[1]]
X, Y = xx - PAD, yy - PAD  # 元画像の座標

def side(px, py, qx, qy):
    """点 (X, Y) が直線 p→q のどちら側にあるか"""
    return (qx - px) * (Y - py) - (qy - py) * (X - px)

alpha = rgba[..., 3] > 0
from skimage import measure
# わきの下より下では、腕（手まで）と胴体・脚は離れているので、手につながっている部分を腕とする
below = measure.label(alpha & (Y >= 198), connectivity=2)
hand_l = below[290 + PAD, 95 + PAD]
hand_r = below[290 + PAD, 300 + PAD]
# わきの下より上は、肩の上（140,126）→ わきの下（150,200）の線より外側を腕とする
left_arm = alpha & (((Y < 198) & (Y > 120) & (side(140, 126, 150, 200) > 0)) | (below == hand_l))
right_arm = alpha & (((Y < 198) & (Y > 120) & (side(256, 126, 246, 200) < 0)) | (below == hand_r))
# 脚：股（y=300）より下を左右に分ける
left_leg = alpha & (Y >= 300) & (X < 198) & ~left_arm
right_leg = alpha & (Y >= 300) & (X >= 198) & ~right_arm
torso = alpha & ~left_arm & ~right_arm & ~left_leg & ~right_leg

def layer(mask):
    l = rgba.copy()
    l[..., 3] = np.where(mask, 255, 0)
    return Image.fromarray(l, 'RGBA')

def rot(mask, deg, cx, cy):
    # PIL は反時計回りが正。中心は元画像の座標
    return layer(mask).rotate(deg, resample=Image.BICUBIC, center=(cx + PAD, cy + PAD))

# 腕の向き：肩（146,150）→ 手（95,300）を、真横（左）へ
ang = math.degrees(math.atan2(300 - 150, 95 - 146))  # 下向き寄り
arm_deg = ang - 180  # 画像座標での回転量（時計回り）→ PIL では負
canvas = Image.new('RGBA', (rgba.shape[1], rgba.shape[0]), (13, 10, 21, 255))
# 脚：腰（y=302）の位置はそのまま、下へいくほど内側へずらす（内ももの線が縦になるまで）
k = (192 - 164) / (540 - 302)
y0 = 302 + PAD
def shear(mask, kk):
    # 出力の (x, y) に、入力の (x - kk*(y - y0), y) を持ってくる
    return layer(mask).transform(canvas.size, Image.AFFINE, (1, -kk, kk * y0, 0, 1, 0), resample=Image.BICUBIC)
leg_deg = k
canvas.alpha_composite(shear(left_leg, k))
canvas.alpha_composite(shear(right_leg, -k))
canvas.alpha_composite(layer(torso))
# 腕を太くする：真横に回した腕を、太さ方向（縦）にだけ引き伸ばす。
# 付け根（肩）ほど太く、手に向かってだんだん弱める
from scipy import ndimage

def thicken(arm_img, shoulder_x, outward):
    """outward：腕が伸びる向き（左腕は -1、右腕は +1）"""
    a = np.array(arm_img).astype(float)
    alpha = a[..., 3] > 8
    h, w = alpha.shape
    ys = np.arange(h)[:, None].repeat(w, 1).astype(float)
    xs = np.arange(w)[None, :].repeat(h, 0).astype(float)
    src_y = ys.copy()
    cols = np.where(alpha.any(axis=0))[0]
    length = max(1, abs(cols.max() - cols.min()))
    for x in cols:
        rows = np.where(alpha[:, x])[0]
        center = (rows.min() + rows.max()) / 2
        d = max(0.0, (x - shoulder_x) * outward) / length  # 0 = 肩、1 = 手
        k = 1.45 - 0.30 * min(d, 1.0)
        src_y[:, x] = center + (ys[:, x] - center) / k
    out = np.stack([ndimage.map_coordinates(a[..., c], [src_y, xs], order=1) for c in range(4)], axis=-1)
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), 'RGBA')

canvas.alpha_composite(thicken(rot(left_arm, arm_deg, 146, 150), 146 + PAD, -1))
canvas.alpha_composite(thicken(rot(right_arm, -arm_deg, 250, 150), 250 + PAD, +1))
if out:
    canvas.convert('RGB').save(out)

# 組み直した画像をなぞる
from trace_lib import contour_paths, muscle_path, segment, shift
t = np.array(canvas.convert('RGB')).astype(float)
body, lab = segment(t)
xs = np.where(body.any(axis=0))[0]
ys = np.where(body.any(axis=1))[0]
ox, oy = xs.min() - 2, ys.min() - 2
W, H = xs.max() - ox + 2, ys.max() - oy + 2
props = [p for p in measure.regionprops(lab) if p.area > 40]
hair = min(props, key=lambda p: p.centroid[0])  # 一番上のかたまりが頭（髪）
muscles = [shift(d, ox, oy) for d in (muscle_path(lab, p.label) for p in props if p.label != hair.label) if d]
with open('src/illustrations/tposeShapes.ts', 'w') as f:
    f.write('// このファイルは scripts/make-tpose.py で自動生成（人の図を T ポーズに組み替えたもの。アプリアイコン用）\n\n')
    f.write(f'export const TPOSE_VIEWBOX = {{ width: {W:.0f}, height: {H:.0f} }};\n')
    f.write(f'export const TPOSE_BASE = {shift(contour_paths(body, 1.0)[0][0], ox, oy)!r};\n')
    f.write(f'export const TPOSE_HAIR = {shift(muscle_path(lab, hair.label), ox, oy)!r};\n')
    f.write('export const TPOSE_MUSCLES = [\n' + ''.join(f"  '{d}',\n" for d in muscles) + '];\n')
print('arm', round(arm_deg, 1), 'muscles', len(muscles), 'size', W, H)
