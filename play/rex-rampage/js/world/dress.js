



import { THREE } from '../vendor/three-vendor.js';
import { rowColour } from './art.js';
import { FOLIAGE, foliageCounts, groundOffset, PROPS, THEME_ART, themeFiles, VEHICLE_FILES } from './artManifest.js';


function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function besideRail(rail, rand, n, near, far, ground = rail.ground ?? ((d, _off) => rail.at(d).pos.y - 1.6)) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const d = rand() * rail.length;
    const { pos, tangent } = rail.at(d);
    const off = (rand() < 0.5 ? -1 : 1) * (near + rand() * (far - near));
    const l = Math.hypot(tangent.x, tangent.z) || 1;
    out.push({ x: pos.x + (-tangent.z / l) * off, z: pos.z + (tangent.x / l) * off, g: ground(d, off) });
  }
  return out;
}


function crossQuad(w, h) {
  const p = [];
  const uv = [];
  for (const [dx, dz] of [
    [1, 0],
    [0, 1],
  ]) {
    const x = (dx * w) / 2;
    const z = (dz * w) / 2;
    p.push(-x, 0, -z, x, 0, z, x, h, z, -x, h, -z);
    uv.push(0, 0, 1, 0, 1, 1, 0, 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
  return geo;
}

function placed(geo, mat, at, fn) {
  const mesh = new THREE.InstancedMesh(geo, mat, Math.max(1, at.length));
  const m = new THREE.Matrix4();
  for (let i = 0; i < at.length; i++) mesh.setMatrixAt(i, fn(at[i], i, m));
  mesh.count = at.length;
  return mesh;
}


function meshesOf(model) {
  const out = [];
  model.updateMatrixWorld(true);
  model.traverse((o) => {
    if (o.isMesh) out.push([o.geometry.clone().applyMatrix4(o.matrixWorld), o.material]);
  });
  return out;
}


function extendSky(tex, tall, top) {
  const img = tex.image;
  if (!img || !top || typeof document === 'undefined') return tex;
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = Math.round(img.height * tall);
  const ctx = c.getContext('2d');
  if (!ctx) return tex;
  const y0 = c.height - img.height;
  const css = `#${top.getHexString(THREE.SRGBColorSpace)}`;
  ctx.fillStyle = css;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(img, 0, y0);
  const fade = ctx.createLinearGradient(0, y0, 0, y0 + img.height * 0.35);
  fade.addColorStop(0, css);
  fade.addColorStop(1, `${css}00`);
  ctx.fillStyle = fade;
  ctx.fillRect(0, y0, c.width, img.height * 0.35);
  const out = new THREE.CanvasTexture(c);
  out.colorSpace = THREE.SRGBColorSpace;
  return out;
}

const tiled = (t, repeat, mode = THREE.RepeatWrapping) => {
  const c = t.clone();
  c.wrapS = mode;
  c.wrapT = THREE.RepeatWrapping;
  c.repeat.set(repeat[0], repeat[1]);
  c.needsUpdate = true;
  return c;
};








export function dressProps(scene, stage, built, art) {
  const a = THEME_ART[stage.theme];
  const dressed = [];
  let sky = null;
  let groundTile = 0;
  let vehicle = null;
  if (a) {
    const f = themeFiles(stage.theme);
    const T = art.textures;
    
    const gTex = T[f.textures[0]];
    if (gTex) {
      groundTile = a.ground.tile;
      const size = built.ground.geometry.parameters.width;
      const mat =  (built.ground.material);
      mat.map = tiled(gTex, [size / groundTile, size / groundTile]);
      const n = T[f.normals[0]];
      if (n) mat.normalMap = tiled(n, [size / groundTile, size / groundTile]);
      mat.color.set(a.ground.tint ?? 0xffffff);
      mat.needsUpdate = true;
      dressed.push('ground');
      
      if (built.terrain && !built.theme.rock) {
        
        const tm =  (built.terrain.material);
        tm.map = tiled(gTex, [1 / groundTile, 1 / groundTile]);
        if (n) tm.normalMap = tiled(n, [1 / groundTile, 1 / groundTile]);
        tm.color.set(a.ground.tint ?? 0xffffff);
        tm.needsUpdate = true;
        dressed.push('terrain');
      }
    }
    const rTex = T[f.textures[1]];
    if (rTex && built.road) {
      const mat =  (built.road.material);
      mat.map = tiled(rTex, [1, 1]);
      const n = T[f.normals[1]];
      if (n) mat.normalMap = tiled(n, [1, 1]);
      mat.color.set(0xffffff);
      mat.needsUpdate = true;
      dressed.push('road');
    }
    
    for (const [name, spec] of Object.entries(a.surfaces ?? {})) {
      const tex = T[`textures/${spec.tex}/texture.png`];
      if (!tex) continue;
      for (const mesh of built.surfaces?.[name] ?? []) {
        const mat =  (mesh.material);
        mat.map = tiled(tex, spec.repeat);
        mat.color.set(0xffffff);
        mat.needsUpdate = true;
      }
      
      if (name === 'rock' && spec.tile && built.terrain && built.theme.rock) {
        const tm =  (built.terrain.material);
        tm.map = tiled(tex, [1 / spec.tile, 1 / spec.tile]);
        tm.color.set(0xffffff);
        tm.needsUpdate = true;
        dressed.push('terrain');
      }
      dressed.push(name);
    }
    
    const sTex = f.sky && T[f.sky];
    if (sTex) {
      const r = 480;
      const reps = 4;
      const img = sTex.image;
      const h = ((2 * Math.PI * r) / reps) * (img.height / img.width);
      const tall = 2.2; 
      const top = rowColour(sTex, 0.02);
      const band = tiled(extendSky(sTex, tall, top), [reps, 1], THREE.MirroredRepeatWrapping);
      band.wrapT = THREE.ClampToEdgeWrapping;
      sky = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r, h * tall, 48, 1, true),
        new THREE.MeshBasicMaterial({ map: band, side: THREE.BackSide, fog: false, depthWrite: false }),
      );
      
      const tint = new THREE.Color(a.skyTint ?? 0xffffff);
       (sky.material).color.copy(tint);
      top?.multiply(tint);
      sky.renderOrder = -1;
      sky.userData.lift = (h * tall) / 2 - 0.42 * h; 
      scene.add(sky);
      const horizon = rowColour(sTex, 0.6)?.multiply(tint);
      if (horizon && scene.fog) scene.fog.color.copy(horizon);
      if (top) scene.background = top;
      dressed.push('sky');
    }
    
    const kinds = a.foliage.filter((k) => T[`foliage/${k}/sheet.png`]);
    if (kinds.length) {
      const slots = Math.min(700, Math.floor(stage.rail.length / 1.8));
      const counts = foliageCounts(kinds, slots);
      const rand = rng(7);
      for (const k of kinds) {
        const t = T[`foliage/${k}/sheet.png`];
        const spec = FOLIAGE[k];
        const w = spec.h * (t.image.width / t.image.height);
        const mat = new THREE.MeshLambertMaterial({ map: t, alphaTest: 0.5, side: THREE.DoubleSide });
        const at = besideRail(stage.rail, rand, counts[k], spec.near, spec.far);
        const q = new THREE.Quaternion();
        const up = new THREE.Vector3(0, 1, 0);
        const v = new THREE.Vector3();
        const sc = new THREE.Vector3();
        scene.add(
          placed(crossQuad(w, spec.h), mat, at, (p, _i, m) => {
            const s = 0.75 + rand() * 0.5;
            q.setFromAxisAngle(up, rand() * Math.PI);
            return m.compose(v.set(p.x, p.g - 0.1, p.z), q, sc.set(s, s, s));
          }),
        );
      }
      for (const o of built.greybox) o.visible = false;
      dressed.push('foliage');
    }
    
    const rand = rng(31);
    for (const k of a.props) {
      const model = art.models[`props/${k}/${k}.glb`];
      if (!model) continue;
      const spec = PROPS[k];
      const n = Math.max(1, Math.round((stage.rail.length / 100) * spec.per100));
      const at = besideRail(stage.rail, rand, n, spec.near, spec.far).map((p) => ({
        ...p,
        s: spec.s[0] + rand() * (spec.s[1] - spec.s[0]),
        r: rand() * Math.PI * 2,
      }));
      const q = new THREE.Quaternion();
      const up = new THREE.Vector3(0, 1, 0);
      const v = new THREE.Vector3();
      const sc = new THREE.Vector3();
      for (const [geo, mat] of meshesOf(model)) {
        scene.add(
          placed(geo, mat, at, (p, _i, m) => m.compose(v.set(p.x, p.g - 0.05, p.z), q.setFromAxisAngle(up, p.r), sc.set(p.s, p.s, p.s))),
        );
      }
      dressed.push(k);
    }
    
    const vModel = a.vehicle && art.models[VEHICLE_FILES[a.vehicle]];
    if (vModel) {
      vehicle = new THREE.Group();
      const body = vModel.clone();
      body.rotation.y = Math.PI / 2; 
      
      
      body.position.set(0.3, -0.25, -0.5);
      body.traverse((o) => {
        if (o.isMesh && /glass|frame/.test(o.material?.name ?? '')) o.visible = false;
      });
      vehicle.add(body);
      vehicle.userData.kind = a.vehicle;
      scene.add(vehicle);
      dressed.push(a.vehicle);
    }
  }
  return {
    dressed,
    follow(pos, fwd, ride) {
      if (groundTile) {
        const o = groundOffset(pos, groundTile);
        const mat =  (built.ground.material);
        mat.map?.offset.set(o.x, o.y);
        mat.normalMap?.offset.set(o.x, o.y);
      }
      if (sky) sky.position.set(pos.x, pos.y + sky.userData.lift, pos.z);
      if (vehicle) {
        vehicle.visible = ride === vehicle.userData.kind;
        vehicle.position.set(pos.x, pos.y - 1.62, pos.z);
        vehicle.rotation.y = Math.atan2(fwd.x, fwd.z);
      }
    },
  };
}
