










export function railsAt(net, id) { return net.rails.filter((r) => r.a === id || r.b === id); }
export const other = (r, id) => (r.a === id ? r.b : r.a);
const ptsFrom = (r, id) => (r.a === id ? r.pts : r.pts.slice().reverse());

export function ride(net, points, dock) {
  const start = net.nodes[dock];
  if (!start || start.kind !== 'dock') return null;
  const [first] = railsAt(net, dock);
  if (!first) return null;
  const nodes = [dock], pts = [];
  let at = dock, via = first;
  for (let guard = 0; guard < 64; guard++) {
    const seg = ptsFrom(via, at);
    pts.push(...(pts.length ? seg.slice(1) : seg));
    at = other(via, at); nodes.push(at);
    const n = net.nodes[at];
    if (n.kind === 'dock') return { nodes, pts, end: at };
    
    const fromId = nodes[nodes.length - 2];
    const outTo = fromId === n.trunk ? n.branches[points[at] ? 1 : 0] : n.trunk;
    via = net.rails.find((r) => (r.a === at && r.b === outTo) || (r.b === at && r.a === outTo));
    if (!via) return null;
  }
  return null;
}
export const islandOf = (net, dock) => net.nodes[dock].island;
export const docksOn = (net, island) => Object.keys(net.nodes).filter((id) => net.nodes[id].kind === 'dock' && net.nodes[id].island === island);
export const leversOn = (net, island) => Object.keys(net.nodes).filter((id) => net.nodes[id].kind === 'junction' && net.nodes[id].lever === island);


export function solve(net, from, to, start = {}) {
  const J = Object.keys(net.nodes).filter((id) => net.nodes[id].kind === 'junction');
  const enc = (isl, pts) => isl + '|' + J.map((j) => (pts[j] ? 1 : 0)).join('');
  const q = [[from, { ...start }, 0]], seen = new Set([enc(from, start)]);
  while (q.length) {
    const [isl, pts, n] = q.shift();
    if (isl === to) return n;
    const moves = [];
    for (const d of docksOn(net, isl)) { const r = ride(net, pts, d); if (r) moves.push([islandOf(net, r.end), pts]); }
    for (const j of leversOn(net, isl)) moves.push([isl, { ...pts, [j]: pts[j] ? 0 : 1 }]);
    for (const [i2, p2] of moves) { const k = enc(i2, p2); if (!seen.has(k)) { seen.add(k); q.push([i2, p2, n + 1]); } }
  }
  return -1;
}
