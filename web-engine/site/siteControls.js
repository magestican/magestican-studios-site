




















export const OFFLINE_HREF = '/#offline-pack';

export const STRINGS = {
  en: {
    open: 'Screen and app options',
    close: 'Close',
    fullscreen: 'Full screen',
    exitFullscreen: 'Exit full screen',
    install: 'Install the app',
    offline: 'Play offline',
    iosHint: 'Tap Share, then Add to Home Screen. The games then open full screen.',
    manualHint: 'Open your browser menu and choose Install or Add to Home Screen.',
  },
  es: {
    open: 'Opciones de pantalla y aplicación',
    close: 'Cerrar',
    fullscreen: 'Pantalla completa',
    exitFullscreen: 'Salir de pantalla completa',
    install: 'Instalar la aplicación',
    offline: 'Jugar sin internet',
    iosHint: 'Toca Compartir y luego Añadir a pantalla de inicio. Los juegos se abren a pantalla completa.',
    manualHint: 'Abre el menú del navegador y elige Instalar o Añadir a pantalla de inicio.',
  },
  pt: {
    open: 'Opções de tela e aplicativo',
    close: 'Fechar',
    fullscreen: 'Tela cheia',
    exitFullscreen: 'Sair da tela cheia',
    install: 'Instalar o aplicativo',
    offline: 'Jogar sem internet',
    iosHint: 'Toque em Compartilhar e depois em Adicionar à Tela de Início. Os jogos abrem em tela cheia.',
    manualHint: 'Abra o menu do navegador e escolha Instalar ou Adicionar à tela inicial.',
  },
  tl: {
    open: 'Mga opsyon sa screen at app',
    close: 'Isara',
    fullscreen: 'Full screen',
    exitFullscreen: 'Umalis sa full screen',
    install: 'I-install ang app',
    offline: 'Maglaro nang walang internet',
    iosHint: 'I-tap ang Share, tapos Add to Home Screen. Magbubukas ang mga laro nang full screen.',
    manualHint: 'Buksan ang menu ng browser at piliin ang Install o Add to Home Screen.',
  },
  id: {
    open: 'Opsi layar dan aplikasi',
    close: 'Tutup',
    fullscreen: 'Layar penuh',
    exitFullscreen: 'Keluar dari layar penuh',
    install: 'Pasang aplikasi',
    offline: 'Main tanpa internet',
    iosHint: 'Ketuk Bagikan, lalu Tambah ke Layar Utama. Game akan terbuka dalam layar penuh.',
    manualHint: 'Buka menu browser dan pilih Instal atau Tambahkan ke layar utama.',
  },
  ja: {
    open: '画面とアプリの設定',
    close: '閉じる',
    fullscreen: '全画面表示',
    exitFullscreen: '全画面表示を終了',
    install: 'アプリをインストール',
    offline: 'オフラインで遊ぶ',
    iosHint: '共有をタップして「ホーム画面に追加」を選ぶと、ゲームが全画面で開きます。',
    manualHint: 'ブラウザのメニューから「インストール」または「ホーム画面に追加」を選んでください。',
  },
  ko: {
    open: '화면 및 앱 옵션',
    close: '닫기',
    fullscreen: '전체 화면',
    exitFullscreen: '전체 화면 끝내기',
    install: '앱 설치',
    offline: '오프라인으로 플레이',
    iosHint: '공유를 누른 다음 홈 화면에 추가를 선택하세요. 게임이 전체 화면으로 열립니다.',
    manualHint: '브라우저 메뉴를 열고 설치 또는 홈 화면에 추가를 선택하세요.',
  },
  vi: {
    open: 'Tùy chọn màn hình và ứng dụng',
    close: 'Đóng',
    fullscreen: 'Toàn màn hình',
    exitFullscreen: 'Thoát toàn màn hình',
    install: 'Cài đặt ứng dụng',
    offline: 'Chơi không cần mạng',
    iosHint: 'Nhấn Chia sẻ, rồi chọn Thêm vào Màn hình chính. Trò chơi sẽ mở toàn màn hình.',
    manualHint: 'Mở menu trình duyệt và chọn Cài đặt hoặc Thêm vào màn hình chính.',
  },
  de: {
    open: 'Bildschirm- und App-Optionen',
    close: 'Schließen',
    fullscreen: 'Vollbild',
    exitFullscreen: 'Vollbild beenden',
    install: 'App installieren',
    offline: 'Offline spielen',
    iosHint: 'Tippe auf Teilen und dann auf „Zum Home-Bildschirm“. Die Spiele öffnen sich dann im Vollbild.',
    manualHint: 'Öffne das Browsermenü und wähle „Installieren“ oder „Zum Startbildschirm hinzufügen“.',
  },
};


