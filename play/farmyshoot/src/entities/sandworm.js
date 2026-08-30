


































import * as THREE from 'three';
import {
  HEADS, PORTAL_RADIUS, NECK_REACH, EMERGE_TIME, DURATION, WORM_SCALE,
  STRIKE_TIME, headOffset, emergence, remaining, entrancePhase, portalOpenness,
  strikeFlash,
} from 'arbelo/sandworm';




const DARK = 0x14121a;
const PALE = 0xd9cfae;
const MAW = 0x6d1f2e;










function stripedTube(curve, radius, { segments = 64, radial = 12, band = 6 } = {}) {
  const geo = new THREE.TubeGeometry(curve, segments, radius, radial, false);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const dark = new THREE.Color(DARK);
  const pale = new THREE.Color(PALE);
  for (let i = 0; i < pos.count; i += 1) {
    
    
    const ring = Math.floor(i / (radial + 1));
    const c = (Math.floor(ring / band) % 2 === 0) ? dark : pale;
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

































function portalMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    
    side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uOpen: { value: 0 } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uOpen;
      varying vec2 vUv;

      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){
        vec2 i = floor(p), f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1,0)), u.x),
                   mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
      }

      void main() {
        vec2 p = vUv * 2.0 - 1.0;
        float r = length(p);
        // Outside the disc, and outside however far the hole has opened.
        if (r > uOpen) discard;

        float a = atan(p.y, p.x);
        // THE SWIRL. Winding the angle by 1/r is what makes the arms spiral
        // into the centre; rotating a by time alone would spin a pinwheel.
        float wind = a + 3.4 / max(r, 0.16) - uTime * 1.9;
        float arms = noise(vec2(wind * 1.1, r * 5.0 - uTime * 0.7));
        arms = smoothstep(0.35, 0.95, arms);

        // Black core, dim arms: depth over colour.
        float core = smoothstep(0.86, 0.0, r);
        vec3 col = mix(vec3(0.004, 0.003, 0.008), vec3(0.10, 0.055, 0.15), arms * (1.0 - core));
        // Narrow, dim rim. A wide bright glow reads as a magic circle.
        float rim = smoothstep(uOpen - 0.055, uOpen, r);
        col += vec3(0.42, 0.20, 0.72) * rim * 0.85;

        float alpha = max(1.0 - smoothstep(uOpen - 0.02, uOpen, r), rim);
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });
}


