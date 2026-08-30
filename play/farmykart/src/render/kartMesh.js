









































import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PALETTE } from '../palette.js';
import {
  surface, paintedSurface, rubberSurface, getQuality, applyShadows, dressImported,
} from './materials.js';
import { vehicleFor } from '../../../../web-engine/kart/vehicles.js';






import { GRIND_WHEELIE } from '../../../../web-engine/kart/railGrind.js';









import {
  stepDeploy, rigPhases, propSpin, rigVisible, WHEEL_TUCK, WHEEL_ROLL,
} from '../../../../web-engine/render/boatRig.js';
import { boatFor, BOAT_STYLES } from '../../../../web-engine/render/boatSpec.js';
import { makePaintTexture } from './textures.js';
















const LIVERY = {
  night: PALETTE.night,
  ceiling: PALETTE.ceiling,
  barnRed: PALETTE.barnRed,
  gold: PALETTE.gold,
  chrome: PALETTE.chrome,
  engine: PALETTE.engine,
  tyre: PALETTE.tyre,
};















const NOSE_STYLES = ['cone', 'wedge', 'bullbar', 'shovel'];
const WING_STYLES = ['none', 'lowBlade', 'winglets', 'highSlab'];
const EXHAUST_STYLES = ['twinRear', 'stack', 'sideStacks', 'quadLow'];
const POD_STYLES = ['sidepod', 'slab', 'rail'];
const ROLLBAR_STYLES = ['hoop', 'brace'];






const VERTICAL_EXHAUSTS = ['stack', 'sideStacks'];


















const detail = () => getQuality() !== 'low';




const styleOf = (table, want, fallback) => (table.includes(want) ? want : fallback);










const GLB_BASE = new URL('../../assets/hand-drawn/characters/', import.meta.url).href;
const loader = new GLTFLoader();
const cache = new Map();

export function loadDriver(species) {
  if (cache.has(species)) return cache.get(species);
  const p = new Promise((resolve) => {
    loader.load(
      `${GLB_BASE}${species}.glb`,
      (gltf) => resolve(gltf.scene),
      undefined,
      
      
      
      
      (err) => {
        lastError = `${species}: ${err && (err.message || err.type) ? (err.message || err.type) : err}`;
        resolve(null);
      },
    );
  });
  cache.set(species, p);
  return p;
}
















let lastError = null;
export function driversReady() {
  return Promise.all([...cache.values()]).then((scenes) => ({
    total: scenes.length,
    loaded: scenes.filter(Boolean).length,
    lastError,
  }));
}













const box = (w, h, d, colour) => new THREE.Mesh(
  new THREE.BoxGeometry(w, h, d),
  paintedSurface({ color: colour, flatShading: true, map: makePaintTexture() }),
);

const metal = (colour) => surface({
  color: colour, roughness: 0.28, metalness: 0.85, flatShading: true,
});










function taper(w1, w2, h1, h2, d, colour, { skew = 0 } = {}) {
  const geo = new THREE.BoxGeometry(1, 1, d);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const z = pos.getZ(i);
    const t = z / d + 0.5;                 
    pos.setX(i, pos.getX(i) * (w1 + (w2 - w1) * t));
    pos.setY(i, pos.getY(i) * (h1 + (h2 - h1) * t) + skew * t);
  }
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, paintedSurface({ color: colour, flatShading: true, map: makePaintTexture() }));
}










function makeWheel(r, w, spokes, rimColour) {
  const g = new THREE.CylinderGeometry(r, r, w, 12);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const y = pos.getY(i);
    if (Math.abs(Math.abs(y) - w / 2) < 1e-6) {
      pos.setX(i, pos.getX(i) * 0.86);
      pos.setZ(i, pos.getZ(i) * 0.86);
    }
  }
  g.computeVertexNormals();
  g.rotateZ(Math.PI / 2);
  const mesh = new THREE.Mesh(g, rubberSurface({ color: PALETTE.tyre, flatShading: true }));

  
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 0.52, r * 0.52, w * 0.96, 8),
    metal(rimColour),
  );
  hub.rotation.z = Math.PI / 2;
  mesh.add(hub);

  
  
  
  
  
  const spokeMat = surface({ color: PALETTE.night, flatShading: true });
  for (let i = 0; i < spokes; i += 1) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(w * 1.02, r * 0.78, r * 0.16), spokeMat);
    spoke.rotation.x = (i * Math.PI) / spokes;
    mesh.add(spoke);
  }
  return mesh;
}










