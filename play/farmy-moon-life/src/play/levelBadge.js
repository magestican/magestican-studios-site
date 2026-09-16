













const STYLE_ID = 'fml-level-badges-style';
const CSS = `
.fml-badge{position:absolute;left:0;top:0;z-index:2;display:flex;align-items:center;gap:5px;padding:4px 9px 4px 4px;border-radius:15px;
  background:rgba(255,248,236,.96);box-shadow:0 2px 8px rgba(58,47,42,.26);pointer-events:none;white-space:nowrap;will-change:transform,opacity}
.fml-badge .lv{display:grid;place-items:center;min-width:22px;height:22px;padding:0 4px;box-sizing:border-box;border-radius:11px;
  background:#e8a15a;color:#fff;font:800 14px/1 system-ui,sans-serif}
.fml-badge .hearts{display:flex;gap:1px}
.fml-badge svg{width:15px;height:15px;display:block}
.fml-badge .on path{fill:#e8577b;stroke:#c23d62}
.fml-badge .off path{fill:#f4e2d0;stroke:#d9b99c}
.fml-badge .plus{position:absolute;left:50%;top:-3px;transform:translate(-50%,-100%);color:#e8577b;font:900 17px/1 system-ui,sans-serif;
  text-shadow:0 1px 0 #fff,0 -1px 0 #fff,1px 0 0 #fff,-1px 0 0 #fff}
`;
const HEART = 'M12 21s-7.4-4.5-9.9-9.2C.5 8.6 2.4 4.2 6.4 4.2c2.2 0 3.8 1.2 5.6 3.3 1.8-2.1 3.4-3.3 5.6-3.3 4 0 5.9 4.4 4.3 7.6C19.4 16.5 12 21 12 21z';

export const LEVEL_BADGE = Object.freeze({ liftM: 0.62, gainShowS: 1.8 });

export function createLevelBadges({ layer, cfg = LEVEL_BADGE }) {
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }
  const pool = new Map();
  let visibleIds = [], gains = 0, last = null;
  const snap = (v) => Math.round(v * (window.devicePixelRatio || 1)) / (window.devicePixelRatio || 1);

  function heartsEl(n) {
    const wrap = document.createElement('span');
    wrap.className = 'hearts';
    const svgs = [];
    for (let i = 0; i < n; i++) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', HEART);
      path.setAttribute('stroke-width', '2');
      svg.appendChild(path);
      wrap.appendChild(svg);
      svgs.push(svg);
    }
    return { wrap, svgs };
  }

  function entry(id, heartsOf) {
    let e = pool.get(id);
    if (!e) {
      const el = document.createElement('div');
      el.className = 'fml-badge';
      el.dataset.villager = String(id);
      el.setAttribute('aria-hidden', 'true');
      const lv = document.createElement('b');
      lv.className = 'lv';
      const { wrap, svgs } = heartsEl(heartsOf);
      const plus = document.createElement('span');
      plus.className = 'plus';
      plus.hidden = true;
      el.append(lv, wrap, plus);
      layer.appendChild(el);
      e = { el, lv, svgs, plus, sig: '', shown: true, w: 0, h: 0, x: NaN, y: NaN, points: null, flashUntil: -1 };
      pool.set(id, e);
    }
    return e;
  }

  function hide(e) { if (e.shown) { e.el.style.display = 'none'; e.shown = false; } }

  function update(list, { screenOf, nowS }) {
    visibleIds = [];
    const live = new Set();
    for (const v of list) {
      live.add(v.id);
      const s = v.state;
      const e = entry(v.id, s.heartsOf);
      if (e.points !== null && s.points > e.points) {
        e.plus.textContent = `+${s.points - e.points}`;
        e.flashUntil = nowS + cfg.gainShowS;
        gains += 1;
        last = { id: v.id, points: s.points - e.points };
      }
      e.points = s.points;
      const flashing = nowS < e.flashUntil;
      if (e.plus.hidden === flashing) e.plus.hidden = !flashing;
      const c = (s.visible || flashing) && v.drawn !== false ? screenOf(v.x, v.y + cfg.liftM, v.z) : null;
      if (!c || !c.inView) { hide(e); continue; }
      const sig = `${s.level}|${s.hearts}`;
      if (sig !== e.sig) {
        e.sig = sig;
        e.lv.textContent = String(s.level);
        e.svgs.forEach((svg, i) => svg.setAttribute('class', i < s.hearts ? 'on' : 'off'));
        e.w = 0;
      }
      if (!e.shown) { e.el.style.display = ''; e.shown = true; e.w = 0; }
      if (!e.w) { e.w = e.el.offsetWidth; e.h = e.el.offsetHeight; }
      const x = snap(c.x - e.w / 2), y = snap(c.y - e.h);
      if (x !== e.x || y !== e.y) { e.el.style.transform = `translate3d(${x}px,${y}px,0)`; e.x = x; e.y = y; }
      visibleIds.push(v.id);
    }
    for (const [id, e] of pool) if (!live.has(id)) hide(e);
  }

  return { update, get stats() { return { visible: visibleIds.slice(), gains, last }; } };
}
