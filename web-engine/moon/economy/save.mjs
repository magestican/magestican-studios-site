



















































import { WORLD_VERSION } from './world.mjs';

export const SAVE_FORMAT = 'fml.save';
export const SAVE_VERSION = 2;


export const SAVE_SLOT = 'moon';







export const LEGACY_BUILD_KEY = 'fml.player.build';

const isObj = (v) => Boolean(v) && typeof v === 'object' && !Array.isArray(v);

const HOME = 0;
const planetOf = (e) => (Number.isInteger(e && e.planet) ? e.planet : HOME);
const isInt = (v) => Number.isInteger(v);
const isNum = (v) => Number.isFinite(v);


export function legacyDoc(build) {
  if (typeof build !== 'string' || !build) return null;
  return { format: SAVE_FORMAT, version: 0, build };
}





export const MIGRATIONS = Object.freeze([
  Object.freeze({
    from: 0,
    to: 1,
    note: 'the build kept in localStorage becomes a save with no moon in it',
    up: (doc) => ({
      format: SAVE_FORMAT,
      version: 1,
      savedAt: 0,
      
      
      
      world: null,
      village: { homes: {} },
      player: { build: doc.build, x: null, z: null, heading: null, at: 0 },
      seedKind: null,
    }),
  }),
  Object.freeze({
    from: 1,
    to: 2,
    note: 'when you first played, derived from the moon you have been playing',
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    up: (doc) => ({
      ...doc,
      version: 2,
      firstPlayed: isObj(doc.world) && isInt(doc.world.createdAt) ? doc.world.createdAt
        : (isInt(doc.savedAt) ? doc.savedAt : 0),
    }),
  }),
]);






export function migrate(doc, { migrations = MIGRATIONS, to = SAVE_VERSION } = {}) {
  if (!isObj(doc)) throw new Error('a save must be an object');
  if (!isInt(doc.version) || doc.version < 0) throw new Error(`a save needs an integer version, got ${JSON.stringify(doc.version)}`);
  if (doc.version > to) throw new Error(`this save is version ${doc.version} and this build reads ${to} - it was written by a newer build`);
  let out = doc;
  const steps = [];
  
  
  for (let guard = 0; out.version < to; guard++) {
    if (guard > migrations.length) throw new Error(`migrating ${doc.version} -> ${to} did not finish in ${migrations.length} steps`);
    const step = migrations.find((m) => m.from === out.version);
    if (!step) throw new Error(`no migration from version ${out.version} (this build reads ${to})`);
    out = step.up(out);
    if (!isObj(out) || out.version !== step.to) throw new Error(`the migration ${step.from} -> ${step.to} returned version ${out && out.version}`);
    steps.push(`${step.from}->${step.to}`);
  }
  return { doc: out, steps };
}






const copy = (v) => JSON.parse(JSON.stringify(v));







export function makeSave({
  world, homes = {}, player = null, seedKind = null, savedAt = null, firstPlayed = null,
} = {}) {
  if (!isObj(world)) throw new Error('makeSave needs the world');
  const at = isInt(savedAt) ? savedAt : (isInt(world.clockAt) ? world.clockAt : 0);
  return {
    format: SAVE_FORMAT,
    version: SAVE_VERSION,
    savedAt: at,
    
    
    
    
    
    firstPlayed: isInt(firstPlayed) && firstPlayed >= 0 ? firstPlayed
      : (isInt(world.createdAt) ? world.createdAt : at),
    world: copy(world),
    village: { homes: copy(homes) },
    player: isObj(player)
      ? {
        build: typeof player.build === 'string' ? player.build : null,
        x: isNum(player.x) ? player.x : null,
        z: isNum(player.z) ? player.z : null,
        heading: isNum(player.heading) ? player.heading : null,
        at: isInt(player.at) && player.at >= 0 ? player.at : 0,
      }
      : { build: null, x: null, z: null, heading: null, at: 0 },
    seedKind: typeof seedKind === 'string' ? seedKind : null,
  };
}




export function checkSave(doc) {
  if (!isObj(doc)) return 'not an object';
  if (doc.format !== SAVE_FORMAT) return `not a ${SAVE_FORMAT} document (format ${JSON.stringify(doc.format)})`;
  if (doc.version !== SAVE_VERSION) return `version ${doc.version}, expected ${SAVE_VERSION}`;
  if (!isInt(doc.savedAt)) return 'savedAt is not integer milliseconds';
  if (!isInt(doc.firstPlayed) || doc.firstPlayed < 0) return 'firstPlayed is not integer milliseconds';
  if (doc.world !== null) {
    const why = checkWorld(doc.world);
    if (why) return `world: ${why}`;
  }
  if (!isObj(doc.village) || !isObj(doc.village.homes)) return 'village.homes is missing';
  if (!isObj(doc.player)) return 'player is missing';
  return null;
}









const WORLD_LISTS = ['trees', 'rocks', 'forage', 'buildings', 'villagers', 'placed', 'land'];
const WORLD_MAPS = ['pockets', 'made', 'shop', 'stats', 'town'];
const ID_LISTS = ['trees', 'rocks', 'buildings', 'villagers', 'placed'];