function makePipe(base, dir, length, radius, tipRadius, cap, colour) {
  const g = new THREE.Group();
  const aim = new THREE.Vector3(dir[0], dir[1], dir[2]).normalize();
  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(tipRadius, radius, length, 6),
    metal(colour),
  );
  
  
  
  
  tube.position.set(
    base[0] + aim.x * length * 0.5,
    base[1] + aim.y * length * 0.5,
    base[2] + aim.z * length * 0.5,
  );
  tube.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), aim);
  g.add(tube);
  
  
  
  
  if (length > 0.5 && detail()) {
    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 1.24, radius * 1.24, 0.07, 6),
      metal(PALETTE.chrome),
    );
    collar.position.set(
      base[0] + aim.x * length * 0.66,
      base[1] + aim.y * length * 0.66,
      base[2] + aim.z * length * 0.66,
    );
    collar.quaternion.copy(tube.quaternion);
    g.add(collar);
  }
  const tip = new THREE.Vector3(
    base[0] + aim.x * length,
    base[1] + aim.y * length,
    base[2] + aim.z * length,
  );
  if (cap) {
    
    
    
    const lid = new THREE.Mesh(
      new THREE.CylinderGeometry(tipRadius * 1.5, tipRadius * 1.5, 0.035, 6),
      metal(colour),
    );
    lid.position.copy(tip).addScaledVector(aim, 0.03);
    lid.quaternion.copy(tube.quaternion);
    lid.rotateX(0.34);
    g.add(lid);
  }
  return { group: g, tip };
}









function makeFlame(tip, dir, scale, stretch = 1) {
  const aim = new THREE.Vector3(dir[0], dir[1], dir[2]).normalize();
  
  
  
  
  
  
  
  
  const g = new THREE.Mesh(
    new THREE.ConeGeometry(0.085 * scale, 0.62 * scale * stretch, 6, 1, true),
    new THREE.MeshBasicMaterial({
      color: PALETTE.spark2, transparent: true, opacity: 0.70,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    }),
  );
  
  
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), aim);
  g.position.copy(tip).addScaledVector(aim, 0.24 * scale * stretch);
  g.visible = false;
  g.renderOrder = 5;
  return g;
}





function buildNose(group, spec, tint, accent) {
  const n = spec.nose;
  const style = styleOf(NOSE_STYLES, n.style, 'cone');
  const cone = taper(n.rootHalf, n.tipHalf, n.rootHeight / 2, n.tipHeight / 2, n.length, tint, { skew: n.lift });
  cone.position.set(0, n.y, n.z);
  group.add(cone);

  
  
  if (detail()) {
    const roundel = new THREE.Mesh(
      new THREE.CircleGeometry(n.roundel, 12),
      surface({ color: PALETTE.ceiling }),
    );
    roundel.position.set(0, n.y + n.lift * 0.6, n.z + n.length / 2 + 0.01);
    group.add(roundel);
  }

  if (style === 'bullbar') {
    
    
    
    for (const y of [n.y - 0.14, n.y + 0.18]) {
      const rail = box(n.rootHalf * 2.15, 0.09, 0.10, accent);
      rail.position.set(0, y, n.z + n.length / 2 + 0.12);
      group.add(rail);
    }
    for (const x of detail() ? [-n.rootHalf * 0.92, 0, n.rootHalf * 0.92] : [0]) {
      const post = box(0.09, 0.44, 0.09, accent);
      post.position.set(x, n.y + 0.02, n.z + n.length / 2 + 0.12);
      group.add(post);
    }
  } else if (style === 'shovel') {
    
    
    
    
    
    const plate = box(n.rootHalf * 2.2, 0.05, n.length * 0.55, accent);
    plate.position.set(0, n.y - n.rootHeight / 2 - 0.03, n.z + n.length * 0.16);
    group.add(plate);
  } else if (style === 'wedge') {
    
    
    
    
    const fin = box(0.07, 0.24, n.length * 0.72, accent);
    fin.position.set(0, n.y + n.rootHeight / 2 + 0.09, n.z);
    group.add(fin);
  }
}

