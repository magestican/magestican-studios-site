







import { PeerMesh } from '../../../web-engine/net/peerMesh.js';
import { ROLE, roomFromHref, watchLinkFor } from '../../../web-engine/net/watchers.js';
import { shareLink } from '../../../web-engine/share/shareInvite.js';
import { createRoom } from './net/room.js';
import { DELAY } from './net/lockstep.js';
import { FP } from './sim/fixed.js';
import { FIELD_H, FIELD_W } from './sim/patterns.js';
import { MOVE_MAX, pack } from './sim/input.js';
import { POLARITY } from './bullets.js';

const $ = (id) => document.getElementById(id);
const params = new URL(location.href).searchParams;
const target = roomFromHref(location.href);
const role = target ? (target.role === ROLE.WATCH ? 'watch' : 'play') : 'host';
const bot = params.get('bot') === '1';
const autostart = Number(params.get('autostart') || 0);

const canvas = $('c');
const ctx = canvas.getContext('2d');
const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
const COL = [POLARITY.ember, POLARITY.iris];
const LIVERY = ['#ffffff', '#5ee0c8', '#ff7a9a', '#9ad04a'];

let room = null;
let status = 'Connecting...';
const setStatus = (s) => { status = s; $('status').textContent = s; };


const keys = new Set();
let irisLatch = false, bombTap = false, drag = null;
addEventListener('keydown', (e) => {
  if (e.repeat) return;
  keys.add(e.code);
  if (e.code === 'Space' || e.code === 'KeyJ') { irisLatch = !irisLatch; e.preventDefault(); }
  if (e.code === 'KeyK' || e.code === 'KeyX') bombTap = true;
});
addEventListener('keyup', (e) => keys.delete(e.code));
canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, dx: 0, dy: 0 }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  drag.dx += e.clientX - drag.x; drag.dy += e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
});
canvas.addEventListener('pointerup', () => { drag = null; });
$('flip').addEventListener('click', () => { irisLatch = !irisLatch; });
$('bomb').addEventListener('click', () => { bombTap = true; });

function readInput() {
  if (bot) {
    
    const t = room.session.tick;
    const ph = Math.trunc(t / 40) + room.seat * 3;
    return pack({ x: ((ph * 37) % 129) - 64, y: ((ph * 53) % 129) - 64, iris: Math.trunc(t / 120) % 2 === 1 });
  }
  let x = 0, y = 0;
  if (keys.has('ArrowLeft') || keys.has('KeyA')) x -= MOVE_MAX;
  if (keys.has('ArrowRight') || keys.has('KeyD')) x += MOVE_MAX;
  if (keys.has('ArrowUp') || keys.has('KeyW')) y -= MOVE_MAX;
  if (keys.has('ArrowDown') || keys.has('KeyS')) y += MOVE_MAX;
  if (drag) {
    
    
    const k = (FIELD_W / FP) / canvas.clientWidth;
    const want = (d) => Math.max(-MOVE_MAX, Math.min(MOVE_MAX, Math.round((d * k * MOVE_MAX) / 4.5)));
    x = want(drag.dx); y = want(drag.dy);
    drag.dx -= (x * 4.5) / MOVE_MAX / k; drag.dy -= (y * 4.5) / MOVE_MAX / k;
  }
  const v = pack({ x, y, iris: irisLatch, bomb: bombTap, focus: keys.has('ShiftLeft') || keys.has('ShiftRight') });
  bombTap = false;
  return v;
}


function layout() {
  const pad = 16;
  const avail = { w: innerWidth - pad * 2, h: innerHeight - pad * 2 - $('panel').offsetHeight - 12 };
  const scale = Math.min(avail.w / (FIELD_W / FP), avail.h / (FIELD_H / FP));
  canvas.style.width = `${Math.floor((FIELD_W / FP) * scale)}px`;
  canvas.style.height = `${Math.floor((FIELD_H / FP) * scale)}px`;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.floor((FIELD_W / FP) * scale * dpr);
  canvas.height = Math.floor((FIELD_H / FP) * scale * dpr);
  ctx.setTransform((scale * dpr) / FP, 0, 0, (scale * dpr) / FP, 0, 0);
}
addEventListener('resize', layout);

