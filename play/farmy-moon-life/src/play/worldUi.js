















import { flightPoint } from 'moon/play/money.mjs';

const clock = (s) => (s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${s}s`);

export function createWorldUi({ layer, coinsEl, iconFor }) {
  const iconCanvas = (good, size, cls) => {
    const c = document.createElement('canvas');
    c.width = c.height = size * 2;
    c.className = cls;
    iconFor(good, { size: size * 2 }).then((src) => c.getContext('2d').drawImage(src, 0, 0, size * 2, size * 2));
    return c;
  };

  
  const coinIcon = iconCanvas('coin', 30, 'icon');
  const coinNum = document.createElement('b');
  coinNum.textContent = '0';
  coinsEl.replaceChildren(coinIcon, coinNum);
  let lastCoins = null;
  function coins(n) {
    const v = Math.round(n);
    if (v === lastCoins) return;
    lastCoins = v;
    coinNum.textContent = v.toLocaleString('en-AU');
  }
  function bump() {
    coinsEl.classList.remove('bump');
    void coinsEl.offsetWidth;
    coinsEl.classList.add('bump');
  }
  function coinTarget() {
    const r = coinIcon.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  
  const timerPool = new Map();
  function timerEl(key) {
    let t = timerPool.get(key);
    if (!t) {
      const root = document.createElement('div');
      root.className = 'timer';
      const ring = document.createElement('div');
      ring.className = 'ring';
      const label = document.createElement('span');
      label.className = 'label';
      root.append(ring, label);
      layer.append(root);
      t = { root, ring, label, output: null, icon: null, sig: '' };
      timerPool.set(key, t);
    }
    return t;
  }
  function timers(list) {
    const seen = new Set();
    for (const v of list) {
      if (v.idle || !v.inView) continue;
      seen.add(v.key);
      const t = timerEl(v.key);
      if (t.output !== v.output) {
        if (t.icon) t.icon.remove();
        t.icon = iconCanvas(v.output, 26, 'icon');
        t.ring.append(t.icon);
        t.output = v.output;
      }
      const text = v.finished ? `Ready ×${v.ready}` : `${v.done}/${v.batches} · ${clock(v.remainingS)}`;
      const sig = `${text}|${v.ready > 0}|${Math.round(v.progress * 100)}`;
      if (sig !== t.sig) {
        t.sig = sig;
        t.label.textContent = text;
        t.root.classList.toggle('ready', v.ready > 0);
        t.ring.style.setProperty('--p', String(v.progress));
      }
      t.root.hidden = false;
      t.root.style.transform = `translate(${Math.round(v.x)}px, ${Math.round(v.y)}px)`;
    }
    for (const [key, t] of timerPool) {
      if (seen.has(key)) continue;
      t.root.remove();
      timerPool.delete(key);
    }
  }

  
  const flying = new Map(); 
  function flights(list) {
    const to = coinTarget();
    const seen = new Set();
    for (const f of list) {
      for (let k = 0; k < f.icons; k++) {
        const key = `${f.id}|${k}`;
        const p = flightPoint(f.from, to, f.u, k);
        if (!p.visible) continue;
        seen.add(key);
        let c = flying.get(key);
        if (!c) {
          c = iconCanvas('coin', 34, 'flying-coin');
          layer.append(c);
          flying.set(key, c);
        }
        c.style.transform = `translate(${Math.round(p.x - 17)}px, ${Math.round(p.y - 17)}px) scale(${p.scale.toFixed(3)})`;
      }
    }
    for (const [key, c] of flying) {
      if (seen.has(key)) continue;
      c.remove();
      flying.delete(key);
    }
  }

  
  
  
  
  const GAIN_MS = 1600;
  const gains = new Map(); 
  let lastGain = '';
  function gain(id, amount, at, startMs) {
    if (gains.has(id)) return;
    const el = document.createElement('div');
    el.className = 'gain';
    el.textContent = `+${amount}`;
    el.style.left = `${Math.round(at.x)}px`;
    el.style.top = `${Math.round(at.y)}px`;
    layer.append(el);
    gains.set(id, { el, startMs });
    lastGain = el.textContent;
  }
  function updateGains(nowMs) {
    for (const [id, g] of gains) {
      const u = (nowMs - g.startMs) / GAIN_MS;
      if (u >= 1) { g.el.remove(); gains.delete(id); continue; }
      const k = Math.max(0, u);
      g.el.style.opacity = String(k < 0.15 ? k / 0.15 : 1 - Math.max(0, (k - 0.6) / 0.4));
      g.el.style.marginTop = `${Math.round(10 - 64 * Math.sqrt(k))}px`;
    }
  }

  
  
  
  
  
  const SPEND_S = 0.95;
  const spends = new Map(); 
  let lastSpend = '';
  function spend(id, amount, startS) {
    if (spends.has(id) || !(amount > 0)) return;
    const label = document.createElement('div');
    label.className = 'spend';
    label.textContent = `-${amount.toLocaleString('en-AU')}`;
    layer.append(label);
    const icons = Math.max(1, Math.min(5, Math.ceil(amount / 300)));
    spends.set(id, { startS, icons, els: [], label });
    lastSpend = label.textContent;
  }
  function updateSpends(nowS, to) {
    const from = coinTarget();
    for (const [id, s] of spends) {
      const u = (nowS - s.startS) / SPEND_S;
      if (u >= 1.35) { s.label.remove(); for (const c of s.els) c.remove(); spends.delete(id); continue; }
      const k = Math.max(0, u);
      s.label.style.left = `${Math.round(from.x + 44)}px`;
      s.label.style.top = `${Math.round(from.y + 30 + 26 * Math.min(1, k))}px`;
      s.label.style.opacity = String(k < 1 ? 1 : Math.max(0, 1 - (k - 1) / 0.35));
      for (let i = 0; i < s.icons; i++) {
        if (!s.els[i]) { s.els[i] = iconCanvas('coin', 34, 'flying-coin'); layer.append(s.els[i]); }
        const p = flightPoint(from, to, Math.min(1, k), i);
        s.els[i].style.display = p.visible ? '' : 'none';
        s.els[i].style.transform = `translate(${Math.round(p.x - 17)}px, ${Math.round(p.y - 17)}px) scale(${p.scale.toFixed(3)})`;
      }
    }
  }

  return {
    timers, coins, bump, flights, gain, updateGains, coinTarget, spend, updateSpends,
    get state() {
      return {
        timers: [...timerPool.entries()].map(([key, t]) => ({ key, text: t.label.textContent, ready: t.root.classList.contains('ready') })),
        flying: flying.size,
        coinsText: coinNum.textContent,
        gains: [...gains.values()].map((g) => g.el.textContent),
        lastGain,
        spending: spends.size,
        lastSpend,
      };
    },
  };
}
