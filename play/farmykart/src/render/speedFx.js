









































import * as THREE from 'three';
import { PALETTE } from '../palette.js';










const Z_AXIS = new THREE.Vector3(0, 0, 1);



const LINES = 58;



const MOTES = 90;





const LINES_FROM = 0.62;
const LINES_FULL = 1.0;

const MOTE_THEMES = {
  summer: { colour: PALETTE.dust, size: 0.10, rate: 26 },
  
  
  mud: { colour: 0x9d8d76, size: 0.12, rate: 30 },
  overcast: { colour: 0x9d8d76, size: 0.12, rate: 30 },
  
  
  
  snow: { colour: PALETTE.snowCrest, size: 0.13, rate: 34 },
};





export function createSpeedFx(scene, theme = 'summer') {
  const mote = MOTE_THEMES[theme] ?? MOTE_THEMES.summer;

  
  
  
  
  
  
  
  
  
  
  
  
  
  const lineGeo = new THREE.PlaneGeometry(0.006, 0.34);
  lineGeo.translate(0, 0.17, 0);   
  const lineMat = new THREE.MeshBasicMaterial({
    color: PALETTE.speedLine,
    transparent: true,
    opacity: 0,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    fog: false,
  });
  const lines = new THREE.InstancedMesh(lineGeo, lineMat, LINES);
  lines.frustumCulled = false;
  
  
  
  lines.renderOrder = 900;
  lines.name = 'speedLines';

  
  
  let seed = 0x5a11ed;
  const rng = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; };

  const spokes = [];
  for (let i = 0; i < LINES; i += 1) {
    
    
    const angle = (i / LINES) * Math.PI * 2 + (rng() - 0.5) * 0.16;
    spokes.push({
      angle,
      
      
      
      
      
      
      
      
      
      
      inner: 0.38 + rng() * 0.44,
      length: 0.5 + rng() * 0.85,
      phase: rng(),
    });
  }
  scene.add(lines);

  
  const moteGeo = new THREE.PlaneGeometry(1, 1);
  const moteMat = new THREE.MeshBasicMaterial({
    color: mote.colour,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: theme === 'snow' ? THREE.AdditiveBlending : THREE.NormalBlending,
    side: THREE.DoubleSide,
    fog: false,
  });
  const motes = new THREE.InstancedMesh(moteGeo, moteMat, MOTES);
  motes.frustumCulled = false;
  motes.renderOrder = 890;
  motes.name = 'slipstream';
  const pool = [];
  for (let i = 0; i < MOTES; i += 1) pool.push({ alive: false, x: 0, y: 0, z: 0, life: 0, maxLife: 1, size: 1 });
  scene.add(motes);

  return {
    lines, lineMat, spokes,
    motes, moteMat, pool, moteSpec: mote,
    cursor: 0,
    strength: 0,
    spawnDebt: 0,
    _m: new THREE.Matrix4(),
    _v: new THREE.Vector3(),
    _s: new THREE.Vector3(),
    _q: new THREE.Quaternion(),
    _fwd: new THREE.Vector3(),
    _view: new THREE.Matrix4(),
    _eye: new THREE.Vector3(),
    _moteQ: new THREE.Quaternion(),
  };
}









export function updateSpeedFx(fx, kart, camera, dt) {
  const top = kart?.tuning?.topSpeed ?? 33;
  const speed = Math.abs(kart?.speed ?? 0);
  const boosting = !!kart?.boost;

  
  
  
  
  
  const raw = Math.max(
    0,
    Math.min(1, (speed / top - LINES_FROM) / Math.max(1e-6, LINES_FULL - LINES_FROM)),
  );
  
  
  
  
  
  const want = boosting ? 1 : raw * 0.72;
  const rate = want > fx.strength ? 8 : 2.6;
  fx.strength += (want - fx.strength) * Math.min(1, dt * rate);
  const k = fx.strength;

  
  
  
  
  
  
  
  fx.lineMat.opacity = 0.2 * k * k;
  fx.lines.visible = k > 0.02;
  if (fx.lines.visible) {
    camera.getWorldDirection(fx._fwd);
    const cx = camera.position.x + fx._fwd.x * 1.4;
    const cy = camera.position.y + fx._fwd.y * 1.4;
    const cz = camera.position.z + fx._fwd.z * 1.4;
    fx.lines.position.set(cx, cy, cz);
    fx.lines.quaternion.copy(camera.quaternion);
    
    
    
    
    
    
    
    const aspect = camera.aspect || 1.78;
    for (let i = 0; i < fx.spokes.length; i += 1) {
      const sp = fx.spokes[i];
      
      
      
      const inner = sp.inner * (1 - k * 0.34);
      const len = sp.length * (0.3 + k * 0.55);
      const ex = Math.cos(sp.angle) * aspect;
      const ey = Math.sin(sp.angle);
      const mag = Math.hypot(ex, ey) || 1;
      fx._v.set((ex / mag) * inner * aspect, (ey / mag) * inner, 0);
      fx._q.setFromAxisAngle(Z_AXIS, Math.atan2(ey, ex) - Math.PI / 2);
      fx._s.set(1, len, 1);
      fx.lines.setMatrixAt(i, fx._m.compose(fx._v, fx._q, fx._s));
    }
    fx.lines.instanceMatrix.needsUpdate = true;
  }

  
  
  
  
  
  
  
  
  
  const spec = fx.moteSpec;
  if (k > 0.05 && kart) {
    fx.spawnDebt += spec.rate * k * dt;
    while (fx.spawnDebt >= 1) {
      fx.spawnDebt -= 1;
      const p = fx.pool[fx.cursor];
      fx.cursor = (fx.cursor + 1) % MOTES;
      const a = Math.random() * Math.PI * 2;
      const r = 1.6 + Math.random() * 4.2;
      const ahead = 8 + Math.random() * 16;
      p.alive = true;
      p.x = kart.x + Math.sin(kart.heading) * ahead + Math.cos(a) * r;
      p.y = (kart.y ?? 0) + 0.5 + Math.sin(a) * r * 0.55 + Math.random() * 1.2;
      p.z = kart.z + Math.cos(kart.heading) * ahead + Math.sin(a) * r;
      p.maxLife = 0.55 + Math.random() * 0.4;
      p.life = p.maxLife;
      p.size = spec.size * (0.7 + Math.random() * 0.9);
    }
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  camera.updateMatrixWorld();
  fx._view.copy(camera.matrixWorld).invert();

  let n = 0;
  for (const p of fx.pool) {
    if (!p.alive) continue;
    p.life -= dt;
    if (p.life <= 0) { p.alive = false; continue; }
    const t = p.life / p.maxLife;
    
    
    
    
    fx._v.set(p.x, p.y, p.z);
    fx._eye.copy(fx._v).applyMatrix4(fx._view);
    fx._q.setFromAxisAngle(Z_AXIS, Math.atan2(fx._eye.y, fx._eye.x) - Math.PI / 2);
    fx._moteQ.copy(camera.quaternion).multiply(fx._q);
    fx._s.set(p.size, p.size * (1 + k * 16), 1);
    fx.motes.setMatrixAt(n, fx._m.compose(fx._v, fx._moteQ, fx._s));
    n += 1;
    if (n >= MOTES) break;
  }
  fx.motes.count = n;
  fx.motes.instanceMatrix.needsUpdate = true;
  fx.moteMat.opacity = 0.5 * Math.min(1, k * 1.4);
  fx.motes.visible = n > 0;
}
