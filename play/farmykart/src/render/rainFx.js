




























import * as THREE from 'three';
import { SeededRng } from 'arbelo/rng';
import { scatterStreaks, leanFor } from '../../../../web-engine/kart/rainField.js';
import { themeOf } from './themes.js';









const WRAP_GLSL = 'fract(offset.y - (uTime * uSpeed) / uHeight)';

const VERT = `
attribute vec3 offset;      // x metres, phase 0..1, z metres
uniform float uTime;
uniform vec3  uCam;
uniform float uHeight;
uniform float uSpeed;
uniform vec2  uLean;
uniform float uLen;
uniform float uWide;
varying vec2 vUv;

void main() {
  // Height in the column, 0 at the bottom, 1 at the top. Same expression as
  // rainField.fallHeight - see WRAP_GLSL.
  float t = ${WRAP_GLSL};
  float fallen = (1.0 - t) * uHeight;

  vec3 base = vec3(
    uCam.x + offset.x,
    uCam.y + t * uHeight - uHeight * 0.5,
    uCam.z + offset.z);
  // The drift is proportional to how far the streak has already fallen, so the
  // rain shears rather than translating as a block.
  base.xz += uLean * fallen;

  // Billboard about the vertical axis only: a streak that also pitched toward
  // the camera would shorten as you looked up, and rain does not do that.
  // rainField's inner radius is what stops this normalize hitting zero.
  vec3 toCam = vec3(uCam.x - base.x, 0.0, uCam.z - base.z);
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), normalize(toCam)));
  vec3 dir = normalize(vec3(uLean.x, -1.0, uLean.y));

  vec3 world = base + right * (position.x * uWide) + dir * (position.y * uLen);
  vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
`;

const FRAG = `
uniform vec3  uColour;
uniform float uOpacity;
varying vec2 vUv;

void main() {
  // TAPERED AT BOTH ENDS AND ACROSS. A hard-edged quad reads as a falling
  // stick; the taper is what makes it read as water. Cheap enough to be free -
  // this is the only per-pixel work in the effect.
  float a = smoothstep(0.0, 0.30, vUv.y) * (1.0 - smoothstep(0.70, 1.0, vUv.y));
  a *= 1.0 - abs(vUv.x - 0.5) * 2.0;
  gl_FragColor = vec4(uColour, uOpacity * a);
}
`;







export function createRain(scene, theme, { seed = 0x9a17 } = {}) {
  const spec = themeOf(theme).rain;
  if (!spec) return null;

  const base = new THREE.PlaneGeometry(1, 1);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = base.index;
  geo.attributes.position = base.attributes.position;
  geo.attributes.uv = base.attributes.uv;
  geo.setAttribute('offset', new THREE.InstancedBufferAttribute(
    scatterStreaks(spec.streaks, { radius: spec.radius, rng: new SeededRng(seed) }), 3));
  geo.instanceCount = spec.streaks;
  
  
  
  
  
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);

  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    
    
    
    
    toneMapped: false,
    uniforms: {
      uTime: { value: 0 },
      uCam: { value: new THREE.Vector3() },
      uHeight: { value: spec.height },
      uSpeed: { value: spec.speed },
      uLean: { value: new THREE.Vector2() },
      uLen: { value: spec.length },
      uWide: { value: spec.width },
      uColour: { value: new THREE.Color(spec.colour) },
      uOpacity: { value: spec.opacity },
    },
  });

  const mesh = new THREE.InstancedMesh(geo, mat, spec.streaks);
  mesh.frustumCulled = false;
  mesh.name = 'rain';
  
  mesh.renderOrder = 3;
  scene.add(mesh);
  base.dispose();

  return { mesh, mat, spec, time: 0 };
}









export function updateRain(rain, dt, camera, kart) {
  if (!rain) return;
  rain.time += dt;
  const u = rain.mat.uniforms;
  u.uTime.value = rain.time;
  u.uCam.value.copy(camera.position);
  const lean = leanFor(kart?.vx ?? 0, kart?.vz ?? 0, rain.spec.speed, rain.spec.lean);
  u.uLean.value.set(lean.x, lean.z);
}


export const __WRAP_GLSL = WRAP_GLSL;
