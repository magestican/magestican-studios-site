




import { TILE } from '../sim/constants.js';
import { buildRail, crossing, nearestOnRail, posAt } from '../sim/track.js';
import { gridWorld } from '../sim/world.js';

const cells = (u) => Math.round(u / TILE);






export function levelBuilder(meta) {
  const H = cells(meta.height ?? 24);
  const floor0 = typeof meta.floor === 'number' ? meta.floor : 2; 
  
  const solid = new Map();
  const oneWay = new Map();
  const barkCells = new Map();
  const soilCells = new Map();
  const entities = [];
  const checkpoints = [];
  const landmarks = [];
  const cameraHints = [];
  const heaves = [];
  const updrafts = [];
  const gusts = [];
  const shoeRuns = [];
  const shoeBeats = [];
  const honey = [];
  const water = [];
  const rafts = [];
  const arena = [];
  const slick = []; 
  const circuits = []; 
  const fans = []; 
  const sparks = []; 
  const spins = []; 
  const moons = []; 
  const lamps = []; 
  const blooms = []; 
  const ivy = []; 
  const webs = []; 
  const harps = []; 
  const hubs = []; 
  const softs = []; 
  
  const track = { rails: [], points: [], diamonds: [], stations: [], signals: [], debris: [], peas: [], chevrons: [], props: [] };
  const builtRails = {};
  let trainStart = null;
  const counters = {};
  let x = 0; 
  let ground = floor0; 
  let widthCells = 0;
  let spawn = null;

  const id = (kind) => {
    counters[kind] = (counters[kind] ?? 0) + 1;
    return `L${String(meta.id).padStart(2, '0')}-${kind.toLowerCase()}-${counters[kind]}`; 
  };
  const mark = (map, c0, c1, r0, r1) => {
    for (let c = c0; c < c1; c++) {
      if (!map.has(c)) map.set(c, new Set());
      for (let r = r0; r < r1; r++) map.get(c).add(r);
    }
    widthCells = Math.max(widthCells, c1);
  };
  
  const block = (x0, x1, y0, y1) => mark(solid, cells(x0), cells(x1), cells(y0), cells(y1));

  const api = {
    get x() {
      return x;
    },
    get ground() {
      return ground;
    },
    
    run(len) {
      block(x, x + len, 0, ground);
      x += len;
      return api;
    },
    
    gap(len) {
      x += len;
      return api;
    },
    
    step(dy, len) {
      ground += dy;
      return api.run(len);
    },
    
    platform(dx, y, w, kind = 'solid') {
      if (kind === 'one-way') mark(oneWay, cells(x + dx), cells(x + dx + w), cells(y) - 1, cells(y));
      else block(x + dx, x + dx + w, y - TILE, y);
      return api;
    },
    
    pillar(dx, w, h) {
      block(x + dx, x + dx + w, 0, ground + h);
      return api;
    },
    
    ceiling(dx, w, y, thick = 1) {
      block(x + dx, x + dx + w, y, y + thick);
      return api;
    },
    
    put(kind, dx, props = {}, y = ground) {
      const e = { id: props.id ?? id(kind), kind, x: x + dx, y, ...props };
      entities.push(e);
      return e;
    },
    
    landmark(name, dx, layer = 'mid') {
      landmarks.push({ name, x: x + dx, y: ground, layer });
      return api;
    },
    




    antColumn(dx, len, speed = 4, { headline, ...props } = {}) {
      const top = ground + TILE;
      mark(oneWay, cells(x + dx), cells(x + dx + len), cells(top) - 1, cells(top));
      const tag = headline ? { motif: 'sweep', use: headline } : {};
      api.put('antColumn', dx + len / 2, { x0: x + dx, x1: x + dx + len, speed, ...tag, ...props }, top);
      return api;
    },
    
    
    wall(x0, x1, y0, y1) {
      block(x0, x1, y0, y1);
      return api;
    },
    
    bark(x0, x1, y0, y1) {
      mark(barkCells, cells(x0), cells(x1), cells(y0), cells(y1));
      return api;
    },
    
    carve(x0, x1, y0, y1) {
      for (const map of [solid, soilCells, oneWay])
        for (let c = cells(x0); c < cells(x1); c++) for (let r = cells(y0); r < cells(y1); r++) map.get(c)?.delete(r);
      return api;
    },
    



    heave(len, amp, phase = 0, opts = {}) {
      block(x, x + len, 0, ground);
      api.heaveAt(x, x + len, ground, amp, phase, { taper: [3, 3], ...opts });
      x += len;
      return api;
    },
    
    heaveAt(x0, x1, base, amp, phase = 0, opts = {}) {
      counters.heave = (counters.heave ?? 0) + 1;
      heaves.push({
        id: opts.id ?? `L${String(meta.id).padStart(2, '0')}-heave-${counters.heave}`,
        x0,
        x1,
        base,
        amp,
        phase,
        period: 4,
        taper: [3, 3],
        ...opts,
      });
      return api;
    },
    
    fold(len, depth, phase = 0, opts = {}) {
      block(x, x + len, 0, ground - depth);
      api.heaveAt(x, x + len, ground - depth, depth, phase, { taper: [0, 0], ...opts });
      x += len;
      return api;
    },
    
    updraft(x0, x1, y0, y1, opts = {}) {
      counters.updraft = (counters.updraft ?? 0) + 1;
      updrafts.push({
        id: opts.id ?? `L${String(meta.id).padStart(2, '0')}-updraft-${counters.updraft}`,
        x0,
        x1,
        y0,
        y1,
        lift: 7,
        ...opts,
      });
      return api;
    },
    
    fluff(x0, x1, y0, y1, opts = {}) {
      counters.soft = (counters.soft ?? 0) + 1;
      softs.push({ id: opts.id ?? `L${String(meta.id).padStart(2, '0')}-soft-${counters.soft}`, skin: 'fluff', x0, x1, y0, y1, ...opts });
      return api;
    },
    
    soft(x0, x1, y0, y1, opts = {}) {
      counters.soft = (counters.soft ?? 0) + 1;
      softs.push({ id: opts.id ?? `L${String(meta.id).padStart(2, '0')}-soft-${counters.soft}`, skin: 'cloth', x0, x1, y0, y1, ...opts });
      return api;
    },
    
    gust(x0, x1, y0, y1, opts = {}) {
      counters.gust = (counters.gust ?? 0) + 1;
      gusts.push({ id: opts.id ?? `L${String(meta.id).padStart(2, '0')}-gust-${counters.gust}`, x0, x1, y0, y1, vx: 5, ...opts });
      return api;
    },
    




    shoeRun(xFrom, xTo, opts = {}) {
      shoeRuns.push({ id: shoeRuns.length + 1, xFrom, xTo, lead: 2, foot: 8, tele: 1.0, radius: 24, ...opts });
      return api;
    },
    




    shoeBeat(trigger, opts = {}) {
      shoeBeats.push({
        id: shoeBeats.length + 1,
        trigger,
        lane: 'play',
        lead: 2,
        foot: 8,
        tele: 1.0,
        radius: 24,
        motif: 'shockwave',
        ...opts,
      });
      return api;
    },
    
    cameraHint(x0, x1, opts) {
      cameraHints.push({ x0, x1, ...opts });
      return api;
    },
    
    soil(x0, x1, y0, y1) {
      mark(soilCells, cells(x0), cells(x1), cells(y0), cells(y1));
      return api;
    },
    




    tower(x, yBase, n, opts) {
      const { id: tag, foot, ...rest } = opts;
      if (!rest.hidden) {
        
        for (let c = cells(foot[0]); c < cells(foot[1]); c++) for (let r = cells(foot[2]); r < cells(foot[3]); r++) solid.get(c)?.delete(r);
        mark(soilCells, cells(foot[0]), cells(foot[1]), cells(foot[2]), cells(foot[3]));
      }
      return api.putAt('tower', x, yBase, { tag, n, foot, motif: 'collapse', ...rest });
    },
    



    slick(x0, x1, y0, y1) {
      slick.push([x0, x1, y0, y1]);
      return api;
    },
    



    circuit(cid, ...lines) {
      circuits.push({ id: cid, lines });
      return api;
    },
    



    fanAt(x0, x1, y0, y1, opts = {}) {
      counters.fan = (counters.fan ?? 0) + 1;
      fans.push({
        id: opts.id ?? `L${String(meta.id).padStart(2, '0')}-fan-${counters.fan}`,
        x0,
        x1,
        y0,
        y1,
        axis: 'x',
        blade: 3,
        gap: 2,
        speed: 4,
        ...opts,
      });
      return api;
    },
    



    packetLane(lid, points, opts = {}) {
      rafts.push({ id: lid, kind: 'raft', mode: 'packet', points, speed: 6, period: 2, offset: 0, w: 3, ...opts });
      return api;
    },
    



    spark(x0, x1, y0, y1, opts = {}) {
      sparks.push({ x0, x1, y0, y1, ...(opts.pulse ? { pulse: opts.pulse } : {}), ...(opts.skin ? { skin: opts.skin } : {}) });
      return api;
    },
    
    moonAt(x0, x1) {
      moons.push({ x0, x1 });
      return api;
    },
    



    lampAt(x, y, opts = {}) {
      counters.lamp = (counters.lamp ?? 0) + 1;
      lamps.push({ id: opts.id ?? `L${String(meta.id).padStart(2, '0')}-lamp-${counters.lamp}`, x, y, r: 5.5, ...opts });
      return api;
    },
    
    bloomAt(x, y, opts = {}) {
      counters.bloom = (counters.bloom ?? 0) + 1;
      blooms.push({ id: opts.id ?? `L${String(meta.id).padStart(2, '0')}-bloom-${counters.bloom}`, x, y, w: 4, stub: 1, ...opts });
      return api;
    },
    
    ivy(x0, x1, y0, y1, opts = {}) {
      counters.ivy = (counters.ivy ?? 0) + 1;
      ivy.push({
        id: opts.id ?? `L${String(meta.id).padStart(2, '0')}-ivy-${counters.ivy}`,
        x0,
        x1,
        y0,
        y1,
        ...(opts.skin ? { skin: opts.skin } : {}),
      });
      return api;
    },
    




    web(x0, y0, x1, y1, opts = {}) {
      counters.web = (counters.web ?? 0) + 1;
      webs.push({ id: opts.id ?? `L${String(meta.id).padStart(2, '0')}-web-${counters.web}`, x0, y0, x1, y1, ...opts });
      return api;
    },
    
    harp(opts) {
      harps.push({ every: 1.6, amp: 1, ...opts });
      return api;
    },
    
    hub(opts) {
      hubs.push({ ...opts });
      return api;
    },
    
    spin(x0, x1, y, opts = {}) {
      spins.push({ x0, x1, y, vx: opts.vx ?? -5 });
      return api;
    },
    
    ledge(x0, x1, y) {
      mark(oneWay, cells(x0), cells(x1), cells(y) - 1, cells(y));
      return api;
    },
    




    honey(x0, x1, y, opts = {}) {
      counters.honey = (counters.honey ?? 0) + 1;
      honey.push({ id: opts.id ?? `L${String(meta.id).padStart(2, '0')}-honey-${counters.honey}`, x0, x1, y, motif: 'honey', ...opts });
      return api;
    },
    




    arenaPiece(pid, x0, x1, y0, y1, opts = {}) {
      arena.push({ id: pid, x0, x1, y0, y1, at: opts.at ?? { 0: y0 } });
      return api;
    },
    
    water(x0, x1, y) {
      water.push({ x0, x1, y });
      return api;
    },
    
    putAt(kind, x, y, props = {}) {
      const e = { id: props.id ?? id(kind), kind, x, y, ...props };
      (kind === 'raft' ? rafts : entities).push(e);
      return e;
    },
    




    beaconAt(x, y, opts = {}) {
      checkpoints.push({ id: checkpoints.length + 1, x, y, ...(opts.phase ? { phase: opts.phase } : {}) });
      return api;
    },
    
    spawnAt(x, y) {
      spawn = { x, y };
      return api;
    },
    
    landmarkAt(name, x, y, layer = 'mid') {
      landmarks.push({ name, x, y, layer });
      return api;
    },
    
    beacon(dx = 1) {
      checkpoints.push({ id: checkpoints.length + 1, x: x + dx, y: ground });
      return api;
    },
    
    secret(kind, dx, props, y = ground) {
      return api.put('intel', dx, { secret: kind, ...props }, y);
    },
    
    





    rail(rid, start, ...rest) {
      const opts = rest.length && !Array.isArray(rest[rest.length - 1]) ? rest.pop() : {};
      const spec = { id: rid, start, pieces: rest, ...opts };
      track.rails.push(spec);
      builtRails[rid] = buildRail(spec);
      return api;
    },
    
    onRail(rid, s) {
      const q = posAt(builtRails[rid], s);
      return [Math.round(q.x * 1000) / 1000, Math.round(q.y * 1000) / 1000];
    },
    
    railLength(rid) {
      return builtRails[rid].length;
    },
    
    points(pid, opts) {
      track.points.push({ id: pid, set: 'a', ...opts });
      return api;
    },
    
    diamond(did, { a, b }) {
      const x = crossing(builtRails[a], builtRails[b]);
      if (!x) throw new Error(`diamond ${did}: ${a} and ${b} do not cross`);
      track.diamonds.push({ id: did, a, b, x: x.x, y: x.y, sa: x.sa, sb: x.sb });
      return api;
    },
    



    station(sid, rid, s, opts = {}) {
      const [sx, sy] = api.onRail(rid, s);
      track.stations.push({ id: sid, rail: rid, s, x: sx, y: sy, ...(opts.sign ? { sign: opts.sign } : {}) });
      if (opts.beacon !== false)
        checkpoints.push({
          id: checkpoints.length + 1,
          x: sx,
          y: sy,
          rail: rid,
          s,
          name: sid,
          ...(opts.passes ? { passes: opts.passes } : {}),
          ...(opts.coupled ? { coupled: true } : {}),
        });
      return api;
    },
    
    signal(gid, opts) {
      track.signals.push({ id: gid, ...opts });
      return api;
    },
    
    debris(rid, s0, s1, opts = {}) {
      track.debris.push({ id: opts.id ?? `debris-${track.debris.length + 1}`, rail: rid, s0, s1, ...opts });
      return api;
    },
    
    pea(qid, opts) {
      track.peas.push({ id: qid, ...opts });
      return api;
    },
    
    chevrons(rid, s0, s1) {
      track.chevrons.push({ rail: rid, s0, s1 });
      return api;
    },
    
    prop(kind, x0, x1, y0, y1, opts = {}) {
      track.props.push({ kind, x0, x1, y0, y1, z: 1, ...opts });
      return api;
    },
    
    trainAt(rid, s) {
      trainStart = { rail: rid, s };
      const [sx, sy] = api.onRail(rid, s);
      spawn = { x: sx, y: sy };
      return api;
    },
    build() {
      const finish = entities.find((e) => e.kind === 'finish');
      const W = widthCells + 4;
      const rows = [];
      for (let r = H - 1; r >= 0; r--) {
        let row = '';
        for (let c = 0; c < W; c++)
          row += solid.get(c)?.has(r)
            ? '#'
            : soilCells.get(c)?.has(r)
              ? '%'
              : oneWay.get(c)?.has(r)
                ? '='
                : barkCells.get(c)?.has(r)
                  ? '|'
                  : '.';
        rows.push(row);
      }
      const world = gridWorld(rows);
      if (honey.length) world.honey = honey; 
      for (const [x0, x1, y0, y1] of slick)
        for (let c = cells(x0); c < cells(x1); c++)
          for (let r = cells(y0); r < cells(y1); r++) if (world.solid(c, r)) world.markSlick(c, r);
      return {
        id: meta.id,
        name: meta.name,
        world,
        pitCost: meta.pitCost ?? 'heart',
        spawn: spawn ?? { x: 1.5, y: floor0 },
        checkpoints,
        landmarks,
        cameraHints,
        heaves,
        updrafts,
        gusts,
        ...(shoeRuns.length || shoeBeats.length ? { shoe: { runs: shoeRuns, beats: shoeBeats } } : {}),
        ...(honey.length ? { honey } : {}),
        ...(water.length ? { water } : {}),
        ...(rafts.length ? { rafts } : {}),
        ...(arena.length ? { arena } : {}),
        ...(slick.length ? { slick } : {}),
        ...(meta.pitReturn ? { pitReturn: meta.pitReturn } : {}),
        ...(meta.soilLook ? { soilLook: meta.soilLook } : {}),
        
        ...(meta.descent ? { descent: true } : {}),
        ...(circuits.length ? { circuits } : {}),
        ...(fans.length ? { fans } : {}),
        ...(sparks.length ? { sparks } : {}),
        ...(spins.length ? { spins } : {}),
        
        ...(meta.dark ? { dark: true } : {}),
        ...(meta.darkTint ? { darkTint: meta.darkTint } : {}), 
        ...(meta.moon ? { moon: meta.moon } : {}),
        ...(moons.length ? { moons } : {}),
        ...(lamps.length ? { lamps } : {}),
        ...(blooms.length ? { blooms } : {}),
        ...(ivy.length ? { ivy } : {}),
        
        ...(webs.length ? { webs } : {}),
        ...(harps.length ? { harps } : {}),
        ...(hubs.length ? { hubs } : {}),
        ...(meta.fallReturn ? { fallReturn: meta.fallReturn } : {}),
        ...(meta.sky ? { sky: meta.sky } : {}),
        
        ...(meta.mode === 'train' ? trainFields(meta, track, builtRails, trainStart, entities) : {}),
        
        ...(meta.mode === 'plane' ? { mode: 'plane', camDist: meta.camDist ?? 28, ceiling: (meta.height ?? 24) - 8, softs } : {}),
        dir: meta.dir ?? 1,
        entities,
        finishX: finish ? finish.x : (W - 4) * TILE,
        vertical: finish?.axis === 'y',
      };
    },
  };
  return api;
}






