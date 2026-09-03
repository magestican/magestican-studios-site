







import * as THREE from 'three';
import { PALETTE } from '../palette.js';
import { makeSunFaceTexture } from './textures.js';
import { buildSkyMaterial } from './materials.js';
import { themeOf } from './themes.js';
import { BASE_FOV, V_FOV_CEILING } from '../../../../web-engine/kart/raceFov.js';




import { rigFor, SHADOW } from '../../../../web-engine/render/lightRig.js';


























export function sunDirFor(sky = 'day') {
  return new THREE.Vector3(...rigFor(sky).keyPos).normalize();
}


export function buildSky(kind, sunDir) {
  const geo = new THREE.SphereGeometry(900, 32, 20);
  const mat = buildSkyMaterial(kind, sunDir);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'sky';
  
  
  
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  return mesh;
}







export function updateSky(sky, elapsed) {
  const u = sky?.material?.userData?.uniforms;
  if (u) u.uTime.value = elapsed;
}

export function buildLights(sky) {
  const group = new THREE.Group();
  group.name = 'lights';

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const rig = rigFor(sky);
  const sun = new THREE.DirectionalLight(rig.keyColour, rig.keyIntensity);
  
  
  
  
  
  sun.position.set(...rig.keyPos);
  sun.castShadow = true;
  
  
  
  
  sun.shadow.mapSize.set(SHADOW.mapSize, SHADOW.mapSize);
  
  
  
  
  const c = sun.shadow.camera;
  
  
  
  c.left = -SHADOW.half; c.right = SHADOW.half; c.top = SHADOW.half; c.bottom = -SHADOW.half;
  c.near = SHADOW.near; c.far = SHADOW.far;
  
  
  
  
  
  
  
  
  
  c.updateProjectionMatrix();
  
  
  
  
  
  sun.shadow.bias = SHADOW.bias;
  sun.shadow.normalBias = SHADOW.normalBias;
  group.add(sun);
  group.add(sun.target);

  const skyFill = new THREE.HemisphereLight(
    rig.hemiSky,
    
    
    
    
    rig.hemiGround,
    
    
    
    
    
    
    rig.hemiIntensity,
  );
  group.add(skyFill);

  
  
  
  
  
  
  
  
  
  const bounce = new THREE.DirectionalLight(rig.bounceColour, rig.bounceIntensity);
  bounce.position.set(...rig.bouncePos);
  group.add(bounce);

  group.userData.sun = sun;
  group.userData.rig = rig;
  return group;
}
















