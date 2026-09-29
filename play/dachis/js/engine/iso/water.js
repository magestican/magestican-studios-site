



import * as THREE from 'three';

export function createWater({ size = 600, center = [32, 32], depthAt, mapN, sunDir = [-0.55, 0.8, 0.2] }) {
  
  const res = 128, data = new Uint8Array(res * res * 4);
  for (let j = 0; j < res; j++) for (let i = 0; i < res; i++) {
    const d = Math.max(0, Math.min(1, -depthAt(i / (res - 1) * mapN, j / (res - 1) * mapN) / 3));
    const k = (j * res + i) * 4; data[k] = data[k + 1] = data[k + 2] = Math.round(d * 255); data[k + 3] = 255;
  }
  const depthTex = new THREE.DataTexture(data, res, res, THREE.RGBAFormat);
  depthTex.magFilter = THREE.LinearFilter; depthTex.minFilter = THREE.LinearFilter; depthTex.needsUpdate = true;

  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: {
      uTime: { value: 0 }, uDepth: { value: depthTex }, uMapN: { value: mapN },
      uSun: { value: new THREE.Vector3(...sunDir).normalize() },
    },
    vertexShader: `
      varying vec3 vW;
      void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `
      uniform float uTime; uniform sampler2D uDepth; uniform float uMapN; uniform vec3 uSun;
      varying vec3 vW;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
      void main() {
        vec2 p = vW.xz; float t = uTime;
        vec2 uv = p / uMapN;
        float depth = (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) ? 1.0 : texture2D(uDepth, uv).r;
        // wave normal: a few travelling sines + fine noise ripples
        vec2 g = vec2(0.0);
        g += vec2(0.8, 0.3) * cos(dot(p, vec2(0.8, 0.3)) * 1.1 + t * 1.4) * 0.14;
        g += vec2(-0.4, 0.9) * cos(dot(p, vec2(-0.4, 0.9)) * 1.7 + t * 1.9) * 0.10;
        g += vec2(0.6, -0.7) * cos(dot(p, vec2(0.6, -0.7)) * 2.9 + t * 2.6) * 0.07;
        float n1 = noise(p * 3.0 + vec2(t * 0.6, t * 0.4)), n2 = noise(p * 3.0 + vec2(1.7, 9.2) - vec2(t * 0.5, 0.0));
        g += (vec2(n1, n2) - 0.5) * 0.35;
        vec3 n = normalize(vec3(-g.x, 1.0, -g.y));
        vec3 V = normalize(vec3(1.0, 1.2, 1.0));
        vec3 shallow = vec3(0.30, 0.93, 0.86), mid = vec3(0.07, 0.62, 0.86), deep = vec3(0.02, 0.26, 0.56);
        vec3 col = mix(shallow, mid, smoothstep(0.0, 0.25, depth));
        col = mix(col, deep, smoothstep(0.25, 0.9, depth));
        // caustic ribbons in the shallows
        float c = abs(sin(p.x * 2.3 + sin(p.y * 1.7 + t) * 1.5 + t * 0.8) * sin(p.y * 2.1 + sin(p.x * 1.3 - t * 0.7) * 1.5));
        col += vec3(0.55, 0.95, 0.9) * pow(1.0 - c, 8.0) * (1.0 - smoothstep(0.0, 0.3, depth)) * 0.5;
        // sky fresnel and sun
        float fres = pow(1.0 - max(dot(n, V), 0.0), 2.5);
        col = mix(col, vec3(0.78, 0.92, 1.0), fres * 0.6);
        vec3 r = reflect(-uSun, n);
        float spec = pow(max(dot(r, V), 0.0), 60.0);
        float glint = pow(max(dot(r, V), 0.0), 420.0) * step(0.55, noise(p * 9.0 + t * 1.5));
        col += vec3(1.0, 0.97, 0.88) * (spec * 0.45 + glint * 3.5);
        // shore foam: a moving band where depth is near zero
        float band = depth + (noise(p * 4.0 + t * 0.9) - 0.5) * 0.05 - (sin(t * 1.6 + p.x * 0.7 + p.y * 0.5) * 0.5 + 0.5) * 0.04;
        float foam = 1.0 - smoothstep(0.015, 0.06, band);
        col = mix(col, vec3(1.0), foam * 0.85);
        float alpha = mix(0.55, 0.94, smoothstep(0.0, 0.35, depth));
        gl_FragColor = vec4(col, max(alpha, foam));
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(center[0], 0, center[1]);
  mesh.renderOrder = 2;
  return { mesh, update(t) { mat.uniforms.uTime.value = t; } };
}
