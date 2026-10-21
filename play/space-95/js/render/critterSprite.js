



import * as THREE from 'three';
import { v } from '../site/assetUrl.js';

const sheets = new Map();

function loadSheet(kind) {
  if (!sheets.has(kind)) {
    const base = `assets/art/${kind}/`;
    const p = fetch(v(`${base}${kind}.sprites.json`))
      .then((r) => (r.ok ? r.json() : null))
      .then(async (sheet) => {
        if (!sheet) return null;
        const loader = new THREE.TextureLoader();
        
        const textures = await Promise.all(
          sheet.atlases.map(async (name) => {
            const t = await loader.loadAsync(v(base + name));
            t.colorSpace = THREE.SRGBColorSpace;
            return t;
          }),
        );
        return { sheet, textures };
      })
      .catch(() => null);
    sheets.set(kind, p);
  }
  return sheets.get(kind);
}


const MAP = {
  ladybot: {
    state: { walk: 'walk', hop: 'hop', dazed: 'dazed', scurry: 'scurry', flipped: 'flipped', righting: 'righting' },
    rest: 'walk',
  },
  pillbug: {
    state: { roll: 'roll', uncurl: 'look', rest: 'look', dazed: 'dazed', scurry: 'scurry', flipped: 'flipped', righting: 'righting' },
    rest: 'look',
    enter: { 'roll>uncurl': 'uncurl', 'uncurl>roll': 'curl', 'roll>dazed': 'uncurl', 'roll>flipped': 'uncurl' },
  },
  
  aphid: { state: { hop: 'hop', dazed: 'dazed', scurry: 'scurry', flipped: 'flipped', righting: 'righting' }, rest: 'hop' },
  
  bandit: {
    state: { dazed: 'dazed', scurry: 'scurry', flipped: 'flipped', righting: 'righting' },
    rest: 'idle',
    stage: { idle: 'idle', windup: 'windup', hop: 'hop', crouch: 'crouch', landed: 'crouch' },
  },
  
  wasp: {
    state: { dazed: 'dazed', scurry: 'scurry' },
    rest: 'hover',
    stage: { hover: 'hover', telegraph: 'telegraph', dive: 'dive', stuck: 'stuck', return: 'return', sting: 'hover' },
    aim: -0.9076,
  },
  
  guard: {
    state: { dazed: 'dazed', scurry: 'scurry', flipped: 'flipped', righting: 'righting' },
    rest: 'patrol',
    stage: { patrol: 'patrol', windup: 'windup', charge: 'charge', stunned: 'stunned', stuck: 'stuck', shake: 'shake', halt: 'halt' },
  },
  
  antPorter: {
    state: { march: 'march', shove: 'shove', dazed: 'dazed', scurry: 'scurry', flipped: 'flipped', righting: 'righting' },
    rest: 'march',
    stage: {},
  },
  
  snailknight: {
    state: { crawl: 'crawl', dazed: 'dazed', scurry: 'scurry', flipped: 'flipped', righting: 'righting' },
    rest: 'crawl',
    stage: {},
  },
  
  dustmite: { state: { walk: 'walk', dazed: 'dazed', scurry: 'scurry' }, rest: 'walk', stage: {}, clock: ['jab', 'jabT'] },
  
  moth: {
    state: { perch: 'perch', fly: 'fly', return: 'fly', pass: 'fly', swoop: 'swoop', tail: 'glide', lead: 'glide', peel: 'peel' },
    rest: 'fly',
  },
  
  weevil: {
    state: { dazed: 'dazed', scurry: 'scurry' },
    rest: 'walk',
    stage: { patrol: 'walk', march: 'walk', telegraph: 'paw', charge: 'charge', rest: 'rest' },
    clock: ['frozen', 'warm'],
  },
  
  skiff: {
    state: { moored: 'moored', windup: 'windup', row: 'row', ram: 'row', capsizing: 'capsize', dazed: 'dazed', scurry: 'scurry' },
    rest: 'moored',
  },
  
  sprite: {
    state: { dazed: 'dazed', scurry: 'scurry', flipped: 'flipped', righting: 'righting' },
    rest: 'hover',
    stage: { hover: 'hover', telegraph: 'telegraph', flash: 'flash', fluster: 'fluster', flee: 'hover' },
    keep: ['spriteGlow'],
  },
};