export function buildSun(lights, sky = 'day') {
  
  
  
  
  
  
  
  
  
  
  
  
  
  if (sky === 'rain') return null;
  const key = lights.userData.sun;
  const dir = key.position.clone().normalize();
  
  
  
  
  
  
  
  
  const mat = new THREE.SpriteMaterial({
    map: makeSunFaceTexture(),
    transparent: true,
    depthWrite: false,
    
    
    fog: false,
    sizeAttenuation: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.name = 'sun';
  
  
  
  sprite.scale.set(0.30, 0.30, 1);
  sprite.position.copy(dir.multiplyScalar(760));
  sprite.renderOrder = -1;
  return sprite;
}










export function updateSun(sun, camera, dt) {
  if (!sun) return;
  sun.material.rotation += dt * 0.16;
}













export function focusShadow(lights, x, z, heading = null) {
  const sun = lights.userData.sun;
  if (!sun) return;
  const [px, py, pz] = lights.userData.rig?.keyPos ?? [-150, 110, 105];
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const lead = heading === null ? 0 : SHADOW.lead;
  const lx = x + Math.sin(heading ?? 0) * lead;
  const lz = z + Math.cos(heading ?? 0) * lead;
  sun.position.set(lx + px, py, lz + pz);
  sun.target.position.set(lx, 0, lz);
  sun.target.updateMatrixWorld();
}

export function fogFor(theme) {
  
  
  
  
  
  
  
  
  
  
  const { fog } = themeOf(theme);
  return new THREE.Fog(fog.colour, fog.near, fog.far);
}
















export function createChaseCamera(camera, { baseFov = BASE_FOV, ceiling = V_FOV_CEILING } = {}) {
  return {
    camera,
    x: 0, y: 4, z: 0,
    yaw: 0,
    
    
    
    
    
    baseFov,
    ceiling,
    fov: baseFov,
    shake: 0,
    
    
    glide: 0,
  };
}































export const GLIDE_DOLLY = 1.15;


export const GLIDE_LIFT = 6.5;










export const GLIDE_LOOK_TIME = 2.2;


export const GLIDE_LOOK_MAX = 80;










export const GLIDE_LOOK_DROP = 22;












const GLIDE_SINK_GUESS = 8;


const GLIDE_EASE_IN = 2.2;




const GLIDE_EASE_OUT = 1.25;










export function updateChase(cam, kart, dt, { back = 7.4, height = 3.3, look = 5.5, groundY = null } = {}) {
  const speed = Math.abs(kart.speed ?? 0);
  const travel = Math.hypot(kart.vx, kart.vz) > 1.2
    ? Math.atan2(kart.vx, kart.vz)
    : kart.heading;

  
  
  
  let want = travel + angleDelta(travel, kart.heading) * 0.28;
  
  if ((kart.speed ?? 0) < -1) want = kart.heading;

  const follow = kart.spinTime > 0 ? 2.4 : 6.5;
  cam.yaw += angleDelta(cam.yaw, want) * Math.min(1, dt * follow);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const top = kart.tuning?.topSpeed ?? 40;
  const fast = Math.min(1, speed / top);
  
  
  
  let dist = back + fast * 3.2;
  let h = height - fast * 0.95;

  
  
  
  
  const wantGlide = kart.gliding ? 1 : 0;
  const easeRate = wantGlide > cam.glide ? GLIDE_EASE_IN : GLIDE_EASE_OUT;
  cam.glide += (wantGlide - cam.glide) * Math.min(1, dt * easeRate);
  if (cam.glide < 1e-4) cam.glide = 0;
  const g = cam.glide;

  if (g > 0) {
    dist *= 1 + g * GLIDE_DOLLY;
    h += g * GLIDE_LIFT;
  }

  const tx = kart.x - Math.sin(cam.yaw) * dist;
  const tz = kart.z - Math.cos(cam.yaw) * dist;
  const ty = kart.y + h;

  
  
  const k = Math.min(1, dt * 9);
  cam.x += (tx - cam.x) * k;
  cam.y += (ty - cam.y) * k;
  cam.z += (tz - cam.z) * k;

  cam.shake = Math.max(0, cam.shake - dt * 3.2);
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const shakeX = cam.shake * (Math.sin(performance.now() * 0.07) * 0.22);
  const sx = shakeX * Math.cos(cam.yaw);
  const sz = -shakeX * Math.sin(cam.yaw);
  const sy = cam.shake * (Math.sin(performance.now() * 0.093) * 0.18);

  
  
  
  
  let lookDist = look;
  let lookY = kart.y + 1.05;
  if (g > 0) {
    
    
    const drop = groundY === null ? 0 : Math.max(0, kart.y - groundY);
    const ahead = Math.min(GLIDE_LOOK_MAX, speed * Math.min(GLIDE_LOOK_TIME, drop / GLIDE_SINK_GUESS));
    lookDist = look + Math.sign(look || 1) * g * ahead;
    lookY -= g * Math.min(drop, GLIDE_LOOK_DROP);
  }

  cam.camera.position.set(cam.x + sx, cam.y + sy, cam.z + sz);
  cam.camera.lookAt(
    kart.x + Math.sin(cam.yaw) * lookDist,
    lookY,
    kart.z + Math.cos(cam.yaw) * lookDist,
  );

  
  
  
  
  
  
  
  
  
  
  const wantFov = Math.min(cam.ceiling, cam.baseFov + fast * 22 + (kart.boost ? 12 : 0));
  cam.fov += (wantFov - cam.fov) * Math.min(1, dt * 5);
  if (Math.abs(cam.camera.fov - cam.fov) > 0.01) {
    cam.camera.fov = cam.fov;
    cam.camera.updateProjectionMatrix();
  }
}


export function snapChase(cam, kart, { back = 7.4, height = 3.3 } = {}) {
  
  
  
  cam.glide = 0;
  cam.yaw = kart.heading;
  cam.x = kart.x - Math.sin(cam.yaw) * back;
  cam.y = kart.y + height;
  cam.z = kart.z - Math.cos(cam.yaw) * back;
}

function angleDelta(from, to) {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
