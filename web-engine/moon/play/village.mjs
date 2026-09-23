






























































import { CLOCK, HAPPINESS } from '../economy/tables.mjs';
import { MS } from '../economy/math.mjs';
import { WORK_DAY_MS as DAY_MS } from '../economy/clock.mjs';
import { localHour } from './localClock.mjs';
import { SUNRISE, SUNSET } from '../light/dayCycle.mjs';
import { COTTAGE_SPOT, PATH_HALF_WIDTH, PLAZA, TOWN_SPOTS, pathDistance, placements } from '../world/moonLayout.mjs';
import {
  BUILDING_ROLES, HOME_ROOM, PLAYER_RADIUS_M, WALK_EDGE_M, createCollisionWorld, homeDoor, homeObstacle, homeRoomObstacle,
  obstacleFor, obstaclesWithoutRuntime, penetration, plotObstacle, roomObstacle, toWorld, townBlockObstacles, TOWN_ROLES,
} from '../world/collision.mjs';
import { PARCELS } from '../world/parcels.mjs';
import { forageSpots } from '../world/forage.mjs';
import { forageObstacle } from '../world/collision.mjs';
import { seedOf } from '../voice/mumble.mjs';
import { orchardView } from './orchard.mjs';
import { openAt, walkGrid, walkPath } from './walks.mjs';
import { CAMERA } from './followCamera.mjs';
import { INTERACT } from './interact.mjs';
import { COUNTERS } from '../economy/town.mjs';
import { anchors as townAnchors } from '../art/townBuilding.mjs';





const NIGHT_FROM_HOUR = 22;
const NIGHT_TO_HOUR = 6;
export const isNightHour = (h) => h >= NIGHT_FROM_HOUR || h < NIGHT_TO_HOUR;


export function isNightOwl(world, villagerId) {
  const list = world.villagers || [];
  if (list.length === 0) return false;
  const idx = seedOf(`${world.seed}|nightOwl`) % list.length;
  return list[idx] && list[idx].id === villagerId;
}

export const VILLAGE = Object.freeze({
  
  walkMps: 1.0,
  
  wakeHour: SUNRISE + 1,
  homeByHour: SUNSET - 1,
  
  jitterS: 40,
  
  lingerS: Object.freeze([50, 130]),
  
  ambleMinS: 40,
  ambleM: Object.freeze([0.7, 1.4]),
  
  standRingM: 0.9,
  standRingSlots: 6,
  
  radiusM: PLAYER_RADIUS_M,
  cellM: 0.4,
  
  offPathCost: 1.6,
  
  smoothSlack: 1.02,
  
  
  
  bounds: Object.freeze({ minX: -41, maxX: 37, minZ: -33, maxZ: 33 }),
  
  
  
  
  
  
  weights: Object.freeze({ shop: 3, orchard: 2, firepit: 2, town: 2, visit: 1 }),
});


export const HOME_RULES = Object.freeze({
  pathClearM: 0.3,       
  edgeMarginM: 1.5,      
  treeClearM: 1.2,       
  obstacleClearM: 0.4,   
  spotClearM: 2.0,       
  forageClearM: 0.5,     
  sampleM: 0.5,
  candidates: 800,
});


export const GATHERING = Object.freeze(['firepit', 'shop']);













export const PLAYER_TUNED_HEIGHT_M = 1.09;
export const playerScale = (playerHeightM) => (Number.isFinite(playerHeightM) && playerHeightM > 0 ? playerHeightM / PLAYER_TUNED_HEIGHT_M : 1);





export const PLAYER_TUNED = Object.freeze({
  aimHeightM: CAMERA.aimHeightM,  
  talkSideM: 1.15,                
  talkTowardM: 0.25,              
  reachM: INTERACT.reachM,        
});










