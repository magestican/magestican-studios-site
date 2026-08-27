







import * as THREE from 'three';
import { PALETTE } from '../palette.js';
import { makeSkyTexture } from './textures.js';


export function buildSky(kind) {
  const geo = new THREE.SphereGeometry(900, 24, 16);
  const mat = new THREE.MeshBasicMaterial({
    map: makeSkyTexture(kind),
    side: THREE.BackSide,
    
    
    
    fog: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'sky';
  return mesh;
}











export function buildLights(theme) {
  const group = new THREE.Group();
  group.name = 'lights';

  const sunColour = theme === 'overcast' || theme === 'mud' ? 0xd8dbe0
    : theme === 'snow' ? 0xf0f6ff : PALETTE.sun;
  const sun = new THREE.DirectionalLight(sunColour, theme === 'mud' ? 1.05 : 1.35);
  sun.position.set(-120, 190, 90);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  
  
  
  
  const c = sun.shadow.camera;
  c.left = -70; c.right = 70; c.top = 70; c.bottom = -70;
  c.near = 1; c.far = 520;
  sun.shadow.bias = -0.0009;
  group.add(sun);
  group.add(sun.target);

  const skyFill = new THREE.HemisphereLight(
    theme === 'snow' ? 0xdbeaff : PALETTE.skyHaze,
    theme === 'snow' ? 0xb9cde0 : PALETTE.grassDark,
    theme === 'overcast' || theme === 'mud' ? 0.85 : 0.62,
  );
  group.add(skyFill);

  const bounce = new THREE.DirectionalLight(theme === 'snow' ? 0xc9dcef : 0xc8a878, 0.28);
  bounce.position.set(80, -40, -60);
  group.add(bounce);

  group.userData.sun = sun;
  return group;
}


export function focusShadow(lights, x, z) {
  const sun = lights.userData.sun;
  if (!sun) return;
  sun.position.set(x - 120, 190, z + 90);
  sun.target.position.set(x, 0, z);
  sun.target.updateMatrixWorld();
}


export function fogFor(theme) {
  if (theme === 'snow') return new THREE.Fog(0xdfe9f3, 180, 620);
  if (theme === 'mud' || theme === 'overcast') return new THREE.Fog(0xa9b0b8, 140, 520);
  return new THREE.Fog(PALETTE.skyHaze, 200, 700);
}
















export function createChaseCamera(camera) {
  return {
    camera,
    x: 0, y: 4, z: 0,
    yaw: 0,
    fov: 62,
    shake: 0,
  };
}

export function updateChase(cam, kart, dt, { back = 7.4, height = 3.3, look = 5.5 } = {}) {
  const speed = Math.abs(kart.speed ?? 0);
  const travel = Math.hypot(kart.vx, kart.vz) > 1.2
    ? Math.atan2(kart.vx, kart.vz)
    : kart.heading;

  
  
  
  let want = travel + angleDelta(travel, kart.heading) * 0.28;
  
  if ((kart.speed ?? 0) < -1) want = kart.heading;

  const follow = kart.spinTime > 0 ? 2.4 : 6.5;
  cam.yaw += angleDelta(cam.yaw, want) * Math.min(1, dt * follow);

  
  
  const fast = Math.min(1, speed / 30);
  const dist = back + fast * 1.7;
  const h = height - fast * 0.35;

  const tx = kart.x - Math.sin(cam.yaw) * dist;
  const tz = kart.z - Math.cos(cam.yaw) * dist;
  const ty = kart.y + h;

  
  
  const k = Math.min(1, dt * 9);
  cam.x += (tx - cam.x) * k;
  cam.y += (ty - cam.y) * k;
  cam.z += (tz - cam.z) * k;

  cam.shake = Math.max(0, cam.shake - dt * 3.2);
  const sx = cam.shake * (Math.sin(performance.now() * 0.07) * 0.22);
  const sy = cam.shake * (Math.sin(performance.now() * 0.093) * 0.18);

  cam.camera.position.set(cam.x + sx, cam.y + sy, cam.z);
  cam.camera.lookAt(
    kart.x + Math.sin(cam.yaw) * look,
    kart.y + 1.05,
    kart.z + Math.cos(cam.yaw) * look,
  );

  
  
  const wantFov = 62 + fast * 8 + (kart.boost ? 9 : 0);
  cam.fov += (wantFov - cam.fov) * Math.min(1, dt * 5);
  if (Math.abs(cam.camera.fov - cam.fov) > 0.01) {
    cam.camera.fov = cam.fov;
    cam.camera.updateProjectionMatrix();
  }
}


export function snapChase(cam, kart, { back = 7.4, height = 3.3 } = {}) {
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
