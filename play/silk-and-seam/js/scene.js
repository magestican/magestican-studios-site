











import { state, save } from './state.js';
import { windAt, springStep, drapeOf, fabric, isNightHour } from './logic.js';
import { BODY_SHAPES } from './data.js';
import { miniFormSVG, roomSVG } from './art.js';
import { sfx, setScene, setWind } from './audio.js';
import { calm } from './ui.js';

export function sceneState() {
  if (!state.scene) state.scene = { night: null, open: false, body: null };
  return state.scene;
}
export const isNight = () => { const s = sceneState(); return s.night === null || s.night === undefined ? isNightHour(new Date().getHours()) : !!s.night; };


const BEAMS = [
  [[0.3, 0.2], [0.42, 0.17], [0.8, 1], [0.54, 1]],
  [[0.46, 0.2], [0.56, 0.21], [0.99, 1], [0.82, 1]],
  [[0.6, 0.28], [0.7, 0.33], [1, 0.8], [1, 0.97]],
];
const FLOOR = [[0.47, 0.935], [0.9, 0.935], [1, 1], [0.52, 1]];
const pts = (poly) => poly.map(([x, y]) => `${(x * 100).toFixed(1)},${(y * 100).toFixed(1)}`).join(' ');
function inPoly(x, y, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

const OPENING = 'M24,232 V84 A126,62 0 0 1 276,84 V232 Z';
function windowSVG() {
  const stars = [[60, 40], [120, 34], [170, 52], [220, 38], [250, 70], [110, 90], [200, 96], [150, 120], [236, 128], [48, 130]]
    .map(([x, y], i) => `<circle class="sc-star" style="animation-delay:${(i * 0.37).toFixed(2)}s" cx="${x}" cy="${y}" r="${i % 3 ? 1.1 : 1.7}" fill="#fff"/>`).join('');
  return `<svg class="sc-win-svg" viewBox="0 0 300 250" preserveAspectRatio="none" aria-hidden="true"><defs>
      <clipPath id="sc-open"><path d="${OPENING}"/></clipPath>
      <linearGradient id="sc-dsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fb8e6"/><stop offset=".7" stop-color="#cfe6f4"/><stop offset="1" stop-color="#f6ead0"/></linearGradient>
      <linearGradient id="sc-nsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1432"/><stop offset=".75" stop-color="#23305e"/><stop offset="1" stop-color="#40406a"/></linearGradient>
      <radialGradient id="sc-sunglow"><stop offset="0" stop-color="#fff6d0" stop-opacity=".95"/><stop offset=".3" stop-color="#ffe9a0" stop-opacity=".5"/><stop offset="1" stop-color="#ffe9a0" stop-opacity="0"/></radialGradient>
      <radialGradient id="sc-moonglow"><stop offset="0" stop-color="#e6ecff" stop-opacity=".6"/><stop offset="1" stop-color="#e6ecff" stop-opacity="0"/></radialGradient>
      <linearGradient id="sc-wood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a5c38"/><stop offset=".5" stop-color="#6b4429"/><stop offset="1" stop-color="#4f311c"/></linearGradient>
    </defs>
    <path d="M8,246 V80 A142,72 0 0 1 292,80 V246 Z" fill="url(#sc-wood)"/>
    <path d="M8,246 V80 A142,72 0 0 1 292,80" fill="none" stroke="#a87a4e" stroke-width="2" stroke-opacity=".6"/>
    <g clip-path="url(#sc-open)">
      <g class="sc-day"><rect width="300" height="250" fill="url(#sc-dsky)"/>
        <circle cx="78" cy="80" r="62" fill="url(#sc-sunglow)"/><circle cx="78" cy="80" r="16" fill="#fff4c4"/>
        <g class="sc-cloud" fill="#fff" fill-opacity=".85"><ellipse cx="170" cy="60" rx="30" ry="9"/><ellipse cx="186" cy="54" rx="16" ry="9"/><ellipse cx="236" cy="104" rx="22" ry="6"/><ellipse cx="248" cy="99" rx="11" ry="6"/></g>
        <path d="M24,196 L60,196 L60,178 L84,166 L108,178 L108,196 L132,196 L132,170 L140,170 L140,184 L170,184 L170,172 L200,158 L230,172 L230,190 L276,190 L276,232 L24,232 Z" fill="#9bb3b8"/>
        <path d="M252,20 C236,40 214,52 196,56 M236,34 C230,46 222,56 214,62" stroke="#5b4430" stroke-width="3.2" fill="none" stroke-linecap="round"/>
        ${[[200, 52], [214, 60], [222, 44], [238, 30], [246, 44], [230, 58], [256, 26]].map(([x, y], i) => `<ellipse class="sc-leaf" style="animation-delay:${(i * 0.23).toFixed(2)}s" cx="${x}" cy="${y}" rx="8" ry="4" transform="rotate(${-30 + i * 17} ${x} ${y})" fill="${i % 2 ? '#6f9a52' : '#86b062'}"/>`).join('')}
      </g>
      <g class="sc-nightsky"><rect width="300" height="250" fill="url(#sc-nsky)"/>${stars}
        <circle cx="78" cy="80" r="44" fill="url(#sc-moonglow)"/><circle cx="78" cy="80" r="14" fill="#eef1ff"/><circle cx="84" cy="75" r="12" fill="#1a2550"/>
        <path d="M24,196 L60,196 L60,178 L84,166 L108,178 L108,196 L132,196 L132,170 L140,170 L140,184 L170,184 L170,172 L200,158 L230,172 L230,190 L276,190 L276,232 L24,232 Z" fill="#141a33"/>
        <rect x="70" y="182" width="6" height="7" fill="#ffd27a"/><rect x="186" y="176" width="5" height="6" fill="#ffd27a" fill-opacity=".8"/><rect x="250" y="200" width="6" height="6" fill="#ffd27a" fill-opacity=".7"/>
        <path d="M252,20 C236,40 214,52 196,56 M236,34 C230,46 222,56 214,62" stroke="#0e1228" stroke-width="3.2" fill="none" stroke-linecap="round"/>
      </g>
    </g>
    <rect x="0" y="232" width="300" height="18" rx="3" fill="#7a5031"/><rect x="0" y="232" width="300" height="3" fill="#a87a4e"/>
    <g transform="translate(262,232)"><path d="M-12,0 L12,0 L9,-14 L-9,-14 Z" fill="#b5653f"/><path d="M0,-14 C-4,-26 -12,-30 -16,-34 M0,-14 C2,-28 8,-32 14,-36 M0,-14 C0,-24 -2,-32 0,-40" stroke="#4d7a3b" stroke-width="2.4" fill="none"/></g>
  </svg>`;
}
const leafSVG = (side) => {
  const vb = side === 'l' ? '24 20 126 214' : '150 20 126 214';
  const mul = side === 'l' ? 'M24,150 H150 M87,40 V232' : 'M150,150 H276 M213,40 V232';
  return `<svg viewBox="${vb}" preserveAspectRatio="none" aria-hidden="true"><defs><clipPath id="sc-lc-${side}"><path d="${OPENING}"/></clipPath>
    <linearGradient id="sc-glass-${side}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8f4ff" stop-opacity=".34"/><stop offset=".45" stop-color="#fff" stop-opacity=".1"/><stop offset=".5" stop-color="#fff" stop-opacity=".42"/><stop offset=".58" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#c8dcea" stop-opacity=".24"/></linearGradient></defs>
    <g clip-path="url(#sc-lc-${side})"><rect x="0" y="0" width="300" height="250" fill="url(#sc-glass-${side})"/>
      <path d="${mul}" stroke="#5a3a22" stroke-width="5"/><rect x="${side === 'l' ? 24 : 150}" y="0" width="126" height="250" fill="none" stroke="#5a3a22" stroke-width="9"/></g>
    <circle cx="${side === 'l' ? 144 : 156}" cy="160" r="3" fill="#d9b25a"/></svg>`;
};
const lampSVG = () => `<svg viewBox="0 0 40 70" aria-hidden="true"><path d="M20,70 V52 M8,40 C8,52 32,52 32,40" stroke="#b98d3a" stroke-width="3" fill="none"/><rect x="12" y="62" width="16" height="6" rx="2" fill="#8a6420"/>
  <path class="sc-shade" d="M9,40 C9,24 14,10 20,6 C26,10 31,24 31,40 Z" fill="#f4e7cc" stroke="#b98d3a" stroke-width="1.4"/><circle cx="20" cy="4" r="3" fill="#c79d45"/></svg>`;

export function shelfHTML(cur) {
  return `<div class="sc-shelf" role="group" aria-label="Figure on the dress form">${BODY_SHAPES.map((b) => `<button class="sc-mini${b.id === cur ? ' on' : ''}" data-body="${b.id}" aria-label="${b.name} figure" aria-pressed="${b.id === cur}" title="${b.name} figure">${miniFormSVG(b.id, b.id === cur ? '#f7ecd6' : '#d8c8ac')}</button>`).join('')}<i class="sc-plank"></i></div>`;
}

export function wireShelf(root, onPick) {
  root.querySelectorAll('.sc-mini').forEach((b) => {
    b.onclick = (e) => {
      e.stopPropagation();
      root.querySelectorAll('.sc-mini').forEach((x) => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
      sfx.shelf();
      onPick(b.dataset.body);
    };
  });
}


export function sceneHTML(dressSvg, { shelf = null } = {}) {
  const s = sceneState();
  return `<div class="sc-glow"></div>
    <div class="sc-lamp l">${lampSVG()}</div><div class="sc-lamp r">${lampSVG()}</div>
    <div class="sc-window${s.open ? ' open' : ''}" role="button" tabindex="0" aria-label="${s.open ? 'Close' : 'Open'} the window">
      ${windowSVG()}
      <div class="sc-curtain l"></div><div class="sc-curtain r"></div>
      <div class="sc-leaf-w l">${leafSVG('l')}</div><div class="sc-leaf-w r">${leafSVG('r')}</div>
      <button class="sc-sky" aria-label="${isNight() ? 'Bring back the day' : 'Let the night in'}" title="${isNight() ? 'Tap the moon for daylight' : 'Tap the sun for night - the lamps come on'}"></button>
    </div>
    ${shelf ? shelfHTML(shelf) : ''}
    <div class="sc-dress">${dressSvg}</div>
    <div class="sc-fx"><svg class="sc-rays" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs>
      <linearGradient id="sc-ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3cf" stop-opacity=".75"/><stop offset=".6" stop-color="#fff3cf" stop-opacity=".22"/><stop offset="1" stop-color="#fff3cf" stop-opacity="0"/></linearGradient>
      <linearGradient id="sc-mray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8c8ff" stop-opacity=".45"/><stop offset="1" stop-color="#b8c8ff" stop-opacity="0"/></linearGradient></defs>
      <g class="sc-sunrays">${BEAMS.map((b, i) => `<polygon class="sc-beam" style="animation-delay:${i * 1.3}s" points="${pts(b)}" fill="url(#sc-ray)"/>`).join('')}<polygon points="${pts(FLOOR)}" fill="#fff0c4" fill-opacity=".32"/></g>
      <g class="sc-moonrays">${BEAMS.slice(0, 2).map((b) => `<polygon points="${pts(b)}" fill="url(#sc-mray)"/>`).join('')}</g>
    </svg><canvas class="sc-dust"></canvas></div>`;
}





export const LIGHTS = [
  { id: 'day', name: 'Daylight' },
  { id: 'golden', name: 'Golden hour' },
  { id: 'night', name: 'Lamplight' },
];
export function vignetteHTML(dressSvg, { cls = '', lights = false, label = '' } = {}) {
  return `<div class="sc-vig ${cls}">${roomSVG()}<div class="sc-vig-box">${sceneHTML(dressSvg)}</div>` +
    (label ? `<div class="sc-vig-label">${label}</div>` : '') +
    (lights ? `<div class="sc-lights" role="group" aria-label="Light">${LIGHTS.map((l) => `<button class="chip" data-light="${l.id}">${l.name}</button>`).join('')}</div>` : '') + '</div>';
}

export function mountVignette(vig, opts = {}) {
  const sc = mountScene(vig.querySelector('.sc-vig-box'), { ...opts, screen: vig });
  const s = sceneState();
  const mark = () => {
    const cur = vig.classList.contains('golden') ? 'golden' : isNight() ? 'night' : 'day';
    vig.querySelectorAll('[data-light]').forEach((b) => { const on = b.dataset.light === cur; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  };
  sc.setLight = (id) => {
    const night = id === 'night';
    if (night !== isNight()) { night ? sfx.toNight() : sfx.toDay(); if (night) setTimeout(() => sfx.lampOn(), 450); }
    vig.classList.toggle('golden', id === 'golden');
    s.night = night; save();
    sc.apply(); mark();
  };
  vig.querySelectorAll('[data-light]').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); sc.setLight(b.dataset.light); }; });
  
  vig.querySelector('.sc-sky')?.addEventListener('click', () => { vig.classList.remove('golden'); mark(); });
  mark();
  return sc;
}