class WormMesh {
  constructor(scene, worm) {
    this.scene = scene;
    this.worm = worm;
    this.group = new THREE.Group();
    this.group.position.set(worm.x, worm.y, worm.z);

    
    
    this.portalMat = portalMaterial();
    this.portal = new THREE.Mesh(
      new THREE.CircleGeometry(PORTAL_RADIUS * 1.25, 48),
      this.portalMat,
    );
    this.portal.rotation.x = -Math.PI / 2;
    this.portal.position.y = 0.06;
    this.group.add(this.portal);

    
    
    
    
    
    
    
    
    this.bolt = new THREE.Mesh(
      new THREE.ConeGeometry(0.55 * WORM_SCALE, 40, 5, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xcfe0ff, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
      }),
    );
    this.bolt.position.y = 20;
    this.bolt.visible = false;
    this.group.add(this.bolt);

    
    
    
    this.strikeLight = new THREE.PointLight(0xbcd4ff, 0, 46, 2);
    this.strikeLight.position.y = 3;
    this.strikeLight.visible = false;
    this.group.add(this.strikeLight);

    
    
    
    this.bodyMat = new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.62, metalness: 0.05, flatShading: false,
    });
    this.mawMat = new THREE.MeshStandardMaterial({
      color: MAW, roughness: 0.5, emissive: 0x2a0710, emissiveIntensity: 0.6,
    });

    
    
    
    
    
    this.eyeMat = new THREE.MeshBasicMaterial({ color: 0xf7e04a });
    this.pupilMat = new THREE.MeshBasicMaterial({ color: 0x0a0a10 });
    this.toothMat = new THREE.MeshStandardMaterial({
      color: 0xefe6cf, roughness: 0.45, metalness: 0.0,
    });

    
    
    this.dives = new Array(HEADS).fill(0);

    this.necks = [];
    for (let i = 0; i < HEADS; i += 1) {
      const neck = new THREE.Mesh(new THREE.BufferGeometry(), this.bodyMat);
      neck.castShadow = true;
      this.necks.push({ neck, ...this._buildHead() });
      this.group.add(neck, this.necks[i].head);
    }
    scene.add(this.group);
  }

  












  _buildHead() {
    const S = WORM_SCALE;
    const head = new THREE.Group();

    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.62 * S, 22, 16), this.bodyMat);
    skull.scale.set(1.0, 0.86, 1.55);
    skull.castShadow = true;
    head.add(skull);

    
    
    const jaw = new THREE.Group();
    jaw.position.set(0, -0.12 * S, 0.30 * S);
    const jawMesh = new THREE.Mesh(new THREE.SphereGeometry(0.44 * S, 18, 12), this.mawMat);
    jawMesh.scale.set(0.92, 0.55, 1.15);
    jawMesh.position.z = 0.34 * S;
    jaw.add(jawMesh);

    
    
    const toothGeo = new THREE.ConeGeometry(0.075 * S, 0.30 * S, 5);
    const TEETH = 8;
    for (let k = 0; k < TEETH; k += 1) {
      const a = (k / (TEETH - 1)) * Math.PI - Math.PI / 2;
      const upper = new THREE.Mesh(toothGeo, this.toothMat);
      upper.position.set(Math.sin(a) * 0.42 * S, 0.02 * S, 0.62 * S + Math.cos(a) * 0.06 * S);
      upper.rotation.x = Math.PI;          
      head.add(upper);
      const lower = new THREE.Mesh(toothGeo, this.toothMat);
      lower.position.set(Math.sin(a) * 0.40 * S, 0.10 * S, 0.60 * S + Math.cos(a) * 0.06 * S);
      jaw.add(lower);
    }
    head.add(jaw);

    
    
    
    const eyes = [];
    for (const side of [-1, 1]) {
      
      
      
      
      
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.15 * S, 14, 10), this.eyeMat);
      eye.position.set(side * 0.28 * S, 0.26 * S, 0.66 * S);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.082 * S, 10, 8), this.pupilMat);
      pupil.position.set(side * -0.02 * S, 0, 0.10 * S);
      eye.add(pupil);
      head.add(eye);
      eyes.push(eye);
    }
    return { head, jaw, eyes };
  }

  









  
  dive(i) {
    if (i >= 0 && i < HEADS) this.dives[i] = 1e-3;
  }

  update(dt = 1 / 60) {
    const t = this.worm.t;
    
    
    for (let i = 0; i < HEADS; i += 1) {
      if (this.dives[i] > 0) {
        this.dives[i] += dt / 0.34;
        if (this.dives[i] >= 1) this.dives[i] = 0;
      }
    }

    
    
    
    const phase = entrancePhase(t);
    const flash = strikeFlash(t);
    if (this.bolt) {
      this.bolt.visible = phase === 'strike';
      this.bolt.material.opacity = flash;
      
      
      if (this.bolt.visible) this.bolt.rotation.y = (t * 37) % (Math.PI * 2);
    }
    if (this.strikeLight) {
      this.strikeLight.intensity = flash * 26;
      this.strikeLight.visible = flash > 0.01;
    }
    const out = emergence(t);
    this.portalMat.uniforms.uTime.value = t;
    
    
    
    const closing = Math.min(1, remaining(t) / 1.4);
    this.portalMat.uniforms.uOpen.value = portalOpenness(t) * closing;

    for (let i = 0; i < HEADS; i += 1) {
      const o = headOffset(i, t);
      
      
      
      
      const hx = o.x * out;
      const hz = o.z * out;
      const hy = o.y * out - (1 - out) * 2.2;

      
      
      
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -1.6, 0),
        new THREE.Vector3(hx * 0.35, hy * 0.45, hz * 0.35),
        new THREE.Vector3(hx * 0.8, hy * 0.86, hz * 0.8),
        new THREE.Vector3(hx, hy, hz),
      ]);
      const { neck, head, jaw } = this.necks[i];
      neck.geometry.dispose();
      
      
      
      
      
      
      
      neck.geometry = stripedTube(curve, 0.46 * WORM_SCALE, { segments: 26, radial: 10, band: 3 });

      head.position.set(hx, hy, hz);
      
      
      
      
      
      
      
      
      
      
      
      
      
      const outLen = Math.hypot(hx, hz);
      if (outLen > 0.05) {
        head.lookAt(hx + (hx / outLen) * 2, hy - 0.7, hz + (hz / outLen) * 2);
      } else {
        const tangent = curve.getTangent(1);
        head.lookAt(hx + tangent.x, hy + tangent.y, hz + tangent.z);
      }
      head.visible = out > 0.12;

      
      
      
      
      const dive = this.dives[i];
      const gape = dive > 0
        ? 1
        : 0.18 + 0.14 * Math.sin(t * 1.9 + i * 2.1);
      jaw.rotation.x = gape * 0.85;

      
      if (dive > 0) {
        const k = 1 - Math.abs(dive - 0.5) * 2;      
        head.position.y = hy - k * (hy - 1.2);
      }
    }
  }

  dispose() {
    this.scene.remove(this.group);
    this.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    this.bolt?.material?.dispose?.();
    this.eyeMat?.dispose?.();
    this.pupilMat?.dispose?.();
    this.toothMat?.dispose?.();
    this.bodyMat.dispose();
    this.mawMat.dispose();
    this.portalMat.dispose();
  }
}







export class SandwormField {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
  }

  
  spawn(worm) {
    const m = new WormMesh(this.scene, worm);
    this.items.push(m);
    return m;
  }

  
  update(dt = 1 / 60) {
    for (let i = this.items.length - 1; i >= 0; i -= 1) {
      const m = this.items[i];
      if (m.worm.t >= DURATION) {
        m.dispose();
        this.items.splice(i, 1);
        continue;
      }
      m.update(dt);
    }
  }

  
  dive(worm, i) {
    const m = this.items.find((it) => it.worm === worm);
    if (m) m.dive(i);
  }

  dispose() {
    for (const m of this.items) m.dispose();
    this.items.length = 0;
  }
}

export { DARK as WORM_DARK, PALE as WORM_PALE, NECK_REACH };