export function playerFit(playerHeightM, tuned = PLAYER_TUNED) {
  const k = playerScale(playerHeightM);
  return {
    heightM: PLAYER_TUNED_HEIGHT_M * k,
    scale: k,
    aimHeightM: tuned.aimHeightM * k,
    talkSideM: tuned.talkSideM * k,
    talkTowardM: tuned.talkTowardM * k,
    reachM: tuned.reachM * k,
    badgeShowM: BADGE.showM * k,
    badgeHideM: BADGE.hideM * k,
  };
}





export const BADGE = Object.freeze({ showM: 4, hideM: 4.6, hearts: 5 });





export const SPOTS = Object.freeze({
  shop: Object.freeze({ x: -4.2, z: 1.5, look: 'shop' }),
  orchard: Object.freeze({ x: 9.8, z: -4.8, look: 'orchard' }),
  firepit: Object.freeze({ x: -5.9, z: 6.2, look: 'firepit' }),
  
  town: Object.freeze({ x: PLAZA.x + 2.6, z: PLAZA.z + 2.2, look: 'town' }),
});






function townWorkplaces() {
  const out = {};
  for (const counter of COUNTERS) {
    const spot = TOWN_SPOTS[counter.id];
    if (!spot) continue;
    const keeper = townAnchors({ seed: spot.seed, stage: counter.id }).keeper;
    const at = toWorld(spot, keeper.x, keeper.z);
    out[counter.id] = Object.freeze({
      x: Math.round(at.x * 1000) / 1000,
      z: Math.round(at.z * 1000) / 1000,
      
      heading: spot.rotY + keeper.heading,
      label: counter.label,
      counter: counter.id,
    });
  }
  return out;
}

export const WORKPLACES = Object.freeze({
  
  landOffice: Object.freeze({ x: 0.3, z: -4.9, heading: 0.35, label: 'the land office' }),
  
  pressYard: Object.freeze({ x: 8.2, z: 0.6, heading: -2.4, label: 'the press yard' }),
  
  ...townWorkplaces(),
});





export const WORK = Object.freeze([
  Object.freeze({ villager: 0, place: 'landOffice', fromHour: 9, toHour: 12 }),
  Object.freeze({ villager: 1, place: 'pressYard', fromHour: 13, toHour: 16 }),
  ...COUNTERS.map((c) => Object.freeze({ villager: c.keeper, place: c.id, fromHour: c.openHour, toHour: c.closeHour })),
]);


export function counterKeptBy(index, hour, work = WORK) {
  const row = work.find((w) => w.villager === index && WORKPLACES[w.place] && WORKPLACES[w.place].counter && hour >= w.fromHour && hour < w.toHour);
  return row ? row.place : null;
}


export function keeperOf(counter, hour, work = WORK) {
  const row = work.find((w) => w.place === counter && hour >= w.fromHour && hour < w.toHour);
  return row ? row.villager : null;
}

export const HOME_STAGES = Object.freeze(['none', 'building', 'house', 'decorated', 'garden']);
const FINISHED = Object.freeze(['none', 'house', 'decorated', 'garden']);
export const HOUSE_STAGES = Object.freeze(['house', 'decorated', 'garden']);

const START_MS = Math.round((CLOCK.startHour / 24) * DAY_MS);
const U32 = 4294967296;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const homeKey = (id) => `home:${id}`;
const placedKey = (id) => `placed:${id}`;








export const placedRouteObstacle = ({ x, z, r }) => ({ shape: 'circle', module: 'placed', x, z, r, reach: r });
const workKey = (place) => `work:${place}`;


export const dayOf = (world, t) => Math.floor((t - world.createdAt + START_MS) / DAY_MS);
const dayStart = (world, day) => world.createdAt - START_MS + day * DAY_MS;




export function homeStage(villager, t) {
  const levels = villager.levels || [];
  let done = 0;
  while (done < levels.length && t >= levels[done].doneAt) done++;
  const pending = levels[done] || null;
  let progress = done > 0 ? 1 : 0, startsAt = null, doneAt = null;
  if (pending) {
    const spec = HAPPINESS.levels[done];
    doneAt = pending.doneAt;
    startsAt = doneAt - spec.build_s * MS;
    progress = clamp01((t - startsAt) / (doneAt - startsAt));
  }
  const stage = done === 0 ? (pending ? 'building' : 'none') : FINISHED[done];
  return { stage, progress, level: done, next: pending ? FINISHED[done + 1] : null, building: Boolean(pending), startsAt, doneAt };
}


