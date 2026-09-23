



























import * as THREE from 'three';
import { makeCozy, curveUniforms } from './material.js';
import { LEAF, createLeafPool, setLeafMax, emitLeaves, stepLeaves, leafPose, burstLeaves } from 'moon/play/leaves.mjs';
import { SMOKE, createSmokePool, setSmokeMax as smokeCeiling, emitSmoke, stepSmoke, puffPose } from 'moon/play/smoke.mjs';
import { createEmberPool, setEmberMax as emberCeiling, emitEmbers, stepEmbers, emberPose } from 'moon/play/embers.mjs';
import { createSplashPool, setSplashMax as splashCeiling, emitSplash, stepSplash, splashPose } from 'moon/play/splash.mjs';
import { FOAM_HOLE, createFoamPool, setFoamMax, emitFoam, stepFoam, foamPose } from 'moon/play/foam.mjs';




function leafGeometry() {
  const L = LEAF.lengthM, W = LEAF.widthM;
  const pos = [
    0, 0, -L * 0.5,       
    -W * 0.5, -0.008, 0,  
    W * 0.5, -0.008, 0,   
    0, 0.012, 0.02,       
    0, 0, L * 0.5,        
  ];
  const idx = [0, 1, 3, 0, 3, 2, 3, 1, 4, 3, 4, 2];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  
  
  const n = g.getAttribute('normal');
  for (let i = 0; i < n.count; i++) n.setXYZ(i, n.getX(i) * 0.4, Math.abs(n.getY(i)) * 0.6 + 0.6, n.getZ(i) * 0.4);
  g.computeBoundingSphere();
  return g;
}

















const SMOKE_COLOUR = new THREE.Color('#cfc9c4');

const SMOKE_VERT =  `
uniform float uCurve;
uniform vec3 uCurveFocus;
varying vec2 vLocal;
varying float vAlpha;
void main() {
  mat4 m = modelMatrix * instanceMatrix;
  vec4 w = m * vec4( 0.0, 0.0, 0.0, 1.0 );
  vec2 d = w.xz - uCurveFocus.xz;
  w.y -= dot( d, d ) * uCurve;
  float r = length( ( m * vec4( 1.0, 0.0, 0.0, 0.0 ) ).xyz );
  vec4 mv = viewMatrix * w;
  mv.xy += position.xy * r;
  vLocal = position.xy;
  vAlpha = instanceColor.x;
  gl_Position = projectionMatrix * mv;
}
`;

const SMOKE_FRAG =  `
uniform vec3 uColour;
varying vec2 vLocal;
varying float vAlpha;
void main() {
  float a = smoothstep( 1.0, 0.2, length( vLocal ) ) * vAlpha;
  if ( a <= 0.004 ) discard;
  gl_FragColor = vec4( uColour, a );
}
`;


function puffGeometry() {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.computeBoundingSphere();
  return g;
}














const EMBER_HOT = new THREE.Color('#fff2b0');
const EMBER_COOL = new THREE.Color('#ff5a1f');

const EMBER_VERT =  `
uniform float uCurve;
uniform vec3 uCurveFocus;
varying vec2 vLocal;
varying float vAlpha;
varying float vHeat;
void main() {
  mat4 m = modelMatrix * instanceMatrix;
  vec4 w = m * vec4( 0.0, 0.0, 0.0, 1.0 );
  vec2 d = w.xz - uCurveFocus.xz;
  w.y -= dot( d, d ) * uCurve;
  float r = length( ( m * vec4( 1.0, 0.0, 0.0, 0.0 ) ).xyz );
  vec4 mv = viewMatrix * w;
  mv.xy += position.xy * r;
  vLocal = position.xy;
  vAlpha = instanceColor.x;
  vHeat = instanceColor.y;
  gl_Position = projectionMatrix * mv;
}
`;

