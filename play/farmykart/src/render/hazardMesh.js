








import * as THREE from 'three';

import { hazardMarkers, inSpan } from 'arbelo/trackHazards';
import { sampleAt } from 'arbelo/trackPath';
import { surface, NOISE_GLSL } from './materials.js';
import { PALETTE } from '../palette.js';
import { SHOULDER } from './trackMesh.js';












const WATER_REACH = 90;
















export function buildWaterMaterial(theme = 'summer') {
  
  
  
  
  
  const deep = theme === 'snow' ? 0x0c2740 : theme === 'mud' ? 0x2f3a2a : 0x1b4b6b;
  const shallow = theme === 'snow' ? 0x2d6d97 : theme === 'mud' ? 0x6f7a52 : 0x59a8c4;
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
    const span = zone.from <= zone.to ? zone.to - zone.from : (1 - zone.from) + zone.to;
    
    
    const steps = Math.max(8, Math.round((span * path.length) / 4));
    const positions = [];
    const edges = [];
    const indices = [];
    const sides = !zone.side || zone.side === 'both' ? [1, -1]
      : [zone.side === 'left' ? 1 : -1];

    for (const side of sides) {
      const base = positions.length / 3;
      for (let i = 0; i <= steps; i += 1) {
        const frac = (zone.from + (span * i) / steps) % 1;
        const p = sampleAt(path, frac * path.length);
        const half = p.width / 2;
        
        
        
        const inner = (half * (zone.beyond ?? 1.18)) + SHOULDER * 0.25;
        const outer = inner + WATER_REACH;
        
        const nx = p.tz * side;
        const nz = -p.tx * side;
        const y = (p.y ?? 0) - (zone.depth ?? 4.5) * 0.28;
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


export function updateWater(water, elapsed) {
  const u = water?.userData?.material?.userData?.uniforms;
  if (u) u.uTime.value = elapsed;
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
  if (!zones.length) return group;

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


export const inFireZone = (track, frac) =>
  (track.hazards ?? []).some((z) => z.kind === 'fire' && inSpan(frac, z.from, z.to));

export { PALETTE };
