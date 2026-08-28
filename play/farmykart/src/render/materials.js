























import * as THREE from 'three';




























function installToneMapping() {
  if (THREE.ShaderChunk.tonemapping_pars_fragment.includes('FARMY_TONEMAP')) return;
  THREE.ShaderChunk.tonemapping_pars_fragment = THREE.ShaderChunk.tonemapping_pars_fragment.replace(
    'vec3 CustomToneMapping( vec3 color ) { return color; }',
    `#define FARMY_TONEMAP
    // The ACES fit everyone uses (Narkowicz), which is a very close match to
    // the full curve at a fraction of the cost.
    vec3 farmyACES( vec3 x ) {
      const float a = 2.51;
      const float b = 0.03;
      const float c = 2.43;
      const float d = 0.59;
      const float e = 0.14;
      return clamp( ( x * ( a * x + b ) ) / ( x * ( c * x + d ) + e ), 0.0, 1.0 );
    }
    vec3 CustomToneMapping( vec3 color ) {
      color *= toneMappingExposure;
      vec3 mapped = farmyACES( color );
      // Push the chroma back out around the mapped luminance. Clamped, so a
      // saturated highlight cannot be pushed back out of gamut and wrap.
      float lum = dot( mapped, vec3( 0.2126, 0.7152, 0.0722 ) );
      return clamp( mix( vec3( lum ), mapped, 1.32 ), 0.0, 1.0 );
    }`,
  );
}









export function configureRenderer(renderer) {
  installToneMapping();
  renderer.toneMapping = THREE.CustomToneMapping;
  renderer.toneMappingExposure = 1.55;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  return renderer;
}



























let QUALITY = 'high';










export function detectQuality() {
  if (typeof navigator === 'undefined') return 'high';
  const mem = navigator.deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  
  if (mem <= 2 && cores <= 4) return 'low';
  return 'high';
}


export function setQuality(level) { QUALITY = level === 'low' ? 'low' : 'high'; }
export function getQuality() { return QUALITY; }





















function addRim(material, { colour = 0xffe9c4, strength = 0.28, power = 2.6 } = {}) {
  const tint = new THREE.Color(colour);
  material.userData.rim = { value: new THREE.Vector4(tint.r, tint.g, tint.b, strength) };
  material.userData.rimPower = { value: power };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uRim = material.userData.rim;
    shader.uniforms.uRimPower = material.userData.rimPower;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform vec4 uRim;
        uniform float uRimPower;`)
      
      
      
      .replace('#include <dithering_fragment>', `
        {
          // vViewPosition is the vector from the fragment to the camera, in
          // view space, and the shaded normal is already in that same space,
          // so the two are directly comparable and no matrix work is needed.
          float facing = abs(dot(normalize(normal), normalize(vViewPosition)));
          float rim = pow(1.0 - facing, uRimPower);
          // Faded out where the surface is already dark. A rim on the shadowed
          // side of an object reads as a glow and looks like a bug; it should
          // only ever lift an edge that is plausibly catching the sky.
          float lit = clamp(dot(gl_FragColor.rgb, vec3(0.33)) * 2.2, 0.0, 1.0);
          gl_FragColor.rgb += uRim.rgb * (rim * uRim.a * lit);
        }
        #include <dithering_fragment>`);
  };
  
  
  
  material.customProgramCacheKey = () => `rim${power}`;
  return material;
}











export function surface({ rim, roughness, metalness, ...opts } = {}) {
  if (QUALITY === 'low') {
    
    
    
    
    
    return new THREE.MeshLambertMaterial(opts);
  }
  const mat = new THREE.MeshStandardMaterial({
    roughness: roughness ?? 0.82,
    metalness: metalness ?? 0.0,
    
    
    
    
    ...opts,
  });
  if (rim !== false) addRim(mat, rim || undefined);
  return mat;
}


export const paintedSurface = (opts = {}) => surface({
  roughness: 0.42, metalness: 0.08, ...opts,
  rim: { strength: 0.38, power: 2.2, ...(opts.rim || {}) },
});


export const rubberSurface = (opts = {}) => surface({
  roughness: 0.95, metalness: 0.0, ...opts, rim: { strength: 0.12, power: 3.2 },
});











export const NOISE_GLSL = `
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  // THREE OCTAVES, NOT FIVE. Measured: five octaves on the ground and the sky
  // - which between them cover essentially every pixel on screen - more than
  // doubled the frame cost, and the fourth and fifth contribute detail finer
  // than a cloud edge or a patch of dirt has any business showing. The 2.03
  // multiplier is not exactly 2 so the octaves do not line up and print a
  // visible grid through the result.
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * vnoise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }
`;








const SKIES = {
  day: { top: 0x2f74d8, horizon: 0xbcdcf7, haze: 0xd8e9f6, cloud: 0.55, cloudTint: 0xffffff },
  snow: { top: 0x5f8fc4, horizon: 0xdcebf8, haze: 0xe9f2fb, cloud: 0.72, cloudTint: 0xf2f6fb },
  overcast: { top: 0x7d90a2, horizon: 0xc4ccd4, haze: 0xc9cdd2, cloud: 0.88, cloudTint: 0xdfe4e9 },
  dusk: { top: 0x38407e, horizon: 0xf0a978, haze: 0xe8b892, cloud: 0.60, cloudTint: 0xffd9b0 },
};















