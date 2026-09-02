








import * as THREE from 'three';






import {
  hazardMarkers, inSpan, chasmDepthAt, waterPlaneY, bankAt, crossesRoad,
} from 'arbelo/trackHazards';
import { lungePhase } from 'arbelo/trackGlides';
import { lavaRise } from 'arbelo/trackTerrain';
import { sampleAt, nearestOnPath } from 'arbelo/trackPath';
import { isWaterAt, vergeRamp } from 'arbelo/trackGround';
import { surface, NOISE_GLSL, WAVE_GLSL, skyPalette, getQuality } from './materials.js';



import { sunDirFor } from './world.js';
import { themeOf } from './themes.js';
import { PALETTE } from '../palette.js';
import { SHOULDER, groundMeshHeightAt } from './trackMesh.js';



import { boatBeam } from '../../../../web-engine/render/boatSpec.js';
import { vehicleFor } from '../../../../web-engine/kart/vehicles.js';












const WATER_REACH = 90;
















const WATER_COLS = 8;


























const WET_MARGIN = 0.23;























const CROSSING_PAD = 18;

const clamp01 = (v) => (v < 0 ? 0 : (v > 1 ? 1 : v));
const smooth01 = (v) => { const u = clamp01(v); return u * u * (3 - 2 * u); };













function wetArc(path, zone) {
  const span = zone.to >= zone.from ? zone.to - zone.from : (1 - zone.from) + zone.to;
  const from = zone.from * path.length;
  let first = null;
  let last = null;
  for (let d = 0; d <= span * path.length; d += 0.5) {
    const p = sampleAt(path, (from + d) % path.length);
    if (!isWaterAt(waterPlaneY(zone, p.y ?? 0), p.y ?? 0)) continue;
    if (first == null) first = from + d;
    last = from + d;
  }
  return first == null ? null : { from: first, to: last };
}









export const WASH_STRENGTH = 0.55;







































































