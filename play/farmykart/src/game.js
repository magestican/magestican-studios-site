














import * as THREE from 'three';

import { buildPath, trackSurface, startGrid, sampleAt } from 'arbelo/trackPath';
import { buildRacingLine } from 'arbelo/racingLine';
import { createKart, respawnKart, resolveKartContact } from 'arbelo/kartPhysics';
import { resolveTuning, characterById, CHARACTERS } from 'arbelo/kartTuning';
import { createDriver, driveBot, findThreats } from 'arbelo/kartAi';



import { trackGuards, trackRails, railContact, IMPACT_KILL } from 'arbelo/trackGround';










import { stepRacer } from 'arbelo/raceStep';
import { lockZoom } from './input/zoomLock.js';
import { assistSteer } from 'arbelo/steerAssist';
import { createRecovery, stepRecovery, isRecovering, isUnrecoverable } from 'arbelo/recovery';
import {
  createProgress, addRacer, updateRacer, standings, fractionDone,
} from 'arbelo/raceProgress';
import { createFlow, stepFlow, canDrive, judgeLaunch, launchMeter, PHASE } from 'arbelo/raceFlow';
import { drawItem, layoutItemBoxes } from 'arbelo/itemRoulette';
import {
  ITEMS, spawnDrop, spawnProjectile, stepHazard, applyEffect, hazardHits,
} from 'arbelo/items';
import { projectRacers } from 'arbelo/minimap';
import { SeededRng } from 'arbelo/rng';
import { planTick } from 'arbelo/tickPolicy';





import { lapPoints } from 'arbelo/raceScore';






import { pageContexts } from '../../../web-engine/render/contextBudget.js';










import { releaseShadows } from '../../../web-engine/render/shadowRelease.js';
import {
  createContextState, contextLost, contextRestored, contextCheck, shouldDraw,
} from '../../../web-engine/render/contextRecovery.js';
import { createFrameGuard, frameOk, frameFailed, restartFrameGuard } from '../../../web-engine/render/frameGuard.js';







import { showBanner as showPageBanner, hideBanner as hidePageBanner } from '../../../web-engine/updater/banner.js';
import { trackById, itemStopsFor } from './tracks/tracks.js';
import { buildTrackMesh, buildFences, SHOULDER } from './render/trackMesh.js';
import { buildScenery } from './render/props.js';
import { buildSpectators, updateSpectators } from './render/spectators.js';
import { buildKart, poseKart } from './render/kartMesh.js';
import { buildSky, updateSky, buildLights, buildSun, updateSun, fogFor, createChaseCamera, updateChase, snapChase, focusShadow } from './render/world.js';











import { configureRenderer, buildEnvironment, releaseEnvironment, setQuality, detectQuality } from './render/materials.js';








import { buildWater, updateWater, boatWashSlots, buildFires, updateFires } from './render/hazardMesh.js';
import { buildStartGate, updateStartGate } from './render/startGate.js';
import {
  createFx, updateFx, driftSparks, boostFlame, groundDust, hitBurst, pickupBurst, createShieldBubble,
} from './render/fx.js';
import { createSpeedFx, updateSpeedFx } from './render/speedFx.js';
import { buildItemBoxMesh, animateItemBox, buildHazardMesh, animateHazard } from './render/itemMesh.js';
import { createHud, updateHud, showBanner, tickBanner, gapText } from './ui/hud.js';
import { createMinimap, drawMinimap } from './ui/minimapView.js';
import { createControls, readControls, consumeItemPress } from './input/controls.js';
import { createRaceNet } from './net/raceNet.js';
import { createAudio, resumeAudio, startEngine, updateEngine, stopEngine, SFX, setMuted } from './audio/sfx.js';
import { startMusic, stopMusic, setMusicIntensity, duckMusic } from './audio/music.js';
import { PALETTE } from './palette.js';




const BOX_RESPAWN = 5.5;
const ITEM_PICKUP_RADIUS = 2.2;

