
















































import {
  liveRooms, badgeText, roomLine, whoIsIn, readNow, LIVE_GAMES, LIVE_PATH, REFRESH_MS,
} from '../../../web-engine/net/presence.js';
import { fetchOpenRooms, sweepStaleRooms } from '../../../web-engine/net/firebaseRooms.js';


export const POLL_MS = Math.round(REFRESH_MS * (2 / 3));












const FONT = 'Verdana, "DejaVu Sans", Tahoma, "Segoe UI", system-ui, sans-serif';































const CSS = `
.studio-live {
  display: none; align-items: center; gap: 8px;
  margin-left: 10px; padding: 8px 13px; min-height: 44px;
  font-family: inherit; font-weight: 700; font-size: 18px; line-height: 1;
  color: #fff;
  background: rgba(255,255,255,0.10);
  border: 1px solid rgba(255,255,255,0.34); border-radius: 999px;
  cursor: pointer; white-space: nowrap;
}
.studio-live[data-live="1"] { display: inline-flex; }
.studio-live:hover, .studio-live:focus-visible {
  background: rgba(255,255,255,0.20); border-color: #fff; outline: none;
}
.studio-live .live-dot {
  width: 10px; height: 10px; border-radius: 50%;
  background: #7ee081; box-shadow: 0 0 0 3px rgba(126,224,129,0.28);
}
@media (max-width: 520px) {
  .studio-live { min-height: 40px; font-size: 17px; padding: 6px 9px; margin-left: 4px; }
  .studio-live .live-dot { width: 9px; height: 9px; box-shadow: 0 0 0 2px rgba(126,224,129,0.28); }
  .studio-bar[data-live="1"] .studio-home span { display: none; }
}
.live-sheet {
  position: fixed; inset: 0; z-index: 120;
  display: none; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.55); padding: 16px;
  font-family: ${FONT};
}
.live-sheet[data-open="1"] { display: flex; }
.live-card {
  background: #fffdf5; color: #14110b;
  border: 3px solid #14110b; border-radius: 14px;
  box-shadow: 0 14px 0 rgba(20,17,11,0.85);
  width: min(560px, 100%); max-height: min(80vh, 720px); overflow: auto;
  padding: 18px;
}
.live-card h2 {
  margin: 0 0 4px; font-family: ${FONT};
  font-weight: 800; font-size: 26px; line-height: 1.2;
}
.live-card .live-sub { margin: 0 0 14px; font-size: 18px; line-height: 1.35; color: #423c30; }
.live-card ul { list-style: none; margin: 0; padding: 0; }
.live-card li { margin: 0 0 10px; }
.live-join {
  display: block; width: 100%; text-align: left;
  font-family: ${FONT}; font-weight: 700; font-size: 20px; line-height: 1.3;
  color: #14110b;
  background: #fff; border: 2px solid #14110b; border-radius: 10px;
  padding: 13px 15px; min-height: 48px; cursor: pointer;
}
.live-join:hover, .live-join:focus-visible { background: #fdf0c9; outline: none; }
.live-join .live-code {
  display: block; margin-top: 4px;
  font-weight: 400; font-size: 18px; color: #423c30;
  font-variant-numeric: tabular-nums; letter-spacing: 0.06em;
}
.live-close {
  margin-top: 6px; font-family: ${FONT}; font-weight: 700; font-size: 18px;
  line-height: 1; min-height: 48px;
  padding: 14px 20px; background: #14110b; color: #fffdf5;
  border: 2px solid #14110b; border-radius: 10px; cursor: pointer;
}
`;

let styled = false;
function injectCss(doc) {
  if (styled) return;
  styled = true;
  const el = doc.createElement('style');
  el.id = 'live-badge-css';
  el.textContent = CSS;
  doc.head.appendChild(el);
}









