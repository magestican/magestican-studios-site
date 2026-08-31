




























import * as THREE from 'three';
import { solve, RIG, ARCH, paintFace, bodyPalette } from '../animeRig.mjs';
import { poseById } from '../moveSet.mjs';
import { segmentsOf, torsoBoxOf, jointsOf, girdleOf } from '../../../../web-engine/ps1/ps1Rig.mjs';
import { buildFighter } from '../../../../web-engine/ps1/ps1Mesh.mjs';
import { head3d, hair3d } from '../../../../web-engine/ps1/ps1Head.mjs';
import { ps1Vertex, FRAGMENT, KEY_DIR, FILL_DIR } from '../../../../web-engine/ps1/ps1Shader.mjs';






const YAW = 0.42;
































const VERT = ps1Vertex();
const FRAG_COLOUR = FRAGMENT.colour();
const FRAG_TEX = FRAGMENT.textured();
const FRAG_GHOST = FRAGMENT.ghost();



























function headSheet(archId) {
  const FACE = 128;
  const sheet = document.createElement('canvas');
  sheet.width = FACE * 2;
  sheet.height = Math.round(FACE / 0.75);
  const sc = sheet.getContext('2d');
  const P = bodyPalette(archId);

  sc.fillStyle = P.skin;
  sc.fillRect(0, 0, sheet.width, sheet.height);

  
  
  
  
  const sx0 = sheet.width * 0.52;
  const sw = sheet.width - sx0;
  const wash = sc.createLinearGradient(sx0, 0, sx0 + sw, 0);
  wash.addColorStop(0, P.skin);
  wash.addColorStop(1, P.skinShade);
  sc.fillStyle = wash;
  sc.fillRect(sx0, 0, sw, sheet.height);

  
  
  
  
  paintFace(sc, FACE, archId, 'set', { crown: 0, chin: (0.7275 / 0.75) * FACE });
  return sheet;
}

const PART_COLOUR = (name, P) => {
  if (name === 'hair') return P.hair;
  if (/^pelvis|^thigh|^shin|^hip\d|^knee|^ankle/.test(name)) return P.pant;
  if (/^torso|^trapezius/.test(name)) return P.top;
  if (/^foot/.test(name)) return P.accent;
  return P.skin;
};