export function createRace(options) {
  const {
    canvas, hudRoot, minimapCanvas,
    trackId, characterId, difficulty, laps, fieldSize = 8,
    seed = 20260828, onFinish, onLap, muted = false, audio: sharedAudio = null,
    assist = false,
    
    
    
    
    
    
    
    
    
    session = null, seats = null,
    
    
    
    resume = null,
  } = options;

  const track = trackById(trackId);
  
  
  
  
  const path = buildPath(track.control, {
    defaultWidth: track.defaultWidth,
    branches: track.shortcuts,
    
    
    
    
    
    
    camberScale: track.camberScale,
  });
  const line = buildRacingLine(path);
  const rng = new SeededRng(seed);
  const itemRng = rng.child('items');
  const raceLaps = laps ?? track.laps ?? 3;

  
  
  
  
  

  
  
  
  
  
  setQuality(new URLSearchParams(location.search).get('quality') || detectQuality());
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  pageContexts.enterExclusive('scene');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  
  
  
  
  
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  
  configureRenderer(renderer);

  const scene = new THREE.Scene();
  scene.fog = fogFor(track.theme);
  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.4, 1200);
  const chase = createChaseCamera(camera);

  
  
  
  
  
  
  const lights = buildLights(track.theme);
  scene.add(lights);
  const sunDir = lights.userData.sun.position.clone().normalize();
  const sky = buildSky(track.sky ?? 'day', sunDir);
  scene.add(sky);
  
  
  const sunDisc = buildSun(lights);
  scene.add(sunDisc);
  
  
  
  
  scene.environment = buildEnvironment(renderer, sky.material);
  
  
  scene.environmentIntensity = 0.55;
  
  
  
  
  
  path.hazards = track.hazards ?? null;

  scene.add(buildTrackMesh(path, track));
  const water = buildWater(path, track);
  scene.add(water);
  const fires = buildFires(path, track);
  scene.add(fires);
  
  
  const startGate = buildStartGate(path, track);
  scene.add(startGate);
  scene.add(buildFences(path, track.scenery?.fencePosts ?? 160));
  scene.add(buildScenery(path, track));
  
  
  const spectators = buildSpectators(path, track.scenery?.spectators ?? 64, { shoulder: SHOULDER });
  scene.add(spectators);

  
  
  
  
  
  const fx = createFx(scene, { theme: track.theme, path });
  
  
  const sunOffset = sunDisc.position.clone();
  
  
  
  const speedFx = createSpeedFx(scene, track.theme);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  let worldReady = false;
  const pendingNet = [];
  const whenReady = (fn) => (...args) => {
    if (worldReady) fn(...args);
    else pendingNet.push(() => fn(...args));
  };

  const net = (session && seats && seats.length)
    ? createRaceNet(session, {
      seats,
      onEvent: whenReady(handleNetEvent),
      onStandings: whenReady(applyHostStandings),
      onSeats: whenReady(handleSeatChange),
      
      
      raceClock: () => flow.time,
    })
    : null;
  const fieldCount = net ? seats.length : fieldSize;

  const grid = startGrid(path, fieldCount);
  
  
  
  
  let myIndex = fieldCount - 1;
  if (net) myIndex = Math.max(0, seats.findIndex((s) => s.id === net.mySeatId()));
  const player = { index: myIndex };
  const racers = [];
  
  
  const deck = { cards: [] };

  for (let i = 0; i < fieldCount; i += 1) {
    const seat = net ? seats[i] : null;
    const isPlayer = i === player.index;
    const character = seat
      ? (characterById(seat.characterId) ?? pickBotCharacter(rng, deck))
      : (isPlayer ? characterById(characterId) : pickBotCharacter(rng, deck));
    const slot = grid[i];
    const tuning = resolveTuning(character);
    const kart = createKart({
      x: slot.x, y: slot.y, z: slot.z, heading: slot.heading,
      
      
      
      
      
      id: seat ? seat.id : (isPlayer ? 'player' : `bot${i}`),
      tuning,
    });
    const built = buildKart(character, i);
    scene.add(built.group);
    const shield = createShieldBubble();
    built.group.add(shield);

    racers.push({
      id: kart.id,
      index: i,
      isPlayer,
      character,
      kart,
      built,
      shield,
      
      
      
      
      
      driver: isPlayer ? null : createDriver(i, difficulty),
      
      
      
      
      recovery: createRecovery(),
      seatName: seat?.name ?? null,
      wasHuman: false,
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
  uniquifyNames(racers);
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

  
  
  
  
  
  
  
  
  
  if (resume?.poses) {
    for (const pose of resume.poses) {
      const r = racers.find((x) => x.id === pose.id);
      if (!r) continue;
      [r.kart.x, r.kart.y, r.kart.z] = pose.p;
      r.kart.heading = pose.h;
      r.kart.speed = pose.s ?? 0;
    }
  }

  const progress = createProgress(path, { laps: raceLaps, checkpoints: 8 });
  for (const r of racers) {
    const surf = trackSurface(path, r.kart.x, r.kart.z, null, { shoulder: SHOULDER });
    r.kart.pathHint = surf.index;
    r.s = surf.s;
    addRacer(progress, r.id, surf.s);
  }
  
  
  
  
  if (resume?.rows) {
    for (const row of resume.rows) {
      const rec = progress.racers.get(row.id);
      if (!rec) continue;
      rec.lap = row.lap ?? 0;
      rec.distance = row.distance ?? 0;
      rec.bestLap = row.bestLap ?? null;
      rec.finished = !!row.finished;
      rec.finishTime = row.finishTime ?? null;
    }
  }
  const flow = createFlow({ laps: raceLaps });
  
  
  
  if (resume) {
    flow.phase = PHASE.RACING;
    flow.time = resume.clock ?? 0;
    flow.startedAt = 0;
  }

  
  const hud = createHud(hudRoot);
  
  
  
  
  
  
  
  
  
  
  const minimap = createMinimap(minimapCanvas, path, track);
  const minimapProj = minimap.proj;
  const controls = createControls(canvas);
  
  
  
  
  
  
  
  
  
  
  
  const audio = sharedAudio ?? createAudio();
  setMuted(audio, muted);

  let running = false;
  let raf = 0;
  let last = 0;
  let clock = 0;
  let finalLapAnnounced = false;
  









  let playerSurface = null;
  let disposed = false;

  
  
  
  
  
  
  
  const ctxState = createContextState();
  const guard = createFrameGuard();
  
  const GFX_BANNER = 'fk-graphics-banner';
  const FAULT_BANNER = 'fk-frame-banner';
  const offerReload = { actionLabel: 'Reload', onAction: () => location.reload() };

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
    updateSky(sky, clock);
    
    
    
    
    updateWater(water, clock, boatWashSlots(racers));
    updateFires(fires, clock);
    
    
    
    
    
    updateStartGate(startGate, clock,
      finalLapAnnounced ? 1 : (racers.some((r) => r.finished) ? 0.5 : 0));
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
    playerSurface = surfaces[racers.indexOf(you)] ?? null;

    const table = standings(progress);
    const posById = new Map(table.map((r) => [r.id, r.position]));

    
    for (let i = 0; i < racers.length; i += 1) {
      const r = racers[i];
      const surf = surfaces[i];

      
      
      
      
      
      
      if (net && !net.owns(r.id)) {
        net.applyRemote(r);
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        const rk = r.kart;
        rk.bankRoll = Math.atan(surf.crossSlope ?? 0);
        const rrail = rk.grinding ? railContact(trackRails(path, track), surf, rk) : null;
        rk.grindSide = rrail ? rrail.side : 0;
        rk.wheelie = rk.grinding ? 1 : 0;
        rk.grindMount = rk.grinding ? 1 : 0;
        driftSparks(fx, r.kart, r.kart.driftTier ?? 0, dt);
        boostFlame(fx, r.kart, dt);
        groundDust(fx, r.kart, surf.onRoad, dt);
        r.shield.visible = false;
        continue;
      }

      let input = { throttle: 0, steer: 0, drift: false };

      if (!driving) {
        
        
        input = { throttle: 0, steer: 0, drift: false };
      } else if (r.isPlayer) {
        input = {
          throttle: controls.throttle,
          
          
          
          
          
          steer: assist
            ? assistSteer({ steer: controls.steer, kart: r.kart, surface: surf, path, strength: 1 })
            : controls.steer,
          drift: controls.drift,
          jump: controls.jump,
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
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          rails: trackRails(path, track),
          threatAhead: threats.ahead ? { distance: threats.ahead.distance } : null,
          threatBehind: threats.behind ? { distance: threats.behind.distance } : null,
        });
        input = botInput;
        if (botInput.useItem) useItem(r, posById.get(r.id) ?? 1);
      }

      
      
      
      
      if (r.tractorUntil && clock < r.tractorUntil) {
        input = autoDrive(r, surf, input);
      }

      
      
      
      
      
      
      
      
      
      
      if (driving) {
        const rescue = stepRecovery(r.recovery, { kart: r.kart, surface: surf, dt });
        if (rescue) input = { ...input, steer: rescue.steer, throttle: rescue.throttle, drift: false };
      }

      const prevBoost = r.kart.boost;
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      const guards = trackGuards(path, track);
      const stepped = stepRacer({
        path, track, guards, kart: r.kart, input, dt, surface: surf, jumpFrac: r.jumpFrac,
      });
      r.kart = stepped.kart;
      r.jumpFrac = stepped.jumpFrac;
      const {
        blocked, launched, hazard, hazardHit,
        grindStarted, grindEnded, splashed, splashVy, beached, adrift,
      } = stepped.events;

      
      
      
      
      
      
      
      
      
      
      
      if (grindStarted && r.isPlayer) {
        SFX.railOn(audio);
        chase.shake = Math.max(chase.shake ?? 0, 0.18);
      }
      if (grindEnded && r.isPlayer) {
        
        
        SFX.railOff(audio, grindEnded === 'jump');
        if (grindEnded === 'jump') chase.shake = Math.max(chase.shake ?? 0, 0.34);
      }
      
      
      
      
      
      if (r.isPlayer) {
        SFX.railLoop(audio, r.kart.grinding ? 1 : 0, Math.abs(r.kart.speed ?? 0));
      }
      if (splashed && r.isPlayer) {
        
        
        
        
        const hard = Math.min(1, Math.abs(splashVy) / IMPACT_KILL);
        SFX.splash(audio, hard);
        chase.shake = Math.max(chase.shake ?? 0, 0.2 + hard * 0.5);
      }
      if (beached && r.isPlayer) SFX.bump(audio);
      
      
      
      
      
      if (adrift && r.isPlayer) {
        SFX.hit(audio);
        chase.shake = 0.6;
      }

      
      
      if (blocked && r.isPlayer && blocked.scrub > 0.12) {
        chase.shake = Math.max(chase.shake ?? 0, Math.min(0.5, blocked.scrub * 0.5));
      }

      if (launched) {
        r.airFrom = launched.vy;
        if (r.isPlayer) {
          SFX.jump(audio, Math.min(1.4, launched.vy / 8));
          
          
          
          chase.shake = Math.min(1, 0.22 + launched.vy * 0.02);
        }
      }

      
      
      
      
      if (hazard === 'respawn') {
        if (r.isPlayer) { SFX.hit(audio); chase.shake = 0.6; }
      } else if (hazard === 'spin') {
        if (r.isPlayer && hazardHit) { SFX.hit(audio); chase.shake = 0.5; duckMusic(audio); }
      }

      
      
      
      
      
      
      
      if (r.kart.glideLanded) {
        if (r.isPlayer) {
          SFX.land(audio, 0.45);
          chase.shake = 0.22;
        }
        r.airFrom = 0;
      }

      
      if (r.kart.landed && r.airFrom) {
        if (r.isPlayer) {
          SFX.land(audio, Math.min(1, r.airFrom / 10));
          chase.shake = Math.min(1, 0.18 + r.airFrom * 0.03);
        }
        r.airFrom = 0;
      }

      if (r.kart.justBoosted) {
        if (r.isPlayer) SFX.miniTurbo(audio, r.kart.justBoosted.tier);
        if (r.isPlayer) chase.shake = Math.min(1, 0.3 + r.kart.justBoosted.tier * 0.18);
      }

      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      if (isUnrecoverable(surf, r.kart)) {
        r.kart = respawnKart(r.kart, sampleAt(path, surf.s), { after: 0 });
      }

      
      
      
      
      
      
      r.kart = respawnKart(r.kart, sampleAt(path, surf.s), { after: 5.5 });
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

    
    
    
    if (net) {
      net.publish(racers);
      
      
      
      
      net.sweepStalled();
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
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      if (rec.lapTimes.length !== (r._lapCount ?? 0)) {
        r._lapCount = rec.lapTimes.length;
        r.lapPoints = (r.lapPoints ?? 0)
          + lapPoints(posById.get(r.id) ?? racers.length, racers.length);
        if (r.isPlayer && !rec.finished) {
          SFX.lap(audio);
          const isBest = rec.bestLap === rec.lapTimes[rec.lapTimes.length - 1];
          showBanner(hud, isBest && rec.lapTimes.length > 1 ? 'BEST LAP' : `LAP ${rec.lap + 1}`, {
            kind: isBest ? 'good' : 'info',
          });
          if (onLap) onLap(rec);
        }
      }
    }
    
    
    
    
    
    if (net && session.isHost) {
      net.publishStandings(standings(progress).map((t) => ({
        id: t.id, lap: t.lap, distance: t.distance, finished: t.finished,
        finishTime: t.finishTime, bestLap: t.bestLap, position: t.position,
      })));
    }

    if (!finalLapAnnounced) {
      const me = progress.racers.get(you.id);
      if (me && me.lap === raceLaps - 1) {
        finalLapAnnounced = true;
        showBanner(hud, 'FINAL LAP', { kind: 'warn', seconds: 2 });
        
        
        
        setMusicIntensity(audio, 1);
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
        
        
        
        
        if (net && !net.owns(r.id)) continue;
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
        if (net) net.event({ k: 'box', i, by: r.id });
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
      const pos = table.find((t) => t.id === you.id)?.position ?? 1;
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
        
        
        
        
        
        
        if (net) net.event({ k: 'haz', h });
        break;
      }
      case 'projectile': {
        
        
        
        const backwards = r.isPlayer ? controls.throttle < -0.4 : false;
        const h = spawnProjectile(item, r.kart, { backwards });
        hazards.push(h);
        addHazardMesh(h);
        if (net) net.event({ k: 'haz', h });
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
        
        
        
        
        
        if (net) net.event({ k: 'thunder', by: r.id });
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
        
        
        
        
        
        
        if (net && !net.owns(r.id)) {
          hitBurst(fx, r.kart.x, r.kart.y, r.kart.z);
          if (h.kind === 'projectile') consumed = true;
          break;
        }
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
      const boost = judgeLaunch(controls.throttleHeld);
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

  
  
  
  
  
  
  
  
  
  
  

  
  function handleNetEvent(ev) {
    if (!ev) return;
    if (ev.k === 'haz' && ev.h) {
      
      if (hazards.some((x) => x.uid === ev.h.uid)) return;
      const h = { ...ev.h };
      hazards.push(h);
      addHazardMesh(h);
      return;
    }
    if (ev.k === 'box' && boxes[ev.i]) {
      boxes[ev.i].respawn = BOX_RESPAWN;
      pickupBurst(fx, boxes[ev.i].x, boxes[ev.i].y, boxes[ev.i].z);
      return;
    }
    if (ev.k === 'thunder') {
      
      
      
      
      const table = standings(progress);
      const mine = table.find((t) => t.id === ev.by)?.position ?? 1;
      SFX.thunder(audio);
      for (const other of racers) {
        if (other.id === ev.by) continue;
        if (net && !net.owns(other.id)) continue;
        const theirs = table.find((t) => t.id === other.id)?.position ?? 99;
        if (theirs >= mine) continue;
        const out = applyEffect(other.kart, 'squash', { from: ev.by });
        other.kart = out.kart;
        if (out.hit) hitBurst(fx, other.kart.x, other.kart.y, other.kart.z);
        if (other.isPlayer && out.hit) chase.shake = 1;
      }
    }
  }

  









  function applyHostStandings(rows) {
    for (const row of rows) {
      const rec = progress.racers.get(row.id);
      if (!rec) continue;
      if (row.lap > rec.lap) rec.lap = row.lap;
      if (row.bestLap != null && (rec.bestLap == null || row.bestLap < rec.bestLap)) {
        rec.bestLap = row.bestLap;
      }
      if (row.finished && !rec.finished) {
        rec.finished = true;
        rec.finishTime = row.finishTime;
      }
    }
  }

  









  function handleSeatChange(next, detail) {
    for (const seat of next) {
      const r = racers.find((x) => x.id === seat.id);
      if (!r) continue;
      r.seatName = seat.name;
      r.wasHuman = !!seat.wasHuman;
      if (seat.characterId && seat.characterId !== r.character.id) reskin(r, seat.characterId);
    }
    if (detail?.left) {
      showBanner(hud, 'BOT TAKES OVER', { kind: 'warn', seconds: 1.6 });
    } else if (detail?.joined) {
      showBanner(hud, detail.reclaimed ? 'BACK IN THE RACE' : 'NEW CHALLENGER', { kind: 'info', seconds: 1.6 });
    }
  }

  










  function reskin(r, characterId) {
    const character = characterById(characterId);
    if (!character) return;
    const old = r.built.group;
    scene.remove(old);
    disposeObject(old);
    r.character = character;
    r.built = buildKart(character, r.index);
    r.shield = createShieldBubble();
    r.built.group.add(r.shield);
    scene.add(r.built.group);
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

    
    
    
    
    
    
    
    
    updateChase(chase, you.kart, dt, {
      ...(controls.lookBack ? { back: -6.5, look: -6 } : {}),
      groundY: playerSurface ? playerSurface.y : null,
    });
    focusShadow(lights, you.kart.x, you.kart.z);
    
    
    sunDisc.position.copy(camera.position).add(sunOffset);
    updateSun(sunDisc, camera, dt);
    
    
    
    updateSpectators(spectators, clock, you.kart.x, you.kart.z);
    updateFx(fx, dt, camera);
    
    
    updateSpeedFx(speedFx, you.kart, camera, dt);
    
    
    
    
    
    updateEngine(audio, you.kart, {
      onRoad: playerSurface ? playerSurface.onRoad : true,
      throttle: controls.throttle ?? 1,
    });

    const table = standings(progress);
    
    
    
    const posOnMap = new Map(table.map((t) => [t.id, t.position]));
    const me = table.find((t) => t.id === you.id);
    const myPos = me?.position ?? racers.length;

    updateHud(hud, {
      position: myPos,
      
      
      
      fieldSize: racers.length,
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
      launch: launchMeter(flow, controls.throttleHeld),
      wrongWay: !!me?.wrongWayShown,
      recovering: isRecovering(you.recovery),
      
      
      lapScore: you.lapPoints ?? 0,
      
      
      raceFraction: fractionDone(progress, you.id),
      standings: table.slice(0, 8).map((t) => {
        const r = racers.find((x) => x.id === t.id);
        return {
          position: t.position,
          
          
          
          name: r?.seatName ?? r?.displayName ?? r?.character.name ?? t.id,
          tint: r?.character.tint ?? PALETTE.ceiling,
          isPlayer: t.id === you.id,
          gap: t.id === you.id ? '' : gapText(t.distance - (me?.distance ?? 0)),
        };
      }),
    });
    tickBanner(hud);

    
    
    
    
    drawMinimap(
      minimap,
      projectRacers(minimapProj, racers.map((r) => ({
        id: r.id,
        x: r.kart.x,
        z: r.kart.z,
        tint: r.character.tint,
        position: posOnMap.get(r.id) ?? null,
        
        
        
        heading: r.kart.heading,
      })), you.id),
      hazards,
    );

    renderer.render(scene, camera);
  }

  
  
  
  function frame(now) {
    if (!running) return;
    
    
    
    
    
    
    
    raf = requestAnimationFrame(frame);
    const elapsed = (now - last) / 1000;
    last = now;
    try {
      
      
      
      
      
      
      if (!shouldDraw(ctxState)) { pollContext(now); return; }
      
      
      
      const plan = planTick(elapsed, { hidden: document.hidden });
      for (const dt of plan.steps) step(dt);
      if (plan.render && plan.steps.length) draw(plan.steps[plan.steps.length - 1]);
      const ok = frameOk(guard);
      
      
      if (ok.recovered) {
        hidePageBanner(FAULT_BANNER);
        console.warn(`[fk] frame recovered after ${ok.failures} failing frames`);
      }
    } catch (err) {
      frameThrew(err, now);
    }
  }

  











  function frameThrew(err, now) {
    const d = frameFailed(guard, err, now);
    
    
    
    if (d.novel) console.error(`[fk] frame threw: ${d.signature}`, err);
    if (d.warn) showPageBanner({ id: FAULT_BANNER, text: d.message });
    if (d.stop) {
      console.error(
        `[fk] frame has thrown ${d.consecutive} times over ${Math.round(d.forMs)} ms`
        + ` (${d.total} this race) - stopping the loop`, err);
      
      
      running = false;
      cancelAnimationFrame(raf);
      stopEngine(audio);
      stopMusic(audio);
      showPageBanner({ id: FAULT_BANNER, text: d.message, ...offerReload });
    }
  }

  






  function pollContext(now) {
    const c = contextCheck(ctxState, now);
    if (!c.giveUp) return;
    console.error(`[fk] WebGL context still lost after ${Math.round(c.downMs)} ms`);
    showPageBanner({ id: GFX_BANNER, text: c.message, ...offerReload });
  }

  function finish() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(raf);
    stopEngine(audio);
    stopMusic(audio);
    const table = standings(progress);
    const me = table.find((t) => t.id === you.id);
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
            
            
            
            
            id: t.id,
            position: t.position,
            name: r?.seatName ?? r?.displayName ?? r?.character.name ?? t.id,
            species: r?.character.species,
            character: r?.character.id ?? null,
            tint: r?.character.tint,
            isPlayer: t.id === 'player',
            finished: t.finished,
            time: t.finishTime,
            bestLap: t.bestLap,
            
            lapPoints: r?.lapPoints ?? 0,
          };
        }),
      });
    }
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const onContextLost = (e) => {
    e.preventDefault();
    const d = contextLost(ctxState, performance.now());
    console.warn(`[fk] WebGL context lost (loss ${d.losses}) - holding the race`);
    
    
    showPageBanner({ id: GFX_BANNER, text: d.message, ...(d.giveUp ? offerReload : {}) });
  };
  const onContextRestored = () => {
    const d = contextRestored(ctxState, performance.now());
    console.warn(`[fk] WebGL context restored after ${Math.round(d.downMs)} ms`);
    if (d.rebuild) {
      
      
      
      
      
      
      
      
      releaseEnvironment(scene.environment);
      scene.environment = buildEnvironment(renderer, sky.material);
      
      
      
      onResize();
    }
    if (d.clear) hidePageBanner(GFX_BANNER);
    
    
    last = performance.now();
  };
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);

  
  
  worldReady = true;
  for (const fire of pendingNet) fire();
  pendingNet.length = 0;

  
  
  
  
  
  
  
  
  
  
  
  
  window.__fkGame = {
    renderer, scene, camera, track, lights,
    get racers() { return racers; },
    get you() { return you; },
    
    
    
    
    
    
    get contextState() { return ctxState; },
    get frameGuard() { return guard; },
    
    lightReport() {
      const out = [];
      scene.traverse((o) => {
        if (!o.isLight) return;
        out.push({
          type: o.type, intensity: o.intensity,
          colour: o.color?.getHexString?.(),
          castShadow: !!o.castShadow,
          mapSize: o.shadow ? [o.shadow.mapSize.x, o.shadow.mapSize.y] : null,
        });
      });
      return out;
    },
    
    shadowReport() {
      const r = { cast: 0, receive: 0, both: 0, neither: 0, neitherNames: [] };
      scene.traverse((o) => {
        if (!o.isMesh) return;
        if (o.castShadow && o.receiveShadow) r.both++;
        else if (o.castShadow) r.cast++;
        else if (o.receiveShadow) r.receive++;
        else { r.neither++; if (r.neitherNames.length < 24) r.neitherNames.push(o.name || o.geometry?.type || '?'); }
      });
      return r;
    },
    
    materialReport() {
      const counts = {};
      scene.traverse((o) => {
        const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
        for (const m of mats) counts[m.type] = (counts[m.type] || 0) + 1;
      });
      return counts;
    },
  };

  let unlockZoom = null;

  return {
    track,
    start() {
      if (running || disposed) return;
      
      
      
      
      
      
      
      restartFrameGuard(guard);
      
      
      
      if (!unlockZoom) unlockZoom = lockZoom(document);
      resumeAudio(audio);
      startEngine(audio);
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      startMusic(audio, { trackId: track.id, theme: track.theme });
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      if (unlockZoom) { unlockZoom(); unlockZoom = null; }
      cancelAnimationFrame(raf);
      stopEngine(audio);
      stopMusic(audio);
    },
    setMuted: (m) => setMuted(audio, m),
    dispose() {
      disposed = true;
      this.stop();
      
      
      
      if (net) net.dispose();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      
      
      
      hidePageBanner(GFX_BANNER);
      hidePageBanner(FAULT_BANNER);
      controls.dispose();
      
      
      
      
      disposeObject(scene);
      
      
      
      
      
      releaseEnvironment(scene.environment);
      scene.environment = null;
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      releaseShadows(scene);
      renderer.dispose();
    },
  };
}











function disposeObject(root) {
  root.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
    for (const m of mats) {
      for (const key of ['map', 'normalMap', 'alphaMap']) {
        if (m[key]?.dispose) m[key].dispose();
      }
      m.dispose();
    }
  });
}









function pickBotCharacter(rng, deck) {
  if (deck.cards.length === 0) deck.cards = rng.shuffle(CHARACTERS.slice());
  return deck.cards.pop() ?? CHARACTERS[0];
}













function uniquifyNames(racers) {
  const seen = new Map();
  for (const r of racers) {
    const base = r.character.name;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    r.displayName = n === 1 ? base : `${base} ${n}`;
  }
  return racers;
}
