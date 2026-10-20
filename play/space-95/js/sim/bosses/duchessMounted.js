


























import { contact, stompBounce } from '../combat.js';
import { STEP } from '../constants.js';
import { overlaps, spawnEntities } from '../entities.js';
import { removeTower, restoreTower } from '../motifs/collapse.js';
import { registerBossType } from './boss.js';

export const MOUNT = Object.freeze({
  RUSH: 9, 
  TUNNEL: 6, 
  STUCK: 3.0, 
  TRIP: 2.5, 
  DIVE: 0.8, 
  ERUPT: 0.3, 
  ERUPT_H: 3, 
  THROW: 3, 
  DIZZY: 3.0, 
  WOBBLE: 6, 
  BREATH: 1.0, 
  BACK: 6, 
  BODY_W: 5,
  BODY_H: 4.5,
  RIDER_W: 3,
  RIDER_H: 2,
  FIN_W: 1.5,
  FIN_H: 1.5,
  PUFF_FLIGHT: 0.6,
  ESCAPE_POP: 0.5,
  ESCAPE_SPEED: 12,
});

const COLLAPSE_RECENT = 0.05; 

const centre = (e) => (e.arena.x0 + e.arena.x1) / 2;

function entered(e, stage) {
  const key = `${e.phase}:${e.attackIdx}:${stage}`;
  if (e.fKey === key) return false;
  e.fKey = key;
  return true;
}


function mounted(e, x) {
  e.x = x;
  e.y = e.arena.y0;
  e.w = MOUNT.BODY_W;
  e.h = MOUNT.BODY_H;
  e.trowel = { ...e.trowel, x, y: e.arena.y0 };
  e.rider = { x, y: e.arena.y0 + 2.5, mounted: true, mood: e.rider?.mood ?? 'ride' };
}

function walkTo(e, x, v) {
  const d = x - e.x;
  const step = v * STEP;
  const nx = Math.abs(d) <= step ? x : e.x + Math.sign(d) * step;
  if (d !== 0) e.trowel.facing = Math.sign(d);
  mounted(e, nx);
  return nx === x;
}


function floorCells(e, world) {
  const T = world.tile;
  const f = e.floorSoil;
  const out = [];
  for (let c = Math.round(f.x0 / T); c < Math.round(f.x1 / T); c++)
    for (let r = Math.round(f.y0 / T); r < Math.round(f.y1 / T); r++) out.push([c, r]);
  return out;
}

const joIn = (p, c, r, T) => c * T < p.x + p.w / 2 && (c + 1) * T > p.x - p.w / 2 && r * T < p.y + p.h && (r + 1) * T > p.y;

function placeAll(world, cells, p) {
  const T = world.tile;
  for (const [c, r] of cells) if (!joIn(p, c, r, T)) world.placeSoil(c, r);
}

function heapCells(e, world) {
  const T = world.tile;
  const out = [];
  for (const [x0, x1, y0, y1] of e.heap ?? [])
    for (let c = Math.round(x0 / T); c < Math.round(x1 / T); c++)
      for (let r = Math.round(y0 / T); r < Math.round(y1 / T); r++) out.push([c, r]);
  return out;
}

const towersOf = (s, tags) => s.entities.filter((o) => o.kind === 'tower' && tags.includes(o.tag));


function setProps(e, ctx, i) {
  const s = ctx.session;
  const w = ctx.world;
  const T = w.tile;
  const p = ctx.player;
  const ph = e.phases;
  const all = ph.flatMap((x) => x.towers ?? []);
  const mine = ph[i].towers ?? [];
  
  for (const t of towersOf(s, all)) if (!mine.includes(t.tag)) removeTower(t, w);
  for (const t of towersOf(s, all)) if (mine.includes(t.tag)) restoreTower(t, w, p);
  placeAll(w, floorCells(e, w), p); 
  if (i === 2) {
    placeAll(w, heapCells(e, w), p);
    ctx.events.push({ type: 'heapBuilt', id: e.id, x: e.heap?.[0]?.[0] ?? 0, y: e.arena.y0 });
  } else for (const [c, r] of heapCells(e, w)) w.breakSoil(c, r);
  if (i === 1) {
    
    const cx = Math.round(centre(e) / T);
    for (const c of [cx - 1, cx])
      for (let r = Math.round(e.floorSoil.lane[1] / T); r < Math.round(e.floorSoil.y1 / T); r++) w.breakSoil(c, r);
    ctx.events.push({ type: 'tunnelDive', id: e.id, x: centre(e), y: e.arena.y0 });
  }
}

function breath(e, secs, weak) {
  e.recoverFor = secs;
  e.weakNow = weak;
}

function window(e, secs, weak) {
  e.endActive = true;
  breath(e, secs, weak);
}

