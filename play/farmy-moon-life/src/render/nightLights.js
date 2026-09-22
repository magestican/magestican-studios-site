






import * as THREE from 'three';
import { assignLights } from 'moon/light/lightPool.mjs';
import { bendDrop } from 'moon/world/curve.mjs';
import { curveUniforms } from './material.js';

const LAMP_COLOUR = new THREE.Color('#ffb562');
const FIRE_COLOUR = new THREE.Color('#ff8a3c');

const BEND_GLSL =  `
uniform float uCurve;
uniform vec3 uCurveFocus;
vec4 fmlBend( vec4 w ) {
  vec2 d = w.xz - uCurveFocus.xz;
  w.y -= dot( d, d ) * uCurve;
  return w;
}
`;

const HALO_VERT =  `
${BEND_GLSL}
attribute float aSize;
attribute float aKind;
uniform float uPixels;
uniform float uLamp;
uniform float uFire;
varying float vAmount;
varying float vKind;
void main() {
  vec4 w = fmlBend( modelMatrix * vec4( position, 1.0 ) );
  vec4 mv = viewMatrix * w;
  gl_Position = projectionMatrix * mv;
  vAmount = mix( uLamp, uFire, aKind );
  vKind = aKind;
  gl_PointSize = aSize * uPixels / max( 1.0, -mv.z ) * ( 0.85 + 0.15 * vAmount );
}
`;

const HALO_FRAG =  `
uniform vec3 uLampColour;
uniform vec3 uFireColour;
varying float vAmount;
varying float vKind;
void main() {
  float r = length( gl_PointCoord - 0.5 ) * 2.0;
  float core = pow( max( 0.0, 1.0 - r ), 3.0 );
  float glow = pow( max( 0.0, 1.0 - r ), 1.4 ) * 0.35;
  vec3 c = mix( uLampColour, uFireColour, vKind );
  gl_FragColor = vec4( c * ( core * 1.2 + glow ) * vAmount, 1.0 );
}
`;