export function createFighter3d({ width, height }) {
  let canvas;
  let renderer;
  try {
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(1);
    renderer.setSize(width, height, false);
    renderer.setClearColor(0x000000, 0);
    renderer.autoClear = false;
  } catch (e) {
    
    
    
    return { ok: false, canvas: null, draw() {}, dispose() {} };
  }

  const scene = new THREE.Scene();
  
  
  
  const camera = new THREE.OrthographicCamera(0, width, 0, height, -2000, 2000);
  camera.position.z = 1000;
  camera.lookAt(0, 0, 0);
  
  camera.up.set(0, -1, 0);
  camera.updateProjectionMatrix();

  const uRes = { value: new THREE.Vector2(width, height) };
  const uKey = { value: new THREE.Vector3(...KEY_DIR) };
  const uFill = { value: new THREE.Vector3(...FILL_DIR) };
  const lights = { uRes, uKey, uFill };

  const sheets = new Map();
  const texOf = (archId) => {
    if (sheets.has(archId)) return sheets.get(archId);
    const t = new THREE.CanvasTexture(headSheet(archId));
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.flipY = false;
    sheets.set(archId, t);
    return t;
  };

  const matColour = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG_COLOUR,
    uniforms: { ...lights, uAlpha: { value: 1 } },
  });
  
  
  const matGhost = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG_GHOST,
    uniforms: { ...lights, uAlpha: { value: 0.3 } },
    transparent: true, depthWrite: true,
  });
  const matTex = new Map();
  const texMaterial = (archId) => {
    if (!matTex.has(archId)) {
      matTex.set(archId, new THREE.ShaderMaterial({
        vertexShader: VERT, fragmentShader: FRAG_TEX,
        uniforms: { ...lights, uAlpha: { value: 1 }, uMap: { value: texOf(archId) } },
      }));
    }
    return matTex.get(archId);
  };

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const geoCache = new Map();

  








  function concat(parts, P) {
    let nv = 0; let ni = 0;
    for (const p of parts) { nv += p.mesh.positions.length / 3; ni += p.mesh.indices.length; }
    const pos = new Float32Array(nv * 3);
    const nor = new Float32Array(nv * 3);
    const uv = new Float32Array(nv * 2);
    const col = new Float32Array(nv * 3);
    const idx = new Uint16Array(ni);
    let vo = 0; let io = 0;
    const c = new THREE.Color();
    for (const p of parts) {
      const n = p.mesh.positions.length / 3;
      pos.set(p.mesh.positions, vo * 3);
      nor.set(p.mesh.normals, vo * 3);
      uv.set(p.mesh.uvs, vo * 2);
      c.set(PART_COLOUR(p.name, P));
      for (let i = 0; i < n; i += 1) {
        col[(vo + i) * 3] = c.r; col[(vo + i) * 3 + 1] = c.g; col[(vo + i) * 3 + 2] = c.b;
      }
      for (let i = 0; i < p.mesh.indices.length; i += 1) idx[io + i] = p.mesh.indices[i] + vo;
      vo += n; io += p.mesh.indices.length;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    return g;
  }

  
  function geometryFor(archId, poseId, flip) {
    const key = `${archId}|${poseId}|${flip ? 1 : 0}`;
    const hit = geoCache.get(key);
    if (hit) return hit;

    const A = ARCH[archId] || ARCH.renji;
    const P = bodyPalette(archId);
    const pose = poseById(poseId);
    if (!pose) return null;
    const build = A.build || 1;
    const sx = flip ? -1 : 1;
    const K = solve(pose, { flip });
    
    
    
    
    
    const built = buildFighter(K, {
      segments: segmentsOf(K, { flip, build }),
      torso: torsoBoxOf(K, { flip, build }),
      joints: jointsOf(K, { flip, build }),
      girdle: girdleOf(K, { flip, build }),
      headR: RIG.headR,
      arch: { build, jaw: A.jaw, brow: A.brow, hair: A.hair },
      flip,
      pose,
      
      
      
      
      
      head: false,
    });

    const headC = [K.head[0] * sx, 0, K.head[1]];
    const fwd = [sx, 0, 0];
    const parts = [
      ...built.parts,
      { name: 'head', mesh: head3d({ centre: headC, r: RIG.headR, jaw: A.jaw, brow: A.brow, forward: fwd }) },
      { name: 'hair', mesh: hair3d(A.hair, { centre: headC, r: RIG.headR, forward: fwd }) },
    ].filter((p) => p.mesh && p.mesh.indices && p.mesh.indices.length);

    
    
    
    const headParts = parts.filter((p) => p.name === 'head');
    const bodyParts = parts.filter((p) => p.name !== 'head');
    const entry = {
      body: concat(bodyParts, P),
      head: headParts.length ? concat(headParts, P) : null,
      all: concat(parts, P),
    };
    geoCache.set(key, entry);
    return entry;
  }

  
  
  const pool = [];
  let used = 0;
  function take(geometry, material) {
    let m = pool[used];
    if (!m) { m = new THREE.Mesh(); pool.push(m); }
    used += 1;
    m.geometry = geometry;
    m.material = material;
    return m;
  }
  function beginPass() { scene.clear(); used = 0; }

  



  function place(obj, spec, flip) {
    const h = Math.max(1, spec.feet - spec.top);
    obj.rotation.set(Math.PI / 2, 0, 0);          
    obj.scale.setScalar(h);
    const holder = obj.parent;
    holder.rotation.y = flip ? -YAW : YAW;
    holder.position.set(spec.cx, spec.feet, 0);
  }

  
  function addFigure(spec, archId, ghost) {
    if (!spec) return false;
    const flip = spec.facing < 0;
    const geo = geometryFor(archId, spec.pose, flip);
    if (!geo) return false;

    const holder = new THREE.Group();
    const inner = new THREE.Group();
    holder.add(inner);
    if (ghost) {
      inner.add(take(geo.all, matGhost));
    } else {
      inner.add(take(geo.body, matColour));
      if (geo.head) inner.add(take(geo.head, texMaterial(archId)));
    }
    place(inner, spec, flip);
    scene.add(holder);
    return true;
  }

  return {
    ok: true,
    canvas,
    















    draw(pose, who) {
      renderer.clear(true, true, true);

      
      
      const trail = [];
      for (const [spec, id] of [[pose.a, who.a], [pose.b, who.b]]) {
        if (!spec || !spec.ghosts) continue;
        for (let k = 0; k < spec.ghosts.length; k += 1) trail.push({ spec: spec.ghosts[k], id, age: k });
      }
      trail.sort((p, q) => q.age - p.age);

      for (const g of trail) {
        beginPass();
        if (!addFigure(g.spec, g.id, true)) continue;
        matGhost.uniforms.uAlpha.value = g.spec.alpha === undefined ? 0.24 : g.spec.alpha;
        renderer.clearDepth();
        renderer.render(scene, camera);
      }

      beginPass();
      addFigure(pose.a, who.a, false);
      addFigure(pose.b, who.b, false);
      renderer.clearDepth();
      renderer.render(scene, camera);
    },
    dispose() {
      beginPass();
      for (const e of geoCache.values()) {
        e.body.dispose(); e.all.dispose(); if (e.head) e.head.dispose();
      }
      geoCache.clear();
      renderer.dispose();
    },
    
    cacheSize: () => geoCache.size,
  };
}
