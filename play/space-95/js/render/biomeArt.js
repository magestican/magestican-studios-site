



import * as THREE from 'three';
import { v } from '../site/assetUrl.js';


export const ART_BIOME = { 1: 'orchard', 7: 'orchard', 10: 'orchard' };

const BIOMES = {
  orchard: {
    plate: 'assets/art/biome/orchard/orchard-far/plate.webp',
    plateAspect: 16 / 9,
    sky: 0xffe3c6, 
    
    
    top: {
      map: 'assets/art/biome/orchard/orchard-grass/texture.png',
      normal: 'assets/art/biome/orchard/orchard-grass/normal.png',
      tint: 0xffffff,
      unit: 2,
    },
    solid: {
      map: 'assets/art/biome/orchard/orchard-bark/texture.png',
      normal: 'assets/art/biome/orchard/orchard-bark/normal.png',
      tint: 0xb98be8,
      unit: 4,
    },
  },
};


export function biomeArt(level) {
  const b = ART_BIOME[level.id ?? 0];
  return b ? BIOMES[b] : null;
}

const loader = new THREE.TextureLoader();


function load(url, color, done) {
  loader.load(
    v(url),
    (t) => {
      if (color) t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 4;
      done(t);
    },
    undefined,
    () => {}, 
  );
}





export function skinMaterial(mat, spec) {
  load(spec.map, true, (t) => {
    mat.map = t;
    mat.color.set(spec.tint);
    mat.needsUpdate = true;
  });
  load(spec.normal, false, (t) => {
    mat.normalMap = t;
    mat.normalScale = new THREE.Vector2(0.8, 0.8);
    mat.needsUpdate = true;
  });
}







export function worldUV(geo, at, unit) {
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + at.x;
    const y = pos.getY(i) + at.y;
    const z = pos.getZ(i) + at.z;
    const nx = Math.abs(nor.getX(i));
    const ny = Math.abs(nor.getY(i));
    if (ny > 0.5) uv.setXY(i, x / unit, z / unit);
    else if (nx > 0.5) uv.setXY(i, z / unit, y / unit);
    else uv.setXY(i, x / unit, y / unit);
  }
  uv.needsUpdate = true;
}

const BACKDROP_DIST = 60; 
const PARALLAX = 0.18; 







export function paintedBackdrop(camera, art) {
  const mat = new THREE.MeshBasicMaterial({ color: art.sky, fog: false, depthWrite: false });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  quad.position.set(0, 0, -BACKDROP_DIST);
  quad.renderOrder = -1;
  camera.add(quad);
  let tex = null;
  load(art.plate, true, (t) => {
    t.wrapS = THREE.MirroredRepeatWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    tex = t;
    mat.map = t;
    mat.color.set(0xffffff);
    mat.needsUpdate = true;
  });
  return {
    update() {
      const k = 2 * Math.tan((camera.fov * Math.PI) / 360);
      const h = k * BACKDROP_DIST * 1.02;
      const w = h * camera.aspect;
      quad.scale.set(w, h, 1);
      if (!tex) return;
      
      const reps = camera.aspect / art.plateAspect;
      tex.repeat.set(reps, 1);
      
      const playW = k * Math.abs(camera.position.z) * camera.aspect;
      tex.offset.x = ((camera.position.x * PARALLAX) / Math.max(1, playW)) * reps;
    },
  };
}