export function badgeState(villager, { distance = Infinity, wasVisible = false, playerHeightM = PLAYER_TUNED_HEIGHT_M } = {}, cfg = BADGE) {
  const max = HAPPINESS.levels.length;
  const level = Math.min(max, (villager.levels || []).length);
  const from = level > 0 ? HAPPINESS.levels[level - 1].points : 0;
  const to = level < max ? HAPPINESS.levels[level].points : null;
  const fraction = to === null ? 1 : clamp01((villager.points - from) / (to - from));
  return {
    level, max, points: villager.points, from, to, fraction,
    hearts: to === null ? cfg.hearts : Math.floor(fraction * cfg.hearts + 1e-9),
    heartsOf: cfg.hearts,
    visible: distance <= (wasVisible ? cfg.hideM : cfg.showM) * playerScale(playerHeightM),
  };
}




export function routeObstacles(P = placements(), forage = forageSpots()) {
  const trees = P.filter((p) => p.role === 'tree').map(obstacleFor).filter(Boolean);
  const rooms = P.filter((p) => BUILDING_ROLES.includes(p.role)).map(roomObstacle);
  const press = P.find((p) => p.role === 'processor');
  const signs = PARCELS.map((p) => obstacleFor({ module: 'parcelSign', ...p.sign }));
  const bushes = forage.map(forageObstacle).filter(Boolean);
  
  
  
  
  const rest = obstaclesWithoutRuntime(P).filter((ob) => ob.module !== 'townBuilding');
  const townParts = P.filter((p) => p.role === 'town')
    .flatMap((p) => townBlockObstacles(p, townAnchors({ seed: p.seed, stage: p.stage }).blocks));
  return [...rest, ...townParts, ...trees, ...rooms, ...(press ? [plotObstacle(press)] : []), ...signs, ...bushes];
}

function polyOf(points) {
  const pts = [];
  for (const p of points) {
    const last = pts[pts.length - 1];
    if (!last || Math.hypot(p.x - last.x, p.z - last.z) > 1e-6) pts.push({ x: p.x, z: p.z });
  }
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z));
  return { points: pts, cum, total: cum[cum.length - 1] };
}

function pointOn(poly, d) {
  const { points, cum } = poly;
  if (points.length === 1 || d <= 0) {
    const b = points[Math.min(1, points.length - 1)];
    return { x: points[0].x, z: points[0].z, heading: Math.atan2(b.x - points[0].x, b.z - points[0].z) };
  }
  for (let i = 1; i < points.length; i++) {
    if (d <= cum[i] || i === points.length - 1) {
      const a = points[i - 1], b = points[i];
      const u = clamp01((d - cum[i - 1]) / Math.max(1e-9, cum[i] - cum[i - 1]));
      return { x: a.x + (b.x - a.x) * u, z: a.z + (b.z - a.z) * u, heading: Math.atan2(b.x - a.x, b.z - a.z) };
    }
  }
  return null;
}


function boxPoints(ob, stepM) {
  const pts = [];
  const nx = Math.max(1, Math.ceil((2 * ob.hx) / stepM)), nz = Math.max(1, Math.ceil((2 * ob.hz) / stepM));
  for (let a = 0; a <= nx; a++) {
    for (let b = 0; b <= nz; b++) {
      const lx = -ob.hx + (2 * ob.hx * a) / nx, lz = -ob.hz + (2 * ob.hz * b) / nz;
      pts.push({ x: ob.x + lx * ob.cos + lz * ob.sin, z: ob.z - lx * ob.sin + lz * ob.cos });
    }
  }
  return pts;
}