function trainFields(meta, track, rails, trainStart, entities) {
  const near = (ax, ay, bx, by, tol) => Math.hypot(ax - bx, ay - by) <= tol;
  const exits = {};
  for (const spec of track.rails) {
    const R = rails[spec.id];
    const n = R.xs.length - 1;
    const [ex, ey] = [R.xs[n], R.ys[n]];
    if (spec.exit) {
      const [rail, s] = spec.exit.split(':s');
      exits[spec.id] = { rail, s: Number(s) };
    } else if (spec.buffer) exits[spec.id] = null;
    else {
      const starts = track.rails.find((o) => o.id !== spec.id && near(o.start[0], o.start[1], ex, ey, 0.05));
      if (starts) exits[spec.id] = { rail: starts.id, s: 0 };
      else {
        let best = null;
        for (const o of track.rails) {
          if (o.id === spec.id) continue;
          const q = nearestOnRail(rails[o.id], ex, ey);
          if (q.d <= 0.3 && (!best || q.d < best.d)) best = { rail: o.id, s: q.s, d: q.d };
        }
        if (!best) throw new Error(`rail ${spec.id} ends at (${ex.toFixed(2)}, ${ey.toFixed(2)}) joining nothing (give it exit or buffer)`);
        exits[spec.id] = { rail: best.rail, s: best.s };
      }
    }
  }
  const pointsOn = {};
  for (const p of track.points) {
    const at = posAt(rails[p.rail], p.s);
    for (const b of [p.a, p.b]) {
      if (!rails[b]) throw new Error(`points ${p.id}: no rail ${b}`);
      if (b !== p.rail && !near(rails[b].xs[0], rails[b].ys[0], at.x, at.y, 0.15))
        throw new Error(
          `points ${p.id}: rail ${b} starts ${Math.hypot(rails[b].xs[0] - at.x, rails[b].ys[0] - at.y).toFixed(2)} u from its blades`,
        );
    }
    if (!pointsOn[p.rail]) pointsOn[p.rail] = [];
    pointsOn[p.rail].push(p);
  }
  for (const list of Object.values(pointsOn)) list.sort((a, b) => a.s - b.s);
  if (!trainStart) throw new Error('a train level needs trainAt(rail, s)');
  if (!entities.some((e) => e.kind === 'finish' && e.rail)) throw new Error('a train level needs a finish on a rail');
  return {
    mode: 'train',
    floor: typeof meta.floor === 'object' ? meta.floor : { w: 100, h: 100 },
    track,
    trackGraph: { rails, pointsOn, exits },
    trainStart,
  };
}
