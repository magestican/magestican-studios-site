








import * as THREE from 'three';

import { hazardMarkers, inSpan, surfaceLevelOf, chasmDepthAt } from 'arbelo/trackHazards';
import { lungePhase } from 'arbelo/trackGlides';
import { lavaRise } from 'arbelo/trackTerrain';
import { sampleAt, nearestOnPath } from 'arbelo/trackPath';
import { surface, NOISE_GLSL } from './materials.js';
import { PALETTE } from '../palette.js';
import { SHOULDER, groundMeshHeightAt } from './trackMesh.js';












const WATER_REACH = 90;
















export function buildWaterMaterial(theme = 'summer') {
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const deep = theme === 'snow' ? 0x0c2740 : theme === 'mud' ? 0x1d3a38 : 0x1b4b6b;
  const shallow = theme === 'snow' ? 0x2d6d97 : theme === 'mud' ? 0x4a7d6f : 0x59a8c4;
  const uniforms = {
    uDeep: { value: new THREE.Color(deep) },
    uShallow: { value: new THREE.Color(shallow) },
    uFoam: { value: new THREE.Color(theme === 'mud' ? 0xcfd3b6 : 0xeaf6ff) },
    uTime: { value: 0 },
    uSun: { value: new THREE.Vector3(-0.6, 0.5, 0.42).normalize() },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    
    
    
    depthWrite: false,
    vertexShader: `
      varying vec2 vWorld;
      varying float vEdge;      // 0 at the bank, 1 out in the middle
      attribute float edge;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xz;
        vEdge = edge;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform vec3 uDeep, uShallow, uFoam, uSun;
      uniform float uTime;
      varying vec2 vWorld;
      varying float vEdge;
      ${NOISE_GLSL}
      void main() {
        // TWO RIPPLE TRAINS AT AN ANGLE. One alone is corduroy; two at a right
        // angle is a grid; two at an odd angle and different speeds is water.
        // NOISE, NOT SINES. Two sine trains crossing is a lattice - the
        // comment three lines up used to claim they made water and they made
        // a polka-dot screen, plainly visible from above the lake. Any pair of
        // pure periodic functions beats into a regular pattern; that is what
        // periodic means. Two octaves of value noise drifting in different
        // directions have no period to beat with, so they read as a surface.
        vec2 w = vWorld;
        float n1 = vnoise(w * 0.9 + vec2(uTime * 0.55, uTime * 0.22));
        float n2 = vnoise(w * 2.3 - vec2(uTime * 0.31, uTime * 0.74));
        float swell = vnoise(w * 0.16 + vec2(uTime * 0.07, 0.0));
        float ripple = (n1 - 0.5) * 1.25 + (n2 - 0.5) * 0.75 + (swell - 0.5) * 0.5;

        vec3 col = mix(uShallow, uDeep, smoothstep(0.0, 0.55, vEdge));
        col += ripple * 0.045;

        // The glint. Narrow, so it is a highlight rather than a wash, and
        // riding on the ripples so it breaks up the way a real one does.
        // Narrower and quieter than it was, for the same reason: a broad
        // highlight on a big swell is a blob, a narrow one on a small ripple
        // is a sparkle.
        float glint = pow(max(0.0, ripple * 0.5 + 0.5), 26.0);
        col += uFoam * glint * 0.30;

        // FOAM AT THE BANK. The single strongest cue that a body of water has
        // an edge rather than just stopping - and the edge is exactly where a
        // player needs to know precisely where the water begins.
        float foam = 1.0 - smoothstep(0.0, 0.16, vEdge);
        col = mix(col, uFoam, foam * (0.55 + 0.25 * sin(uTime * 3.0 + vWorld.x * 0.6)));

        // Fading in from the bank stops the mesh edge itself being a visible
        // hard line where it meets the carved ground.
        gl_FragColor = vec4(col, mix(0.72, 0.95, smoothstep(0.0, 0.10, vEdge)));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  material.userData.uniforms = uniforms;
  return material;
}








export function buildWater(path, track) {
  const group = new THREE.Group();
  group.name = 'water';
  const zones = (track.hazards ?? []).filter((z) => z.kind === 'water');
  if (!zones.length) return group;

  const material = buildWaterMaterial(track.theme);
  for (const zone of zones) {
    if (zone.creatures) group.add(buildSharks(path, zone));
    
    
    
    
    
    
    
    
    
    
    
    const OVERHANG = 0.008;
    const span = (zone.to >= zone.from ? zone.to - zone.from : (1 - zone.from) + zone.to)
      + OVERHANG * 2;
    
    
    const steps = Math.max(8, Math.round((span * path.length) / 4));
    const positions = [];
    const edges = [];
    const indices = [];
    const sides = !zone.side || zone.side === 'both' ? [1, -1]
      : [zone.side === 'left' ? 1 : -1];

    for (const side of sides) {
      const base = positions.length / 3;
      for (let i = 0; i <= steps; i += 1) {
        const frac = ((zone.from - OVERHANG) + (span * i) / steps + 1) % 1;
        const p = sampleAt(path, frac * path.length);
        const half = p.width / 2;
        
        
        
        const inner = (half * (zone.beyond ?? 1.18)) + SHOULDER * 0.25;
        const outer = inner + carvedReach(path, zone, p, side, inner);
        
        const nx = p.tz * side;
        const nz = -p.tx * side;
        
        
        
        const y = (p.y ?? 0) - surfaceLevelOf(zone);
        positions.push(p.x + nx * inner, y, p.z + nz * inner);
        edges.push(0);
        positions.push(p.x + nx * outer, y, p.z + nz * outer);
        edges.push(1);
      }
      for (let i = 0; i < steps; i += 1) {
        const a = base + i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('edge', new THREE.Float32BufferAttribute(edges, 1));
    geo.setIndex(indices);
    const mesh = new THREE.Mesh(geo, material);
    
    
    
    material.side = THREE.DoubleSide;
    mesh.name = `water-${zone.id}`;
    group.add(mesh);
  }
  group.userData.material = material;
  return group;
}


















function carvedReach(path, zone, p, side, inner) {
  const nx = p.tz * side;
  const nz = -p.tx * side;
  let last = 12;
  for (let d = 6; d <= WATER_REACH; d += 6) {
    const x = p.x + nx * (inner + d);
    const z = p.z + nz * (inner + d);
    const near = nearestOnPath(path, x, z, null);
    const depth = chasmDepthAt(path.hazards, {
      frac: near.s / path.length, lateral: near.lateral, width: near.width,
    });
    if (depth == null) break;
    last = d;
  }
  return last;
}












export function updateWater(water, elapsed) {
  const u = water?.userData?.material?.userData?.uniforms;
  if (u) u.uTime.value = elapsed;
  for (const child of water?.children ?? []) updateSharks(child, elapsed);
}













function buildBale() {
  const g = new THREE.Group();
  const bale = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 0.85, 1.5, 10),
    surface({ color: 0x6b5a34, roughness: 0.95, flatShading: true }),
  );
  bale.rotation.z = Math.PI / 2;
  bale.position.y = 0.85;
  bale.castShadow = true;
  g.add(bale);

  const flames = [];
  for (const [r, h, colour, phase] of [[0.62, 2.6, 0xf5701a, 0], [0.34, 3.5, 0xffd257, 0.9]]) {
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(r, h, 7, 1, true),
      new THREE.MeshBasicMaterial({
        color: colour, transparent: true, opacity: 0.88,
        depthWrite: false, side: THREE.DoubleSide,
      }),
    );
    flame.position.y = 1.5 + h * 0.42;
    flame.userData.phase = phase;
    flame.userData.baseY = flame.position.y;
    flames.push(flame);
    g.add(flame);
  }
  g.userData.flames = flames;
  return g;
}
















function buildFireRibbon(path, zone, theme) {
  const span = zone.from <= zone.to ? zone.to - zone.from : (1 - zone.from) + zone.to;
  const steps = Math.max(12, Math.round((span * path.length) / 3));
  const sides = !zone.side || zone.side === 'both' ? [1, -1] : [zone.side === 'left' ? 1 : -1];

  const positions = [];
  const ups = [];
  const alongs = [];
  const indices = [];
  for (const side of sides) {
    const base = positions.length / 3;
    for (let i = 0; i <= steps; i += 1) {
      const frac = (zone.from + (span * i) / steps) % 1;
      const p = sampleAt(path, frac * path.length);
      const off = (p.width / 2) * ((zone.beyond ?? 1.2) + 0.16) * side;
      const x = p.x + p.tz * off;
      const z = p.z - p.tx * off;
      const y = p.y ?? 0;
      
      
      
      positions.push(x, y, z); ups.push(0); alongs.push(i);
      positions.push(x, y + 2.6, z); ups.push(1); alongs.push(i);
    }
    for (let i = 0; i < steps; i += 1) {
      const a = base + i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('up', new THREE.Float32BufferAttribute(ups, 1));
  geo.setAttribute('along', new THREE.Float32BufferAttribute(alongs, 1));
  geo.setIndex(indices);

  const uniforms = {
    uTime: { value: 0 },
    uHot: { value: new THREE.Color(0xffd257) },
    uMid: { value: new THREE.Color(0xf5701a) },
    uCool: { value: new THREE.Color(0xa8260c) },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    
    
    
    
    
    
    
    side: THREE.DoubleSide,
    vertexShader: `
      attribute float up;
      attribute float along;
      varying float vUp;
      varying float vAlong;
      varying vec3 vWorld;
      void main() {
        vUp = up;
        vAlong = along;
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uHot, uMid, uCool;
      varying float vUp;
      varying float vAlong;
      varying vec3 vWorld;
      void main() {
        // TONGUES. Three sine trains at different speeds and wavelengths along
        // the ribbon, all rising - one alone is a wave, three is fire. The
        // ribbon is a flat strip and this is the only thing giving it shape,
        // so it is doing more work than it looks.
        float t = uTime;
        float f = sin(vAlong * 0.9 - t * 6.0) * 0.5
                + sin(vAlong * 2.3 - t * 9.0) * 0.3
                + sin(vAlong * 5.1 - t * 13.0) * 0.2;
        // How high this tongue reaches, 0.45..1.0 of the strip.
        float reach = 0.62 + f * 0.30;
        float body = 1.0 - smoothstep(reach - 0.35, reach, vUp);
        if (body <= 0.01) discard;

        // Hot at the base, cooling as it rises, which is the direction a real
        // flame's colour runs and the direction people expect even when they
        // could not tell you why.
        vec3 col = mix(uHot, uMid, smoothstep(0.0, 0.40, vUp));
        col = mix(col, uCool, smoothstep(0.40, 0.95, vUp));
        // A brighter core along the middle of each tongue, which is what stops
        // a solid-coloured flame reading as a piece of orange paper.
        col = mix(col, vec3(1.0, 0.97, 0.80), pow(max(0.0, 1.0 - abs(f)), 3.0) * 0.45 * (1.0 - vUp));

        // Fading in at the very bottom keeps the strip's own lower edge from
        // reading as a hard line sitting on the grass.
        float foot = smoothstep(0.0, 0.06, vUp);
        gl_FragColor = vec4(col, body * foot * 0.94);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const mesh = new THREE.Mesh(geo, material);
  mesh.name = `fire-${zone.id}`;
  mesh.frustumCulled = false;
  mesh.userData.uniforms = uniforms;
  return mesh;
}










export function buildFires(path, track) {
  const group = new THREE.Group();
  group.name = 'fires';
  const zones = (track.hazards ?? []).filter((z) => z.kind === 'fire');
  const lavaZones = (track.hazards ?? []).filter((z) => z.kind === 'lava');
  const volcanoes = (track.terrain ?? []).filter((f) => f.kind === 'volcano');

  
  
  
  
  
  
  const lavaMat = lavaZones.length ? buildLavaMaterial() : null;
  
  
  
  const craterMat = volcanoes.length ? buildLavaMaterial({ scale: 0.19, glow: 0.55 }) : null;
  for (const zone of lavaZones) group.add(buildLavaRibbon(path, zone, lavaMat));
  const plumes = [];
  for (const f of volcanoes) {
    const crater = buildCraterLake(path, f, craterMat);
    plumes.push(crater);
    group.add(crater);
  }
  group.userData.lava = lavaMat;
  group.userData.craterLava = craterMat;
  group.userData.plumes = plumes;

  if (!zones.length) {
    group.userData.ribbons = [];
    return group;
  }

  const ribbons = [];
  for (const zone of zones) {
    const ribbon = buildFireRibbon(path, zone, track.theme);
    ribbons.push(ribbon);
    group.add(ribbon);

    
    
    for (const marker of hazardMarkers(zone, 0.017)) {
      const p = sampleAt(path, marker.frac * path.length);
      const off = (p.width / 2) * marker.out;
      const bale = buildBale();
      bale.position.set(p.x + p.tz * off, p.y ?? 0, p.z - p.tx * off);
      bale.rotation.y = Math.atan2(p.tx, p.tz);
      group.add(bale);
    }
  }
  group.userData.ribbons = ribbons;
  return group;
}


export function updateFires(fires, elapsed) {
  if (!fires) return;
  if (fires.userData.lava) fires.userData.lava.uniforms.uTime.value = elapsed;
  if (fires.userData.craterLava) fires.userData.craterLava.uniforms.uTime.value = elapsed;
  for (const plume of fires.userData.plumes ?? []) updatePlume(plume, elapsed);
  for (const ribbon of fires.userData.ribbons ?? []) {
    ribbon.userData.uniforms.uTime.value = elapsed;
  }
  for (const bale of fires.children) {
    const flames = bale.userData.flames;
    if (!flames) continue;
    for (const flame of flames) {
      const t = elapsed * 7 + flame.userData.phase + bale.position.x * 0.3;
      
      
      
      const sc = 0.86 + Math.sin(t) * 0.14 + Math.sin(t * 2.3) * 0.06;
      flame.scale.set(2 - sc, sc, 2 - sc);
      flame.position.y = flame.userData.baseY + Math.sin(t * 1.4) * 0.12;
      flame.rotation.y = Math.sin(t * 0.6) * 0.25;
    }
  }
}
















function mergeInto(soup, geo, matrix, colorTop, colorBottom) {
  const pos = geo.attributes.position;
  const base = soup.positions.length / 3;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 1) {
    v.fromBufferAttribute(pos, i).applyMatrix4(matrix);
    soup.positions.push(v.x, v.y, v.z);
    
    
    
    const c = v.y < 0 ? colorBottom : colorTop;
    soup.colors.push(c.r, c.g, c.b);
  }
  const idx = geo.index;
  if (idx) for (let i = 0; i < idx.count; i += 1) soup.indices.push(base + idx.getX(i));
  else for (let i = 0; i < pos.count; i += 1) soup.indices.push(base + i);
}


















function buildSharkGeometry() {
  const soup = { positions: [], colors: [], indices: [] };
  const back = new THREE.Color(PALETTE.shark);
  const belly = new THREE.Color(PALETTE.sharkBelly);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();

  
  const body = new THREE.ConeGeometry(1.7, 7.6, 7);
  m.compose(
    new THREE.Vector3(0, 0, -0.6),
    q.setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)),
    new THREE.Vector3(1, 1, 0.62),
  );
  mergeInto(soup, body, m, back, belly);

  
  
  const stock = new THREE.ConeGeometry(1.55, 3.8, 7);
  m.compose(
    new THREE.Vector3(0, 0, -5.8),
    q.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)),
    new THREE.Vector3(1, 1, 0.62),
  );
  mergeInto(soup, stock, m, back, belly);

  
  
  const dorsal = new THREE.ConeGeometry(1.4, 2.2, 3);
  m.compose(
    new THREE.Vector3(0, 1.4, -2.2),
    q.setFromEuler(new THREE.Euler(0, 0, 0)),
    new THREE.Vector3(0.22, 1, 1),
  );
  mergeInto(soup, dorsal, m, back, back);

  
  for (const [ty, rot, scl] of [[0.9, 0.35, 1], [-0.7, -0.5, 0.72]]) {
    const fin = new THREE.ConeGeometry(1.25, 2.8, 3);
    m.compose(
      new THREE.Vector3(0, ty * 1.5, -7.4),
      q.setFromEuler(new THREE.Euler(0, 0, rot)),
      new THREE.Vector3(0.2, scl, 1),
    );
    mergeInto(soup, fin, m, back, back);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(soup.positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(soup.colors, 3));
  geo.setIndex(soup.indices);
  geo.computeVertexNormals();
  return geo;
}


















