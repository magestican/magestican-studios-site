














import * as THREE from 'three';
import { createStage } from '../../engine/iso/stage.js';
import { DachiActor, actorStats } from './dachiActor.js';
import { CastActor } from './castActor.js';
import { BOSSES } from './bossModel.js';
import { dachiSize } from './billboards.js';
import { speciesById, SPECIES, GUARDIAN, KUMABO, FAMILY_COUNT, BODY_PLANS } from '../data/species.js';

const q = new URLSearchParams(location.search);
const asset = q.get('asset') || 'dachi', view = q.get('view') || 'turn', set = q.get('set') || 'story', id = +(q.get('id') || GUARDIAN);
const px = q.has('px') ? +q.get('px') : 480;

const stage = createStage(document.getElementById('world'), { viewHeight: 10, pixelHeight: px || 480, shadows: true });
if (px === 0) stage.pixel.enabled = false;
const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshLambertMaterial({ color: '#cfe3a2' }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
stage.scene.add(ground);


const PROC = [0, 4, 5, 6, 7, 8, 9, 10, 11, 12]; 
let rows = [];
if (view === 'lineup' && set === 'story') {
  rows = [
    [[GUARDIAN, {}], [KUMABO, { bandage: true }], [KUMABO, {}], [65, { hat: true }]],
    [202, 203, 204].map((i) => [i, {}]), [205, 206, 207].map((i) => [i, {}]), [208, 209, 210].map((i) => [i, {}]),
  ];
} else if (view === 'lineup' && set === 'plans') { 
  const k = +(q.get('pick') || 0), fams = [];
  for (const plan of BODY_PLANS) { const f = SPECIES.filter((s) => s.stage === 1 && s.look.plan === plan); if (f.length) fams.push(f[Math.min(k, f.length - 1)].fam); }
  rows = [0, 1, 2].map((st) => fams.map((f) => [f * 3 + st + 1, {}]));
} else if (view === 'lineup' && set === 'faces') { 
  rows = [[[GUARDIAN, {}], [KUMABO, {}], [202, {}]], [[205, {}], [208, {}], [65, { hat: true }]]];
} else if (view === 'silhouette' || (view === 'lineup' && set === 'all')) {
  const st = +(q.get('stage') || 1), per = 7;
  for (let f = 0; f < FAMILY_COUNT; f += per) rows.push(Array.from({ length: Math.min(per, FAMILY_COUNT - f) }, (_, i) => [(f + i) * 3 + st, {}]));
} else if (view === 'lineup' && set === 'splits') {
  
  const want = [['vertical', 1], ['vertical', -1], ['horizontal', 1], ['horizontal', -1], ['diagonal', 0], ['part', 'arm'], ['part', 'tail'], ['part', 'ear'], ['part', 'eye'], ['part', 'mask'], ['part', 'wing']];
  const pool = [201, 202, 205, 208, 211, ...SPECIES.filter((s) => s.stage === 1).map((s) => s.id)].map(speciesById);
  const picks = want.map(([m, k]) => pool.find((s) => s.look.split && s.look.split.mode === m && (m === 'part' ? s.look.split.part === k : !k || s.look.split.side === k))).filter(Boolean);
  
  rows = [picks.slice(0, Math.ceil(picks.length / 2)), picks.slice(Math.ceil(picks.length / 2))]
    .map((r) => r.map((s) => [s.id, {}, ['tail', 'wing'].includes(s.look.split.part) ? 'side' : undefined]));
} else if (view === 'lineup' && set === 'families') {
  const fams = (q.has('all') ? Array.from({ length: FAMILY_COUNT }, (_, i) => i) : PROC).slice(+(q.get('page') || 0) * 5, +(q.get('page') || 0) * 5 + 5); 
  rows = [0, 1, 2].map((st) => fams.map((f) => [f * 3 + st + 1, {}]));
} else if (view === 'lineup' && set === 'corrupt') {
  rows = [
    [GUARDIAN, 202, 205, 208, KUMABO].map((i) => [i, { corrupt: true }]),
    [3, 6, 9, 13, 16].map((i) => [i, { corrupt: true }]),
    PROC.slice(5, 10).map((f) => [f * 3 + 3, { corrupt: true }]),
  ];
} else if (view === 'lineup' && set === 'cast') {
  rows = [
    [['kid', { gender: 'boy' }], ['kid', { gender: 'girl' }], ['elder', {}], [KUMABO, { bandage: true }]],
    [[32, { hat: true }], [46, { hat: true }], [61, { hat: true }], [13, { bandage: true }], [22, {}], [35, { bandage: true }]],
  ];
} else if (view === 'lineup' && set === 'humans') { 
  const tag = q.get('tag') || 'front';
  rows = [[['kid', { gender: 'boy' }, tag], ['kid', { gender: 'girl' }, tag], ['elder', {}, tag]]];
} else if (view === 'lineup' && set === 'turns') { 
  rows = [[['kid', { gender: 'boy' }], ['kid', { gender: 'girl' }], ['elder', {}]].flatMap(([k, o]) => ['front', 'q3', 'right'].map((t) => [k, o, t]))];
} else if (view === 'lineup' && set === 'bosses') { 
  const ids = q.get('pick') ? q.get('pick').split(',') : BOSSES.map((b) => b.id);
  rows = [ids.slice(0, 4), ids.slice(4)].filter((r) => r.length).map((r) => r.map((id) => ['boss', { boss: id }, q.get('tag') || 'front']));
} else if (asset === 'aerowing') { 
  rows = [[0, 1, 2].map((f) => ['aerowing', { frame: f }, 'front']), [['aerowing', { frame: 1 }, 'right'], ['aerowing', { frame: 1 }, 'left']]];
} else if (asset === 'kid' || asset === 'elder') {
  const o = { gender: q.get('gender') || 'boy' };
  rows = [[[asset, o, 'front'], [asset, o, 'right'], [asset, o, 'back'], [asset, o, 'left']]];
} else {
  rows = [[[id, {}, 'right'], [id, { flip: true }, 'left'], [id, {}, 'back'], [id, {}, 'side'], [id, { corrupt: true }, 'corrupt']]];
}

function splitLabel({ mode, mat, side, part }) {
  const where = mode === 'horizontal' ? (side > 0 ? 'top' : 'bottom') : mode === 'part' ? part : side < 0 ? 'left' : 'right';
  return `${mode} ${where} ${mat}`;
}


const R = Math.SQRT1_2, SP = +(q.get('sp') || 2.4), ROW = +(q.get('row') || 3.0); 
const cols = Math.max(...rows.map((r) => r.length));
const actors = [], labels = [];
const hud = document.getElementById('labels');
rows.forEach((row, j) => row.forEach(([spId, opts, tag], i) => {
  const cast = spId === 'kid' || spId === 'elder' || spId === 'aerowing' || spId === 'boss';
  const sp = cast ? { name: spId === 'kid' ? `Kid (${opts.gender})` : spId === 'aerowing' ? `Aerowing ${opts.frame}` : spId === 'boss' ? (BOSSES.find((b) => b.id === opts.boss) || {}).name : 'Elder Ojiji', stage: 1 } : speciesById(spId);
  const a = cast ? new CastActor(stage.scene, spId, opts) : new DachiActor(stage.scene, { size: dachiSize(sp.stage) });
  if (!cast) a.setLook(spId, q.has('flip') ? { ...opts, flip: true } : opts); 
  if (!cast && q.has('walk')) a.forceMove = true;
  if (cast && tag) a.yaw = a.targetYaw = { front: Math.PI / 4, q3: Math.PI * 0.47, right: Math.PI * 0.75, back: Math.PI * 1.25, left: -Math.PI / 4 }[tag];
  const off = i - (row.length - 1) / 2, dn = j - (rows.length - 1) / 2;
  const x = off * SP * R + dn * ROW * R, y = -off * SP * R + dn * ROW * R;
  if (!cast && tag === 'back') a.yaw = a.targetYaw = Math.PI * 1.25;
  if (!cast && tag === 'side') a.yaw = a.targetYaw = Math.PI * 0.75;
  actors.push({ a, x, y, opts, tag });
  const el = document.createElement('div');
  el.textContent = `${sp.name}${view === 'lineup' && set === 'splits' && sp.look.split ? ' - ' + splitLabel(sp.look.split) : ''}${opts.corrupt ? ' *' : ''}${opts.bandage ? ' (hurt)' : ''}${opts.hat ? ' (priest)' : ''}${tag && view !== 'lineup' ? ' - ' + tag : ''}${q.has('eyes') && sp.look ? ' - ' + (sp.look.eyeStyle || sp.look.eyes) : ''}`;
  hud.appendChild(el); labels.push(el);
}));
const across = cols * SP + 1.5, down = rows.length * ROW * 0.65 + 1.2;
stage.viewHeight = +(q.get('zoom') || Math.max(down, across / (innerWidth / innerHeight)));
stage.resize();
stage.lookAt(0, 0, 0.4);
if (q.has('focus')) { const f = actors[+q.get('focus')]; stage.lookAt(f.x, f.y, 0.35); } 


if (q.has('elev')) {
  const a = +q.get('elev') * Math.PI / 180, h = +(q.get('at') || 0.85), f = q.has('focus') ? actors[+q.get('focus')] : { x: 0, y: 0 };
  const cam = stage.camera; cam.position.set(f.x + 60 * Math.cos(a) * Math.SQRT1_2, h + 60 * Math.sin(a), f.y + 60 * Math.cos(a) * Math.SQRT1_2); cam.lookAt(f.x, h, f.y);
}

const BLACK = new THREE.MeshBasicMaterial({ color: 0x000000 });
if (view === 'silhouette') { ground.material = new THREE.MeshBasicMaterial({ color: 0xffffff }); stage.scene.background = new THREE.Color(0xffffff); }
const t0 = performance.now();
const L = window.__lookdev = { stage, actors, actorStats, ready: false, ms: 0 };
function frame() {
  for (const { a, x, y } of actors) {
    if (q.has('walk') && a.pose) a.pose({ moving: true, walk: q.has('stride') ? +q.get('stride') : performance.now() / 1000 * 11 }); 
    a.place(x, y, 0, a.kind === 'aerowing' ? 0.45 : 0);
  }
  if (!L.ready && actorStats.built >= actorStats.requested && actors.every(({ a }) => a.body.children.length)) { L.ready = true; L.ms = Math.round(performance.now() - t0); }
  if (view === 'silhouette') for (const { a } of actors) for (const m of a.body.children) m.material = BLACK;
  stage.render();
  actors.forEach(({ x, y }, k) => {
    const [sx, sy] = stage.toScreen(x, y, -0.15);
    labels[k].style.transform = `translate(${Math.round(sx)}px, ${Math.round(sy)}px) translate(-50%, 0)`;
  });
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