function buildPods(group, spec, tint, trim) {
  const p = spec.pods;
  const style = styleOf(POD_STYLES, p.style, 'sidepod');
  for (const side of [1, -1]) {
    let pod;
    if (style === 'slab') {
      
      
      pod = taper(p.half, p.half * 0.93, p.height / 2, (p.height / 2) * 0.94, p.length, tint);
    } else if (style === 'rail') {
      pod = box(p.half * 2, p.height, p.length, tint);
    } else {
      pod = taper(p.half, p.half * 0.7, p.height / 2, (p.height / 2) * 0.78, p.length, tint);
    }
    pod.position.set(side * p.x, p.y, p.z);
    pod.rotation.y = side * -p.lean;
    group.add(pod);
    if (p.rail && detail()) {
      
      
      
      const rail = box(0.06, 0.07, p.length * 0.94, trim);
      rail.position.set(side * (p.x + p.half), p.y - p.height * 0.06, p.z);
      group.add(rail);
    }
  }
}

function buildRollBar(group, spec, metalColour, tint) {
  const r = spec.rollBar;
  const style = styleOf(ROLLBAR_STYLES, r.style, 'hoop');
  const bar = new THREE.Mesh(
    new THREE.TorusGeometry(r.radius, r.tube, 5, 10, Math.PI),
    metal(metalColour),
  );
  bar.position.set(0, r.y, r.z);
  group.add(bar);
  if (style === 'brace' && detail()) {
    
    
    
    const back = new THREE.Mesh(
      new THREE.TorusGeometry(r.radius * 0.82, r.tube * 0.85, 4, 8, Math.PI),
      metal(metalColour),
    );
    back.position.set(0, r.y, r.z - 0.30);
    group.add(back);
    const cross = box(r.radius * 1.5, r.tube * 2.0, 0.06, tint);
    cross.position.set(0, r.y + r.radius * 0.62, r.z - 0.15);
    group.add(cross);
  }
}

function buildWing(group, spec, tint, accent, trim) {
  const w = spec.wing;
  const style = styleOf(WING_STYLES, w.style, 'lowBlade');
  if (style === 'none') return;
  if (style === 'winglets') {
    
    
    
    for (const side of [1, -1]) {
      const blade = taper(w.span / 4, w.span / 5, w.thickness / 2, w.thickness / 3, w.chord, accent);
      blade.position.set(side * w.strutX, w.y, w.z);
      blade.rotation.z = side * -0.42;
      blade.rotation.x = 0.14;
      group.add(blade);
      const strut = box(0.05, w.strut, 0.06, trim);
      strut.position.set(side * w.strutX, w.y - w.strut / 2, w.z);
      group.add(strut);
    }
    return;
  }
  
  
  
  const blade = box(w.span, w.thickness, w.chord, accent);
  blade.position.set(0, w.y, w.z);
  blade.rotation.x = -0.14;
  group.add(blade);
  for (const side of [1, -1]) {
    const strut = box(0.06, w.strut, 0.09, trim);
    strut.position.set(side * w.strutX, w.y - w.strut / 2, w.z);
    group.add(strut);
  }
  if (style === 'highSlab' && detail()) {
    
    
    for (const side of [1, -1]) {
      const plate = box(0.05, w.chord * 0.72, w.chord * 1.06, tint);
      plate.position.set((side * w.span) / 2, w.y - 0.03, w.z);
      group.add(plate);
    }
    
    
    const flap = box(w.span * 0.94, w.thickness * 0.8, w.chord * 0.42, trim);
    flap.position.set(0, w.y + 0.15, w.z - w.chord * 0.30);
    flap.rotation.x = -0.30;
    group.add(flap);
  }
}














function makeProp(radius, blades, guard, hubColour, bladeColour) {
  const g = new THREE.Group();
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.20, radius * 0.20, radius * 0.34, 8),
    metal(hubColour),
  );
  
  
  
  hub.rotation.x = Math.PI / 2;
  g.add(hub);
  const n = Math.max(2, Math.round(blades));
  for (let i = 0; i < n; i += 1) {
    const blade = box(radius * 0.22, radius * 0.86, 0.035, bladeColour);
    blade.position.set(0, radius * 0.50, 0);
    const arm = new THREE.Group();
    arm.rotation.z = (i / n) * Math.PI * 2;
    arm.add(blade);
    g.add(arm);
  }
  if (guard && detail()) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, radius * 0.075, 4, 12),
      metal(hubColour),
    );
    g.add(ring);
  }
  return g;
}

