export function buildSkyMaterial(kind = 'day', sunDir = new THREE.Vector3(-0.6, 0.5, 0.42)) {
  const c = SKIES[kind] || SKIES.day;
  const uniforms = {
    uTop: { value: new THREE.Color(c.top) },
    uHorizon: { value: new THREE.Color(c.horizon) },
    uHaze: { value: new THREE.Color(c.haze) },
    uCloudTint: { value: new THREE.Color(c.cloudTint) },
    uCloud: { value: c.cloud },
    uSunDir: { value: sunDir.clone().normalize() },
    uTime: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    
    
    
    fog: false,
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uTop, uHorizon, uHaze, uCloudTint, uSunDir;
      uniform float uCloud, uTime;
      varying vec3 vDir;
      ${NOISE_GLSL}
      void main() {
        vec3 dir = normalize(vDir);
        float h = dir.y;

        // GRADIENT. The exponent is what stops this reading as a two-colour
        // ramp: most of the change happens in the first fifteen degrees above
        // the horizon, which is where it happens in a real sky.
        vec3 col = mix(uHorizon, uTop, pow(clamp(h, 0.0, 1.0), 0.42));
        // Below the horizon the dome is behind the ground almost everywhere,
        // but not quite - over a crest it shows, and it has to be haze rather
        // than a hard edge.
        col = mix(uHaze, col, smoothstep(-0.10, 0.06, h));

        // SUN GLOW ONLY - see the note above about there being two suns once.
        float sd = max(dot(dir, uSunDir), 0.0);
        col += uCloudTint * pow(sd, 6.0) * 0.30;
        col += uCloudTint * pow(sd, 42.0) * 0.55;

        // CLOUDS. Projecting onto a plane above the viewer gives cloud shapes
        // that stretch toward the horizon the way real ones do; sampling the
        // direction vector directly gives evenly-sized blobs pasted on a dome.
        float dome = max(h, 0.055);
        vec2 p = dir.xz / dome * 1.4 + vec2(uTime * 0.0035, uTime * 0.0012);
        float n = fbm(p * 1.15);
        // Two thresholds rather than one: the lower makes a soft edge, the
        // upper a bright core, and the difference is what makes a cloud look
        // lit from one side instead of like a grey stain.
        float body = smoothstep(0.52, 0.78, n) * uCloud;
        float core = smoothstep(0.66, 0.92, n) * uCloud;
        // Faded out at the horizon, where the projection stretches to infinity
        // and any noise turns into streaks.
        float fade = smoothstep(0.02, 0.30, h);
        col = mix(col, uCloudTint * 0.90, body * fade * 0.85);
        col = mix(col, uCloudTint, core * fade * 0.55);

        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  material.userData.uniforms = uniforms;
  return material;
}


















export function buildEnvironment(renderer, skyMaterial) {
  
  
  if (QUALITY === 'low') return null;
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const scene = new THREE.Scene();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(10, 24, 16), skyMaterial);
  scene.add(dome);
  const target = pmrem.fromScene(scene, 0.04);
  dome.geometry.dispose();
  pmrem.dispose();
  return target.texture;
}






















export function addGroundDetail(material, { scale = 0.035, strength = 0.22, fade = 240 } = {}) {
  
  
  
  if (QUALITY === 'low') return material;
  material.userData.groundDetail = {
    uScale: { value: scale },
    uStrength: { value: strength },
    uFade: { value: fade },
  };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, material.userData.groundDetail);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        varying vec3 vGroundWorld;`)
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
        vGroundWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vGroundWorld;
        uniform float uScale, uStrength, uFade;
        ${NOISE_GLSL}`)
      
      
      .replace('#include <map_fragment>', `#include <map_fragment>
        {
          float dist = length(vViewPosition);
          // Detail fades out with distance because past a certain point the
          // texel is smaller than the pixel and detail can only alias into
          // moire. The BRANCH matters as much as the fade: the road and the
          // field are the two largest surfaces in the scene and most of their
          // pixels are far away, so skipping the noise outright for those is
          // most of the cost of this effect saved.
          float near = 1.0 - smoothstep(uFade * 0.35, uFade, dist);
          if (near > 0.004) {
            vec2 gp = vGroundWorld.xz * uScale;
            // Two scales, done by hand rather than through fbm: the broad one
            // hides the tile repeat, the fine one puts grain back in the near
            // field so the ground does not look like painted plastic up close.
            // Three noise lookups, where calling fbm twice cost six.
            float broad = vnoise(gp * 0.25) * 0.66 + vnoise(gp * 0.53) * 0.34 - 0.5;
            float fine = vnoise(gp * 3.1) - 0.5;
            // The fine grain is dropped sooner than the broad variation - it
            // is the one that aliases, and it is invisible past about a lorry
            // length anyway.
            float grain = 1.0 - smoothstep(uFade * 0.06, uFade * 0.22, dist);
            float v = (broad + fine * 0.45 * grain) * uStrength * near;
            diffuseColor.rgb *= (1.0 + v);
          }
        }`);
  };
  material.customProgramCacheKey = () => `ground${scale}${strength}`;
  return material;
}