const POOL_VERT =  `
${BEND_GLSL}
attribute float aKind;
varying vec2 vLocal;
varying float vKind;
void main() {
  vLocal = uv;
  vKind = aKind;
  vec4 w = fmlBend( modelMatrix * vec4( position, 1.0 ) );
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

const POOL_FRAG =  `
uniform vec3 uLampColour;
uniform vec3 uFireColour;
uniform float uLamp;
uniform float uFire;
varying vec2 vLocal;
varying float vKind;
void main() {
  float r = length( vLocal );
  float fall = pow( max( 0.0, 1.0 - r ), 2.2 );
  float amount = mix( uLamp, uFire, vKind );
  vec3 c = mix( uLampColour, uFireColour, vKind );
  gl_FragColor = vec4( c * fall * amount * 0.32, 1.0 );
}
`;


export function createNightLights({ scene, sources, size, groundHeight = () => 0 }) {
  const group = new THREE.Group();
  group.name = 'night-lights';
  const lights = [];
  const addLight = () => {
    const light = new THREE.PointLight(LAMP_COLOUR, 0, 11, 1.6);
    light.castShadow = false;
    lights.push(light);
    group.add(light);
  };
  for (let i = 0; i < size; i++) addLight();

  const shared = {
    uCurve: curveUniforms.uCurve,
    uCurveFocus: curveUniforms.uCurveFocus,
    uLampColour: { value: LAMP_COLOUR.clone() },
    uFireColour: { value: FIRE_COLOUR.clone() },
    uLamp: { value: 0 },
    uFire: { value: 0 },
  };

  
  
  
  
  
  
  
  
  
  
  
  let sourceList = sources;
  let halos = null, pools = null;
  function buildFaked() {
    if (!sourceList.length) return;
    const hp = new Float32Array(sourceList.length * 3), hs = new Float32Array(sourceList.length), hk = new Float32Array(sourceList.length);
    sourceList.forEach((s, i) => {
      hp.set([s.x, s.y, s.z], i * 3);
      hs[i] = s.kind === 'fire' ? 2.4 : 1.7;
      hk[i] = s.kind === 'fire' ? 1 : 0;
    });
    const hg = new THREE.BufferGeometry();
    hg.setAttribute('position', new THREE.BufferAttribute(hp, 3));
    hg.setAttribute('aSize', new THREE.BufferAttribute(hs, 1));
    hg.setAttribute('aKind', new THREE.BufferAttribute(hk, 1));
    halos = new THREE.Points(hg, new THREE.ShaderMaterial({
      uniforms: { ...shared, uPixels: { value: 800 } },
      vertexShader: HALO_VERT, fragmentShader: HALO_FRAG,
      blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
    }));
    halos.frustumCulled = false;
    halos.renderOrder = 5;
    group.add(halos);

    
    const N = 8, positions = [], uvs = [], kinds = [], index = [];
    for (const s of sourceList) {
      const radius = s.kind === 'fire' ? 4.2 : 3.4;
      const base = positions.length / 3;
      for (let j = 0; j <= N; j++) {
        for (let i = 0; i <= N; i++) {
          const u = (i / N) * 2 - 1, v = (j / N) * 2 - 1;
          const x = s.x + u * radius, z = s.z + v * radius;
          positions.push(x, groundHeight(x, z) + 0.04, z);
          uvs.push(u, v);
          kinds.push(s.kind === 'fire' ? 1 : 0);
        }
      }
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          const a = base + j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1;
          index.push(a, c, b, b, c, d);
        }
      }
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    pg.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    pg.setAttribute('aKind', new THREE.Float32BufferAttribute(kinds, 1));
    pg.setIndex(index);
    pools = new THREE.Mesh(pg, new THREE.ShaderMaterial({
      uniforms: shared, vertexShader: POOL_VERT, fragmentShader: POOL_FRAG,
      blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    }));
    pools.frustumCulled = false;
    pools.renderOrder = 4;
    group.add(pools);
  }

  
  
  function disposeFaked() {
    for (const mesh of [halos, pools]) {
      if (!mesh) continue;
      group.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
    }
    halos = pools = null;
  }

  buildFaked();
  scene.add(group);

  let slots = new Int32Array(size);
  return {
    group,
    lights,
    get size() { return size; },
    get sources() { return sourceList; },
    
    
    
    
    setSources(next) {
      sourceList = next || [];
      disposeFaked();
      buildFaked();
      return sourceList.length;
    },
    
    
    
    
    
    
    
    
    
    setSize(next) {
      if (next === size || !(next > 0)) return false;
      while (lights.length > next) {
        const light = lights.pop();
        light.intensity = 0;
        group.remove(light);
        if (light.dispose) light.dispose();
      }
      while (lights.length < next) addLight();
      size = next;
      slots = new Int32Array(size);
      return true;
    },
    update(cycle, focus, pixelsPerRadian) {
      const lamp = cycle.emissive['lamp-glow'], fire = cycle.emissive.fire;
      shared.uLamp.value = lamp;
      shared.uFire.value = fire * (cycle.sunUp ? 0.25 : 1);
      if (halos) {
        halos.material.uniforms.uPixels.value = pixelsPerRadian;
        halos.visible = pools.visible = Math.max(lamp, shared.uFire.value) > 0.01;
      }
      assignLights(sourceList, focus, size, slots);
      for (let i = 0; i < size; i++) {
        const light = lights[i];
        const s = slots[i] >= 0 ? sourceList[slots[i]] : null;
        if (!s) { light.intensity = 0; continue; }
        const amount = s.kind === 'fire' ? shared.uFire.value : lamp;
        light.color.copy(s.kind === 'fire' ? FIRE_COLOUR : LAMP_COLOUR);
        light.intensity = (s.kind === 'fire' ? 9 : 6) * amount;
        light.position.set(s.x, s.y - bendDrop(s.x - focus.x, s.z - focus.z, curveUniforms.uCurve.value), s.z);
      }
    },
  };
}