export function checkWorld(w) {
  if (!isObj(w)) return 'not an object';
  if (!isInt(w.version) || w.version < 1) return 'no version';
  if (w.version > WORLD_VERSION) return `world version ${w.version}, this build knows ${WORLD_VERSION}`;
  if (!isInt(w.seed) || w.seed <= 0) return 'no seed';
  if (!isInt(w.createdAt) || !isInt(w.clockAt)) return 'createdAt and clockAt must be integer milliseconds';
  if (w.clockAt < w.createdAt) return 'clockAt is before createdAt';
  if (!isNum(w.coins)) return 'coins is not a number';
  if (!isInt(w.nextId) || w.nextId < 1) return 'no nextId';
  for (const k of WORLD_LISTS) if (k in w && !Array.isArray(w[k])) return `${k} is not an array`;
  for (const k of WORLD_MAPS) if (k in w && !isObj(w[k])) return `${k} is not an object`;
  
  
  
  for (const k of ID_LISTS) {
    for (const item of w[k] || []) {
      if (!isObj(item) || !isInt(item.id)) return `${k}: an entry has no id`;
      if (item.id >= w.nextId) return `${k}: id ${item.id} is at or past nextId ${w.nextId}`;
    }
  }
  return null;
}







export function readSave(raw, { migrations = MIGRATIONS, to = SAVE_VERSION } = {}) {
  const none = (reason) => ({ ok: false, doc: null, steps: [], reason });
  if (raw === null || raw === undefined) return none('no save');
  let doc = raw;
  if (typeof raw === 'string') {
    try { doc = JSON.parse(raw); } catch (e) { return none(`the save is not JSON: ${e.message}`); }
  }
  let steps = [];
  try {
    const up = migrate(doc, { migrations, to });
    doc = up.doc;
    steps = up.steps;
  } catch (e) {
    return none(e.message);
  }
  const why = checkSave(doc);
  if (why) return none(`the save is damaged - ${why}`);
  return { ok: true, doc, steps, reason: null };
}








export function fitsMoon(saved, fresh) {
  if (!isObj(saved) || !isObj(fresh)) return 'nothing to compare';
  if (saved.seed !== fresh.seed) return `the save is moon seed ${saved.seed}, this is moon seed ${fresh.seed}`;
  
  
  
  
  
  
  
  
  
  
  
  const homeOf = (list) => (list || []).filter((e) => planetOf(e) === HOME);
  if (saved.rocks) {
    const a = homeOf(saved.rocks).length;
    const b = homeOf(fresh.rocks).length;
    if (a !== b) return `the save has ${a} rocks on the moon, this moon has ${b}`;
  }
  if (saved.forage) {
    const a = homeOf(saved.forage);
    const b = homeOf(fresh.forage);
    if (a.length !== b.length) return `the save has ${a.length} forage spots on the moon, this moon has ${b.length}`;
    for (let i = 0; i < b.length; i++) {
      if (a[i].type !== b[i].type) return `forage spot ${i} is ${b[i].type} on this moon and ${a[i].type} in the save`;
    }
  }
  
  
  
  for (const which of ['rocks', 'forage']) {
    const savedWild = (saved[which] || []).filter((e) => planetOf(e) !== HOME);
    if (!savedWild.length) continue;
    const freshWild = (fresh[which] || []).filter((e) => planetOf(e) !== HOME);
    if (savedWild.length !== freshWild.length) {
      return `the save has ${savedWild.length} ${which} on the other planets, this system has ${freshWild.length}`;
    }
    for (let i = 0; i < freshWild.length; i++) {
      if (planetOf(savedWild[i]) !== planetOf(freshWild[i])) {
        return `${which} ${i} is on planet ${planetOf(freshWild[i])} in this system and planet ${planetOf(savedWild[i])} in the save`;
      }
      if (which === 'forage' && savedWild[i].type !== freshWild[i].type) {
        return `forage spot ${i} on planet ${planetOf(freshWild[i])} is ${freshWild[i].type} in this system and ${savedWild[i].type} in the save`;
      }
    }
  }
  
  
  
  
  if (saved.finds) {
    if (saved.finds.length !== fresh.finds.length) return `the save has ${saved.finds.length} finds, this system has ${fresh.finds.length}`;
    for (let i = 0; i < fresh.finds.length; i++) {
      if (saved.finds[i].kind !== fresh.finds[i].kind || saved.finds[i].planet !== fresh.finds[i].planet) {
        return `find ${i} is ${fresh.finds[i].kind} on planet ${fresh.finds[i].planet} in this system and ${saved.finds[i].kind} on planet ${saved.finds[i].planet} in the save`;
      }
    }
  }
  return null;
}












export function restoreWorld(fresh, saved) {
  const why = checkWorld(saved);
  if (why) throw new Error(`cannot restore: ${why}`);
  const defaults = { ...fresh };
  const from = copy(saved);
  const filled = Object.keys(defaults).filter((k) => !(k in from));
  const extra = Object.keys(from).filter((k) => !(k in defaults));
  for (const k of Object.keys(fresh)) delete fresh[k];
  Object.assign(fresh, defaults, from);
  
  
  fresh.version = WORLD_VERSION;
  const adopted = adoptWildPlanets(fresh, defaults);
  return { filled, extra, adopted };
}































function adoptWildPlanets(world, fresh) {
  const adopted = {};
  for (const which of ['trees', 'rocks', 'forage']) {
    const mine = Array.isArray(world[which]) ? world[which] : [];
    const theirs = Array.isArray(fresh[which]) ? fresh[which] : [];
    const known = new Set(mine.map(planetOf));
    const add = theirs.filter((e) => planetOf(e) !== HOME && !known.has(planetOf(e)));
    if (!add.length) continue;
    for (const entry of add) {
      const copied = copy(entry);
      
      
      if (which === 'forage') copied.id = mine.length;
      else {
        copied.id = world.nextId;
        world.nextId += 1;
      }
      mine.push(copied);
    }
    world[which] = mine;
    adopted[which] = add.length;
  }
  return adopted;
}
