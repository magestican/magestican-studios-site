








import * as THREE from 'three';
import { makeCozy } from '../../vendor/fml/render/material.js';
import { pixelTexture } from './cozyStage.js';



const NEAR = 0.6, RANGE = 2.0;

const segDist = (px, py, ax, ay, bx, by) => {
  const vx = bx - ax, vy = by - ay, wx = px - ax, wy = py - ay;
  const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / (vx * vx + vy * vy || 1)));
  return Math.hypot(wx - vx * t, wy - vy * t);
};




export async function bakePathField(paths, n, perUnit = 4, slice = null) {
  const size = n * perUnit, data = new Uint8Array(size * size * 4);
  const segs = [];
  for (const p of paths) for (let k = 0; k < p.pts.length - 1; k++) segs.push([...p.pts[k], ...p.pts[k + 1], p.half]);
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    if (slice && i === 0) await slice('path field');
    const x = (i + 0.5) / perUnit, y = (j + 0.5) / perUnit;
    let d = RANGE;
    for (const [ax, ay, bx, by, h] of segs) {
      if (x < Math.min(ax, bx) - h - 1.5 || x > Math.max(ax, bx) + h + 1.5 || y < Math.min(ay, by) - h - 1.5 || y > Math.max(ay, by) + h + 1.5) continue;
      d = Math.min(d, segDist(x, y, ax, ay, bx, by) - h);
    }
    const v = Math.round(Math.max(0, Math.min(1, (d + NEAR) / RANGE)) * 255), o = (j * size + i) * 4;
    data[o] = v; data[o + 1] = v; data[o + 2] = v; data[o + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.minFilter = tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

const PARS =  `
uniform sampler2D uDPathField;
uniform float uDPathSpan;
uniform vec3 uDPathColor;
`;

const PATH =  `
{
  float dPd = texture2D( uDPathField, vFmlWorld.xz / uDPathSpan ).r * ${RANGE.toFixed(2)} - ${NEAR.toFixed(2)};
  float dN = ( fmlNoise( vec3( vFmlWorld.xz * 0.9, 3.1 ) ) - 0.5 ) * 0.28
    + ( fmlNoise( vec3( vFmlWorld.xz * 3.4, 8.2 ) ) - 0.5 ) * 0.16
    + ( fmlNoise( vec3( vFmlWorld.xz * 9.0, 5.7 ) ) - 0.5 ) * 0.08;
  float dE = dPd + dN;
  float dW = 1.0 - smoothstep( -0.02, 0.02, dE );
  vec2 dCell = floor( vFmlWorld.xz * 32.0 );
  float dPeb = step( 0.8, fmlNoise( vec3( dCell * 0.37, 1.7 ) ) );
  float dPebLit = step( 0.5, fract( sin( dot( dCell, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 ) );
  float dBorder = smoothstep( -0.3, -0.03, dE );
  vec3 dPath = uDPathColor * ( 1.0 - 0.14 * dBorder ) * ( 1.0 + dPeb * ( dPebLit * 0.22 - 0.16 ) );
  float dFringe = smoothstep( -0.02, 0.2, dE ) * ( 1.0 - smoothstep( 0.2, 0.7, dE ) );
  diffuseColor.rgb *= 1.0 - 0.12 * dFringe;
  #ifdef USE_MAP
    dPath *= texture2D( map, vMapUv ).rgb;
  #endif
  diffuseColor.rgb = mix( diffuseColor.rgb, dPath, dW );
}
`;


export function pathGroundMaterial({ map, field, span, color = '#c8a06c', rim = 0.18 }) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, map, roughness: 0.92, metalness: 0 });
  if (map) pixelTexture(map);
  const uniforms = {
    uDPathField: { value: field },
    uDPathSpan: { value: span },
    uDPathColor: { value: new THREE.Color(color) },
  };
  makeCozy(m, {
    rim, key: 'dachi-ground', uniforms,
    patch: (fs) => fs
      .replace('#include <common>', '#include <common>\n' + PARS)
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + PATH),
  });
  return m;
}
