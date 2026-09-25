
import { state, save } from '../state.js';
import { go, toast, $ } from '../ui.js';
import { pieceOutlines, fabricSheet, svgImage, lum, shade } from '../art.js';
import { dye, part } from '../logic.js';
import { sfx, machineHum } from '../audio.js';

const W = 1280, H = 664;
const NX = 520, NY = 390;            
const FW = 560, TILE = 700;          
const SPEEDS = [0, 70, 120, 175];    
const STITCH = 9;

let raf = 0, cleanup = null;

function tableCanvas() {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const wood = g.createLinearGradient(0, 0, W, H); wood.addColorStop(0, '#b8844f'); wood.addColorStop(1, '#8a5c34');
  g.fillStyle = wood; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(80,45,20,.25)'; g.lineWidth = 2;
  for (let y = 40; y < H; y += 95) { g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(400, y + 8, 800, y - 8, W, y + 4); g.stroke(); }
  g.strokeStyle = 'rgba(255,230,190,.08)'; g.lineWidth = 1;
  for (let y = 10; y < H; y += 13) { g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(300, y + 5, 900, y - 5, W, y); g.stroke(); }
  return c;
}

function machineCanvas() {
  const c = document.createElement('canvas'); c.width = W; c.height = 230;
  const g = c.getContext('2d');
  const body = g.createLinearGradient(0, 0, 0, 220); body.addColorStop(0, '#2a2426'); body.addColorStop(0.6, '#141012'); body.addColorStop(1, '#070506');
  g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.roundRect(NX - 70, 20, 780, 190, 40); g.fill();
  g.fillStyle = body;
  g.beginPath(); g.roundRect(NX - 80, -40, 780, 210, 36); g.fill();          
  g.beginPath(); g.roundRect(NX - 60, 60, 120, 160, 24); g.fill();           
  
  g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 3; g.beginPath(); g.moveTo(NX - 50, 18); g.lineTo(NX + 660, 18); g.stroke();
  
  g.strokeStyle = '#d6b060'; g.lineWidth = 2;
  const scroll = (x, y, s) => { g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 20 * s, y - 20, x + 50 * s, y + 10, x + 30 * s, y + 18); g.bezierCurveTo(x + 18 * s, y + 22, x + 14 * s, y + 8, x + 24 * s, y + 6); g.stroke(); };
  for (let i = 0; i < 5; i++) { scroll(NX + 100 + i * 110, 70, 1); scroll(NX + 190 + i * 110, 110, -1); }
  scroll(NX - 40, 120, 1); scroll(NX + 40, 120, -1);
  g.fillStyle = '#d6b060'; g.font = 'italic 26px Georgia, serif'; g.fillText('Marguerite', NX + 250, 150);
  
  g.fillStyle = '#b9b4ac'; g.beginPath(); g.arc(NX + 20, 88, 14, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#6a655e'; g.lineWidth = 2; g.stroke();
  g.fillStyle = '#3a3634'; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; g.fillRect(NX + 20 + Math.cos(a) * 10 - 1, 88 + Math.sin(a) * 10 - 1, 2, 2); }
  
  g.fillStyle = '#c9c4ba'; g.beginPath(); g.roundRect(NX + 440, 30, 150, 36, 18); g.fill();
  g.strokeStyle = '#6a655e'; g.stroke();
  return c;
}