const EMBER_FRAG =  `
uniform vec3 uHotColour;
uniform vec3 uCoolColour;
varying vec2 vLocal;
varying float vAlpha;
varying float vHeat;
void main() {
  float core = pow( max( 0.0, 1.0 - length( vLocal ) ), 3.0 );
  float a = core * vAlpha;
  if ( a <= 0.004 ) discard;
  vec3 c = mix( uCoolColour, uHotColour, vHeat );
  gl_FragColor = vec4( c * a, 1.0 );
}
`;








const SPLASH_COLOUR = new THREE.Color('#dff3f8');

const SPLASH_VERT =  `
uniform float uCurve;
uniform vec3 uCurveFocus;
varying vec2 vLocal;
varying float vAlpha;
varying float vFlat;
void main() {
  mat4 m = modelMatrix * instanceMatrix;
  vec4 w = m * vec4( 0.0, 0.0, 0.0, 1.0 );
  vec2 d = w.xz - uCurveFocus.xz;
  w.y -= dot( d, d ) * uCurve;
  float r = length( ( m * vec4( 1.0, 0.0, 0.0, 0.0 ) ).xyz );
  float lay = instanceColor.y;
  // y -> -z, not +z: the quad's winding then faces UP (+y). Mapped y -> +z it
  // faced down and FrontSide culled every ring seen from above (measured
  // 2026-09-24: 16 rings alive, 0 pixels drawn).
  w.xz += vec2( position.x, -position.y ) * r * lay;
  vec4 mv = viewMatrix * w;
  mv.xy += position.xy * r * ( 1.0 - lay );
  vLocal = position.xy;
  vAlpha = instanceColor.x;
  vFlat = lay;
  gl_Position = projectionMatrix * mv;
}
`;





const SPLASH_FRAG =  `
uniform vec3 uColour;
uniform float uHole;
varying vec2 vLocal;
varying float vAlpha;
varying float vFlat;
void main() {
  float l = length( vLocal );
  float drop = smoothstep( 1.0, 0.1, l );
  float ring = smoothstep( uHole - 0.1, uHole + 0.05, l ) * smoothstep( 1.0, 0.85, l );
  float a = mix( drop, ring, vFlat ) * vAlpha;
  if ( a <= 0.004 ) discard;
  gl_FragColor = vec4( mix( uColour, vec3( 1.0 ), vFlat ), a );
}
`;










