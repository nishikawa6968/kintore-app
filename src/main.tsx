import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';

registerSW({ immediate: true });

// ブラウザに記録を勝手に消されないよう永続化をお願いする
navigator.storage?.persist?.();

// 実際に見えている画面の高さを CSS の --app-h に入れる（index.css の説明を参照）
const setAppHeight = () => document.documentElement.style.setProperty('--app-h', `${window.innerHeight}px`);
setAppHeight();
window.addEventListener('resize', setAppHeight);
window.addEventListener('orientationchange', setAppHeight);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
