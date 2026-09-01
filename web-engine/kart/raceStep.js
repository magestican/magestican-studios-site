






































































import { trackSurface, sampleAt } from './trackPath.js';
import { stepKart, launchKart, respawnKart } from './kartPhysics.js';
import { bodyGroundY, trackGuards, trackRails, SHOULDER } from './trackGround.js';
import { bankPush, guardBlock, WALL_DRAG } from './guardWall.js';
import { crossedJump } from './trackJumps.js';
import { crossedRamp } from './milkRamps.js';
import { hazardAt, hazardEffect } from './trackHazards.js';
import { railContact } from './trackRails.js';
import { waterSurface, isAdrift } from './water.js';
import { applyEffect } from './items.js';








export const HAZARD_BELOW_ROAD = 2;


















function entrySurface(path, track, kart) {
  const s = trackSurface(path, kart.x, kart.z, kart.pathHint, { shoulder: SHOULDER });
  if (track && track.surfaceGrip) s.gripScale *= track.surfaceGrip;
  return s;
}

































export function stepRacer({
  path, track, guards, kart, input, dt, surface = null, jumpFrac = null,
}) {
  const surf = surface ?? entrySurface(path, track, kart);

  
  
  
  
  
  let k = { ...kart };
  
  
  
  
  if (!surface) k.pathHint = surf.index;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const groundY = bodyGroundY(path, surf, k.x, k.z, track);

  
  
  
  
  
  
  
  
  
  
  
  
  
  const plan = guards ?? trackGuards(path, track);

  
  
  
  
  
  
  
  
  
  
  
  
  const rail = railContact(trackRails(path, track), surf, k);
  
  
  
  
  const wet = waterSurface(track.hazards, {
    frac: surf.s / path.length,
    lateral: surf.lateral,
    width: surf.width,
    y: surf.y,
  }, groundY);

  const push = bankPush(plan, surf);
  
  
  
  
  if (push > 0 && k.grounded && !wet) {
    
    const inward = (surf.lateral ?? 0) > 0 ? -1 : 1;
    k.vx += surf.nx * inward * push * dt;
    k.vz += surf.nz * inward * push * dt;
  }

  k = stepKart(k, input, {
    ...surf,
    groundY,
    rail,
    water: wet,
    
    
    
    
    
    
    
    
    lost: wet ? false : surf.lost,
  }, dt);

  
  
  
  
  
  
  
  
  
  
  let blocked = null;
  
  
  
  
  if (!k.grinding && !k.boating) {
    const after = trackSurface(path, k.x, k.z, k.pathHint, { shoulder: SHOULDER });
    
    
    
    
    
    const hit = guardBlock(plan, after, k, dt);
    if (hit) {
      k.x = hit.x;
      k.z = hit.z;
      k.vx = hit.vx;
      k.vz = hit.vz;
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      const f = Math.max(0, 1 - WALL_DRAG * dt);
      k.vx *= f;
      k.vz *= f;
      blocked = hit;
    }
  }

  
  
  
  
  
  
  
  
  
  let adrift = false;
  if (isAdrift(k)) {
    k = respawnKart(k, sampleAt(path, surf.s), { after: 0 });
    k.invuln = Math.max(k.invuln ?? 0, 1.2);
    adrift = true;
  }

  
  
  
  
  
  let launched = null;
  let nextJumpFrac = jumpFrac;
  if (track.jumps) {
    
    
    const now = trackSurface(path, k.x, k.z, k.pathHint, { shoulder: SHOULDER });
    const nowFrac = now.s / path.length;
    
    
    
    
    
    
    const hit = crossedJump(track.jumps, jumpFrac, nowFrac, k.speed, {
      overBy: now.overBy ?? 0, maxOver: SHOULDER,
    });
    nextJumpFrac = nowFrac;
    if (hit) {
      launchKart(k, hit.vy);
      launched = hit;
    }
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  if (track.ramps && track.ramps.length) {
    const now = trackSurface(path, k.x, k.z, k.pathHint, { shoulder: SHOULDER });
    const nowFrac = now.s / path.length;
    
    
    const onRoad = (now.overBy ?? 0) <= SHOULDER;
    
    
    const milk = onRoad
      ? crossedRamp(track.ramps, jumpFrac, nowFrac, k.speed, { lapLength: path.length })
      : null;
    if (nextJumpFrac === jumpFrac) nextJumpFrac = nowFrac;
    if (milk) {
      
      
      k.boost = { ...milk.boost };
      if (!launched) {
        launchKart(k, milk.vy);
        launched = milk;
      }
    }
  }

  
  
  
  
  
  
  let hazard = null;
  let hazardHit = false;
  
  
  
  
  
  
  
  
  
  
  
  
  
  const belowRoad = k.y < (surf.y ?? 0) - HAZARD_BELOW_ROAD;
  if (track.hazards && (k.grounded || belowRoad)) {
    const zone = hazardAt(track.hazards, {
      frac: surf.s / path.length, lateral: surf.lateral, width: surf.width,
    });
    const effect = hazardEffect(zone, k);
    if (effect?.action === 'respawn') {
      
      
      
      k = respawnKart(k, sampleAt(path, surf.s), { after: 0 });
      k.invuln = Math.max(k.invuln ?? 0, 1.2);
      hazard = 'respawn';
      hazardHit = true;
    } else if (effect?.action === 'spin') {
      const out = applyEffect(k, 'spin');
      k = out.kart;
      hazard = 'spin';
      
      
      
      hazardHit = out.hit;
    }
  }

  return {
    kart: k,
    surface: surf,
    
    
    
    jumpFrac: nextJumpFrac,
    events: {
      
      
      blocked,
      
      
      launched,
      
      
      
      
      hazard,
      hazardHit,
      
      
      
      
      grindStarted: !!k.grindStarted,
      grindEnded: k.grindEnded ?? null,
      
      splashed: !!k.splashed,
      splashVy: k.splashVy ?? 0,
      beached: !!k.beached,
      
      adrift,
    },
  };
}