export function createParticles({ scene, max = LEAF.max ?? 64, smokeMax = 48, embersMax = 32, splashMax = 48, seed = 1 }) {
  const capacity = 64;
  const pool = createLeafPool({ max: capacity, seed });
  setLeafMax(pool, max);

  const material = makeCozy(new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.85, metalness: 0, side: THREE.DoubleSide,
  }), { key: 'particle-leaf', keepNormals: true });
  material.name = 'particle-leaf';
  const mesh = new THREE.InstancedMesh(leafGeometry(), material, capacity);
  mesh.name = 'leaves';
  mesh.count = 0;
  mesh.frustumCulled = false;   
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const white = new THREE.Color(1, 1, 1);
  for (let i = 0; i < capacity; i++) mesh.setColorAt(i, white);   
  mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
  scene.add(mesh);

  
  
  const smokeCapacity = 48;
  const smokePool = createSmokePool({ max: smokeCapacity, seed: seed + 101 });
  smokeCeiling(smokePool, smokeMax);
  const smokeMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uCurve: curveUniforms.uCurve,
      uCurveFocus: curveUniforms.uCurveFocus,
      uColour: { value: SMOKE_COLOUR.clone() },
    },
    vertexShader: SMOKE_VERT,
    fragmentShader: SMOKE_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });
  smokeMaterial.name = 'particle-smoke';
  const smokeMesh = new THREE.InstancedMesh(puffGeometry(), smokeMaterial, smokeCapacity);
  smokeMesh.name = 'smoke';
  smokeMesh.count = 0;
  smokeMesh.frustumCulled = false;   
  smokeMesh.castShadow = false;
  smokeMesh.receiveShadow = false;
  smokeMesh.renderOrder = 6;         
  smokeMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  for (let i = 0; i < smokeCapacity; i++) smokeMesh.setColorAt(i, white);   
  smokeMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
  scene.add(smokeMesh);

  
  
  const emberCapacity = 32;
  const emberPool = createEmberPool({ max: emberCapacity, seed: seed + 211 });
  emberCeiling(emberPool, embersMax);
  const emberMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uCurve: curveUniforms.uCurve,
      uCurveFocus: curveUniforms.uCurveFocus,
      uHotColour: { value: EMBER_HOT.clone() },
      uCoolColour: { value: EMBER_COOL.clone() },
    },
    vertexShader: EMBER_VERT,
    fragmentShader: EMBER_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  emberMaterial.name = 'particle-embers';
  const emberMesh = new THREE.InstancedMesh(puffGeometry(), emberMaterial, emberCapacity);
  emberMesh.name = 'embers';
  emberMesh.count = 0;
  emberMesh.frustumCulled = false;   
  emberMesh.castShadow = false;
  emberMesh.receiveShadow = false;
  emberMesh.renderOrder = 7;         
  emberMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  for (let i = 0; i < emberCapacity; i++) emberMesh.setColorAt(i, white);   
  emberMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
  scene.add(emberMesh);

  
  
  
  
  
  const dropCapacity = 48;
  const foamCapacity = 24;
  const splashCapacity = dropCapacity + foamCapacity;
  const splashPool = createSplashPool({ max: dropCapacity, seed: seed + 331 });
  splashCeiling(splashPool, splashMax);
  const foamPool = createFoamPool({ max: foamCapacity, seed: seed + 347 });
  
  
  const foamCeiling = (n) => setFoamMax(foamPool, Math.min(foamCapacity, Math.round((n | 0) / 2)));
  foamCeiling(splashMax);
  const splashMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uCurve: curveUniforms.uCurve,
      uCurveFocus: curveUniforms.uCurveFocus,
      uColour: { value: SPLASH_COLOUR.clone() },
      uHole: { value: FOAM_HOLE },
    },
    vertexShader: SPLASH_VERT,
    fragmentShader: SPLASH_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });
  splashMaterial.name = 'particle-splash';
  const splashMesh = new THREE.InstancedMesh(puffGeometry(), splashMaterial, splashCapacity);
  splashMesh.name = 'splash';
  splashMesh.count = 0;
  splashMesh.frustumCulled = false;   
  splashMesh.castShadow = false;
  splashMesh.receiveShadow = false;
  splashMesh.renderOrder = 6;         
  splashMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  for (let i = 0; i < splashCapacity; i++) splashMesh.setColorAt(i, white);   
  splashMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
  scene.add(splashMesh);

  const dummy = new THREE.Object3D();
  const colour = new THREE.Color();

  




  function update(dt, t, sources, { wind = 1 } = {}) {
    if (pool.max > 0) emitLeaves(pool, sources, dt, t, wind);
    stepLeaves(pool, dt, t);
    for (let i = 0; i < pool.alive; i++) {
      const p = leafPose(pool.leaves[i]);
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.rx, p.ry, p.rz);
      dummy.scale.setScalar(Math.max(0.001, p.scale));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, colour.setRGB(p.colour[0], p.colour[1], p.colour[2]));
    }
    mesh.count = pool.alive;
    mesh.visible = pool.alive > 0;
    if (pool.alive) {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.instanceColor.needsUpdate = true;
    }
  }

  







  function updateSmoke(dt, t, sources, { wind = 1 } = {}) {
    emitSmoke(smokePool, sources, dt, t);
    stepSmoke(smokePool, dt, t, wind);
    for (let i = 0; i < smokePool.alive; i++) {
      const p = puffPose(smokePool.puffs[i]);
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(Math.max(0.001, p.r));
      dummy.updateMatrix();
      smokeMesh.setMatrixAt(i, dummy.matrix);
      smokeMesh.setColorAt(i, colour.setRGB(p.alpha, p.alpha, p.alpha));
    }
    smokeMesh.count = smokePool.alive;
    smokeMesh.visible = smokePool.alive > 0;
    if (smokePool.alive) {
      smokeMesh.instanceMatrix.needsUpdate = true;
      smokeMesh.instanceColor.needsUpdate = true;
    }
  }

  




  function updateEmbers(dt, t, sources, { wind = 1 } = {}) {
    emitEmbers(emberPool, sources, dt, t);
    stepEmbers(emberPool, dt, t, wind);
    for (let i = 0; i < emberPool.alive; i++) {
      const p = emberPose(emberPool.embers[i]);
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(Math.max(0.001, p.r));
      dummy.updateMatrix();
      emberMesh.setMatrixAt(i, dummy.matrix);
      emberMesh.setColorAt(i, colour.setRGB(p.alpha, p.heat, 0));
    }
    emberMesh.count = emberPool.alive;
    emberMesh.visible = emberPool.alive > 0;
    if (emberPool.alive) {
      emberMesh.instanceMatrix.needsUpdate = true;
      emberMesh.instanceColor.needsUpdate = true;
    }
  }

  





  function updateSplash(dt, t, sources, { wind = 1, foam = true } = {}) {
    emitSplash(splashPool, sources, dt, t);
    stepSplash(splashPool, dt, t, wind);
    
    emitFoam(foamPool, foam ? sources : [], dt);
    stepFoam(foamPool, dt);
    dummy.rotation.set(0, 0, 0);
    const rings = foamPool.alive;
    for (let i = 0; i < rings; i++) {
      const p = foamPose(foamPool.rings[i]);
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.setScalar(Math.max(0.001, p.r));
      dummy.updateMatrix();
      splashMesh.setMatrixAt(i, dummy.matrix);
      splashMesh.setColorAt(i, colour.setRGB(p.alpha, 1, 0));
    }
    for (let i = 0; i < splashPool.alive; i++) {
      const p = splashPose(splashPool.drops[i]);
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.setScalar(Math.max(0.001, p.r));
      dummy.updateMatrix();
      splashMesh.setMatrixAt(rings + i, dummy.matrix);
      splashMesh.setColorAt(rings + i, colour.setRGB(p.alpha, 0, 0));
    }
    splashMesh.count = rings + splashPool.alive;
    splashMesh.visible = splashMesh.count > 0;
    if (splashMesh.count) {
      splashMesh.instanceMatrix.needsUpdate = true;
      splashMesh.instanceColor.needsUpdate = true;
    }
  }

  
  function setMax(n) { setLeafMax(pool, n); }

  
  function setSmokeMax(n) { smokeCeiling(smokePool, n); }

  
  function setEmberMax(n) { emberCeiling(emberPool, n); }

  
  function setSplashMax(n) { splashCeiling(splashPool, n); foamCeiling(n); }

  return {
    mesh, update, setMax,
    
    
    
    burst: (source, count = 0) => burstLeaves(pool, source, count),
    smokeMesh, updateSmoke, setSmokeMax,
    emberMesh, updateEmbers, setEmberMax,
    splashMesh, updateSplash, setSplashMax,
    get stats() { return { alive: pool.alive, emitted: pool.emitted, max: pool.max, capacity }; },
    get smokeStats() {
      return {
        alive: smokePool.alive, emitted: smokePool.emitted, max: smokePool.max,
        capacity: smokeCapacity, chimneys: smokePool.due.size, lifeS: SMOKE.lifeS,
      };
    },
    get emberStats() {
      return {
        alive: emberPool.alive, emitted: emberPool.emitted, max: emberPool.max,
        capacity: emberCapacity, fires: emberPool.due.size,
      };
    },
    get splashStats() {
      return {
        alive: splashPool.alive, emitted: splashPool.emitted, max: splashPool.max,
        capacity: dropCapacity, landings: splashPool.due.size,
        foam: { alive: foamPool.alive, emitted: foamPool.emitted, max: foamPool.max, capacity: foamCapacity },
        
        drawn: splashMesh.count, visible: splashMesh.visible, inScene: !!splashMesh.parent,
        ring0: foamPool.alive ? foamPose(foamPool.rings[0]) : null,
      };
    },
  };
}
