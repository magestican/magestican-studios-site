





import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
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
  if (!settings.bloom) {
    return { render: () => renderer.render(scene, camera), setSize() {}, setBloom() {}, composer: null };
  }
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const target = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: settings.effects >= 1 ? 4 : 2 });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(size.x * settings.bloomScale, size.y * settings.bloomScale), 0.6, 0.6, 1.0);
  composer.addPass(bloom);
  let tilt = null;
  if (settings.tiltShift) {
    tilt = new ShaderPass(TILT_SHIFT);
    composer.addPass(tilt);
  }
  composer.addPass(new OutputPass());
  return {
    composer,
    render() { composer.render(); },
    setSize(w, h) {
      composer.setPixelRatio(renderer.getPixelRatio());
      composer.setSize(w, h);
      if (tilt) tilt.uniforms.uTexel.value.set(1 / (w * renderer.getPixelRatio()), 1 / (h * renderer.getPixelRatio()));
    },
    setBloom(strength) {
      bloom.strength = strength;
      bloom.enabled = strength > 0.02;
    },
  };
}
