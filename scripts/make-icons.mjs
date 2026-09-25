// 依存なしでアプリアイコン（青地に白いダンベル）のPNGを生成する
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

function icon(size) {
  const px = Buffer.alloc(size * size * 3);
  const set = (x, y, [r, g, b]) => {
    const i = (y * size + x) * 3;
    px[i] = r; px[i + 1] = g; px[i + 2] = b;
  };
  const top = [0x4c, 0x8f, 0xe4], bottom = [0x13, 0x47, 0x8e];
  for (let y = 0; y < size; y++) {
    const t = y / size;
    const c = top.map((v, i) => Math.round(v + (bottom[i] - v) * t));
    for (let x = 0; x < size; x++) set(x, y, c);
  }
  // 単位 = size/100 で描く（中央70%以内に収めてマスカブル対応）
  const u = size / 100;
  const rect = (x, y, w, h) => {
    for (let yy = Math.round(y * u); yy < Math.round((y + h) * u); yy++)
      for (let xx = Math.round(x * u); xx < Math.round((x + w) * u); xx++) set(xx, yy, [255, 255, 255]);
  };
  rect(24, 47, 52, 6);   // バー
  rect(28, 33, 8, 34);   // 左プレート（大）
  rect(64, 33, 8, 34);   // 右プレート（大）
  rect(21, 39, 6, 22);   // 左プレート（小）
  rect(73, 39, 6, 22);   // 右プレート（小）
  rect(17, 46, 4, 8);    // 左端
  rect(79, 46, 4, 8);    // 右端

  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) px.copy(raw, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

writeFileSync('public/icon-192.png', icon(192));
writeFileSync('public/icon-512.png', icon(512));
writeFileSync('public/apple-touch-icon.png', icon(180));
console.log('icons written');
