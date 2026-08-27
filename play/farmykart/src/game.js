














import * as THREE from 'three';

import { buildPath, trackSurface, startGrid, sampleAt } from 'arbelo/trackPath';
import { buildRacingLine } from 'arbelo/racingLine';
import { createKart, stepKart, respawnKart, resolveKartContact } from 'arbelo/kartPhysics';
import { resolveTuning, characterById, CHARACTERS } from 'arbelo/kartTuning';
import { createDriver, driveBot, findThreats } from 'arbelo/kartAi';
import { createProgress, addRacer, updateRacer, standings } from 'arbelo/raceProgress';
import { createFlow, stepFlow, canDrive, countdownText, launchBoost, PHASE } from 'arbelo/raceFlow';
import { drawItem, layoutItemBoxes } from 'arbelo/itemRoulette';
import {
  ITEMS, spawnDrop, spawnProjectile, stepHazard, applyEffect, hazardHits,
} from 'arbelo/items';
import { createProjection, projectRacers } from 'arbelo/minimap';
import { SeededRng } from 'arbelo/rng';
import { planTick } from 'arbelo/tickPolicy';

import { trackById, itemStopsFor } from './tracks/tracks.js';
import { buildTrackMesh, buildFences, SHOULDER } from './render/trackMesh.js';
import { buildScenery } from './render/props.js';
import { buildKart, poseKart } from './render/kartMesh.js';
import { buildSky, buildLights, fogFor, createChaseCamera, updateChase, snapChase, focusShadow } from './render/world.js';
import {
  createFx, updateFx, driftSparks, boostFlame, groundDust, hitBurst, pickupBurst, createShieldBubble,
} from './render/fx.js';
import { buildItemBoxMesh, animateItemBox, buildHazardMesh, animateHazard } from './render/itemMesh.js';
import { createHud, updateHud, showBanner, tickBanner, gapText } from './ui/hud.js';
import { createMinimap, drawMinimap } from './ui/minimapView.js';
import { createControls, readControls, consumeItemPress } from './input/controls.js';
import { createAudio, resumeAudio, startEngine, updateEngine, stopEngine, SFX, setMuted } from './audio/sfx.js';
import { PALETTE } from './palette.js';




const BOX_RESPAWN = 5.5;
const ITEM_PICKUP_RADIUS = 2.2;

