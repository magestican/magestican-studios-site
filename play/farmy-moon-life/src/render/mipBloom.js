















import * as THREE from 'three';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { LuminosityHighPassShader } from 'three/addons/shaders/LuminosityHighPassShader.js';
import { CopyShader } from 'three/addons/shaders/CopyShader.js';


export const MIP_BLOOM_LODS = [1.3, 3.4, 4.6, 6.0, 7.3];
const FACTORS = [1.0, 0.8, 0.6, 0.4, 0.2];




export const MIP_BLOOM_GAIN = 2.2;

const COMPOSITE = {
  uniforms: { tBright: { value: null }, uInvSize: { value: new THREE.Vector2() }, uStrength: { value: 0 }, uRadius: { value: 0.6 }, uLods: { value: MIP_BLOOM_LODS }, uFactors: { value: FACTORS } },
  vertexShader:  `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }
`,
  fragmentShader:  `
#define MIP_BLOOM_GAIN ${MIP_BLOOM_GAIN.toFixed(3)}
uniform sampler2D tBright;
uniform vec2 uInvSize;
uniform float uStrength;
uniform float uRadius;
uniform float uLods[5];
uniform float uFactors[5];
varying vec2 vUv;
vec3 tent( float lod ) {
  vec2 t = uInvSize * exp2( lod );
  vec3 c = textureLod( tBright, vUv, lod ).rgb * 4.0;
  c += ( textureLod( tBright, vUv + vec2( t.x, 0.0 ), lod ).rgb + textureLod( tBright, vUv - vec2( t.x, 0.0 ), lod ).rgb
       + textureLod( tBright, vUv + vec2( 0.0, t.y ), lod ).rgb + textureLod( tBright, vUv - vec2( 0.0, t.y ), lod ).rgb ) * 2.0;
  c += textureLod( tBright, vUv + t, lod ).rgb + textureLod( tBright, vUv - t, lod ).rgb
     + textureLod( tBright, vUv + vec2( t.x, -t.y ), lod ).rgb + textureLod( tBright, vUv + vec2( -t.x, t.y ), lod ).rgb;
  return c / 16.0;
}
void main() {
  vec3 acc = vec3( 0.0 );
  for ( int i = 0; i < 5; i ++ ) acc += mix( uFactors[ i ], 1.2 - uFactors[ i ], uRadius ) * tent( uLods[ i ] );
  gl_FragColor = vec4( uStrength * MIP_BLOOM_GAIN * acc, 1.0 );
}
`,
};

export class MipBloomPass extends Pass {
  constructor(resolution, strength = 1, radius = 0, threshold = 0) {
    super();
    this.strength = strength;
    this.radius = radius;
    this.threshold = threshold;
    this.resolution = resolution.clone();
    const w = Math.max(1, Math.round(this.resolution.x / 2)), h = Math.max(1, Math.round(this.resolution.y / 2));
    this.bright = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, depthBuffer: false, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter });
    this.bright.texture.name = 'MipBloomPass.bright';
    this.bright.texture.generateMipmaps = true;
    this.composite = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, depthBuffer: false });
    this.composite.texture.name = 'MipBloomPass.composite';
    this.composite.texture.generateMipmaps = false;

    this.highPassUniforms = THREE.UniformsUtils.clone(LuminosityHighPassShader.uniforms);
    this.highPassUniforms.luminosityThreshold.value = threshold;
    this.highPassUniforms.smoothWidth.value = 0.01;
    this.highPass = new THREE.ShaderMaterial({ uniforms: this.highPassUniforms, vertexShader: LuminosityHighPassShader.vertexShader, fragmentShader: LuminosityHighPassShader.fragmentShader });

    this.compositeMaterial = new THREE.ShaderMaterial({ uniforms: THREE.UniformsUtils.clone(COMPOSITE.uniforms), vertexShader: COMPOSITE.vertexShader, fragmentShader: COMPOSITE.fragmentShader });
    this.compositeMaterial.uniforms.tBright.value = this.bright.texture;
    this.compositeMaterial.uniforms.uInvSize.value.set(1 / w, 1 / h);

    this.copyUniforms = THREE.UniformsUtils.clone(CopyShader.uniforms);
    this.blendMaterial = new THREE.ShaderMaterial({
      uniforms: this.copyUniforms, vertexShader: CopyShader.vertexShader, fragmentShader: CopyShader.fragmentShader,
      premultipliedAlpha: true, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true,
    });
    this.copyUniforms.tDiffuse.value = this.composite.texture;

    this.needsSwap = false;
    this._oldClearColor = new THREE.Color();
    this._quad = new FullScreenQuad(null);
  }

  setSize(width, height) {
    const w = Math.max(1, Math.round(width / 2)), h = Math.max(1, Math.round(height / 2));
    this.bright.setSize(w, h);
    this.composite.setSize(w, h);
    this.compositeMaterial.uniforms.uInvSize.value.set(1 / w, 1 / h);
  }

  render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
    renderer.getClearColor(this._oldClearColor);
    const oldAlpha = renderer.getClearAlpha(), oldAutoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.setClearColor(0x000000, 0);
    if (maskActive) renderer.state.buffers.stencil.setTest(false);

    
    this.highPassUniforms.tDiffuse.value = readBuffer.texture;
    this.highPassUniforms.luminosityThreshold.value = this.threshold;
    this._quad.material = this.highPass;
    renderer.setRenderTarget(this.bright);
    renderer.clear();
    this._quad.render(renderer);

    
    const u = this.compositeMaterial.uniforms;
    u.uStrength.value = this.strength;
    u.uRadius.value = this.radius;
    this._quad.material = this.compositeMaterial;
    renderer.setRenderTarget(this.composite);
    renderer.clear();
    this._quad.render(renderer);

    
    if (maskActive) renderer.state.buffers.stencil.setTest(true);
    this._quad.material = this.blendMaterial;
    renderer.setRenderTarget(this.renderToScreen ? null : readBuffer);
    this._quad.render(renderer);

    renderer.setClearColor(this._oldClearColor, oldAlpha);
    renderer.autoClear = oldAutoClear;
  }

  dispose() {
    this.bright.dispose();
    this.composite.dispose();
    this.highPass.dispose();
    this.compositeMaterial.dispose();
    this.blendMaterial.dispose();
    this._quad.dispose();
  }
}