export function roomTouches(room, ob, gap) {
  if (ob.shape === 'circle') return penetration(room, ob.x, ob.z, ob.r + gap).depth > 1e-9;
  if (Math.hypot(room.x - ob.x, room.z - ob.z) > room.reach + ob.reach + gap) return false;
  return boxPoints(ob, 0.25).some((p) => penetration(room, p.x, p.z, gap).depth > 1e-9)
    || boxPoints(room, 0.5).some((p) => penetration(ob, p.x, p.z, gap).depth > 1e-9);
}






export function createVillage({ P = placements(), cfg = VILLAGE, work = WORK, workplaces = WORKPLACES, forage = forageSpots() } = {}) {
  const staticObstacles = routeObstacles(P, forage);
  const collision = createCollisionWorld({ obstacles: staticObstacles.slice() });
  const shopP = P.find((p) => p.role === 'shop');
  const firepitP = P.find((p) => p.module === 'firepit');
  const nearOrchard = (p) => Math.hypot(p.x - SPOTS.orchard.x, p.z - SPOTS.orchard.z);
  const orchardTree = P.filter((p) => p.role === 'tree').reduce((best, p) => (!best || nearOrchard(p) < nearOrchard(best) ? p : best), null);
  const LOOK = { shop: shopP, firepit: firepitP, orchard: orchardTree };
  const homes = {};
  
  
  
  const placed = new Map();
  let version = 0;

  let grid = null, cost = null;
  
  
  
  function closeHouse(spot, g = grid) {
    const house = homeObstacle(spot);
    const r = house.reach + cfg.radiusM;
    for (let j = 0; j < g.nz; j++) {
      const z = g.minZ + j * g.cellM;
      if (Math.abs(z - house.z) > r) continue;
      for (let i = 0; i < g.nx; i++) {
        const x = g.minX + i * g.cellM;
        if (Math.abs(x - house.x) > r) continue;
        if (penetration(house, x, z, cfg.radiusM).depth > 1e-6) g.open[j * g.nx + i] = 0;
      }
    }
  }
  function gridOf() {
    if (grid) return grid;
    grid = walkGrid(createCollisionWorld({ obstacles: [...staticObstacles, ...placed.values()] }), { ...cfg.bounds, cellM: cfg.cellM, radius: cfg.radiusM });
    cost = new Float32Array(grid.open.length);
    for (let j = 0; j < grid.nz; j++) {
      for (let i = 0; i < grid.nx; i++) {
        cost[j * grid.nx + i] = pathDistance(grid.minX + i * grid.cellM, grid.minZ + j * grid.cellM) <= PATH_HALF_WIDTH ? 1 : cfg.offPathCost;
      }
    }
    for (const spot of Object.values(homes)) closeHouse(spot);
    return grid;
  }
  
  
  
  
  let unplaced = null;
  function unplacedGrid() {
    if (unplaced) return unplaced;
    unplaced = walkGrid(createCollisionWorld({ obstacles: staticObstacles }), { ...cfg.bounds, cellM: cfg.cellM, radius: cfg.radiusM });
    for (const spot of Object.values(homes)) closeHouse(spot, unplaced);
    return unplaced;
  }

  const costAt = (x, z) => {
    const i = Math.max(0, Math.min(grid.nx - 1, Math.round((x - grid.minX) / grid.cellM)));
    const j = Math.max(0, Math.min(grid.nz - 1, Math.round((z - grid.minZ) / grid.cellM)));
    return cost[j * grid.nx + i];
  };

  
  function lineCost(a, b) {
    const g = gridOf();
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    const n = Math.max(1, Math.ceil(len / (g.cellM * 0.25)));
    let c = 0;
    for (let s = 0; s <= n; s++) {
      const x = a.x + ((b.x - a.x) * s) / n, z = a.z + ((b.z - a.z) * s) / n;
      if (!openAt(g, x, z)) return Infinity;
      if (s > 0) c += (len / n) * costAt(x, z);
    }
    return c;
  }

  function smooth(points) {
    const pre = [0];
    for (let n = 1; n < points.length; n++) {
      const a = points[n - 1], b = points[n];
      pre.push(pre[n - 1] + Math.hypot(b.x - a.x, b.z - a.z) * (costAt(a.x, a.z) + costAt(b.x, b.z)) / 2);
    }
    const out = [points[0]];
    let i = 0;
    while (i < points.length - 1) {
      let j = i + 1;
      while (j + 1 < points.length && lineCost(points[i], points[j + 1]) <= (pre[j + 1] - pre[i]) * cfg.smoothSlack + 1e-9) j++;
      out.push(points[j]);
      i = j;
    }
    return out;
  }

  const homeByKey = (key) => (key.startsWith('home:') ? homes[key.slice(5)] || null : null);
  const workByKey = (key) => (key.startsWith('work:') ? workplaces[key.slice(5)] || null : null);
  const nodeAt = (key) => {
    if (SPOTS[key]) return SPOTS[key];
    const w = workByKey(key);
    if (w) return w;
    const h = homeByKey(key);
    if (!h) throw new Error(`village: no spot '${key}'`);
    return homeDoor(h);
  };

  const routes = new Map();
  
  function route(a, b) {
    const key = `${a}|${b}`;
    if (routes.has(key)) return routes.get(key);
    let poly;
    
    
    
    if (a > b) poly = polyOf([...route(b, a).points].reverse());
    else {
      const g = gridOf();
      const from = nodeAt(a), to = nodeAt(b);
      let found = walkPath(g, from, to, { cost });
      
      
      
      
      
      
      
      
      
      if (!found && placed.size) found = walkPath(unplacedGrid(), from, to, { cost });
      if (!found) throw new Error(`village: no walk from ${a} to ${b}`);
      poly = polyOf([{ x: from.x, z: from.z }, ...smooth(found.points), { x: to.x, z: to.z }]);
    }
    routes.set(key, poly);
    return poly;
  }

  



  function standPoint(key, slot, ownKey) {
    const node = nodeAt(key);
    if ((key === ownKey && key.startsWith('home:')) || key.startsWith('work:')) return { x: node.x, z: node.z };
    const g = gridOf();
    
    const a = (slot % cfg.standRingSlots) * ((Math.PI * 2) / cfg.standRingSlots) + Math.PI / cfg.standRingSlots;
    for (const r of [cfg.standRingM, cfg.standRingM * 0.5]) {
      const p = { x: node.x + Math.sin(a) * r, z: node.z + Math.cos(a) * r };
      if (openAt(g, p.x, p.z) && lineCost(node, p) < Infinity) return p;
    }
    return { x: node.x, z: node.z };
  }

  const lookAt = (key) => {
    if (SPOTS[key]) return LOOK[SPOTS[key].look] || nodeAt(key);
    const w = workByKey(key);
    if (w) return { x: w.x + Math.sin(w.heading), z: w.z + Math.cos(w.heading) };
    const h = homeByKey(key);
    return h ? { x: h.x, z: h.z } : nodeAt(key);
  };

  function ambleOf(stand, stayMs, t0, u) {
    if (stayMs < cfg.ambleMinS * MS) return null;
    const g = gridOf();
    const dist = cfg.ambleM[0] + u * (cfg.ambleM[1] - cfg.ambleM[0]);
    for (let n = 0; n < 4; n++) {
      const a = u * Math.PI * 2 + (n * Math.PI) / 2;
      const p = { x: stand.x + Math.sin(a) * dist, z: stand.z + Math.cos(a) * dist };
      if (!openAt(g, p.x, p.z) || lineCost(stand, p) === Infinity) continue;
      const legMs = (dist / cfg.walkMps) * MS;
      const out0 = t0 + stayMs * 0.3, back0 = t0 + stayMs * 0.62;
      if (out0 + legMs > back0 || back0 + legMs > t0 + stayMs) return null;
      return { p, out0, out1: out0 + legMs, back0, back1: back0 + legMs };
    }
    return null;
  }

  
  function nightKey(world, villager) {
    if (homes[villager.id]) return homeKey(villager.id);
    return GATHERING[seedOf(`${world.seed}|gather|${villager.id}`) % GATHERING.length];
  }

  
  function shiftsOf(slot) {
    return work
      .filter((w) => w.villager === slot && workplaces[w.place])
      .map((w) => ({ key: workKey(w.place), fromMs: (w.fromHour / 24) * DAY_MS, toMs: (w.toHour / 24) * DAY_MS }))
      .sort((a, b) => a.fromMs - b.fromMs);
  }

  const days = new Map();
  function timeline(world, villager, day) {
    const slot = Math.max(0, (world.villagers || []).findIndex((v) => v.id === villager.id));
    const own = nightKey(world, villager);
    const key = `${world.seed}|${world.createdAt}|${villager.id}|${slot}|${own}|${version}|${day}`;
    if (days.has(key)) return days.get(key);
    const hash = (what) => seedOf(`${world.seed}|village|${villager.id}|${day}|${what}`);
    const unit = (what) => (hash(what) % 10007) / 10007;
    const wake = (cfg.wakeHour / 24) * DAY_MS + unit('wake') * cfg.jitterS * MS;
    const homeBy = (cfg.homeByHour / 24) * DAY_MS - unit('home') * cfg.jitterS * MS;
    const walkOf = (from, to) => polyOf([standPoint(from, slot, own), ...route(from, to).points, standPoint(to, slot, own)]);
    const walkMsOf = (poly) => (poly.total / cfg.walkMps) * MS;
    const options = Object.keys(SPOTS).map((s) => {
      const w = cfg.weights[s];
      if (!(w > 0)) throw new Error(`village: SPOTS.${s} has no weight in VILLAGE.weights`);
      return [s, w];
    });
    for (const v of world.villagers || []) if (v.id !== villager.id && homes[v.id]) options.push([homeKey(v.id), cfg.weights.visit]);
    const segs = [];
    let at = own, cursor = wake, k = 0;

    const walkTo = (dest, t0) => {
      const poly = walkOf(at, dest);
      const t1 = t0 + walkMsOf(poly);
      segs.push({ kind: 'walk', t0, t1, poly, to: dest });
      at = dest;
      cursor = t1;
    };
    
    const fill = (untilMs, next) => {
      for (; k < 256; k++) {
        const open = options.filter(([s]) => s !== at);
        const total = open.reduce((n, [, w]) => n + w, 0);
        let r = hash(`dest${k}`) % total, dest = open[0][0];
        for (const [s, w] of open) { if (r < w) { dest = s; break; } r -= w; }
        const stayMs = (cfg.lingerS[0] + unit(`stay${k}`) * (cfg.lingerS[1] - cfg.lingerS[0])) * MS;
        const there = walkMsOf(walkOf(at, dest));
        if (cursor + there + stayMs + walkMsOf(walkOf(dest, next)) > untilMs) { k++; return; }
        walkTo(dest, cursor);
        const stand = standPoint(dest, slot, own);
        segs.push({ kind: 'stay', t0: cursor, t1: cursor + stayMs, at: stand, look: lookAt(dest), place: dest, amble: ambleOf(stand, stayMs, cursor, unit(`amble${k}`)) });
        cursor += stayMs;
      }
    };

    for (const shift of shiftsOf(slot)) {
      if (shift.fromMs < cursor || shift.toMs > homeBy) continue;
      fill(shift.fromMs, shift.key);
      const toWork = walkMsOf(walkOf(at, shift.key));
      const leave = Math.max(cursor, shift.fromMs - toWork);
      if (leave > cursor) {
        
        segs.push({ kind: 'stay', t0: cursor, t1: leave, at: standPoint(at, slot, own), look: lookAt(at), place: at, amble: null });
        cursor = leave;
      }
      walkTo(shift.key, cursor);
      const w = workByKey(shift.key);
      const end = Math.max(cursor, shift.toMs);
      segs.push({ kind: 'stay', t0: cursor, t1: end, at: { x: w.x, z: w.z }, look: lookAt(shift.key), heading: w.heading, place: shift.key, amble: null, work: true });
      cursor = end;
    }
    fill(homeBy, own);
    if (at !== own) walkTo(own, cursor);
    const night = standPoint(own, slot, own);
    const plan = { wake, homeAt: cursor, segs, own, night, nightLook: lookAt(own), home: homes[villager.id] || null };
    if (days.size > 64) days.delete(days.keys().next().value);
    days.set(key, plan);
    return plan;
  }

  
  function setHome(id, spot) {
    
    const h = Object.freeze({ x: spot.x, z: spot.z, rotY: 0, seed: spot.seed || 1, chosenAt: spot.chosenAt ?? null });
    homes[id] = h;
    collision.add(homeKey(id), homeObstacle(h));
    if (grid) closeHouse(h);
    if (unplaced) closeHouse(h, unplaced);
    routes.clear();
    days.clear();
    version += 1;
    return h;
  }

  






















  function setPlaced(items = []) {
    const next = new Map();
    for (const it of items) {
      if (!it || !Number.isFinite(it.x) || !Number.isFinite(it.z)) continue;
      const r = Number.isFinite(it.r) && it.r > 0 ? it.r : cfg.radiusM;
      next.set(it.id, placedRouteObstacle({ x: it.x, z: it.z, r }));
    }
    const same = next.size === placed.size
      && [...next].every(([id, ob]) => {
        const was = placed.get(id);
        return was && was.x === ob.x && was.z === ob.z && was.r === ob.r;
      });
    if (same) return false;
    for (const id of placed.keys()) collision.remove(placedKey(id));
    placed.clear();
    for (const [id, ob] of next) {
      placed.set(id, ob);
      collision.add(placedKey(id), ob);
    }
    grid = null;
    cost = null;
    routes.clear();
    days.clear();
    version += 1;
    return true;
  }

  return {
    cfg, P, collision, staticObstacles, spots: SPOTS, forage, workplaces, work, grid: gridOf, route, standPoint, timeline, lookAt, setHome,
    homes, setPlaced,
    
    get placed() { return [...placed.values()]; },
    
    restoreHomes(saved = {}) { for (const [id, spot] of Object.entries(saved)) setHome(Number(id), spot); },
    get version() { return version; },
  };
}