export function buildWaterMaterial(theme = 'summer', {
  frozen = false, sky = 'day', sunDir = null, low = false, wetMargin = 0,
} = {}) {
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const BODY_DROP = 0.74;
  const { deep, shallow, foam } = themeOf(theme).water;
  const skyCols = skyPalette(sky);
  
  
  
  
  
  const sun = (sunDir ?? sunDirFor(theme)).clone().normalize();
  const uniforms = {
    uDeep: { value: new THREE.Color(deep).multiplyScalar(BODY_DROP) },
    uShallow: { value: new THREE.Color(shallow).multiplyScalar(BODY_DROP) },
    
    
    
    uFoam: { value: new THREE.Color(foam) },
    uCrack: { value: new THREE.Color(0x9fc4d8) },
    uSkyTop: { value: new THREE.Color(skyCols.top) },
    uSkyHorizon: { value: new THREE.Color(skyCols.horizon) },
    uHaze: { value: new THREE.Color(skyCols.haze) },
    uTime: { value: 0 },
    uSun: { value: sun },
    uFrozen: { value: frozen ? 1 : 0 },
    
    
    
    
    uWetMargin: { value: wetMargin },
    
    uWaveScale: { value: frozen ? 0.08 : 1 },
    
    
    
    
    
    uBoats: { value: [
      new THREE.Vector4(0, 0, 0, 0), new THREE.Vector4(0, 0, 0, 0),
      new THREE.Vector4(0, 0, 0, 0), new THREE.Vector4(0, 0, 0, 0),
    ] },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    
    
    
    
    
    
    
    
    depthWrite: false,
    
    
    
    
    
    
    side: THREE.DoubleSide,
    vertexShader: `
      uniform float uTime, uWaveScale, uWetMargin;
      attribute float edge;
      varying vec2 vWorld;
      varying float vEdge;      // 0 at the bank, 1 out in the middle
      varying float vAmp;       // the tapered wave amplitude scale here
      varying vec3 vPos;
      ${WAVE_GLSL}
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vEdge = edge;
        // THE WAVE FADES TO NOTHING AT THE BANK. The ribbon's inner edge is
        // welded to the carved ground by waterlineInner(), which marches out
        // until the bed is genuinely below the surface; a crest lifting that
        // edge would show daylight under the water against the shore, which is
        // the one place a player is looking when they decide whether to commit.
        //
        // AND THE TAPER IS LONGER ON A CROSSING, because there "edge" is a
        // measured DEPTH rather than a distance from a bank (see buildWater).
        // 0.06 of a 1.5 m reference is 9 cm of water, and the three trains sum
        // to 0.34 m of displacement in phase - so a full-amplitude swell in the
        // shallows of a ford would put the drawn surface through the road. 0.30
        // is 45 cm, which is deeper than the trough can reach.
        float ampEdge = uWetMargin > 0.0 ? 0.30 : 0.06;
        float amp = smoothstep(0.0, ampEdge, edge) * uWaveScale;
        vec3 n;
        // Swell in full, chop at half, ripple not at all: see the note below on
        // what this tessellation can actually represent.
        float h = waveAt(world.xz, uTime, vec3(amp, amp * 0.5, 0.0), n);
        world.y += h;
        // THE NORMAL IS NOT PASSED DOWN FROM HERE, and that was the first
        // design's mistake. The ribbon reaches WATER_REACH (90 m) out from the
        // bank over WATER_COLS (8) columns, so a vertex every ~11 m - which can
        // represent the 26 m swell and CANNOT represent the 7.4 m chop or the
        // 2.1 m ripple at all. A normal sampled at 11 m intervals and
        // interpolated across the gap aliases those two into noise, and the
        // measured cost of that was real: the surface had to have world-space
        // colour grain pushed back up to 0.082 to recover its local contrast,
        // and at that level the lagoon looked like television static again -
        // exactly the defect this shader was written to remove.
        //
        // So only the displacement happens here (the swell is the only train the
        // tessellation can carry), and the normal is evaluated PER FRAGMENT from
        // the same function. Six sines and six cosines a fragment, for chop and
        // ripple detail that is correct at every distance instead of aliased.
        vAmp = amp;
        vWorld = world.xz;
        vPos = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform vec3 uDeep, uShallow, uFoam, uSun, uSkyTop, uSkyHorizon, uHaze, uCrack;
      uniform float uTime, uFrozen, uWetMargin;
      uniform vec4 uBoats[4];
      varying vec2 vWorld;
      varying float vEdge;
      varying float vAmp;
      varying vec3 vPos;
      ${low ? '#define FK_LOW 1' : ''}
      ${NOISE_GLSL}
      ${WAVE_GLSL}

      // THE SKY, IN CLOSED FORM. The same three colours and the same 0.42
      // exponent buildSkyMaterial uses, so the reflection cannot show a
      // different sky from the one overhead - which is the two-suns failure in
      // its other form, and this game has already shipped that once.
      vec3 skyAlong(vec3 d) {
        vec3 col = mix(uSkyHorizon, uSkyTop, pow(clamp(d.y, 0.0, 1.0), 0.42));
        return mix(uHaze, col, smoothstep(-0.10, 0.06, d.y));
      }

      void main() {
        // The ribbon is double sided, so half the quads on a two-sided zone
        // present their back face and would light upside down. The surface is
        // horizontal by construction, so flipping to the upward normal is exact
        // rather than a fudge.
        // The wave, re-evaluated here. See the long note in the vertex shader:
        // the tessellation cannot carry the chop or the ripple, so their normals
        // have to be computed at the fragment or they are not there at all.
        vec3 wn;
        // THE SHORT WAVES FADE OUT WITH DISTANCE. A band of wavelength L is
        // below one sample per wavelength once it is roughly 22 L from the
        // camera, and past that it does not add detail, it prints MOIRE: the
        // first per-fragment version of this shader laid a regular corduroy
        // weave across the middle distance of the lagoon, which reads as fabric
        // and is worse than the flat plane it replaced. So the ripple (2.1 m) is
        // gone by about 46 m, the chop (7.4 m) by about 163 m, and the swell
        // (26 m) survives past the far bank of any zone on the roster.
        float dist = length(cameraPosition - vPos);
        vec3 band = vAmp * vec3(
          1.0,
          1.0 - smoothstep(7.4 * 9.0, 7.4 * 22.0, dist),
          1.0 - smoothstep(2.1 * 9.0, 2.1 * 22.0, dist));
        float h = waveAt(vWorld, uTime, band, wn);
        // NORMALISED TO -1..1, and the 0.34 is not a magic number: it is the sum
        // of WAVE_GLSL's three amplitudes (0.22 + 0.09 + 0.03), i.e. the peak
        // the three trains can reach in phase. The first cut divided by the
        // scale alone, so this topped out at 0.34 and the crest foam -
        // thresholded at 0.45 - could never fire at all. It still rendered
        // whitewater, because that was the SPECULAR blowing out: a completely
        // different bug that the same screenshot hid.
        float vCrest = vAmp > 0.0 ? h / max(vAmp * 0.34, 0.0001) : 0.0;
        vec3 N = normalize(wn);
        if (N.y < 0.0) N = -N;
        vec3 V = normalize(cameraPosition - vPos);

        // -- boat wash ---------------------------------------------------
        // A shallow bowl under each hull and a foam rim around it. b.z is the
        // radius and b.w the strength; an empty slot has radius 0 and is
        // skipped, because a zero radius is a division by zero in the falloff.
        float rim = 0.0;
        #ifndef FK_LOW
        for (int i = 0; i < 4; i++) {
          vec4 b = uBoats[i];
          if (b.z <= 0.0) continue;
          vec2 to = vWorld - b.xy;
          float d = length(to);
          if (d > b.z * 1.6) continue;
          // The bowl tilts the normal outward, which is what makes the
          // depression catch a different piece of sky from the water round it -
          // the only reason it is visible at all on a surface with no shadow.
          float slope = b.w * (1.0 - smoothstep(0.0, b.z, d)) * 0.9;
          N = normalize(N + vec3(to.x, 0.0, to.y) / max(d, 0.001) * slope);
          // A ring of foam just outside the hull.
          rim = max(rim, b.w * (1.0 - smoothstep(b.z * 0.72, b.z * 1.45, d))
                              * smoothstep(b.z * 0.30, b.z * 0.80, d));
        }
        #endif

        // -- body ---------------------------------------------------------
        vec3 body = mix(uShallow, uDeep, smoothstep(0.0, 0.55, vEdge));
        // The colour-space noise the flat shader used, kept and quietened. It
        // is no longer carrying the whole effect, so it no longer has to be
        // strong enough to read on its own - at the old 0.045 over a lit
        // surface it goes back to reading as static.
        float n1 = 0.5;
        float grain = 0.0;
        #ifndef FK_LOW
        n1 = vnoise(vWorld * 0.9 + vec2(uTime * 0.55, uTime * 0.22));
        float n2 = vnoise(vWorld * 2.3 - vec2(uTime * 0.31, uTime * 0.74));
        grain = (n1 - 0.5) * 1.25 + (n2 - 0.5) * 0.75;
        #endif

        // -- Fresnel over the reflected sky --------------------------------
        // SCHLICK, F0 = 0.02, which is water's real normal-incidence
        // reflectance. The whole shape of the effect is in the grazing term:
        // straight down the water is nearly transparent and you see its colour;
        // along it - which is the chase camera's angle, 10 to 20 degrees - it is
        // a mirror. That difference across one surface is contrast the flat
        // shader could not produce at any exposure.
        float ndv = max(dot(N, V), 0.0);
        float fres = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);
        vec3 refl = skyAlong(reflect(-V, N));
        // Ice is a rough mirror: the reflection is there but it is scattered,
        // so it is mixed toward the haze rather than being a clean sky.
        refl = mix(refl, mix(refl, uHaze, 0.45), uFrozen);
        // A COLOURED MIRROR, NOT A MIRROR, and this is the one place the shader
        // is deliberately not physical. Schlick run straight puts fres at 1.0 at
        // grazing, and the eye height this game is played at is grazing over
        // almost the whole surface - so the first render came back with the
        // lagoon as a sheet of pale sky from bank to bank. That is physically
        // right and it is wrong twice over here: it throws away the DARK-water
        // cue that tells a player where the hazard is (the note at the top of
        // this file about Frostfield's meltwater is the same lesson), and it
        // moves the surface straight back into the flat 90-170 band.
        //
        // So the reflection is tinted 0.30 toward the body colour and its share
        // is capped at REFLECT_MAX. Cartoon water in every game that has ever
        // looked good does this; the alternative is a mirror floor.
        const float REFLECT_MAX = 0.66;
        // Tinted with the SHALLOW colour rather than the deep one, and by a lot.
        // The first tint used uDeep + 0.55, which on Muddy Bottom is a
        // desaturated grey-teal (0.63, 0.72, 0.71) - so every crest went milky
        // and the whole lagoon read as dishwater. Multiplying by the shallow
        // colour keeps the HUE in the reflection, which is the thing that has to
        // survive: a lagoon that goes grey at the crests loses the blue-green
        // separation from the grass that the note at the top of this file
        // records buying at some cost.
        refl = mix(refl, refl * (uShallow * 2.1), 0.45);
        vec3 col = mix(body, refl, fres * REFLECT_MAX * mix(1.0, 0.72, uFrozen));

        // THE GRAIN, WEIGHTED TOWARD GRAZING, and this is a measurement talking
        // rather than a preference. The old flat shader added this same value
        // noise to the colour at 0.045 and nothing else; because it is in WORLD
        // space, at a grazing angle it compresses to roughly one noise cell per
        // pixel and reads as television static - but it also scored a high
        // localContrast, which is the "plain" number FROZEN CONTRACTS clause 6
        // says to move. Measured on the lagoon at 1.6 m eye height: the flat
        // shader read 4.82 and this shader at grain 0.022 read 3.76, so the
        // rewrite LOST local contrast on the one axis it was supposed to gain
        // it, while plainly looking better.
        //
        // Both things are true. Fine-scale break-up is real and belongs here;
        // it just must not be the whole effect. Weighting it by (1 - N.V)
        // squared puts it where a real surface shows most texture - along the
        // surface, which is the chase camera's angle - and takes it out of the
        // overhead view, where the waves and the sparkle are already carrying
        // the frame (that shot measured 8.67 flat and 10.02 here).
        col += grain * mix(0.014, 0.052, pow(1.0 - ndv, 2.0));

        // -- caustics, and ONLY in the shallows of a crossing ---------------
        //
        // WHAT A FORD LOOKS LIKE FROM A KART IS THE BOTTOM OF IT. Standing
        // water over a hard pale bed throws the sun back as a moving net of
        // bright lines; it is the single most recognisable thing about shallow
        // water in sunlight, and it is the one cue a lake beside a road has no
        // use for and a road you are driving THROUGH does.
        //
        // IT IS ALSO WHAT THE LOOK PROBE IS ASKING FOR. Measured 2026-08-31 by
        // deleting the ford's water and leaving its road dip in place, the
        // drawn pool cost the frame 0.11 of localContrast (3.13 -> 3.02) - it
        // replaces tarmac, which carries tyre marks and grain, with a large
        // calm surface. Some of that is honest: water IS flatter than tarmac.
        // The part that is not honest is the shallows, where a real ford is at
        // its BUSIEST and this shader had nothing at all.
        //
        // Two sine trains 39 degrees apart at 3.5 m and 2.6 m, thresholded by
        // the classic 1 - |a*b| so the bright set is the lines where either
        // train crosses zero rather than a lattice of dots. Faded out past 30 m
        // for the same reason the 2.1 m ripple is (below one sample per
        // wavelength prints moire, and this repo has shipped that once), and
        // faded out below 0.93 m of depth, which is where the bed stops being
        // visible through the body colour anyway.
        #ifndef FK_LOW
        // A QUARTER OF IT SURVIVES THE DEEP END. The first cut faded the
        // caustic out completely by 0.93 m and the deep middle of the pool went
        // back to being the flat sheet this is here to break up - measured on
        // the preview page, the drawn water was worth -0.26 of localContrast at
        // the mid-pool pose and +0.29 at the exit, which is exactly the shape
        // of "detail in the shallows, nothing in the deep".
        float cfade = (1.0 - smoothstep(40.0, 115.0, dist))
                    * (1.0 - 0.76 * smoothstep(0.10, 1.00, vEdge))
                    * step(0.0001, uWetMargin) * (1.0 - uFrozen);
        if (cfade > 0.0) {
          // DOMAIN-WARPED, AND THAT IS NOT POLISH. Two clean sine trains
          // thresholded this way print GRAPH PAPER: photographed on
          // 2026-08-31, the pool came back with a regular cyan crosshatch
          // across it, which is the same failure the fragment ripple had when
          // it laid a corduroy weave over the lagoon. Pushing the sample point
          // around with a few metres of the value noise the body colour already
          // computes turns the lattice into a wandering net, which is what
          // light through moving water actually does, for two noise lookups.
          vec2 warp = vec2(vnoise(vWorld * 0.11 + uTime * 0.05),
                           vnoise(vWorld * 0.13 - uTime * 0.04)) - 0.5;
          vec2 cw = vWorld + warp * 7.0;
          vec2 c0 = vec2(0.9336, 0.3583);
          vec2 c1 = vec2(0.5000, 0.8660);
          float ca = sin(dot(cw, c0) * 1.795 + uTime * 1.7);
          float cb = sin(dot(cw, c1) * 2.417 - uTime * 1.3);
          col += uFoam * pow(max(0.0, 1.0 - abs(ca * cb)), 5.0) * 0.15 * cfade;
        }
        #endif

        // -- the sun ---------------------------------------------------------
        // Blinn-Phong at exponent 220 against uSun, which is the KEY LIGHT'S OWN
        // direction. On ice it drops to 26 and dims, because a frozen surface is
        // matte where a wet one is a mirror.
        //
        // THE MICRO-RIPPLE IS WHAT MAKES THIS A SPARKLE AND NOT A SHEET, and the
        // first render is why it exists. Without it, the 26 m swell sweeps the
        // surface normal smoothly through the mirror direction across a band
        // tens of metres wide, so the whole sun path blew out to white - the
        // 78 m tile came back with the near half of the lagoon as one flat white
        // sheet, which is worse than the flat plane it replaced. Real sun
        // glitter is bright and SPARSE because a real surface has centimetre
        // ripples on top of the swell.
        //
        // Two more sine trains, amplitudes 0.012 m at 0.9 m and 0.005 m at
        // 0.35 m, give slopes of a*2*pi/L = 0.084 and 0.090 radians - about 10
        // degrees of jitter combined. The exponent-220 lobe is roughly
        // sqrt(2/220) = 0.095 rad half-width, so the jitter is comfortably wider
        // than the highlight and chops it into points. Six trig ops, and it
        // costs nothing in the vertex stage because it never displaces anything.
        vec2 m0 = vec2(0.6018, 0.7986);
        vec2 m1 = vec2(-0.4695, 0.8829);
        float mk0 = 6.9813;   // 2*pi / 0.9
        float mk1 = 17.9520;  // 2*pi / 0.35
        float mp0 = dot(vWorld, m0) * mk0 + uTime * 3.1 * mk0 * 0.35;
        float mp1 = dot(vWorld, m1) * mk1 - uTime * 1.9 * mk1 * 0.35;
        float ms0 = 0.0060 * mk0 * cos(mp0);
        float ms1 = 0.0026 * mk1 * cos(mp1);
        // Off on ice - a frozen surface has no centimetre ripples - and faded
        // out at the bank, where the wave itself is already tapered to nothing
        // so a jittering normal there would sparkle on a surface that is flat.
        float micro = (1.0 - uFrozen) * smoothstep(0.0, 0.06, vEdge);
        vec3 Ns = normalize(N + vec3(
          -(ms0 * m0.x + ms1 * m1.x), 0.0, -(ms0 * m0.y + ms1 * m1.y)) * micro);
        vec3 H = normalize(V + uSun);
        float spec = pow(max(dot(Ns, H), 0.0), mix(220.0, 26.0, uFrozen));
        // AND THE PATH IS SPARSE. Even with the ripple jitter, every fragment in
        // the sun's path satisfies the mirror condition somewhere in its own
        // 3-pixel footprint at 1264x625, so the glitter averaged back up to a
        // continuous white smear across the middle distance - visible in the
        // second render of this shader and no better than the sheet in the
        // first. Real glitter is sparse because only some facets are aimed
        // right. n1 is the noise field the body colour already computes, so
        // punching holes in the highlight with it costs nothing.
        spec *= 0.30 + 0.70 * n1;
        col += uFoam * spec * mix(0.70, 0.30, uFrozen);

        // -- foam -----------------------------------------------------------
        // CREST FOAM, gated on the wave height rather than on noise, so it
        // appears on the tops of the chop and travels with them. That motion is
        // what says "this water is moving" from five metres away, which no
        // amount of colour wobble does.
        #ifdef FK_LOW
        float crest = smoothstep(0.86, 0.99, vCrest);
        #else
        float crest = smoothstep(0.86, 0.99, vCrest) * (0.45 + 0.55 * vnoise(vWorld * 3.1));
        // A WIDER CREST WINDOW FOR A CROSSING WAS TRIED AND REVERTED, and the
        // reason is written here so it is not tried again. vCrest is three
        // sine trains, i.e. exactly periodic; the 0.86 threshold only ever
        // fires on the rare in-phase peaks, which is what makes the caps look
        // scattered. Dropped to 0.62 it fires on the regular structure instead,
        // and the pool came back photographed as evenly spaced diagonal dashes
        // in a lattice - the "two trains print a grid" failure WAVE_GLSL's own
        // header warns about, and worse than the flat plane it replaced.
        #endif
        // BANK FOAM. The single strongest cue that a body of water has an edge
        // rather than just stopping - and the edge is exactly where a player
        // needs to know precisely where the water begins.
        float bank = 1.0 - smoothstep(0.0, 0.16, vEdge);
        bank *= 0.55 + 0.25 * sin(uTime * 3.0 + vWorld.x * 0.6);
        // Crest foam is deliberately weak. A cap on the top of a wave is a
        // HINT of white, not a band of it; at 0.75 the lagoon read as a
        // whitewater river, which is a different body of water entirely.
        float foam = clamp(max(rim, max(crest * 0.22, bank)), 0.0, 1.0);
        // A frozen river does not lap and does not cap. It cracks: a second
        // noise band drawn as thin pale lines, which is a pressure ridge.
        #ifdef FK_LOW
        float crack = 0.0;
        #else
        float cn = vnoise(vWorld * 0.42);
        float crack = smoothstep(0.46, 0.50, cn) * (1.0 - smoothstep(0.54, 0.58, cn));
        #endif
        col = mix(mix(col, uFoam, foam), mix(col, uCrack, crack * 0.7), uFrozen);

        // -- the wet margin, and why the waterline is not a ruled line ------
        //
        // ONLY ON A CROSSING. uWetMargin is 0 everywhere else, and then
        // "margin" is exactly 1.0 and the two lines below compute what they
        // computed before this existed.
        //
        // TWO THINGS AT ONCE, in one expression, because they are one statement
        // about where the water ends:
        //
        //   * the ribbon FADES OUT over the last WET_MARGIN of depth instead
        //     of stopping at alpha 0.72. Through it the tarmac is seen
        //     through a thinning film - a road darkening into water, which is
        //     what a ford has and a blue polygon does not;
        //   * the line it fades out ON is WOBBLED in world space. A level pool
        //     standing in a smoothly ruled road has a geometrically STRAIGHT
        //     waterline, so no amount of tessellation stops it reading as a
        //     polygon edge - what stops it is the edge not being where the
        //     geometry puts it. Two octaves, about 10 m and about 3 m, sharing
        //     half the margin between them, with the short one creeping so the
        //     edge laps rather than sitting still.
        float wob = 0.0;
        #ifndef FK_LOW
        wob = ((vnoise(vWorld * 0.10 + 4.7) - 0.5) * 0.72
             + (vnoise(vWorld * 0.34 + vec2(uTime * 0.11, -2.1)) - 0.5) * 0.28) * uWetMargin;
        #endif
        float margin = uWetMargin > 0.0 ? smoothstep(0.0, uWetMargin, vEdge + wob) : 1.0;
        // Fading in from the bank stops the mesh edge itself being a visible
        // hard line where it meets the carved ground. Foam is opaque wherever
        // it lands, or a white rim over a dark bed reads as grey.
        float alpha = mix(0.72, 0.95, smoothstep(0.0, 0.10, vEdge)) * margin;
        gl_FragColor = vec4(col, max(alpha, foam * 0.92 * margin));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  material.userData.uniforms = uniforms;
  material.userData.frozen = !!frozen;
  return material;
}








export function buildWater(path, track) {
  const group = new THREE.Group();
  group.name = 'water';
  const zones = (track.hazards ?? []).filter((z) => z.kind === 'water');
  if (!zones.length) return group;

  
  
  
  
  
  
  
  
  
  const low = getQuality() === 'low';
  const materials = new Map();
  
  
  
  
  
  const materialFor = (frozen, crossing) => {
    const key = `${track.theme}|${frozen ? 1 : 0}|${crossing ? 1 : 0}`;
    let m = materials.get(key);
    if (!m) {
      m = buildWaterMaterial(track.theme, {
        frozen, sky: track.sky ?? 'day', sunDir: sunDirFor(track.theme), low,
        wetMargin: crossing ? WET_MARGIN : 0,
      });
      materials.set(key, m);
    }
    return m;
  };

  for (const zone of zones) {
    const crossing = crossesRoad(zone);
    const material = materialFor(!!zone.frozen, crossing);
    
    
    
    
    
    const deepRef = Math.max(0.5, zone.depth ?? 4.5);
    if (zone.creatures) group.add(buildSharks(path, zone));
    
    
    
    
    
    
    
    
    
    
    
    const OVERHANG = 0.008;
    const zoneSpan = zone.to >= zone.from ? zone.to - zone.from : (1 - zone.from) + zone.to;
    let startFrac = zone.from - OVERHANG;
    let span = zoneSpan + OVERHANG * 2;
    if (crossing) {
      
      
      
      
      
      
      
      
      
      
      const wet = wetArc(path, zone);
      if (wet) {
        startFrac = (wet.from - CROSSING_PAD) / path.length;
        span = (wet.to - wet.from + CROSSING_PAD * 2) / path.length;
      }
    }
    
    
    
    
    
    
    
    
    
    
    
    
    const steps = Math.max(8, Math.round((span * path.length) / (crossing ? 2 : 4)));
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const cols = low ? 1 : WATER_COLS;
    const positions = [];
    const edges = [];
    const indices = [];
    const sides = !zone.side || zone.side === 'both' ? [1, -1]
      : [zone.side === 'left' ? 1 : -1];

    for (const side of sides) {
      const base = positions.length / 3;
      for (let i = 0; i <= steps; i += 1) {
        const frac = (startFrac + (span * i) / steps + 1) % 1;
        
        
        
        
        
        
        const alongM = (span * i) / steps * path.length;
        const endU = crossing
          ? smooth01(Math.min(alongM, span * path.length - alongM) / CROSSING_PAD)
          : 1;
        const p = sampleAt(path, frac * path.length);
        const half = p.width / 2;
        
        const nx = p.tz * side;
        const nz = -p.tx * side;
        
        
        
        
        
        
        
        
        
        const y = waterPlaneY(zone, p.y ?? 0);
        const inner = waterlineInner(path, zone, p, side, half, y);
        const outer = inner + carvedReach(path, zone, p, side, inner, y);
        for (let j = 0; j <= cols; j += 1) {
          const e = j / cols;
          const d = inner + (outer - inner) * e;
          positions.push(p.x + nx * d, y, p.z + nz * d);
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          if (crossing) {
            const raw = (y - bedHeightAt(path, p, half, d, nx, nz)) / deepRef;
            
            
            
            
            edges.push(raw > 0
              ? Math.min(1, raw * endU - 0.30 * (1 - endU))
              : Math.max(-1, raw));
          } else {
            edges.push(e);
          }
        }
      }
      const stride = cols + 1;
      for (let i = 0; i < steps; i += 1) {
        for (let j = 0; j < cols; j += 1) {
          const a = base + i * stride + j;
          indices.push(a, a + 1, a + stride, a + 1, a + stride + 1, a + stride);
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('edge', new THREE.Float32BufferAttribute(edges, 1));
    geo.setIndex(indices);
    const mesh = new THREE.Mesh(geo, material);
    
    
    
    
    
    
    mesh.name = `water-${zone.id}`;
    
    
    
    mesh.userData.zone = zone;
    group.add(mesh);
  }
  
  
  
  group.userData.materials = [...materials.values()];
  
  
  group.userData.material = group.userData.materials[0] ?? null;
  return group;
}

































function waterlineInner(path, zone, p, side, half, planeY) {
  const start = half * (zone.beyond ?? 1.18);
  const nx = p.tz * side;
  const nz = -p.tx * side;
  
  
  
  
  const reach = start + bankAt(zone, (p.s ?? 0) / path.length) * half + SHOULDER;
  for (let d = start; d <= reach; d += 0.5) {
    if (isWaterAt(planeY, bedHeightAt(path, p, half, d, nx, nz))) return d;
  }
  return start;
}




















function bedHeightAt(path, p, half, d, nx, nz) {
  const ramp = vergeRamp(d - half);
  if (ramp <= 0) return p.y ?? 0;
  const ground = groundMeshHeightAt(path, p.x + nx * d, p.z + nz * d);
  if (ramp >= 1) return ground;
  return (p.y ?? 0) * (1 - ramp) + ground * ramp;
}


















function carvedReach(path, zone, p, side, inner, planeY) {
  const nx = p.tz * side;
  const nz = -p.tx * side;
  
  
  
  
  
  
  
  
  
  
  
  
  
  if (crossesRoad(zone)) {
    const half = p.width / 2;
    const limit = (zone.until ?? 3) * half;
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const from = half + SHOULDER;
    let last = from;
    for (let d = from; d <= limit; d += 0.5) {
      if (!isWaterAt(planeY, bedHeightAt(path, p, half, d, nx, nz))) break;
      last = d;
    }
    return Math.max(half * 1.05, last) - inner;
  }
  let last = 12;
  for (let d = 6; d <= WATER_REACH; d += 6) {
    const x = p.x + nx * (inner + d);
    const z = p.z + nz * (inner + d);
    const near = nearestOnPath(path, x, z, null);
    const depth = chasmDepthAt(path.hazards, {
      frac: near.s / path.length, lateral: near.lateral, width: near.width,
    });
    if (depth == null) break;
    last = d;
  }
  return last;
}


































export function boatWashSlots(racers) {
  const out = [];
  for (const r of racers ?? []) {
    const kart = r?.kart ?? r;
    if (!kart || !kart.boating) continue;
    const spec = vehicleFor(kart.tuning?.id ?? kart.id ?? 'sheep');
    out.push({
      x: kart.x,
      z: kart.z,
      
      
      
      radius: boatBeam(spec) * 0.62,
      strength: WASH_STRENGTH,
    });
    if (out.length === 4) break;
  }
  return out;
}

export function updateWater(water, elapsed, boats = null) {
  
  
  
  
  
  
  
  
  
  
  
  const mats = water?.userData?.materials
    ?? (water?.userData?.material ? [water.userData.material] : []);
  for (const m of mats) {
    const u = m?.userData?.uniforms;
    if (!u) continue;
    u.uTime.value = elapsed;
    const slots = u.uBoats.value;
    for (let i = 0; i < slots.length; i += 1) {
      const b = boats && boats[i];
      
      
      if (b) slots[i].set(b.x, b.z, b.radius ?? 0, b.strength ?? WASH_STRENGTH);
      else slots[i].set(0, 0, 0, 0);
    }
  }
  for (const child of water?.children ?? []) updateSharks(child, elapsed);
}













function buildBale() {
  const g = new THREE.Group();
  const bale = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 0.85, 1.5, 10),
    surface({ color: 0x6b5a34, roughness: 0.95, flatShading: true }),
  );
  bale.rotation.z = Math.PI / 2;
  bale.position.y = 0.85;
  bale.castShadow = true;
  g.add(bale);

  const flames = [];
  for (const [r, h, colour, phase] of [[0.62, 2.6, 0xf5701a, 0], [0.34, 3.5, 0xffd257, 0.9]]) {
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(r, h, 7, 1, true),
      new THREE.MeshBasicMaterial({
        color: colour, transparent: true, opacity: 0.88,
        depthWrite: false, side: THREE.DoubleSide,
      }),
    );
    flame.position.y = 1.5 + h * 0.42;
    flame.userData.phase = phase;
    flame.userData.baseY = flame.position.y;
    flames.push(flame);
    g.add(flame);
  }
  g.userData.flames = flames;
  return g;
}
















function buildFireRibbon(path, zone, theme) {
  const span = zone.from <= zone.to ? zone.to - zone.from : (1 - zone.from) + zone.to;
  const steps = Math.max(12, Math.round((span * path.length) / 3));
  const sides = !zone.side || zone.side === 'both' ? [1, -1] : [zone.side === 'left' ? 1 : -1];

  const positions = [];
  const ups = [];
  const alongs = [];
  const indices = [];
  for (const side of sides) {
    const base = positions.length / 3;
    for (let i = 0; i <= steps; i += 1) {
      const frac = (zone.from + (span * i) / steps) % 1;
      const p = sampleAt(path, frac * path.length);
      const off = (p.width / 2) * ((zone.beyond ?? 1.2) + 0.16) * side;
      const x = p.x + p.tz * off;
      const z = p.z - p.tx * off;
      const y = p.y ?? 0;
      
      
      
      positions.push(x, y, z); ups.push(0); alongs.push(i);
      positions.push(x, y + 2.6, z); ups.push(1); alongs.push(i);
    }
    for (let i = 0; i < steps; i += 1) {
      const a = base + i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('up', new THREE.Float32BufferAttribute(ups, 1));
  geo.setAttribute('along', new THREE.Float32BufferAttribute(alongs, 1));
  geo.setIndex(indices);

  const uniforms = {
    uTime: { value: 0 },
    uHot: { value: new THREE.Color(0xffd257) },
    uMid: { value: new THREE.Color(0xf5701a) },
    uCool: { value: new THREE.Color(0xa8260c) },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    
    
    
    
    
    
    
    side: THREE.DoubleSide,
    vertexShader: `
      attribute float up;
      attribute float along;
      varying float vUp;
      varying float vAlong;
      varying vec3 vWorld;
      void main() {
        vUp = up;
        vAlong = along;
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uHot, uMid, uCool;
      varying float vUp;
      varying float vAlong;
      varying vec3 vWorld;
      void main() {
        // TONGUES. Three sine trains at different speeds and wavelengths along
        // the ribbon, all rising - one alone is a wave, three is fire. The
        // ribbon is a flat strip and this is the only thing giving it shape,
        // so it is doing more work than it looks.
        float t = uTime;
        float f = sin(vAlong * 0.9 - t * 6.0) * 0.5
                + sin(vAlong * 2.3 - t * 9.0) * 0.3
                + sin(vAlong * 5.1 - t * 13.0) * 0.2;
        // How high this tongue reaches, 0.45..1.0 of the strip.
        float reach = 0.62 + f * 0.30;
        float body = 1.0 - smoothstep(reach - 0.35, reach, vUp);
        if (body <= 0.01) discard;

        // Hot at the base, cooling as it rises, which is the direction a real
        // flame's colour runs and the direction people expect even when they
        // could not tell you why.
        vec3 col = mix(uHot, uMid, smoothstep(0.0, 0.40, vUp));
        col = mix(col, uCool, smoothstep(0.40, 0.95, vUp));
        // A brighter core along the middle of each tongue, which is what stops
        // a solid-coloured flame reading as a piece of orange paper.
        col = mix(col, vec3(1.0, 0.97, 0.80), pow(max(0.0, 1.0 - abs(f)), 3.0) * 0.45 * (1.0 - vUp));

        // Fading in at the very bottom keeps the strip's own lower edge from
        // reading as a hard line sitting on the grass.
        float foot = smoothstep(0.0, 0.06, vUp);
        gl_FragColor = vec4(col, body * foot * 0.94);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const mesh = new THREE.Mesh(geo, material);
  mesh.name = `fire-${zone.id}`;
  mesh.frustumCulled = false;
  mesh.userData.uniforms = uniforms;
  return mesh;
}










export function buildFires(path, track) {
  const group = new THREE.Group();
  group.name = 'fires';
  const zones = (track.hazards ?? []).filter((z) => z.kind === 'fire');
  const lavaZones = (track.hazards ?? []).filter((z) => z.kind === 'lava');
  const volcanoes = (track.terrain ?? []).filter((f) => f.kind === 'volcano');

  
  
  
  
  
  
  const lavaMat = lavaZones.length ? buildLavaMaterial() : null;
  
  
  
  const craterMat = volcanoes.length ? buildLavaMaterial({ scale: 0.19, glow: 0.55 }) : null;
  for (const zone of lavaZones) group.add(buildLavaRibbon(path, zone, lavaMat));
  const plumes = [];
  for (const f of volcanoes) {
    const crater = buildCraterLake(path, f, craterMat);
    plumes.push(crater);
    group.add(crater);
  }
  group.userData.lava = lavaMat;
  group.userData.craterLava = craterMat;
  group.userData.plumes = plumes;

  if (!zones.length) {
    group.userData.ribbons = [];
    return group;
  }

  const ribbons = [];
  for (const zone of zones) {
    const ribbon = buildFireRibbon(path, zone, track.theme);
    ribbons.push(ribbon);
    group.add(ribbon);

    
    
    for (const marker of hazardMarkers(zone, 0.017)) {
      const p = sampleAt(path, marker.frac * path.length);
      const off = (p.width / 2) * marker.out;
      const bale = buildBale();
      bale.position.set(p.x + p.tz * off, p.y ?? 0, p.z - p.tx * off);
      bale.rotation.y = Math.atan2(p.tx, p.tz);
      group.add(bale);
    }
  }
  group.userData.ribbons = ribbons;
  return group;
}


export function updateFires(fires, elapsed) {
  if (!fires) return;
  if (fires.userData.lava) fires.userData.lava.uniforms.uTime.value = elapsed;
  if (fires.userData.craterLava) fires.userData.craterLava.uniforms.uTime.value = elapsed;
  for (const plume of fires.userData.plumes ?? []) updatePlume(plume, elapsed);
  for (const ribbon of fires.userData.ribbons ?? []) {
    ribbon.userData.uniforms.uTime.value = elapsed;
  }
  for (const bale of fires.children) {
    const flames = bale.userData.flames;
    if (!flames) continue;
    for (const flame of flames) {
      const t = elapsed * 7 + flame.userData.phase + bale.position.x * 0.3;
      
      
      
      const sc = 0.86 + Math.sin(t) * 0.14 + Math.sin(t * 2.3) * 0.06;
      flame.scale.set(2 - sc, sc, 2 - sc);
      flame.position.y = flame.userData.baseY + Math.sin(t * 1.4) * 0.12;
      flame.rotation.y = Math.sin(t * 0.6) * 0.25;
    }
  }
}
















function mergeInto(soup, geo, matrix, colorTop, colorBottom) {
  const pos = geo.attributes.position;
  const base = soup.positions.length / 3;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 1) {
    v.fromBufferAttribute(pos, i).applyMatrix4(matrix);
    soup.positions.push(v.x, v.y, v.z);
    
    
    
    const c = v.y < 0 ? colorBottom : colorTop;
    soup.colors.push(c.r, c.g, c.b);
  }
  const idx = geo.index;
  if (idx) for (let i = 0; i < idx.count; i += 1) soup.indices.push(base + idx.getX(i));
  else for (let i = 0; i < pos.count; i += 1) soup.indices.push(base + i);
}


















function buildSharkGeometry() {
  const soup = { positions: [], colors: [], indices: [] };
  const back = new THREE.Color(PALETTE.shark);
  const belly = new THREE.Color(PALETTE.sharkBelly);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();

  
  const body = new THREE.ConeGeometry(1.7, 7.6, 7);
  m.compose(
    new THREE.Vector3(0, 0, -0.6),
    q.setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)),
    new THREE.Vector3(1, 1, 0.62),
  );
  mergeInto(soup, body, m, back, belly);

  
  
  const stock = new THREE.ConeGeometry(1.55, 3.8, 7);
  m.compose(
    new THREE.Vector3(0, 0, -5.8),
    q.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)),
    new THREE.Vector3(1, 1, 0.62),
  );
  mergeInto(soup, stock, m, back, belly);

  
  
  const dorsal = new THREE.ConeGeometry(1.4, 2.2, 3);
  m.compose(
    new THREE.Vector3(0, 1.4, -2.2),
    q.setFromEuler(new THREE.Euler(0, 0, 0)),
    new THREE.Vector3(0.22, 1, 1),
  );
  mergeInto(soup, dorsal, m, back, back);

  
  for (const [ty, rot, scl] of [[0.9, 0.35, 1], [-0.7, -0.5, 0.72]]) {
    const fin = new THREE.ConeGeometry(1.25, 2.8, 3);
    m.compose(
      new THREE.Vector3(0, ty * 1.5, -7.4),
      q.setFromEuler(new THREE.Euler(0, 0, rot)),
      new THREE.Vector3(0.2, scl, 1),
    );
    mergeInto(soup, fin, m, back, back);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(soup.positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(soup.colors, 3));
  geo.setIndex(soup.indices);
  geo.computeVertexNormals();
  return geo;
}


















