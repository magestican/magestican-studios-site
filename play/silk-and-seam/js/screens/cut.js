
import { state, save } from '../state.js';
import { go, toast, $ } from '../ui.js';
import { pieceOutlines, sample, fabricSheet, svgImage, lum } from '../art.js';
import { dye } from '../logic.js';
import { sfx } from '../audio.js';

const W = 1280, H = 664, TOL = 16, LOOK = 14;
const SHEET = { x: 110, y: 40, w: 820, h: 584 };

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
  return c;
}

export default {
  enter(root) {
    const job = state.job;
    if (!job) { go('hub'); return; }
    const d = job.design;
    const pieces = pieceOutlines(d);
    job.cut = job.cut || [];
    root.innerHTML = `<div class="workshop"><canvas width="${W}" height="${H}"></canvas>
      <div class="ws-panel paper"><h2>Cutting Table</h2><div class="ws-steps" id="steps"></div>
      <p>Press on the <b style="color:#c0392b">●</b> and drag the scissors along the chalk line all the way round.</p>
      <div class="big" id="acc">-</div><p style="text-align:center;margin:0">accuracy on this piece</p></div>
      <button class="btn small ghost ws-skip" id="skip" style="color:#f3e6cf;border-color:#a88">Let the apprentice cut (70%)</button></div>`;
    const cv = $('canvas', root), g = cv.getContext('2d');
    const mat = matCanvas();
    let idx = job.cut.length, cur = null;

    function setup() {
      if (idx >= pieces.length) { finish(); return; }
      const pc = pieces[idx];
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
      cur = { pc, pts, prog: 0, devs: [], wobble: 0, lastWob: 0, down: false, done: 0, img: svgImage(fabricSheet(fabId, dyeId, SHEET.w, SHEET.h)), dark: lum(dye(dyeId).hex) > 0.55, snipN: 0, mouse: null, flash: 0 };
      steps();
    }

    function steps() {
      $('#steps', root).innerHTML = pieces.map((p, i) => `<span class="${i < idx ? 'done' : i === idx ? 'now' : ''}">${p.name}${i < idx ? ` ${Math.round(job.cut[i] * 100)}%` : ''}</span>`).join('');
    }

    function acc() {
      if (!cur.devs.length) return 1;
      const m = cur.devs.reduce((a, b) => a + (1 - Math.min(b, TOL) / TOL), 0) / cur.devs.length;
      return Math.max(0.3, Math.min(1, m * 0.85 + 0.15 - cur.wobble * 0.04));
    }

    function pos(e) {
      const r = cv.getBoundingClientRect();
      return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height };
    }

    function move(p) {
      if (!cur || cur.done) return;
      cur.mouse = p;
      if (!cur.down) return;
      
      let best = -1, bd = Infinity;
      for (let j = cur.prog; j <= Math.min(cur.pts.length - 1, cur.prog + LOOK); j++) {
        const dd = Math.hypot(p.x - cur.pts[j].x, p.y - cur.pts[j].y);
        if (dd < TOL && j > best && j > cur.prog) best = j;
        if (j > cur.prog) bd = Math.min(bd, segDist(p, cur.pts[j - 1], cur.pts[j]));
      }
      bd = Math.max(0, bd - 3);   
      if (best > 0) {
        for (let j = cur.prog + 1; j <= best; j++) cur.devs.push(bd);
        cur.prog = best;
        if (++cur.snipN % 5 === 0) sfx.snip();
        $('#acc', root).textContent = `${Math.round(acc() * 100)}%`;
        if (cur.prog >= cur.pts.length - 1) complete();
      } else {
        const near = Math.hypot(p.x - cur.pts[cur.prog].x, p.y - cur.pts[cur.prog].y);
        const now = performance.now();
        if (near > TOL * 2.2 && now - cur.lastWob > 450) { cur.wobble++; cur.lastWob = now; cur.flash = 1; $('#acc', root).textContent = `${Math.round(acc() * 100)}%`; }
      }
    }

    function complete() {
      cur.done = performance.now();
      const a = acc();
      job.cut.push(a); save();
      sfx.snip(); setTimeout(sfx.snip, 90);
      toast(`${cur.pc.name} cut - ${Math.round(a * 100)}%`, a > 0.85 ? 'good' : '');
      setTimeout(() => { idx++; setup(); }, 1000);
    }

    function finish() {
      cancelAnimationFrame(raf);
      job.cutAcc = job.cut.reduce((a, b) => a + b, 0) / job.cut.length;
      job.step = 'sew'; save();
      go('sew');
    }

    function draw(t) {
      raf = requestAnimationFrame(draw);
      g.drawImage(mat, 0, 0);
      if (!cur) return;
      
      g.save(); g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 16; g.shadowOffsetY = 6;
      g.fillStyle = '#ccc'; g.fillRect(SHEET.x, SHEET.y, SHEET.w, SHEET.h); g.restore();
      if (cur.img.complete) g.drawImage(cur.img, SHEET.x, SHEET.y);
      const P = cur.pts;
      const chalk = cur.dark ? 'rgba(60,40,30,.8)' : 'rgba(255,250,235,.9)';
      if (cur.done) {
        
        const k = Math.min(1, (t - cur.done) / 600);
        g.save(); g.beginPath(); P.forEach((q, i) => (i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y))); g.closePath();
        g.fillStyle = 'rgba(0,0,0,.35)'; g.translate(0, 0); g.fill();
        g.translate(-6 * k, -14 * k); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 18 * k; g.clip();
        if (cur.img.complete) g.drawImage(cur.img, SHEET.x, SHEET.y);
        g.restore();
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
      if (cur.mouse) {
        const q = P[Math.min(P.length - 1, cur.prog + 3)];
        const ang = Math.atan2(q.y - nx.y, q.x - nx.x);
        g.save(); g.translate(cur.mouse.x, cur.mouse.y); g.rotate(ang + (cur.down ? Math.sin(t / 40) * 0.15 : 0));
        g.font = '38px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillStyle = '#222'; g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 6; g.fillText('✂', 0, 0);
        g.restore();
      }
    }

    const onDown = (e) => {
      if (!cur || cur.done) return;
      const p = pos(e);
      const start = cur.pts[cur.prog];
      if (Math.hypot(p.x - start.x, p.y - start.y) > TOL * 1.6) { toast('Start at the red dot'); return; }
      cur.down = true; cv.setPointerCapture(e.pointerId); move(p);
    };
    const onMove = (e) => move(pos(e));
    const onUp = () => { if (cur) cur.down = false; };
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', onUp);
    cv.style.cursor = 'none';
    $('#skip', root).onclick = () => {
      while (idx < pieces.length) { job.cut.push(0.7); idx++; }
      save(); finish();
    };
    setup();
    window.__cut = () => cur;   
    raf = requestAnimationFrame(draw);
    cleanup = () => cancelAnimationFrame(raf);
  },
  leave() { if (cleanup) cleanup(); cleanup = null; },
};
