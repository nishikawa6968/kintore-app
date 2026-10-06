/** 連続しすぎないように、これより短い間隔の振動は省く(ms) */
const MIN_INTERVAL = 35;
let last = 0;

/**
 * ロールが1目盛り動いたときの「コツッ」という軽い振動。
 * - Android など：Vibration API
 * - iPhone（iOS 18 以降）：Safari に振動の命令がないので、スイッチ型チェックボックスを
 *   切り替えたときに OS が鳴らす触覚フィードバックを利用する
 * どちらも使えない環境では何もしない。
 */
export function tick() {
  const now = performance.now();
  if (now - last < MIN_INTERVAL) return;
  last = now;

  if (typeof navigator.vibrate === 'function') {
    navigator.vibrate(8);
    return;
  }
  const label = document.createElement('label');
  label.ariaHidden = 'true';
  label.style.display = 'none';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('switch', '');
  label.appendChild(input);
  document.head.appendChild(label);
  label.click();
  label.remove();
}