export function mountScene(el, { design, onBody, screen } = {}) {
  const s = sceneState();
  el.classList.add('scene');
  const apply = () => {
    const night = isNight();
    el.classList.toggle('night', night);
    el.classList.toggle('open', !!s.open);
    screen?.classList.toggle('night', night);
    const win = el.querySelector('.sc-window');
    win.classList.toggle('open', !!s.open);
    win.setAttribute('aria-label', `${s.open ? 'Close' : 'Open'} the window`);
    const sky = el.querySelector('.sc-sky');
    sky.setAttribute('aria-label', night ? 'Bring back the day' : 'Let the night in');
    sky.title = night ? 'Tap the moon for daylight' : 'Tap the sun for night - the lamps come on';
    setScene({ night, open: !!s.open });
  };
  apply();
  let cur = design;
  const win = el.querySelector('.sc-window');
  const toggleWindow = () => {
    s.open = !s.open; save();
    s.open ? sfx.windowOpen() : sfx.windowClose();
    apply(); puff(); setTimeout(() => sfx.dust(), 900);
  };
  win.addEventListener('click', (e) => { if (e.target.closest('.sc-sky')) return; toggleWindow(); });
  win.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleWindow(); } });
  el.querySelector('.sc-sky').addEventListener('click', (e) => {
    e.stopPropagation();
    const night = !isNight();
    s.night = night; save();
    night ? sfx.toNight() : sfx.toDay();
    if (night) setTimeout(() => sfx.lampOn(), 450);
    apply();
  });
  if (onBody) wireShelf(el, onBody);

  
  const cv = el.querySelector('.sc-dust'), g = cv.getContext('2d');
  const motes = [];
  let rnd = 99991;
  const R = () => { rnd = (rnd * 16807) % 2147483647; return rnd / 2147483647; };
  const spawn = (top) => ({ x: 0.25 + R() * 0.7, y: top ? 0.15 + R() * 0.15 : 0.15 + R() * 0.85, vx: 0, vy: 0, r: 0.6 + R() * 1.4, ph: R() * 6.28, life: -1 });
  for (let i = 0; i < 70; i++) motes.push(spawn(false));
  function puff() {
    if (calm()) return;
    for (let i = 0; i < 46; i++) motes.push({ x: 0.3 + R() * 0.4, y: 0.54 + R() * 0.03, vx: (R() - 0.5) * 0.004, vy: -0.002 - R() * 0.004, r: 0.7 + R() * 1.6, ph: R() * 6.28, life: 1 });
  }
  el.__puff = puff;
  let springs = null;
  const parts = () => {
    const svg = el.querySelector('.sc-dress svg');
    if (!svg) return null;
    const f1 = fabric(cur?.fab1) || fabric('cotton'), f2 = fabric(cur?.fab2) || f1;
    const fl1 = drapeOf(f1.tex).flutter, fl2 = drapeOf(f2.tex).flutter;
    return {
      skirt: svg.querySelector('.dx-skirt'), layers: [...svg.querySelectorAll('.dx-l')], sleeves: [...svg.querySelectorAll('.dx-sleeve')],
      drape: svg.querySelector('.dx-drape'), tail: svg.querySelector('.dx-tail'), fl1, fl2,
    };
  };
  let P = parts();
  const newSprings = () => ({ skirt: { x: 0, v: 0 }, layers: (P?.layers || []).map(() => ({ x: 0, v: 0 })), sleeve: { x: 0, v: 0 }, drape: { x: 0, v: 0 } });
  springs = newSprings();
  let raf = 0, last = performance.now(), t0 = last, openAmt = s.open ? 1 : 0, lastRustle = 0, W = 0, H = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (document.hidden) { last = now; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const t = (now - t0) / 1000;
    const still = calm();
    openAmt += ((s.open ? 1 : 0) - openAmt) * Math.min(1, dt * 1.5);
    const wind = windAt(t, true) * openAmt;
    setWind(wind);
    
    const dir = Math.sin(t * 0.83) + 0.45 * Math.sin(t * 2.27 + 0.6);
    if (P && P.skirt && !still) {
      const tgt = wind * dir * P.fl1;
      springs.skirt = springStep(springs.skirt, tgt, dt, 12 - P.fl1 * 4, 3.2);
      const sh = springs.skirt.x * 0.11, bill = 1 + wind * 0.035 * P.fl1;
      P.skirt.setAttribute('transform', `translate(200 226) matrix(${bill.toFixed(4)} 0 ${sh.toFixed(4)} 1 0 0) translate(-200 -226)`);
      P.layers.forEach((L, i) => {
        const k = P.layers.length > 1 ? i / (P.layers.length - 1) : 0;
        springs.layers[i] = springStep(springs.layers[i] || { x: 0, v: 0 }, tgt * (0.3 + k * 0.5), dt, 9 - k * 3, 2.4);
        L.setAttribute('transform', `translate(200 226) matrix(1 0 ${(springs.layers[i].x * 0.05).toFixed(4)} 1 0 0) translate(-200 -226)`);
      });
      springs.sleeve = springStep(springs.sleeve, wind * dir * P.fl2 + wind * 0.4 * P.fl2, dt, 16 - P.fl2 * 5, 3.5);
      const a = springs.sleeve.x * 5;
      P.sleeves.forEach((sl, i) => sl.setAttribute('transform', `rotate(${(i ? a * 0.6 : -a).toFixed(2)} 146 114)`));
      springs.drape = springStep(springs.drape, wind * dir * P.fl2, dt, 10, 2.6);
      if (P.drape) P.drape.setAttribute('transform', `rotate(${(springs.drape.x * 2.2).toFixed(2)} 250 112)`);
      if (P.tail) P.tail.setAttribute('transform', `translate(252 108) matrix(1 0 ${(springs.drape.x * 0.12).toFixed(4)} 1 0 0) translate(-252 -108)`);
      if (wind > 0.75 && P.fl1 > 0.5 && t - lastRustle > 2.2) { lastRustle = t; sfx.rustle(Math.min(1, (wind - 0.6) * 2) * P.fl1); }
    }
    
    el.querySelectorAll('.sc-curtain').forEach((c, i) => {
      const k = still ? 0 : wind * (0.8 + 0.2 * Math.sin(t * 3 + i)) * (i ? -1 : 1);
      c.style.transform = `skewX(${(k * 9).toFixed(2)}deg) scaleX(${(1 + Math.abs(k) * 0.25).toFixed(3)})`;
    });
    
    const w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(2, (window.devicePixelRatio || 1));
    if (W !== Math.round(w * dpr) || H !== Math.round(h * dpr)) { W = cv.width = Math.round(w * dpr); H = cv.height = Math.round(h * dpr); }
    g.clearRect(0, 0, W, H);
    if (still) return;
    const night = el.classList.contains('night');
    for (let i = motes.length - 1; i >= 0; i--) {
      const m = motes[i];
      m.ph += dt;
      
      m.vx += Math.sin(m.ph * 1.3) * 0.00002 + wind * dir * 0.00006;
      m.vy += 0.000012 - wind * 0.00005 * Math.abs(Math.sin(m.ph));
      if (m.life > 0) { m.vy += 0.00005; m.life -= dt * 0.22; }
      m.vx *= 0.97; m.vy *= 0.97;
      m.x += m.vx * 60 * dt; m.y += m.vy * 60 * dt;
      if (m.life > 0 && m.life <= 0.02) { motes.splice(i, 1); continue; }
      if (m.life < 0 && (m.y > 1 || m.x < 0.1 || m.x > 1.02 || m.y < 0.05)) { Object.assign(m, spawn(true)); continue; }
      let beam = BEAMS.some((b) => inPoly(m.x, m.y, b)) ? 1 : 0;
      const a = (night ? 0.03 + beam * 0.1 : 0.02 + beam * 0.55) * (m.life > 0 ? Math.min(1, m.life * 1.5) * 1.4 : 1) * (0.6 + 0.4 * Math.sin(m.ph * 2.1));
      if (a < 0.01) continue;
      g.fillStyle = night ? `rgba(200,215,255,${a.toFixed(3)})` : `rgba(255,244,214,${a.toFixed(3)})`;
      g.beginPath(); g.arc(m.x * W, m.y * H, m.r * dpr, 0, 6.283); g.fill();
    }
  }
  raf = requestAnimationFrame(frame);
  return {
    leave() { cancelAnimationFrame(raf); setWind(0); },
    apply,
    setDress(html, design2) {
      el.querySelector('.sc-dress').innerHTML = html;
      cur = design2; P = parts(); springs = newSprings();
    },
    puff,
  };
}
