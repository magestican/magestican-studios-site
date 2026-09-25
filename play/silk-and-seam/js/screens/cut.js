
import { state, save } from '../state.js';
import { go, toast, auntNote, calm, $ } from '../ui.js';
import { pieceOutlines, sample, fabricSheet, svgImage, lum, shade } from '../art.js';
import { dye, tolerances, cutAccuracy, scrapsFrom, addScraps } from '../logic.js';
import { sfx } from '../audio.js';

const W = 1280, H = 664, LOOK = 14;
const SHEET = { x: 110, y: 40, w: 820, h: 584 };
const STACK = { x: 1140, y: 540 };   

let raf = 0, cleanup = null;

function segDist(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, L = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / L));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function matCanvas() {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const wood = g.createLinearGradient(0, 0, 0, H); wood.addColorStop(0, '#6d4a30'); wood.addColorStop(1, '#4b3120');
  g.fillStyle = wood; g.fillRect(0, 0, W, H);
  g.fillStyle = '#2f5a4a'; g.fillRect(70, 14, 900, 636);
  g.strokeStyle = 'rgba(220,240,230,.18)'; g.lineWidth = 1;
  for (let x = 70; x <= 970; x += 20) { g.beginPath(); g.moveTo(x, 14); g.lineTo(x, 650); g.stroke(); }
  for (let y = 14; y <= 650; y += 20) { g.beginPath(); g.moveTo(70, y); g.lineTo(970, y); g.stroke(); }
  g.strokeStyle = 'rgba(240,220,120,.35)';
  for (let x = 70; x <= 970; x += 100) { g.beginPath(); g.moveTo(x, 14); g.lineTo(x, 650); g.stroke(); }
  g.fillStyle = 'rgba(240,230,200,.5)'; g.font = '11px serif';
  for (let i = 0; i <= 9; i++) g.fillText(String(i * 5), 73 + i * 100, 26);
  
  g.save(); g.translate(STACK.x, STACK.y - 30); g.rotate(-0.04);
  g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-92, -78, 190, 170);
  g.fillStyle = '#e9dcc3'; g.fillRect(-96, -84, 190, 170);
  g.strokeStyle = 'rgba(150,110,70,.35)'; g.setLineDash([4, 4]); g.strokeRect(-88, -76, 174, 154); g.setLineDash([]);
  g.fillStyle = 'rgba(110,80,50,.7)'; g.font = 'italic 14px Georgia'; g.textAlign = 'center'; g.fillText('cut pieces', 0, 78);
  g.restore();
  return c;
}