function buildSharks(path, zone) {
  const spec = zone.creatures;
  const group = new THREE.Group();
  group.name = `sharks-${zone.id}`;
  if (!spec) return group;
  const n = Math.max(1, spec.count ?? 8);
  const geo = buildSharkGeometry();
  const mesh = new THREE.InstancedMesh(
    geo, surface({ vertexColors: true, roughness: 0.55, flatShading: true }), n,
  );
  const span = zone.from <= zone.to ? zone.to - zone.from : (1 - zone.from) + zone.to;
  const level = surfaceLevelOf(zone);
  const anchors = [];
  for (let i = 0; i < n; i += 1) {
    
    
    const frac = (zone.from + span * (0.08 + 0.84 * (i / Math.max(1, n - 1)))) % 1;
    const p = sampleAt(path, frac * path.length);
    const side = i % 2 === 0 ? 1 : -1;
    
    const off = (p.width / 2) * ((zone.beyond ?? 1.18) + (zone.bank ?? 0.55)) + 7 + (i % 3) * 5;
    anchors.push({
      x: p.x + p.tz * side * off,
      z: p.z - p.tx * side * off,
      water: (p.y ?? 0) - level,
      
      yaw: Math.atan2(p.tx, p.tz) + (side > 0 ? -Math.PI / 2 : Math.PI / 2),
      phase: (i * 0.7919) % 1,
      scale: 0.85 + ((i * 0.37) % 1) * 0.5,
    });
  }
  mesh.name = `shark-${zone.id}`;
  mesh.castShadow = false;
  group.add(mesh);
  group.userData.sharks = { mesh, anchors, zone, lunge: spec.lungeHeight ?? 6, period: spec.period ?? 4.4 };
  
  
  
  
  
  
  
  
  
  
  updateSharks(group, 0);
  return group;
}