function buildBoat(spec, tint, accent, trim, metalColour) {
  const g = new THREE.Group();
  const b = boatFor(spec);
  const f = b.floats;
  const style = styleOf(BOAT_STYLES, f.style, 'pontoon');

  
  
  
  
  
  
  
  
  const floats = new THREE.Group();
  for (const side of [1, -1]) {
    const hull = new THREE.Group();
    if (style === 'barrel') {
      
      
      const drum = new THREE.Mesh(
        new THREE.CylinderGeometry(f.radius, f.radius, f.length * 0.92, 10),
        paintedSurface({ color: accent, flatShading: true, map: makePaintTexture() }),
      );
      drum.rotation.x = Math.PI / 2;
      hull.add(drum);
      if (detail()) {
        for (const at of [-0.30, 0.30]) {
          const rim = new THREE.Mesh(
            new THREE.TorusGeometry(f.radius * 1.06, f.radius * 0.10, 4, 10),
            metal(metalColour),
          );
          rim.position.z = f.length * at;
          hull.add(rim);
        }
      }
    } else if (style === 'ski') {
      
      
      
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(f.radius, f.radius, f.length * 0.86, 8),
        paintedSurface({ color: tint, flatShading: true, map: makePaintTexture() }),
      );
      shaft.rotation.x = Math.PI / 2;
      hull.add(shaft);
      const tip = taper(f.radius * 2, f.radius * 0.7, f.radius, f.radius * 0.5, f.length * 0.20, accent);
      tip.position.set(0, f.radius * 0.34, f.length * 0.48);
      tip.rotation.x = -0.42;
      hull.add(tip);
    } else if (style === 'sponson') {
      
      
      
      
      
      
      
      
      const body = taper(f.radius, f.radius * 0.55, f.radius,
        f.radius * 0.6, f.length * 0.94, tint);
      hull.add(body);
      if (detail()) {
        const chine = box(f.radius * 2.1, 0.05, f.length * 0.80, accent);
        chine.position.y = -f.radius * f.squash * 0.55;
        hull.add(chine);
      }
    } else {
      
      const tube = new THREE.Mesh(
        new THREE.CylinderGeometry(f.radius, f.radius, f.length * 0.88, 9),
        paintedSurface({ color: tint, flatShading: true, map: makePaintTexture() }),
      );
      tube.rotation.x = Math.PI / 2;
      hull.add(tube);
      const nose = new THREE.Mesh(
        new THREE.ConeGeometry(f.radius, f.length * 0.16, 9),
        paintedSurface({ color: accent, flatShading: true, map: makePaintTexture() }),
      );
      nose.rotation.x = Math.PI / 2;
      nose.position.z = f.length * 0.52;
      hull.add(nose);
    }
    
    
    
    
    if (detail()) {
      const stripe = box(f.radius * 1.92, 0.06, f.length * 0.86, trim);
      hull.add(stripe);
    }
    hull.position.set(side * f.x, 0, 0);
    hull.scale.y = f.squash;
    floats.add(hull);
    
    
    
    for (const at of [0.26, -0.26]) {
      const strut = box(f.x * 0.9, 0.07, 0.09, metalColour);
      strut.position.set(side * f.x * 0.55, 0, f.length * at);
      floats.add(strut);
    }
  }
  floats.position.set(0, f.y, f.z);
  g.add(floats);

  
  
  
  
  
  
  const d = b.drive;
  const drive = new THREE.Group();
  const leg = box(d.legRadius * 2, d.legLength, d.legRadius * 2.6, LIVERY.engine);
  leg.position.y = -d.legLength / 2;
  drive.add(leg);
  if (detail()) {
    
    
    
    const plate = box(d.propRadius * 1.5, 0.04, d.propRadius * 0.9, metalColour);
    plate.position.set(0, -d.propOffset + d.propRadius * 0.62, -0.02);
    drive.add(plate);
    
    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(d.legRadius * 1.9, d.legRadius * 1.9, 0.16, 8),
      metal(metalColour),
    );
    collar.rotation.z = Math.PI / 2;
    drive.add(collar);
  }
  const prop = makeProp(d.propRadius, d.blades, d.guard, metalColour, accent);
  prop.position.y = -d.propOffset;
  drive.add(prop);
  drive.position.set(d.x, d.y, d.z);
  g.add(drive);

  
  
  
  
  
  
  let snorkel = null;
  if (b.snorkel && detail()) {
    snorkel = new THREE.Group();
    const sn = b.snorkel;
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(sn.radius, sn.radius, sn.height, 6),
      metal(metalColour),
    );
    pipe.position.y = sn.height / 2;
    snorkel.add(pipe);
    
    
    const elbow = new THREE.Mesh(
      new THREE.CylinderGeometry(sn.radius, sn.radius * 1.2, sn.radius * 3.2, 6),
      metal(accent),
    );
    elbow.rotation.x = Math.PI / 2;
    elbow.position.set(0, sn.height, -sn.radius * 1.4);
    snorkel.add(elbow);
    snorkel.position.set(sn.x, sn.y, sn.z);
    g.add(snorkel);
  }

  g.visible = false;
  g.name = 'boat';
  
  g.userData.floats = floats;
  g.userData.drive = drive;
  g.userData.prop = prop;
  g.userData.snorkel = snorkel;
  g.userData.spec = b;
  return g;
}















