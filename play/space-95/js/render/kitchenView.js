















import * as THREE from 'three';
import { hobState } from '../sim/temperature.js';
import { zoneOn } from '../sim/wind.js';

const COLD = 0x9fdcff;
const HEAT = 0xff8a2e;
const HOB_DARK = 0x24222c;
const HOB_WARN = 0x8a2a1e;
const HOB_LIT = 0xff6a1a;
const ICE = 0xcfefff;
const AZURE = 0x3d8bff;
const GOLD = 0xffd34d;

const lam = (color, emissive = 0x000000) => new THREE.MeshLambertMaterial({ color, emissive });
const glass = (color, opacity) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
const additive = (color, opacity) =>
  new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });


const isKitchen = (level) => !!(level.colds?.length || level.hobs?.length || level.heats?.length);





export function kitchenEntityView(e, g) {
  if (e.kind === 'weevil') {
    const body = new THREE.Group();
    body.name = 'weevilBody';
    const fur = e.specimen ? lam(0xf4f0ea, 0x2a2a2a) : lam(0xb58a5c, 0x1e140a);
    const round = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), fur);
    round.scale.set(1.35, 1.0, 1.0);
    round.position.y = 0.45;
    const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 0.55, 8), fur);
    snout.rotation.z = Math.PI / 2 + 0.5;
    snout.position.set(0.66, 0.36, 0);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x15121e });
    for (const z of [0.2, -0.05]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), eyeMat);
      eye.position.set(0.5, 0.6, z);
      body.add(eye);
    }
    
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.56, 0.18, 21), lam(e.specimen ? GOLD : 0xc9cdd4, 0x222428));
    cap.position.set(-0.05, 0.86, 0);
    cap.rotation.z = 0.12;
    cap.name = 'cap';
    body.add(round, snout, cap);
    if (e.specimen) {
      const sparkle = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), additive(AZURE, 0.35));
      sparkle.position.set(0, 0.5, 0.3);
      sparkle.name = 'sparkle';
      body.add(sparkle);
    }
    g.add(body);
    return true;
  }
  if (e.kind === 'freezeButton') {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(3, 0.25, 1.2), lam(0xf2f6fa));
    panel.position.y = 0.12;
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.75, 0.3, 24), lam(0x2f7de1, 0x0a2244));
    btn.position.y = 0.38;
    btn.name = 'button';
    g.add(panel, btn);
    return true;
  }
  return false;
}


function iceCube() {
  const g = new THREE.Group();
  g.name = 'ice';
  const cube = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.2), glass(ICE, 0.55));
  cube.position.y = 0.75;
  cube.name = 'cube';
  const rim = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1.5, 1.5, 1.2)),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 }),
  );
  rim.position.y = 0.75;
  g.add(cube, rim);
  return g;
}





export function createKitchen(scene, level, ctx) {
  if (!isKitchen(level)) return null;
  const root = new THREE.Group();
  root.name = 'kitchen';
  scene.add(root);
  
  const colds = (level.colds ?? []).map((z) => {
    const w = z.x1 - z.x0;
    const h = z.y1 - z.y0;
    const g = new THREE.Group();
    const low = new THREE.Mesh(new THREE.PlaneGeometry(w, h * 0.55), glass(COLD, 0.22));
    low.position.set(z.x0 + w / 2, z.y0 + h * 0.275, -0.3);
    const high = new THREE.Mesh(new THREE.PlaneGeometry(w, h * 0.45), glass(COLD, 0.12));
    high.position.set(z.x0 + w / 2, z.y0 + h * 0.775, -0.3);
    const edge = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.18), glass(0xeaf8ff, 0.45));
    edge.position.set(z.x0 + w / 2, z.y1 - 0.09, -0.29);
    g.add(low, high, edge);
    root.add(g);
    return { z, g, edge };
  });
  const heats = (level.heats ?? []).map((z) => {
    const w = z.x1 - z.x0;
    const h = z.y1 - z.y0;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glass(HEAT, 0.16));
    m.position.set(z.x0 + w / 2, z.y0 + h / 2, -0.25);
    root.add(m);
    return { z, m };
  });
  const hobs = (level.hobs ?? []).map((h) => {
    const w = h.x1 - h.x0;
    
    const m = new THREE.Mesh(new THREE.BoxGeometry(w - 0.6, 0.2, 2.6), lam(HOB_DARK));
    m.position.set(h.x0 + w / 2, h.y + 0.1, -0.2);
    
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(w, 2.2), glass(HOB_LIT, 0.0));
    glow.position.set(h.x0 + w / 2, h.y + 1.1, 0.25);
    root.add(m, glow);
    return { h, m, glow };
  });
  const blast = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), glass(0xf2fbff, 0));
  blast.position.z = 0.5;
  root.add(blast);
  let flash = 0;
  let t = 0;

  return {
    
    update(s, dt) {
      t += dt;
      for (const c of colds) c.edge.position.y = c.z.y1 - 0.09 + Math.sin(t * 1.6 + c.z.x0) * 0.06;
      for (const hz of heats) {
        const on = zoneOn(hz.z, s.time);
        hz.m.material.opacity = on ? 0.14 + 0.05 * Math.sin(t * 9 + hz.z.x0) : 0.02;
      }
      for (const hb of hobs) {
        const st = hobState(hb.h, s.time);
        hb.m.material.color.setHex(st === 'lit' ? HOB_LIT : st === 'warn' ? HOB_WARN : HOB_DARK);
        hb.m.material.emissive.setHex(st === 'lit' ? 0x6a1c00 : st === 'warn' ? 0x2a0800 : 0x000000);
        hb.glow.material.opacity = st === 'lit' ? 0.22 + 0.05 * Math.sin(t * 14) : 0;
      }
      
      const ec = s.extraCold;
      if (ec && s.time < ec.until) {
        blast.visible = true;
        blast.scale.set(ec.x1 - ec.x0, ec.y1 - ec.y0, 1);
        blast.position.set((ec.x0 + ec.x1) / 2, (ec.y0 + ec.y1) / 2, 0.5);
        blast.material.opacity = 0.12 + flash * 0.6;
      } else blast.visible = false;
      flash = Math.max(0, flash - dt * 2.5);
      
      for (const e of s.entities) {
        const v = ctx.views.get(e.id);
        if (!v || (e.kind !== 'weevil' && e.kind !== 'wasp')) continue;
        let ice = v.getObjectByName('ice');
        if (e.frozen && e.alive) {
          if (!ice) {
            ice = iceCube();
            v.add(ice);
          }
          ice.visible = true;
          const cube = ice.getObjectByName('cube');
          const warm = e.warm ?? 0;
          cube.material.opacity = 0.55 - Math.min(0.3, Math.max(0, warm - 4) * 0.15);
        } else if (ice) ice.visible = false;
      }
    },
    
    onEvent(e) {
      if (e.type === 'fastFreeze') flash = 1;
      const puff = (x, y, color, n) => {
        for (let i = 0; i < n; i++) ctx.spark(x + (Math.random() - 0.5) * 1.4, y + Math.random() * 1.4, color, 0.5, 0.12);
      };
      if (e.type === 'freeze') puff(e.x, e.y, 0xeaf8ff, 10); 
      if (e.type === 'thaw') puff(e.x, e.y, COLD, 8); 
      if (e.type === 'burn') puff(e.x, e.y, HEAT, 8);
    },
  };
}
