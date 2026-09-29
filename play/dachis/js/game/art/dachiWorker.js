









const Q = self.location.search;
const loaded = new Map(); 
const SPEC = /(\bfrom\s*|\bimport\s*\(?\s*)(['"])(\.{1,2}\/[^'"]+)\2/g;

function load(url) {
  if (!loaded.has(url)) loaded.set(url, (async () => {
    const res = await fetch(url + Q);
    if (!res.ok) throw new Error(`dachiWorker: ${res.status} for ${url}`);
    let src = await res.text();
    const deps = [...new Set([...src.matchAll(SPEC)].map((m) => m[3]))];
    const blobs = await Promise.all(deps.map((d) => load(new URL(d, url).href)));
    const map = new Map(deps.map((d, i) => [d, blobs[i]]));
    src = src.replace(SPEC, (all, pre, q, spec) => pre + q + map.get(spec) + q) + `\n//# sourceURL=${url}${Q}`;
    return URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
  })());
  return loaded.get(url);
}
const here = (f) => new URL(f, self.location.href.split('?')[0]).href;
const mods = Promise.all(['./dachiModel.js', './kidModel.js', './elderModel.js', './aerowingModel.js', './bossModel.js'].map((f) => load(here(f)).then((b) => import(b))))
  .catch(() => Promise.all([ 
    import('./dachiModel.js' + Q), import('./kidModel.js' + Q), import('./elderModel.js' + Q), import('./aerowingModel.js' + Q), import('./bossModel.js' + Q)]));

self.onmessage = async (e) => {
  const [{ dachiArrays }, { kidArrays }, { elderArrays }, { aerowingArrays }, { bossArrays }] = await mods;
  const { kind = 'dachi', spId, opts } = e.data, t0 = performance.now();
  const arrays = kind === 'kid' ? kidArrays(opts) : kind === 'elder' ? elderArrays() : kind === 'aerowing' ? aerowingArrays(opts) : kind === 'boss' ? bossArrays(opts.boss) : dachiArrays(spId, opts);
  self.postMessage({ arrays, ms: performance.now() - t0 });
};
