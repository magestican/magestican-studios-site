

















export function sampleFlags(control, path, samplesPerSegment) {
  if (path.count !== control.length * samplesPerSegment) {
    throw new Error(`connector: path has ${path.count} samples, ${control.length} x ${samplesPerSegment} expected`);
  }
  const connector = new Uint8Array(path.count);
  const gap = new Uint8Array(path.count);
  for (let i = 0; i < path.count; i += 1) {
    const c = control[Math.floor(i / samplesPerSegment)];
    connector[i] = c.connector ? 1 : 0;
    gap[i] = c.connector && c.gap ? 1 : 0;
  }
  return { connector, gap };
}


function runs(flags) {
  const n = flags.length;
  const out = [];
  if (flags.every((f) => f)) return [{ from: 0, to: n }];
  const start = flags.findIndex((f) => !f); 
  if (start < 0) return out;
  let cur = null;
  for (let k = 1; k <= n; k += 1) {
    const i = (start + k) % n;
    if (!flags[i]) { cur = null; continue; }
    if (cur) cur.to += 1; 
    else { cur = { from: i, to: i + 1 }; out.push(cur); }
  }
  return out;
}

const sOf = (path, i) => (i >= path.count ? path.s[i - path.count] + path.length : path.s[i]);





export function connectorSpans(control, path, samplesPerSegment) {
  const { connector, gap } = sampleFlags(control, path, samplesPerSegment);
  const gaps = runs(gap).map((r) => ({ s0: sOf(path, r.from), s1: sOf(path, r.to) }));
  return runs(connector).map((r) => {
    const s0 = sOf(path, r.from);
    const s1 = sOf(path, r.to);
    return { s0, s1, gaps: gaps.filter((g) => g.s0 >= s0 - 1e-9 && g.s1 <= s1 + 1e-9) };
  });
}


export function deckRuns(span) {
  const out = [];
  let at = span.s0;
  for (const g of [...span.gaps].sort((a, b) => a.s0 - b.s0)) {
    if (g.s0 > at) out.push({ s0: at, s1: g.s0 });
    at = Math.max(at, g.s1);
  }
  if (span.s1 > at) out.push({ s0: at, s1: span.s1 });
  return out;
}






export function piecesAlong(run, pieceLength) {
  const L = run.s1 - run.s0;
  if (L <= 0) return [];
  const count = Math.max(1, Math.round(L / pieceLength));
  const length = L / count;
  return Array.from({ length: count }, (_, k) => ({
    s: run.s0 + length * (k + 0.5), length, stretch: length / pieceLength,
  }));
}







export function trestlesAlong(run, every, deckY, floorY, { minHeight = 0 } = {}) {
  const L = run.s1 - run.s0;
  const count = Math.max(1, Math.ceil(L / every - 1e-9));
  const out = [];
  for (let k = 0; k <= count; k += 1) {
    const s = run.s0 + (L * k) / count;
    const height = deckY(s) - floorY(s);
    if (height >= minHeight) out.push({ s, height });
  }
  return out;
}

const inRange = (s, a, b, length) => {
  const x = ((s - a) % length + length) % length;
  return x <= b - a;
};





export function onDeck(spans, s, lateral, halfWidth, length) {
  if (Math.abs(lateral) > halfWidth) return false;
  for (const sp of spans) {
    if (!inRange(s, sp.s0, sp.s1, length)) continue;
    return !sp.gaps.some((g) => inRange(s, g.s0, g.s1, length));
  }
  return false;
}


export function spanAt(spans, s, length) {
  return spans.findIndex((sp) => inRange(s, sp.s0, sp.s1, length));
}
