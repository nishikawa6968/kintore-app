"""体の筋肉図の画像をなぞって SVG パスにする共通処理（trace-bodymap.py / make-tpose.py で使う）"""
import re
import numpy as np
from scipy import ndimage
from skimage import measure, morphology


def segment(a):
    """背景（暗い色）と、白い区切り線で分かれた色のかたまり（筋肉）に分ける。
    戻り値：(体のマスク, 筋肉ごとの番号つき画像)"""
    gray = a.mean(axis=2)
    bg = a.max(axis=2) < 70
    lines = morphology.white_tophat(gray, morphology.disk(3)) > 14
    colored = ~bg & ~lines & (a.min(axis=2) <= 236)
    colored = morphology.binary_opening(colored, morphology.disk(1))
    body = morphology.binary_opening(ndimage.binary_fill_holes(~bg), morphology.disk(2))
    return body, measure.label(colored, connectivity=1)


def contour_paths(mask, tol=0.7):
    """マスクの輪郭を、なめらかな SVG パス（2次ベジェ）にする。面積の大きい順"""
    m = ndimage.gaussian_filter(mask.astype(float), 0.9)
    out = []
    for c in measure.find_contours(np.pad(m, 1), 0.5):
        if len(c) < 12:
            continue
        p = measure.approximate_polygon(c, tolerance=tol)[:-1] - 1  # (row, col)
        if len(p) < 4:
            continue
        pts = [(x, y) for y, x in p]
        n = len(pts)
        mids = [((pts[i][0] + pts[(i + 1) % n][0]) / 2, (pts[i][1] + pts[(i + 1) % n][1]) / 2) for i in range(n)]
        d = f'M{mids[-1][0]:.1f} {mids[-1][1]:.1f}'
        for i in range(n):
            d += f'Q{pts[i][0]:.1f} {pts[i][1]:.1f} {mids[i][0]:.1f} {mids[i][1]:.1f}'
        area = abs(np.sum(p[:, 1] * np.roll(p[:, 0], 1) - p[:, 0] * np.roll(p[:, 1], 1))) / 2
        out.append((d + 'Z', area))
    return sorted(out, key=lambda t: -t[1])


def shift(d, ox, oy):
    """パスの座標を (ox, oy) だけずらす（x と y が交互に並ぶ前提）"""
    state = [0]

    def rep(m):
        state[0] ^= 1
        return f'{float(m.group()) - (ox if state[0] else oy):.1f}'

    return re.sub(r'-?\d+\.\d+', rep, d)


def muscle_path(lab, label):
    """番号のかたまりを少し太らせて（区切り線の分を戻して）輪郭にする"""
    paths = contour_paths(morphology.binary_dilation(lab == label, morphology.disk(1)))
    return paths[0][0] if paths else None