function updateSharks(group, elapsed) {
  const s = group?.userData?.sharks;
  if (!s) return;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const v = new THREE.Vector3();
  const sc = new THREE.Vector3();
  s.anchors.forEach((a, i) => {
    const t = lungePhase(elapsed, { period: s.period, up: 1.3, phase: a.phase * s.period });
    
    
    const y = a.water - 7.5 + (7.5 + s.lunge) * t;
    
    
    
    const pitch = t > 0 ? 0.9 - 1.8 * t : 0;
    e.set(pitch, a.yaw, 0);
    q.setFromEuler(e);
    v.set(a.x, y, a.z);
    sc.setScalar(a.scale);
    s.mesh.setMatrixAt(i, m.compose(v, q, sc));
  });
  s.mesh.instanceMatrix.needsUpdate = true;
}

























export function buildLavaMaterial({ scale = 0.055, glow = 0 } = {}) {
  const uniforms = {
    uTime: { value: 0 },
    uScale: { value: scale },
    uGlow: { value: glow },
    uCrust: { value: new THREE.Color(PALETTE.lavaCrust) },
    uLava: { value: new THREE.Color(PALETTE.lava) },
    uHot: { value: new THREE.Color(PALETTE.lavaHot) },
  };
  return new THREE.ShaderMaterial({
    uniforms,
    toneMapped: false,
    vertexShader: `
      varying vec2 vWorld;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform vec3 uCrust, uLava, uHot;
      uniform float uTime, uScale, uGlow;
      varying vec2 vWorld;
      ${NOISE_GLSL}
      void main() {
        // Two octaves drifting in different directions. The same reasoning as
        // the water above: any pair of pure periodic functions beats into a
        // lattice, and noise has no period to beat with.
        vec2 w = vWorld * uScale;
        float a = vnoise(w + vec2(uTime * 0.035, uTime * 0.017));
        float b = vnoise(w * 2.7 - vec2(uTime * 0.021, uTime * 0.048));
        float f = a * 0.65 + b * 0.35;
        // The cracks are where the two octaves disagree, which gives a network
        // of thin veins rather than blobs.
        float vein = 1.0 - smoothstep(0.02, 0.30 + uGlow * 0.22, abs(a - b));
        float pool = smoothstep(0.56 - uGlow * 0.30, 0.78 - uGlow * 0.30, f);
        vec3 col = uCrust;
        col = mix(col, uLava, max(vein, pool));
        col = mix(col, uHot, pow(max(vein, pool), 3.0) * (0.55 + 0.45 * sin(uTime * 1.7 + f * 9.0)));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}




function buildLavaRibbon(path, zone, material) {
  const span = zone.from <= zone.to ? zone.to - zone.from : (1 - zone.from) + zone.to;
  const steps = Math.max(8, Math.round((span * path.length) / 4));
  const positions = [];
  const indices = [];
  const sides = !zone.side || zone.side === 'both' ? [1, -1] : [zone.side === 'left' ? 1 : -1];
  const level = surfaceLevelOf(zone);
  for (const side of sides) {
    const base = positions.length / 3;
    for (let i = 0; i <= steps; i += 1) {
      const frac = (zone.from + (span * i) / steps) % 1;
      const p = sampleAt(path, frac * path.length);
      const half = p.width / 2;
      const inner = half * ((zone.beyond ?? 1.18) + (zone.bank ?? 0.55) * 0.7);
      
      
      
      const outer = inner + carvedReach(path, zone, p, side, inner);
      const nx = p.tz * side;
      const nz = -p.tx * side;
      const y = (p.y ?? 0) - level;
      positions.push(p.x + nx * inner, y, p.z + nz * inner);
      positions.push(p.x + nx * outer, y, p.z + nz * outer);
    }
    for (let i = 0; i < steps; i += 1) {
      const a = base + i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  const mesh = new THREE.Mesh(geo, material);
  material.side = THREE.DoubleSide;
  mesh.name = `lava-${zone.id}`;
  return mesh;
}












function buildCraterLake(path, feature, material) {
  const g = new THREE.Group();
  g.name = `crater-${feature.id ?? 'volcano'}`;
  const r = (feature.craterRadius ?? 78) * 0.52;
  const floor = groundMeshHeightAt(path, feature.x, feature.z);
  const disc = new THREE.CircleGeometry(r, 28);
  disc.rotateX(-Math.PI / 2);
  const lake = new THREE.Mesh(disc, material);
  lake.position.set(feature.x, floor + lavaRise(feature), feature.z);
  lake.name = 'crater-lake';
  g.add(lake);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const puffs = [];
  const puffGeo = new THREE.SphereGeometry(1, 12, 8);
  for (let i = 0; i < 14; i += 1) {
    const smokeMat = new THREE.MeshBasicMaterial({
      color: 0xd3c9bd, transparent: true, opacity: 0.16,
      depthWrite: false, toneMapped: false,
    });
    const cone = new THREE.Mesh(puffGeo, smokeMat);
    cone.userData.i = i;
    cone.renderOrder = 3;
    g.add(cone);
    puffs.push(cone);
  }
  g.userData.plume = { puffs, baseY: floor + lavaRise(feature) + 6, x: feature.x, z: feature.z, r };
  return g;
}


function updatePlume(group, elapsed) {
  const p = group?.userData?.plume;
  if (!p) return;
  p.puffs.forEach((puff, i) => {
    
    
    const t = ((elapsed * 0.05 + i / p.puffs.length) % 1);
    const h = t * 112;
    const spread = 8 + t * 44;
    puff.position.set(
      p.x + Math.sin(t * 3.1 + i) * spread * 0.35 + t * 30,
      p.baseY + h,
      p.z + Math.cos(t * 2.3 + i * 1.7) * spread * 0.35,
    );
    const s = 7 + t * 24;
    puff.scale.set(s, s * 0.74, s);
    
    
    
    puff.material.opacity = 0.17 * (1 - t) * (t < 0.12 ? t / 0.12 : 1);
  });
}


export const inFireZone = (track, frac) =>
  (track.hazards ?? []).some((z) => z.kind === 'fire' && inSpan(frac, z.from, z.to));

export { PALETTE };