function throwPuff(e, ctx, target) {
  e.puffN = (e.puffN ?? 0) + 1;
  const from = { x: e.rider.x, y: e.rider.y + MOUNT.RIDER_H };
  const def = {
    id: `${e.id}-puff-${e.puffN}`,
    kind: 'glitterPuff',
    x: from.x,
    y: from.y,
    x0: from.x,
    y0: from.y,
    tx: target.x,
    ty: target.y,
    flight: MOUNT.PUFF_FLIGHT,
  };
  ctx.session.entities.push(...spawnEntities([def]));
  ctx.events.push({ type: 'glitterToss', id: e.id, x: target.x, y: target.y });
}


function holeAt(e, world, x) {
  const T = world.tile;
  const c = Math.floor(x / T);
  for (let r = Math.round(e.floorSoil.lane[1] / T); r < Math.round(e.floorSoil.y1 / T); r++) if (world.solid(c, r)) return false;
  return true;
}

registerBossType('duchessMounted', {
  create(e) {
    e.facing = -1;
    e.mood = 'ride';
    e.trowel = { x: e.x, y: e.y, facing: -1, mood: 'idle' };
    e.rider = { x: e.x, y: e.y + 2.5, mounted: true, mood: 'ride' };
    e.ridge = null;
    e.firstRush = true;
    e.firstRun = true;
    e.firstGrand = true;
    e.w = MOUNT.BODY_W;
    e.h = MOUNT.BODY_H;
  },
  attack(e, ctx, atk, stage) {
    const p = ctx.player;
    const w = ctx.world;
    const enter = entered(e, stage);
    const floorY = e.arena.y0;
    switch (atk.name) {
      case 'spadeRush': {
        if (stage === 'telegraph') {
          if (enter) {
            e.dir = e.firstRush ? -1 : p.x < centre(e) ? -1 : 1;
            e.firstRush = false;
            e.trowel.mood = 'paw';
            e.rider.mood = 'crop';
            e.harmless = true;
            ctx.events.push({ type: 'rushLine', id: e.id, dir: e.dir, x: e.x, y: floorY, signals: ['visual:pink-crop', 'audio:chirp'] });
          }
          walkTo(e, e.x, 0);
        } else if (stage === 'active') {
          e.harmless = false;
          e.trowel.mood = 'rush';
          const face = e.dir < 0 ? e.faces.west + MOUNT.BODY_W / 2 : e.faces.east - MOUNT.BODY_W / 2;
          if (walkTo(e, face, MOUNT.RUSH)) {
            window(e, MOUNT.STUCK, true);
            e.harmless = true;
            e.trowel.mood = 'stuck';
            e.rider.mood = 'stuck';
            ctx.events.push({
              type: 'spadeStuck',
              id: e.id,
              side: e.dir < 0 ? 'west' : 'east',
              x: e.x,
              y: floorY,
              signals: ['visual:gold-stars', 'audio:ding-ding'],
            });
          }
        } else if (stage === 'recover') {
          e.harmless = true;
          if (enter && e.recoverFor === undefined) breath(e, 0.5, false); 
        }
        break;
      }
      case 'glitterFan': {
        if (stage === 'telegraph' && enter) {
          e.mark = { x: p.x, y: p.y };
          e.thrown = false;
          e.rider.mood = 'fan';
          ctx.events.push({ type: 'glitterMarker', id: e.id, x: e.mark.x, y: e.mark.y });
        }
        e.harmless = true;
        if (e.under) {
          
          e.under = false;
          e.ridge = null;
        }
        walkTo(e, e.phase === 1 ? e.x : centre(e), MOUNT.BACK); 
        if (stage === 'active' && !e.thrown) {
          throwPuff(e, ctx, e.mark);
          e.thrown = true;
        }
        if (stage === 'recover' && enter) breath(e, atk.recover, false);
        break;
      }
      case 'tunnelRun': {
        if (stage === 'telegraph') {
          if (enter) {
            const lo = e.floorSoil.x0 + 1;
            const hi = e.floorSoil.x1 - 1;
            const target = Math.max(lo, Math.min(hi, p.x));
            const from = e.firstRun ? hi : target < centre(e) ? hi : lo;
            e.firstRun = false;
            e.ridge = { x: from, dir: Math.sign(target - from) || -1, target };
            e.under = true;
            e.harmless = true;
            e.trowel.mood = 'tunnel';
            e.rider.mood = 'fin';
            ctx.events.push({ type: 'tunnelLine', id: e.id, from, target, y: floorY, signals: ['visual:pink-ring', 'audio:rising-chirp'] });
          }
          e.x = e.ridge.x;
          e.y = floorY - MOUNT.FIN_H; 
          e.w = MOUNT.FIN_W;
          e.h = MOUNT.FIN_H;
        } else if (stage === 'active') {
          const r = e.ridge;
          r.x += r.dir * MOUNT.TUNNEL * STEP;
          
          e.x = r.x;
          e.y = floorY;
          e.w = MOUNT.FIN_W;
          e.h = MOUNT.FIN_H;
          e.harmless = false;
          e.trowel = { ...e.trowel, x: r.x, y: e.floorSoil.lane[0], facing: r.dir, mood: 'tunnel' };
          e.rider = { x: r.x, y: floorY, mounted: true, mood: 'fin' };
          if (holeAt(e, w, r.x)) {
            
            const T = w.tile;
            const c = Math.floor(r.x / T);
            const fill = [];
            const joC = [Math.floor((p.x - p.w / 2) / T), Math.floor((p.x + p.w / 2 - 1e-7) / T)];
            for (const cc of [c - 1, c, c + 1].filter((k) => k < joC[0] || k > joC[1])) 
              for (let rr = Math.round(e.floorSoil.lane[1] / T); rr < Math.round(e.floorSoil.y1 / T); rr++) fill.push([cc, rr]);
            placeAll(w, fill, p);
            const tx = Math.max(e.floorSoil.x0 + 1, Math.min(e.floorSoil.x1 - 1, r.x + r.dir * MOUNT.THROW));
            window(e, MOUNT.TRIP, true);
            e.trowel = { x: r.x, y: floorY - 1.5, facing: r.dir, mood: 'tripped' };
            e.rider = { x: tx, y: floorY, mounted: false, mood: 'dizzy' };
            e.x = tx;
            e.y = floorY;
            e.w = MOUNT.RIDER_W;
            e.h = MOUNT.RIDER_H;
            e.harmless = true;
            e.ridge = null;
            ctx.events.push({
              type: 'tunnelTrip',
              id: e.id,
              x: r.x,
              riderX: tx,
              y: floorY,
              signals: ['visual:gold-stars', 'audio:ding-ding'],
            });
          } else if ((r.target - r.x) * r.dir <= 0) {
            
            window(e, MOUNT.DIVE, false);
            e.eruptT = 0;
            e.eruptAt = r.target;
            e.x = r.target;
            e.y = floorY;
            e.w = MOUNT.BODY_W - 2;
            e.h = MOUNT.ERUPT_H;
            e.harmless = false;
            e.trowel = { ...e.trowel, x: r.target, y: floorY, mood: 'erupt' };
            e.rider = { x: r.target, y: floorY + 1.5, mounted: true, mood: 'ride' };
            ctx.events.push({ type: 'erupt', id: e.id, x: r.target, y: floorY });
          }
        } else if (stage === 'recover') {
          if (e.eruptAt !== undefined && e.eruptAt !== null) {
            e.eruptT += STEP;
            if (e.eruptT >= MOUNT.ERUPT) {
              e.harmless = true; 
              e.trowel.mood = 'dive';
              e.eruptAt = null;
            }
          }
          if (enter && e.recoverFor === undefined) breath(e, MOUNT.DIVE, false);
        }
        break;
      }
      case 'grandRush': {
        if (stage === 'telegraph') {
          if (enter) {
            e.passes = e.firstGrand ? 1 : 3;
            e.firstGrand = false;
            e.passN = 0;
            e.dir = p.x < e.x ? -1 : 1;
            e.harmless = true;
            e.trowel.mood = 'paw';
            e.rider.mood = 'crop';
            ctx.events.push({
              type: 'rushLine',
              id: e.id,
              dir: e.dir,
              x: e.x,
              y: floorY,
              passes: e.passes,
              signals: ['visual:pink-crop', 'audio:chirp'],
            });
          }
          walkTo(e, e.x, 0);
        } else if (stage === 'active') {
          if (e.passN < e.passes) {
            e.harmless = false;
            e.trowel.mood = 'rush';
            const wall = e.dir < 0 ? e.faces.west + MOUNT.BODY_W / 2 : e.heapFace - MOUNT.BODY_W / 2;
            if (walkTo(e, wall, MOUNT.RUSH)) {
              e.passN += 1;
              e.dir = -e.dir;
              ctx.events.push({ type: 'grandPass', id: e.id, n: e.passN, x: e.x, y: floorY });
            }
          } else {
            
            e.harmless = true;
            e.trowel.mood = 'wobble';
            if (walkTo(e, centre(e), MOUNT.WOBBLE)) {
              window(e, e.dizzyFor ?? MOUNT.DIZZY, true);
              e.trowel.mood = 'dizzy';
              e.rider.mood = 'dizzy';
              ctx.events.push({ type: 'mountDizzy', id: e.id, x: e.x, y: floorY, signals: ['visual:gold-stars', 'audio:ding-ding'] });
            }
          }
        } else if (stage === 'recover') {
          e.harmless = true;
          if (enter && e.recoverFor === undefined) breath(e, 0.5, false);
        }
        break;
      }
    }
  },
  hit(e, ctx) {
    const s = ctx.session;
    const p = ctx.player;
    if (e.stage === 'intro') {
      
      e.harmless = true;
      e.ridge = null;
      e.eruptAt = null;
      const key = `${e.phase}:${s.deaths}:${e.introN ?? 0}`;
      if (e.propsKey !== key) {
        e.propsKey = key;
        setProps(e, ctx, e.phase);
        e.fKey = null;
        if (e.phase === 1) e.firstRun = true;
        if (e.phase === 2) e.firstGrand = true;
        if (e.phase === 0) e.firstRush = true;
      }
      if (e.phase === 1) {
        e.under = true;
        e.x = centre(e);
        e.y = e.arena.y0 - MOUNT.FIN_H;
        e.w = MOUNT.FIN_W;
        e.h = MOUNT.FIN_H;
        e.trowel = { x: centre(e), y: e.floorSoil.lane[0], facing: -1, mood: 'dive' };
        e.rider = { x: centre(e), y: e.arena.y0, mounted: true, mood: 'fin' };
      } else {
        e.under = false;
        walkTo(e, centre(e), MOUNT.BACK * 2);
        e.trowel.mood = e.phase === 2 ? 'dig' : 'idle';
        e.rider.mood = 'ride';
      }
      return null;
    }
    if (!e.phaseHurt && s.hearts < e.phaseHearts) {
      e.phaseHurt = true;
      if (e.phases[e.phase].deed) ctx.events.push({ type: 'deedLost', id: e.id });
    }
    const weak = e.stage === 'recover' && e.weakNow === true && !(e.immune > 0);
    const hitDone = (how) => {
      e.recoverFor = MOUNT.BREATH;
      e.weakNow = false;
      e.harmless = true;
      e.rider.mood = 'ouch';
      if (how === 'stomp' || how === 'pound') {
        stompBounce(p);
        if (p.ab) p.ab.pound = null;
      }
      return how;
    };
    
    const col = e.collapseAt;
    if (col && s.time - col.t <= COLLAPSE_RECENT + 1e-9) {
      e.collapseAt = null;
      if (weak) {
        const key = `collapse:${col.chain}`;
        s.bowls[key] = (s.bowls[key] ?? 0) + 1;
        ctx.events.push({
          type: 'collapseHit',
          id: col.id,
          tag: col.tag,
          target: e.id,
          kind: 'boss',
          n: s.bowls[key],
          use: col.use ?? null,
          chain: col.chain,
          x: e.x,
          y: e.y,
        });
        return hitDone('collapse');
      }
      ctx.events.push({ type: 'stonesBounce', id: e.id, tower: col.id, x: e.x, y: e.y });
    }
    
    const r = e.rider;
    const box = { x: r.x, y: r.y, w: MOUNT.RIDER_W, h: MOUNT.RIDER_H };
    if (e.under && r.mounted) return null;
    const c = contact(p, box);
    const pound = p.ab?.pound === 'fall' && overlaps(p, box) && p.y >= box.y + box.h * 0.45;
    if (!c && !pound) return null;
    if (weak && (c === 'stomp' || pound)) return hitDone(pound ? 'pound' : 'stomp');
    if (c === 'stomp' || pound) {
      stompBounce(p); 
      if (p.ab) p.ab.pound = null;
      ctx.events.push({ type: 'tiaraBonk', id: e.id });
      return 'deflect';
    }
    return null;
  },
  escape(e, ctx) {
    
    e.harmless = true;
    e.ridge = null;
    e.trowel = { ...e.trowel, mood: 'friendly' };
    if (!e.snapped) {
      e.snapped = true;
      ctx.events.push({ type: 'reinsSnap', id: e.id, x: e.x, y: e.y });
    }
    if (e.riderGone) return;
    if (e.t < MOUNT.ESCAPE_POP) {
      e.rider = { ...e.rider, mounted: false, mood: 'thrown' };
      return;
    }
    const target = { x: e.hole.x, y: e.arena.y1 + 6 };
    const dx = target.x - e.rider.x;
    const dy = target.y - e.rider.y;
    const d = Math.hypot(dx, dy);
    const v = MOUNT.ESCAPE_SPEED * STEP;
    if (d <= v) {
      e.riderGone = true;
      ctx.events.push({ type: 'bossGone', id: e.id, x: e.rider.x, y: e.rider.y });
      return;
    }
    e.rider = { x: e.rider.x + (dx / d) * v, y: e.rider.y + (dy / d) * v, mounted: false, mood: 'escape' };
  },
});
