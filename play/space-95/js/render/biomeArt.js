



import * as THREE from 'three';
import { v } from '../site/assetUrl.js';


export const ART_BIOME = {
  1: 'orchard',
  2: 'canopy',
  5: 'stripecat',
  6: 'canopy',
  7: 'orchardDusk',
  8: 'hive',
  9: 'puddle',
  10: 'canopy',
  11: 'desk',
};

const B = 'assets/art/biome/';

const tex = (dir, name, tint = 0xffffff, unit = 2) => ({
  map: `${B}${dir}/${name}/texture.png`,
  normal: `${B}${dir}/${name}/normal.png`,
  tint,
  unit,
});


const GRASS = tex('orchard', 'orchard-grass');
const BARK = tex('orchard', 'orchard-bark', 0xb98be8, 4);

const plate = (dir, name) => `${B}${dir}/${name}/plate.webp`;

const BIOMES = {
  orchard: { plate: plate('orchard', 'orchard-far'), plateAspect: 16 / 9, sky: 0xffe3c6, top: GRASS, solid: BARK },
  
  orchardDusk: { plate: plate('batch2', 'orchard-dusk-far'), plateAspect: 16 / 9, sky: 0xffb07a, top: GRASS, solid: BARK },
  
  canopy: { plate: plate('batch2', 'canopy-far'), plateAspect: 16 / 9, sky: 0xffe3c6, top: GRASS, solid: BARK },
  stripecat: {
    plate: plate('batch2', 'stripecat-far'),
    plateAspect: 16 / 9,
    sky: 0xffe1c0,
    top: tex('batch2', 'fur', 0xffe0bc, 4),
    solid: tex('batch2', 'fur', 0xffcfa6, 6),
  },
  hive: {
    plate: plate('batch2', 'hive-far'),
    plateAspect: 16 / 9,
    sky: 0xf3b44a,
    
    top: tex('batch2', 'wax', 0xffcf70, 4),
    solid: tex('batch2', 'wax', 0xffc46a, 6),
  },
  puddle: { plate: plate('batch2', 'puddle-far'), plateAspect: 16 / 9, sky: 0xffe3c6, top: GRASS, solid: BARK },
  desk: {
    plate: plate('batch2', 'desk-far'),
    plateAspect: 16 / 9,
    sky: 0xf59a62,
    top: tex('batch2', 'keycap'),
    solid: tex('batch2', 'keycap', 0x8f86b0, 3),
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
