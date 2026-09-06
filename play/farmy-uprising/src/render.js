



















import * as THREE from 'three';
import { FIELD_MM } from '../../../web-engine/rts/fixed.js';
import { CELLS_PER_SIDE } from '../../../web-engine/rts/maps/mapFormat.js';
import { TERRAIN_IDS, terrainForSector, TILE_METRES }
  from '../../../web-engine/rts/art/terrainRecipe.js';
import {
  buildTerrainTextures, buildMacroTexture, buildDetailTexture, buildSurroundTexture,
  GROUND_LIGHT, TEX_METRES,
} from './terrainTex.js';
import {
  scatterProps, columnFor, depthKey, SCATTER_KINDS,
} from '../../../web-engine/rts/art/scatter.js';
import { loadPropAtlas, propPlacement, fallbackPropAtlas } from './propSprites.js';
import { HERD } from '../../../web-engine/rts/roster.js';
import { facing8, BRADS } from '../../../web-engine/rts/fixed.js';
import { UNITS } from '../../../web-engine/rts/roster.js';
import { unitSpec, packPct } from '../../../web-engine/rts/sim/world.js';
import { loadAtlas, rowOf, rowCount, unitScale, fallbackAtlas } from './sprites.js';


const MM = 1000;
const FIELD = FIELD_MM / MM;

const GROUND_PX = 2048;
const MAX_INSTANCES = 4096;







































const CLUSTER_MAX = 5;
const CLUSTER = [
  [0, 0],
  [0.688, 0.482],
  [-0.542, 0.693],
  [-0.704, -0.493],
  [0.516, -0.737],
];













const CLUSTER_REACH = CLUSTER.map((_, k) => {
  let r = 0;
  for (let i = 0; i <= k; i += 1) r = Math.max(r, Math.hypot(CLUSTER[i][0], CLUSTER[i][1]));
  return r;
});






















const RING_TEX_RADIUS = 0.44;
const RING_FOOT = 0.29;
const RING_SQUASH = 0.667;

const PALETTE = {
  neutral: '#b9ac86',
  neutralEdge: '#cdc4a8',
  herd: '#5f8f3e',
  herdEdge: '#d8b54a',
  yield: '#7c8087',
  yieldEdge: '#e8701a',
  waterClean: '#2f9e9e',
  waterFoul: ['#2f9e9e', '#4f8f84', '#6b7f6a', '#7a6f4e'],
  keystone: '#a8925f',
  fog: 'rgba(6, 10, 14, 0.72)',
};

