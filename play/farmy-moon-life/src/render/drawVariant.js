



































const TWINS = new WeakMap();   
const BASE_OF = new WeakMap(); 
const SHARED = new WeakSet();  
let minted = 0;


export function markShared(...materials) {
  for (const m of materials) if (m) SHARED.add(m);
}


export const baseMaterial = (m) => BASE_OF.get(m) || m;

export function variantMaterial(material, key) {
  const base = baseMaterial(material);
  if (!key) return base;
  let twins = TWINS.get(base);
  if (!twins) TWINS.set(base, (twins = new Map()));
  let twin = twins.get(key);
  if (!twin) {
    
    
    
    
    
    twin = Object.create(base);
    Object.defineProperty(twin, 'id', { get: () => base.id, enumerable: false, configurable: false });
    twin.uuid = `${base.uuid}-${key}-${(minted += 1)}`;
    twin._listeners = undefined; 
    
    
    Object.defineProperty(twin, 'version', { get: () => base.version, set: (v) => { base.version = v; }, enumerable: true });
    
    
    
    
    Object.defineProperty(twin, 'side', { get: () => base.side, set: (v) => { base.side = v; }, enumerable: true });
    
    
    
    
    
    
    
    BASE_OF.set(twin, base);
    twins.set(key, twin);
  }
  return twin;
}







export function drawVariantKey(o) {
  const g = o.geometry || {};
  const ma = g.morphAttributes || {};
  const morph = ma.position || ma.normal || ma.color;
  const colour = g.attributes && g.attributes.color;
  return [
    o.isSkinnedMesh ? 'skin' : '',
    o.isInstancedMesh ? 'inst' : '',
    o.isInstancedMesh && o.instanceColor ? 'icol' : '',
    o.isBatchedMesh ? 'batch' : '',
    morph ? `m${morph.length}` : '',
    ma.normal ? 'mn' : '',
    ma.color ? 'mc' : '',
    colour && colour.itemSize === 4 ? 'va' : '',
  ].filter(Boolean).join('+');
}







export function adoptDrawVariant(o) {
  if (!o || Array.isArray(o.material) || !o.material) return null;
  const key = drawVariantKey(o);
  const base = baseMaterial(o.material);
  if (SHARED.has(base)) o.material = variantMaterial(base, key);
  const depth = o.customDepthMaterial && baseMaterial(o.customDepthMaterial);
  if (depth && SHARED.has(depth)) o.customDepthMaterial = variantMaterial(depth, key);
  return key;
}