export function mountLiveBadge({
  host,
  doc = host?.ownerDocument ?? globalThis.document,
  mine = () => null,
  fetch = fetchOpenRooms,
  now = () => Date.now(),
  pollMs = POLL_MS,
  onJoin = null,
  
  
  sweep = true,
} = {}) {
  if (!host || !doc?.createElement) return null;

  
  
  
  
  
  
  
  
  
  let framed = false;
  try { framed = globalThis.self !== globalThis.top; } catch { framed = false; }
  if (framed) return () => {};

  injectCss(doc);

  const button = doc.createElement('button');
  button.type = 'button';
  button.className = 'studio-live';
  button.dataset.live = '0';
  const dot = doc.createElement('span');
  dot.className = 'live-dot';
  dot.setAttribute('aria-hidden', 'true');
  const text = doc.createElement('span');
  button.append(dot, text);
  host.appendChild(button);

  const sheet = doc.createElement('div');
  sheet.className = 'live-sheet';
  sheet.dataset.open = '0';
  
  
  
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.setAttribute('aria-label', 'Games open right now');
  sheet.innerHTML = '<div class="live-card">'
    + '<h2>Playing right now</h2>'
    + '<p class="live-sub"></p>'
    + '<ul></ul>'
    + '<button type="button" class="live-close">Close</button>'
    + '</div>';
  doc.body.appendChild(sheet);
  const list = sheet.querySelector('ul');
  const sub = sheet.querySelector('.live-sub');

  let rooms = [];
  let timer = null;
  let stopped = false;

  const close = () => { sheet.dataset.open = '0'; button.focus(); };
  sheet.querySelector('.live-close').addEventListener('click', close);
  
  
  sheet.addEventListener('click', (e) => { if (e.target === sheet) close(); });
  doc.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sheet.dataset.open === '1') { close(); e.stopPropagation(); }
  });

  function paintList() {
    list.textContent = '';
    
    
    
    if (!rooms.length) {
      const own = mine();
      sub.textContent = own
        ? 'Your room is open and nobody else is playing online right now.'
        : 'Nobody else is playing online right now.';
      if (own) {
        const li = doc.createElement('li');
        const b = doc.createElement('button');
        b.type = 'button';
        b.className = 'live-join';
        b.append(doc.createTextNode('Your room'));
        const code = doc.createElement('span');
        code.className = 'live-code';
        code.textContent = `Read this out: ${String(own).toUpperCase()}`;
        b.appendChild(code);
        b.setAttribute('aria-label', `Your room, code ${String(own).toUpperCase()}. Press to copy it.`);
        b.addEventListener('click', () => {
          try { globalThis.navigator?.clipboard?.writeText(String(own).toUpperCase()); } catch {  }
          code.textContent = 'Copied';
        });
        li.appendChild(b);
        list.appendChild(li);
      }
      return;
    }
    sub.textContent = rooms.length === 1
      ? 'One room is open. Joining opens that game.'
      : `${rooms.length} rooms are open. Joining opens that game.`;
    for (const room of rooms) {
      const li = doc.createElement('li');
      const b = doc.createElement('button');
      b.type = 'button';
      b.className = 'live-join';
      const name = LIVE_GAMES[room.game] ?? 'A farm game';
      
      
      
      
      
      b.append(doc.createTextNode(`${name} - ${whoIsIn(room)}`));
      const code = doc.createElement('span');
      code.className = 'live-code';
      code.textContent = `Room ${String(room.code).toUpperCase()}`;
      b.appendChild(code);
      
      
      b.setAttribute('aria-label', `Join ${roomLine(room)}`);
      b.addEventListener('click', () => {
        close();
        
        
        
        
        if (onJoin && onJoin(room)) return;
        const path = LIVE_PATH[room.game];
        if (path) globalThis.location.href = `${path}?join=${encodeURIComponent(room.code)}`;
      });
      li.appendChild(b);
      list.appendChild(li);
    }
  }

  button.addEventListener('click', () => {
    if (!rooms.length && !mine()) return;
    paintList();
    sheet.dataset.open = '1';
    sheet.querySelector('.live-join')?.focus();
  });

  
  
  
  
  let lastReadAt = null;

  async function poll() {
    if (stopped) return;
    
    
    
    
    
    const hidden = (() => {
      try { return !!globalThis.document?.hidden; } catch { return false; }
    })();
    if (!readNow({ hidden, lastReadAt, now: now(), pollMs })) return;
    lastReadAt = now();
    let all = [];
    try { all = await fetch(); } catch (_) { all = []; }
    if (stopped) return;
    const at = now();
    rooms = liveRooms(all, { now: at, mine: mine() });
    
    
    
    
    if (sweep) sweepStaleRooms(all, { now: at, limit: 1 }).catch(() => {});
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const ownCode = mine();
    const onlyMine = !rooms.length && !!ownCode;
    const label = rooms.length ? badgeText(rooms.length) : (onlyMine ? 'Your room is live' : '');
    const lit = rooms.length > 0 || onlyMine;
    text.textContent = label;
    button.dataset.live = lit ? '1' : '0';
    button.dataset.own = onlyMine ? '1' : '0';
    
    
    try { host.dataset.live = lit ? '1' : '0'; } catch {  }
    button.setAttribute('aria-label', rooms.length
      ? `${label}. Open the list of games you can join.`
      : (onlyMine
        ? 'Your room is open. Show the code to share it.'
        : 'Nobody else is playing online right now'));
    
    
    if (sheet.dataset.open === '1') {
      if (!rooms.length && !onlyMine) close();
      else paintList();
    }
  }

  poll();
  timer = setInterval(poll, pollMs);

  
  
  
  
  const onShow = () => { poll(); };
  try { globalThis.document?.addEventListener('visibilitychange', onShow); } catch {  }

  return function stop() {
    stopped = true;
    try { globalThis.document?.removeEventListener('visibilitychange', onShow); } catch {  }
    if (timer) { clearInterval(timer); timer = null; }
    button.remove();
    sheet.remove();
  };
}