export async function createRenderer(canvas, match, viewSeat) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  const scene = new THREE.Scene();
  
  scene.background = new THREE.Color('#1d2419');

  
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 4000);
  const view = {
    x: FIELD / 2, y: FIELD / 2,
    
    
    
    
    span: 320,
    minSpan: 130, maxSpan: 620,
    yawSteps: 0,
  };

  function placeCamera() {
    
    
    
    
    
    
    
    
    
    
    
    
    const tilt = (48 * Math.PI) / 180;
    const yaw = (view.yawSteps * Math.PI) / 2;
    const dist = 1200;
    const off = new THREE.Vector3(
      Math.sin(yaw) * Math.sin(tilt) * dist,
      Math.cos(tilt) * dist,
      Math.cos(yaw) * Math.sin(tilt) * dist,
    );
    cam.position.set(view.x + off.x, off.y, view.y + off.z);
    cam.lookAt(view.x, 0, view.y);
    cam.updateProjectionMatrix();
  }

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    const aspect = w / Math.max(1, h);
    
    
    
    
    
    
    
    
    view.maxSpan = Math.max(view.minSpan + 20, Math.min(620, FIELD / (2 * Math.max(1, aspect))));
    if (view.span > view.maxSpan) view.span = view.maxSpan;
    cam.left = -view.span * aspect;
    cam.right = view.span * aspect;
    cam.top = view.span;
    cam.bottom = -view.span;
    cam.updateProjectionMatrix();
    placeCamera();
  }

  
  const groundCanvas = document.createElement('canvas');
  groundCanvas.width = GROUND_PX;
  groundCanvas.height = GROUND_PX;
  const gctx = groundCanvas.getContext('2d');
  const groundTex = new THREE.CanvasTexture(groundCanvas);
  groundTex.colorSpace = THREE.SRGBColorSpace;
  
  
  
  
  
  
  
  
  
  
  
  groundTex.minFilter = THREE.LinearMipmapLinearFilter;
  groundTex.magFilter = THREE.LinearFilter;
  groundTex.generateMipmaps = true;
  groundTex.anisotropy = 8;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const neededTerrain = (() => {
    const want = new Set();
    for (const sec of match.w.sectors) {
      for (const f of [null, 'herd', 'yield']) {
        for (const p of [0, 1]) {
          for (const id of terrainForSector({ kind: sec.kind, faction: f, pollution: p })) {
            want.add(id);
          }
        }
      }
    }
    return [...want];
  })();
  const terrainTex = buildTerrainTextures(THREE, neededTerrain);
  const CELLS = CELLS_PER_SIDE;
  const CELL = FIELD / CELLS;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const macroTex = buildMacroTexture(THREE);
  const detailTex = buildDetailTexture(THREE);
  const G = GROUND_LIGHT;
  const v3 = (a) => `vec3(${a[0]}, ${a[1]}, ${a[2]})`;
  const GROUND_NOISE = `
    varying vec3 vGroundPos;
    uniform sampler2D uMacro;
    uniform sampler2D uDetail;
    uniform float uField;
    vec3 fuGroundLight(vec2 w, float mottle) {
      vec3 m = texture2D(uMacro, w / uField).rgb;
      float n = m.r * ${G.macroWeights[0]} + m.g * ${G.macroWeights[1]} + m.b * ${G.macroWeights[2]};
      // 0.74 to 1.26 - a HALF STOP either side of neutral. It was half that,
      // and the texture still won: at 320 span the 50 m repeat showed as a
      // lattice across every paddock, because the periodic signal was louder
      // than the aperiodic one laid over it.
      float shade = (${G.shadeLo} + n * ${G.shadeSpan}) * (${G.mottleLo} + mottle * ${G.mottleSpan});
      return shade * mix(${v3(G.cool)}, ${v3(G.warm)}, n);
    }
  `;

  








  function groundMaterial(map, fade) {
    const mat = new THREE.MeshBasicMaterial({
      map,
      transparent: !!fade,
      depthWrite: !fade,
    });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uMacro = { value: macroTex };
      shader.uniforms.uDetail = { value: detailTex };
      shader.uniforms.uField = { value: FIELD };
      shader.vertexShader = `varying vec3 vGroundPos;\n${fade ? 'attribute float aFade;\nvarying float vFade;\n' : ''}${shader.vertexShader}`
        .replace('#include <begin_vertex>',
          `#include <begin_vertex>\n  vGroundPos = transformed;${fade ? '\n  vFade = aFade;' : ''}`);
      
      
      shader.fragmentShader = `${GROUND_NOISE}\n${fade ? 'varying float vFade;\n' : ''}${shader.fragmentShader}`
        .replace('#include <map_fragment>',
          `#ifdef USE_MAP
             vec2 fuFieldUv = vGroundPos.xz / uField;
             vec2 fuDet = texture2D(uDetail, fuFieldUv).rg;
             float fuK = smoothstep(${G.bombEdge[0]}, ${G.bombEdge[1]}, fuDet.g);
             vec4 fuA = texture2D(map, vMapUv);
             vec4 fuB = texture2D(map, vMapUv * ${G.bombScale} + vec2(${G.bombOffset[0]}, ${G.bombOffset[1]}));
             diffuseColor *= mix(fuA, fuB, fuK);
             diffuseColor.rgb *= fuGroundLight(vGroundPos.xz, fuDet.r);
           #endif`
          
          
          
          + `${fade ? '\n  diffuseColor.a *= vFade * vFade * 0.92;' : ''}`);
    };
    return mat;
  }

  
  const terrainMeshes = Object.create(null);
  for (const id of neededTerrain) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position',
      new THREE.BufferAttribute(new Float32Array(CELLS * CELLS * 6 * 3), 3));
    geo.setAttribute('uv',
      new THREE.BufferAttribute(new Float32Array(CELLS * CELLS * 6 * 2), 2));
    const mesh = new THREE.Mesh(geo, groundMaterial(terrainTex[id], false));
    mesh.frustumCulled = false;
    scene.add(mesh);

    
    
    
    
    
    
    
    
    
    
    
    
    
    const blendGeo = new THREE.BufferGeometry();
    blendGeo.setAttribute('position',
      new THREE.BufferAttribute(new Float32Array(CELLS * CELLS * 6 * 3), 3));
    blendGeo.setAttribute('uv',
      new THREE.BufferAttribute(new Float32Array(CELLS * CELLS * 6 * 2), 2));
    blendGeo.setAttribute('aFade',
      new THREE.BufferAttribute(new Float32Array(CELLS * CELLS * 6), 1));
    const blendMesh = new THREE.Mesh(blendGeo, groundMaterial(terrainTex[id], true));
    blendMesh.frustumCulled = false;
    blendMesh.renderOrder = 1;
    
    
    
    blendMesh.position.y = 0.05;
    scene.add(blendMesh);

    terrainMeshes[id] = { mesh, geo, blendMesh, blendGeo };
  }

  







  function materialOfCell(m, cx, cy) {
    const sec = m.w.sectors[m.w.map.sectorOfCell[cy * CELLS + cx]];
    const choices = terrainForSector({
      kind: sec.kind,
      faction: sec.owner === null ? null : m.factions[sec.owner],
      pollution: sec.pollution,
    });
    let sh = (sec.id * 2654435761) >>> 0;
    sh = (sh ^ (sh >>> 15)) >>> 0;
    return choices[sh % choices.length];
  }

  






















  const uvFrames = new Map();
  function uvFrame(secId) {
    let f = uvFrames.get(secId);
    if (f) return f;
    let h = (secId * 2654435761) >>> 0;
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    h = (h ^ (h >>> 13)) >>> 0;
    const a = ((h % 16) * Math.PI) / 8;
    f = {
      cos: Math.cos(a),
      sin: Math.sin(a),
      
      
      ou: (((h >>> 8) & 255) / 256),
      ov: (((h >>> 16) & 255) / 256),
    };
    uvFrames.set(secId, f);
    return f;
  }

  











  function writeQuad(geo, offset, cx, cy, frame, fades) {
    const x0 = cx * CELL;
    const x1 = x0 + CELL;
    const z0 = cy * CELL;
    const z1 = z0 + CELL;
    const uv = (x, z) => [
      (x * frame.cos + z * frame.sin) / TEX_METRES + frame.ou,
      (z * frame.cos - x * frame.sin) / TEX_METRES + frame.ov,
    ];
    const a = uv(x0, z0);
    const b = uv(x0, z1);
    const cc = uv(x1, z1);
    const d = uv(x1, z0);
    
    const c = [[x0, z0, a[0], a[1]], [x0, z1, b[0], b[1]],
      [x1, z1, cc[0], cc[1]], [x1, z0, d[0], d[1]]];
    const tri = [0, 1, 2, 0, 2, 3];
    const pos = geo.getAttribute('position').array;
    const uvs = geo.getAttribute('uv').array;
    const fadeAttr = fades ? geo.getAttribute('aFade').array : null;
    for (let k = 0; k < 6; k += 1) {
      const w = offset + k;
      const v = c[tri[k]];
      pos[w * 3] = v[0];
      pos[w * 3 + 1] = 0;
      pos[w * 3 + 2] = v[1];
      uvs[w * 2] = v[2];
      uvs[w * 2 + 1] = v[3];
      if (fadeAttr) fadeAttr[w] = fades[tri[k]];
    }
  }

  






  function fadeRamp(dx, dy) {
    
    
    if (dx === -1) return [1, 1, 0, 0];
    if (dx === 1) return [0, 0, 1, 1];
    if (dy === -1) return [1, 0, 0, 1];
    return [0, 1, 1, 0];
  }

  
  function layTiles(m) {
    const counts = Object.create(null);
    const blendCounts = Object.create(null);
    for (const id of neededTerrain) { counts[id] = 0; blendCounts[id] = 0; }

    
    
    
    const matOf = new Array(CELLS * CELLS);
    const secOf = m.w.map.sectorOfCell;
    for (let cy = 0; cy < CELLS; cy += 1) {
      for (let cx = 0; cx < CELLS; cx += 1) matOf[cy * CELLS + cx] = materialOfCell(m, cx, cy);
    }

    for (let cy = 0; cy < CELLS; cy += 1) {
      for (let cx = 0; cx < CELLS; cx += 1) {
        const here = cy * CELLS + cx;
        const id = matOf[here];
        const t = terrainMeshes[id];
        writeQuad(t.geo, counts[id], cx, cy, uvFrame(secOf[here]), null);
        counts[id] += 6;

        
        
        
        
        
        
        
        
        
        
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= CELLS || ny >= CELLS) continue;
          const n = ny * CELLS + nx;
          const other = matOf[n];
          if (other === id) continue;
          const b = terrainMeshes[other];
          writeQuad(b.blendGeo, blendCounts[other], cx, cy, uvFrame(secOf[n]), fadeRamp(dx, dy));
          blendCounts[other] += 6;
        }
      }
    }
    for (const id of neededTerrain) {
      const t = terrainMeshes[id];
      t.geo.setDrawRange(0, counts[id]);
      t.geo.getAttribute('position').needsUpdate = true;
      t.geo.getAttribute('uv').needsUpdate = true;
      t.mesh.visible = counts[id] > 0;
      t.blendGeo.setDrawRange(0, blendCounts[id]);
      t.blendGeo.getAttribute('position').needsUpdate = true;
      t.blendGeo.getAttribute('uv').needsUpdate = true;
      t.blendGeo.getAttribute('aFade').needsUpdate = true;
      t.blendMesh.visible = blendCounts[id] > 0;
    }
  }

  
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(FIELD, FIELD),
    new THREE.MeshBasicMaterial({ map: groundTex, transparent: true }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(FIELD / 2, 0.4, FIELD / 2);
  
  
  
  
  
  ground.renderOrder = 2;
  scene.add(ground);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const surroundTex = buildSurroundTexture(THREE);
  const surround = new THREE.Mesh(
    new THREE.PlaneGeometry(FIELD * 5, FIELD * 5),
    
    
    
    
    
    new THREE.MeshBasicMaterial({ map: surroundTex, color: new THREE.Color('#c3ccae') }),
  );
  surround.rotation.x = -Math.PI / 2;
  surround.position.set(FIELD / 2, -2, FIELD / 2);
  scene.add(surround);

  
  let groundKey = '';

  















  const cellEdge = (c) => Math.round((c * GROUND_PX) / CELLS_PER_SIDE);

  function paintGround(m, seat) {
    const map = m.w.map;

    
    
    
    
    gctx.clearRect(0, 0, GROUND_PX, GROUND_PX);

    
    
    
    for (let cy = 0; cy < CELLS_PER_SIDE; cy += 1) {
      const y0 = cellEdge(cy);
      const y1 = cellEdge(cy + 1);
      for (let cx = 0; cx < CELLS_PER_SIDE; cx += 1) {
        const sIdx = map.sectorOfCell[cy * CELLS_PER_SIDE + cx];
        const sec = m.w.sectors[sIdx];
        if (sec.owner === null) continue;
        const x0 = cellEdge(cx);
        gctx.fillStyle = m.factions[sec.owner] === HERD
          ? 'rgba(96,168,74,0.22)' : 'rgba(196,148,58,0.22)';
        gctx.fillRect(x0, y0, cellEdge(cx + 1) - x0, y1 - y0);
      }
    }

    
    
    for (let cy = 0; cy < CELLS_PER_SIDE; cy += 1) {
      for (let cx = 0; cx < CELLS_PER_SIDE; cx += 1) {
        const sec = m.w.sectors[map.sectorOfCell[cy * CELLS_PER_SIDE + cx]];
        if (sec.owner === null) continue;
        
        
        
        
        
        
        
        const isHerd = m.factions[sec.owner] === HERD;
        if (!isHerd) continue;
        
        
        const x0 = cellEdge(cx);
        const y0 = cellEdge(cy);
        const w = cellEdge(cx + 1) - x0;
        gctx.fillStyle = 'rgba(255,255,255,0.055)';
        gctx.fillRect(x0 + w * 0.34, y0 + w * 0.30, w * 0.13, w * 0.13);
      }
    }

    
    
    
    
    
    
    
    for (let cy = 0; cy < CELLS_PER_SIDE; cy += 1) {
      const y0 = cellEdge(cy);
      const y1 = cellEdge(cy + 1);
      for (let cx = 0; cx < CELLS_PER_SIDE; cx += 1) {
        const here = map.sectorOfCell[cy * CELLS_PER_SIDE + cx];
        const right = cx + 1 < CELLS_PER_SIDE ? map.sectorOfCell[cy * CELLS_PER_SIDE + cx + 1] : here;
        const down = cy + 1 < CELLS_PER_SIDE ? map.sectorOfCell[(cy + 1) * CELLS_PER_SIDE + cx] : here;
        const sec = m.w.sectors[here];
        const x0 = cellEdge(cx);
        const x1 = cellEdge(cx + 1);
        
        
        
        
        
        
        
        
        
        
        
        
        
        gctx.fillStyle = 'rgba(22,26,18,0.55)';
        if (right !== here) gctx.fillRect(x1 - 3, y0, 6, y1 - y0);
        if (down !== here) gctx.fillRect(x0, y1 - 3, x1 - x0, 6);
        gctx.globalAlpha = 0.62;
        gctx.fillStyle = edgeFor(m, sec);
        if (right !== here) gctx.fillRect(x1 - 1, y0, 3, y1 - y0);
        if (down !== here) gctx.fillRect(x0, y1 - 1, x1 - x0, 3);
        gctx.globalAlpha = 1;
      }
    }

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const vis = m.presence.visible;
    const sc = m.w.sectors.length;
    const fogCanvas = document.createElement('canvas');
    fogCanvas.width = GROUND_PX;
    fogCanvas.height = GROUND_PX;
    const fctx = fogCanvas.getContext('2d');
    fctx.fillStyle = 'rgba(11,16,22,0.72)';
    for (let cy = 0; cy < CELLS_PER_SIDE; cy += 1) {
      const y0 = cellEdge(cy);
      const y1 = cellEdge(cy + 1);
      for (let cx = 0; cx < CELLS_PER_SIDE; cx += 1) {
        const sIdx = map.sectorOfCell[cy * CELLS_PER_SIDE + cx];
        if (vis[seat * sc + sIdx]) continue;
        const x0 = cellEdge(cx);
        fctx.fillRect(x0, y0, cellEdge(cx + 1) - x0, y1 - y0);
      }
    }
    gctx.filter = 'blur(24px)';
    gctx.drawImage(fogCanvas, 0, 0);
    gctx.filter = 'none';
    groundTex.needsUpdate = true;
  }

  function fillFor(m, sec) {
    if (sec.kind === 'water') {
      return PALETTE.waterFoul[Math.min(3, sec.pollution)];
    }
    if (sec.owner === null) return sec.kind === 'keystone' ? PALETTE.keystone : PALETTE.neutral;
    return m.factions[sec.owner] === HERD ? PALETTE.herd : PALETTE.yield;
  }

  function edgeFor(m, sec) {
    if (sec.owner === null) return PALETTE.neutralEdge;
    return m.factions[sec.owner] === HERD ? PALETTE.herdEdge : PALETTE.yieldEdge;
  }

  
  
  
  
  
  
  
  
  
  
  let propSheet = null;
  try {
    propSheet = await loadPropAtlas();
  } catch (e) {
    const ids = [...SCATTER_KINDS];
    propSheet = {
      image: fallbackPropAtlas(ids),
      manifest: {
        tile: 64,
        facings: 4,
        rows: Object.fromEntries(ids.map((k, i) => [k,
          { row: i, worldSize: 6, drawSize: 16, footY: 0.3, role: 'point' }])),
      },
    };
    
    console.warn(`Farmy Uprising: prop atlas missing (${e.message}) - placeholders`);
  }
  const propManifest = propSheet.manifest;
  const PROP_ROWS = Math.max(1, Object.keys(propManifest.rows).length);
  const PROP_COLS = propManifest.facings || 4;

  const MAX_PROP_INSTANCES = 3000;
  const propTex = new THREE.Texture(propSheet.image);
  propTex.needsUpdate = true;
  propTex.colorSpace = THREE.SRGBColorSpace;
  propTex.minFilter = THREE.LinearMipmapLinearFilter;
  propTex.magFilter = THREE.LinearFilter;
  propTex.generateMipmaps = true;
  propTex.anisotropy = 8;

  const propGeo = new THREE.PlaneGeometry(1, 1);
  const propTileAttr = new THREE.InstancedBufferAttribute(
    new Float32Array(MAX_PROP_INSTANCES * 2), 2,
  );
  propGeo.setAttribute('aTile', propTileAttr);
  const propMat = new THREE.MeshBasicMaterial({
    map: propTex, transparent: true, alphaTest: 0.28, depthWrite: false,
  });
  propMat.onBeforeCompile = (shader) => {
    shader.vertexShader = `attribute vec2 aTile;\nvarying vec2 vTile;\n${shader.vertexShader}`
      .replace('#include <uv_vertex>', '#include <uv_vertex>\n  vTile = aTile;');
    shader.fragmentShader = `varying vec2 vTile;\n${shader.fragmentShader}`
      .replace('#include <map_fragment>',
        `#ifdef USE_MAP
           vec2 tiledUv = vec2(
             (vMapUv.x + vTile.x) / ${PROP_COLS}.0,
             1.0 - ((1.0 - vMapUv.y) + vTile.y) / ${PROP_ROWS}.0
           );
           diffuseColor *= texture2D(map, tiledUv);
         #endif`);
  };
  const propMesh = new THREE.InstancedMesh(propGeo, propMat, MAX_PROP_INSTANCES);
  propMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  propMesh.count = 0;
  propMesh.frustumCulled = false;
  
  propMesh.renderOrder = 3.5;
  scene.add(propMesh);

  
  
  
  
  let scatter = scatterProps(match.w.map, { facings: PROP_COLS });
  const propDummy = new THREE.Object3D();
  const propColour = new THREE.Color();

  






















  function layProps(m, seat, yawSteps) {
    const yaw = (yawSteps * Math.PI) / 2;
    const list = scatter.props.slice()
      .sort((a, b) => depthKey(a, yawSteps) - depthKey(b, yawSteps));
    const vis = m.presence.visible;
    const sc = m.w.sectors.length;
    let n = 0;
    for (const p of list) {
      if (n >= MAX_PROP_INSTANCES) break;
      const row = propManifest.rows[p.kind];
      if (!row) continue;
      const size = row.worldSize * (p.scale / 1000);
      propDummy.position.set(p.x / MM, size * (0.5 - (row.footY || 0)), p.y / MM);
      propDummy.rotation.set(0, yaw, 0);
      propDummy.scale.set(size, size, size);
      propDummy.updateMatrix();
      propMesh.setMatrixAt(n, propDummy.matrix);
      propTileAttr.setXY(n, columnFor(p, yawSteps, PROP_COLS), row.row);
      
      
      
      
      
      
      
      const lit = p.sector < 0 ? 0.82 : (vis[seat * sc + p.sector] ? 1 : 0.30);
      propColour.setRGB(lit, lit, lit);
      propMesh.setColorAt(n, propColour);
      n += 1;
    }
    propMesh.count = n;
    propMesh.instanceMatrix.needsUpdate = true;
    propTileAttr.needsUpdate = true;
    if (propMesh.instanceColor) propMesh.instanceColor.needsUpdate = true;
  }

  







  let propYaw = -1;

  

  
  
  
  
  let atlasImage;
  let manifest;
  try {
    const loaded = await loadAtlas();
    atlasImage = loaded.image;
    manifest = loaded.manifest;
  } catch (e) {
    const ids = Object.keys(UNITS).sort();
    atlasImage = fallbackAtlas(ids);
    manifest = {
      tile: 64,
      facings: 8,
      rows: Object.fromEntries(ids.map((k, i) => [k, { row: i, worldSize: 2 }])),
    };
    
    console.warn(`Farmy Uprising: sprite atlas missing (${e.message}) - placeholders`);
  }
  const ATLAS_COLS = manifest.facings || 8;
  const ATLAS_ROWS = Math.max(1, rowCount(manifest));

  const atlas = new THREE.Texture(atlasImage);
  atlas.needsUpdate = true;
  atlas.colorSpace = THREE.SRGBColorSpace;
  atlas.minFilter = THREE.LinearMipmapLinearFilter;
  atlas.magFilter = THREE.LinearFilter;

  const unitGeo = new THREE.PlaneGeometry(1, 1);
  
  const tileAttr = new THREE.InstancedBufferAttribute(new Float32Array(MAX_INSTANCES * 2), 2);
  unitGeo.setAttribute('aTile', tileAttr);

  const unitMat = new THREE.MeshBasicMaterial({
    map: atlas, transparent: true, alphaTest: 0.35, depthWrite: false,
  });
  
  
  
  unitMat.onBeforeCompile = (shader) => {
    shader.vertexShader = `attribute vec2 aTile;\nvarying vec2 vTile;\n${shader.vertexShader}`
      .replace('#include <uv_vertex>', '#include <uv_vertex>\n  vTile = aTile;');
    
    
    
    shader.fragmentShader = `varying vec2 vTile;\n${shader.fragmentShader}`
      .replace(
        '#include <map_fragment>',
        `#ifdef USE_MAP
           vec2 tiledUv = vec2(
             (vMapUv.x + vTile.x) / ${ATLAS_COLS}.0,
             1.0 - ((1.0 - vMapUv.y) + vTile.y) / ${ATLAS_ROWS}.0
           );
           vec4 sampledDiffuseColor = texture2D( map, tiledUv );
           diffuseColor *= sampledDiffuseColor;
         #endif`,
      );
  };

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const shadowTex = (() => {
    const c = document.createElement('canvas');
    const S = 96;
    c.width = S; c.height = S;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(S / 2, S / 2, 2, S / 2, S / 2, S / 2 - 1);
    g.addColorStop(0, 'rgba(78,78,78,0.52)');
    g.addColorStop(0.55, 'rgba(78,78,78,0.26)');
    g.addColorStop(0.78, 'rgba(78,78,78,0.06)');
    g.addColorStop(1, 'rgba(78,78,78,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, S, S);
    
    
    
    
    
    x.fillStyle = 'rgba(255,255,255,0.95)';
    x.beginPath();
    x.ellipse(S / 2, S * 0.845, S * 0.105, S * 0.072, 0, 0, Math.PI * 2);
    x.fill();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const shadows = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
    MAX_INSTANCES,
  );
  shadows.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  shadows.count = 0;
  shadows.frustumCulled = false;
  shadows.renderOrder = 3;
  scene.add(shadows);

  
  
  
  
  
  
  const ringTex = (() => {
    const c = document.createElement('canvas');
    const S = 128;
    c.width = S; c.height = S;
    const x = c.getContext('2d');
    
    
    
    
    x.strokeStyle = 'rgba(255,255,255,0.90)';
    x.lineWidth = S * 0.042;
    x.beginPath();
    x.arc(S / 2, S / 2, S * 0.44, 0, Math.PI * 2);
    x.stroke();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const rings = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, depthWrite: false }),
    512,
  );
  rings.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  rings.count = 0;
  rings.frustumCulled = false;
  rings.renderOrder = 3;
  scene.add(rings);

  
  let selected = new Set();

  
  
  
  
  
  
  
  
  
  const barMat = () => new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false });
  const hpBack = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), barMat(), MAX_INSTANCES);
  const hpFill = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), barMat(), MAX_INSTANCES);
  for (const m of [hpBack, hpFill]) {
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.count = 0;
    m.frustumCulled = false;
    m.renderOrder = 5;
    scene.add(m);
  }

  
  
  
  
  
  
  
  
  
  
  const COUNT_TILES = 16;
  const countTex = (() => {
    const c = document.createElement('canvas');
    const S = 64;
    c.width = S * COUNT_TILES; c.height = S;
    const x = c.getContext('2d');
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    for (let i = 0; i < COUNT_TILES; i += 1) {
      const cx = i * S + S / 2;
      x.fillStyle = 'rgba(10,14,10,0.74)';
      x.beginPath();
      x.roundRect(i * S + S * 0.10, S * 0.22, S * 0.80, S * 0.56, S * 0.16);
      x.fill();
      x.font = `bold ${Math.round(S * 0.46)}px ui-monospace, monospace`;
      x.fillStyle = '#ffffff';
      x.fillText(String(i + 1), cx, S * 0.52);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const countGeo = new THREE.PlaneGeometry(1, 1);
  const countAttr = new THREE.InstancedBufferAttribute(new Float32Array(MAX_INSTANCES), 1);
  countGeo.setAttribute('aCol', countAttr);
  const countMat = new THREE.MeshBasicMaterial({
    map: countTex, transparent: true, depthWrite: false,
  });
  countMat.onBeforeCompile = (shader) => {
    shader.vertexShader = `attribute float aCol;\nvarying float vCol;\n${shader.vertexShader}`
      .replace('#include <uv_vertex>', '#include <uv_vertex>\n  vCol = aCol;');
    shader.fragmentShader = `varying float vCol;\n${shader.fragmentShader}`
      .replace('#include <map_fragment>',
        `#ifdef USE_MAP
           diffuseColor *= texture2D(map,
             vec2((vMapUv.x + vCol) / ${COUNT_TILES}.0, vMapUv.y));
         #endif`);
  };
  const counts = new THREE.InstancedMesh(countGeo, countMat, MAX_INSTANCES);
  counts.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  counts.count = 0;
  counts.frustumCulled = false;
  counts.renderOrder = 5;
  scene.add(counts);
  const units = new THREE.InstancedMesh(unitGeo, unitMat, MAX_INSTANCES);
  units.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  units.count = 0;
  units.frustumCulled = false;
  units.renderOrder = 4;
  scene.add(units);

  
  const bGeo = new THREE.PlaneGeometry(1, 1);
  const bMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.95 });
  const buildings = new THREE.InstancedMesh(bGeo, bMat, 256);
  buildings.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  buildings.count = 0;
  buildings.frustumCulled = false;
  buildings.renderOrder = 3;
  scene.add(buildings);

  const dummy = new THREE.Object3D();
  const colour = new THREE.Color();

  
































  function billboardRotation() {
    return (view.yawSteps * Math.PI) / 2;
  }

  














  function teamTint(m, owner, seat) {
    const herd = m.factions[owner] === HERD;
    const mine = owner === seat;
    if (herd) return mine ? 0xf2ffe8 : 0xd2e8c0;
    return mine ? 0xfff2dc : 0xefd9b4;
  }

  






  function teamMark(m, owner, seat) {
    const herd = m.factions[owner] === HERD;
    const mine = owner === seat;
    if (herd) return mine ? 0x9dff62 : 0x4f9c2e;
    return mine ? 0xffb03a : 0xc06318;
  }

  






















  function setSelection(list) {
    selected = list instanceof Set ? list : new Set(list || []);
  }

  function drawUnits(m, seat) {
    const w = m.w;
    const vis = m.presence.visible;
    const sc = w.sectors.length;
    const yaw = billboardRotation();
    
    
    const barX = Math.cos(yaw);
    const barZ = -Math.sin(yaw);
    let n = 0;
    let rn = 0;
    let bn = 0;
    let cn = 0;
    for (let i = 0; i < w.u.count && n < MAX_INSTANCES; i += 1) {
      if (!w.u.alive[i] || w.u.owner[i] < 0) continue;
      
      
      
      
      
      const sec = w.u.sector[i];
      if (sec >= 0 && !vis[seat * sc + sec]) continue;

      const spec = unitSpec(w, i);
      const s = unitScale(spec.id, manifest);
      
      
      
      
      
      const face = facing8(w.u.facing[i] + Math.round((view.yawSteps * BRADS) / 4));
      const row = rowOf(manifest, spec.id);
      const mark = teamMark(m, w.u.owner[i], seat);
      const isSel = selected.has(i);
      const ux = w.u.x[i] / MM;
      const uz = w.u.y[i] / MM;

      
      
      
      
      
      
      
      
      
      
      
      
      const drawn = Math.min(w.u.members[i], CLUSTER_MAX);
      const reach = CLUSTER_REACH[drawn - 1];
      for (let k = 0; k < drawn && n < MAX_INSTANCES; k += 1) {
        const off = CLUSTER[k];
        const bx = ux + off[0] * s;
        const bz = uz + off[1] * s;
        dummy.position.set(bx, s * 0.5, bz);
        dummy.rotation.set(0, yaw, 0);
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        units.setMatrixAt(n, dummy.matrix);

        
        
        dummy.position.set(bx, 0.6, bz + s * 0.10);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.scale.set(s * 0.82, s * 0.52, 1);
        dummy.updateMatrix();
        shadows.setMatrixAt(n, dummy.matrix);
        colour.setHex(mark);
        shadows.setColorAt(n, colour);

        tileAttr.setXY(n, face, row);
        
        
        
        
        
        
        
        
        
        
        
        colour.setHex(teamTint(m, w.u.owner[i], seat));
        units.setColorAt(n, colour);
        n += 1;
      }

      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      if (isSel && rn < 512) {
        const ringX = (reach + RING_FOOT) / RING_TEX_RADIUS;
        const ringZ = (reach + RING_FOOT * RING_SQUASH) / RING_TEX_RADIUS;
        dummy.position.set(ux, 0.75, uz + s * 0.10);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.scale.set(s * ringX, s * ringZ, 1);
        dummy.updateMatrix();
        rings.setMatrixAt(rn, dummy.matrix);
        colour.setHex(mark);
        rings.setColorAt(rn, colour);
        rn += 1;
      }

      
      
      
      
      const pct = packPct(w, i);
      if (pct < 100 && bn < MAX_INSTANCES) {
        const wBar = s * 0.54;
        const hBar = Math.max(2.2, s * 0.095);
        
        
        
        
        
        
        
        
        
        
        
        
        const y = s * (0.92 + 0.9 * reach);
        dummy.rotation.set(0, yaw, 0);
        dummy.position.set(ux, y, uz);
        dummy.scale.set(wBar, hBar, 1);
        dummy.updateMatrix();
        hpBack.setMatrixAt(bn, dummy.matrix);
        colour.setHex(0x14180f);
        hpBack.setColorAt(bn, colour);

        
        
        
        const frac = Math.max(0.02, pct / 100);
        const shift = -(1 - frac) * wBar * 0.5;
        dummy.position.set(ux + barX * shift, y, uz + barZ * shift);
        dummy.scale.set(wBar * frac, hBar * 0.62, 1);
        dummy.updateMatrix();
        hpFill.setMatrixAt(bn, dummy.matrix);
        
        
        
        colour.setHex(pct > 60 ? 0x7fdc4a : (pct > 30 ? 0xe8c23a : 0xe0503a));
        hpFill.setColorAt(bn, colour);
        bn += 1;
      }

      
      
      
      
      
      if (w.u.members[i] > 1 && cn < MAX_INSTANCES) {
        const size = Math.max(12, s * 0.30);
        dummy.rotation.set(0, yaw, 0);
        const shift = s * 0.38;
        dummy.position.set(ux + barX * shift, s * (0.92 + 0.9 * reach), uz + barZ * shift);
        dummy.scale.set(size, size, 1);
        dummy.updateMatrix();
        counts.setMatrixAt(cn, dummy.matrix);
        countAttr.setX(cn, Math.min(15, w.u.members[i] - 1));
        cn += 1;
      }
    }
    units.count = n;
    shadows.count = n;
    rings.count = rn;
    hpBack.count = bn;
    hpFill.count = bn;
    counts.count = cn;
    shadows.instanceMatrix.needsUpdate = true;
    units.instanceMatrix.needsUpdate = true;
    rings.instanceMatrix.needsUpdate = true;
    hpBack.instanceMatrix.needsUpdate = true;
    hpFill.instanceMatrix.needsUpdate = true;
    counts.instanceMatrix.needsUpdate = true;
    tileAttr.needsUpdate = true;
    countAttr.needsUpdate = true;
    if (units.instanceColor) units.instanceColor.needsUpdate = true;
    if (shadows.instanceColor) shadows.instanceColor.needsUpdate = true;
    if (rings.instanceColor) rings.instanceColor.needsUpdate = true;
    if (hpBack.instanceColor) hpBack.instanceColor.needsUpdate = true;
    if (hpFill.instanceColor) hpFill.instanceColor.needsUpdate = true;
  }

  function drawBuildings(m, seat) {
    const w = m.w;
    const vis = m.presence.visible;
    const sc = w.sectors.length;
    let n = 0;
    for (let i = 0; i < w.b.count && n < 256; i += 1) {
      if (!w.b.alive[i] || w.b.owner[i] < 0) continue;
      const sec = w.b.sector[i];
      if (sec >= 0 && !vis[seat * sc + sec]) continue;
      const size = w.b.building[i] > 0 ? 14 : 22;
      dummy.position.set(w.b.x[i] / MM, 0.6, w.b.y[i] / MM);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.set(size, size, size);
      dummy.updateMatrix();
      buildings.setMatrixAt(n, dummy.matrix);
      const isHerd = m.factions[w.b.owner[i]] === HERD;
      
      
      colour.set(w.b.building[i] > 0 ? '#d8d2bd' : (isHerd ? '#3f6b28' : '#4d5560'));
      buildings.setColorAt(n, colour);
      n += 1;
    }
    buildings.count = n;
    buildings.instanceMatrix.needsUpdate = true;
    if (buildings.instanceColor) buildings.instanceColor.needsUpdate = true;
  }

  
  
  
  
  const marker = new THREE.Mesh(
    new THREE.RingGeometry(0.62, 0.82, 28),
    new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, side: THREE.DoubleSide }),
  );
  marker.rotation.x = -Math.PI / 2;
  marker.visible = false;
  marker.renderOrder = 5;
  scene.add(marker);
  let markerUntil = 0;

  function markOrder(xMm, yMm) {
    marker.position.set(xMm / MM, 1.5, yMm / MM);
    marker.visible = true;
    markerUntil = performance.now() + 2000;
  }

  
  function frame(m, seat, now = 0) {
    
    
    let key = '';
    for (let i = 0; i < m.w.sectors.length; i += 1) {
      const s = m.w.sectors[i];
      key += `${s.owner === null ? '-' : s.owner}${s.pollution}`;
    }
    const vis = m.presence.visible;
    const sc = m.w.sectors.length;
    for (let i = 0; i < sc; i += 1) key += vis[seat * sc + i] ? '1' : '0';
    if (key !== groundKey) {
      groundKey = key;
      
      
      
      layTiles(m);
      paintGround(m, seat);
      
      layProps(m, seat, view.yawSteps);
      propYaw = view.yawSteps;
    }

    
    
    if (propYaw !== view.yawSteps) {
      layProps(m, seat, view.yawSteps);
      propYaw = view.yawSteps;
    }

    if (marker.visible) {
      const left = markerUntil - (now || performance.now());
      if (left <= 0) marker.visible = false;
      else {
        
        
        const t = 1 - left / 2000;
        const size = 40 + t * 34;
        marker.scale.set(size, size, size);
        marker.material.opacity = 0.85 * (1 - t);
      }
    }

    drawBuildings(m, seat);
    drawUnits(m, seat);
    renderer.render(scene, cam);
  }

  
  const api = {
    frame,
    resize,
    view,
    panBy(dxPx, dyPx) {
      const h = renderer.domElement.clientHeight || 1;
      const scale = (view.span * 2) / h;
      const yaw = (view.yawSteps * Math.PI) / 2;
      const dx = dxPx * scale;
      const dy = dyPx * scale;
      view.x -= dx * Math.cos(yaw) + dy * Math.sin(yaw);
      view.y -= dy * Math.cos(yaw) - dx * Math.sin(yaw);
      clampView();
      placeCamera();
    },
    zoomBy(factor) {
      view.span = Math.max(view.minSpan, Math.min(view.maxSpan, view.span * factor));
      resize();
    },
    rotate(dir) {
      view.yawSteps = (view.yawSteps + dir + 4) % 4;
      
      
      propYaw = -1;
      placeCamera();
    },
    centreOn(xMm, yMm) {
      view.x = xMm / MM;
      view.y = yMm / MM;
      clampView();
      placeCamera();
    },
    
    pick(clientX, clientY) {
      const rect = renderer.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      );
      const ray = new THREE.Raycaster();
      ray.setFromCamera(ndc, cam);
      const hit = ray.intersectObject(ground, false);
      if (hit.length === 0) return null;
      return { x: Math.round(hit[0].point.x * MM), y: Math.round(hit[0].point.z * MM) };
    },
    markOrder,
    setSelection,
    








    reset(m, seat) {
      groundKey = '';
      
      
      
      
      scatter = scatterProps(m.w.map, { facings: PROP_COLS });
      propYaw = -1;
      marker.visible = false;
      units.count = 0;
      buildings.count = 0;
      view.span = 320;
      view.yawSteps = 0;
      const sp = m.w.map.spawns.find((s) => s.seat === seat);
      if (sp) { view.x = sp.x / MM; view.y = sp.y / MM; }
      clampView();
      resize();
    },
    dispose() { renderer.dispose(); },

    





















    
















    propPixelsDrawn() {
      const gl = renderer.getContext();
      const w = renderer.domElement.width;
      const h = renderer.domElement.height;
      const withProps = new Uint8Array(w * h * 4);
      const without = new Uint8Array(w * h * 4);
      
      
      renderer.render(scene, cam);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, withProps);
      const was = propMesh.visible;
      propMesh.visible = false;
      renderer.render(scene, cam);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, without);
      propMesh.visible = was;
      renderer.render(scene, cam);
      let n = 0;
      for (let i = 0; i < withProps.length; i += 4) {
        if (withProps[i] !== without[i]
          || withProps[i + 1] !== without[i + 1]
          || withProps[i + 2] !== without[i + 2]) n += 1;
      }
      return n;
    },

    

    propsPlaced() { return scatter.props.length; },

    unitPixelsDrawn() {
      const gl = renderer.getContext();
      const w = renderer.domElement.width;
      const h = renderer.domElement.height;
      const withUnits = new Uint8Array(w * h * 4);
      const without = new Uint8Array(w * h * 4);
      
      
      
      renderer.render(scene, cam);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, withUnits);
      const was = units.visible;
      units.visible = false;
      renderer.render(scene, cam);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, without);
      units.visible = was;
      renderer.render(scene, cam);
      let n = 0;
      for (let i = 0; i < withUnits.length; i += 4) {
        if (withUnits[i] !== without[i]
          || withUnits[i + 1] !== without[i + 1]
          || withUnits[i + 2] !== without[i + 2]) n += 1;
      }
      return n;
    },
  };

  function clampView() {
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const inset = Math.min(view.span * 0.78, FIELD / 2);
    view.x = Math.max(inset, Math.min(FIELD - inset, view.x));
    view.y = Math.max(inset, Math.min(FIELD - inset, view.y));
  }

  resize();
  const spawn = match.w.map.spawns.find((s) => s.seat === viewSeat);
  if (spawn) api.centreOn(spawn.x, spawn.y);
  return api;
}