export function stringsFor(lang) {
  const base = String(lang || '').toLowerCase().split('-')[0];
  return STRINGS[base] || STRINGS.en;
}






export function fullscreenApi(doc) {
  const root = doc.documentElement || {};
  const request = root.requestFullscreen || root.webkitRequestFullscreen;
  const exit = doc.exitFullscreen || doc.webkitExitFullscreen;
  const enabled = doc.fullscreenEnabled ?? doc.webkitFullscreenEnabled ?? false;
  const supported = Boolean(request && exit && enabled);
  const active = () => Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);
  return {
    supported,
    active,
    
    async toggle() {
      if (!supported) return false;
      try {
        if (active()) await exit.call(doc);
        else await request.call(root, { navigationUI: 'hide' });
        return true;
      } catch {
        
        
        return false;
      }
    },
  };
}


export function installMode({ standalone, hasPrompt, ua = '', touchPoints = 0 }) {
  if (standalone) return 'installed';
  if (hasPrompt) return 'prompt';
  
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && touchPoints > 1);
  return ios ? 'ios' : 'manual';
}


export function menuModel({ fsSupported, fsActive, install, t }) {
  const rows = [];
  const fs = { id: 'fullscreen', label: fsActive ? t.exitFullscreen : t.fullscreen };
  if (!fsSupported) fs.hint = install === 'ios' ? t.iosHint : t.manualHint;
  rows.push(fs);
  if (install !== 'installed') {
    const row = { id: 'install', label: t.install };
    if (install === 'ios') row.hint = t.iosHint;
    if (install === 'manual') row.hint = t.manualHint;
    rows.push(row);
  }
  rows.push({ id: 'offline', label: t.offline, href: OFFLINE_HREF });
  return rows;
}












export function pickSlot(candidates, obstacles) {
  let best = null;
  for (const c of candidates) {
    let area = 0;
    for (const o of obstacles) {
      const w = Math.min(c.rect.right, o.right) - Math.max(c.rect.left, o.left);
      const h = Math.min(c.rect.bottom, o.bottom) - Math.max(c.rect.top, o.top);
      if (w > 0 && h > 0) area += w * h;
    }
    if (area === 0) return { ...c, area: 0 };
    if (!best || area < best.area) best = { ...c, area };
  }
  return best;
}


export function slotCandidates(vw, vh) {
  const w = vw <= 600 ? 22 : 30;
  const h = vw <= 600 ? 44 : 48;
  const out = [];
  for (const side of ['left', 'right']) {
    for (const frac of [0.34, 0.5, 0.22, 0.66, 0.78, 0.12, 0.88]) {
      const top = Math.round(Math.min(Math.max(frac * vh - h / 2, 4), vh - h - 4));
      const left = side === 'left' ? 0 : vw - w;
      out.push({ side, top, rect: { left, top, right: left + w, bottom: top + h } });
    }
  }
  return out;
}

