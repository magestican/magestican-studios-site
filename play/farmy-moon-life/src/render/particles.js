



























import * as THREE from 'three';
import { makeCozy, curveUniforms } from './material.js';
import { LEAF, createLeafPool, setLeafMax, emitLeaves, stepLeaves, leafPose } from 'moon/play/leaves.mjs';
import { SMOKE, createSmokePool, setSmokeMax as smokeCeiling, emitSmoke, stepSmoke, puffPose } from 'moon/play/smoke.mjs';




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








export function createParticles({ scene, max = LEAF.max ?? 64, smokeMax = 48, seed = 1 }) {
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

  
  function setMax(n) { setLeafMax(pool, n); }

  
  function setSmokeMax(n) { smokeCeiling(smokePool, n); }

  return {
    mesh, update, setMax,
    smokeMesh, updateSmoke, setSmokeMax,
    get stats() { return { alive: pool.alive, emitted: pool.emitted, max: pool.max, capacity }; },
    get smokeStats() {
      return {
        alive: smokePool.alive, emitted: smokePool.emitted, max: smokePool.max,
        capacity: smokeCapacity, chimneys: smokePool.due.size, lifeS: SMOKE.lifeS,
      };
    },
  };
}