export function createRace(options) {
  const {
    canvas, hudRoot, minimapCanvas,
    trackId, characterId, difficulty, laps, fieldSize = 8,
    seed = 20260828, onFinish, onLap, muted = false,
  } = options;

  const track = trackById(trackId);
  const path = buildPath(track.control, { defaultWidth: track.defaultWidth });
  const line = buildRacingLine(path);
  const rng = new SeededRng(seed);
  const itemRng = rng.child('items');
  const raceLaps = laps ?? track.laps ?? 3;

  
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  
  
  
  
  
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = fogFor(track.theme);
  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.4, 1200);
  const chase = createChaseCamera(camera);

  scene.add(buildSky(track.sky ?? 'day'));
  const lights = buildLights(track.theme);
  scene.add(lights);
  scene.add(buildTrackMesh(path, track));
  scene.add(buildFences(path, track.scenery?.fencePosts ?? 160));
  scene.add(buildScenery(path, track));

  const fx = createFx(scene);

  
  
  
  
  
  
  const grid = startGrid(path, fieldSize);
  const player = { index: fieldSize - 1 };
  const racers = [];
  
  
  const deck = { cards: [] };

  for (let i = 0; i < fieldSize; i += 1) {
    const isPlayer = i === player.index;
    const character = isPlayer
      ? characterById(characterId)
      : pickBotCharacter(rng, deck);
    const slot = grid[i];
    const tuning = resolveTuning(character);
    const kart = createKart({
      x: slot.x, y: slot.y, z: slot.z, heading: slot.heading,
      id: isPlayer ? 'player' : `bot${i}`,
      tuning,
    });
    const built = buildKart(character, i);
    scene.add(built.group);
    const shield = createShieldBubble();
    built.group.add(shield);

    racers.push({
      id: kart.id,
      isPlayer,
      character,
      kart,
      built,
      shield,
      driver: isPlayer ? null : createDriver(i, difficulty),
      s: 0,
      item: null,
      itemUses: 0,
      itemRolling: 0,
      heldFor: 0,
      position: i + 1,
      finished: false,
      lastHazardHit: null,
    });
  }
  const you = racers[player.index];
  snapChase(chase, you.kart);

  
  const boxes = layoutItemBoxes(path, itemStopsFor(track, path.length), { perRow: 5 });
  const boxMeshes = [];
  for (const b of boxes) {
    const mesh = buildItemBoxMesh();
    mesh.position.set(b.x, b.y + 1.1, b.z);
    mesh.userData.baseY = b.y + 1.1;
    mesh.userData.phase = (b.s % 7) * 0.9;
    scene.add(mesh);
    boxMeshes.push(mesh);
  }
  const hazards = [];
  const hazardMeshes = new Map();

  
  const progress = createProgress(path, { laps: raceLaps, checkpoints: 8 });
  for (const r of racers) {
    const surf = trackSurface(path, r.kart.x, r.kart.z, null, { shoulder: SHOULDER });
    r.kart.pathHint = surf.index;
    r.s = surf.s;
    addRacer(progress, r.id, surf.s);
  }
  const flow = createFlow({ laps: raceLaps });

  
  const hud = createHud(hudRoot);
  const minimap = createMinimap(minimapCanvas, path);
  const minimapProj = createProjection(path.bounds, { w: minimap.size, h: minimap.size, pad: 12 });
  const controls = createControls(canvas);
  const audio = createAudio();
  setMuted(audio, muted);

  let running = false;
  let raf = 0;
  let last = 0;
  let clock = 0;
  let finalLapAnnounced = false;
  let disposed = false;

  const onResize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);

  
  
  
  function step(dt) {
    clock += dt;
    const driving = canDrive(flow);
    readControls(controls, dt);

    const { events } = stepFlow(flow, dt, {
      playerFinished: you.finished,
      allFinished: racers.every((r) => r.finished),
    });
    for (const e of events) handleFlowEvent(e);

    
    const surfaces = racers.map((r) => {
      const s = trackSurface(path, r.kart.x, r.kart.z, r.kart.pathHint, { shoulder: SHOULDER });
      r.kart.pathHint = s.index;
      r.s = s.s;
      
      
      
      
      if (track.surfaceGrip) s.gripScale *= track.surfaceGrip;
      return s;
    });

    const table = standings(progress);
    const posById = new Map(table.map((r) => [r.id, r.position]));

    
    for (let i = 0; i < racers.length; i += 1) {
      const r = racers[i];
      const surf = surfaces[i];
      let input = { throttle: 0, steer: 0, drift: false };

      if (!driving) {
        
        
        input = { throttle: 0, steer: 0, drift: false };
      } else if (r.isPlayer) {
        input = {
          throttle: controls.throttle,
          steer: controls.steer,
          drift: controls.drift,
        };
      } else {
        const threats = findThreats(path, { id: r.id, s: r.s }, racers.map((o) => ({ id: o.id, s: o.s, finished: o.finished })));
        const botInput = driveBot(r.driver, r.kart, line, {
          surface: surf,
          time: clock,
          dt,
          position: posById.get(r.id) ?? 1,
          fieldSize: racers.length,
          hasItem: !!r.item,
          heldItem: r.item,
          heldFor: r.heldFor,
          lineCurvature: surf.curvature,
          threatAhead: threats.ahead ? { distance: threats.ahead.distance } : null,
          threatBehind: threats.behind ? { distance: threats.behind.distance } : null,
        });
        input = botInput;
        if (botInput.useItem) useItem(r, posById.get(r.id) ?? 1);
      }

      
      
      
      
      if (r.tractorUntil && clock < r.tractorUntil) {
        input = autoDrive(r, surf, input);
      }

      const prevBoost = r.kart.boost;
      r.kart = stepKart(r.kart, input, { ...surf, groundY: surf.y }, dt);

      if (r.kart.justBoosted) {
        if (r.isPlayer) SFX.miniTurbo(audio, r.kart.justBoosted.tier);
        if (r.isPlayer) chase.shake = Math.min(1, 0.3 + r.kart.justBoosted.tier * 0.18);
      }

      r.kart = respawnKart(r.kart, sampleAt(path, surf.s));
      if (r.kart.respawned && r.isPlayer) {
        snapChase(chase, r.kart);
        showBanner(hud, 'BACK ON TRACK', { kind: 'warn', seconds: 1.1 });
      }

      
      
      
      driftSparks(fx, r.kart, r.kart.driftTier ?? 0, dt);
      boostFlame(fx, r.kart, dt);
      groundDust(fx, r.kart, surf.onRoad, dt);
      r.shield.visible = r.kart.shielded > 0;
      if (r.shield.visible) {
        r.shield.rotation.y += dt * 1.7;
        r.shield.rotation.x += dt * 0.9;
      }
      if (r.item) r.heldFor += dt;
    }

    
    for (let a = 0; a < racers.length; a += 1) {
      for (let b = a + 1; b < racers.length; b += 1) {
        const before = racers[a].kart.vx;
        const [ka, kb] = resolveKartContact(racers[a].kart, racers[b].kart);
        if (ka !== racers[a].kart || kb !== racers[b].kart) {
          if ((racers[a].isPlayer || racers[b].isPlayer) && Math.abs(before - ka.vx) > 3) {
            SFX.bump(audio);
          }
        }
        racers[a].kart = ka;
        racers[b].kart = kb;
      }
    }

    stepItems(dt, posById);
    stepHazards(dt);

    
    for (const r of racers) {
      const rec = updateRacer(progress, r.id, r.s, flow.phase === PHASE.COUNTDOWN ? 0 : flow.time, dt);
      if (!rec) continue;
      if (rec.finished && !r.finished) {
        r.finished = true;
        if (r.isPlayer) SFX.finish(audio);
      }
      if (r.isPlayer && rec.lapTimes.length !== (r._lapCount ?? 0)) {
        r._lapCount = rec.lapTimes.length;
        if (!rec.finished) {
          SFX.lap(audio);
          const isBest = rec.bestLap === rec.lapTimes[rec.lapTimes.length - 1];
          showBanner(hud, isBest && rec.lapTimes.length > 1 ? 'BEST LAP' : `LAP ${rec.lap + 1}`, {
            kind: isBest ? 'good' : 'info',
          });
          if (onLap) onLap(rec);
        }
      }
    }
    if (!finalLapAnnounced) {
      const me = progress.racers.get('player');
      if (me && me.lap === raceLaps - 1) {
        finalLapAnnounced = true;
        showBanner(hud, 'FINAL LAP', { kind: 'warn', seconds: 2 });
      }
    }
  }

  
  
  
  function stepItems(dt, posById) {
    for (let i = 0; i < boxes.length; i += 1) {
      const box = boxes[i];
      if (box.respawn > 0) {
        box.respawn -= dt;
        continue;
      }
      for (const r of racers) {
        if (r.item || r.itemRolling > 0 || r.finished) continue;
        const dx = r.kart.x - box.x;
        const dz = r.kart.z - box.z;
        if (dx * dx + dz * dz > ITEM_PICKUP_RADIUS * ITEM_PICKUP_RADIUS) continue;
        box.respawn = BOX_RESPAWN;
        
        
        
        
        r.itemRolling = 0.65;
        const me = progress.racers.get(r.id);
        const lapsLeft = raceLaps - (me?.lap ?? 0) - (me ? (me.distance % path.length) / path.length : 0);
        r.pendingItem = drawItem(posById.get(r.id) ?? 1, racers.length, () => itemRng.next(), { lapsLeft });
        if (r.isPlayer) SFX.itemGet(audio);
        pickupBurst(fx, box.x, box.y, box.z);
        break;
      }
    }

    for (const r of racers) {
      if (r.itemRolling > 0) {
        r.itemRolling -= dt;
        if (r.itemRolling <= 0) {
          r.item = r.pendingItem;
          r.itemUses = r.item?.uses ?? 1;
          r.heldFor = 0;
          r.pendingItem = null;
        }
      }
    }

    if (consumeItemPress(controls) && you.item && canDrive(flow)) {
      const table = standings(progress);
      const pos = table.find((t) => t.id === 'player')?.position ?? 1;
      useItem(you, pos);
    }
  }

  function useItem(r, position) {
    const item = r.item;
    if (!item) return;
    if (r.isPlayer) SFX.itemUse(audio);

    switch (item.kind) {
      case 'drop': {
        const h = spawnDrop(item, r.kart);
        hazards.push(h);
        addHazardMesh(h);
        break;
      }
      case 'projectile': {
        
        
        
        const backwards = r.isPlayer ? controls.throttle < -0.4 : false;
        const h = spawnProjectile(item, r.kart, { backwards });
        hazards.push(h);
        addHazardMesh(h);
        break;
      }
      case 'self':
        if (item.effect === 'boost') {
          r.kart = { ...r.kart, boost: { ...item.boost } };
        } else if (item.effect === 'shield') {
          r.kart = { ...r.kart, shielded: item.duration };
        } else if (item.effect === 'tractor') {
          r.kart = { ...r.kart, boost: { ...item.boost }, invuln: item.duration };
          r.tractorUntil = clock + item.duration;
        }
        break;
      case 'field': {
        
        
        
        const table = standings(progress);
        const mine = table.find((t) => t.id === r.id)?.position ?? 1;
        SFX.thunder(audio);
        for (const other of racers) {
          if (other.id === r.id) continue;
          const theirs = table.find((t) => t.id === other.id)?.position ?? 99;
          if (theirs >= mine) continue;
          const out = applyEffect(other.kart, 'squash', { from: r.id });
          other.kart = out.kart;
          if (out.hit) hitBurst(fx, other.kart.x, other.kart.y, other.kart.z);
          if (other.isPlayer && out.hit) chase.shake = 1;
        }
        break;
      }
      default:
        break;
    }

    r.itemUses -= 1;
    if (r.itemUses <= 0) { r.item = null; r.itemUses = 0; }
    r.heldFor = 0;
  }

  function addHazardMesh(h) {
    const mesh = buildHazardMesh(h.item);
    mesh.position.set(h.x, h.y, h.z);
    scene.add(mesh);
    hazardMeshes.set(h.uid, mesh);
  }

  function stepHazards(dt) {
    const ctx = {
      path,
      racers: () => racers.map((r) => ({ id: r.id, x: r.kart.x, z: r.kart.z, s: r.s, finished: r.finished })),
      racerById: (id) => {
        const r = racers.find((o) => o.id === id);
        return r ? { id, x: r.kart.x, z: r.kart.z, s: r.s } : null;
      },
      surfaceAt: (x, z, hint) => trackSurface(path, x, z, hint, { shoulder: SHOULDER }),
    };

    for (let i = hazards.length - 1; i >= 0; i -= 1) {
      const h = stepHazard(hazards[i], ctx, dt);
      hazards[i] = h;

      let consumed = false;
      for (const r of racers) {
        if (!hazardHits(h, r.kart)) continue;
        const out = applyEffect(r.kart, ITEMS[h.item].effect, { from: h.owner });
        r.kart = out.kart;
        if (out.hit || out.blocked) {
          hitBurst(fx, r.kart.x, r.kart.y, r.kart.z);
          if (r.isPlayer) {
            if (out.blocked) SFX.shieldBlock(audio);
            else { SFX.hit(audio); chase.shake = 1; }
          }
          
          
          
          if (h.kind === 'projectile') consumed = true;
        }
        break;
      }

      if (consumed || h.life <= 0) {
        const mesh = hazardMeshes.get(h.uid);
        if (mesh) { scene.remove(mesh); hazardMeshes.delete(h.uid); }
        hazards.splice(i, 1);
      }
    }
  }

  
  function autoDrive(r, surf, input) {
    const look = sampleAt(path, surf.s + 16);
    const want = Math.atan2(look.x - r.kart.x, look.z - r.kart.z);
    let err = want - r.kart.heading;
    while (err > Math.PI) err -= Math.PI * 2;
    while (err < -Math.PI) err += Math.PI * 2;
    return { throttle: 1, steer: Math.max(-1, Math.min(1, err * 2.2)), drift: false };
  }

  function handleFlowEvent(e) {
    if (e.type === 'countdown') {
      SFX.countdown(audio, e.beat);
      showBanner(hud, String(e.beat), { kind: 'count', seconds: 0.9 });
    } else if (e.type === 'go') {
      SFX.go(audio);
      showBanner(hud, 'GO!', { kind: 'good', seconds: 1 });
      const boost = launchBoost({ ...flow, phase: PHASE.COUNTDOWN, time: flow.countdown }, controls.throttleHeld);
      if (boost?.boost) {
        you.kart = { ...you.kart, boost: { ...boost.boost } };
        showBanner(hud, 'GREAT START', { kind: 'good', seconds: 1.2 });
        SFX.miniTurbo(audio, 1);
      } else if (boost?.kind === 'bog') {
        you.kart = { ...you.kart, spinTime: 0, squashTime: boost.time };
        showBanner(hud, 'BOGGED DOWN', { kind: 'warn', seconds: 1.2 });
      }
    } else if (e.type === 'results') {
      finish();
    }
  }

  
  
  
  function draw(dt) {
    for (const r of racers) poseKart(r.built, r.kart, dt);

    for (let i = 0; i < boxMeshes.length; i += 1) {
      animateItemBox(boxMeshes[i], clock, boxes[i].respawn > 0);
    }
    for (const h of hazards) {
      const mesh = hazardMeshes.get(h.uid);
      if (mesh) animateHazard(mesh, h, clock);
    }

    
    
    updateChase(chase, you.kart, dt, controls.lookBack ? { back: -6.5, look: -6 } : undefined);
    focusShadow(lights, you.kart.x, you.kart.z);
    updateFx(fx, dt, camera);
    updateEngine(audio, you.kart, { onRoad: true });

    const table = standings(progress);
    const me = table.find((t) => t.id === 'player');
    const myPos = me?.position ?? racers.length;

    updateHud(hud, {
      position: myPos,
      lap: me?.lap ?? 0,
      laps: raceLaps,
      time: flow.phase === PHASE.COUNTDOWN ? 0 : flow.time,
      lastLapTime: me?.lapTimes?.[me.lapTimes.length - 1] ?? null,
      bestLap: me?.bestLap ?? null,
      speed: Math.abs(you.kart.speed ?? 0),
      item: you.item?.icon ?? null,
      itemUses: you.itemUses,
      itemRolling: you.itemRolling > 0,
      drifting: !!you.kart.drifting,
      driftTier: you.kart.driftTier ?? 0,
      wrongWay: !!me?.wrongWayShown,
      standings: table.slice(0, 8).map((t) => {
        const r = racers.find((x) => x.id === t.id);
        return {
          position: t.position,
          name: r?.character.name ?? t.id,
          tint: r?.character.tint ?? PALETTE.ceiling,
          isPlayer: t.id === 'player',
          gap: t.id === 'player' ? '' : gapText(t.distance - (me?.distance ?? 0)),
        };
      }),
    });
    tickBanner(hud);

    drawMinimap(
      minimap,
      projectRacers(minimapProj, racers.map((r) => ({
        id: r.id, x: r.kart.x, z: r.kart.z, tint: r.character.tint,
      })), 'player'),
      hazards,
    );

    renderer.render(scene, camera);
  }

  
  
  
  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const elapsed = (now - last) / 1000;
    last = now;
    
    
    
    const plan = planTick(elapsed, { hidden: document.hidden });
    for (const dt of plan.steps) step(dt);
    if (plan.render && plan.steps.length) draw(plan.steps[plan.steps.length - 1]);
  }

  function finish() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(raf);
    stopEngine(audio);
    const table = standings(progress);
    const me = table.find((t) => t.id === 'player');
    if (onFinish) {
      onFinish({
        position: me?.position ?? racers.length,
        fieldSize: racers.length,
        bestLap: me?.bestLap ?? null,
        raceTime: me?.finishTime ?? null,
        lapTimes: me?.lapTimes ?? [],
        trackId: track.id,
        characterId: you.character.id,
        difficulty,
        table: table.map((t) => {
          const r = racers.find((x) => x.id === t.id);
          return {
            position: t.position,
            name: r?.character.name ?? t.id,
            species: r?.character.species,
            tint: r?.character.tint,
            isPlayer: t.id === 'player',
            finished: t.finished,
            time: t.finishTime,
            bestLap: t.bestLap,
          };
        }),
      });
    }
  }

  return {
    track,
    start() {
      if (running || disposed) return;
      resumeAudio(audio);
      startEngine(audio);
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      stopEngine(audio);
    },
    setMuted: (m) => setMuted(audio, m),
    dispose() {
      disposed = true;
      this.stop();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      controls.dispose();
      
      
      
      
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
        for (const m of mats) {
          for (const key of ['map', 'normalMap', 'alphaMap']) {
            if (m[key]?.dispose) m[key].dispose();
          }
          m.dispose();
        }
      });
      renderer.dispose();
    },
  };
}









function pickBotCharacter(rng, deck) {
  if (deck.cards.length === 0) deck.cards = rng.shuffle(CHARACTERS.slice());
  return deck.cards.pop() ?? CHARACTERS[0];
}
