





import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { MipBloomPass } from './mipBloom.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const TILT_SHIFT = {
  uniforms: { tDiffuse: { value: null }, uTexel: { value: new THREE.Vector2(1 / 1280, 1 / 720) }, uStart: { value: 0.9 } },
  vertexShader:  `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }
`,
  
  fragmentShader:  `
uniform sampler2D tDiffuse;
uniform vec2 uTexel;
uniform float uStart;
varying vec2 vUv;
void main() {
  float w = smoothstep( uStart, 1.0, vUv.y );
  vec4 c = texture2D( tDiffuse, vUv );
  if ( w < 0.02 ) { gl_FragColor = c; return; }
  vec4 acc = vec4( 0.0 );
  float total = 0.0;
  for ( int x = -2; x <= 2; x ++ ) {
    for ( int y = -2; y <= 2; y ++ ) {
      vec2 o = vec2( float( x ), float( y ) ) * uTexel * w * 0.9;
      float k = 1.0 / ( 1.0 + float( x * x + y * y ) * 0.4 );
      acc += texture2D( tDiffuse, vUv + o ) * k;
      total += k;
    }
  }
  gl_FragColor = acc / total;
}
`,
};















export function createPost(renderer, scene, camera, settings) {
  let composer = null, bloom = null, tilt = null, target = null;
  let last = { w: 0, h: 0 };
  let strength = 0;

  function build(s) {
    if (!s.bloom) return;          
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    target = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: s.effects >= 1 ? 4 : 2 });
    composer = new EffectComposer(renderer, target);
    composer.addPass(new RenderPass(scene, camera));
    
    
    const Bloom = s.bloomKind === 'mip' ? MipBloomPass : UnrealBloomPass;
    bloom = new Bloom(new THREE.Vector2(size.x * s.bloomScale, size.y * s.bloomScale), 0.6, 0.6, 1.0);
    composer.addPass(bloom);
    if (s.tiltShift) {
      tilt = new ShaderPass(TILT_SHIFT);
      composer.addPass(tilt);
    }
    composer.addPass(new OutputPass());
  }

  function teardown() {
    for (const pass of composer ? composer.passes : []) if (pass.dispose) pass.dispose();
    if (composer && composer.dispose) composer.dispose();
    if (target) target.dispose();
    composer = null; bloom = null; tilt = null; target = null;
  }

  build(settings);

  const api = {
    get composer() { return composer; },
    render() { if (composer) composer.render(); else renderer.render(scene, camera); },
    setSize(w, h) {
      last = { w, h };
      if (!composer) return;
      composer.setPixelRatio(renderer.getPixelRatio());
      composer.setSize(w, h);
      if (tilt) tilt.uniforms.uTexel.value.set(1 / (w * renderer.getPixelRatio()), 1 / (h * renderer.getPixelRatio()));
    },
    setBloom(v) {
      strength = v;
      if (!bloom) return;
      bloom.strength = v;
      bloom.enabled = v > 0.02;
    },
    setTier(s) {
      teardown();
      build(s);
      if (last.w) api.setSize(last.w, last.h);
      api.setBloom(strength);
    },
  };
  return api;
}
