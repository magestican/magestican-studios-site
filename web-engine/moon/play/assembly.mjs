

























































import { CRAFTABLES } from '../economy/craftables.mjs';
import { WORK_DAY_MS } from '../economy/clock.mjs';
import { PLAZA } from '../world/moonLayout.mjs';
import { seedOf } from '../voice/mumble.mjs';
import { ITALIAN_NAMES, villagerName } from './people.mjs';
import { ownsHome } from './playerHome.mjs';

export const ASSEMBLY = Object.freeze({
  
  
  
  ringM: 3.4,
  ringSlots: 9,
  
  
  bellFromPlaza: Object.freeze({ x: 2.1, z: 3.5 }),
  standGapM: 1.1,
  
  
  
  
  arrivedM: 1.6,
  
  perDay: 1,
  
  motions: 3,
});


export const MOTION_KINDS = Object.freeze(['building', 'path', 'villager']);





export const TOWN_BUILDINGS = Object.freeze(['tieredFountain', 'stoneWell', 'bigFirePit', 'humanGardenHouse', 'squareFountain', 'roundWell']);

export const TOWN_PATHS = Object.freeze(['flagstonePath', 'pebblePath', 'steppingStones']);


export const BUILD_DAYS = Object.freeze({ building: 4, path: 2, villager: 3 });

const isObj = (v) => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
const num = (v) => (Number.isFinite(v) ? v : 0);
const catalogueName = (id) => (CRAFTABLES[id] ? CRAFTABLES[id].name : String(id));












export function newAssembly() {
  return { open: null, meetings: [], works: [] };
}


export function assemblyOf(world) {
  const a = isObj(world) && isObj(world.assembly) ? world.assembly : {};
  return {
    open: isObj(a.open) ? { calledAt: num(a.open.calledAt), motions: (a.open.motions || []).map((m) => ({ ...m })) } : null,
    meetings: (Array.isArray(a.meetings) ? a.meetings : []).filter(isObj).map((m) => ({ ...m })),
    works: (Array.isArray(a.works) ? a.works : []).filter(isObj).map((w) => ({ ...w })),
  };
}

function own(world) {
  world.assembly = assemblyOf(world);
  return world.assembly;
}


export const meetingsHeld = (world) => assemblyOf(world).meetings.length;


export const meetingOpen = (world) => assemblyOf(world).open;




export function bellAt(cfg = ASSEMBLY) {
  const x = PLAZA.x + cfg.bellFromPlaza.x;
  const z = PLAZA.z + cfg.bellFromPlaza.z;
  const len = Math.hypot(cfg.bellFromPlaza.x, cfg.bellFromPlaza.z) || 1;
  return Object.freeze({
    x,
    z,
    front: Object.freeze({
      x: x + (cfg.bellFromPlaza.x / len) * cfg.standGapM,
      z: z + (cfg.bellFromPlaza.z / len) * cfg.standGapM,
    }),
  });
}







export function bellPlaces(world, { planet = 0 } = {}) {
  if (planet !== 0 || !ownsHome(world)) return [];
  const bell = bellAt();
  return [Object.freeze({ type: 'bell', x: bell.x, z: bell.z, front: { x: bell.front.x, z: bell.front.z } })];
}


export const dayOf = (world, t) => Math.floor((num(t) - num(world.createdAt)) / WORK_DAY_MS);







export function whyNoAssembly(world, t, cfg = ASSEMBLY) {
  if (!ownsHome(world)) return 'Own a house in the town first - then you have a say in it.';
  const a = assemblyOf(world);
  if (a.open) return null;
  const today = dayOf(world, t);
  const held = a.meetings.filter((m) => dayOf(world, m.calledAt) === today).length;
  if (held >= cfg.perDay) return 'The town has already met today. Ring again tomorrow.';
  return null;
}








export function motionsFor(world, t) {
  const day = dayOf(world, t);
  const key = (what) => seedOf(`assembly|${world.seed}|${day}|${what}`);
  const building = TOWN_BUILDINGS[key('building') % TOWN_BUILDINGS.length];
  const path = TOWN_PATHS[key('path') % TOWN_PATHS.length];
  const taken = new Set((world.villagers || []).map((v) => villagerName(v, world.villagers)));
  const free = ITALIAN_NAMES.filter((n) => !taken.has(n));
  const newcomer = free.length ? free[key('villager') % free.length] : ITALIAN_NAMES[key('villager') % ITALIAN_NAMES.length];
  return [
    Object.freeze({ id: 'building', kind: 'building', item: building, name: catalogueName(building), label: `Build ${aOrAn(catalogueName(building))} in the square`, days: BUILD_DAYS.building }),
    Object.freeze({ id: 'path', kind: 'path', item: path, name: catalogueName(path), label: `Lay ${aOrAn(catalogueName(path))} through the town`, days: BUILD_DAYS.path }),
    Object.freeze({ id: 'villager', kind: 'villager', item: null, name: newcomer, label: `Invite ${newcomer} to come and live here`, days: BUILD_DAYS.villager }),
  ];
}

