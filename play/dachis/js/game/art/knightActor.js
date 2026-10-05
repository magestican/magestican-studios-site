





import * as THREE from 'three';
import { requestJob, material, geometries } from './dachiActor.js';
import { createParticles } from './scenery/kit.js';
import { knightKey, KNIGHT_HEIGHT, KNIGHT_HINGE, KNIGHT_WRIST } from './knightModel.js';
import { WING_FOLDED } from '../features/story/watcherRules.js';

export const KNIGHT_WORLD_H = 2.3; 
const AURA = 26; 
const RED = [0.95, 0.04, 0.08], CORE = [1, 0.3, 0.2];

export class KnightActor {
  constructor(scene, { world = 1 } = {}) {
    this.scene = scene; this.k = world * KNIGHT_WORLD_H / KNIGHT_HEIGHT;
    this.root = new THREE.Group(); this.root.name = 'eagle-knight';
    this.body = new THREE.Group(); this.root.add(this.body);
    this.body.scale.setScalar(this.k);
    this.wings = [1, -1].map((sx) => {
      const g = new THREE.Group();
      g.position.set(KNIGHT_HINGE[0] * sx, KNIGHT_HINGE[1], KNIGHT_HINGE[2]);
      g.scale.x = sx; 
      const arm = new THREE.Group(), wrist = new THREE.Group();
      wrist.position.set(...KNIGHT_WRIST);
      g.add(arm); arm.add(wrist);
      this.body.add(g);
      return { arm, wrist };
    });
    scene.add(this.root);
    this.aura = createParticles(scene, AURA, { mode: 'add', name: 'knight-aura' });
    this.seeds = Array.from({ length: AURA }, (_, i) => ({ a: Math.random() * Math.PI * 2, h: Math.random(), ph: Math.random(), sp: 0.6 + Math.random() * 0.8, spark: i % 7 === 0 }));
    this.disposed = false;
    const load = (part, cb) => requestJob({ key: knightKey(part), kind: 'knight', opts: { part } }, (arr) => { if (!this.disposed) cb(geometries(knightKey(part), arr)); });
    const meshes = (geos) => geos.map(({ geo, id }) => {
      const m = new THREE.Mesh(geo, material(id === 'fur' ? 'b' : 'n', id, '#ffffff'));
      m.castShadow = id !== 'lamp-glow'; m.receiveShadow = true;
      return m;
    });
    
    
    this.shell = new THREE.Group(); this.body.add(this.shell);
    this.shellMat = new THREE.MeshBasicMaterial({ color: 0xff1a2a, side: THREE.BackSide, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
    load('body', (geos) => {
      this.body.add(...meshes(geos));
      for (const { geo } of geos) { const m = new THREE.Mesh(geo, this.shellMat); m.renderOrder = 3; this.shell.add(m); }
    });
    load('wingIn', (geos) => { for (const w of this.wings) w.arm.add(...meshes(geos)); });
    load('wingOut', (geos) => { for (const w of this.wings) w.wrist.add(...meshes(geos)); });
    this.setShown(0);
  }
  ready() { return this.body.children.length > 3 && this.wings[0].arm.children.length > 1 && this.wings[0].wrist.children.length > 0; }
  setShown(v) { this.root.visible = v > 0.01; }
  
  face(dx, dy) { this.root.rotation.y = Math.atan2(dx, dy); }
  
  place(x, y, ground, { wing = WING_FOLDED, bob = 0, shown = 1, t = performance.now() / 1000 } = {}) {
    this.root.position.set(x, ground + bob * this.k * KNIGHT_HEIGHT * 0.5, y);
    this.setShown(shown);
    for (const w of this.wings) {
      w.arm.rotation.set(0, wing.arm.sweep, wing.arm.raise, 'YZX');     
      w.wrist.rotation.set(0, wing.hand.fold, wing.hand.raise, 'YZX');   
    }
    
    const A = this.aura, H = KNIGHT_WORLD_H * (this.k * KNIGHT_HEIGHT / KNIGHT_WORLD_H);
    for (let i = 0; i < AURA; i++) {
      const s = this.seeds[i], life = (t * s.sp + s.ph) % 1;
      const hh = H * (0.2 + s.h * 0.6 + life * 0.7);
      const r = 0.24 * H * (1 - life * 0.2);
      const a = s.a + t * (s.spark ? 0.4 : 1.2);
      const fl = 0.55 + 0.45 * Math.sin(t * 23 + i * 1.7);
      A.set(i, x + Math.cos(a) * r, ground + hh, y + Math.sin(a) * r, 0.05 * H * (1 - life * 0.5),
        shown * (1 - life) * fl, life < 0.25 ? CORE : RED);
    }
    A.commit();
    
    const f = 0.5 + 0.5 * Math.sin(t * 17) * Math.sin(t * 5.3 + 1);
    this.shell.scale.set(1.05 + 0.03 * f, 1.04 + 0.06 * f, 1.05 + 0.03 * f);
    this.shell.position.y = 0.02 * f * KNIGHT_HEIGHT;
    this.shellMat.opacity = shown * (0.32 + 0.3 * f);
  }
  dispose() {
    this.disposed = true;
    this.scene.remove(this.root);
    const pts = this.scene.getObjectByName('knight-aura');
    if (pts) { this.scene.remove(pts); pts.geometry.dispose(); pts.material.dispose(); }
    this.shellMat.dispose();
    for (let i = 0; i < AURA; i++) this.aura.set(i, 0, -999, 0, 0, 0, RED);
    this.aura.commit();
  }
}