function buildGlider(spec, tint, accent) {
  const g = new THREE.Group();
  const gl = spec.glider;
  for (const side of [1, -1]) {
    
    
    
    
    
    
    
    
    
    
    const panel = taper(gl.span / 2, gl.span / 6, 0.024, 0.018, gl.chord, tint);
    panel.position.set((side * gl.span) / 4, gl.y, -0.10);
    panel.rotation.z = side * -gl.dihedral;
    panel.rotation.x = -0.10;
    g.add(panel);
    
    
    const edge = box(gl.span / 2, 0.05, 0.07, accent);
    edge.position.set((side * gl.span) / 4, gl.y + 0.02, -0.10 + gl.chord * 0.42);
    edge.rotation.z = side * -gl.dihedral;
    edge.rotation.y = side * 0.30;
    g.add(edge);
    
    const strut = box(0.05, gl.y - 0.55, 0.05, accent);
    strut.position.set(side * gl.span * 0.13, (gl.y + 0.55) / 2 - 0.06, -0.20);
    strut.rotation.z = side * -0.22;
    g.add(strut);
  }
  
  
  
  const keel = box(0.06, 0.06, gl.chord * 1.15, accent);
  keel.position.set(0, gl.y + 0.03, -0.10 + gl.chord * 0.12);
  g.add(keel);
  g.visible = false;
  g.name = 'glider';
  return g;
}