export default {
  enter(root) {
    const job = state.job;
    if (!job) { go('hub'); return; }
    const d = job.design;
    const pieces = pieceOutlines(d);
    job.sew = job.sew || [];
    root.innerHTML = `<div class="workshop"><canvas width="${W}" height="${H}"></canvas>
      <div class="ws-panel paper"><h2>Sewing Machine</h2><div class="ws-steps" id="steps"></div>
      <p>Move the mouse (or <span class="keys"><kbd>A</kbd><kbd>D</kbd></span>) to keep the chalk line under the needle.</p>
      <p><span class="keys"><kbd>W</kbd><kbd>S</kbd></span> change speed, or hold the mouse button to sew.</p>
      <div class="big" id="spd">Stopped</div></div>
      <button class="btn small ghost ws-skip" id="skip" style="color:#3a2a1a;border-color:#6b4a33">Let the apprentice sew (70%)</button></div>`;
    const cv = $('canvas', root), g = cv.getContext('2d');
    const table = tableCanvas(), machine = machineCanvas();
    let idx = job.sew.length, cur = null, last = performance.now();
    const keys = {};

    function setup() {
      if (idx >= pieces.length) { finish(); return; }
      const pc = pieces[idx];
      const diff = part(pc.part[0], pc.part[1])?.diff || 1;
      const dyeId = pc.slot === 2 ? d.dye2 : d.dye1, fabId = pc.slot === 2 ? d.fab2 : d.fab1;
      const hex = dye(dyeId).hex;
      const r = () => Math.random() * Math.PI * 2;
      cur = {
        pc, diff, len: 1100 + diff * 350, fed: 0, fx: 0, tx: 0, speed: 0, stitches: [], accs: [], nextStitch: 0,
        a1: 30 + diff * 22, f1: 0.0035 + diff * 0.0012, p1: r(), a2: 10 + diff * 8, f2: 0.011, p2: r(),
        img: svgImage(fabricSheet(fabId, dyeId, FW, TILE)),
        thread: lum(hex) > 0.5 ? '#3a2a22' : '#f3e6cf', chalk: lum(hex) > 0.55 ? 'rgba(70,50,40,.75)' : 'rgba(255,250,235,.85)', edge: shade(hex, -0.3),
        done: 0, mouseDown: false,
      };
      cur.tx = -sx(0); cur.fx = cur.tx;
      steps();
    }
    const sx = (s) => {
      const ramp = Math.min(1, s / 200);   
      return ramp * (cur.a1 * Math.sin(s * cur.f1 + cur.p1) + cur.a2 * Math.sin(s * cur.f2 + cur.p2));
    };

    function steps() {
      $('#steps', root).innerHTML = pieces.map((p, i) => `<span class="${i < idx ? 'done' : i === idx ? 'now' : ''}">${p.name} seam${i < idx ? ` ${Math.round(job.sew[i] * 100)}%` : ''}</span>`).join('');
    }
    const acc = () => (cur.accs.length ? cur.accs.reduce((a, b) => a + b, 0) / cur.accs.length : 1);

    function finish() {
      cancelAnimationFrame(raf); machineHum(0);
      job.sewAcc = job.sew.reduce((a, b) => a + b, 0) / job.sew.length;
      job.quality = ((job.cutAcc ?? 0.7) + job.sewAcc) / 2;
      job.step = 'embellish'; save();
      go('embellish');
    }

    function tick(dt, t) {
      if (!cur || cur.done) return;
      if (keys.a) cur.tx -= 260 * dt;
      if (keys.d) cur.tx += 260 * dt;
      cur.fx += (cur.tx - cur.fx) * Math.min(1, dt * 10);
      const sp = cur.mouseDown ? Math.max(cur.speed, 2) : cur.speed;
      machineHum(sp);
      $('#spd', root).textContent = ['Stopped', 'Slow', 'Steady', 'Fast'][sp];
      cur.fed += SPEEDS[sp] * dt;
      while (cur.fed >= cur.nextStitch && cur.nextStitch <= cur.len) {
        const err = Math.abs(cur.fx + sx(cur.nextStitch));
        cur.accs.push(Math.max(0, 1 - Math.max(0, err - 3) / 30));
        cur.stitches.push({ x: -cur.fx, y: cur.nextStitch });
        cur.nextStitch += STITCH;
      }
      if (cur.fed >= cur.len) {
        cur.done = t;
        const a = acc();
        job.sew.push(a); save();
        machineHum(0);
        toast(`${cur.pc.name} seam - ${Math.round(a * 100)}%`, a > 0.85 ? 'good' : '');
        setTimeout(() => { idx++; setup(); }, 900);
      }
    }

    function draw(t) {
      raf = requestAnimationFrame(draw);
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      tick(dt, t);
      g.drawImage(table, 0, 0);
      if (!cur) return;
      const left = NX + cur.fx - FW / 2;
      const top0 = NY - cur.fed;             
      
      g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(left + 8, 0, FW, H);
      const first = Math.floor((0 - top0) / TILE) - 1;
      for (let k = first; k < first + 4; k++) {
        const y = top0 + k * TILE;
        if (cur.img.complete) g.drawImage(cur.img, left, y); else { g.fillStyle = cur.edge; g.fillRect(left, y, FW, TILE); }
      }
      
      g.fillStyle = cur.edge;
      for (let y = (top0 % 12) - 12; y < H; y += 12) {
        g.beginPath(); g.moveTo(left, y); g.lineTo(left - 5, y + 6); g.lineTo(left, y + 12); g.fill();
        g.beginPath(); g.moveTo(left + FW, y); g.lineTo(left + FW + 5, y + 6); g.lineTo(left + FW, y + 12); g.fill();
      }
      
      g.strokeStyle = cur.chalk; g.lineWidth = 2; g.setLineDash([8, 7]);
      g.beginPath();
      for (let s = Math.max(cur.fed - 40, 0); s <= Math.min(cur.len, cur.fed + H); s += 6) {
        const x = NX + cur.fx + sx(s), y = NY + (s - cur.fed);
        s === Math.max(cur.fed - 40, 0) ? g.moveTo(x, y) : g.lineTo(x, y);
      }
      g.stroke(); g.setLineDash([]);
      const endY = NY + (cur.len - cur.fed);
      if (endY < H) { g.fillStyle = cur.chalk; g.font = 'italic 16px Georgia'; g.fillText('end of seam', NX + cur.fx + sx(cur.len) + 12, endY); g.fillRect(NX + cur.fx + sx(cur.len) - 10, endY, 20, 2); }
      
      g.strokeStyle = cur.thread; g.lineWidth = 2.2; g.lineCap = 'round';
      for (const st of cur.stitches) {
        const y = NY + (st.y - cur.fed);
        if (y < -10 || y > NY + 4) continue;
        const x = NX + cur.fx + st.x;
        g.beginPath(); g.moveTo(x - 5, y - 4); g.lineTo(x, y + 1); g.lineTo(x + 5, y - 4); g.stroke();
      }
      
      g.drawImage(machine, 0, 0);
      
      const sp = cur.mouseDown ? Math.max(cur.speed, 2) : cur.speed;
      const bob = sp ? (Math.sin(t / (60 - sp * 12)) + 1) * 7 : 0;
      g.fillStyle = '#c8c8cc'; g.fillRect(NX - 4, 215, 8, NY - 229 + bob);
      g.strokeStyle = '#eee'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(NX, NY - 14 + bob); g.lineTo(NX, NY - 2 + bob); g.stroke();
      
      g.strokeStyle = cur.thread === '#3a2a22' ? '#6a4a3a' : '#e9dcc2'; g.lineWidth = 1; g.beginPath(); g.moveTo(NX + 2, 200); g.lineTo(NX + 120, 40); g.stroke();
      
      g.fillStyle = '#d8b35c'; g.strokeStyle = '#8a6a2a'; g.lineWidth = 1.5;
      g.beginPath(); g.roundRect(NX - 14, NY - 10, 28, 24, 6); g.fill(); g.stroke();
      g.fillStyle = '#333'; g.fillRect(NX - 2, NY - 8, 4, 18);
      
      const a = acc();
      const col = a > 0.85 ? '#3ea65a' : a > 0.65 ? '#e0a53a' : '#d0463c';
      g.lineWidth = 7; g.strokeStyle = 'rgba(40,20,10,.55)'; g.beginPath(); g.arc(NX - 70, NY - 30, 30, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = col; g.beginPath(); g.arc(NX - 70, NY - 30, 30, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * a); g.stroke();
      g.fillStyle = '#fbf2de'; g.beginPath(); g.arc(NX - 70, NY - 30, 25, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#3a2618'; g.font = 'bold 17px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(`${Math.round(a * 100)}%`, NX - 70, NY - 30); g.textAlign = 'start'; g.textBaseline = 'alphabetic';
      
      g.fillStyle = 'rgba(30,15,5,.6)'; g.fillRect(40, H - 34, 380, 12);
      g.fillStyle = '#e6c46a'; g.fillRect(40, H - 34, 380 * Math.min(1, cur.fed / cur.len), 12);
      g.fillStyle = '#fbf2de'; g.font = '15px Georgia'; g.fillText(`${cur.pc.name} seam`, 40, H - 42);
      
      const err = cur.fx + sx(cur.fed);
      if (Math.abs(err) > 16) {
        g.fillStyle = '#d0463c'; g.font = 'bold 28px Georgia'; g.textAlign = 'center';
        g.fillText(err > 0 ? '◀' : '▶', NX + (err > 0 ? -130 : 60), NY + 30); g.textAlign = 'start';
      }
    }

    const pos = (e) => { const r = cv.getBoundingClientRect(); return ((e.clientX - r.left) * W) / r.width; };
    const onMove = (e) => { if (cur) cur.tx = (pos(e) - NX) * 1.0; };
    const onDown = (e) => { if (cur) { cur.mouseDown = true; onMove(e); } };
    const onUp = () => { if (cur) cur.mouseDown = false; };
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      if (!cur) return;
      if (e.type === 'keydown' && !e.repeat) {
        if (k === 'w' || k === 'arrowup') cur.speed = Math.min(3, cur.speed + 1);
        if (k === 's' || k === 'arrowdown') cur.speed = Math.max(0, cur.speed - 1);
      }
      if (k === 'a' || k === 'arrowleft') keys.a = e.type === 'keydown';
      if (k === 'd' || k === 'arrowright') keys.d = e.type === 'keydown';
    };
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    $('#skip', root).onclick = () => { while (idx < pieces.length) { job.sew.push(0.7); idx++; } save(); finish(); };
    setup();
    window.__sew = () => cur && { ...cur, sx };   
    raf = requestAnimationFrame(draw);
    cleanup = () => {
      cancelAnimationFrame(raf); machineHum(0);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
    };
    if (!state.seenSew) { state.seenSew = true; save(); toast('Press W to start the machine'); }
  },
  leave() { if (cleanup) cleanup(); cleanup = null; },
};
