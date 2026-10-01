










































import * as THREE from 'three';
import { MeshData } from 'moon/mesh/meshData.mjs';
import { HOME_STAND_IN_SCALE } from 'moon/world/collision.mjs';
import { homeOf, homeStage, villagerPose } from 'moon/play/village.mjs';
import { atHome, stepWarmth } from 'moon/play/smoke.mjs';
import { speakerOf } from 'moon/play/villagerTalk.mjs';
import { toObject3D } from '../render/toMesh.js';
import { soloEmissive } from '../render/material.js';
import { villagerHomeObject } from '../render/villagerHomes.js';
import { birthdayBunting } from 'moon/art/kit/birthdayBunting.mjs';

export const HOMES_DRAW = Object.freeze({
  popS: 0.7,
  sparkleS: 1.4,
  hammerEveryS: 0.42,
  hearHammerM: 16,
  
  drawM: 34,
  
  cratesBeside: Object.freeze({ x: 2.25, z: 1.2 }),
});



const STAGE_LINE = Object.freeze({
  house: 'My very own house!',
  decorated: 'Oh, it looks so pretty!',
  garden: 'Look at all the flowers!',
});




async function homeObject(stage, { species, seed = 1, season = 'summer', lod = 1, onProblems = () => {} } = {}) {
  
  
  
  
  
  
  
  const real = await villagerHomeObject(species, { seed, season, stage, lod });
  const obj = new THREE.Group();
  real.scale.setScalar(1 / HOME_STAND_IN_SCALE);
  obj.add(real);
  obj.scale.setScalar(HOME_STAND_IN_SCALE);
  obj.name = `home-${species}-${stage}`;
  obj.userData.triangles = real.userData.triangles;
  obj.userData.footprint = real.userData.home.anchors.footprint;
  
  
  obj.userData.smoke = real.userData.home.anchors.smoke || null;
  return obj;
}


const FACES = [
  [[1, 0, 0], [0, 0, -1], [0, 1, 0]], [[-1, 0, 0], [0, 0, 1], [0, 1, 0]],
  [[0, 1, 0], [1, 0, 0], [0, 0, -1]], [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
  [[0, 0, 1], [1, 0, 0], [0, 1, 0]], [[0, 0, -1], [-1, 0, 0], [0, 1, 0]],
];
function box(md, material, [cx, cy, cz], [hx, hy, hz], color, rotY = 0) {
  const h = [hx, hy, hz];
  const c = Math.cos(rotY), s = Math.sin(rotY);
  const turn = ([x, y, z]) => [x * c + z * s, y, -x * s + z * c];
  const dot = (a) => Math.abs(a[0]) * h[0] + Math.abs(a[1]) * h[1] + Math.abs(a[2]) * h[2];
  for (const [n, u, v] of FACES) {
    const hn = dot(n), hu = dot(u), hv = dot(v);
    const idx = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => {
      const local = [n[0] * hn + u[0] * hu * a + v[0] * hv * b, n[1] * hn + u[1] * hu * a + v[1] * hv * b, n[2] * hn + u[2] * hu * a + v[2] * hv * b];
      const p = turn(local);
      return md.vertex(material, [cx + p[0], cy + p[1], cz + p[2]], turn(n), color, [(a + 1) / 2, (b + 1) / 2]);
    });
    md.tri(material, idx[0], idx[1], idx[2]);
    md.tri(material, idx[0], idx[2], idx[3]);
  }
}

const CRATE = [0.78, 0.6, 0.4];
const CRATE_DARK = [0.58, 0.43, 0.29];
const PLANK = [0.88, 0.78, 0.6];
const IRON = [0.42, 0.42, 0.45];

function cratesMesh() {
  const md = new MeshData('home-crates');
  box(md, 'wood', [0, 0.25, 0], [0.25, 0.25, 0.25], CRATE, 0.12);
  box(md, 'wood', [0.62, 0.21, 0.12], [0.21, 0.21, 0.21], CRATE_DARK, -0.35);
  box(md, 'wood', [0.18, 0.69, 0.04], [0.19, 0.19, 0.19], CRATE, 0.5);
  for (let i = 0; i < 3; i++) box(md, 'plank', [-0.78, 0.04 + i * 0.075, 0.28 - i * 0.03], [0.62, 0.035, 0.11], PLANK, 0.08 * i);
  return md;
}

