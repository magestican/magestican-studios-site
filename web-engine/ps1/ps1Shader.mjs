





















import { NEAR_W, CULL_NDC } from './ps1Snap.mjs';












export const KEY_DIR = Object.freeze([-0.42, 0.80, 0.60]);   
export const FILL_DIR = Object.freeze([0.55, -0.35, -0.45]); 


export const SHADE = Object.freeze({ ambient: 0.72, key: 0.40, fill: 0.12 });



export const QUANT_LEVELS = 31.0;






const quantLine = `  c = floor(clamp(c, 0.0, 1.0) * ${QUANT_LEVELS.toFixed(1)} + 0.5) / ${QUANT_LEVELS.toFixed(1)};`;






































export function ps1Vertex(opt = {}) {
  const flash = !!opt.flash;
  return [
    'uniform vec2 uRes;',
    'uniform vec3 uKey;',
    'uniform vec3 uFill;',
    ...(flash ? [
      'uniform vec3 uFlashPos;',   
      'uniform float uFlash;',     
      'uniform float uDim;',       
    ] : []),
    'attribute vec3 aColor;',
    'varying vec3 vColor;',
    'varying vec2 vUv;',
    'varying float vShade;',
    'void main() {',
    '  vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
    
    
    
    
    
    
    '  vec3 n = normalize(normalMatrix * normal);',
    '  float key = max(0.0, dot(n, normalize(uKey)));',
    '  float fill = max(0.0, dot(n, normalize(uFill)));',
    `  vShade = ${SHADE.ambient.toFixed(2)} + ${SHADE.key.toFixed(2)} * key + ${SHADE.fill.toFixed(2)} * fill;`,
    ...(flash ? [
      
      '  vShade *= uDim;',
      
      
      
      
      
      '  vec3 wp = (modelMatrix * vec4(position, 1.0)).xyz;',
      '  vec3 wn = normalize(mat3(modelMatrix) * normal);',
      '  vec3 toFlash = uFlashPos - wp;',
      '  float fd = length(toFlash);',
      '  float lam = max(0.0, dot(wn, toFlash / max(fd, 0.001)));',
      '  vShade += uFlash * lam * 6.0 / (1.0 + fd * fd * 0.30);',
    ] : []),
    '  vColor = aColor;',
    '  vUv = uv;',
    
    
    
    
    
    
    
    
    
    
    
    
    
    `  if (!(clip.w > ${NEAR_W.toExponential()})) {`,
    
    
    
    `    gl_Position = vec4(${CULL_NDC.x.toFixed(1)}, ${CULL_NDC.y.toFixed(1)}, ${CULL_NDC.z.toFixed(1)}, 1.0);`,
    '    return;',
    '  }',
    
    
    
    
    
    '  vec3 ndc = clip.xyz / clip.w;',
    '  vec2 px = floor((ndc.xy * 0.5 + 0.5) * uRes + 0.5);',
    '  ndc.xy = (px / uRes) * 2.0 - 1.0;',
    '  gl_Position = vec4(ndc, 1.0);',
    '}',
  ].join('\n');
}


export function ps1FragmentColour() {
  return [
    'precision mediump float;',
    
    
    
    
    
    'varying vec3 vColor;', 'varying float vShade;',
    'uniform float uAlpha;',
    'void main() {',
    '  vec3 c = vColor * vShade;', quantLine,
    '  gl_FragColor = vec4(c, uAlpha);',
    '}',
  ].join('\n');
}


export function ps1FragmentTextured() {
  return [
    'precision mediump float;',
    'uniform sampler2D uMap;',
    'uniform float uAlpha;',
    
    
    
    
    'varying float vShade;', 'varying vec2 vUv;',
    'void main() {',
    '  vec3 c = texture2D(uMap, vUv).rgb * vShade;', quantLine,
    '  gl_FragColor = vec4(c, uAlpha);',
    '}',
  ].join('\n');
}







export function ps1FragmentGhost() {
  return [
    'precision mediump float;',
    
    
    
    'varying vec3 vColor;',
    'uniform float uAlpha;',
    'void main() {',
    '  vec3 c = vColor * 0.12;', quantLine,
    '  gl_FragColor = vec4(c, uAlpha);',
    '}',
  ].join('\n');
}

export const FRAGMENT = Object.freeze({
  colour: ps1FragmentColour,
  textured: ps1FragmentTextured,
  ghost: ps1FragmentGhost,
});