export function homeOf(village, villager) {
  const h = village.homes[villager.id];
  return h ? { ...h, door: homeDoor(h) } : null;
}







export function chooseHomeSpot(village, world, villager, t, rules = HOME_RULES) {
  const trees = orchardView(world, t, village.P);
  const others = Object.entries(village.homes).filter(([id]) => Number(id) !== villager.id).map(([, h]) => homeRoomObstacle(h));
  const keepFree = [...Object.values(SPOTS), ...Object.values(village.workplaces)];
  const reachM = WALK_EDGE_M - rules.edgeMarginM - Math.hypot(HOME_ROOM.halfXM, HOME_ROOM.halfZM);
  const grid = village.grid();
  for (let k = 0; k < rules.candidates; k++) {
    const a = (seedOf(`${world.seed}|home|${villager.id}|${k}|angle`) / U32) * Math.PI * 2;
    const d = Math.sqrt(seedOf(`${world.seed}|home|${villager.id}|${k}|radius`) / U32) * reachM;
    const spot = { x: Math.round(Math.sin(a) * d * 100) / 100, z: Math.round(Math.cos(a) * d * 100) / 100, rotY: 0 };
    const room = homeRoomObstacle(spot);
    const pts = boxPoints(room, rules.sampleM);
    if (pts.some((p) => pathDistance(p.x, p.z) <= PATH_HALF_WIDTH + rules.pathClearM || Math.hypot(p.x, p.z) >= WALK_EDGE_M - rules.edgeMarginM)) continue;
    if (keepFree.some((s) => penetration(room, s.x, s.z, rules.spotClearM).depth > 0)) continue;
    if ((village.forage || []).some((s) => penetration(room, s.x, s.z, s.r + rules.forageClearM).depth > 0)) continue;
    if (trees.some((tr) => penetration(room, tr.x, tr.z, 0.5 + rules.treeClearM).depth > 0)) continue;
    if (others.some((ob) => roomTouches(room, ob, 0))) continue;
    if (village.staticObstacles.some((ob) => roomTouches(room, ob, rules.obstacleClearM))) continue;
    const door = homeDoor(spot);
    if (!openAt(grid, door.x, door.z) || !walkPath(grid, door, SPOTS.shop)) continue;
    return { ...spot, seed: 1 + (seedOf(`${world.seed}|home|${villager.id}|seed`) % 97), chosenAt: t, candidate: k };
  }
  return null;
}