const CSS = `
.mg-screen { position: fixed; left: 0; top: 34%; z-index: 2147483646; font: 600 15px/1.25 system-ui, -apple-system, 'Segoe UI', sans-serif; }
.mg-screen * { box-sizing: border-box; }
.mg-screen-tab {
  display: flex; align-items: center; justify-content: center;
  width: 30px; height: 48px; padding: 0; margin: 0; cursor: pointer;
  border: 1px solid rgba(255,255,255,0.35); border-left: 0; border-radius: 0 10px 10px 0;
  background: rgba(20,22,28,0.62); color: #fff; opacity: 0.6;
  transition: opacity 0.15s, width 0.15s;
  -webkit-tap-highlight-color: transparent; touch-action: manipulation;
}
.mg-screen-tab:hover, .mg-screen-tab:focus-visible, .mg-screen[data-open="1"] .mg-screen-tab { opacity: 1; width: 36px; }
.mg-screen-tab:focus-visible, .mg-screen-row:focus-visible { outline: 3px solid #ffd257; outline-offset: 2px; }
.mg-screen-tab svg { width: 18px; height: 18px; display: block; }
.mg-screen-menu {
  position: absolute; left: 44px; top: -8px; width: min(280px, calc(100vw - 60px));
  display: none; flex-direction: column; gap: 8px; padding: 12px;
  background: rgba(20,22,28,0.96); color: #fff;
  border: 1px solid rgba(255,255,255,0.25); border-radius: 12px;
  box-shadow: 0 8px 28px rgba(0,0,0,0.45);
}
.mg-screen[data-open="1"] .mg-screen-menu { display: flex; }
.mg-screen-row {
  display: flex; align-items: center; gap: 10px; width: 100%; min-height: 46px;
  padding: 10px 14px; margin: 0; cursor: pointer; text-align: start; text-decoration: none;
  font: inherit; color: #fff; background: rgba(255,255,255,0.10);
  border: 1px solid rgba(255,255,255,0.18); border-radius: 9px;
}
.mg-screen-row:hover { background: rgba(255,255,255,0.2); }
.mg-screen-row svg { width: 20px; height: 20px; flex: 0 0 auto; }
.mg-screen-hint { margin: 0; padding: 2px 4px 4px; font-weight: 500; font-size: 13.5px; line-height: 1.4; color: #e9e4d8; }
.mg-screen-hint[hidden] { display: none; }
.mg-screen[data-side="right"] { left: auto; right: 0; }
.mg-screen[data-side="right"] .mg-screen-tab { border: 1px solid rgba(255,255,255,0.35); border-right: 0; border-radius: 10px 0 0 10px; margin-left: auto; }
.mg-screen[data-side="right"] .mg-screen-menu { left: auto; right: 44px; }
.mg-screen[data-low="1"] .mg-screen-menu { top: auto; bottom: -8px; }
@media (max-width: 600px) {
  .mg-screen-tab { width: 22px; height: 44px; }
  .mg-screen-tab svg { width: 14px; height: 14px; }
  .mg-screen-tab:hover, .mg-screen-tab:focus-visible, .mg-screen[data-open="1"] .mg-screen-tab { width: 28px; }
  .mg-screen-menu { left: 36px; }
  .mg-screen[data-side="right"] .mg-screen-menu { right: 36px; }
}
@media print { .mg-screen { display: none; } }
`;

const ICONS = {
  fullscreen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  install: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>',
  offline: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9a14 14 0 0 1 18 0M6.5 12.8a9 9 0 0 1 11 0M10 16.4a4 4 0 0 1 4 0M4 4l16 16"/></svg>',
};













export function applyCss(doc, win, css) {
  try {
    if (win && typeof win.CSSStyleSheet === 'function' && Array.isArray(doc.adoptedStyleSheets)) {
      const sheet = new win.CSSStyleSheet();
      sheet.replaceSync(css);
      doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet];
      return 'adopted';
    }
  } catch {  }
  const style = doc.createElement('style');
  style.textContent = css;
  doc.head.appendChild(style);
  return 'style';
}






