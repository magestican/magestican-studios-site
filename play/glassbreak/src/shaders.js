





const COMMON = `
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
float aastep(float e, float x) { float w = fwidth(x) * 0.75; return smoothstep(e - w, e + w, x); }
`;



export const OUTSIDE_ZOOM = 3.2;
export const OUTSIDE_LEVEL = 0.3;

export const BACK_VERT = `
varying vec2 vW;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xy;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

export const BACK_FRAG = `
uniform float uTime;
uniform float uMass;     // world y of the glass mass's bottom edge (0 = none)
uniform float uDanger;   // 0..1, how close the mass is to the deflector line
uniform float uLight;    // 0..1, a pulse of freed light
uniform vec3 uActTint;   // the act's colour
uniform sampler2D uArtA; // the act's Artist backdrop (src/backdrops.js), the one fading out
uniform sampler2D uArtB; // the one fading in
uniform float uArtMix;   // 0 = A, 1 = B
uniform float uArtOnA;   // 1 when A is loaded, 0 = the procedural city shows through
uniform float uArtOnB;
uniform float uArtDim;   // BACKDROP_DIM: the picture is dimmed so the panes read over it
varying vec2 vW;
${COMMON}
void main() {
  vec2 p = vW;
  float inField = step(0.0, p.x) * step(p.x, 720.0) * step(-1280.0, p.y) * step(p.y, 0.0);
  float h = clamp(-p.y / 1280.0, 0.0, 1.0); // 0 top, 1 bottom
  // the sky at dusk: violet night above, a last ember-orange band low over the roofs
  vec3 night = vec3(0.012, 0.01, 0.03);
  vec3 dusk = vec3(0.12, 0.04, 0.07);
  vec3 ember = vec3(0.7, 0.26, 0.08);
  vec3 col = mix(night, dusk, smoothstep(0.35, 0.95, h));
  col = mix(col, ember, smoothstep(0.86, 1.0, h) * 0.45);
  // stars, thin, only in the dark top
  vec2 sp = floor(p / 3.0);
  float st = step(0.996, hash(sp)) * (1.0 - h) * (0.6 + 0.4 * sin(uTime * 2.0 + hash(sp + 3.0) * 30.0));
  col += vec3(st) * 0.7;
  // the city: rooftops and spires along the bottom, with lit windows
  float cx = p.x / 26.0;
  float cell = floor(cx);
  float roof = -1280.0 + 30.0 + 70.0 * hash(vec2(cell, 1.0)) + 30.0 * step(0.85, hash(vec2(cell, 2.0)));
  float spire = step(0.9, hash(vec2(cell, 5.0))) * max(0.0, 1.0 - abs(fract(cx) - 0.5) * 4.0) * 70.0;
  float city = step(p.y, roof + spire);
  vec3 cityCol = vec3(0.025, 0.02, 0.04);
  vec2 wp = floor(vec2(p.x / 7.0, p.y / 11.0));
  float lit = step(0.82, hash(wp)) * step(p.y, roof - 14.0) * step(0.5, fract(p.x / 7.0)) * step(0.45, fract(p.y / 11.0));
  cityCol += lit * vec3(1.0, 0.68, 0.3) * (0.3 + 0.5 * uLight);
  col = mix(col, cityCol, city);
  // THE ACT'S PICTURE over the field (G-03): sky and city replaced by the act's Artist backdrop, dimmed, with the
  // freed-light pulse brightening it a little. Outside the field the procedural frame stays.
  vec2 auv = vec2(p.x / 720.0, 1.0 + p.y / 1280.0);
  vec3 artA = texture2D(uArtA, auv).rgb, artB = texture2D(uArtB, auv).rgb;
  float onA = uArtOnA * (1.0 - uArtMix), onB = uArtOnB * uArtMix;
  float on = clamp(onA + onB, 0.0, 1.0);
  vec3 art = (artA * onA + artB * onB) / max(on, 0.001);
  col = mix(col, art * uArtDim * (1.0 + 0.35 * uLight), on * inField);
  // G-20 (AAA audit 2026-11-24, GD-353): on a wide screen ~70 % of the view was this procedural pixel skyline, a
  // different look from the act's cel-toon picture in the field. Outside the field the SAME picture now runs on,
  // scaled up OUTSIDE_ZOOM times about the field's centre (so only its broad colour and light remain), and the frame
  // darkening below keeps the field the brightest thing. The procedural city still shows while no picture is loaded.
  vec2 ouv = clamp(vec2(0.5 + (p.x - 360.0) / (720.0 * ${OUTSIDE_ZOOM.toFixed(1)}),
    0.5 + (p.y + 640.0) / (1280.0 * ${OUTSIDE_ZOOM.toFixed(1)})), 0.001, 0.999);
  // a soft 9-tap blur (the pictures have no mipmaps): broad colour and light only, no detail to compete with play
  vec3 oA = vec3(0.0), oB = vec3(0.0);
  for (int i = 0; i < 9; i++) {
    float a = float(i) * 2.399;
    vec2 o = float(i > 0) * vec2(cos(a), sin(a) * 0.5625) * (0.006 + 0.004 * float(i));
    oA += texture2D(uArtA, clamp(ouv + o, 0.001, 0.999)).rgb;
    oB += texture2D(uArtB, clamp(ouv + o, 0.001, 0.999)).rgb;
  }
  vec3 outArt = (oA * onA + oB * onB) / (9.0 * max(on, 0.001));
  // darker the further from the field, so the eye is pulled back to the glass
  float away = clamp((abs(p.x - 360.0) - 360.0) / 900.0, 0.0, 1.0);
  outArt *= 1.0 - 0.6 * away;
  col = mix(col, outArt * ${OUTSIDE_LEVEL.toFixed(2)} * (1.0 + 0.25 * uLight), on * (1.0 - inField));
  // THE DUSK: a cold violet darkness from the top of the field down to the glass, thicker as the mass comes down
  if (uMass < 0.0) {
    float above = smoothstep(uMass - 40.0, 0.0, p.y);
    float fog = fbm(vec2(p.x / 140.0, p.y / 90.0 + uTime * 0.05));
    float dark = above * (0.3 + 0.5 * uDanger) * (0.5 + 0.9 * fog);
    // a visible violet murk, not black: the sky is already dark, so the Dusk must read by its colour and its motion
    col = mix(col, vec3(0.16, 0.03, 0.24), clamp(dark, 0.0, 0.8) * inField);
    col += vec3(0.25, 0.05, 0.35) * smoothstep(60.0, 0.0, abs(p.y - uMass)) * (0.3 + 0.7 * uDanger) * inField;
  }
  // outside the field: the stone frame and the street, darker, so the playfield reads
  float frame = 1.0 - inField;
  col *= mix(1.0, 0.45, frame);
  // the field's stone jamb: a thin warm edge
  // (only around the field's own rectangle: with the HUD band above it the top edge no longer sits at the screen edge)
  float inX = step(-6.0, p.x) * step(p.x, 726.0);
  float edge = min(min(abs(p.x), abs(p.x - 720.0)) + step(0.0, p.y) * 1e4, abs(p.y) + (1.0 - inX) * 1e4);
  col += vec3(0.6, 0.38, 0.2) * smoothstep(5.0, 0.0, edge) * 0.35 * step(-1280.0, p.y);
  col += uActTint * 0.05 * inField * (1.0 - h);
  col += vec3(1.0, 0.8, 0.5) * uLight * 0.05 * inField;
  gl_FragColor = vec4(col, 1.0);
}`;


export const GLASS_VERT = `
attribute vec2 iPos;
attribute vec2 iSize;
attribute float iKind;
attribute vec3 iTint;
attribute float iCrack;
attribute float iSeed;
attribute float iFlash;
varying vec2 vUv;
varying vec2 vSize;
varying float vKind;
varying vec3 vTint;
varying float vCrack;
varying float vSeed;
varying float vFlash;
void main() {
  vUv = position.xy + 0.5;
  vSize = iSize;
  vKind = iKind; vTint = iTint; vCrack = iCrack; vSeed = iSeed; vFlash = iFlash;
  vec2 w = iPos + position.xy * iSize * step(0.5, iKind);
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 0.0, 1.0);
}`;

export const GLASS_FRAG = `
uniform float uTime;
uniform float uGlow;  // overall light through the glass, 0..1
varying vec2 vUv;
varying vec2 vSize;
varying float vKind;
varying vec3 vTint;
varying float vCrack;
varying float vSeed;
varying float vFlash;
${COMMON}
float crackLines(vec2 p, float seed, float stage) {
  // star cracks from an impact point, spokes and one ring; more and longer with each stage
  vec2 c = vec2(0.3 + 0.4 * hash(vec2(seed, 1.0)), 0.3 + 0.4 * hash(vec2(seed, 2.0))) * vSize;
  vec2 d = p - c;
  float r = length(d);
  float a = atan(d.y, d.x);
  float n = 3.0 + stage * 2.0;
  float k = abs(fract(a / 6.2831 * n + hash(vec2(seed, 3.0))) - 0.5) * r * 6.2831 / n;
  float reach = vSize.x * (0.2 + 0.25 * stage);
  float spokes = (1.0 - aastep(0.7, k)) * step(r, reach);
  float ring = (1.0 - aastep(0.6, abs(r - reach * 0.45))) * step(1.5, stage);
  return max(spokes, ring);
}
void main() {
  int kind = int(vKind + 0.5);
  vec2 p = vUv * vSize;
  float dx = min(p.x, vSize.x - p.x), dy = min(p.y, vSize.y - p.y);
  float d = min(dx, dy);
  // lead came: a dark rounded bead round every pane, catching a warm highlight on its top edge
  float lead = 1.0 - aastep(4.2, d);
  vec3 leadCol = vec3(0.06, 0.055, 0.06) + vec3(0.3, 0.24, 0.16) * smoothstep(1.4, 0.0, abs(d - 2.0)) * step(vSize.y - p.y, 4.5);
  vec3 col;
  float alpha = 1.0;
  float shimmer = 0.5 + 0.5 * sin(uTime * 0.9 + vSeed * 6.0 + p.x * 0.05);
  if (kind == 1 || kind == 2) {
    // hand-blown glass: streaks, seeds (bubbles), a glow through the middle
    float streak = fbm(vec2(p.x / 9.0 + vSeed * 7.0, p.y / 30.0));
    float bubble = step(0.985, hash(floor(p / 2.5) + vSeed * 13.0));
    vec2 q = vUv - 0.5;
    float centre = 1.0 - dot(q, q) * 2.2;
    // deep, saturated colour at the edges, light pouring through the middle (the trapped daylight)
    vec3 deep = vTint * vTint * 0.55;
    col = mix(deep, vTint * 1.15, clamp(centre, 0.0, 1.0) * (0.55 + 0.6 * streak));
    col += vTint * uGlow * 0.5 * centre * centre;
    col += vec3(1.0) * bubble * 0.2;
    col += vec3(1.0, 0.95, 0.85) * smoothstep(0.8, 1.0, vUv.y) * 0.08 * shimmer;
    if (kind == 2) {
      // cathedral glass: deeper colour behind a fine diamond lattice of lead
      vec2 g = vec2(p.x / vSize.x * 3.0, p.y / vSize.y * 2.0);
      float l = min(abs(fract(g.x + g.y) - 0.5), abs(fract(g.x - g.y) - 0.5));
      col *= 0.85;
      col = mix(col, vec3(0.1, 0.09, 0.1), (1.0 - aastep(0.06, l)) * 0.9);
    }
  } else if (kind == 3) {
    // lead pane: dull grey metal with rivets
    col = vec3(0.3, 0.3, 0.33) * (0.7 + 0.4 * fbm(p / 6.0 + vSeed));
    vec2 rv = abs(vUv - 0.5) - vec2(0.36, 0.28);
    float rivet = 1.0 - aastep(2.2, length(max(abs(vec2(p.x - vSize.x * 0.15, p.y - vSize.y * 0.5)) * vec2(1.0, 1.0), 0.0)));
    rivet = max(rivet, 1.0 - aastep(2.2, length(vec2(p.x - vSize.x * 0.85, p.y - vSize.y * 0.5))));
    col += rivet * 0.35;
  } else if (kind == 4) {
    // iron grille: black iron bars, cross-hatched, no light through
    col = vec3(0.07, 0.07, 0.08);
    float bar = 1.0 - aastep(2.0, min(abs(p.x - vSize.x * 0.5), abs(p.y - vSize.y * 0.5)));
    float diag = 1.0 - aastep(1.4, abs(fract((p.x + p.y) / 14.0) - 0.5) * 14.0);
    col += vec3(0.22, 0.2, 0.2) * max(bar, diag * 0.5);
  } else if (kind == 5) {
    // mirror: silver with a moving sheen
    float sheen = smoothstep(0.1, 0.0, abs(fract(vUv.x - vUv.y * 0.6 + uTime * 0.15 + vSeed) - 0.5) - 0.05);
    col = mix(vec3(0.55, 0.6, 0.7), vec3(0.85, 0.9, 1.0), vUv.y) + sheen * 0.6;
  } else if (kind == 6) {
    // sun pane: gold with rays turning slowly round its centre, the brightest glass there is
    vec2 q = p - vSize * 0.5;
    float a = atan(q.y, q.x);
    float ray = 0.5 + 0.5 * sin(a * 8.0 + uTime * 1.5);
    col = vec3(1.0, 0.72, 0.2) * (0.9 + 0.6 * ray) + vec3(1.0, 0.95, 0.7) * smoothstep(12.0, 0.0, length(q));
  } else {
    // bead: a dark pane holding a glowing seed of a capsule
    vec2 q = p - vSize * 0.5;
    float r = length(q);
    col = vec3(0.12, 0.08, 0.16) + vec3(1.0, 0.85, 0.45) * smoothstep(9.0, 0.0, r) * (0.7 + 0.3 * shimmer);
  }
  if (vCrack > 0.5 && kind != 4) {
    float c = crackLines(p, vSeed * 17.0, vCrack);
    col = mix(col, vec3(1.0, 0.98, 0.9), c * 0.85);
    col *= 1.0 - 0.08 * vCrack;
  }
  col = mix(col, leadCol, lead);
  col += vec3(1.0, 0.95, 0.85) * vFlash * 0.8;
  gl_FragColor = vec4(col, alpha);
}`;


export const SHAPE_VERT = `
attribute vec2 iPos;
attribute vec2 iScale;
attribute float iRot;
attribute vec4 iColor;
attribute float iShape;
attribute vec2 iParam;
varying vec2 vP;
varying vec4 vColor;
varying float vShape;
varying vec2 vParam;
varying vec2 vScale;
void main() {
  vP = position.xy * 2.0;
  vColor = iColor; vShape = iShape; vParam = iParam; vScale = iScale;
  float c = cos(iRot), s = sin(iRot);
  vec2 l = position.xy * iScale;
  vec2 w = iPos + vec2(c * l.x - s * l.y, s * l.x + c * l.y);
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 0.0, 1.0);
}`;

export const SHAPE_FRAG = `
uniform float uTime;
uniform float uAdd; // 1 = additive batch (output premultiplied light)
varying vec2 vP;
varying vec4 vColor;
varying float vShape;
varying vec2 vParam;
varying vec2 vScale;
${COMMON}
float sdBox(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
float sdTri(vec2 p) { // a sharp shard
  p.x = abs(p.x);
  return max(p.x * 0.94 + p.y * 0.34, -p.y) - 0.5;
}
float fill(float sd) { return 1.0 - aastep(0.0, sd); }
vec3 tintOf(float i) { return i < 0.5 ? vec3(1.0, 0.31, 0.48) : i < 1.5 ? vec3(0.37, 0.83, 0.42) : vec3(0.25, 0.55, 1.0); }
void main() {
  int k = int(vShape + 0.5);
  vec2 p = vP; // -1..1 across the quad
  vec3 col = vColor.rgb;
  float a = 0.0;
  float r = length(p);
  if (k == 0) {        // soft glow (ember halo, sparks, bolts)
    a = pow(max(0.0, 1.0 - r), 2.2);
  } else if (k == 1) { // glass shard: hard triangle with a bright edge
    float sd = sdTri(p * vec2(1.0, 1.0));
    a = fill(sd);
    col += vec3(0.6) * (1.0 - aastep(0.12, abs(sd))) ;
  } else if (k == 2) { // light shaft: soft across, fading up
    a = pow(max(0.0, 1.0 - abs(p.x)), 2.0) * smoothstep(-1.0, -0.6, p.y) * (1.0 - smoothstep(-0.2, 1.0, p.y) * 0.85);
  } else if (k == 3) { // ring wave
    a = pow(max(0.0, 1.0 - abs(r - 0.82) * 7.0), 2.0);
  } else if (k == 4) { // ember core: white-hot centre in its colour
    a = smoothstep(1.0, 0.7, r);
    col = mix(col, vec3(1.0, 0.98, 0.92), smoothstep(0.75, 0.0, r));
  } else if (k == 10) { // deflector: a brass bar with the tint gem in the middle
    vec2 q = p * vScale * 0.5;
    float sd = sdBox(q, vScale * 0.5 - 0.5, vScale.y * 0.45);
    a = fill(sd);
    float y = p.y * 0.5 + 0.5;
    vec3 brass = mix(vec3(0.45, 0.28, 0.1), vec3(1.0, 0.82, 0.45), smoothstep(0.0, 1.0, y));
    brass += vec3(1.0, 0.95, 0.8) * smoothstep(0.08, 0.0, abs(y - 0.78)) * 0.6;
    float gem = fill(length(vec2(q.x / 1.6, q.y)) - vScale.y * 0.38);
    float pulse = 0.8 + 0.2 * sin(uTime * 6.0);
    col = mix(brass, col * pulse * 1.6 + 0.15, gem);
    // the tint stripes at the ends
    float ends = step(vScale.x * 0.5 - 12.0, abs(q.x));
    col = mix(col, vColor.rgb * 1.1, ends * 0.6);
    if (vParam.x > 0.5) col *= 0.45; // stunned
  } else if (k == 11) { // leadling: a soot-grey blob with a white-hot soldering tip
    float body = fill(length(p * vec2(1.0, 1.15) + vec2(0.0, 0.1)) - 0.72);
    float eye = fill(length(vec2(abs(p.x) - 0.26, p.y + 0.05)) - 0.13);
    float tip = fill(length(p - vec2(0.0, 0.82)) - 0.18);
    a = max(body, tip);
    col = mix(vec3(0.25, 0.24, 0.27) * (0.7 + 0.5 * (0.5 - p.y * 0.5)), vec3(1.0, 0.85, 0.4), max(eye, tip));
  } else if (k == 12) { // moth: two dusty wings that beat
    float beat = 0.75 + 0.25 * sin(uTime * 22.0 + vParam.y);
    vec2 q = vec2(abs(p.x) / beat, p.y);
    float wing = fill(length((q - vec2(0.48, 0.05)) * vec2(1.0, 1.4)) - 0.48);
    float body = fill(length(p * vec2(4.0, 1.2)) - 0.6);
    a = max(wing, body);
    col = mix(vec3(0.82, 0.75, 0.62) * (0.8 + 0.4 * noise(p * 6.0)), vec3(0.2, 0.15, 0.1), body);
    col = mix(col, vec3(0.15, 0.12, 0.1), fill(length(q - vec2(0.5, 0.1)) - 0.12));
  } else if (k == 13) { // shardling: a violet crystal of spikes
    float ang = atan(p.y, p.x);
    float spikes = 0.55 + 0.35 * pow(abs(cos(ang * 2.5 + uTime * 0.6)), 6.0);
    a = fill(r - spikes);
    col = mix(vec3(0.35, 0.15, 0.6), vec3(0.85, 0.6, 1.0), smoothstep(spikes, 0.0, r));
    col += vec3(1.0) * fill(length(p) - 0.14) * 0.6;
  } else if (k == 14) { // warden: an iron shield with a lit visor
    float sd = max(sdBox(p, vec2(0.7, 0.55), 0.25), length(p - vec2(0.0, 0.25)) - 1.0);
    a = fill(sd);
    col = vec3(0.32, 0.33, 0.38) * (0.8 + 0.3 * p.y);
    col = mix(col, vec3(1.0, 0.75, 0.3), fill(sdBox(p - vec2(0.0, 0.15), vec2(0.45, 0.06), 0.05)));
    col = mix(col, vec3(0.6, 0.62, 0.7), 1.0 - aastep(0.06, abs(sd + 0.06)));
  } else if (k == 15) { // bell: bronze, swinging
    vec2 q = p;
    q.x += sin(uTime * 3.0 + vParam.y) * 0.08 * (1.0 - p.y);
    float w = mix(0.35, 0.78, smoothstep(0.7, -0.6, q.y));
    float sd = max(abs(q.x) - w, abs(q.y) - 0.78);
    a = fill(sd);
    float clap = fill(length(q - vec2(0.0, -0.82)) - 0.14);
    a = max(a, clap);
    col = mix(vec3(0.5, 0.3, 0.12), vec3(0.95, 0.7, 0.35), 0.5 + 0.5 * q.x);
    col = mix(col, vec3(1.0, 0.9, 0.6), vParam.x); // glows before it rings
  } else if (k == 16) { // boss core: a rose window turning, petals in all three tints, an eye at its heart
    float ang = atan(p.y, p.x) + uTime * 0.25;
    float pet = floor((ang / 6.2831 + 0.5) * 12.0);
    float m = mod(pet, 3.0);
    vec3 glass = tintOf(m) * (0.6 + 0.5 * noise(p * 5.0 + pet));
    float spoke = 1.0 - aastep(0.05, abs(fract((ang / 6.2831 + 0.5) * 12.0) - 0.5) * r);
    float rings = 1.0 - aastep(0.035, abs(r - 0.55));
    a = fill(r - 1.0);
    col = mix(glass, vec3(0.08), max(spoke, rings));
    float eye = fill(r - 0.22);
    col = mix(col, vec3(1.0, 0.93, 0.8) * (1.2 + 0.4 * sin(uTime * 4.0)), eye);
    col = mix(col, vec3(0.06), fill(length(p * vec2(2.5, 1.0)) - 0.12));
    col = mix(col, vec3(0.1), 1.0 - aastep(0.05, abs(r - 0.97)));
    col *= mix(0.55, 1.0, vParam.x); // darker as it weakens
    col += vec3(1.0) * vParam.y;     // hit flash
  } else if (k == 17) { // boss guard: a small pane on the orbit
    float sd = sdBox(p, vec2(0.85), 0.2);
    a = fill(sd);
    col = mix(col * (0.7 + 0.4 * noise(p * 4.0 + vParam.y)), vec3(0.1), 1.0 - aastep(0.12, abs(sd + 0.1)));
    if (vParam.x > 0.5) col = mix(col, vec3(1.0), 0.35);
  } else if (k == 18) { // capsule: a lantern pill with a glyph of its kind
    float sd = sdBox(p, vec2(0.95, 0.55), 0.5);
    a = fill(sd);
    col = mix(col * 0.65, col * 1.2, 0.5 + 0.5 * p.y);
    float g = 0.0;
    int kind = int(vParam.x + 0.5);
    vec2 q = p * vec2(1.0, 1.7);
    if (kind == 0) g = fill(sdBox(q, vec2(0.6, 0.12), 0.1));                                   // wide
    else if (kind == 1) g = fill(min(length(q - vec2(0.3, 0.0)), length(q + vec2(0.3, 0.0))) - 0.2); // twin
    else if (kind == 2) g = 1.0 - aastep(0.06, abs(length(q) - 0.35));                         // slow
    else if (kind == 3) g = fill(min(sdBox(q - vec2(0.25, 0.0), vec2(0.06, 0.45), 0.03), sdBox(q + vec2(0.25, 0.0), vec2(0.06, 0.45), 0.03))); // lance
    else if (kind == 4) g = 1.0 - aastep(0.07, abs(length(q - vec2(0.0, 0.15)) - 0.3)) * step(q.y, 0.15); // catch
    else if (kind == 5) g = fill(sdBox(q + vec2(0.0, 0.25), vec2(0.65, 0.07), 0.05));          // shield
    else g = fill(length(q) - 0.25 - 0.12 * cos(atan(q.y, q.x) * 5.0));                       // light
    col = mix(col, vec3(1.0, 0.98, 0.9), g);
    col = mix(col, vec3(0.15, 0.1, 0.05), 1.0 - aastep(0.08, abs(sd + 0.06)));
  } else if (k == 20) { // the Abbess's echo: a mirror bar across the top
    vec2 q = p * vScale * 0.5;
    float sd = sdBox(q, vScale * 0.5 - 0.5, vScale.y * 0.4);
    a = fill(sd);
    float sheen = smoothstep(0.08, 0.0, abs(fract(p.x * 0.5 + uTime * 0.4) - 0.5) - 0.04);
    col = mix(vec3(0.5, 0.55, 0.7), vec3(0.95, 0.97, 1.0), 0.5 + 0.5 * p.y) + sheen * 0.5;
    col = mix(col, vec3(0.6, 0.2, 0.9), fill(length(vec2(q.x / 2.2, q.y)) - vScale.y * 0.3));
  } else if (k == 21) { // a glowing line (shield, danger)
    a = pow(max(0.0, 1.0 - abs(p.y)), 3.0) * smoothstep(1.0, 0.9, abs(p.x));
  }
  a *= vColor.a;
  if (a <= 0.003) discard;
  if (uAdd > 0.5) gl_FragColor = vec4(col * a, a);
  else gl_FragColor = vec4(col, a);
}`;
