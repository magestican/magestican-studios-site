
















































import { ps1Vertex, FRAGMENT } from '../ps1/ps1Shader.mjs';


export const FOG = Object.freeze({ near: 9, far: 24 });








export const LOOK_SHADE = Object.freeze({ keyTerm: 0.30, introDim: 0.58 });


export function fogFactor(depth, near = FOG.near, far = FOG.far) {
  const f = (depth - near) / Math.max(far - near, 0.001);
  return f < 0 ? 0 : f > 1 ? 1 : f;
}


export function replaceLine(src, anchor, lines, what = anchor) {
  const first = src.indexOf(anchor);
  if (first < 0) throw new Error(`lookShader: anchor not found in the vendored shader - "${what}" - ps1Shader.mjs changed; update the injection`);
  if (src.indexOf(anchor, first + anchor.length) >= 0) throw new Error(`lookShader: anchor found twice - "${what}" - the injection would be ambiguous`);
  return src.slice(0, first) + lines.join('\n') + src.slice(first + anchor.length);
}



export const ANCHORS = Object.freeze({
  shadeDecl: 'varying float vShade;',
  clip: '  vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
  fold: '  vColor = aColor;',
  precision: 'precision mediump float;',
  quant: '  c = floor(clamp(c, 0.0, 1.0) * 31.0 + 0.5) / 31.0;',
  texSample: '  vec3 c = texture2D(uMap, vUv).rgb * vShade;',
});


export const INJECT = Object.freeze({
  vertexDecls: [
    'varying float vFog;',
    'uniform float uFogNear;',
    'uniform float uFogFar;',
    'uniform float uPrelit;',
    'uniform vec3 uLocal;',
  ],
  
  
  
  
  fog: '  vFog = clamp((clip.w - uFogNear) / max(uFogFar - uFogNear, 0.001), 0.0, 1.0);',
  fold: '  vColor = aColor * (vShade + uPrelit) * uLocal;',
  shadeOne: '  vShade = 1.0;',
  fragDecl: 'varying float vFog;',
  fragMix: '  c = mix(c, vec3(0.0), vFog);',
  texDecl: 'varying vec3 vColor;',
  texSample: '  vec3 c = texture2D(uMap, vUv).rgb * vColor * vShade;',
});


export function lookVertex(opt = {}) {
  let s = ps1Vertex({ flash: true, ...opt });
  s = replaceLine(s, ANCHORS.shadeDecl, [ANCHORS.shadeDecl, ...INJECT.vertexDecls], 'vShade declaration');
  s = replaceLine(s, ANCHORS.clip, [ANCHORS.clip, INJECT.fog], 'the clip line');
  s = replaceLine(s, ANCHORS.fold, [INJECT.fold, INJECT.shadeOne], 'vColor = aColor');
  return s;
}


export function lookFragment(kind = 'colour') {
  const make = FRAGMENT[kind];
  if (!make) throw new Error(`lookShader: unknown fragment kind "${kind}"`);
  let s = make();
  s = replaceLine(s, ANCHORS.precision, [ANCHORS.precision, INJECT.fragDecl], 'precision');
  if (kind === 'textured') {
    s = replaceLine(s, ANCHORS.precision, [ANCHORS.precision, INJECT.texDecl], 'precision (textured)');
    s = replaceLine(s, ANCHORS.texSample, [INJECT.texSample], 'the texture sample');
  }
  s = replaceLine(s, ANCHORS.quant, [INJECT.fragMix, ANCHORS.quant], 'the quantise line');
  return s;
}







export function lookModeUniforms(mode, fog = FOG) {
  if (mode === 'intro') return { uFogNear: 9000, uFogFar: 9001, uPrelit: 0, uDim: LOOK_SHADE.introDim };
  if (mode === 'game') return { uFogNear: fog.near, uFogFar: fog.far, uPrelit: 1, uDim: LOOK_SHADE.keyTerm };
  throw new Error(`lookShader: unknown look mode "${mode}"`);
}







export const NATIVE_PATCH = `
--- a/web-engine/ps1/ps1Shader.mjs
+++ b/web-engine/ps1/ps1Shader.mjs
@@ ps1Vertex(opt = {})
-export function ps1Vertex(opt = {}) {
-  const flash = !!opt.flash;
+export function ps1Vertex(opt = {}) {
+  const flash = !!opt.flash;
+  const look = !!opt.look;   // fog + pre-lit vertices (FEH-40 D9)
   return [
     'uniform vec2 uRes;',
     ...
     'varying float vShade;',
+    ...(look ? [
+      '${INJECT.vertexDecls.join("', '")}',
+    ] : []),
     'void main() {',
     '  vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
+    ...(look ? ['${INJECT.fog.trim()}'] : []),
     ...
-    '  vColor = aColor;',
+    ...(look ? [
+      '${INJECT.fold.trim()}',
+      '${INJECT.shadeOne.trim()}',
+    ] : ['  vColor = aColor;']),
@@ ps1FragmentColour(opt = {}) / ps1FragmentTextured(opt = {})
     'precision mediump float;',
+    ...(look ? ['${INJECT.fragDecl}'] : []),
+    ...(look && textured ? ['${INJECT.texDecl}'] : []),
     ...
-    '  vec3 c = texture2D(uMap, vUv).rgb * vShade;', quantLine,
+    look ? '${INJECT.texSample.trim()}' : '  vec3 c = texture2D(uMap, vUv).rgb * vShade;',
+    ...(look ? ['${INJECT.fragMix.trim()}'] : []),
+    quantLine,
`;