export function hasCritterSprite(e) {
  if (e.kind === 'wasp') return !e.skin && !e.specimen; 
  if (e.kind === 'guard') return !e.velvet; 
  if (e.kind === 'antPorter') return !e.skin; 
  if (e.kind === 'snailknight') return !e.specimen; 
  if (e.kind === 'dustmite') return !!e.crew && !e.specimen && !e.rides; 
  if (e.kind === 'weevil') return !e.specimen; 
  if (e.kind === 'skiff') return !e.skin && !e.galleon && !e.toy && !e.empty; 
  if (e.kind === 'sprite') return !e.ghost; 
  return (
    (e.kind === 'ladybot' && !e.skin) ||
    (e.kind === 'pillbug' && !e.topiary) ||
    e.kind === 'aphid' ||
    e.kind === 'bandit' ||
    e.kind === 'moth'
  );
}






export function preloadCritterSprites(entities) {
  const kinds = new Set(entities.filter(hasCritterSprite).map((e) => e.kind));
  return Promise.all([...kinds].map(loadSheet));
}


export function attachCritterSprite(g, e) {
  const map = MAP[e.kind];
  const view = { clip: map.rest, t: 0, oneShot: null, prev: e.state, ready: false };
  loadSheet(e.kind).then((loaded) => {
    if (!loaded) return;
    const { sheet, textures } = loaded;
    
    const own = textures.map((t) => {
      const c = t.clone();
      c.needsUpdate = true;
      return c;
    });
    const mat = new THREE.MeshBasicMaterial({ map: own[0], transparent: true, alphaTest: 0.05, depthWrite: false });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    quad.position.z = 0.05;
    g.add(quad);
    for (const child of g.children) if (child.userData.placeholder && !map.keep?.includes(child.name)) child.visible = false;
    Object.assign(view, { ready: true, sheet, own, mat, quad });
  });
  g.userData.critter = view;
}


export function updateCritterSprite(g, e, dt) {
  const v = g.userData.critter;
  if (!v?.ready) return;
  const map = MAP[e.kind];
  if (e.state !== v.prev) {
    const shot = map.enter?.[`${v.prev}>${e.state}`];
    v.oneShot = shot && v.sheet.clips[shot] ? shot : null;
    v.t = 0;
    v.prev = e.state;
  }
  let clip = v.oneShot ?? map.state[e.state] ?? map.rest;
  if (e.kind === 'ladybot' && e.state === 'walk' && e.grounded === false) clip = 'hop';
  const aphidHop = e.kind === 'aphid' && clip === 'hop';
  if (aphidHop && e.dozing) clip = 'asleep';
  else if (aphidHop && e.grounded && e.vx) clip = 'walk'; 
  const staged = map.stage && clip === map.rest ? (e.sleeping || e.dozing || e.asleep || !e.awake ? 'asleep' : map.stage[e.stage]) : null;
  if (staged) clip = staged;
  const clocked = map.clock && clip === map.rest && e[map.clock[1]] >= 0; 
  if (clocked) clip = map.clock[0];
  const c = v.sheet.clips[clip] ?? v.sheet.clips[map.rest];
  if (!c) return;
  if (clip !== v.clip) {
    v.clip = clip;
    if (!v.oneShot) v.t = 0;
  }
  v.t += dt;
  
  if (clip === 'hop' && e.kind === 'aphid') v.t = e.grounded === false ? Math.min(e.hopT, 0.55) : Math.max(e.hopT, 0.58);
  else if (clocked) v.t = e[map.clock[1]];
  else if (staged && staged !== map.rest && staged === map.stage[e.stage]) v.t = e.st; 
  const n = c.frames.length;
  let i = Math.floor(v.t * c.fps);
  if (i >= n) {
    if (v.oneShot) {
      v.oneShot = null; 
      i = n - 1;
    } else i = c.loop ? i % n : n - 1;
  }
  const f = c.frames[i];
  const tex = v.own[f.atlas];
  if (v.mat.map !== tex) {
    v.mat.map = tex;
    v.mat.needsUpdate = true;
  }
  const img = tex.image;
  if (img?.width) {
    tex.repeat.set(f.w / img.width, f.h / img.height);
    tex.offset.set(f.x / img.width, 1 - (f.y + f.h) / img.height);
  }
  const pxu = v.sheet.px_per_u;
  const [px, py] = v.sheet.pivot;
  v.quad.scale.set(f.w / pxu, f.h / pxu, 1);
  v.quad.position.x = (f.ox + f.w / 2 - px) / pxu;
  v.quad.position.y = (py - f.oy - f.h / 2) / pxu;
  
  const d = clip === 'dive' && map.aim ? (e.dir ?? { x: e.vx, y: e.vy }) : null;
  const a = d ? Math.atan2(d.y, Math.abs(d.x)) - map.aim : 0;
  const qx = v.quad.position.x;
  const qy = v.quad.position.y - e.h / 2;
  v.quad.rotation.z = a;
  if (a) v.quad.position.set(qx * Math.cos(a) - qy * Math.sin(a), e.h / 2 + qx * Math.sin(a) + qy * Math.cos(a), 0.05);
}