export function buildKart(character, variant = 0) {
  const spec = vehicleFor(character.id ?? character);
  const group = new THREE.Group();
  group.name = `kart-${character.id}-${spec.id}`;

  
  
  
  let s = (variant * 2246822519 + 374761393) >>> 0 || 1;
  const rng = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
  const jitter = (amount) => 1 + (rng() - 0.5) * amount;

  const tint = character.tint;
  const accent = LIVERY[spec.livery.accent];
  const trim = LIVERY[spec.livery.trim];
  const metalColour = LIVERY[spec.livery.metal];
  const pipeColour = LIVERY[spec.livery.pipe] ?? metalColour;

  
  
  
  
  
  
  const f = spec.floor;
  const floor = taper(f.tailHalf, f.noseHalf, f.tailHeight, f.noseHeight, f.length, tint, { skew: f.rake });
  floor.position.set(0, f.y, f.z);
  group.add(floor);

  buildNose(group, spec, tint, accent);
  buildPods(group, spec, tint, trim);

  
  
  if (spec.tower) {
    const t = spec.tower;
    const tower = taper(t.half, t.half * 0.82, t.height / 2, t.height / 2.4, t.length, tint);
    tower.position.set(0, t.y, t.z);
    group.add(tower);
    const stripe = box(t.half * 1.6, 0.07, t.length * 0.9, trim);
    stripe.position.set(0, t.y + t.height / 2 - 0.05, t.z);
    group.add(stripe);
  }

  
  
  
  
  
  const st = spec.seat;
  const seatBack = taper(st.width / 2, (st.width / 2) * 0.88, 0.26, 0.23, 0.16, LIVERY.engine);
  seatBack.position.set(0, st.backY, st.backZ);
  seatBack.rotation.x = -0.16;
  group.add(seatBack);
  for (const side of [1, -1]) {
    const bolster = box(0.10, 0.34, 0.56, LIVERY.engine);
    bolster.position.set(side * (st.width / 2 + 0.05), st.backY - 0.08, st.backZ + 0.28);
    group.add(bolster);
  }

  
  const e = spec.engine;
  const engine = taper(e.half, e.half * 0.88, e.height / 2, (e.height / 2) * 0.88, e.length, LIVERY.engine);
  engine.position.set(0, e.y, e.z);
  group.add(engine);
  if (e.camCover) {
    
    
    const camCover = box(e.half * 1.2, 0.10, e.length * 0.76, tint);
    camCover.position.set(0, e.y + e.height / 2 + 0.02, e.z);
    group.add(camCover);
  }

  
  
  
  
  
  
  
  const flames = [];
  const tips = [];
  const ex = spec.exhaust;
  const exStyle = styleOf(EXHAUST_STYLES, ex.style, 'twinRear');
  
  const flameStretch = VERTICAL_EXHAUSTS.includes(exStyle) ? 0.55 : 1.0;
  for (const base of ex.pipes) {
    const { group: pipe, tip } = makePipe(
      base, ex.dir, ex.length, ex.radius, ex.tipRadius, ex.cap, pipeColour,
    );
    group.add(pipe);
    tips.push({ x: tip.x, y: tip.y, z: tip.z, dir: ex.dir });
    
    
    if (detail()) {
      const soot = new THREE.Mesh(
        new THREE.CylinderGeometry(ex.tipRadius * 0.98, ex.tipRadius * 0.98, 0.05, 6),
        surface({ color: PALETTE.night, flatShading: true }),
      );
      soot.position.copy(tip);
      soot.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(ex.dir[0], ex.dir[1], ex.dir[2]).normalize(),
      );
      group.add(soot);
    }
    const flame = makeFlame(tip, ex.dir, ex.tipRadius / 0.095, flameStretch);
    group.add(flame);
    flames.push(flame);
  }

  
  
  
  
  
  
  
  if (spec.tailPanel) {
    const tp = spec.tailPanel;
    const panel = box(tp.width, tp.height, 0.10, tint);
    panel.position.set(0, tp.y, tp.z);
    group.add(panel);
    if (detail()) {
      const band = box(tp.width * 0.98, tp.stripe, 0.12, accent);
      band.position.set(0, tp.y - tp.height / 2 + tp.stripe, tp.z);
      group.add(band);
    }
  }

  
  
  
  const b = spec.bumper;
  const bumper = box(b.width, b.height, 0.14, trim);
  bumper.position.set(0, b.y, b.z);
  group.add(bumper);
  if (detail()) {
    for (const side of [1, -1]) {
      const stay = box(0.08, 0.10, 0.34, trim);
      stay.position.set(side * b.width * 0.42, b.y, b.z + 0.16);
      group.add(stay);
    }
  }

  buildRollBar(group, spec, metalColour, tint);
  buildWing(group, spec, tint, accent, trim);

  const steering = new THREE.Mesh(
    new THREE.TorusGeometry(0.24, 0.045, 5, 10),
    surface({ color: PALETTE.night, flatShading: true }),
  );
  steering.position.set(0, st.backY + 0.20, st.backZ + 1.24);
  steering.rotation.x = 1.05;
  group.add(steering);

  
  
  
  
  const wheels = { fl: null, fr: null, rl: null, rr: null };
  const w = spec.wheels;
  const frontR = w.frontRadius * jitter(0.05);
  const rearR = w.rearRadius * jitter(0.05);
  const axleF = spec.wheelbase / 2;
  const axleR = -spec.wheelbase / 2;
  const layout = [
    ['fl', w.trackFront / 2, frontR, w.frontWidth, axleF],
    ['fr', -w.trackFront / 2, frontR, w.frontWidth, axleF],
    ['rl', w.trackRear / 2, rearR, w.rearWidth, axleR],
    ['rr', -w.trackRear / 2, rearR, w.rearWidth, axleR],
  ];
  
  
  const steerPivotL = new THREE.Group();
  const steerPivotR = new THREE.Group();
  
  
  
  
  
  
  
  
  wheels.home = {};
  for (const [key, x, r, width, z] of layout) {
    const wheel = makeWheel(r, width, w.spokes, metalColour);
    const holder = key === 'fl' ? steerPivotL : key === 'fr' ? steerPivotR : null;
    if (holder) {
      holder.position.set(x, r, z);
      holder.add(wheel);
      group.add(holder);
    } else {
      wheel.position.set(x, r, z);
      group.add(wheel);
    }
    
    
    
    
    wheels.home[key] = { node: holder ?? wheel, x, y: r, z, side: Math.sign(x) || 1 };
    wheels[key] = wheel;
  }
  wheels.steerL = steerPivotL;
  wheels.steerR = steerPivotR;

  
  const glider = buildGlider(spec, tint, accent);
  group.add(glider);

  
  
  
  
  
  
  const boat = buildBoat(spec, tint, accent, trim, metalColour);
  group.add(boat);

  
  
  
  const driverPivot = new THREE.Group();
  driverPivot.position.set(0, st.y, st.z);
  group.add(driverPivot);

  const placeholder = box(st.width * 0.78, st.driverHeight * 0.7, 0.5, tint);
  placeholder.position.y = st.driverHeight * 0.35;
  placeholder.userData.placeholder = true;
  driverPivot.add(placeholder);

  loadDriver(character.species).then((scene) => {
    if (!scene) return;
    
    
    
    
    const body = scene.clone(true);
    const bbox = new THREE.Box3().setFromObject(body);
    const height = bbox.max.y - bbox.min.y || 1;
    
    
    
    
    
    
    const scale = st.driverHeight / height;

    
    
    
    
    
    
    
    
    
    const pivot = new THREE.Group();
    pivot.rotation.y = Math.PI;
    pivot.add(body);

    body.scale.setScalar(scale);
    body.position.y = -bbox.min.y * scale;
    
    
    
    
    
    pivot.rotation.x = st.tilt;
    pivot.position.z = 0.12;
    for (const child of [...driverPivot.children]) {
      if (child.userData.placeholder) driverPivot.remove(child);
    }
    driverPivot.add(pivot);

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    applyShadows(pivot, 'driver');
    
    
    
    
    
    
    pivot.traverse((o) => {
      if (!o.isMesh) return;
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) dressImported(m);
    });
  });

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  applyShadows(group, 'kart');
  return { group, wheels, driverPivot, tint, spec, glider, boat, flames, exhaustTips: tips };
}