const aOrAn = (name) => `${/^[aeiou]/i.test(name) ? 'an' : 'a'} ${name}`;








export function gatherSpots(n, cfg = ASSEMBLY) {
  const slots = Math.max(1, Math.min(num(n) || 1, cfg.ringSlots));
  const out = [];
  for (let i = 0; i < slots; i += 1) {
    
    
    const a = (i / cfg.ringSlots) * Math.PI * 2 + 0.35;
    const x = PLAZA.x + Math.sin(a) * cfg.ringM;
    const z = PLAZA.z + Math.cos(a) * cfg.ringM;
    out.push(Object.freeze({ x, z, heading: Math.atan2(PLAZA.x - x, PLAZA.z - z) }));
  }
  return Object.freeze(out);
}




export const TRAITS = Object.freeze(['builder', 'gardener', 'host', 'thrifty', 'dreamer']);




const LEAN = Object.freeze({
  builder: Object.freeze({ building: 2, path: 1, villager: 0 }),
  gardener: Object.freeze({ building: -1, path: 2, villager: 0 }),
  host: Object.freeze({ building: 0, path: 0, villager: 2 }),
  thrifty: Object.freeze({ building: -2, path: -1, villager: -1 }),
  dreamer: Object.freeze({ building: 1, path: -1, villager: 2 }),
});

const BECAUSE = Object.freeze({
  builder: Object.freeze({ building: 'loves a building site', path: 'likes a job with an end to it', villager: 'has no strong feeling' }),
  gardener: Object.freeze({ building: 'would rather keep the grass', path: 'is tired of muddy boots', villager: 'has no strong feeling' }),
  host: Object.freeze({ building: 'has no strong feeling', path: 'has no strong feeling', villager: 'would love the company' }),
  thrifty: Object.freeze({ building: 'thinks it dear', path: 'thinks the lane does', villager: 'worries about the room' }),
  dreamer: Object.freeze({ building: 'likes the look of it', path: 'likes the square as it is', villager: 'wants somebody new to talk to' }),
});


export function traitOf(villager) {
  return TRAITS[seedOf(`trait|${villager.species}|${villager.id}`) % TRAITS.length];
}







export const fondness = (villager) => Math.max(0, Math.min(2, (villager.levels || []).length));










export function voteOf(villager, motion, villagers = []) {
  const trait = traitOf(villager);
  const lean = num(LEAN[trait][motion.kind]);
  const fond = fondness(villager);
  const weight = lean + fond;
  const yes = weight >= 1;
  const feeling = BECAUSE[trait][motion.kind];
  return {
    id: villager.id,
    name: villagerName(villager, villagers),
    trait,
    yes,
    weight,
    because: fond > 0 && lean <= 0 && yes ? `${feeling}, but is fond of you` : feeling,
  };
}


export const votesOn = (world, motion) => (world.villagers || []).map((v) => voteOf(v, motion, world.villagers));


export function countVotes(world, motion) {
  const votes = votesOn(world, motion);
  const yes = votes.filter((v) => v.yes).length;
  return { for: yes, against: votes.length - yes, carried: yes * 2 > votes.length, votes };
}







export function callAssembly(world, t, cfg = ASSEMBLY) {
  const why = whyNoAssembly(world, t, cfg);
  if (why) return { why };
  const a = own(world);
  if (a.open) return { ...a.open, why: null };
  a.open = { calledAt: num(t), motions: motionsFor(world, t).map((m) => ({ ...m })) };
  return { ...a.open, why: null };
}


export function closeAssembly(world) {
  const a = own(world);
  if (!a.open) return false;
  a.open = null;
  return true;
}






export function arrivals(world, poses = [], cfg = ASSEMBLY) {
  const villagers = world.villagers || [];
  const spots = gatherSpots(villagers.length, cfg);
  return villagers.map((v, i) => {
    const pose = poses.find((p) => p && p.id === v.id) || null;
    const spot = spots[i % spots.length];
    const d = pose ? Math.hypot(pose.x - spot.x, pose.z - spot.z) : Infinity;
    return { id: v.id, name: villagerName(v, villagers), spot, distance: d, here: d <= cfg.arrivedM };
  });
}





