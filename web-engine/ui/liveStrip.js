













import { feedModel, shouldPoll, LIVE_POLL_MS, LIVE_STOP_AFTER_MS } from '../net/liveFeed.js';
import { fetchOpenRoomsShared } from '../net/firebaseRooms.js';
import { glyphGroup } from '../brand/glyphs.js';
import { COLOUR, FONT, MOTION, alpha } from '../brand/tokens.js';

const STYLE_ID = 'mg-live-strip-style';
export const PAUSED_TEXT = 'Paused to save data - reload, or come back to this tab, to refresh';

const CSS = `
.mg-live-strip{margin:0 auto;max-width:1120px;padding:10px 16px 4px;box-sizing:border-box;
  font:14px/1.3 ${FONT.sans};color:${COLOUR.ink}}
.mg-live-strip h2{display:flex;align-items:center;gap:8px;margin:0 0 8px;font:700 15px/1.2 ${FONT.serif}}
.mg-live-strip .mg-live-dot{width:9px;height:9px;border-radius:50%;background:${COLOUR.idle};flex:0 0 auto}
.mg-live-strip[data-state="live"] .mg-live-dot{background:${COLOUR.live};box-shadow:0 0 0 3px ${alpha(COLOUR.live, 0.18)}}
.mg-live-strip .mg-live-count{font:600 12px/1 ${FONT.sans};color:${COLOUR.inkSoft}}
.mg-live-strip .mg-live-empty{margin:0;color:${COLOUR.inkSoft}}
.mg-live-strip ul{list-style:none;margin:0;padding:2px 2px 8px;display:flex;gap:8px;overflow-x:auto;
  scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch}
.mg-live-strip li{flex:0 0 auto;scroll-snap-align:start}
.mg-live-chip{display:flex;align-items:center;gap:8px;max-width:240px;min-height:44px;box-sizing:border-box;
  padding:6px 12px 6px 6px;border-radius:12px;background:${COLOUR.card};border:1px solid ${COLOUR.rule};
  border-left:4px solid var(--accent,${COLOUR.ink});color:${COLOUR.ink} !important;text-decoration:none !important}
.mg-live-chip:hover,.mg-live-chip:focus-visible{background:${COLOUR.highlight};outline:none}
.mg-live-chip svg{flex:0 0 auto;width:28px;height:28px;border-radius:8px;background:var(--accent,${COLOUR.ink})}
.mg-live-chip .mg-live-txt{display:flex;flex-direction:column;min-width:0}
.mg-live-chip b,.mg-live-chip span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mg-live-chip b{font-size:13px}
.mg-live-chip span{font-size:12px;color:${COLOUR.inkSoft}}
.mg-live-chip[data-full="1"]{opacity:.6}
@media (prefers-reduced-motion:no-preference){.mg-live-chip{transition:background ${MOTION.tap}ms}}
`;

function injectCss(doc) {
  if (doc.getElementById(STYLE_ID)) return;
  const st = doc.createElement('style');
  st.id = STYLE_ID;
  st.textContent = CSS;
  doc.head.appendChild(st);
}


export function chipText(chip) {
  const who = chip.host
    ? `${chip.host}${chip.level ? ` - Lv ${chip.level}` : ''}`
    : chip.name;
  const what = chip.host
    ? `${chip.name.replace(/^Farmy /, '')} - ${chip.seats} - ${chip.full ? 'Full' : 'Join'}`
    : `${chip.seats} - ${chip.full ? 'Full' : 'Join'}`;
  return { who, what };
}


export function paint(root, model, doc = root.ownerDocument) {
  root.dataset.state = model.state;
  const count = root.querySelector('.mg-live-count');
  count.textContent = model.state === 'live' ? model.text : '';
  const body = root.querySelector('.mg-live-body');
  body.textContent = '';
  if (model.state !== 'live') {
    const p = doc.createElement('p');
    p.className = 'mg-live-empty';
    p.textContent = model.text;
    body.appendChild(p);
    return;
  }
  const ul = doc.createElement('ul');
  for (const chip of model.chips) {
    const li = doc.createElement('li');
    const a = doc.createElement('a');
    a.className = 'mg-live-chip';
    a.href = chip.href;
    a.dataset.game = chip.game;
    a.dataset.full = chip.full ? '1' : '0';
    a.style.setProperty('--accent', chip.accent);
    a.setAttribute('aria-label', `Join ${chip.line}`);
    const glyph = chip.statsId ? glyphGroup(chip.statsId, { cx: 14, cy: 14, box: 18, ink: COLOUR.card }) : '';
    a.innerHTML = `<svg viewBox="0 0 28 28" aria-hidden="true">${glyph}</svg>`;
    const { who, what } = chipText(chip);
    const txt = doc.createElement('span');
    txt.className = 'mg-live-txt';
    const b = doc.createElement('b');
    b.textContent = who;
    const s = doc.createElement('span');
    s.textContent = what;
    txt.append(b, s);
    a.appendChild(txt);
    li.appendChild(a);
    ul.appendChild(li);
  }
  body.appendChild(ul);
}







export function mountLiveStrip({
  host,
  doc = host?.ownerDocument ?? globalThis.document,
  fetch = () => fetchOpenRoomsShared(),
  now = () => Date.now(),
  online = () => globalThis.navigator?.onLine !== false,
  pollMs = LIVE_POLL_MS,
  stopAfterMs = LIVE_STOP_AFTER_MS,
  tickMs = 15_000,
} = {}) {
  if (!host || !doc?.createElement) return () => {};
  try {
    injectCss(doc);
    const root = doc.createElement('section');
    root.className = 'mg-live-strip';
    root.setAttribute('aria-label', 'Live now');
    root.innerHTML = '<h2><span class="mg-live-dot" aria-hidden="true"></span>Live now '
      + '<span class="mg-live-count"></span></h2><div class="mg-live-body" aria-live="polite"></div>';
    host.appendChild(root);
    paint(root, feedModel([], { now: now() }), doc);

    
    
    
    
    
    let windowStart = null;
    let lastReadAt = null;
    let stopped = false;
    let paused = false;
    let timer = null;

    const hidden = () => { try { return !!doc.hidden; } catch { return false; } };

    function pause() {
      paused = true;
      if (timer) { clearInterval(timer); timer = null; }
      paint(root, { state: 'paused', text: PAUSED_TEXT, count: 0, groups: [], chips: [] }, doc);
    }

    async function poll() {
      if (stopped || paused) return;
      const t = now();
      if (hidden()) return;
      if (windowStart === null) windowStart = t;
      if (t - windowStart > stopAfterMs) { pause(); return; }
      if (!shouldPoll({ startedAt: windowStart, lastReadAt, now: t, pollMs, stopAfterMs })) return;
      lastReadAt = t;
      if (!online()) { paint(root, feedModel([], { now: t, offline: true }), doc); return; }
      let rooms = [];
      try { rooms = await fetch(); } catch { rooms = []; }
      if (stopped || paused) return;
      paint(root, feedModel(rooms, { now: now() }), doc);
    }

    const onShow = () => {
      if (stopped || hidden()) return;
      if (paused) {
        paused = false;
        windowStart = null;
        lastReadAt = null;
        timer = setInterval(poll, tickMs);
      }
      poll();
    };
    function stop() {
      stopped = true;
      if (timer) { clearInterval(timer); timer = null; }
      try { doc.removeEventListener('visibilitychange', onShow); } catch {  }
    }

    poll();
    timer = setInterval(poll, tickMs);
    try { doc.addEventListener('visibilitychange', onShow); } catch {  }
    return stop;
  } catch {
    return () => {};
  }
}