export function mountSiteControls({ doc = document, win = window } = {}) {
  if (doc.querySelector('.mg-screen')) return null;
  const t = stringsFor(doc.documentElement.lang);
  const fs = fullscreenApi(doc);
  let deferredPrompt = null;
  let installed = false;

  
  
  
  if (!doc.querySelector('link[rel="manifest"]')) {
    const link = doc.createElement('link');
    link.rel = 'manifest';
    link.href = '/manifest.webmanifest';
    doc.head.appendChild(link);
  }

  applyCss(doc, win, CSS);

  const host = doc.createElement('div');
  host.className = 'mg-screen';
  host.dataset.open = '0';
  const tab = doc.createElement('button');
  tab.type = 'button';
  tab.className = 'mg-screen-tab';
  tab.setAttribute('aria-label', t.open);
  tab.setAttribute('aria-expanded', 'false');
  tab.title = t.open;
  tab.innerHTML = ICONS.fullscreen;
  const menu = doc.createElement('div');
  menu.className = 'mg-screen-menu';
  menu.setAttribute('role', 'group');
  menu.setAttribute('aria-label', t.open);
  const hint = doc.createElement('p');
  hint.className = 'mg-screen-hint';
  hint.setAttribute('role', 'status');
  hint.hidden = true;
  host.append(tab, menu);

  const standalone = () => installed
    || win.matchMedia?.('(display-mode: standalone)').matches
    || win.matchMedia?.('(display-mode: fullscreen)').matches
    || win.navigator.standalone === true;

  const setOpen = (open) => {
    host.dataset.open = open ? '1' : '0';
    tab.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (!open) hint.hidden = true;
  };

  const render = () => {
    const rows = menuModel({
      fsSupported: fs.supported,
      fsActive: fs.active(),
      install: installMode({
        standalone: standalone(),
        hasPrompt: Boolean(deferredPrompt),
        ua: win.navigator.userAgent,
        touchPoints: win.navigator.maxTouchPoints,
      }),
      t,
    });
    menu.replaceChildren();
    for (const row of rows) {
      const el = doc.createElement(row.href ? 'a' : 'button');
      if (row.href) el.href = row.href; else el.type = 'button';
      el.className = 'mg-screen-row';
      el.dataset.row = row.id;
      el.innerHTML = ICONS[row.id];
      el.append(doc.createTextNode(row.label));
      if (!row.href) {
        el.addEventListener('click', async () => {
          if (row.hint) { hint.textContent = row.hint; hint.hidden = false; return; }
          if (row.id === 'fullscreen') { await fs.toggle(); setOpen(false); return; }
          if (row.id === 'install' && deferredPrompt) {
            const prompt = deferredPrompt;
            deferredPrompt = null;   
            try { await prompt.prompt(); await prompt.userChoice; } catch {  }
            setOpen(false);
            render();
          }
        });
      }
      menu.append(el);
    }
    menu.append(hint);
  };

  tab.addEventListener('click', () => {
    const open = host.dataset.open !== '1';
    if (open) render();
    setOpen(open);
  });
  
  doc.addEventListener('pointerdown', (e) => {
    if (host.dataset.open === '1' && !host.contains(e.target)) setOpen(false);
  }, true);
  doc.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && host.dataset.open === '1') setOpen(false);
  });
  for (const name of ['fullscreenchange', 'webkitfullscreenchange']) {
    doc.addEventListener(name, () => { if (host.dataset.open === '1') render(); });
  }
  win.addEventListener('beforeinstallprompt', (e) => {
    
    e.preventDefault();
    deferredPrompt = e;
    if (host.dataset.open === '1') render();
  });
  win.addEventListener('appinstalled', () => {
    installed = true;
    deferredPrompt = null;
    if (host.dataset.open === '1') render();
  });

  doc.body.appendChild(host);

  
  
  
  const SELECTOR = 'button, a[href], input, select, textarea, [role="button"]';
  const obstacles = () => {
    const list = [];
    for (const el of doc.querySelectorAll(SELECTOR)) {
      if (host.contains(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const cs = win.getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue;
      list.push(r);
    }
    return list;
  };
  let slot = null;
  const place = (force) => {
    if (host.dataset.open === '1') return;
    const obs = obstacles();
    if (!force && slot && pickSlot([slot], obs).area === 0) return;   
    const next = pickSlot(slotCandidates(win.innerWidth, win.innerHeight), obs);
    if (!next) return;
    slot = next;
    host.dataset.side = next.side;
    host.dataset.low = next.top > win.innerHeight / 2 ? '1' : '0';   
    host.style.top = `${next.top}px`;
  };
  place(true);
  win.setTimeout(() => place(true), 1200);
  win.addEventListener('resize', () => place(true));
  win.setInterval(() => place(false), 4000);

  
  
  if ('serviceWorker' in win.navigator) {
    const register = () => { win.navigator.serviceWorker.register('/sw.js').catch(() => {}); };
    if (doc.readyState === 'complete') register();
    else win.addEventListener('load', register, { once: true });
  }
  return host;
}


if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  
  
  
  const nested = () => {
    if (window.parent === window) return false;
    try { return Boolean(window.parent.document); } catch { return false; }
  };
  const go = () => { try { if (!nested()) mountSiteControls(); } catch {  } };
  if (document.body) go();
  else document.addEventListener('DOMContentLoaded', go, { once: true });
}