export function poseKart(built, kart, dt) {
  const g = built.group;
  g.position.set(kart.x, kart.y, kart.z);
  
  
  
  
  
  
  
  
  
  
  
  g.rotation.y = kart.heading;

  const slip = kart.slip ?? 0;
  const speed = Math.abs(kart.speed ?? 0);
  const boating = !!kart.boating;
  const grinding = !!kart.grinding;

  
  
  
  
  
  
  
  
  
  
  
  
  
  const boat = built.boat;
  const boatT = boat ? stepDeploy(boat.userData.deploy ?? 0, boating, dt) : 0;
  if (boat) boat.userData.deploy = boatT;
  const boatPh = rigPhases(boatT);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const slipRoll = Math.max(-0.34, Math.min(0.34, -slip * 0.5)) * (boating ? 0.2 : 1);
  const boatHeel = Math.max(-0.22, Math.min(0.22, slip * 0.55)) * boatPh.trim;
  const wantRoll = slipRoll
    + boatHeel
    + (kart.bankRoll ?? 0)
    + (kart.grindSide ?? 0) * 0.26 * (kart.grindMount ?? 0);
  g.rotation.z += (wantRoll - g.rotation.z) * Math.min(1, dt * 9);

  
  
  
  
  
  
  
  
  
  
  
  
  
  const accelCue = Math.max(-1, Math.min(1, (kart.boost ? 1 : 0) - (kart.spinTime > 0 ? 1 : 0)));
  const boatPlane = -Math.min(1, speed / 22) * 0.09 * boatPh.trim;
  const wantPitch = -accelCue * 0.05 - (kart.wheelie ?? 0) * GRIND_WHEELIE + boatPlane;
  g.rotation.x += (wantPitch - g.rotation.x) * Math.min(1, dt * (grinding ? 11 : 7));

  
  
  
  
  
  
  
  
  
  
  
  const spin = (boating || grinding) ? 0 : (speed / (built.spec ? built.spec.wheels.rearRadius : 0.42)) * dt;
  for (const key of ['fl', 'fr', 'rl', 'rr']) {
    const w = built.wheels[key];
    if (w) w.rotation.x -= spin;
  }
  
  
  const steerAngle = Math.max(-0.52, Math.min(0.52, -(kart.steerVisual ?? 0) * 0.52));
  if (built.wheels.steerL) built.wheels.steerL.rotation.y = steerAngle;
  if (built.wheels.steerR) built.wheels.steerR.rotation.y = steerAngle;

  
  
  const d = built.driverPivot;
  const wantLean = Math.max(-0.30, Math.min(0.30, slip * 0.42));
  d.rotation.z += (wantLean - d.rotation.z) * Math.min(1, dt * 8);
  
  
  if (kart.spinTime > 0) {
    d.rotation.x = Math.sin(kart.spinTime * 34) * 0.3;
  } else {
    d.rotation.x += (0 - d.rotation.x) * Math.min(1, dt * 6);
  }

  
  
  
  
  
  
  
  
  
  const flames = built.flames;
  if (flames && flames.length) {
    const on = !!kart.boost;
    
    
    const flick = 0.78 + 0.34 * Math.abs(Math.sin(kart.x * 3.1 + kart.z * 2.7 + speed * 0.9));
    for (let i = 0; i < flames.length; i += 1) {
      const fl = flames[i];
      fl.visible = on;
      if (!on) continue;
      const k = flick * (1 + 0.16 * Math.sin(i * 2.1 + kart.x));
      fl.scale.set(k, k * 1.35, k);
      fl.material.opacity = 0.52 + (0.26 * (flick - 0.78)) / 0.34;
    }
  }

  
  
  
  
  
  const glider = built.glider;
  if (glider) {
    const want = kart.gliding ? 1 : 0;
    const now = glider.userData.deploy ?? 0;
    
    
    const next = now + (want - now) * Math.min(1, dt * (want > now ? 9 : 3.2));
    glider.userData.deploy = next;
    glider.visible = next > 0.02;
    if (glider.visible) {
      
      
      
      glider.scale.set(Math.min(1, next * 1.6), 1, 0.4 + next * 0.6);
      glider.position.y = (1 - next) * -0.35;
    }
  }

  
  
  
  
  
  if (boat) {
    boat.visible = rigVisible(boatT);
    if (boat.visible) {
      const bs = boat.userData.spec;
      
      
      
      
      
      
      const inflate = 0.12 + 0.88 * boatPh.floats;
      boat.userData.floats.scale.set(inflate, inflate, 0.55 + 0.45 * boatPh.floats);

      
      
      
      boat.userData.drive.rotation.x = bs.drive.stowTilt * (1 - boatPh.drive);

      
      
      
      
      
      boat.userData.prop.rotation.z -= propSpin(boatPh.prop, speed, dt);

      
      
      if (boat.userData.snorkel) {
        boat.userData.snorkel.scale.y = Math.max(0.001, boatPh.snorkel);
        boat.userData.snorkel.visible = boatPh.snorkel > 0.02;
      }
    }

    
    
    
    
    
    
    
    
    
    const home = built.wheels.home;
    if (home) {
      for (const key of ['fl', 'fr', 'rl', 'rr']) {
        const h = home[key];
        if (!h) continue;
        
        
        
        h.node.position.x = h.x - h.side * WHEEL_TUCK * boatPh.wheels;
        h.node.position.y = h.y + WHEEL_TUCK * 0.62 * boatPh.wheels;
        
        
        
        h.node.rotation.z = h.side * WHEEL_ROLL * boatPh.wheels;
      }
    }

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    if (boatPh.floats > 0.4 && built.flames && built.exhaustTips) {
      const line = boat.userData.spec.waterline;
      for (let i = 0; i < built.flames.length; i += 1) {
        const tip = built.exhaustTips[i];
        if (tip && tip.y < line) built.flames[i].visible = false;
      }
    }
  }

  
  
  
  
  const wantY = kart.squashTime > 0 ? 0.5 : 1;
  g.scale.y += (wantY - g.scale.y) * Math.min(1, dt * 8);
  const spread = 1 + (1 - g.scale.y) * 0.45;
  g.scale.x = spread;
  g.scale.z = spread;
}
