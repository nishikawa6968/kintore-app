import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';

registerSW({ immediate: true });

// ブラウザに記録を勝手に消されないよう永続化をお願いする
navigator.storage?.persist?.();

// 実際に見えている画面の高さを CSS の --app-h に入れる（index.css の説明を参照）
const setAppHeight = () => {
  document.documentElement.style.setProperty('--app-h', `${window.innerHeight}px`);
  window.scrollTo(0, 0);
};
// iPhone は向きを変えた直後、まだ前の向きの高さを返すことがあるので、少し時間をおいて何度か測り直す
const timers: number[] = [];
const remeasure = () => {
  setAppHeight();
  timers.splice(0).forEach(clearTimeout);
  for (const ms of [100, 300, 700]) timers.push(window.setTimeout(setAppHeight, ms));
};
setAppHeight();
window.addEventListener('resize', remeasure);
window.addEventListener('orientationchange', remeasure);
// キーボードを閉じたあと、画面がずれたまま残らないように元の位置に戻す
window.addEventListener('focusout', remeasure);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