export function assemblyView(world, t, { poses = [], cfg = ASSEMBLY } = {}) {
  const a = assemblyOf(world);
  if (!a.open) return null;
  const who = arrivals(world, poses, cfg);
  return {
    calledAt: a.open.calledAt,
    day: dayOf(world, a.open.calledAt),
    here: who.filter((w) => w.here).length,
    of: who.length,
    walking: who.filter((w) => !w.here).map((w) => w.name),
    who,
    motions: a.open.motions.map((m) => {
      const count = countVotes(world, m);
      return { ...m, for: count.for, against: count.against, wouldCarry: count.carried, votes: count.votes };
    }),
  };
}








export function putToVote(world, motionId, t) {
  const a = own(world);
  if (!a.open) return { why: 'Nobody has been called together.' };
  const motion = a.open.motions.find((m) => m.id === motionId);
  if (!motion) return { why: 'That is not on the table.' };
  const count = countVotes(world, motion);
  const at = num(t);
  const record = {
    calledAt: a.open.calledAt,
    decidedAt: at,
    motion: { ...motion },
    for: count.for,
    against: count.against,
    carried: count.carried,
  };
  a.meetings.push(record);
  a.open = null;
  let work = null;
  if (count.carried) {
    work = {
      key: `${motion.kind}:${a.meetings.length}`,
      kind: motion.kind,
      item: motion.item,
      name: motion.name,
      label: motion.label,
      startedAt: at,
      days: Math.max(1, num(motion.days) || BUILD_DAYS[motion.kind] || 1),
      doneAt: null,
    };
    a.works.push(work);
  }
  return { motion: { ...motion }, for: count.for, against: count.against, carried: count.carried, votes: count.votes, work };
}







export function worksOf(world, t) {
  const a = assemblyOf(world);
  const now = num(t);
  return a.works.map((w) => {
    const span = Math.max(1, num(w.days)) * WORK_DAY_MS;
    const gone = Math.max(0, now - num(w.startedAt));
    const finished = Boolean(w.doneAt) || gone >= span;
    return {
      ...w,
      done: finished,
      progress: finished ? 1 : Math.min(1, gone / span),
      daysLeft: finished ? 0 : Math.max(1, Math.ceil((span - gone) / WORK_DAY_MS)),
    };
  });
}





export function settleWorks(world, t) {
  const a = own(world);
  const now = num(t);
  const out = [];
  for (const w of a.works) {
    if (w.doneAt) continue;
    const span = Math.max(1, num(w.days)) * WORK_DAY_MS;
    if (now - num(w.startedAt) < span) continue;
    w.doneAt = now;
    out.push({ ...w });
  }
  return out;
}


export const worksDone = (world) => assemblyOf(world).works.filter((w) => w.doneAt).length;
















export function polyline(points) {
  const pts = (points || []).filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.z));
  const cum = [0];
  for (let i = 1; i < pts.length; i += 1) {
    cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z));
  }
  return { points: pts, cum, total: cum[cum.length - 1] || 0 };
}


export function along(poly, d) {
  const { points, cum } = poly;
  if (points.length === 0) return null;
  if (points.length === 1 || d <= 0) {
    const b = points[1] || points[0];
    return { x: points[0].x, z: points[0].z, heading: Math.atan2(b.x - points[0].x, b.z - points[0].z) };
  }
  for (let i = 1; i < points.length; i += 1) {
    if (d <= cum[i] || i === points.length - 1) {
      const a = points[i - 1], b = points[i];
      const u = Math.max(0, Math.min(1, (d - cum[i - 1]) / Math.max(1e-9, cum[i] - cum[i - 1])));
      return { x: a.x + (b.x - a.x) * u, z: a.z + (b.z - a.z) * u, heading: Math.atan2(b.x - a.x, b.z - a.z) };
    }
  }
  return null;
}











export function gatherPose(poly, spot, ms, mps = 1.0) {
  const walked = Math.max(0, (num(ms) / 1000) * mps);
  const done = !poly || poly.total <= 0 || walked >= poly.total;
  if (done) {
    return { x: spot.x, z: spot.z, heading: spot.heading, speed: 0, doing: 'assembly', place: 'town', inside: false, arrived: true };
  }
  const p = along(poly, walked);
  return { x: p.x, z: p.z, heading: p.heading, speed: mps, doing: 'walking', place: 'town', inside: false, arrived: false };
}


export const walkMs = (polys, mps = 1.0) => Math.max(0, ...polys.map((p) => ((p && p.total) || 0) / mps)) * 1000;
