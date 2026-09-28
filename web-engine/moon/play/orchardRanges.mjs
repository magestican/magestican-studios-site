



























export function appendTree(merged, tree, m) {
  const base = new Map();
  for (const mat of tree.groups.keys()) base.set(mat, merged.groups.has(mat) ? merged.groups.get(mat).positions.length / 3 : 0);
  merged.append(tree, m);
  return { fruit: (tree.fruitSpans || []).map((s) => ({ material: s.material, start: base.get(s.material) + s.start, count: s.count })) };
}






export function captureRest(arrays, range) {
  for (const s of range.fruit) {
    const a = arrays[s.material];
    if (!a) continue;
    s.rest = {
      position: a.position.slice(s.start * 3, (s.start + s.count) * 3),
      sway: a.sway ? a.sway.slice(s.start, s.start + s.count) : null,
    };
  }
  return range;
}








export function setFruit(arrays, range, shown) {
  const touched = new Map();
  for (const s of range.fruit) {
    const a = arrays[s.material];
    if (!a || !s.count) continue;
    const p = a.position;
    if (shown) {
      if (!s.rest) throw new Error('setFruit: no rest copy to show (captureRest)');
      p.set(s.rest.position, s.start * 3);
      if (a.sway && s.rest.sway) a.sway.set(s.rest.sway, s.start);
    } else {
      const src = s.rest ? s.rest.position : p.slice(s.start * 3, s.start * 3 + 3);
      const x = src[0], y = src[1], z = src[2];
      for (let i = s.start * 3, end = (s.start + s.count) * 3; i < end; i += 3) {
        p[i] = x; p[i + 1] = y; p[i + 2] = z;
      }
      if (a.sway) a.sway.fill(0, s.start, s.start + s.count);
    }
    const t = touched.get(s.material);
    if (!t) touched.set(s.material, { material: s.material, start: s.start, end: s.start + s.count });
    else { t.start = Math.min(t.start, s.start); t.end = Math.max(t.end, s.start + s.count); }
  }
  return [...touched.values()].map((t) => ({ material: t.material, start: t.start, count: t.end - t.start }));
}
