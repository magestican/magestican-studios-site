


import * as THREE from 'three';
import { v } from '../site/assetUrl.js';
import { placeProps, sampleClip } from './propPlace.js';

const loader = new THREE.TextureLoader();
const CULL_Y = 34; 
const SEGMENTS = 8; 
const CULL_X = 34; 


function planeFor(pivot) {
  const g = new THREE.PlaneGeometry(1, 1, 1, SEGMENTS);
  const dy = pivot === 'bottom' ? 0.5 : pivot === 'top' ? -0.5 : 0;
  g.translate(0, dy, 0);
  return g;
}


function bending(mat, uniforms) {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = `uniform float uBend;\nuniform float uFalloff;\n${shader.vertexShader}`.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\ntransformed.x += uBend * pow(clamp(abs(position.y), 0.0, 1.0), uFalloff);',
    );
  };
  mat.customProgramCacheKey = () => 'scenery-bend';
}







export function createProps(scene, level, spec) {
  const group = new THREE.Group();
  scene.add(group);
  
  const planes = {};
  
  const clips = {};
  const placed = placeProps(level.world, spec.items, spec.seed);
  const tints = Object.fromEntries(spec.items.map((it) => [it.name, it.tint ?? 0xffffff]));
  
  const hazes = Object.fromEntries(spec.items.map((it) => [it.name, it.haze ?? 1]));
  const instances = placed.map((p) => {
    
    const mat = new THREE.MeshBasicMaterial({
      color: tints[p.name],
      transparent: true,
      alphaTest: 0.05,
      depthWrite: false,
      visible: false,
      opacity: hazes[p.name],
    });
    const uniforms = { uBend: { value: 0 }, uFalloff: { value: 1.6 } };
    bending(mat, uniforms);
    planes[p.pivot] ??= planeFor(p.pivot);
    const mesh = new THREE.Mesh(planes[p.pivot], mat);
    mesh.position.set(p.x, p.y, p.z);
    mesh.scale.set(p.h, p.h, 1);
    group.add(mesh);
    return { ...p, mesh, mat, uniforms, aspect: 1, haze: hazes[p.name] };
  });
  for (const item of spec.items) {
    const src = item.src ?? item.name; 
    loader.load(
      
      v(`${item.dir ?? spec.dir}/${src}/${src}.webp`),
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        const aspect = t.image.width / t.image.height;
        for (const i of instances) {
          if (i.name !== item.name) continue;
          i.mat.map = t;
          i.mat.visible = true;
          i.mat.needsUpdate = true;
          i.aspect = aspect;
          i.mesh.scale.x = i.h * aspect;
        }
      },
      undefined,
      () => {},
    );
    if (item.clip)
      fetch(v(`${item.clips ?? spec.clips}/${src}.json`))
        .then((r) => (r.ok ? r.json() : null))
        .then((c) => {
          if (c) clips[item.name] = c;
        })
        .catch(() => {});
  }
  return {
    count: instances.length,
    update(t, camX, camY) {
      for (const i of instances) {
        i.mesh.visible = Math.abs(i.x - camX) < CULL_X && Math.abs(i.y - camY) < CULL_Y;
        const c = clips[i.name];
        if (!i.mesh.visible || !c) continue;
        const m = sampleClip(c, t + i.phase * c.track.loop_s);
        i.uniforms.uFalloff.value = c.falloff_power;
        i.uniforms.uBend.value = (m.bend * i.h) / Math.max(0.01, i.h * i.aspect * m.sx);
        i.mesh.position.x = i.x + m.dx * i.h;
        i.mesh.position.y = i.y - m.dy * i.h;
        i.mesh.rotation.z = (m.rot * Math.PI) / 180;
        i.mesh.scale.x = i.h * i.aspect * m.sx;
        i.mat.opacity = m.a * i.haze;
      }
    },
  };
}
