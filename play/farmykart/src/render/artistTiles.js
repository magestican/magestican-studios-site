

import * as THREE from 'three';
import { getQuality } from './materials.js';
import { makeGroundNormal } from './textures.js';
import { layerTile as layerCore, tileUrl } from './artistTilesCore.js';

export { ARTIST_TILES, PENDING_TILES, GROUND_TILE, ROAD_TILE, LAYER, tileUrl } from './artistTilesCore.js';


export function layerTile(texture, name, how, opts = {}) {
  return layerCore(texture, name, how, { quality: getQuality(), deriveNormal: makeGroundNormal, ...opts });
}

const fenceCache = new Map();





export function tileTexture(name, { quality = getQuality(), loader = null } = {}) {
  if (quality === 'low') return null;
  if (fenceCache.has(name)) return fenceCache.get(name);
  const l = loader ?? (typeof document === 'object' ? new THREE.TextureLoader() : null);
  if (!l) return null;
  const t = l.load(tileUrl(name));
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  fenceCache.set(name, t);
  return t;
}