function buildSharks(path, zone) {
  const spec = zone.creatures;
  const group = new THREE.Group();
  group.name = `sharks-${zone.id}`;
  if (!spec) return group;
  const n = Math.max(1, spec.count ?? 8);
  const geo = buildSharkGeometry();
  const mesh = new THREE.InstancedMesh(
    geo, surface({ vertexColors: true, roughness: 0.55, flatShading: true }), n,
  );
  const span = zone.from <= zone.to ? zone.to - zone.from : (1 - zone.from) + zone.to;
  const anchors = [];
  for (let i = 0; i < n; i += 1) {
    
    
    const frac = (zone.from + span * (0.08 + 0.84 * (i / Math.max(1, n - 1)))) % 1;
    const p = sampleAt(path, frac * path.length);
    const side = i % 2 === 0 ? 1 : -1;
    
    const off = (p.width / 2) * ((zone.beyond ?? 1.18) + (zone.bank ?? 0.55)) + 7 + (i % 3) * 5;
    anchors.push({
      x: p.x + p.tz * side * off,
      z: p.z - p.tx * side * off,
      
      
      
      water: waterPlaneY(zone, p.y ?? 0),
      
      yaw: Math.atan2(p.tx, p.tz) + (side > 0 ? -Math.PI / 2 : Math.PI / 2),
      phase: (i * 0.7919) % 1,
      scale: 0.85 + ((i * 0.37) % 1) * 0.5,
    });
  }
  mesh.name = `shark-${zone.id}`;
  mesh.castShadow = false;
  group.add(mesh);
  group.userData.sharks = { mesh, anchors, zone, lunge: spec.lungeHeight ?? 6, period: spec.period ?? 4.4 };
  
  
  
  
  
  
  
  
  
  
  updateSharks(group, 0);
  return group;
}


