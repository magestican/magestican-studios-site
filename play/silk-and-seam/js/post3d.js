






import * as THREE from './vendor/three.module.min.js';

const VERT = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const quadMat = (frag, uniforms, tone = false) => new THREE.ShaderMaterial({
  vertexShader: VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false,
  blending: THREE.NoBlending, toneMapped: tone,
});

const BRIGHT = `uniform sampler2D tIn; uniform float thr; varying vec2 vUv;
void main() { vec4 c = texture2D(tIn, vUv); float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
  gl_FragColor = vec4(c.rgb * smoothstep(thr, thr + 0.35, l), 1.0); }`;
const COPY = 'uniform sampler2D tIn; varying vec2 vUv; void main() { gl_FragColor = texture2D(tIn, vUv); }';
const BLUR = `uniform sampler2D tIn; uniform vec2 dir; varying vec2 vUv;
void main() {
  vec4 s = texture2D(tIn, vUv) * 0.2270270;
  s += (texture2D(tIn, vUv + dir * 1.3846154) + texture2D(tIn, vUv - dir * 1.3846154)) * 0.3162162;
  s += (texture2D(tIn, vUv + dir * 3.2307692) + texture2D(tIn, vUv - dir * 3.2307692)) * 0.0702703;
  gl_FragColor = s; }`;
const FINAL = `#include <packing>
uniform sampler2D tScene, tB1, tB2, tBlur, tDepth;
uniform float bloom, vig, grain, seed, dofOn, focus, range, near, far, sat, exposure;
uniform vec3 tint, lift; uniform vec2 res; varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233)) + seed) * 43758.5453); }
void main() {
  vec4 c = texture2D(tScene, vUv);
  vec3 col = c.rgb; float a = c.a;
  if (dofOn > 0.5) {
    float z = -perspectiveDepthToViewZ(texture2D(tDepth, vUv).x, near, far);
    vec4 b = texture2D(tBlur, vUv);
    float coc = clamp(abs(z - focus) / range, 0.0, 1.0);
    col = mix(col, b.rgb, coc); a = mix(a, b.a, coc);
  }
  vec3 glow = (texture2D(tB1, vUv).rgb + texture2D(tB2, vUv).rgb * 0.8) * bloom;
  col = col * tint * exposure + lift * a + glow;
  a = max(a, clamp(dot(glow, vec3(0.3333)), 0.0, 1.0));
  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = max(mix(vec3(l), col, sat), 0.0);
  col *= 1.0 - vig * 0.38 * smoothstep(0.32, 0.85, distance(vUv, vec2(0.5)));
  col += (hash(floor(vUv * res)) - 0.5) * grain * 0.018 * a;
  gl_FragColor = vec4(col, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export function createPost(R) {
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
  const quad = new THREE.Mesh(geo);
  quad.frustumCulled = false;
  const scene = new THREE.Scene(); scene.add(quad);
  const M = {
    bright: quadMat(BRIGHT, { tIn: { value: null }, thr: { value: 0.9 } }),
    copy: quadMat(COPY, { tIn: { value: null } }),
    blur: quadMat(BLUR, { tIn: { value: null }, dir: { value: new THREE.Vector2() } }),
    final: quadMat(FINAL, {
      tScene: { value: null }, tB1: { value: null }, tB2: { value: null }, tBlur: { value: null }, tDepth: { value: null },
      bloom: { value: 0 }, vig: { value: 0 }, grain: { value: 0 }, seed: { value: 0 }, dofOn: { value: 0 }, focus: { value: 640 },
      range: { value: 240 }, near: { value: 10 }, far: { value: 2000 }, sat: { value: 1 }, exposure: { value: 1 },
      tint: { value: new THREE.Vector3(1, 1, 1) }, lift: { value: new THREE.Vector3() }, res: { value: new THREE.Vector2(1, 1) },
    }, true),
  };
  let T = null, key = '';
  const rt = (w, h, o = {}) => new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, depthBuffer: false, ...o });
  const free = () => { if (T) Object.values(T).forEach((t) => t?.dispose()); T = null; key = ''; };
  function targets(W, H, fx) {
    const k = `${W}x${H}:${fx.msaa}:${fx.dof}`;
    if (k === key) return T;
    free();
    const hw = Math.max(1, W >> 1), hh = Math.max(1, H >> 1), qw = Math.max(1, W >> 2), qh = Math.max(1, H >> 2);
    T = {
      scene: rt(W, H, { depthBuffer: true, samples: fx.msaa, depthTexture: fx.dof ? new THREE.DepthTexture(W, H) : null }),
      hA: rt(hw, hh), hB: rt(hw, hh), qA: rt(qw, qh), qB: rt(qw, qh),
      dof: fx.dof ? rt(hw, hh) : null,
    };
    key = k;
    return T;
  }
  const pass = (mat, target) => { quad.material = mat; R.setRenderTarget(target); R.render(scene, cam); };
  const blur2 = (a, b, w, h) => {
    M.blur.uniforms.tIn.value = a.texture; M.blur.uniforms.dir.value.set(1 / w, 0); pass(M.blur, b);
    M.blur.uniforms.tIn.value = b.texture; M.blur.uniforms.dir.value.set(0, 1 / h); pass(M.blur, a);
  };
  let frame = 0;

  return {
    
    render(sceneIn, camera, W, H, fx, grade, opts = {}) {
      const t = targets(W, H, fx), hw = t.hA.width, hh = t.hA.height;
      const exp = R.toneMappingExposure;
      R.toneMappingExposure = 1;
      R.setRenderTarget(t.scene); R.setClearColor(0x000000, 0); R.clear();
      R.render(sceneIn, camera);
      if (fx.bloom) {
        M.bright.uniforms.tIn.value = t.scene.texture; pass(M.bright, t.hA);
        blur2(t.hA, t.hB, hw, hh);
        M.copy.uniforms.tIn.value = t.hA.texture; pass(M.copy, t.qA);
        blur2(t.qA, t.qB, t.qA.width, t.qA.height);
      }
      const dofOn = !!(fx.dof && opts.dof && t.dof);
      if (dofOn) {
        M.copy.uniforms.tIn.value = t.scene.texture; pass(M.copy, t.dof);
        blur2(t.dof, t.hB, hw, hh); blur2(t.dof, t.hB, hw, hh);
      }
      const u = M.final.uniforms;
      u.tScene.value = t.scene.texture; u.tB1.value = t.hA.texture; u.tB2.value = t.qA.texture;
      u.tBlur.value = t.dof?.texture || t.hA.texture; u.tDepth.value = t.scene.depthTexture || null;
      u.bloom.value = fx.bloom ? grade.bloom : 0; u.vig.value = fx.vignette ? 1 : 0; u.grain.value = fx.grain ? 1 : 0;
      u.seed.value = (frame++ % 64) * 0.37; u.dofOn.value = dofOn ? 1 : 0;
      if (dofOn) { u.focus.value = opts.dof.focus ?? 640; u.range.value = opts.dof.range ?? 260; u.near.value = camera.near; u.far.value = camera.far; }
      u.sat.value = grade.sat; u.exposure.value = grade.exposure;
      u.tint.value.fromArray(grade.tint); u.lift.value.fromArray(grade.lift); u.res.value.set(W, H);
      pass(M.final, null);
      R.toneMappingExposure = exp;
    },
    reset: free,        
    dispose() { free(); Object.values(M).forEach((m) => m.dispose()); geo.dispose(); },
  };
}
