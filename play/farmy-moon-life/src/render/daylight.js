




import * as THREE from 'three';
import { cozyUniforms, setEmissiveFactors } from './material.js';

const setLinear = (c, rgb, k = 1) => c.setRGB(rgb[0] * k, rgb[1] * k, rgb[2] * k, THREE.LinearSRGBColorSpace);


export const SHADE_STRENGTH = 0.8;
export const FOG_SCALE = 1.0;

export const SHADE_LIFT = 0.022;

export function createDaylight(scene, settings, { shadowExtent = 20 } = {}) {
  const hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
  const key = new THREE.DirectionalLight(0xffffff, 1);
  key.castShadow = true;
  key.shadow.mapSize.set(settings.shadowMapSize, settings.shadowMapSize);
  key.shadow.radius = settings.shadowRadius;
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.04;
  Object.assign(key.shadow.camera, { left: -shadowExtent, right: shadowExtent, top: shadowExtent, bottom: -shadowExtent, near: 1, far: 140 });
  scene.add(hemi, key, key.target);
  scene.fog = new THREE.FogExp2(0xffffff, 0.01);

  return {
    hemi,
    key,
    
    fogScale: 1,
    apply(cycle, focus, renderer) {
      setLinear(hemi.color, cycle.hemiSky);
      setLinear(hemi.groundColor, cycle.hemiGround);
      hemi.intensity = cycle.hemiIntensity;
      setLinear(key.color, cycle.keyColor);
      key.intensity = cycle.keyIntensity;
      const d = cycle.keyDirection;
      key.target.position.set(focus.x, focus.y, focus.z);
      key.position.set(focus.x + d[0] * 60, focus.y + d[1] * 60, focus.z + d[2] * 60);
      key.target.updateMatrixWorld();
      setLinear(scene.fog.color, cycle.fogColor);
      scene.fog.density = cycle.fogDensity * FOG_SCALE * this.fogScale;

      cozyUniforms.uFmlWrap.value = cycle.wrap;
      const t = cycle.shadeTint;
      const peak = Math.max(t[0], t[1], t[2]);
      cozyUniforms.uFmlShadeTint.value.setRGB(
        1 + (t[0] / peak - 1) * SHADE_STRENGTH,
        1 + (t[1] / peak - 1) * SHADE_STRENGTH,
        1 + (t[2] / peak - 1) * SHADE_STRENGTH,
        THREE.LinearSRGBColorSpace,
      );
      const lift = SHADE_LIFT * cycle.hemiIntensity / peak;
      cozyUniforms.uFmlShadeLift.value.setRGB(t[0] * lift, t[1] * lift, t[2] * lift, THREE.LinearSRGBColorSpace);
      setLinear(cozyUniforms.uFmlRimColor.value, cycle.rimColor, cycle.rimIntensity);
      setEmissiveFactors(cycle.emissive);
      renderer.toneMappingExposure = cycle.exposure;
    },
  };
}
