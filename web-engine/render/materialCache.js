




















































export function materialKey(spec, identify = defaultIdentify) {
  const keys = Object.keys(spec).sort();
  const parts = [];
  for (const k of keys) {
    const v = spec[k];
    if (v === undefined) continue;
    parts.push(`${k}=${encode(v, identify)}`);
  }
  return parts.join(';');
}

function encode(v, identify) {
  if (v === null) return 'null';
  const t = typeof v;
  if (t === 'number' || t === 'boolean' || t === 'string') return `${t[0]}:${v}`;
  if (Array.isArray(v)) return `[${v.map((x) => encode(x, identify)).join(',')}]`;
  if (t === 'object') {
    
    
    
    
    
    
    
    
    
    
    const proto = Object.getPrototypeOf(v);
    if (proto === Object.prototype || proto === null) {
      return `{${Object.keys(v).sort().map((k) => `${k}=${encode(v[k], identify)}`).join(',')}}`;
    }
    return `o:${identify(v)}`;
  }
  
  
  return `f:${identify(v)}`;
}




const serials = new WeakMap();
let nextSerial = 0;
function defaultIdentify(obj) {
  if (!serials.has(obj)) { nextSerial += 1; serials.set(obj, nextSerial); }
  return serials.get(obj);
}





export function createMaterialCache(make, identify = defaultIdentify) {
  const map = new Map();
  let hits = 0;
  return {
    







    get(spec) {
      if (spec && spec.unique) {
        const { unique, ...rest } = spec;
        void unique;
        return make(rest);
      }
      const key = materialKey(spec, identify);
      if (map.has(key)) { hits += 1; return map.get(key); }
      const made = make(spec);
      map.set(key, made);
      return made;
    },
    size: () => map.size,
    hits: () => hits,
    clear() { map.clear(); hits = 0; },
  };
}