function drawScissors(g, x, y, ang, open) {
  g.save(); g.translate(x, y); g.rotate(ang);
  g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 7; g.shadowOffsetX = 3; g.shadowOffsetY = 6;
  for (const s of [-1, 1]) {
    g.save(); g.rotate(s * open);
    
    const gr = g.createLinearGradient(0, 0, 0, 6 * s);
    gr.addColorStop(0, '#f6f8fa'); gr.addColorStop(0.45, '#c3c9d0'); gr.addColorStop(1, '#6c737c');
    g.fillStyle = gr; g.strokeStyle = '#4c525a'; g.lineWidth = 0.8;
    g.beginPath(); g.moveTo(-4, 0); g.lineTo(44, 0); g.quadraticCurveTo(22, 7 * s, -4, 5.5 * s); g.closePath(); g.fill(); g.stroke();
    
    g.strokeStyle = '#2a2224'; g.lineWidth = 5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-2, -1 * s); g.quadraticCurveTo(-12, -3 * s, -18, -8 * s); g.stroke();
    g.lineWidth = 4.5; g.beginPath(); g.ellipse(-28, -11 * s, 11, 7.5, s * 0.25, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 1.2;
    g.beginPath(); g.ellipse(-28, -11 * s, 11, 7.5, s * 0.25, Math.PI * 1.1, Math.PI * 1.7); g.stroke();
    g.restore();
  }
  g.shadowColor = 'transparent';
  const br = g.createRadialGradient(-1, -1, 0.5, 0, 0, 4.2); br.addColorStop(0, '#fff1b8'); br.addColorStop(1, '#a8812f');
  g.fillStyle = br; g.beginPath(); g.arc(0, 0, 4, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#6b4a1c'; g.fillRect(-2.2, -0.5, 4.4, 1);
  g.restore();
}

export default {
  enter(root) {
    const job = state.job;
    if (!job) { go('hub'); return; }
    const d = job.design;
    const pieces = pieceOutlines(d);
    job.cut = job.cut || [];
    
    const tol = tolerances(state.upgrades);
    const TOL = tol.cutTol;
    let touch = false;
    const reach = () => TOL + (touch ? 6 : 0);
    root.innerHTML = `<div class="workshop"><canvas width="${W}" height="${H}"></canvas>
      <div class="ws-panel paper"><h2>Cutting Table</h2><div class="ws-steps" id="steps"></div>
      <p>Press on the <b style="color:#c0392b">●</b> and drag the scissors along the chalk line all the way round.</p>
      <div class="big" id="acc">-</div><p style="text-align:center;margin:0">accuracy on this piece</p></div>
      <button class="btn small ghost ws-skip" id="skip" style="color:#f3e6cf;border-color:#a88">Let the apprentice cut (70%)</button></div>`;
    const cv = $('canvas', root), g = cv.getContext('2d');
    const mat = matCanvas();
    let idx = job.cut.length, cur = null;
    const stack = [], bits = [];

    
    function geom(i) {
      const pc = pieces[i];
      const raw = sample(pc.d, 1.5);
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const q of raw) { x0 = Math.min(x0, q.x); y0 = Math.min(y0, q.y); x1 = Math.max(x1, q.x); y1 = Math.max(y1, q.y); }
      const s = Math.min((SHEET.w - 140) / (x1 - x0), (SHEET.h - 120) / (y1 - y0), 4);
      const cx = SHEET.x + SHEET.w / 2, cy = SHEET.y + SHEET.h / 2;
      const tf = (q) => ({ x: cx + (q.x - (x0 + x1) / 2) * s, y: cy + (q.y - (y0 + y1) / 2) * s });
      
      const all = raw.map(tf);
      const pts = [all[0]];
      for (const q of all) { const l = pts[pts.length - 1]; if (Math.hypot(q.x - l.x, q.y - l.y) >= 8) pts.push(q); }
      pts.push(all[0]);
      const dyeId = pc.slot === 2 ? d.dye2 : d.dye1, fabId = pc.slot === 2 ? d.fab2 : d.fab1;
      return { pc, pts, dyeId, img: svgImage(fabricSheet(fabId, dyeId, SHEET.w, SHEET.h)), w: (x1 - x0) * s, h: (y1 - y0) * s };
    }

    
    function toStack(gm, t0, instant) {
      const path = new Path2D();
      gm.pts.forEach((q, i) => (i ? path.lineTo(q.x - 520, q.y - 332) : path.moveTo(q.x - 520, q.y - 332)));
      path.closePath();
      const n = stack.length;
      const s = Math.min(118 / gm.w, 96 / gm.h);
      stack.push({ path, img: gm.img, t0: instant ? -1e9 : t0, from: { x: 514, y: 318, s: 1, r: 0 },
        to: { x: STACK.x + ((n * 37) % 23) - 11, y: STACK.y - 24 - n * 7, s, r: (((n * 53) % 40) - 20) / 100 }, edge: shade(dye(gm.dyeId).hex, -0.35) });
    }
    for (let i = 0; i < idx && i < pieces.length; i++) toStack(geom(i), 0, true);

    function setup() {
      if (idx >= pieces.length) { finish(); return; }
      const gm = geom(idx);
      cur = { ...gm, prog: 0, devs: [], wobble: 0, lastWob: 0, down: false, done: 0, dark: lum(dye(gm.dyeId).hex) > 0.55, snipN: 0, mouse: null, flash: 0, open: 0.3, gm };
      steps();
    }

    function steps() {
      $('#steps', root).innerHTML = pieces.map((p, i) => `<span class="${i < idx ? 'done' : i === idx ? 'now' : ''}">${p.name}${i < idx ? ` ${Math.round(job.cut[i] * 100)}%` : ''}</span>`).join('');
    }

    function acc() {
      return cutAccuracy(cur.devs, cur.wobble, tol);
    }

    function pos(e) {
      const r = cv.getBoundingClientRect();
      return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height };
    }

    
    function snipBits(p, n) {
      if (calm()) return;
      const col = dye(cur.dyeId).hex;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = 40 + Math.random() * 90;
        bits.push({ x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: 0.5 + Math.random() * 0.5, age: 0,
          rot: Math.random() * 6, spin: (Math.random() - 0.5) * 14, len: 3 + Math.random() * 5, col: Math.random() < 0.3 ? '#f3ead8' : shade(col, (Math.random() - 0.5) * 0.4) });
      }
    }

    function move(p) {
      if (!cur || cur.done) return;
      cur.mouse = p;
      if (!cur.down) return;
      
      let best = -1, bd = Infinity;
      for (let j = cur.prog; j <= Math.min(cur.pts.length - 1, cur.prog + LOOK); j++) {
        const dd = Math.hypot(p.x - cur.pts[j].x, p.y - cur.pts[j].y);
        if (dd < reach() && j > best && j > cur.prog) best = j;
        if (j > cur.prog) bd = Math.min(bd, segDist(p, cur.pts[j - 1], cur.pts[j]));
      }
      
      if (best > 0) {
        for (let j = cur.prog + 1; j <= best; j++) cur.devs.push(bd);
        cur.prog = best;
        cur.open = 0.02;   
        if (++cur.snipN % 5 === 0) { sfx.snip(); snipBits(cur.pts[cur.prog], 5); } else if (cur.snipN % 2 === 0) snipBits(cur.pts[cur.prog], 1);
        $('#acc', root).textContent = `${Math.round(acc() * 100)}%`;
        if (cur.prog >= cur.pts.length - 1) complete();
      } else {
        const near = Math.hypot(p.x - cur.pts[cur.prog].x, p.y - cur.pts[cur.prog].y);
        const now = performance.now();
        if (near > reach() * 2.2 && now - cur.lastWob > 450) { cur.wobble++; cur.lastWob = now; cur.flash = 1; $('#acc', root).textContent = `${Math.round(acc() * 100)}%`; }
      }
    }

    function complete() {
      cur.done = performance.now();
      const a = acc();
      job.cut.push(a); save();
      sfx.snip(); setTimeout(sfx.snip, 90);
      snipBits(cur.pts[cur.pts.length - 1], 10);
      toStack(cur.gm, cur.done + 520, calm());
      toast(`${cur.pc.name} cut - ${Math.round(a * 100)}%`, a > 0.85 ? 'good' : '');
      setTimeout(() => { idx++; setup(); }, 1000);
    }

    function finish() {
      cancelAnimationFrame(raf);
      job.cutAcc = job.cut.reduce((a, b) => a + b, 0) / job.cut.length;
      
      if (!job.scrapped) {
        const add = scrapsFrom(d, job.cutAcc);
        state.scraps = addScraps(state.scraps, add);
        job.scrapped = true;
        const m = Object.values(add).reduce((a, b) => a + b, 0);
        if (m > 0) toast(`${m.toFixed(2)} m of scraps saved for the workbench`);
      }
      job.step = 'sew'; save();
      go('sew');
    }

    const ease = (k) => 1 - Math.pow(1 - k, 3);
    function drawStack(t) {
      for (const it of stack) {
        const k = ease(Math.max(0, Math.min(1, (t - it.t0) / 450)));
        if (t < it.t0) continue;   
        const x = it.from.x + (it.to.x - it.from.x) * k, y = it.from.y + (it.to.y - it.from.y) * k;
        const s = it.from.s + (it.to.s - it.from.s) * k, r = it.to.r * k;
        g.save(); g.translate(x, y); g.rotate(r); g.scale(s, s);
        g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 8; g.shadowOffsetY = 3;   
        g.fillStyle = it.edge; g.fill(it.path);
        g.shadowColor = 'transparent';
        g.clip(it.path);
        if (it.img.complete) g.drawImage(it.img, SHEET.x - 520, SHEET.y - 332);
        g.restore();
        g.save(); g.translate(x, y); g.rotate(r); g.scale(s, s);
        g.strokeStyle = it.edge; g.lineWidth = 1.5 / s; g.stroke(it.path); g.restore();
      }
    }

    function drawBits(dt) {
      for (let i = bits.length - 1; i >= 0; i--) {
        const b = bits[i];
        b.age += dt; if (b.age >= b.life) { bits.splice(i, 1); continue; }
        b.vy += 260 * dt; b.vx *= 0.97; b.x += b.vx * dt; b.y += b.vy * dt; b.rot += b.spin * dt;
        g.save(); g.globalAlpha = 1 - b.age / b.life; g.translate(b.x, b.y); g.rotate(b.rot);
        g.strokeStyle = b.col; g.lineWidth = 1.4; g.lineCap = 'round';
        g.beginPath(); g.moveTo(-b.len / 2, 0); g.quadraticCurveTo(0, b.len * 0.3, b.len / 2, 0); g.stroke();
        g.restore();
      }
    }

    let last = performance.now();
    function draw(t) {
      raf = requestAnimationFrame(draw);
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      g.drawImage(mat, 0, 0);
      if (!cur) return;
      
      g.save(); g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 16; g.shadowOffsetY = 6;
      g.fillStyle = '#ccc'; g.fillRect(SHEET.x, SHEET.y, SHEET.w, SHEET.h); g.restore();
      if (cur.img.complete) g.drawImage(cur.img, SHEET.x, SHEET.y);
      const P = cur.pts;
      const chalk = cur.dark ? 'rgba(60,40,30,.8)' : 'rgba(255,250,235,.9)';
      if (cur.done) {
        
        const k = Math.min(1, (t - cur.done) / 500);
        g.save(); g.beginPath(); P.forEach((q, i) => (i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y))); g.closePath();
        g.fillStyle = '#2f5a4a'; g.fill(); g.fillStyle = 'rgba(0,0,0,.3)'; g.fill();
        if (t < cur.done + 520) {
          g.translate(-6 * k, -14 * k); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 18 * k; g.clip();
          if (cur.img.complete) g.drawImage(cur.img, SHEET.x, SHEET.y);
        }
        g.restore();
        drawStack(t); drawBits(dt);
        return;
      }
      g.setLineDash([9, 7]); g.lineWidth = 2.2; g.strokeStyle = chalk;
      g.beginPath(); P.forEach((q, i) => (i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y))); g.stroke(); g.setLineDash([]);
      
      g.fillStyle = chalk;
      for (let i = 12; i < P.length; i += 24) g.fillRect(P[i].x - 2, P[i].y - 2, 4, 4);
      if (cur.prog > 0) {
        g.strokeStyle = cur.dark ? '#1e1410' : '#2a1a10'; g.lineWidth = 3;
        g.beginPath(); for (let i = 0; i <= cur.prog; i++) (i ? g.lineTo(P[i].x, P[i].y) : g.moveTo(P[i].x, P[i].y)); g.stroke();
      }
      
      const nx = P[Math.min(P.length - 1, cur.prog)];
      const pulse = 7 + Math.sin(t / 180) * 2.5;
      g.fillStyle = '#c0392b'; g.beginPath(); g.arc(nx.x, nx.y, pulse, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
      
      const ah = P[Math.min(P.length - 1, cur.prog + 6)];
      g.strokeStyle = 'rgba(192,57,43,.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(nx.x, nx.y); g.lineTo(ah.x, ah.y); g.stroke();
      if (cur.flash > 0) { g.fillStyle = `rgba(200,40,40,${cur.flash * 0.18})`; g.fillRect(0, 0, W, H); cur.flash -= 0.05; }
      drawStack(t); drawBits(dt);
      if (cur.mouse) {
        const q = P[Math.min(P.length - 1, cur.prog + 3)];
        const ang = Math.atan2(q.y - nx.y, q.x - nx.x);
        
        cur.open += ((cur.down ? 0.2 : 0.3) - cur.open) * Math.min(1, dt * 9);
        drawScissors(g, cur.mouse.x, cur.mouse.y, ang, cur.open);
      }
    }

    const onDown = (e) => {
      if (!cur || cur.done) return;
      const p = pos(e);
      const start = cur.pts[cur.prog];
      touch = e.pointerType === 'touch';
      if (Math.hypot(p.x - start.x, p.y - start.y) > TOL * (touch ? 3.5 : 1.6)) { toast('Start at the red dot'); return; }
      cur.down = true; cv.setPointerCapture(e.pointerId); move(p);
    };
    const onMove = (e) => move(pos(e));
    const onUp = () => { if (cur) cur.down = false; };
    const onLeave = () => { if (cur && !cur.down) cur.mouse = null; };
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', onUp);
    cv.addEventListener('pointerleave', onLeave);
    cv.style.cursor = 'none';
    cv.style.touchAction = 'none';
    $('#skip', root).onclick = () => {
      while (idx < pieces.length) { job.cut.push(0.7); idx++; }
      save(); finish();
    };
    setup();
    window.__cut = () => cur;   
    raf = requestAnimationFrame(draw);
    cleanup = () => cancelAnimationFrame(raf);
    auntNote('cut');
  },
  leave() { if (cleanup) cleanup(); cleanup = null; },
};
