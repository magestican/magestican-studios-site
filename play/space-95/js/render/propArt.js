



import * as THREE from 'three';
import { v } from '../site/assetUrl.js';


const PROP_ART =  ({});

const loader = new THREE.TextureLoader();





export function propBillboard(name, h = PROP_ART[name]) {
  if (!(name in PROP_ART)) return null;
  const mat = new THREE.MeshBasicMaterial({ map: new THREE.Texture(), transparent: true, alphaTest: 0.4, depthWrite: false });
  const geo = new THREE.PlaneGeometry(1, 1);
  geo.translate(0, 0.5, 0);
  const m = new THREE.Mesh(geo, mat);
  m.scale.set(h, h, 1);
  m.name = `prop:${name}`;
  if (typeof document !== 'undefined' && document.createElementNS)
    loader.load(v(`assets/art/props/${name}.webp`), (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      mat.map = t;
      mat.needsUpdate = true;
      const img =  (t.image);
      if (img?.height) m.scale.x = (h * img.width) / img.height;
    });
  return m;
}