function draw() {
  ctx.fillStyle = '#4a4d55';
  ctx.fillRect(0, 0, FIELD_W, FIELD_H);
  const s = room?.session?.view();
  if (!s) return;
  ctx.fillStyle = '#2b2d33';
  if (s.boss.on) ctx.fillRect(s.boss.x - 150 * FP, s.boss.y - 56 * FP, 300 * FP, 112 * FP);
  for (let e = 0; e < s.ne; e++) { 
    ctx.fillStyle = rgb(COL[s.ep[e]].core);
    ctx.beginPath(); ctx.arc(s.ex[e], s.ey[e], [16, 26, 44][s.ek[e]] * FP, 0, Math.PI * 2); ctx.fill();
  }
  for (let i = 0; i < s.nb; i++) {
    const c = COL[s.bpol[i]];
    const r = [4, 6, 3, 5][s.bkind[i]] * FP;
    ctx.fillStyle = rgb(c.outline);
    ctx.beginPath(); ctx.arc(s.bx[i], s.by[i], r + 2 * FP, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = rgb(c.core);
    ctx.beginPath(); ctx.arc(s.bx[i], s.by[i], r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,244,200,0.85)';
  for (let i = 0; i < s.ns; i++) ctx.fillRect(s.sx[i] - FP, s.sy[i] - 6 * FP, 2 * FP, 12 * FP);
  s.players.forEach((p, i) => {
    if (!p.on || p.lives <= 0) return;
    if (p.inv > 0 && (s.tick >> 2) % 2) return;
    ctx.fillStyle = rgb(COL[p.iris].core);
    ctx.strokeStyle = LIVERY[i];
    ctx.lineWidth = 2 * FP;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - 14 * FP); ctx.lineTo(p.x + 11 * FP, p.y + 10 * FP); ctx.lineTo(p.x - 11 * FP, p.y + 10 * FP);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = LIVERY[i];
    ctx.font = `${12 * FP}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`P${i + 1}${i === room.seat ? ' (you)' : ''}  ${'*'.repeat(p.lives)}`, p.x, p.y + 28 * FP);
  });
}

function hud() {
  const se = room?.session;
  if (!se) return;
  const last = [...se.hashes.entries()].at(-1);
  $('stats').textContent =
    `tick ${se.tick}  confirmed ${se.cs.tick}  rollbacks ${se.rollbacks}  stalls ${se.stalls}  desyncs ${se.desyncs}` +
    (last ? `  hash@${last[0]} ${last[1].toString(16).padStart(8, '0')}` : '');
}

function frame(now) {
  if (room?.session && !room.ended) room.session.update(now, readInput);
  draw();
  hud();
  requestAnimationFrame(frame);
}


globalThis.__flipwingNet = () => {
  const se = room?.session;
  return {
    role, seat: room?.seat ?? null, started: !!room?.started, ended: !!room?.ended, id: room?.mesh.myId ?? null,
    tick: se?.tick ?? 0, confirmed: se?.cs.tick ?? 0, rollbacks: se?.rollbacks ?? 0, stalls: se?.stalls ?? 0,
    desyncs: se?.desyncs ?? 0, hashes: se ? [...se.hashes.entries()].slice(-30) : [], status,
  };
};

function boot() {
  layout();
  let mesh;
  try { mesh = new PeerMesh({ star: true }); } catch (e) { setStatus(`No network module: ${e.message}`); return; }
  mesh.addEventListener('error', (e) => setStatus(`Network: ${e.detail.message}`));
  mesh.addEventListener('open', () => {
    room = createRoom({
      mesh, role, hostId: target?.code ?? null,
      
      seedFor: () => (Date.now() % 2147483647) | 0,
      onEvent: onRoomEvent,
    });
    if (role === 'host') {
      mesh.host();
      const join = new URL(location.href); join.search = ''; join.searchParams.set('join', mesh.myId);
      $('join').value = join.toString();
      const base = new URL(location.href); base.search = '';
      $('watch').value = watchLinkFor(base.toString(), mesh.myId);
      $('lobby').hidden = false;
      $('start').disabled = false;
      setStatus('Hosting: share the Join link, then press Start. Alone works too.');
    } else {
      mesh.connectTo(target.code);
      setStatus(role === 'watch' ? 'Joining as a watcher...' : 'Joining...');
    }
  });
  requestAnimationFrame(frame);
}

function onRoomEvent(e) {
  if (e.type === 'lobby') {
    const n = e.guests.filter((g) => g.seat !== null).length, w = e.guests.length - n;
    setStatus(`Hosting: ${n + 1} of 4 players, ${w} watching.${room.started ? '' : ' Press Start when ready.'}`);
    if (autostart && !room.started && n >= autostart) room.start();
  } else if (e.type === 'seat') {
    setStatus(e.seat === null ? 'Watching. The host starts the run.' : `You are P${e.seat + 1}. Waiting for the host to start.`);
  } else if (e.type === 'start') {
    $('lobby').hidden = true;
    setStatus(`Running: ${e.seats.length} player${e.seats.length > 1 ? 's' : ''}, ${DELAY}-tick input delay. ` +
      (room.seat === null ? 'Watching.' : `You are P${room.seat + 1}.`));
    $('controls').hidden = room.seat === null;
  } else if (e.type === 'desync') {
    setStatus(`DESYNC at tick ${e.tick} with P${e.seat + 1}: this proof has failed.`);
  } else if (e.type === 'ended') {
    setStatus(`Room ended: ${e.reason}.`);
  }
}

$('start').addEventListener('click', () => room?.start());

for (const id of ['join', 'watch']) {
  $(`copy-${id}`).addEventListener('click', () => shareLink({
    link: $(id).value, gameName: 'Flipwing', code: room?.mesh.myId ?? null, button: $(`copy-${id}`), field: $(id),
  }));
}

boot();
