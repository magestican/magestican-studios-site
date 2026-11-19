























import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';





export const BLOOM = Object.freeze({ strength: 0.26, radius: 0.4, threshold: 1.15 });

export const VIGNETTE = Object.freeze({ amount: 0.22, start: 0.55 });





export function wantsPost({ quality, search = '', coarsePointer = false }) {
  const forced = new URLSearchParams(search).get('post');
  if (forced === '0') return false;
  if (forced === '1') return true;
  return quality === 'high' && !coarsePointer;
}

const GradeShader = {
  name: 'KartzoomGrade',
  uniforms: {
    tDiffuse: { value: null },
    toneMappingExposure: { value: 1 },
    uVignette: { value: new THREE.Vector2(VIGNETTE.amount, VIGNETTE.start) },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 uVignette;
    varying vec2 vUv;
    // No #include of tonemapping_pars / colorspace_pars: three.js already prepends both
    // to every ShaderMaterial, and including them again is a redefinition error that
    // turns the whole frame black (seen in the first local run, 2026-11-18).
    void main() {
      vec4 c = texture2D( tDiffuse, vUv );
      c.rgb = CustomToneMapping( c.rgb );
      float d = distance( vUv, vec2( 0.5 ) ) * 1.41421;
      c.rgb *= 1.0 - uVignette.x * smoothstep( uVignette.y, 1.0, d );
      gl_FragColor = sRGBTransferOETF( c );
    }`,
};








export function createPost(renderer, scene, camera, { quality }) {
  const coarsePointer = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  if (!wantsPost({ quality, search: location.search, coarsePointer })) return null;

  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const target = new THREE.WebGLRenderTarget(size.x, size.y, {
    type: THREE.HalfFloatType,
    samples: renderer.capabilities.isWebGL2 ? 4 : 0,
  });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(size.x, size.y), BLOOM.strength, BLOOM.radius, BLOOM.threshold);
  composer.addPass(bloom);
  const grade = new ShaderPass(GradeShader);
  composer.addPass(grade);

  return {
    render() {
      grade.uniforms.toneMappingExposure.value = renderer.toneMappingExposure;
      composer.render();
    },
    
    setSize(w, h) {
      composer.setPixelRatio(renderer.getPixelRatio());
      composer.setSize(w, h);
    },
    dispose() {
      bloom.dispose();
      grade.material.dispose();
      grade.fsQuad.dispose();
      composer.dispose();
    },
  };
}