function hammerMesh() {
  
  const md = new MeshData('home-hammer');
  box(md, 'wood', [0, 0.16, 0], [0.025, 0.16, 0.025], PLANK);
  box(md, 'wood', [0, 0.33, 0], [0.09, 0.04, 0.045], IRON);
  return md;
}

const SPARKLE_STYLE_ID = 'fml-home-sparkle-style';
const SPARKLE_CSS = `
.fml-sparkle{position:absolute;left:0;top:0;width:0;height:0;pointer-events:none;will-change:transform}
.fml-sparkle i{position:absolute;left:-7px;top:-7px;width:14px;height:14px;background:#fff3b0;border-radius:2px;
  clip-path:polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%);
  filter:drop-shadow(0 0 4px #ffd36b);animation:fml-sparkle 1.4s ease-out forwards}
@keyframes fml-sparkle{0%{transform:translate(0,0) scale(.2);opacity:1}70%{opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(1.1) rotate(90deg);opacity:0}}
`;

export function createHomesDraw({ scene, season = 'summer', heightAt, sfx = null, voice = null, layer = null, onProblems = () => {}, onStage = () => {}, cfg = HOMES_DRAW, parts = null }) {
  const slots = new Map();
  let cratesObj = null, hammerObj = null, buntingObj = null, synced = false;
  const counts = { pops: 0, hammerPlays: 0, hammerSkipped: 0, voiced: 0, sparkles: 0 };

  if (layer && !document.getElementById(SPARKLE_STYLE_ID)) {
    const style = document.createElement('style');
    style.id = SPARKLE_STYLE_ID;
    style.textContent = SPARKLE_CSS;
    document.head.appendChild(style);
  }

  const ready = (async () => {
    const crates = cratesMesh(), hammer = hammerMesh();
    onProblems([...crates.validate(), ...hammer.validate()]);
    cratesObj = await toObject3D(crates);
    hammerObj = await toObject3D(hammer);
    cratesObj.userData.triangles = crates.triangleCount;
    hammerObj.userData.triangles = hammer.triangleCount;
    const bunting = birthdayBunting({ seed: 1, lod: 0 });
    onProblems(bunting.validate());
    buntingObj = await toObject3D(bunting);
    buntingObj.name = 'birthday-bunting';
    buntingObj.userData.triangles = bunting.triangleCount;
  })();

  
  
  
  function tok() {
    if (!sfx || !sfx.play('build.hammer')) { counts.hammerSkipped += 1; return; }
    counts.hammerPlays += 1;
  }

  function sparkle(slot, animS) {
    counts.sparkles += 1;
    if (!layer) return;
    const el = document.createElement('div');
    el.className = 'fml-sparkle';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + (slot.home.seed || 0);
      const r = 46 + ((i * 37) % 30);
      const star = document.createElement('i');
      star.style.setProperty('--dx', `${Math.round(Math.cos(a) * r)}px`);
      star.style.setProperty('--dy', `${Math.round(Math.sin(a) * r - 18)}px`);
      star.style.animationDelay = `${(i % 4) * 0.05}s`;
      el.appendChild(star);
    }
    layer.appendChild(el);
    slot.sparkle = { el, until: animS + cfg.sparkleS };
  }

  const local = (home, lx, lz) => {
    const c = Math.cos(home.rotY || 0), s = Math.sin(home.rotY || 0);
    return { x: home.x + lx * c + lz * s, z: home.z - lx * s + lz * c };
  };

  
  
  
  const flueOf = (slot, a) => {
    if (!a) return null;
    const p = local(slot.home, a.x, a.z);
    return { x: p.x, y: slot.group.position.y + a.y, z: p.z };
  };

  function slotOf(village, world, v) {
    let slot = slots.get(v.id);
    if (!slot) {
      
      const home = homeOf(village, v);
      if (!home) return null;
      const group = new THREE.Group();
      group.name = `home-spot-${v.species}`;
      group.position.set(home.x, heightAt(home.x, home.z), home.z);
      group.rotation.y = home.rotY || 0;
      scene.add(group);
      slot = {
        id: v.id, species: v.species, home, group, drawn: null, obj: null, loading: null,
        crates: null, hammer: null, pop: null, sparkle: null, nextTok: 0, hammering: false, pops: 0,
        
        
        warmth: 0, glass: null, flue: null,
      };
      slots.set(v.id, slot);
    }
    return slot;
  }

  function show(slot, stage, { animate, animS, canSpeak }) {
    const prev = slot.drawn;
    slot.drawn = stage;
    onStage(slot.id, slot.home, stage);
    if (stage === 'none') {
      if (slot.obj) { if (parts) parts.release(slot.obj); slot.group.remove(slot.obj); slot.obj = null; }
      slot.flue = null;
      return;
    }
    const want = stage;
    
    
    const celebrate = animate && stage !== 'building';
    slot.loading = homeObject(stage, { species: slot.species, seed: slot.home.seed, season, lod: 1, onProblems }).then(async (obj) => {
      if (slot.drawn !== want) return;
      
      
      
      if (!slot.glass) slot.glass = await soloEmissive('glass');
      if (slot.drawn !== want) return;
      obj.traverse((o) => { if (o.isMesh && o.material && o.material.name === 'glass') o.material = slot.glass; });
      if (slot.obj) { if (parts) parts.release(slot.obj); slot.group.remove(slot.obj); }
      slot.obj = obj;
      slot.group.add(obj);
      
      
      if (parts) parts.adopt(obj, { villager: slot.id });
      slot.flue = flueOf(slot, obj.userData.smoke);
      if (celebrate) {
        slot.pop = { startS: animS };
        obj.scale.setScalar(0.001);
        slot.pops += 1;
        counts.pops += 1;
        sparkle(slot, animS);
        if (voice && (!canSpeak || canSpeak())) {
          voice.say(STAGE_LINE[stage] || 'Oh!', speakerOf({ species: slot.species }).voice);
          counts.voiced += 1;
        }
      }
    }).catch((e) => onProblems([`home ${slot.species} ${stage}: ${e && e.message}`]));
    return prev;
  }

  function update(world, t, { village, animS = 0, dtS = 0, focus = null, player = null, screenOf = null, canSpeak = null, glass = 0, birthday = null } = {}) {
    if (!cratesObj) return;
    for (const v of world.villagers) {
      const slot = slotOf(village, world, v);
      if (!slot) continue;
      const hs = homeStage(v, t);
      if (slot.drawn !== hs.stage) show(slot, hs.stage, { animate: synced, animS, canSpeak });

      
      if (hs.building && !slot.crates) {
        slot.crates = cratesObj.clone();
        slot.hammer = hammerObj.clone();
        slot.crates.add(slot.hammer);
        slot.hammer.position.set(0.18, 0.88, 0.25);
        slot.group.add(slot.crates);
        slot.cratesAt = animS;
      }
      if (slot.crates) {
        
        const spot = cfg.cratesBeside;
        slot.crates.position.set(spot.x, 0, spot.z);
        slot.crates.rotation.y = -(slot.home.rotY || 0) * 0 + 0.3;
        
        const u = Math.min(1, (animS - slot.cratesAt) / 0.35);
        slot.crates.scale.setScalar(Math.max(0.001, u < 1 ? 1 - Math.pow(1 - u, 3) : 1));
        if (!hs.building) { slot.group.remove(slot.crates); slot.crates = null; slot.hammer = null; }
      }
      slot.hammering = Boolean(slot.crates && hs.progress > 0 && hs.progress < 1);
      if (slot.hammer) {
        
        const ph = slot.hammering ? ((animS % cfg.hammerEveryS) / cfg.hammerEveryS) : 0.6;
        slot.hammer.rotation.z = slot.hammering ? (ph < 0.25 ? -1.1 + (ph / 0.25) * 1.5 : 0.4 - ((ph - 0.25) / 0.75) * 1.5) : -0.2;
        if (slot.hammering && animS >= slot.nextTok) {
          slot.nextTok = animS + cfg.hammerEveryS;
          const near = !player || Math.hypot(player.x - slot.home.x, player.z - slot.home.z) <= cfg.hearHammerM;
          if (near) tok();
        }
      }

      
      if (slot.pop && slot.obj) {
        const u = Math.min(1, (animS - slot.pop.startS) / cfg.popS);
        const back = 1.9;
        const e = u >= 1 ? 1 : 1 + (back + 1) * Math.pow(u - 1, 3) + back * Math.pow(u - 1, 2);
        slot.obj.scale.setScalar(Math.max(0.001, e) * HOME_STAND_IN_SCALE);
        if (u >= 1) slot.pop = null;
      }
      if (slot.sparkle) {
        if (animS >= slot.sparkle.until) { slot.sparkle.el.remove(); slot.sparkle = null; }
        else if (screenOf) {
          const c = screenOf(slot.home.x, slot.group.position.y + 2.6, slot.home.z);
          slot.sparkle.el.style.transform = `translate3d(${Math.round(c.x)}px,${Math.round(c.y)}px,0)`;
          slot.sparkle.el.style.display = c.inView ? '' : 'none';
        }
      }
      
      
      
      const wantBunting = Boolean(buntingObj && birthday === slot.id && slot.drawn && slot.drawn !== 'none');
      if (wantBunting && !slot.bunting) { slot.bunting = buntingObj.clone(); slot.group.add(slot.bunting); }
      if (!wantBunting && slot.bunting) { slot.group.remove(slot.bunting); slot.bunting = null; }
      slot.group.visible = !focus || Math.hypot(slot.home.x - focus.x, slot.home.z - focus.z) <= cfg.drawM;
      slot.stage = hs;

      
      
      
      
      slot.warmth = stepWarmth(slot.warmth, atHome(villagerPose(village, world, v, t)), dtS);
      if (slot.glass) slot.glass.emissiveIntensity = slot.glass.userData.emissiveBase * glass * slot.warmth;
    }
    synced = true;
  }

  




  function smokeSources() {
    const out = [];
    for (const slot of slots.values()) {
      if (!slot.flue || !slot.group.visible || !(slot.warmth > 0)) continue;
      out.push({ key: slot.id, x: slot.flue.x, y: slot.flue.y, z: slot.flue.z, warmth: slot.warmth });
    }
    return out;
  }

  return {
    ready,
    update,
    smokeSources,
    
    get hearths() {
      return [...slots.values()].map((s) => ({
        villager: s.id, species: s.species, stage: s.drawn, visible: s.group.visible,
        warmth: Math.round(s.warmth * 1000) / 1000,
        lit: s.glass ? Math.round(s.glass.emissiveIntensity * 1000) / 1000 : null,
        flue: s.flue ? { x: Math.round(s.flue.x * 100) / 100, y: Math.round(s.flue.y * 100) / 100, z: Math.round(s.flue.z * 100) / 100 } : null,
      }));
    },
    get triangles() {
      let n = 0;
      for (const s of slots.values()) {
        if (!s.group.visible) continue;
        if (s.obj) n += Math.round((s.obj.userData.triangles || 0));
        if (s.crates) n += (cratesObj.userData.triangles || 0) + (hammerObj.userData.triangles || 0);
      }
      return n;
    },
    get stats() {
      return {
        ...counts,
        homes: [...slots.values()].map((s) => ({
          villager: s.id, species: s.species, x: s.home.x, z: s.home.z,
          stage: s.stage ? s.stage.stage : 'none', progress: s.stage ? s.stage.progress : 0, building: Boolean(s.stage && s.stage.building),
          drawn: s.drawn, shown: Boolean(s.obj), scale: s.obj ? s.obj.scale.x / HOME_STAND_IN_SCALE : 0,
          crates: Boolean(s.crates), hammering: s.hammering, pops: s.pops, sparkle: Boolean(s.sparkle), visible: s.group.visible,
          bunting: Boolean(s.bunting),
        })),
      };
    },
  };
}
