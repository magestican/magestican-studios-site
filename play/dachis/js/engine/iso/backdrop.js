













import * as THREE from 'three';
import { ISO_DIR, EYE_DIST, toUS } from './isoView.js';
import { seeUniforms, SEE_MAX, SEE_CORE } from './seeThrough.js';


const BIAS = 0.04; 



export function backdropFrame(meta, target, viewHeight, aspect) {
  const [u, s] = toUS(target.x, target.z, target.y);
  return { cx: (u - meta.u0) * meta.ppu, cy: (s - meta.s0) * meta.ppu, sx: viewHeight * aspect * meta.ppu, sy: viewHeight * meta.ppu };
}


export function backdropDepth(meta, target, near, far) {
  const D = meta.depth, span = far - near, tf = -target.dot(ISO_DIR);
  return { k: (D.far - D.near) / span, c: (D.near + D.plane - D.eye_dist - tf + EYE_DIST - near) / span };
}



export function loopFrame(loop, tSec) { return Math.floor(tSec * loop.fps + 1e-6) % loop.frames; }



export function loopCell(loop, k) {
  const per = loop.cols * loop.rows, page = Math.floor(k / per), i = k - page * per;
  const onPage = Math.min(per, loop.frames - page * per), rows = Math.ceil(onPage / loop.cols);
  const c = i % loop.cols, r = Math.floor(i / loop.cols);
  
  const [, , w, h] = loop.box, g = loop.gutter || 0, W = loop.cols * (w + 2 * g), H = rows * (h + 2 * g);
  const x = c * (w + 2 * g) + g, y = r * (h + 2 * g) + g;
  return { page, uv: [x / W, y / H, (x + w) / W, (y + h) / H] };
}




export const MASK_DEPTH_IDS = [0, 6];
export function maskWritesDepth(b255) { return MASK_DEPTH_IDS.includes(b255); }

const DEPTH_IDS_GLSL = MASK_DEPTH_IDS.map((i) => (i ? `abs( b - ${i}.0 ) < 0.5` : 'b < 0.5')).join(' || ');

const QUAD_V =  `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4( position.xy, 0.0, 1.0 ); }
`;
export const DEPTH_F =  `
uniform sampler2D tData;
uniform vec2 uCenter, uSpan, uImage;
uniform float uScale, uK, uC, uBias;
uniform vec4 uSee[ ${SEE_MAX} ];
uniform float uSeeW[ ${SEE_MAX} ];
uniform float uSeeAspect, uSeeDepth;
varying vec2 vUv;
float bayer( vec2 p ) {
  vec2 q = mod( floor( p ), 4.0 );
  vec4 a = vec4( 0.0, 8.0, 2.0, 10.0 ), b = vec4( 12.0, 4.0, 14.0, 6.0 ), c = vec4( 3.0, 11.0, 1.0, 9.0 ), d = vec4( 15.0, 7.0, 13.0, 5.0 );
  vec4 row = q.y < 0.5 ? a : q.y < 1.5 ? b : q.y < 2.5 ? c : d;
  float v = q.x < 0.5 ? row.x : q.x < 1.5 ? row.y : q.x < 2.5 ? row.z : row.w;
  return ( v + 0.5 ) / 16.0;
}
void main() {
  vec2 px = uCenter + ( vUv - 0.5 ) * vec2( uSpan.x, - uSpan.y );
  float d = 1.0;
  if ( px.x >= 0.0 && px.y >= 0.0 && px.x < uImage.x && px.y < uImage.y ) {
    vec3 t = texelFetch( tData, ivec2( px / uScale ), 0 ).rgb;
    float b = floor( t.b * 255.0 + 0.5 ); // MASK_DEPTH_IDS: static 0 and a loop 6
    if ( ${DEPTH_IDS_GLSL} ) d = ( t.r * 255.0 * 256.0 + t.g * 255.0 ) / 65535.0 * uK + uC + uBias;
  }
  // see-through (seeThrough.js seeCut, scenery: every window): cut a baked occluder nearer than the target
  vec3 ndc = vec3( vUv * 2.0 - 1.0, d * 2.0 - 1.0 );
  float m = 0.0;
  for ( int i = 0; i < ${SEE_MAX}; i ++ ) {
    vec4 s = uSee[ i ];
    if ( uSeeW[ i ] <= 0.0 || s.w <= 0.0 ) continue;
    vec2 e = ndc.xy - s.xy; e.x *= uSeeAspect;
    float r = length( e ) / s.w;
    float nearer = smoothstep( uSeeDepth * 0.5, uSeeDepth * 1.5, s.z - ndc.z );
    m = max( m, ( 1.0 - smoothstep( 0.55, 1.0, r ) ) * nearer * uSeeW[ i ] );
  }
  if ( m * ${SEE_CORE.toFixed(3)} > bayer( gl_FragCoord.xy ) ) d = 1.0;
  gl_FragDepth = clamp( d, 0.0, 1.0 );
  gl_FragColor = vec4( 0.0 );
}
`;
const TILE_F =  `
uniform sampler2D map;
uniform vec4 uBox; // the content box in texture uv (u0, v0 top, u1, v1 bottom): the texture rows run top-down
varying vec2 vUv;
void main() {
  gl_FragColor = texture2D( map, vec2( mix( uBox.x, uBox.z, vUv.x ), mix( uBox.y, uBox.w, 1.0 - vUv.y ) ) );
  #include <colorspace_fragment>
}
`;