export function syncHomes(village, world, t) {
  const chosen = [];
  for (const v of world.villagers || []) {
    if (village.homes[v.id] || !(v.levels && v.levels.length)) continue;
    
    const spot = v.home === 'cottage' ? { ...COTTAGE_SPOT, chosenAt: t, candidate: -1 } : chooseHomeSpot(village, world, v, t);
    if (spot) chosen.push({ villager: v.id, spot: village.setHome(v.id, spot), candidate: spot.candidate });
  }
  return chosen;
}









export function villagerPose(village, world, villager, t) {
  const { cfg } = village;
  const day = dayOf(world, t);
  const ms = t - dayStart(world, day);
  const plan = village.timeline(world, villager, day);
  const restDoing = plan.home ? 'home' : 'resting';
  if (ms < plan.wake || ms >= plan.homeAt || plan.segs.length === 0) {
    if (plan.home) {
      const houseUp = HOUSE_STAGES.includes(homeStage(villager, t).stage);
      const night = isNightHour(localHour(t, world.tzOffsetMin || 0)) && !isNightOwl(world, villager.id);
      return { x: plan.night.x, z: plan.night.z, heading: plan.home.rotY || 0, speed: 0, doing: 'home', place: plan.own, inside: houseUp && night };
    }
    const heading = Math.atan2(plan.nightLook.x - plan.night.x, plan.nightLook.z - plan.night.z);
    return { x: plan.night.x, z: plan.night.z, heading, speed: 0, doing: 'resting', place: plan.own, inside: false };
  }
  const seg = plan.segs.find((s) => ms >= s.t0 && ms < s.t1) || plan.segs[plan.segs.length - 1];
  if (seg.kind === 'walk') {
    const d = Math.min(seg.poly.total, ((ms - seg.t0) / MS) * cfg.walkMps);
    const p = pointOn(seg.poly, d);
    return { x: p.x, z: p.z, heading: p.heading, speed: cfg.walkMps, doing: 'walking', place: seg.to, inside: false };
  }
  if (seg.work) return { x: seg.at.x, z: seg.at.z, heading: seg.heading, speed: 0, doing: 'working', place: seg.place, inside: false };
  const doing = SPOTS[seg.place] ? seg.place : seg.place === plan.own ? restDoing : 'visiting';
  let x = seg.at.x, z = seg.at.z, speed = 0;
  let heading = Math.atan2(seg.look.x - x, seg.look.z - z);
  const a = seg.amble;
  if (a) {
    const out = (u) => ({ x: seg.at.x + (a.p.x - seg.at.x) * u, z: seg.at.z + (a.p.z - seg.at.z) * u });
    let q = null;
    if (ms >= a.out0 && ms < a.out1) { q = out((ms - a.out0) / (a.out1 - a.out0)); heading = Math.atan2(a.p.x - seg.at.x, a.p.z - seg.at.z); speed = cfg.walkMps; }
    else if (ms >= a.out1 && ms < a.back0) { q = out(1); heading = Math.atan2(seg.look.x - a.p.x, seg.look.z - a.p.z); }
    else if (ms >= a.back0 && ms < a.back1) { q = out(1 - (ms - a.back0) / (a.back1 - a.back0)); heading = Math.atan2(seg.at.x - a.p.x, seg.at.z - a.p.z); speed = cfg.walkMps; }
    if (q) { x = q.x; z = q.z; }
  }
  return { x, z, heading, speed, doing, place: seg.place, inside: false };
}
