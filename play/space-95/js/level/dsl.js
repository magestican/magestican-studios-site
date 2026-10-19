




import { TILE } from '../sim/constants.js';
import { gridWorld } from '../sim/world.js';

const cells = (u) => Math.round(u / TILE);





export function levelBuilder(meta) {
  const H = cells(meta.height ?? 24);
  const floor0 = meta.floor ?? 2; 
  
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
        ...(meta.soilLook ? { soilLook: meta.soilLook } : {}),
        dir: meta.dir ?? 1,
        entities,
        finishX: finish ? finish.x : (W - 4) * TILE,
        vertical: finish?.axis === 'y',
      };
    },
  };
  return api;
}
