










import * as THREE from 'three';

export const PIXEL_TIERS = Object.freeze([360, 480, 540]);

const VERT =  `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4( position.xy, 0.0, 1.0 ); }
`;

const FRAG =  `
uniform sampler2D tScene;
uniform vec2 uLow;      // low-res target size, pixels
uniform vec2 uScreen;   // drawing-buffer size, pixels
uniform float uDither;  // dither strength in quantise steps (0 = off)
uniform float uOver;    // 1: the scene was drawn over a transparent clear and goes OVER a backdrop (backdrop.js)
varying vec2 vUv;

float bayer4( vec2 p ) {
  int x = int( mod( p.x, 4.0 ) ), y = int( mod( p.y, 4.0 ) );
  int i = x + y * 4;
  int m[16] = int[16]( 0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5 );
  return ( float( m[i] ) + 0.5 ) / 16.0 - 0.5;
}

void main() {
  vec2 texel = vUv * uLow;
  vec2 cell = floor( texel );
  vec2 f = texel - cell;
  vec2 k = max( uScreen / uLow, vec2( 1.0 ) );
  vec2 o = clamp( ( f - 0.5 ) * k + 0.5, 0.0, 1.0 );
  gl_FragColor = texture2D( tScene, ( cell + o ) / uLow );
  // over a backdrop the target holds premultiplied colour (blended onto a transparent clear): grade the colour
  // itself, then hand it back premultiplied for the ONE, ONE_MINUS_SRC_ALPHA blend onto the picture
  float a = clamp( gl_FragColor.a, 0.0, 1.0 );
  if ( uOver > 0.5 ) gl_FragColor = vec4( a > 0.0 ? gl_FragColor.rgb / a : vec3( 0.0 ), 1.0 );
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  vec3 steps = vec3( 31.0, 63.0, 31.0 );
  vec3 c = gl_FragColor.rgb * steps + bayer4( cell ) * uDither;
  gl_FragColor.rgb = clamp( floor( c + 0.5 ) / steps, 0.0, 1.0 );
  if ( uOver > 0.5 ) gl_FragColor = vec4( gl_FragColor.rgb * a, a );
}
`;

export function createPixelPass(renderer, { height = 480, dither = 0.9 } = {}) {
  const target = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    generateMipmaps: false,
    depthBuffer: true,
    samples: 0,
  });
  const material = new THREE.ShaderMaterial({
    uniforms: {
      tScene: { value: target.texture },
      uLow: { value: new THREE.Vector2(1, 1) },
      uScreen: { value: new THREE.Vector2(1, 1) },
      uDither: { value: dither },
      uOver: { value: 0 },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
    depthTest: false,
    depthWrite: false,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  const quadScene = new THREE.Scene();
  quadScene.add(quad);
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const buf = new THREE.Vector2();
  const clear = new THREE.Color();
  
  const over = (on) => {
    material.uniforms.uOver.value = on ? 1 : 0;
    material.transparent = on;
    material.blending = on ? THREE.CustomBlending : THREE.NormalBlending;
    material.blendSrc = THREE.OneFactor; material.blendDst = THREE.OneMinusSrcAlphaFactor;
    material.blendSrcAlpha = THREE.OneFactor; material.blendDstAlpha = THREE.OneMinusSrcAlphaFactor;
  };

  const pass = {
    target,
    height,
    enabled: true,
    low: material.uniforms.uLow.value, 
    
    resize(cssW, cssH) {
      const h = Math.max(1, Math.min(pass.height, Math.round(cssH * renderer.getPixelRatio())));
      const w = Math.max(1, Math.round(h * cssW / cssH));
      target.setSize(w, h);
      material.uniforms.uLow.value.set(w, h);
      renderer.getDrawingBufferSize(buf);
      material.uniforms.uScreen.value.copy(buf);
    },
    setHeight(h, cssW, cssH) { pass.height = h; pass.resize(cssW, cssH); },
    setDither(d) { material.uniforms.uDither.value = d; },
    
    backdrop: null,
    render(scene, camera) {
      if (!pass.enabled) { renderer.setRenderTarget(null); renderer.render(scene, camera); return; }
      const bd = pass.backdrop && pass.backdrop.active ? pass.backdrop : null;
      if (bd) return pass.renderOver(bd, scene, camera);
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.render(quadScene, quadCam);
    },
    renderOver(bd, scene, camera) {
      const bg = scene.background, auto = renderer.autoClear, alpha = renderer.getClearAlpha();
      renderer.getClearColor(clear);
      renderer.setRenderTarget(target);
      scene.background = null;
      renderer.setClearColor(0x000000, 0); renderer.clear();
      renderer.autoClear = false;
      bd.depth();
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      
      renderer.setClearColor(bg && bg.isColor ? bg : clear, 1); renderer.clear();
      bd.color();
      over(true);
      renderer.render(quadScene, quadCam);
      over(false);
      scene.background = bg; renderer.autoClear = auto; renderer.setClearColor(clear, alpha);
    },
  };
  return pass;
}
