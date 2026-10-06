



















import { MAP_MODULES } from './regionMaps/index.js';

export const MANIFESTS = MAP_MODULES.filter((m) => m.MANIFEST).map((m) => m.MANIFEST).sort((a, b) => a.order - b.order);
export const manifestOf = (id) => MANIFESTS.find((m) => m.region.id === id) || null;

export const rowsOf = (key) => MANIFESTS.flatMap((m) => m[key] || []);

export const mapOf = (key) => Object.assign({}, ...MANIFESTS.map((m) => m[key] || {}));

export const byRegion = (key) => Object.fromEntries(MANIFESTS.filter((m) => m[key] != null).map((m) => [m.region.id, m[key]]));