function updateSharks(group, elapsed) {
  const s = group?.userData?.sharks;
  if (!s) return;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const v = new THREE.Vector3();
  const sc = new THREE.Vector3();
  s.anchors.forEach((a, i) => {
    const t = lungePhase(elapsed, { period: s.period, up: 1.3, phase: a.phase * s.period });
    
    
    const y = a.water - 7.5 + (7.5 + s.lunge) * t;
    
    
    
    const pitch = t > 0 ? 0.9 - 1.8 * t : 0;
    e.set(pitch, a.yaw, 0);
    q.setFromEuler(e);
    v.set(a.x, y, a.z);
    sc.setScalar(a.scale);
    s.mesh.setMatrixAt(i, m.compose(v, q, sc));
  });
  s.mesh.instanceMatrix.needsUpdate = true;
}

























export function buildLavaMaterial({ scale = 0.055, glow = 0 } = {}) {
  const uniforms = {
    uTime: { value: 0 },
    uScale: { value: scale },
    uGlow: { value: glow },
    uCrust: { value: new THREE.Color(PALETTE.lavaCrust) },
    uLava: { value: new THREE.Color(PALETTE.lava) },
    uHot: { value: new THREE.Color(PALETTE.lavaHot) },
  };
  return new THREE.ShaderMaterial({
    uniforms,
    toneMapped: false,
    vertexShader: `
      varying vec2 vWorld;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform vec3 uCrust, uLava, uHot;
      uniform float uTime, uScale, uGlow;
      varying vec2 vWorld;
      ${NOISE_GLSL}
      void main() {
        // Two octaves drifting in different directions. The same reasoning as
        // the water above: any pair of pure periodic functions beats into a
        // lattice, and noise has no period to beat with.
        vec2 w = vWorld * uScale;
        float a = vnoise(w + vec2(uTime * 0.035, uTime * 0.017));
        float b = vnoise(w * 2.7 - vec2(uTime * 0.021, uTime * 0.048));
        float f = a * 0.65 + b * 0.35;
        // The cracks are where the two octaves disagree, which gives a network
        // of thin veins rather than blobs.
        float vein = 1.0 - smoothstep(0.02, 0.30 + uGlow * 0.22, abs(a - b));
        float pool = smoothstep(0.56 - uGlow * 0.30, 0.78 - uGlow * 0.30, f);
        vec3 col = uCrust;
        col = mix(col, uLava, max(vein, pool));
        col = mix(col, uHot, pow(max(vein, pool), 3.0) * (0.55 + 0.45 * sin(uTime * 1.7 + f * 9.0)));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}




function buildLavaRibbon(path, zone, material) {
  const span = zone.from <= zone.to ? zone.to - zone.from : (1 - zone.from) + zone.to;
  const steps = Math.max(8, Math.round((span * path.length) / 4));
  const positions = [];
  const indices = [];
  const sides = !zone.side || zone.side === 'both' ? [1, -1] : [zone.side === 'left' ? 1 : -1];
  for (const side of sides) {
    const base = positions.length / 3;
    for (let i = 0; i <= steps; i += 1) {
      const frac = (zone.from + (span * i) / steps) % 1;
      const p = sampleAt(path, frac * path.length);
      const half = p.width / 2;
      const inner = half * ((zone.beyond ?? 1.18) + (zone.bank ?? 0.55) * 0.7);
      const nx = p.tz * side;
      const nz = -p.tx * side;
      
      
      
      
      
      
      
      
      
      const y = waterPlaneY(zone, p.y ?? 0);
      
      
      
      const outer = inner + carvedReach(path, zone, p, side, inner, y);
      positions.push(p.x + nx * inner, y, p.z + nz * inner);
      positions.push(p.x + nx * outer, y, p.z + nz * outer);
    }
    for (let i = 0; i < steps; i += 1) {
      const a = base + i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  const mesh = new THREE.Mesh(geo, material);
  material.side = THREE.DoubleSide;
  mesh.name = `lava-${zone.id}`;
  return mesh;
}












function buildCraterLake(path, feature, material) {
  const g = new THREE.Group();
  g.name = `crater-${feature.id ?? 'volcano'}`;
  const r = (feature.craterRadius ?? 78) * 0.52;
  const floor = groundMeshHeightAt(path, feature.x, feature.z);
  const disc = new THREE.CircleGeometry(r, 28);
  disc.rotateX(-Math.PI / 2);
  const lake = new THREE.Mesh(disc, material);
  lake.position.set(feature.x, floor + lavaRise(feature), feature.z);
  lake.name = 'crater-lake';
  g.add(lake);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const puffs = [];
  const puffGeo = new THREE.SphereGeometry(1, 12, 8);
  for (let i = 0; i < 14; i += 1) {
    const smokeMat = new THREE.MeshBasicMaterial({
      color: 0xd3c9bd, transparent: true, opacity: 0.16,
      depthWrite: false, toneMapped: false,
    });
    const cone = new THREE.Mesh(puffGeo, smokeMat);
    cone.userData.i = i;
    cone.renderOrder = 3;
    g.add(cone);
    puffs.push(cone);
  }
  g.userData.plume = { puffs, baseY: floor + lavaRise(feature) + 6, x: feature.x, z: feature.z, r };
  return g;
}


function updatePlume(group, elapsed) {
  const p = group?.userData?.plume;
  if (!p) return;
  p.puffs.forEach((puff, i) => {
    
    
    const t = ((elapsed * 0.05 + i / p.puffs.length) % 1);
    const h = t * 112;
    const spread = 8 + t * 44;
    puff.position.set(
      p.x + Math.sin(t * 3.1 + i) * spread * 0.35 + t * 30,
      p.baseY + h,
      p.z + Math.cos(t * 2.3 + i * 1.7) * spread * 0.35,
    );
    const s = 7 + t * 24;
    puff.scale.set(s, s * 0.74, s);
    
    
    
    puff.material.opacity = 0.17 * (1 - t) * (t < 0.12 ? t / 0.12 : 1);
  });
}


export const inFireZone = (track, frac) =>
  (track.hazards ?? []).some((z) => z.kind === 'fire' && inSpan(frac, z.from, z.to));

export { PALETTE };