const LOOP_F =  `
uniform sampler2D map, uMask;
uniform vec4 uBox;
varying vec2 vUv;
void main() {
  if ( texture2D( uMask, vec2( vUv.x, 1.0 - vUv.y ) ).r < 0.5 ) discard;
  gl_FragColor = texture2D( map, vec2( mix( uBox.x, uBox.z, vUv.x ), mix( uBox.y, uBox.w, 1.0 - vUv.y ) ) );
  #include <colorspace_fragment>
}
`;
const PLACE_V =  `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }
`;


async function bitmap(url, raw = false) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('backdrop ' + url + ': ' + r.status);
  const b = await r.blob();
  return createImageBitmap(b, raw ? { premultiplyAlpha: 'none', colorSpaceConversion: 'none' } : { premultiplyAlpha: 'none' });
}

export function createBackdrop(stage) {
  const { renderer, camera } = stage;
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const depthU = {
    tData: { value: null }, uCenter: { value: new THREE.Vector2() }, uSpan: { value: new THREE.Vector2() }, uImage: { value: new THREE.Vector2() },
    uScale: { value: 1 }, uK: { value: 0 }, uC: { value: 0 }, uBias: { value: 0 },
    uSee: seeUniforms.uSee, uSeeW: seeUniforms.uSeeW, uSeeAspect: seeUniforms.uSeeAspect, uSeeDepth: seeUniforms.uSeeDepth,
  };
  const depthMat = new THREE.ShaderMaterial({ uniforms: depthU, vertexShader: QUAD_V, fragmentShader: DEPTH_F,
    depthTest: true, depthWrite: true, depthFunc: THREE.AlwaysDepth, colorWrite: false });
  const depthQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), depthMat);
  depthQuad.frustumCulled = false;
  const depthScene = new THREE.Scene(); depthScene.add(depthQuad);
  const tileScene = new THREE.Scene();
  const tileGeo = new THREE.PlaneGeometry(1, 1);
  let layer = null; 

  const bd = {
    get active() { return !!layer; },
    get meta() { return layer && layer.meta; },
    
    async load(base, meta) {
      const [data, ...tiles] = await Promise.all([bitmap(base + meta.data.file, true), ...meta.tiles.map((t) => bitmap(base + t.file))]);
      const loops = await Promise.all((meta.loops || []).map((l) => Promise.all([bitmap(base + l.mask, true), ...l.files.map((f) => bitmap(base + f))])));
      return { meta, data, tiles, loops };
    },
    
    show(loaded) {
      bd.clear();
      if (!loaded) return;
      const { meta } = loaded;
      const data = new THREE.Texture(loaded.data);
      data.flipY = false; data.colorSpace = THREE.NoColorSpace; data.generateMipmaps = false;
      data.minFilter = data.magFilter = THREE.NearestFilter; data.needsUpdate = true;
      const tiles = meta.tiles.map((t, i) => {
        const tex = new THREE.Texture(loaded.tiles[i]);
        tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.needsUpdate = true;
        const box = new THREE.Vector4((t.x - t.tx) / t.tw, (t.y - t.ty) / t.th, (t.x + t.w - t.tx) / t.tw, (t.y + t.h - t.ty) / t.th);
        const mat = new THREE.ShaderMaterial({ uniforms: { map: { value: tex }, uBox: { value: box } }, vertexShader:  `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }
`, fragmentShader: TILE_F, depthTest: false, depthWrite: false });
        const mesh = new THREE.Mesh(tileGeo, mat);
        mesh.frustumCulled = false;
        tileScene.add(mesh);
        return { mesh, t, tex };
      });
      
      const loops = (meta.loops || []).map((l, i) => {
        const [maskBm, ...pageBms] = loaded.loops[i];
        const mask = new THREE.Texture(maskBm);
        mask.flipY = false; mask.colorSpace = THREE.NoColorSpace; mask.generateMipmaps = false;
        mask.minFilter = mask.magFilter = THREE.NearestFilter; mask.needsUpdate = true;
        const pages = pageBms.map((bm) => {
          const tex = new THREE.Texture(bm);
          tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.generateMipmaps = false; 
          tex.minFilter = tex.magFilter = THREE.LinearFilter; tex.needsUpdate = true;
          return tex;
        });
        const mat = new THREE.ShaderMaterial({ uniforms: { map: { value: pages[0] }, uMask: { value: mask }, uBox: { value: new THREE.Vector4() } },
          vertexShader: PLACE_V, fragmentShader: LOOP_F, depthTest: false, depthWrite: false });
        const mesh = new THREE.Mesh(tileGeo, mat);
        mesh.frustumCulled = false;
        tileScene.add(mesh);
        return { mesh, l, pages, mask, t: { x: l.box[0], y: l.box[1], w: l.box[2], h: l.box[3] } };
      });
      depthU.tData.value = data;
      depthU.uImage.value.set(meta.width, meta.height);
      depthU.uScale.value = meta.data.scale;
      layer = { meta, tiles, data, loops };
    },
    clear() {
      if (!layer) return;
      for (const { mesh, tex } of layer.tiles) { tileScene.remove(mesh); mesh.material.dispose(); tex.dispose(); if (tex.image && tex.image.close) tex.image.close(); }
      for (const { mesh, pages, mask } of layer.loops) {
        tileScene.remove(mesh); mesh.material.dispose();
        for (const tex of [...pages, mask]) { tex.dispose(); if (tex.image && tex.image.close) tex.image.close(); }
      }
      layer.data.dispose(); if (layer.data.image && layer.data.image.close) layer.data.image.close();
      depthU.tData.value = null;
      layer = null;
    },
    
    depth() {
      const m = layer.meta, f = backdropFrame(m, stage.target, stage.viewHeight, stage.w / stage.h);
      depthU.uCenter.value.set(f.cx, f.cy); depthU.uSpan.value.set(f.sx, f.sy);
      const z = backdropDepth(m, stage.target, camera.near, camera.far);
      depthU.uK.value = z.k; depthU.uC.value = z.c; depthU.uBias.value = BIAS / (camera.far - camera.near);
      renderer.render(depthScene, quadCam);
    },
    
    color() {
      const m = layer.meta, f = backdropFrame(m, stage.target, stage.viewHeight, stage.w / stage.h);
      const now = performance.now() / 1000;
      for (const lp of layer.loops) { 
        const cell = loopCell(lp.l, loopFrame(lp.l, now));
        lp.mesh.material.uniforms.map.value = lp.pages[cell.page];
        lp.mesh.material.uniforms.uBox.value.set(...cell.uv);
      }
      for (const { mesh, t } of [...layer.tiles, ...layer.loops]) {
        const x0 = (t.x - f.cx) / (f.sx / 2), x1 = (t.x + t.w - f.cx) / (f.sx / 2);
        const y0 = -(t.y - f.cy) / (f.sy / 2), y1 = -(t.y + t.h - f.cy) / (f.sy / 2);
        mesh.visible = x1 > -1 && x0 < 1 && y0 > -1 && y1 < 1;
        mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, -0.5); 
        mesh.scale.set(x1 - x0, y0 - y1, 1);
      }
      renderer.render(tileScene, quadCam);
    },
  };
  stage.pixel.backdrop = bd;
  return bd;
}
