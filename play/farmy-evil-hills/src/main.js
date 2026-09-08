






















import * as THREE from 'three';

import {
  gaitPose, firePose, strugglePose, deathPose, standPose, settleStep, SETTLE_TIME, aimPose,
  aimedGait, woundedGait, wallLeanPose, dangerGait, forearmLeanPose, limpWarp, feedPose,
  stepOffPose, stepOffDist, STEP_OFF_LOAD, support, kickPose, KICK_TIME, flinchAdd, FLINCH_TIME,
  turnStep, TURN_RATE_MIN, reachPose, REACH_TIME, deathFall, idleShift, fightWave,
} from '../../../web-engine/horror/gait.js';
import { XANDER_SPANS } from '../../../web-engine/horror/xanderRig.js';
import { buildBoltDriver, muzzlePoint } from '../../../web-engine/ps1/props/boltDriver.mjs';
import { buildChicken } from '../../../web-engine/ps1/creatures/chicken.mjs';
import { buildPorker, PORKER_HEIGHT_M } from '../../../web-engine/ps1/creatures/porker.mjs';
import { buildCow, COW_HEIGHT_M } from '../../../web-engine/ps1/creatures/cow.mjs';
import { buildHorse, HORSE_HEIGHT_M } from '../../../web-engine/ps1/creatures/horse.mjs';
import {
  ARENA, HORSE as BOSS_HORSE, createBossFight, stepBossFight, cutCable, bossLevel, pillars,
} from '../../../web-engine/horror/boss.js';
import {
  emptyChickenAnim, stepChicken, chickenPose, stepHorseGait, horsePose, deathTwitch,
  PORKER, COW,
  
  
  
  
  
  hitReact, locomotion, startBleedOut, SHOVE_M,
} from '../../../web-engine/horror/creatureAnim.js';
import {
  shouldRetreat, nearestGate, createRetreat, stepRetreat, retreatWaypoint, retreatAt,
  ambushOpts, flankWaypoint,
} from '../../../web-engine/horror/packBehaviour.js';
import { KEY_DIR, FILL_DIR } from '../../../web-engine/ps1/ps1Shader.mjs';
import { lookShaders, lookUniforms, registerLookMaterial, setLookMode, litMover } from './render/materials.js';
import { FOG } from '../../../web-engine/horror/lookShader.mjs';
import { PS1_SNAP } from '../../shared/ps1Render/ps1Material.js';




import { lockZoom } from '../../shared/input/zoomLock.js';





import { cameraFor, createCameraState } from '../../../web-engine/horror/dollyCamera.js';
import { moveBasis, moveVector, yawFor, turnToward, MOVE } from '../../../web-engine/horror/moveFrame.js';
import { chapterFor } from '../../../web-engine/horror/lore.js';
import { MAP } from '../../../web-engine/horror/minimap.js';
import {
  LIFT, LEAF, createLift, stepLift, mapRise, insideCar, keepOut, carIsSafe, clearOfCar,
  carWorld, leafRects, sealedRect, leafContact, OFF_RECT,
} from '../../../web-engine/horror/lift.js';
import {
  createHide, stepHide, hideProtects, hideDrawsPlayer, hideSettled,
} from '../../../web-engine/horror/hideout.js';
import {
  buildLevel, moveInLevel, pointBehind, clearOfProps, insideLevel, chaseWaypoint, progressAt,
} from '../../../web-engine/horror/level.js';
import {
  spawnVitals, tickVitals, beginGrapple, endGrapple, MAX_HEALTH, CHICKEN_LATCH_SLOW,
} from '../../../web-engine/horror/health.js';
import {
  spawn as spawnCreature, resolveHit, applyDamage, mobilityOf, statusOf, legAimHeight, centreMassHeight,
} from '../../../web-engine/horror/dismemberment.js';
import {
  readyWeapon, tickWeapon, canFire, fire, WEAPONS, feelOf,
  createTrigger, pressTrigger, releaseTrigger, dropClicks, stepTrigger,
  HIT_STOP_SLOW, KNOCK_SECONDS, CAM_PUNCH_S,
} from '../../../web-engine/horror/weapons.js';
import { createStruggle, VERB_FOR, promptFor } from '../../../web-engine/horror/struggle.js';



import {
  createBarks, say, stepBarks, combatSay, currentBark, newDeck,
} from '../../../web-engine/horror/barks.js';
import { createAimLatch, stepAimLatch, acquires, releases, raiseMix } from '../../../web-engine/horror/aimLatch.js';
import { INTRO_SHOTS, createIntro, stepIntro, introFade, introCam } from '../../../web-engine/horror/intro.js';
import { isBossDeck, rosterFor, actCardFor, actFor, isFinalDeck } from '../../../web-engine/horror/acts.js';
import { gatesFor, OPENING_FIRE } from '../../../web-engine/horror/gates.js';


import { SAVE_KEY, makeSave, normaliseSave, describeSave } from '../../../web-engine/horror/saveGame.js';
import { createFatigue, tickFatigue } from '../../../web-engine/horror/chaseFatigue.js';
import { createEntrance, stepEntrance, isProtectedPhase, emergeAt, emergeY } from '../../../web-engine/horror/entrance.js';
import { createDirector, stepDirector, returnToDirector } from '../../../web-engine/horror/director.js';
import { createBench, stockBench, benchOffers, benchSwap, nextOffer, recoveredAt } from '../../../web-engine/horror/workbench.js';
import { INJURY, isInjured, isDanger, nextStumbleAt, wallSupport } from '../../../web-engine/horror/injury.js';
import { getUpAt, restTravel, restPose } from '../../../web-engine/horror/groundPoses.js';
import {
  ACCESS_KEYS, resolveAccess, shakeScale, flashScale, flashGap, struggleMode, textScale,
} from '../../../web-engine/horror/access.js';





import { DOLLY } from '../../../web-engine/horror/dollyCamera.js';
import {
  SETTINGS_KEYS, resolveSettings, cameraBack, stickRadius, stickForward, voxScale,
  toPercent, fromPercent,
} from '../../../web-engine/horror/settings.js';
import { initAnalytics, trackEvent } from 'arbelo/analytics';




import { CCOL, CHICKEN_H, FACE_SKIN, HALL_H, HALL_W, HCOL, LIFT_FLOORS, PCOL, WCOL, XANDER_H, clamp, hash2, hexNum } from './constants.js';







import { mountSoundToggle, readMuted, syncSoundToggles, writeMuted } from '../../shared/ui/muteButton.js';
import { partsToGeometry } from './render/geometry.js';
import { makePortrait, xanderFaceSheet, xanderHeadGeometry } from './player/face.js';
import {
  AIM_FRAMES, DEATH_FALL, DEATH_FRAMES, DEATH_LIE, DEATH_TIME, FIDGET_TIME, FIRE_FRAMES, FIRE_TIME,
  IDLE_FRAMES, IDLE_TIME, KICK_FRAMES, RAISE_FRAMES, REACH_FRAMES, SHUFFLE_FRAMES, SPRINT_FRAMES,
  SPRINT_STRIDE, STRIDE, STRUGGLE_FRAMES, STRUGGLE_TIME, STEP_OFF_FRAMES,
  TALK_FRAMES, TALK_TIME, TALK_TO, WALK_FRAMES, walkPose,
  xanderTexturedParts, XANDER_ATLAS,
} from './player/body.js';
import { bindSheet } from './render/textures.js';
import { paintBestiary } from '../../../web-engine/horror/tools/creatureAtlas.mjs';
import {
  creatureAtlasUvs, unmappedCreatureParts, danglingAtlasParts,
} from '../../../web-engine/horror/creatureUv.js';
import { FLASH_MATS, grimeTexture, panel, texturedMaterial } from './world/textures.js';
import { buildDeck, pushOutOfPillars } from './world/deck.js';
import { makeLeak, makeWire, sparkSprite } from './world/hazards.js';
import {
  CHICKEN_RIG_CFG, COW_RIG, CREATURE_FACE, HORSE_RIG, PORKER_RIG, SEVER_PART, applyChickenPose,
  applyHorsePose, chickenRig,
} from './creatures/rigs.js';
import { SHEET_VOICE, chickVoice, porkVoice, sheetVoice } from './creatures/voices.js';
import { audio, installAudioUnlock } from './audio/unlock.js';
import { gunSfx, sfxSheet, voxSheet } from './audio/sheets.js';
import {
  breathSfx, creakSfx, doorSfx, dryClickSfx, footSfx, hideSfx, hitSfx, kickSfx, liftChime, liftHum,
  meatSfx, ricochetSfx, roomTone, roomToneLevel, settleSfx, shotSfx, sparkSfx,
  FLOOR_SURFACE,
} from './audio/synth.js';
import { makeBlob, makeCasings, makeDecals, makeImpacts, makeRicochets, makeTracers } from './fx/particles.js';
import { drawMap } from './hud/map.js';
import { PA_KINDS, mumbleSay, mumbleState, paVoice } from './audio/mumble.js';
import {
  feh_track, loadAccess, loadProgress, loadSettings, saveAccess, saveProgress, saveSettings,
} from './save/progress.js';
import { tape } from './audio/music.js';
import { $, hud } from './hud/hud.js';
import { createDebug } from './debug.js';
import { buildWorld as buildWorldImpl } from './world/buildWorld.js';
import { stepHazards, interactHazards, shootHazards } from './world/hazardsRuntime.js';
import { stepBeats } from './world/beatsRuntime.js';



import { createCoopRuntime } from './coopRuntime.js';
import { COOP, CHARACTERS } from '../../../web-engine/horror/coop.js';
import { renderSplit, createSplitHud, SPLIT } from './render/splitScreen.js';
import { mountLiveBadge } from '../../shared/ui/liveBadge.js';
import { LIVE_PATH } from '../../../web-engine/net/presence.js';





export function boot(canvas, hud) {
  let renderer;
  try {
    
    
    
    
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
  } catch (e) {
    hud.fatal('This browser could not start WebGL, so the station stays dark.');
    return null;
  }
  renderer.setPixelRatio(1);
  
  
  
  
  renderer.setClearColor(0x000000, 1);
  if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  if ('toneMapping' in renderer) renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  
  
  
  
  
  
  
  
  
  
  const ctx = {
    get access() { return access; },
    get actCardT() { return actCardT; }, set actCardT(v) { actCardT = v; },
    get addChicken() { return addChicken; },
    get aimLatch() { return aimLatch; },
    get api_setPaused() { return api_setPaused; },
    get arenaPillars() { return arenaPillars; }, set arenaPillars(v) { arenaPillars = v; },
    get barks() { return barks; },
    get beginEntrance() { return beginEntrance; },
    get bench() { return bench; }, set bench(v) { bench = v; },
    get birds() { return birds; },
    get blown() { return blown; },
    get bossHorseSpeed() { return bossHorseSpeed; },
    get boulder() { return boulder; }, set boulder(v) { boulder = v; },
    get buildWorld() { return buildWorld; },
    get cable() { return cable; }, set cable(v) { cable = v; },
    get camera() { return camera; },
    get camEye() { return camEye; },
    get camMode() { return camMode; },
    get camState() { return camState; }, set camState(v) { camState = v; },
    get camTarget() { return camTarget; },
    get ceilingPieces() { return ceilingPieces; }, set ceilingPieces(v) { ceilingPieces = v; },
    get debrisPool() { return debrisPool; },
    get decals() { return decals; }, set decals(v) { decals = v; },
    get dressing() { return dressing; }, set dressing(v) { dressing = v; },
    get shake() { return shake; }, set shake(v) { shake = v; },
    get deck() { return deck; }, set deck(v) { deck = v; },
    get deckGroup() { return deckGroup; }, set deckGroup(v) { deckGroup = v; },
    get director() { return director; }, set director(v) { director = v; },
    get entrances() { return entrances; }, set entrances(v) { entrances = v; },
    get EXIT() { return EXIT; }, set EXIT(v) { EXIT = v; },
    get fidgetT() { return fidgetT; },
    get fidgetWhich() { return fidgetWhich; },
    get fight() { return fight; }, set fight(v) { fight = v; },
    get fireHeld() { return fireHeld; },
    get fireT() { return fireT; },
    get fireStats() { return fireStats; },
    
    
    get creatureStats() { return creatureStats; },
    get camPunchRad() { return camPunchNow(); },
    get lastAimPoint() { return lastAimPoint; },
    get aimLowNow() { return aimLowNow; },
    get hitStopT() { return hitStopT; },
    get flashHeld() { return flashHeld; }, set flashHeld(v) { flashHeld = v; },
    get flashTicks() { return flashTicks; },
    get flinchSide() { return flinchSide; },
    get flinchBearing() { return flinchBearing; }, set flinchBearing(v) { flinchBearing = v; },
    get flinchT() { return flinchT; }, set flinchT(v) { flinchT = v; },
    get footPlant() { return footPlant; },
    get frameCount() { return frameCount; },
    get gateMeshes() { return gateMeshes; }, set gateMeshes(v) { gateMeshes = v; },
    get gun() { return gun; },
    get hidden() { return hidden; },
    get hide() { return hide; },
    get hideLocker() { return hideLocker; }, set hideLocker(v) { hideLocker = v; },
    get hideWant() { return hideWant; }, set hideWant(v) { hideWant = v; },
    get hitCount() { return hitCount; },
    get hud() { return hud; },
    get impacts() { return impacts; }, set impacts(v) { impacts = v; },
    get injuryDbg() { return injuryDbg; },
    get inSafe() { return inSafe; },
    get intro() { return intro; }, set intro(v) { intro = v; },
    get introDone() { return introDone; },
    get introPaint() { return introPaint; },
    get isBoss() { return isBoss; }, set isBoss(v) { isBoss = v; },
    get keys() { return keys; },
    get kickT() { return kickT; }, set kickT(v) { kickT = v; },
    get lastPosedFeet() { return lastPosedFeet; },
    get leaks() { return leaks; }, set leaks(v) { leaks = v; },
    get level() { return level; }, set level(v) { level = v; },
    get library() { return library; }, set library(v) { library = v; },
    get lift() { return lift; }, set lift(v) { lift = v; },
    get liftCar() { return liftCar; },
    get liftColliders() { return liftColliders; }, set liftColliders(v) { liftColliders = v; },
    get liftDoors() { return liftDoors; }, set liftDoors(v) { liftDoors = v; },
    get liftForced() { return liftForced; },
    get liftGroup() { return liftGroup; }, set liftGroup(v) { liftGroup = v; },
    get liftStats() { return liftStats; },
    get parkCarAtTerminus() { return parkCarAtTerminus; },
    get syncLiftColliders() { return syncLiftColliders; },
    get liftLamp() { return liftLamp; }, set liftLamp(v) { liftLamp = v; },
    get lockers() { return lockers; }, set lockers(v) { lockers = v; },
    get mat() { return mat; },
    get nearBench() { return nearBench; }, set nearBench(v) { nearBench = v; },
    get nearLibrary() { return nearLibrary; },
    get nearLocker() { return nearLocker; },
    get openingCooldown() { return openingCooldown; }, set openingCooldown(v) { openingCooldown = v; },
    get openingPending() { return openingPending; }, set openingPending(v) { openingPending = v; },
    get paCount() { return paCount; },
    get paIn() { return paIn; }, set paIn(v) { paIn = v; },
    get paintGeo() { return paintGeo; },
    get paused() { return paused; },
    get pendingPickup() { return pendingPickup; },
    get pickups() { return pickups; }, set pickups(v) { pickups = v; },
    get placeCar() { return placeCar; },
    get player() { return player; },
    get props() { return props; }, set props(v) { props = v; },
    get reachT() { return reachT; }, set reachT(v) { reachT = v; },
    get readLocalSave() { return readLocalSave; },
    get renderer() { return renderer; },
    get resting() { return resting; },
    get restNow() { return restNow; },
    get ricochets() { return ricochets; }, set ricochets(v) { ricochets = v; },
    get ride() { return ride; },
    get routeIntroCue() { return routeIntroCue; },
    get runState() { return runState; },
    get safeIdle() { return safeIdle; },
    get safeRoom() { return safeRoom; }, set safeRoom(v) { safeRoom = v; },
    get scene() { return scene; },
    get screenBoxOf() { return screenBoxOf; },
    get sealedDoors() { return sealedDoors; }, set sealedDoors(v) { sealedDoors = v; },
    get shotStats() { return shotStats; },
    get solidProps() { return solidProps; }, set solidProps(v) { solidProps = v; },
    get SPARK_N() { return SPARK_N; },
    get sparkAt() { return sparkAt; },
    get sparkFlash() { return sparkFlash; }, set sparkFlash(v) { sparkFlash = v; },
    get sparkGeo() { return sparkGeo; }, set sparkGeo(v) { sparkGeo = v; },
    get sparkPt() { return sparkPt; }, set sparkPt(v) { sparkPt = v; },
    get sparkStats() { return sparkStats; },
    get startDist() { return startDist; },
    get startPhase() { return startPhase; },
    get stepCount() { return stepCount; },
    get stillFor() { return stillFor; },
    get moveTrace() { return moveTrace; },
    get strips() { return strips; }, set strips(v) { strips = v; },
    
    
    get look() { return look; }, set look(v) { look = v; },
    get dressing() { return dressing; }, set dressing(v) { dressing = v; },
    get kit() { return kit; }, set kit(v) { kit = v; },
    get studio() { return studio; }, set studio(v) { studio = v; },
    get stumbleAt() { return stumbleAt; },
    get stumbleT() { return stumbleT; },
    get talkT() { return talkT; },
    get tannoy() { return tannoy; },
    get target() { return target; },
    get tracers() { return tracers; }, set tracers(v) { tracers = v; },
    get walkArmsShown() { return walkArmsShown; },
    get walkedTotal() { return walkedTotal; },
    get walkPhase() { return walkPhase; },
    get wires() { return wires; }, set wires(v) { wires = v; },
    get workbench() { return workbench; }, set workbench(v) { workbench = v; },
    get writeLocalSave() { return writeLocalSave; },
    get xander() { return xander; },
    get xRig() { return xRig; },
    get xTilt() { return xTilt; },
    
    
    
    
    get xHead() { return xHead; },
    get faceMat() { return faceMat; },
    get bodyMat() { return bodyMat; },
    get atlasTex() { return atlasTex; },
    
    
    
    
    
    get portrait() { return portrait; },
    
    
    
    
    get xanderAllParts() { return allParts; },
    
    
    
    
    
    get creatureDeath() { return creatureDeath; },
    get beginStruggleWith() { return beginStruggleWith; },
    get endStruggleWith() { return endStruggleWith; },
    get goDown() { return goDown; },
    get getUp() { return getUp; },
    get coopOver() { return coopOver; },
    get setRidePhase() { return setRidePhase; },
    get insideCarAt() { return insideCarAt; },
    get placePlayerAt() { return placePlayerAt; },
    get onCoopStatus() { return paintCoopStatus; },
    get coopNet() { return coopNet; },
    get twoBody() { return twoBody; },
    
    
    
    
    get buildId() { return ''; },
  };
  
  
  
  const _sbBox = new THREE.Box3(); const _sbV = new THREE.Vector3();
  function screenBoxOf(obj) {
    if (!obj) return null;
    _sbBox.setFromObject(obj);
    if (_sbBox.isEmpty()) return null;
    let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
    for (let i = 0; i < 8; i += 1) {
      _sbV.set(i & 1 ? _sbBox.max.x : _sbBox.min.x, i & 2 ? _sbBox.max.y : _sbBox.min.y, i & 4 ? _sbBox.max.z : _sbBox.min.z);
      _sbV.project(camera);
      const sx = (_sbV.x + 1) / 2; const sy = (1 - _sbV.y) / 2;
      x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
    }
    return { x0, y0, x1, y1, widthPct: +((x1 - x0) * 100).toFixed(1), heightPct: +((y1 - y0) * 100).toFixed(1) };
  }
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uRes: { value: new THREE.Vector2(PS1_SNAP.x, PS1_SNAP.y) },
      uKey: { value: new THREE.Vector3(...KEY_DIR) },
      uFill: { value: new THREE.Vector3(...FILL_DIR) },
      uAlpha: { value: 1 },
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      uDim: { value: 0.30 },
      uFlashPos: { value: new THREE.Vector3(0, 1.2, 0) },
      uFlash: { value: 0 },
      ...lookUniforms(),
    },
    ...lookShaders('colour'),
    fog: false, lights: false, toneMapped: false, side: THREE.DoubleSide,
  });
  FLASH_MATS.push(mat);
  registerLookMaterial(mat);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const atlasTex = bindSheet(XANDER_ATLAS.sheet, { repeat: false });
  const bodyMat = texturedMaterial(atlasTex);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  let isBoss = false;
  let fight = null;
  let boulder = null;
  let cable = null;
  let arenaPillars = [];
  let impacts = null;
  let ricochets = null;
  let tracers = null;
  let decals = null;
  let liftCar = null;
  let liftDoors = null;
  let liftGroup = null;
  
  
  let sealedDoors = null;
  let liftLamp = null;
  
  
  
  
  let liftColliders = null;
  
  
  
  const liftStats = { rides: 0, forced: 0, leafHits: 0, reopens: 0 };
  function paintGeo(geo, hex) {
    const n = geo.attributes.position.count;
    const col = new Float32Array(n * 3);
    const c = new THREE.Color(hex);
    for (let i = 0; i < n; i += 1) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    geo.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(n * 2).fill(0), 2));
    geo.computeVertexNormals();
  }
  let ride = createLift();

  














  function placeCar(bay) {
    liftCar = { x: bay.car.x, z: bay.car.z, face: bay.car.face, kind: bay.kind };
    if (liftGroup) {
      
      
      
      liftGroup.position.set(
        bay.car.x + bay.car.face.x * (LIFT.depth / 2 + 0.1),
        0,
        bay.car.z + bay.car.face.z * (LIFT.depth / 2 + 0.1),
      );
      liftGroup.rotation.y = Math.atan2(-bay.car.face.x, -bay.car.face.z);
    }
    
    
    
    if (sealedDoors) sealedDoors.visible = bay.kind !== 'arrival';
    syncLiftColliders();
  }

  






  function syncLiftColliders() {
    if (!liftColliders || !liftCar) return;
    const rs = leafRects(liftCar, ride.door);
    Object.assign(liftColliders.leaves[0], rs[0]);
    Object.assign(liftColliders.leaves[1], rs[1]);
    const arrival = deck && deck.bays ? deck.bays[0] : null;
    Object.assign(liftColliders.sealed,
      arrival && liftCar.kind !== 'arrival' ? sealedRect(arrival.car) : OFF_RECT);
  }

  


  function parkedOpen() { return { ...createLift(), phase: 'clear', door: 1 }; }

  


  function parkCarAtTerminus() {
    if (deck && deck.bays && deck.bays[1]) placeCar(deck.bays[1]);
    ride = createLift();
    syncLiftColliders();
  }
  let deck = buildLevel(1);
  let deckGroup = null;
  let strips = [];
  let ceilingPieces = [];
  let look = null;
  
  
  
  
  
  let dressing = null;
  let kit = null;
  
  
  
  
  
  const moverLight = (at) => (out) => (look ? look.lightAt(out, at.x, at.y, at.z) : out.set(1, 1, 1));
  const gameFog = new THREE.Fog(0x000000, FOG.near, FOG.far);
  let leaks = [];
  let wires = [];
  let props = [];
  
  
  
  
  
  
  
  
  const CREATURE_PAD = 0.22;
  
  
  
  
  
  const CREATURE_WEDGE_S = 0.35;
  const CREATURE_SIDLE_S = 0.8;
  let solidProps = [];
  
  
  
  
  const sparkStats = { fired: 0, near: 0 };
  const SPARK_N = 14;
  
  
  function sparkAt(tip) {
    if (!sparkGeo) return;
    const a = sparkGeo.attributes.position;
    for (let i = 0; i < SPARK_N; i += 1) {
      a.setXYZ(
        i,
        tip[0] + (Math.random() - 0.5) * 0.42,
        tip[1] - Math.random() * 0.50 + 0.06,
        tip[2] + (Math.random() - 0.5) * 0.42,
      );
    }
    a.needsUpdate = true;
  }
  let sparkGeo = null;
  let sparkPt = null;
  let lockers = [];
  
  
  
  let hide = createHide();
  let hideLocker = null;
  let hideWant = false;
  let hideFrom = null;
  let pickups = [];
  let lift = null;
  let EXIT = deck.exit;
  let safeRoom = deck.rooms.find((m) => m.kind === 'safe') || null;
  
  
  let library = null;
  
  
  
  let actCardT = 0;
  
  
  
  let gateMeshes = [];
  
  let entrances = [];
  let debrisPool = [];
  let director = null;
  
  
  
  
  
  
  
  let lastRouteProgress = 0;
  let openingPending = [];
  let openingCooldown = 0;
  let bench = createBench();
  let workbench = null;
  let nearBench = false;

  
  
  
  
  
  
  const bodyParts = xanderTexturedParts();
  const headBuilt = xanderHeadGeometry();
  const allParts = [...bodyParts, { name: 'head', mesh: headBuilt.mesh }];

  
  
  
  
  
  
  
  
  
  
  
  const WHITE = () => 0xffffff;
  const bake = (pose) => partsToGeometry(xanderTexturedParts(pose), WHITE, XANDER_H, allParts, true);
  const walkGeo = [];
  for (let i = 0; i < WALK_FRAMES; i += 1) walkGeo.push(bake(walkPose(i / WALK_FRAMES, 'walk')));
  
  
  
  
  
  
  
  
  
  
  
  
  const stepOffGeo = [];
  for (let i = 0; i < STEP_OFF_FRAMES; i += 1) {
    stepOffGeo.push(bake({ ...standPose(0), ...stepOffPose(i / (STEP_OFF_FRAMES - 1)) }));
  }
  
  
  
  
  
  
  
  const sprintGeo = [];
  for (let i = 0; i < SPRINT_FRAMES; i += 1) sprintGeo.push(bake(walkPose(i / SPRINT_FRAMES, 'sprint')));
  
  
  
  
  
  
  
  
  
  
  
  const aimGeo = [];
  for (let i = 0; i < AIM_FRAMES; i += 1) {
    aimGeo.push(bake({ ...standPose(0), ...aimPose((i / AIM_FRAMES) * (1 / 0.9)) }));
  }
  
  
  
  
  const raiseGeo = [];
  for (let i = 0; i < RAISE_FRAMES; i += 1) {
    raiseGeo.push(bake(raiseMix(standPose(0), aimPose(0), i / (RAISE_FRAMES - 1))));
  }
  
  
  
  
  
  
  
  
  const FEED_FRAMES = 9;
  const feedGeo = [];
  const feedDrop = [];
  for (let i = 0; i < FEED_FRAMES; i += 1) {
    const fp = feedPose(i / (FEED_FRAMES - 1));
    feedGeo.push(bake(fp));
    feedDrop.push(fp.drop || 0);
  }
  const talkGeo = [];
  {
    for (let i = 0; i < TALK_FRAMES; i += 1) {
      talkGeo.push(bake(raiseMix(standPose(0), { ...standPose(0), ...TALK_TO }, i / (TALK_FRAMES - 1))));
    }
  }
  const walkAimGeo = [];
  for (let i = 0; i < WALK_FRAMES; i += 1) {
    walkAimGeo.push(bake(aimedGait(
      walkPose(i / WALK_FRAMES, 'walk'),
      aimPose((i / WALK_FRAMES) * (1 / 0.9)),
    )));
  }
  const fireGeo = [];
  for (let i = 0; i < FIRE_FRAMES; i += 1) {
    fireGeo.push(bake({ ...standPose(0), ...firePose((i / (FIRE_FRAMES - 1)) * FIRE_TIME) }));
  }
  const struggleGeo = [];
  for (let i = 0; i < STRUGGLE_FRAMES; i += 1) {
    
    
    
    
    
    
    
    
    
    struggleGeo.push(bake({ ...standPose(0), ...strugglePose((i / STRUGGLE_FRAMES) * STRUGGLE_TIME, 0.8) }));
  }
  const deathGeo = [];
  for (let i = 0; i < DEATH_FRAMES; i += 1) {
    deathGeo.push(bake({ ...standPose(0), ...deathPose(i / (DEATH_FRAMES - 1)) }));
  }
  
  
  
  
  const kickGeo = [];
  for (let i = 0; i < KICK_FRAMES; i += 1) {
    kickGeo.push(bake({ ...standPose(0), ...kickPose((i / (KICK_FRAMES - 1)) * KICK_TIME) }));
  }
  
  const reachGeo = [];
  for (let i = 0; i < REACH_FRAMES; i += 1) {
    reachGeo.push(bake({ ...standPose(0), ...reachPose((i / (REACH_FRAMES - 1)) * REACH_TIME) }));
  }
  
  
  
  
  
  const shuffleGeo = [];
  for (let i = 0; i < SHUFFLE_FRAMES; i += 1) {
    shuffleGeo.push(bake(walkPose(i / SHUFFLE_FRAMES, 'shuffle')));
  }
  
  
  
  
  
  
  const woundedWalkGeo = [];
  const woundedWallWalkGeo = [];
  for (let i = 0; i < WALK_FRAMES; i += 1) {
    woundedWalkGeo.push(bake(woundedGait(walkPose(i / WALK_FRAMES, 'walk'), false)));
    woundedWallWalkGeo.push(bake(woundedGait(walkPose(i / WALK_FRAMES, 'walk'), true)));
  }
  
  
  
  const dangerWalkGeo = [];
  const dangerWallWalkGeo = [];
  for (let i = 0; i < WALK_FRAMES; i += 1) {
    const wp = limpWarp(i / WALK_FRAMES, INJURY.limpBias);
    dangerWalkGeo.push(bake(dangerGait(walkPose(wp, 'walk'), false)));
    dangerWallWalkGeo.push(bake(dangerGait(walkPose(wp, 'walk'), true)));
  }
  const FOREARM_FRAMES = 10;
  const forearmLeanGeo = [];
  for (let i = 0; i < FOREARM_FRAMES; i += 1) {
    forearmLeanGeo.push(bake(forearmLeanPose((i / FOREARM_FRAMES) * (1 / 0.83))));
  }
  const dangerIdleGeo = [];
  for (let i = 0; i < IDLE_FRAMES; i += 1) {
    dangerIdleGeo.push(bake(dangerGait(standPose((i / (IDLE_FRAMES - 1)) * (Math.PI / 0.9)))));
  }
  
  
  
  
  
  
  
  const FIDGET_FRAMES = 9;
  const fidgetGeo = [[], []];
  for (let i = 0; i < FIDGET_FRAMES; i += 1) {
    
    const k = Math.sin(Math.PI * (i / (FIDGET_FRAMES - 1)));
    const base = standPose(0);
    fidgetGeo[0].push(bake({
      ...base,
      
      feet: [[base.feet[0][0] - 0.03 * k, 0], [base.feet[1][0] + 0.05 * k, 0]],
      hands: [base.hands[0], [base.hands[1][0] + 0.045 * k, base.hands[1][1] + 0.02 * k]],
      twist: (base.twist ?? 0) + 0.06 * k,
      lean: (base.lean ?? 0) + 0.012 * k,
    }));
    fidgetGeo[1].push(bake({
      ...base,
      
      twist: (base.twist ?? 0) + 0.13 * k,
      hands: [[base.hands[0][0] + 0.02 * k, base.hands[0][1] + 0.035 * k], base.hands[1]],
      lean: (base.lean ?? 0) - 0.02 * k,
    }));
  }
  const WALLLEAN_FRAMES = 10;
  const wallLeanGeo = [];
  for (let i = 0; i < WALLLEAN_FRAMES; i += 1) {
    wallLeanGeo.push(bake(wallLeanPose((i / WALLLEAN_FRAMES) * (1 / 0.9))));
  }
  
  
  
  
  
  const REST_FRAMES = 10;
  const restGeo = [];
  const restPitch = [];
  const restLift = [];
  for (let i = 0; i < REST_FRAMES; i += 1) {
    const rt = restTravel(i / (REST_FRAMES - 1), true);
    restGeo.push(bake(rt.pose));
    restPitch.push(rt.pitch);
    restLift.push(rt.lift);
  }
  const seatGeo = [bake(restPose(false).pose), bake(restPose(true).pose)];
  const seatPitch = [restPose(false).pitch, restPose(true).pitch];
  const seatLift = [restPose(false).lift, restPose(true).lift];
  const GETUP_FRAMES = 14;
  const getUpGeo = [];
  const getUpPitch = [];
  const getUpLift = [];
  for (let i = 0; i < GETUP_FRAMES; i += 1) {
    const gu = getUpAt(i / (GETUP_FRAMES - 1));
    getUpGeo.push(bake(gu.pose));
    getUpPitch.push(gu.pitch);
    getUpLift.push(gu.lift);
  }
  const idleGeo = [];
  const woundedIdleGeo = [];
  for (let i = 0; i < IDLE_FRAMES; i += 1) {
    idleGeo.push(bake(standPose((i / (IDLE_FRAMES - 1)) * (Math.PI / 0.9))));
    woundedIdleGeo.push(bake(woundedGait(standPose((i / (IDLE_FRAMES - 1)) * (Math.PI / 0.9)))));
  }
  const xGeo = idleGeo[0];

  
  
  
  
  
  
  
  
  
  
  
  
  const gunGeo = (() => {
    const built = buildBoltDriver();
    const pos = []; const col = []; const idx = [];
    
    
    
    const GCOL = {
      receiver: 0x4a4f52, nose: 0x5b6165, guard: 0x2f3335,
      bottle: 0x6a5f4a, magazine: 0x3d4143, grip: 0x241f1c, trigger: 0x2a2d2f,
    };
    for (const p of built.parts) {
      const base = pos.length / 3;
      const c = new THREE.Color(GCOL[p.name] ?? 0x4a4f52);
      for (let i = 0; i < p.mesh.positions.length; i += 3) {
        pos.push(p.mesh.positions[i], p.mesh.positions[i + 1], p.mesh.positions[i + 2]);
        col.push(c.r, c.g, c.b);
      }
      for (const i of p.mesh.indices) idx.push(base + i);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  })();
  const gun = new THREE.Mesh(gunGeo, mat);
  litMover(gun, (out) => (look ? look.lightAt(out, player.x, 1.1, player.z) : out.set(1, 1, 1)));
  gun.visible = false;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const flashTex = (() => {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255,255,245,1)');
    grad.addColorStop(0.22, 'rgba(255,226,150,0.95)');
    grad.addColorStop(0.55, 'rgba(255,150,54,0.45)');
    grad.addColorStop(1, 'rgba(255,110,30,0)');
    g.fillStyle = grad;
    g.beginPath(); g.arc(32, 32, 30, 0, Math.PI * 2); g.fill();
    
    g.globalCompositeOperation = 'lighter';
    for (const [ang, len, wide] of [[0, 30, 7], [1.62, 20, 5], [3.05, 26, 6], [4.9, 15, 4]]) {
      g.save(); g.translate(32, 32); g.rotate(ang);
      const p = g.createLinearGradient(0, 0, len, 0);
      p.addColorStop(0, 'rgba(255,240,200,0.9)');
      p.addColorStop(1, 'rgba(255,140,40,0)');
      g.fillStyle = p;
      g.beginPath(); g.moveTo(0, -wide); g.lineTo(len, 0); g.lineTo(0, wide); g.closePath(); g.fill();
      g.restore();
    }
    return new THREE.CanvasTexture(c);
  })();
  const flashMat = new THREE.MeshBasicMaterial({
    map: flashTex, color: 0xffffff, transparent: true, opacity: 0,
    depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const flashGeo = new THREE.PlaneGeometry(0.46, 0.46);
  const flash = new THREE.Mesh(flashGeo, flashMat);
  flash.position.set(...muzzlePoint());
  gun.add(flash);
  
  
  
  
  
  const casings = makeCasings();
  scene.add(casings.points);
  
  const flashCross = new THREE.Mesh(flashGeo, flashMat);
  flashCross.position.set(...muzzlePoint());
  flashCross.rotation.x = Math.PI / 2;
  gun.add(flashCross);
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const xRig = new THREE.Group();
  const xTilt = new THREE.Group();
  const xander = new THREE.Mesh(xGeo, bodyMat);
  
  
  
  
  litMover(xander, (out) => (look ? look.lightAt(out, player.x, 1.0, player.z) : out.set(1, 1, 1)));
  xander.rotation.x = -Math.PI / 2;   
  xander.rotation.z = -Math.PI / 2;   
  xander.add(gun);
  xTilt.add(xander);
  xRig.add(xTilt);
  scene.add(xRig);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const shadowRig = new THREE.Group();
  const shadowMats = [];
  const blobs = [];
  {
    for (let i = 0; i < 3; i += 1) {
      const q = makeBlob(1, 0.4);
      shadowMats.push(q.material);
      blobs.push(q);
      shadowRig.add(q);
    }
  }
  scene.add(shadowRig);

  
  
  const torsoParts = bodyParts.filter((p) => /^torso|^trapezius|^shoulder|^hip/.test(p.name));
  const shouldersGeo = torsoParts.length
    ? partsToGeometry(torsoParts, WHITE, XANDER_H, allParts, true)
    : null;

  const faces = {
    calm: xanderFaceSheet('calm'),
    alert: xanderFaceSheet('alert'),
    afraid: xanderFaceSheet('afraid'),
    hurt: xanderFaceSheet('hurt'),
  };
  
  
  const faceMat = texturedMaterial(faces.calm, { side: THREE.DoubleSide });
  const headGeo = partsToGeometry([{ name: 'head', mesh: headBuilt.mesh }], () => 0xffffff, XANDER_H, allParts, true);
  
  
  
  
  
  
  
  headGeo.computeBoundingBox();
  const hb = headGeo.boundingBox;
  const headMid = new THREE.Vector3(
    (hb.min.x + hb.max.x) / 2, (hb.min.y + hb.max.y) / 2, (hb.min.z + hb.max.z) / 2,
  );
  headGeo.translate(-headMid.x, -headMid.y, -headMid.z);
  
  
  
  
  
  
  
  
  
  
  
  
  if (shouldersGeo) shouldersGeo.translate(-headMid.x, -headMid.y, -headMid.z);
  const neck = new THREE.Group();
  neck.position.copy(headMid);
  
  
  
  
  const neckHomeZ = neck.position.z;
  const xHead = new THREE.Mesh(headGeo, faceMat);
  litMover(xHead, (out) => (look ? look.lightAt(out, player.x, 1.6, player.z) : out.set(1, 1, 1)));
  neck.add(xHead);
  xander.add(neck);
  
  
  const portrait = makePortrait(headGeo, shouldersGeo, faces, bodyMat);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const creatureAtlases = paintBestiary();
  const creatureMats = {};
  const atlasParts = (species, parts) => {
    const missing = unmappedCreatureParts(species, parts);
    if (missing.length) throw new Error(`creatureUv: ${species} has unmapped parts ${missing.join(', ')}`);
    const dangling = danglingAtlasParts(species);
    if (dangling.length) throw new Error(`creatureUv: ${species} maps to atlas parts that do not exist: ${dangling.join(', ')}`);
    creatureMats[species] = texturedMaterial(
      bindSheet(creatureAtlases[species].sheet, { repeat: false }),
    );
    return creatureAtlasUvs(species, parts, creatureAtlases[species].rects);
  };

  const chickenParts = atlasParts('chicken', buildChicken().parts);
  const porkerParts = atlasParts('porker', buildPorker().parts);
  const cowParts = atlasParts('cow', buildCow().parts);
  const horseParts = atlasParts('horse', buildHorse().parts);

  const player = {
    
    
    
    
    
    
    
    x: deck.start.x, z: deck.start.z, yaw: 0,
    vitals: spawnVitals(),
    
    
    
    
    
    
    
    
    
    
    weapon: readyWeapon('boltDriver', { ammo: 48 }),
    struggle: null,
    latchedBy: null,
    dead: false,
  };

  
  
  
  
  
  const barks = createBarks((Date.now() % 100000) | 1);
  
  
  
  
  let barkHealthWas = MAX_HEALTH;
  let barkAmmoWas = Infinity;
  let barkSpottedWas = false;

  const birds = [];
  let chickSeed = 0;
  function addChicken(z, x, kind = 'chicken') {
    
    
    const SPECIES = {
      chicken: [chickenParts, (n) => CCOL[n] ?? 0xb9b07a, CHICKEN_H, undefined],
      porker: [porkerParts, (n) => PCOL[n] ?? 0xb08a86, PORKER_HEIGHT_M, PORKER_RIG],
      cow: [cowParts, (n) => WCOL[n] ?? 0xb8b3ab, COW_HEIGHT_M, COW_RIG],
      horse: [horseParts, (n) => (/^eye/.test(n) ? 0x120e0c : (HCOL[n] ?? 0x2b2724)),
        HORSE_HEIGHT_M, HORSE_RIG],
    };
    
    
    
    
    if (liftCar) {
      const k = keepOut(liftCar, x, z, 0.6);
      x = k.x; z = k.z;
    }
    const [sParts, sCol, sH, sRig] = SPECIES[kind] || SPECIES.chicken;
    
    
    
    const rig = chickenRig(sParts, sCol, sH, creatureMats[kind] || mat, sRig);
    rig.root.rotation.x = -Math.PI / 2;
    
    rig.root.userData.mover = true;
    rig.root.traverse((o) => { if (o.isMesh) litMover(o, moverLight({ get x() { return rig.root.position.x; }, y: 0.6, get z() { return rig.root.position.z; } })); });
    (deckGroup || scene).add(rig.root);
    
    
    
    const shade = makeBlob(sH * (kind === 'horse' ? 1.15 : 0.62), 0.44);
    (deckGroup || scene).add(shade);
    chickSeed += 0.37;
    birds.push({
      
      mesh: rig.root, rig, shade, x, z, alive: true, kind,
      
      
      
      
      
      creature: kind === 'horse' ? null : spawnCreature(kind),
      anim: emptyChickenAnim(chickSeed % 1),
      
      
      
      
      voice: 0.78 + (chickSeed * 1.7) % 0.62,
      idleIn: 1 + Math.random() * 5,
      latched: false,
      cool: 0,
    });
    return birds[birds.length - 1];
  }

  
  function buildWorld(...args) {
    const r = buildWorldImpl(ctx, ...args);
    
    
    
    
    
    if (director && coopNet && coopNet.active) {
      director = { ...director, budget: coopNet.budget(director.budget) };
    }
    return r;
  }

  
  
  
  
  
  
  
  
  let coopNet = null;
  let coopHud = null;
  
  let coopDownT = 0;
  








  let coopCamState = null;
  let coopCamState2 = null;
  const coopCamera = new THREE.PerspectiveCamera(62, 1, 0.05, 200);
  const coopCamera2 = new THREE.PerspectiveCamera(62, 1, 0.05, 200);

  
  function beginStruggleWith(b) {
    
    
    
    
    if (!b) return 'no-creature';
    if (player.dead) return 'dead';
    if (coopDownT > 0) return 'downed';
    if (player.struggle) return 'already-struggling';
    player.latchedBy = b;
    player.struggle = createStruggle({
      verb: VERB_FOR[b.kind] ?? VERB_FOR.chicken ?? 'mash',
      mode: struggleMode(access, 'reduced'),
    });
    shake = Math.max(shake, 0.55);
    hitSfx();
    beginGrapple(player.vitals, b.kind);
    return 'ok';
  }
  function endStruggleWith() {
    player.latchedBy = null;
    player.struggle = null;
    endGrapple(player.vitals);
  }

  






  function goDown() {
    coopDownT = COOP.downedFor;
    player.vitals.health = 0;
    
    
    
    
    
    
    
    endStruggleWith();
    hud.msg('DOWN - hold on');
  }
  function getUp(hp) {
    coopDownT = 0;
    player.vitals.health = Math.max(1, hp || 30);
    hud.msg('');
  }
  
  function coopOver(o) {
    coopDownT = 0;
    if (player.dead) return;
    player.dead = true;
    hud.dead();
    feh_track('run_death', { deck: (o && o.level) || level, act: actFor(level) });
  }

  
  function setRidePhase(phase, toLevel) {
    if (!phase || ride.phase === phase) return;
    ride = { ...ride, phase, t: 0 };
    if (phase === 'boarding' || phase === 'clear') ride = { ...ride, door: 1 };
    if (phase === 'riding') ride = { ...ride, door: 0 };
    if (toLevel && toLevel !== level) hud.lift(toLevel);
  }

  
  function insideCarAt(x, z) {
    if (!liftCar) return false;
    return insideCar(liftCar, x, z, LEAF.pad - 0.02, LEAF.pad + LEAF.halfThick);
  }

  
  function placePlayerAt(p) {
    if (!p) return;
    player.x = p.x; player.z = p.z;
    if (typeof p.yaw === 'number') player.yaw = p.yaw;
    camState = null;
    coopCamState = null;
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const partnerBody = (() => {
    const g = new THREE.Group();
    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 1.15, 0.28),
      new THREE.MeshBasicMaterial({ color: CHARACTERS.guest.shirt }),
    );
    torso.position.y = 0.95;
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.26, 0.24),
      new THREE.MeshBasicMaterial({ color: hexNum(FACE_SKIN.SKIN_LIT) }),
    );
    head.position.y = 1.68;
    const legs = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.82, 0.24),
      new THREE.MeshBasicMaterial({ color: 0x3a3f36 }),
    );
    legs.position.y = 0.41;
    
    
    
    
    for (const part of [torso, head, legs]) {
      litMover(part, (out) => (look
        ? look.lightAt(out, g.position.x, 1.0, g.position.z)
        : out.set(1, 1, 1)));
    }
    g.add(torso, head, legs);
    g.visible = false;
    scene.add(g);
    return g;
  })();

  








  let twoBody = null;
  function stepTwoBody(dt) {
    if (!coopNet || !coopNet.local) { twoBody = null; return; }
    if (!twoBody) {
      const s = coopNet.spawn({ x: deck.start.x, z: deck.start.z, yaw: 0 });
      twoBody = {
        x: (s ? s.x : deck.start.x) + 1.2, z: s ? s.z : deck.start.z, yaw: 0,
        hp: MAX_HEALTH, state: 'idle', weapon: 'boltDriver', ammo: 48,
        dead: false, hidden: false, latched: false, sprint: false, aim: false,
      };
    }
    const fwd = (keys.has('KeyI') ? 1 : 0) - (keys.has('KeyK') ? 1 : 0);
    const turn = (keys.has('KeyL') ? 1 : 0) - (keys.has('KeyJ') ? 1 : 0);
    twoBody.yaw += turn * 2.4 * dt;
    const sprint = keys.has('ShiftRight');
    twoBody.sprint = sprint;
    const sp = sprint ? 4.2 : 2.4;
    const step = fwd * sp * dt;
    if (step) {
      const m = moveInLevel(deck, twoBody, -Math.sin(twoBody.yaw) * step,
        Math.cos(twoBody.yaw) * step, 0.4, solidProps);
      twoBody.x = m.x; twoBody.z = m.z;
    }
    twoBody.state = step ? (sprint ? 'run' : 'walk') : 'idle';
  }

  
  let coopStatusPaint = null;
  function paintCoopStatus(rt) {
    if (!coopHud) coopHud = createSplitHud();
    if (coopStatusPaint) coopStatusPaint(rt);
  }

  
  function applyPlacement(cam, pl) {
    cam.fov = pl.fov;
    cam.updateProjectionMatrix();
    cam.position.set(pl.eye.x, pl.eye.y, pl.eye.z);
    cam.lookAt(pl.target.x, pl.target.y, pl.target.z);
  }

  
















  function coopCameraList(dtCam) {
    if (!coopNet || !coopNet.active || !deck) return null;
    const seats = coopNet.seatBodies();
    if (seats.length < 2) return null;
    const halfH = Math.max(1, Math.floor(((canvas.height || 540) - SPLIT.gutter) / 2));
    const opts = { aspect: (canvas.width || 960) / halfH, mobile: navigator.maxTouchPoints > 1 || touch.active };
    const placeFor = (body, state) => {
      const p = { x: body.x, z: body.z, yaw: body.yaw || 0, vx: 0, vz: 0 };
      const st = state || createCameraState(deck, p, 'auto', opts);
      return { state: st, pl: cameraFor(deck, p, 'auto', st, dtCam, opts) };
    };
    if (coopNet.watching) {
      const a = placeFor(seats[0].body, coopCamState);
      coopCamState = a.state; applyPlacement(coopCamera, a.pl);
      const b = placeFor(seats[1].body, coopCamState2);
      coopCamState2 = b.state; applyPlacement(coopCamera2, b.pl);
      return [coopCamera, coopCamera2];
    }
    const other = seats.find((s) => !s.mine);
    if (!other) return null;
    const b = placeFor(other.body, coopCamState);
    coopCamState = b.state;
    applyPlacement(coopCamera, b.pl);
    return [camera, coopCamera];
  }

  
  function paintCoopHud() {
    const seats = coopNet && coopNet.active ? coopNet.seatBodies() : [];
    const on = seats.length >= 2;
    coopHud.setMode(!on ? 'off' : (coopNet.watching ? 'watch' : 'split'));
    if (!on) return;
    const other = coopNet.watching ? seats[1] : seats.find((s) => !s.mine);
    const rp = coopNet.revivePrompt;
    let note = '';
    if (other && other.down) {
      note = rp ? `REVIVING ${Math.round((rp.progress || 0) * 100)}%` : 'DOWN - hold E within 1.2 m';
    } else if (coopDownT > 0) {
      note = `YOU ARE DOWN - ${Math.ceil(coopDownT)}s`;
    }
    coopHud.paint({
      name: other ? (other.seat === 'host' ? CHARACTERS.host.name : CHARACTERS.guest.name) : 'PARTNER',
      health: other?.body?.hp ?? 0,
      present: !!other,
      note,
    });
  }

  













  function puppetCreature(b, dtP, nowS) {
    const at = b.coopIndex != null ? coopNet.creatureAt(b.coopIndex, nowS * 1000) : null;
    if (at) { b.x = at.x; b.z = at.z; }
    if (!b.mesh) return;
    b.mesh.visible = !!b.alive;
    if (b.shade) b.shade.visible = !!b.alive;
    if (!b.alive) return;
    const dx = player.x - b.x; const dz = player.z - b.z;
    b.mesh.position.set(b.x, 0, b.z);
    b.mesh.rotation.x = -Math.PI / 2;
    
    
    
    b.mesh.rotation.z = Math.atan2(dx, dz) + Math.PI + CREATURE_FACE;
    b.mesh.rotation.y = 0;
    if (b.shade) b.shade.position.set(b.x, 0.02, b.z);
    b.anim = { ...b.anim, t: (b.anim?.t ?? 0) + dtP };
    if (b.rig) {
      const sev = b.severedWire || [];
      for (const id of sev) {
        const part = b.rig.named[SEVER_PART[id]];
        if (part && part.visible) part.visible = false;
      }
      applyChickenPose(b.rig, chickenPose(b.anim, {
        severed: { legL: sev.includes('leg-l'), legR: sev.includes('leg-r') },
      }));
    }
  }

  
  
  
  
  player.vitals.health = MAX_HEALTH * INJURY.startHealthFrac;
  
  
  
  
  for (let i = 0; i < 12; i += 1) {
    const sz = 0.06 + (i % 4) * 0.03;
    const chunk = introPaintVaried(new THREE.BoxGeometry(sz, sz * 0.7, sz * 0.9).toNonIndexed(), 0x4b524d, 0.2);
    chunk.visible = false;
    scene.add(chunk);
    debrisPool.push({ mesh: chunk, vx: 0, vy: 0, vz: 0, live: false });
  }
  for (let i = 0; i < 4; i += 1) {
    const dq = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5),
      new THREE.MeshBasicMaterial({ color: 0x8b877d, transparent: true, opacity: 0, depthWrite: false }));
    dq.visible = false;
    scene.add(dq);
    debrisPool.push({ mesh: dq, vx: 0, vy: 0.4, vz: 0, live: false, dust: true });
  }
  
  
  
  
  coopNet = createCoopRuntime(ctx);
  buildWorld(1);
  
  ride = parkedOpen();
  syncLiftColliders();

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  


  const camera = new THREE.PerspectiveCamera(62, 1, 0.05, 200);
  
  
  renderer.setSize(canvas.clientWidth || 960, canvas.clientHeight || 540, false);
  camera.aspect = (canvas.clientWidth || 960) / (canvas.clientHeight || 540);
  camera.updateProjectionMatrix();

  
  const keys = new Set();
  let fireHeld = false;
  let aimLow = false;
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  let aimLowToggle = false;
  let aimLowNow = false;
  const trigger = createTrigger();
  
  
  
  const fireStats = { clicks: 0, shots: 0, clickShots: 0, holdShots: 0, hits: 0, knockbackMax: 0, hitStops: 0, shells: 0 };
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const creatureStats = {
    crawling: 0, crawlers: 0, flinches: 0, interrupts: 0, retreats: 0, reissues: 0, ambushes: 0, flanks: 0,
  };
  const pullTrigger = () => { fireHeld = true; pressTrigger(trigger); fireStats.clicks += 1; };
  const letGo = () => { fireHeld = false; releaseTrigger(trigger); };
  addEventListener('keydown', (e) => {
    lastInput = 'key';
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    if (e.code === 'KeyE' && coopNet && coopNet.active) {
      coopNet.setHoldE(true);
      if (!e.repeat) coopNet.pressE();
    }
    if (e.code === 'KeyE' && nearBench && benchOffers(bench).length) {
      
      
      
      
      const takeId = nextOffer(bench, player.weapon.id);
      const r = benchSwap(bench, player.weapon, takeId);
      bench = r.bench;
      player.weapon = r.weapon;
      const ammoTxt = r.weapon.ammo === Infinity ? '\u221E' : String(r.weapon.ammo);
      hud.msg(`${r.weapon.spec.name}  \u2022  ${ammoTxt}`);
      actCardT = 3;
      sfxSheet.play('settle', { gain: 0.7, rate: 1.3 });
      return;
    }
    
    
    
    if (e.code === 'KeyE' && interactHazards(ctx)) return;
    if (e.code === 'KeyE') {
      
      
      
      
      
      
      if (hidden || !hideSettled(hide) ) { hideWant = true; return; }
      if (nearLocker) { hideLocker = nearLocker; hideWant = true; hideSfx(); }
      return;
    }
    keys.add(e.code);
    if (player.struggle) {
      
      
      if (e.code === 'KeyA') player.struggle.press('a');
      if (e.code === 'KeyD') player.struggle.press('d');
    }
    if (['ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
  });
  addEventListener('keyup', (e) => {
    keys.delete(e.code);
    if (e.code === 'KeyE' && coopNet && coopNet.active) coopNet.setHoldE(false);
  });
  canvas.addEventListener('pointerdown', (e) => {
    
    
    if (player.struggle && !player.weapon.spec?.breaksGrapple) { player.struggle.press('tap'); return; }
    if (e.button === 2) { aimLow = true; return; }
    pullTrigger();
  });
  
  
  
  
  addEventListener('pointerup', (e) => {
    if (e.button === 2) { aimLow = false; return; }
    letGo();
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (player.struggle && !player.weapon.spec?.breaksGrapple) player.struggle.press('tap');
    else pullTrigger();
  }, { passive: false });
  canvas.addEventListener('touchend', () => { letGo(); }, { passive: false });

  
  
  
  
  
  const touch = { fwd: 0, turn: 0, active: false };
  if ((navigator.maxTouchPoints || 0) > 0) {
    const wrap = document.getElementById('touch');
    if (wrap) wrap.style.display = 'block';
    const stick = document.getElementById('stick');
    const nub = document.getElementById('nub');
    const fireBtn = document.getElementById('fireBtn');
    if (stick && nub) {
      const set = (e) => {
        
        
        
        
        
        
        const R = stickRadius(settings, 46);
        const r = stick.getBoundingClientRect();
        const t = e.touches ? e.touches[0] : e;
        let dx = t.clientX - (r.left + r.width / 2);
        let dy = t.clientY - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy) || 1;
        if (d > R) { dx = (dx / d) * R; dy = (dy / d) * R; }
        nub.style.transform = `translate(${dx}px, ${dy}px)`;
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        touch.fwd = stickForward(settings, dy) / R;
        touch.turn = dx / R;
        touch.active = true;
        lastInput = 'touch';
      };
      const clear = () => {
        nub.style.transform = 'translate(0,0)';
        touch.fwd = 0; touch.turn = 0; touch.active = false;
      };
      stick.addEventListener('touchstart', (e) => { e.preventDefault(); set(e); }, { passive: false });
      stick.addEventListener('touchmove', (e) => { e.preventDefault(); set(e); }, { passive: false });
      stick.addEventListener('touchend', (e) => { e.preventDefault(); clear(); }, { passive: false });
      stick.addEventListener('touchcancel', clear);
    }
    if (fireBtn) {
      const down = (e) => {
        e.preventDefault();
        
        
        if (player.struggle && !player.weapon.spec?.breaksGrapple) player.struggle.press('tap');
        else pullTrigger();
      };
      fireBtn.addEventListener('touchstart', down, { passive: false });
      fireBtn.addEventListener('touchend', (e) => { e.preventDefault(); letGo(); }, { passive: false });
    }
    
    
    
    
    const aimBtn = document.getElementById('aimBtn');
    if (aimBtn) {
      aimBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        aimLowToggle = !aimLowToggle;
        aimBtn.classList.toggle('on', aimLowToggle);
      }, { passive: false });
    }
    
    
    
    
    
    
    
    
    
    
    
    
    const useBtn = document.getElementById('useBtn');
    if (useBtn) {
      useBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', key: 'e' }));
      }, { passive: false });
    }
    
    
    
    const menuBtn = document.getElementById('menuBtn');
    if (menuBtn) {
      menuBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (api_setPaused) api_setPaused(true);
      }, { passive: false });
    }
  }

  
  let last = 0;
  let shotFlash = 0;
  
  
  const FLASH_WORLD = new THREE.Vector3();
  let shotEnd = null;
  
  const shotStats = { bolts: 0, ricochets: 0, forcedAt: null };
  let flashHeld = false;
  let flashTicks = 0;
  let paIn = 12 + Math.random() * 14;
  
  
  
  
  
  let shake = 0;
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  let hitStopT = 0;
  let lastAimPoint = null;
  let reticHitT = 9;
  let hurtT = 9;
  let hurtAcc = 0;
  let lastHealth = null;
  const RETIC_HIT_S = 0.12;
  const HURT_S = 0.55;
  const bodyHeightOf = (kind) => ({ porker: PORKER_HEIGHT_M, cow: COW_HEIGHT_M }[kind] ?? CHICKEN_H);
  
  
  const hitStopNow = (s) => { hitStopT = Math.max(hitStopT, s); fireStats.hitStops += 1; };
  
  
  
  
  const camPunchNow = () => (fireT < CAM_PUNCH_S
    ? (feelOf(player.weapon.id).camPunch * Math.PI / 180) * (1 - fireT / CAM_PUNCH_S) * shakeScale(access)
    : 0);
  let headLook = 0;
  let prevYaw = 0;
  let creakIn = 6 + Math.random() * 10;
  let sparkIn = 3 + Math.random() * 7;
  let sparkFlash = 0;
  
  
  
  
  
  
  let camState = null;
  let camMode = 'dolly';
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  let studio = null;
  let studioBg = null;
  let soloSaved = null;
  let target = null;
  let aimLatch = createAimLatch();
  let walkArmsShown = false;
  let wasGaitBranch = false;
  let wallRoll = 0;
  let bankRoll = 0;
  
  
  
  
  const FOOT_PLANT_LIFT = 0.02;
  
  
  const FOOT_SKATE_FLOOR = 0.05;
  
  
  
  
  
  
  
  
  
  
  
  
  const LOCOMOTION_CLIP = /^(walk|walkaim|sprint|shuffle|stepoff|wounded)/;
  const footPlant = {
    samples: 0, sum: 0, max: 0, over: 0, worst: null,
    pops: 0, popMax: 0, popWorst: null, clips: Object.create(null),
    settle: { samples: 0, sum: 0, max: 0, over: 0, worst: null },
    
    
    
    
    
    
    
    driftMax: 0, driftWorst: null, stances: 0, rawMax: 0,
  };
  const footPlantPrev = {
    x: [0, 0], z: [0, 0], fx: [0, 0], dsum: [0, 0], dclip: ['', ''],
    down: [false, false], px: 0, pz: 0, t: 0, clip: '',
  };

  let flinchSide = 1;
  
  
  
  let flinchBearing = 0;
  let lastPosedFeet = null;
  let lastFlashAt = -99;
  let sinceArrive = -1;
  
  let liftFloorsHeard = 0;
  let liftForced = 0;
  let deckCardT = 0;
  let stumbleAt = nextStumbleAt(0);
  let stumbleT = -1;
  let walkedTotal = 0;
  let injuryDbg = { injured: false, wall: null, touch: false, leanClose: false };
  let bossMoved = 0;
  let bossWonIn = 0;

  
  
  
  
  
  
  
  
  
  let paused = false;
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  let menuUp = true;
  
  
  let api_setPaused = null;


  
  
  
  
  function floorSurface() {
    const a = dressing && dressing.archetype;
    return (a && FLOOR_SURFACE[a]) || 'deck';
  }

  function runState() {
    return {
      deck: level,
      health: player.vitals.health,
      stamina: player.vitals.stamina ?? 100,
      ammo: player.weapon?.ammo ?? 0,
      weapon: player.weapon?.id ?? '',
      x: player.x, z: player.z, yaw: player.yaw,
    };
  }

  function readLocalSave() {
    try { return normaliseSave(localStorage.getItem(SAVE_KEY)); } catch { return null; }
  }
  function writeLocalSave(save) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); return true; } catch { return false; }
  }

  











  let accountMod = null;
  let accountTried = false;
  async function account() {
    if (accountTried) return accountMod;
    accountTried = true;
    try {
      accountMod = await import('../../../web-engine/account/account.js');
    } catch { accountMod = null; }
    return accountMod;
  }

  
  async function cloudWho() {
    try {
      const a = await account();
      if (!a || !a.accountSummary) return null;
      const sum = a.accountSummary();
      return (sum && sum.signedIn) ? (sum.name || 'your account') : null;
    } catch { return null; }
  }

  




  async function cloudPush(save) {
    try {
      const a = await account();
      if (!a) return false;
      if (typeof a.putGameSave === 'function') return !!(await a.putGameSave('farmy-evil-hills', save));
      
      
      
      if (typeof a.recordSession === 'function') {
        a.recordSession({ gameId: 'farmy-evil-hills', metrics: { deck: save.deck } });
      }
      return false;
    } catch { return false; }
  }

  async function cloudPull() {
    try {
      const a = await account();
      if (!a || typeof a.getGameSave !== 'function') return null;
      return normaliseSave(await a.getGameSave('farmy-evil-hills'));
    } catch { return null; }
  }
  
  let frameCount = 0;
  let bossHorseSpeed = 0;
  let nearLocker = null;
  let hidden = false;
  const bars = document.getElementById('bars');
  let hintShown = true;
  
  
  let lastInput = 'key';
  let lastMoved = 0;
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  let moveTrace = null;
  let lastGait = 0;
  let stepCount = 0;
  let hitCount = 0;
  let paCount = 0;
  
  
  
  
  
  
  
  
  
  function tannoy() {
    paCount += 1;
    const line = say(barks, null, { who: 'pa', force: true });
    
    
    
    
    
    
    const dur = line ? voxSheet.speak(line.id) : 0;
    if (dur > 0) {
      if (barks.current) barks.current.until = barks.t + dur + 0.4;
      barks.quietUntil = Math.max(barks.quietUntil, barks.t + dur + 0.8);
    } else {
      
      paVoice(PA_KINDS[Math.floor(Math.random() * PA_KINDS.length)]);
    }
  }
  let breathIn = 2;
  
  
  
  
  let camEye = { x: 0, y: 2.35, z: -1 };
  let camTarget = { x: 0, y: 1.15, z: 0 };
  
  
  let camVel = { x: 0, z: 0 };
  
  
  const HINT_HTML = document.getElementById('hint')?.innerHTML ?? '';
  let inSafe = false;
  let safeResupplied = false;
  
  
  
  
  
  
  
  let nearLibrary = false;
  let walkDist = 0;
  
  
  
  
  
  
  let startDist = 0;
  let startPhase = 0;
  
  
  
  
  const STEP_OFF_DIST = stepOffDist(XANDER_H);
  
  
  
  let steppedOff = false;
  let groundNow = 0;
  
  
  
  let safeIdle = 0;
  let restT = 0;
  let resting = false;
  let blown = false;
  
  
  
  let talkT = -1;
  let lastTalkKey = null;
  let fidgetT = -1;
  let fidgetWhich = 0;
  let fidgetBag = [0, 1];
  let fidgetAt = 26;
  let restNow = null;
  const REST_AFTER = 6;
  let restRigPitch = 0;
  let restRigLift = 0;
  
  
  let walkPhase = 0;
  let settle = 0;

  let fireT = 99;        
  
  
  let kickT = 99;        
  let reachT = 99;       
  let flinchT = 99;      
  
  
  
  let flinchHp = MAX_HEALTH;
  
  
  let pendingPickup = null;
  
  
  
  let wasTurnStep = false;
  
  
  let stillFor = 0;
  let glanceAt = 10 + Math.random() * 4;   
  let glanceDir = 1;
  let deathT = 0;
  let sprintNow = false;
  let level = 1;
  const mapCv = document.getElementById('map');
  
  
  
  
  const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  
  
  let access = resolveAccess(loadAccess(), { prefersReducedMotion: !!calm });
  
  
  
  let settings = resolveSettings(loadSettings());
  
  
  
  let camBack = cameraBack(settings, DOLLY.back);
  const applyAccess = () => {
    const el = document.getElementById('vox');
    
    
    if (el) el.style.setProperty('--voxScale', String(voxScale(settings, textScale(access))));
    
    
    document.body.classList.toggle('calmMotion', !!access.reducedMotion);
  };
  const applySettings = () => {
    camBack = cameraBack(settings, DOLLY.back);
    applyAccess();
  };
  applyAccess();
  const tmpV = new THREE.Vector3();
  const reticEl = document.getElementById('retic');
  const hurtEl = document.getElementById('hurt');
  const gradeEl = document.getElementById('grade');
  
  const skipEl = document.getElementById('skipBtn');

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  let intro = null;
  let introDone = false;
  let introSkip = false;
  let introStage = null;
  let introOnDone = null;
  let introCapUntil = 0;
  let introActs = null;
  let introRefs = null;
  let introBed = null;
  let introDrop = 0;
  const INTRO_SET = {
    title: { x: 0, z: -600 }, moonFarm: { x: 0, z: -600 }, call: { x: 0, z: -600 },
    ship: { x: 0, z: -600 }, transit: { x: 150, z: -600 }, crash: { x: 300, z: -600 },
    wreck: { x: 300, z: -600 },
  };
  
  
  
  
  
  function shipWalkMarks() {
    const oM = INTRO_SET.ship;
    const to = { x: oM.x - 3.2 + 1.55, z: oM.z - 2.6 };   
    const bearing = Math.atan2(to.z - (oM.z + 2.55), to.x - (oM.x + 1.25));
    return { to, from: { x: to.x - Math.cos(bearing) * 1.05, z: to.z - Math.sin(bearing) * 1.05 } };
  }
  const introSkipPress = () => {
    
    
    
    
    
    if (!intro || intro.done || intro.t <= 0.8) return;
    introSkip = true;
    
    
    
    
    if (!sfxSheet.play('skipPress', { gain: 0.8 })) sfxSheet.play('dryClick', { gain: 0.6 });
  };

  
  
  
  
  function introPaintVaried(geo, hex, amount = 0.12) {
    const nn = geo.attributes.position.count;
    const col = new Float32Array(nn * 3);
    const c = new THREE.Color(hex);
    let sd = 1234567;
    const rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
    for (let i = 0; i < nn; i += 1) {
      const k = 1 + (rnd() * 2 - 1) * amount;
      col[i * 3] = c.r * k; col[i * 3 + 1] = c.g * k; col[i * 3 + 2] = c.b * k;
    }
    geo.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(nn * 2).fill(0), 2));
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, mat);
  }

  
  
  function introPlanetTexture(w, h, painter) {
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    painter(cv.getContext('2d'), w, h);
    const tex = new THREE.CanvasTexture(cv);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return tex;
  }

  function introPaint(geo, hex) {
    const nn = geo.attributes.position.count;
    const col = new Float32Array(nn * 3);
    const c = new THREE.Color(hex);
    for (let i = 0; i < nn; i += 1) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    geo.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(nn * 2).fill(0), 2));
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, mat);
  }

  
  
  
  
  
  
  
  
  
  
  function introRocket(basic, variant = 'pad') {
    const g = new THREE.Group();
    const bits = { beacons: [], screens: [], survivor: null };
    const dead = variant === 'wreck';
    const glow = (w, h, hex) => {
      const m = basic(new THREE.Mesh(new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: hex })));
      g.add(m);
      return m;
    };

    
    const skirt = introPaintVaried(new THREE.CylinderGeometry(0.78, 1.15, 0.9, 12).toNonIndexed(), 0x33363a, 0.2);
    skirt.position.y = 0.45; g.add(skirt);
    const lower = introPaintVaried(new THREE.CylinderGeometry(0.85, 0.92, 2.2, 12).toNonIndexed(), 0xd9dde0, 0.05);
    lower.position.y = 2.0; g.add(lower);
    const stripe = introPaint(new THREE.CylinderGeometry(0.935, 0.94, 0.18, 12).toNonIndexed(), 0xb04a3a);
    stripe.position.y = 2.72; g.add(stripe);
    const collar = introPaint(new THREE.CylinderGeometry(0.87, 0.87, 0.5, 12).toNonIndexed(), 0x44484d);
    collar.position.y = 3.35; g.add(collar);
    const upper = introPaintVaried(new THREE.CylinderGeometry(0.66, 0.84, 1.9, 12).toNonIndexed(), 0xc8ccd0, 0.05);
    upper.position.y = 4.55; g.add(upper);
    const crew = introPaintVaried(new THREE.CylinderGeometry(0.52, 0.66, 0.9, 12).toNonIndexed(), 0xd9dde0, 0.05);
    crew.position.y = 5.95; g.add(crew);
    const nose = introPaint(new THREE.ConeGeometry(0.53, 1.5, 12).toNonIndexed(), 0xb04a3a);
    nose.position.y = 7.15; g.add(nose);

    
    const conduit = introPaint(new THREE.BoxGeometry(0.1, 4.4, 0.14).toNonIndexed(), 0x6f7377);
    conduit.position.set(-0.02, 3.1, -0.9); g.add(conduit);
    const mast = introPaint(new THREE.CylinderGeometry(0.022, 0.022, 1.1, 6).toNonIndexed(), 0x8a9096);
    mast.position.set(0.55, 6.9, 0.15); g.add(mast);

    
    for (let i = 0; i < 3; i += 1) {
      const a = (i / 3) * Math.PI * 2;
      const leg = introPaint(new THREE.BoxGeometry(0.14, 1.7, 0.14).toNonIndexed(), 0x565a5e);
      leg.position.set(Math.cos(a) * 1.2, 0.75, Math.sin(a) * 1.2);
      leg.rotation.z = Math.cos(a) * 0.35; leg.rotation.x = -Math.sin(a) * 0.35;
      g.add(leg);
      const fin = introPaint(new THREE.BoxGeometry(0.07, 1.9, 0.85).toNonIndexed(), 0xd9dde0);
      fin.position.set(Math.cos(a) * 1.05, 1.35, Math.sin(a) * 1.05);
      fin.rotation.y = -a;
      g.add(fin);
      const tip = introPaint(new THREE.BoxGeometry(0.075, 0.5, 0.85).toNonIndexed(), 0xb04a3a);
      tip.position.set(Math.cos(a) * 1.05, 2.55, Math.sin(a) * 1.05);
      tip.rotation.y = -a;
      g.add(tip);
    }

    
    
    
    for (const off of [-0.2, 0.2]) {
      const pane = glow(0.34, 0.42, dead ? 0x16211f : 0x6fd8e8);
      pane.position.set(off, 6.0, 0.58);
      pane.rotation.x = -0.18; pane.rotation.y = off * 0.9;
      bits.screens.push(pane);
    }
    
    
    const hatch = glow(0.55, 0.95, 0x181c1e);
    hatch.position.set(0.905, 1.75, 0); hatch.rotation.y = Math.PI / 2;
    for (const [sy, sw] of [[0.55, 0.6], [0.25, 0.75]]) {
      const stepB = introPaint(new THREE.BoxGeometry(0.3, 0.09, sw).toNonIndexed(), 0x565a5e);
      stepB.position.set(1.05, sy, 0); g.add(stepB);
    }
    
    
    const term = glow(0.22, 0.15, dead ? 0x14201c : 0x6ff0d8);
    term.position.set(0.93, 2.45, 0.42); term.rotation.y = Math.PI / 2 + 0.35;
    bits.screens.push(term);
    
    
    [0x74e08a, 0x74e08a, 0xe0b674].forEach((hex, i) => {
      const lamp2 = basic(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.07),
        new THREE.MeshBasicMaterial({ color: dead ? (i === 2 ? 0xe0b674 : 0x1c1f1c) : hex })));
      lamp2.position.set(0.9, 2.9 + i * 0.16, -0.25);
      g.add(lamp2);
      if (dead && i === 2) bits.survivor = lamp2;
    });
    
    
    for (const [bx2, by2, bz2] of [[0, 7.95, 0], [0.55, 7.5, 0.15]]) {
      const bcn = basic(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08),
        new THREE.MeshBasicMaterial({ color: dead ? 0x2a1512 : 0xff5040 })));
      bcn.position.set(bx2, by2, bz2);
      g.add(bcn);
      if (!dead) bits.beacons.push(bcn);
    }
    return { group: g, bits };
  }

  function buildIntroStage() {
    const stage = new THREE.Group();
    const basics = [];
    const basic = (m) => { basics.push(m); return m; };
    const refs = { basics };

    
    const moon = new THREE.Group();
    moon.position.set(INTRO_SET.moonFarm.x, 0, INTRO_SET.moonFarm.z);
    
    
    const ground = introPaintVaried(new THREE.CircleGeometry(50, 40).toNonIndexed(), 0xa9ac9f, 0.12);
    ground.rotation.x = -Math.PI / 2; moon.add(ground);
    for (const [cx2, cz2, cr] of [[-8, -10, 3.4], [10, -14, 5], [6, 9, 2.2], [-14, 6, 2.8]]) {
      const crater = introPaintVaried(new THREE.CircleGeometry(cr, 14).toNonIndexed(), 0x83867a, 0.1);
      crater.rotation.x = -Math.PI / 2; crater.position.set(cx2, 0.02, cz2);
      moon.add(crater);
      
      
      const rim = introPaint(new THREE.RingGeometry(cr * 0.92, cr * 1.18, 14).toNonIndexed(), 0xc2c5b6);
      rim.rotation.x = -Math.PI / 2; rim.position.set(cx2, 0.035, cz2);
      moon.add(rim);
    }
    
    
    for (const [hx, hz, hw, hh] of [[-30, -28, 22, 3.4], [8, -38, 26, 4.2], [34, -20, 18, 2.8], [-38, 8, 16, 2.4], [26, 26, 20, 3.0]]) {
      const hill = introPaintVaried(new THREE.SphereGeometry(1, 10, 6).toNonIndexed(), 0x565952, 0.1);
      hill.scale.set(hw, hh, hw * 0.5);
      hill.position.set(hx, 0, hz);
      moon.add(hill);
    }
    
    for (const [rx3, rz3, rs3] of [[-11, 2, 0.5], [7, -6, 0.7], [12, 3, 0.4], [-4, 12, 0.6], [3, -11, 0.5], [-16, -4, 0.8]]) {
      const rock = introPaintVaried(new THREE.BoxGeometry(rs3, rs3 * 0.6, rs3 * 0.8).toNonIndexed(), 0x8f9288, 0.15);
      rock.position.set(rx3, rs3 * 0.25, rz3); rock.rotation.y = rx3 * 1.3;
      moon.add(rock);
    }
    
    
    
    
    const earthTex = introPlanetTexture(64, 48, (g, w, h) => {
      g.fillStyle = '#3f6ea8'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#4e7a45';
      for (const [bx, by, bw2, bh3] of [[6, 14, 16, 10], [30, 20, 14, 12], [46, 8, 12, 8], [18, 30, 10, 8], [50, 30, 9, 9]]) {
        g.beginPath(); g.ellipse(bx, by, bw2 / 2, bh3 / 2, 0.4, 0, Math.PI * 2); g.fill();
      }
      g.fillStyle = '#e8eef2';
      g.fillRect(0, 0, w, 5); g.fillRect(0, h - 4, w, 4);
      g.globalAlpha = 0.35; g.fillStyle = '#dfe7ec';
      for (const [sx, sy] of [[10, 22], [38, 12], [26, 38], [54, 22]]) g.fillRect(sx, sy, 12, 3);
    });
    const earth = basic(new THREE.Mesh(new THREE.SphereGeometry(2.4, 14, 12),
      new THREE.MeshBasicMaterial({ map: earthTex })));
    earth.rotation.y = 2.2;
    earth.position.set(16, 15, -30); moon.add(earth);
    
    for (let i = 0; i < 4; i += 1) {
      for (let j = 0; j < 2; j += 1) {
        const post = introPaint(new THREE.BoxGeometry(0.1, 0.9, 0.1).toNonIndexed(), 0xa89a7e);
        post.position.set(1.4 + i * 1.0, 0.45, j === 0 ? 0.2 : 2.2);
        moon.add(post);
      }
    }
    for (const rz of [0.2, 2.2]) {
      const rail = introPaint(new THREE.BoxGeometry(3.2, 0.07, 0.07).toNonIndexed(), 0xa89a7e);
      rail.position.set(2.9, 0.72, rz); moon.add(rail);
    }
    const trough = introPaint(new THREE.BoxGeometry(1.2, 0.28, 0.4).toNonIndexed(), 0x8a9083);
    trough.position.set(2.6, 0.14, 1.2); moon.add(trough);
    
    const hab = introPaint(new THREE.SphereGeometry(2.4, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2).toNonIndexed(), 0xb4b8bf);
    hab.position.set(-6.5, 0, -4.5); moon.add(hab);
    
    
    const habWin = basic(new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.36),
      new THREE.MeshBasicMaterial({ color: 0xffd9a0 })));
    habWin.position.set(-5.05, 1.1, -2.9); habWin.rotation.y = 0.95;
    moon.add(habWin);
    
    const habPool = basic(new THREE.Mesh(new THREE.CircleGeometry(1.2, 12),
      new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.14 })));
    habPool.rotation.x = -Math.PI / 2; habPool.position.set(-4.5, 0.045, -2.4);
    moon.add(habPool);
    const lampPost = introPaint(new THREE.BoxGeometry(0.09, 1.9, 0.09).toNonIndexed(), 0x6f7377);
    lampPost.position.set(4.7, 0.95, 1.2); moon.add(lampPost);
    const penLamp = basic(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.2),
      new THREE.MeshBasicMaterial({ color: 0xffcf8e })));
    penLamp.position.set(4.7, 1.92, 1.2); moon.add(penLamp);
    
    const radio = introPaint(new THREE.BoxGeometry(0.3, 1.5, 0.3).toNonIndexed(), 0x4a5347);
    radio.position.set(1.6, 0.75, 3.4); moon.add(radio);
    const lampM = new THREE.MeshBasicMaterial({ color: 0x2a4a3e });
    const lamp = basic(new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), lampM));
    lamp.position.set(1.6, 1.6, 3.4); moon.add(lamp);
    refs.lamp = lamp;
    
    const radioPool = basic(new THREE.Mesh(new THREE.CircleGeometry(0.7, 12),
      new THREE.MeshBasicMaterial({ color: 0x9df5d9, transparent: true, opacity: 0.05 })));
    radioPool.rotation.x = -Math.PI / 2; radioPool.position.set(1.6, 0.05, 3.4);
    moon.add(radioPool);
    refs.radioPool = radioPool;
    
    for (const [fx2, fz2] of [[-1.3, -0.9], [-4.9, -4.4]]) {
      const pole = introPaint(new THREE.BoxGeometry(0.08, 2.6, 0.08).toNonIndexed(), 0x565a5e);
      pole.position.set(fx2, 1.3, fz2); moon.add(pole);
      const head = basic(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.14),
        new THREE.MeshBasicMaterial({ color: 0xffe9c0 })));
      head.position.set(fx2, 2.62, fz2); moon.add(head);
      const pool = basic(new THREE.Mesh(new THREE.CircleGeometry(1.0, 12),
        new THREE.MeshBasicMaterial({ color: 0xffe9c0, transparent: true, opacity: 0.12 })));
      pool.rotation.x = -Math.PI / 2; pool.position.set(fx2 - 0.5, 0.05, fz2 - 0.5);
      moon.add(pool);
    }
    
    
    
    const pad = introPaintVaried(new THREE.CircleGeometry(2.3, 18).toNonIndexed(), 0x6e716b, 0.12);
    pad.rotation.x = -Math.PI / 2; pad.position.set(-3.2, 0.025, -2.6);
    moon.add(pad);
    for (let i = 0; i < 3; i += 1) {
      const a = (i / 3) * Math.PI * 2 + 0.5;
      const clamp2 = introPaint(new THREE.BoxGeometry(0.3, 0.5, 0.5).toNonIndexed(), 0x5a5e5a);
      clamp2.position.set(-3.2 + Math.cos(a) * 1.7, 0.25, -2.6 + Math.sin(a) * 1.7);
      clamp2.rotation.y = -a;
      moon.add(clamp2);
    }
    const rocketR = introRocket(basic, 'pad');
    const rocket = rocketR.group;
    rocket.position.set(-3.2, 0, -2.6); moon.add(rocket);
    refs.rocket = rocket;
    refs.rocketBits = rocketR.bits;
    const flame = basic(new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.6, 8),
      new THREE.MeshBasicMaterial({ color: 0xffb361 })));
    flame.rotation.x = Math.PI; flame.position.set(-3.2, -0.4, -2.6);
    flame.visible = false; moon.add(flame);
    refs.flame = flame;
    const flameCore = basic(new THREE.Mesh(new THREE.ConeGeometry(0.34, 1.1, 8),
      new THREE.MeshBasicMaterial({ color: 0xfff2c8 })));
    flameCore.rotation.x = Math.PI; flameCore.position.set(-3.2, -0.3, -2.6);
    flameCore.visible = false; moon.add(flameCore);
    refs.flameCore = flameCore;
    
    
    refs.mach = [];
    for (const [my, mr, mh] of [[-0.95, 0.2, 0.5], [-1.35, 0.15, 0.4]]) {
      const md = basic(new THREE.Mesh(new THREE.ConeGeometry(mr, mh, 7),
        new THREE.MeshBasicMaterial({ color: 0x9cc8ff })));
      md.rotation.x = Math.PI; md.position.set(-3.2, my, -2.6);
      md.visible = false; moon.add(md);
      refs.mach.push(md);
    }
    
    
    const padGlow = basic(new THREE.Mesh(new THREE.CircleGeometry(2.0, 16),
      new THREE.MeshBasicMaterial({ color: 0xffc27a, transparent: true, opacity: 0 })));
    padGlow.rotation.x = -Math.PI / 2; padGlow.position.set(-3.2, 0.05, -2.6);
    moon.add(padGlow);
    refs.padGlow = padGlow;
    
    
    refs.igSmoke = [];
    for (let i = 0; i < 3; i += 1) {
      const sq = basic(new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.9),
        new THREE.MeshBasicMaterial({ color: 0xb9bcae, transparent: true, opacity: 0, depthWrite: false })));
      sq.position.set(-3.2, 0.5, -2.6);
      sq.rotation.y = 0.9;
      moon.add(sq);
      refs.igSmoke.push({ mesh: sq, dir: (i - 1) * 1.2 + 0.4, seed: i * 0.7 });
    }
    
    
    
    const dust = basic(new THREE.Mesh(new THREE.RingGeometry(0.8, 2.0, 18),
      new THREE.MeshBasicMaterial({ color: 0xcfd2c2, transparent: true, opacity: 0 })));
    dust.rotation.x = -Math.PI / 2; dust.position.set(-3.2, 0.06, -2.6);
    moon.add(dust);
    refs.dust = dust;
    stage.add(moon);
    refs.moon = moon;

    
    {
      const pts = [];
      let sd = 91;
      const rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
      
      
      
      for (let i = 0; i < 700; i += 1) {
        const a = rnd() * Math.PI * 2; const e = rnd() * Math.PI * 0.48 + 0.03;
        const r = 260;
        pts.push(150 + Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, -600 + Math.sin(a) * Math.cos(e) * r);
      }
      const sg = new THREE.BufferGeometry();
      sg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      const stars = basic(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xcfd8de, size: 0.55, sizeAttenuation: false })));
      stage.add(stars);
    }

    
    const transit = new THREE.Group();
    transit.position.set(INTRO_SET.transit.x, 0, INTRO_SET.transit.z);
    const shipR = introRocket(basic, 'transit');
    const shipSmall = shipR.group;
    refs.transitBits = shipR.bits;
    shipSmall.scale.setScalar(0.42);
    shipSmall.rotation.z = -Math.PI / 2;   
    shipSmall.position.set(6, 0.6, 0);
    transit.add(shipSmall);
    refs.shipSmall = shipSmall;
    const venusTex = introPlanetTexture(48, 32, (g, w, h) => {
      g.fillStyle = '#c8935a'; g.fillRect(0, 0, w, h);
      for (const [by, bh4, cc] of [[4, 4, '#d8a86e'], [11, 3, '#b57f47'], [17, 5, '#d3a061'], [25, 4, '#ba854e']]) {
        g.fillStyle = cc; g.fillRect(0, by, w, bh4);
      }
    });
    const venus = basic(new THREE.Mesh(new THREE.SphereGeometry(1.7, 14, 12),
      new THREE.MeshBasicMaterial({ map: venusTex })));
    venus.position.set(-11, 2.2, -7); transit.add(venus);
    
    const tFlame = basic(new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.7, 7),
      new THREE.MeshBasicMaterial({ color: 0xffc27a })));
    tFlame.rotation.z = -Math.PI / 2;
    transit.add(tFlame);
    refs.tFlame = tFlame;
    
    
    refs.streaks = [];
    {
      let sd2 = 47;
      const rnd2 = () => { sd2 = (sd2 * 16807) % 2147483647; return sd2 / 2147483647; };
      for (let i = 0; i < 12; i += 1) {
        const st2 = basic(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.02, 0.02),
          new THREE.MeshBasicMaterial({ color: 0xaebac2, transparent: true, opacity: 0.16 + rnd2() * 0.2 })));
        st2.position.set(rnd2() * 16 - 8, rnd2() * 4 - 1.2, rnd2() * -8 - 1);
        transit.add(st2);
        refs.streaks.push(st2);
      }
    }
    stage.add(transit);

    
    const venusSet = new THREE.Group();
    venusSet.position.set(INTRO_SET.crash.x, 0, INTRO_SET.crash.z);
    const vGround = introPaintVaried(new THREE.CircleGeometry(60, 36).toNonIndexed(), 0x94664f, 0.16);
    vGround.rotation.x = -Math.PI / 2; venusSet.add(vGround);
    for (const [rx, rz2, rs] of [[-4, -6, 1.1], [5, -3, 0.8], [-2, 4, 0.6], [7, 5, 1.4], [-8, 2, 0.9]]) {
      const rock = introPaint(new THREE.BoxGeometry(rs, rs * 0.7, rs * 0.9).toNonIndexed(), 0x5e3d30);
      rock.position.set(rx, rs * 0.3, rz2); rock.rotation.y = rx * 0.7;
      venusSet.add(rock);
    }
    
    refs.stationWin = [];
    for (const [bx, bw, bh] of [[-6, 8, 4], [3, 6, 6], [10, 9, 3]]) {
      const slab = introPaint(new THREE.BoxGeometry(bw, bh, 3).toNonIndexed(), 0x3a2a22);
      slab.position.set(bx, bh / 2, -34); venusSet.add(slab);
      
      
      
      for (let wi = 0; wi < 3; wi += 1) {
        const win = basic(new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.35),
          new THREE.MeshBasicMaterial({ color: 0xd8a050 })));
        win.position.set(bx - bw / 3 + wi * (bw / 3), bh * (0.35 + 0.3 * ((wi + 1) % 2)), -32.45);
        venusSet.add(win);
        refs.stationWin.push(win);
      }
    }
    
    
    
    
    const trench = introPaintVaried(new THREE.PlaneGeometry(11, 1.7).toNonIndexed(), 0x3f2a20, 0.12);
    trench.rotation.x = -Math.PI / 2; trench.rotation.z = 0.5;
    trench.position.set(4.6, 0.03, -3.2);
    venusSet.add(trench);
    const scorch = introPaintVaried(new THREE.CircleGeometry(3.1, 16).toNonIndexed(), 0x2e1d15, 0.1);
    scorch.rotation.x = -Math.PI / 2; scorch.position.set(0.9, 0.04, -1.2);
    venusSet.add(scorch);
    const wreckR = introRocket(basic, 'wreck');
    const wreck = wreckR.group;
    refs.wreckBits = wreckR.bits;
    wreck.rotation.z = 1.45; wreck.rotation.y = 0.5;
    wreck.position.set(0.6, 0.9, -1.2);
    venusSet.add(wreck);
    
    for (const [dx2, dz2, ds2, dr2] of [[3.4, -2.6, 0.5, 0.7], [5.8, -3.8, 0.4, 2.1], [2.2, -0.2, 0.3, 1.2], [7.4, -4.6, 0.55, 0.3], [1.4, -2.9, 0.35, 2.8]]) {
      const shard = introPaint(new THREE.BoxGeometry(ds2, ds2 * 0.25, ds2 * 0.7).toNonIndexed(), 0x8a9096);
      shard.position.set(dx2, ds2 * 0.12, dz2); shard.rotation.y = dr2; shard.rotation.z = 0.15;
      venusSet.add(shard);
    }
    const stuckFin = introPaint(new THREE.BoxGeometry(0.08, 1.2, 0.65).toNonIndexed(), 0xb04a3a);
    stuckFin.position.set(6.6, 0.45, -2.4); stuckFin.rotation.z = 0.35; stuckFin.rotation.y = 1.1;
    venusSet.add(stuckFin);
    
    
    
    refs.smoke = [];
    for (let i = 0; i < 2; i += 1) {
      const sm = basic(new THREE.Mesh(new THREE.PlaneGeometry(0.8 + i * 0.4, 0.9 + i * 0.4),
        new THREE.MeshBasicMaterial({ color: 0x777672, transparent: true, opacity: 0.3, depthWrite: false })));
      sm.position.set(1.5, 1.4 + i * 0.7, -0.7);
      sm.rotation.y = 0.7;
      venusSet.add(sm);
      refs.smoke.push({ mesh: sm, y0: 1.4 + i * 0.7, phase: i * 0.9 });
    }
    const ember = basic(new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3),
      new THREE.MeshBasicMaterial({ color: 0xff7a30, transparent: true, opacity: 0.5 })));
    ember.position.set(1.5, 0.55, -0.65); ember.rotation.y = 0.7;
    venusSet.add(ember);
    refs.ember = ember;
    const sparkBit = basic(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08),
      new THREE.MeshBasicMaterial({ color: 0xbfe8ff })));
    sparkBit.position.set(1.6, 1.3, -0.6); sparkBit.visible = false;
    venusSet.add(sparkBit);
    refs.sparkBit = sparkBit;
    stage.add(venusSet);

    scene.add(stage);
    return { stage, refs };
  }

  function introStatic() {
    const ctx = audio.ensure();
    if (!ctx || !audio.running) return;
    const dur = 1.1;
    const buf = ctx.createBuffer(1, Math.floor(dur * ctx.sampleRate), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i += 1) d[i] = (Math.random() * 2 - 1);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1150; bp.Q.value = 0.8;
    const g = ctx.createGain();
    const t0 = ctx.currentTime + 0.02;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(0.34, t0 + 0.09);
    g.gain.setValueAtTime(0.34, t0 + dur - 0.15);
    g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
    src.connect(bp); bp.connect(g); g.connect(audio.sfxBus);
    src.start(t0); src.stop(t0 + dur + 0.02);
  }

  
  
  
  function introHiss() {
    const ctx = audio.ensure();
    if (!ctx || !audio.running) return;
    const dur = 1.7;
    const buf = ctx.createBuffer(1, Math.floor(dur * ctx.sampleRate), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i += 1) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 720;
    const g = ctx.createGain();
    const t0 = ctx.currentTime + 0.02;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(0.42, t0 + 0.35);
    g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
    src.connect(lp); lp.connect(g); g.connect(audio.sfxBus);
    src.start(t0); src.stop(t0 + dur + 0.02);
  }

  
  
  function introBlip() {
    const ctx = audio.ensure();
    if (!ctx || !audio.running) return;
    const t0 = ctx.currentTime + 0.02;
    for (const [at, f] of [[0, 880], [0.11, 990]]) {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + at);
      g.gain.linearRampToValueAtTime(0.22, t0 + at + 0.012);
      g.gain.linearRampToValueAtTime(0.0001, t0 + at + 0.07);
      o.connect(g); g.connect(audio.sfxBus);
      o.start(t0 + at); o.stop(t0 + at + 0.09);
    }
  }

  function introCaption(text, cls, seconds) {
    const el = document.getElementById('vox');
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('pa', cls === 'pa');
    introCapUntil = intro.t + seconds;
  }

  function routeIntroCue(e) {
    if (e.kind === 'caption') introCaption(e.text, 'pa', 3.4);
    else if (e.kind === 'agency') {
      const dur = voxSheet.speak(e.voxId);
      introCaption(e.text, 'pa', (dur > 0 ? dur : 3.5) + 0.5);
    } else if (e.kind === 'xander') {
      
      
      
      const spoken = e.voxId ? voxSheet.speak(e.voxId) : 0;
      const dur = spoken > 0 ? spoken : (mumbleSay(e.text) || 2.2);
      introCaption(e.text, '', dur + 0.7);
      if (introActs) introActs.talk = 0;
    } else if (e.kind === 'sfx') {
      if (e.effect === 'static') introStatic();
      else if (e.effect === 'hiss') introHiss();
      else if (e.effect === 'blip') introBlip();
      else sfxSheet.play(e.effect, { gain: e.gain ?? 1, rate: e.rate ?? 1 });
    } else if (e.kind === 'act') {
      if (e.act === 'walk') introActs.walking = 0;
      else if (e.act === 'feed') introActs.feed = 0;
      else if (e.act === 'toRadio') introActs.toRadio = 0;
      else if (e.act === 'step') introActs.step = 0;
      else if (e.act === 'board') { introActs.walking = -1; xRig.visible = false; }
      else if (e.act === 'ignite') introActs.ignite = 0;
      else if (e.act === 'shake') introActs.shake = 1;
      else if (e.act === 'impact') {
        introActs.impact = 0.4;
        if (introBed) { introBed.stop(); introBed = null; }
      }
      else if (e.act === 'rise') introActs.rise = 0;
    } else if (e.kind === 'shotStart') {
      if (e.shotId === 'wreck') {
        
        
        
        
        const o = INTRO_SET.wreck;
        const gu0 = getUpAt(0);
        xRig.visible = true;
        xRig.position.set(o.x + 2.4, gu0.lift * XANDER_H, o.z + 1.4);
        xRig.rotation.y = 0.6;
        xRig.rotation.x = gu0.pitch;
        xander.geometry = getUpGeo[0];
      }
      if (e.shotId === 'ship') {
        
        
        
        const m = shipWalkMarks();
        xRig.visible = true;
        xRig.position.set(m.from.x, 0, m.from.z);
        xRig.rotation.y = -Math.atan2(-(m.to.x - m.from.x), m.to.z - m.from.z);
      }
      if (e.shotId === 'transit' || e.shotId === 'crash') xRig.visible = false;
      if (e.shotId === 'transit' && !introBed) {
        
        
        
        const h = sfxSheet.play('liftLoop', { loop: true, rate: 0.5, gain: 0.55 });
        if (h && h.stop) introBed = h;
      }
      if (e.shotId === 'wreck' && introBed) { introBed.stop(); introBed = null; }
    }
  }

  function beginIntro(onDone) {
    introOnDone = onDone || null;
    intro = createIntro();
    introActs = {
      walking: -1, ignite: -1, shake: 0, impact: 0, rise: -1, walkDist: 0,
      feed: -1, toRadio: -1, step: -1, talk: -1,
    };
    const built = buildIntroStage();
    introStage = built.stage;
    introRefs = built.refs;
    document.body.classList.add('introMode');
    
    
    
    
    
    
    
    
    
    gun.visible = false;
    
    const o = INTRO_SET.moonFarm;
    xRig.visible = true;
    
    
    xRig.position.set(o.x + 0.9, 0, o.z + 1.5);
    xRig.rotation.y = -Math.atan2(-(2.9 - 0.9), 1.2 - 1.5);
    
    
    for (let i = 0; i < 2 && i < birds.length; i += 1) {
      const b = birds[i];
      if (!b.mesh) continue;
      b.mesh.visible = true;
      b.mesh.position.set(o.x + 2.2 + i * 0.9, 0, o.z + 1.0 + i * 0.7);
      b.mesh.rotation.y = 1.2 + i;
    }
    window.addEventListener('keydown', introSkipPress);
    window.addEventListener('pointerdown', introSkipPress);
  }

  function endIntro() {
    window.removeEventListener('keydown', introSkipPress);
    window.removeEventListener('pointerdown', introSkipPress);
    document.body.classList.remove('introMode');
    if (introStage) {
      scene.remove(introStage);
      
      
      introStage.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
      for (const bm of introRefs.basics) { if (bm.material) bm.material.dispose(); }
    }
    introStage = null; introRefs = null; introActs = null;
    if (introBed) { introBed.stop(); introBed = null; }
    xRig.rotation.x = 0;
    xRig.position.y = 0;
    neck.position.z = neckHomeZ;
    const el = document.getElementById('vox');
    if (el) { el.textContent = ''; el.classList.remove('pa'); }
    const tEl = document.getElementById('introTitle');
    if (tEl) tEl.style.opacity = '0';
    if (skipEl) skipEl.style.display = 'none';
    xRig.visible = true;
    intro = null;
    introDone = true;
    if (introOnDone) { const fcb = introOnDone; introOnDone = null; fcb(); }
  }

  
  
  
  
  function beginEntrance(gateIdx, speciesOverride, creatureOverride) {
    const gm = gateMeshes[gateIdx];
    if (!gm || gm.opened) return false;
    
    
    
    
    
    
    
    const kind = speciesOverride || (gm.gate.kind === 'duct' ? 'chicken' : 'porker');
    const inWall = emergeAt(gm.gate, 0);
    const b = addChicken(inWall.z, inWall.x, kind);
    if (!b) return false;
    
    
    
    
    
    if (creatureOverride) b.creature = creatureOverride;
    b.homeX = gm.gate.x + gm.gate.nx * 2; b.homeZ = gm.gate.z + gm.gate.nz * 2;
    b.mesh.visible = false;   
    if (b.shade) b.shade.visible = false;
    b.entering = true;
    entrances.push({ e: createEntrance(gm.gate.kind), gm, b, telegraphSfxT: 0 });
    return true;
  }

  
  
  
  
  
  
  function onShotWorld(from, dir, at) { return shootHazards(ctx, from, dir, at); }

  function throwDebris(x, z, nx, nz, n = 6) {
    let thrown = 0;
    for (const d of debrisPool) {
      if (d.live || thrown >= n) continue;
      d.live = true;
      d.mesh.visible = true;
      d.settled = false;
      d.mesh.position.set(x + nx * 0.2, 0.5 + Math.random() * 0.8, z + nz * 0.2);
      if (d.dust) {
        d.mesh.material.opacity = 0.35;
        d.vy = 0.3 + Math.random() * 0.3;
        d.vx = nx * 0.3; d.vz = nz * 0.3;
      } else {
        d.vx = nx * (1 + Math.random() * 2) + (Math.random() - 0.5);
        d.vz = nz * (1 + Math.random() * 2) + (Math.random() - 0.5);
        d.vy = 1 + Math.random() * 2;
      }
      thrown += 1;
    }
  }

  function runIntroFrame(now, dt) {
    
    
    
    
    
    
    introDrop = 0;
    const pressed = introSkip; introSkip = false;
    const r = stepIntro(intro, dt, pressed);
    intro = r.state;
    for (const e of r.events) routeIntroCue(e);
    if (intro.done) { endIntro(); return; }
    
    
    
    if (skipEl) skipEl.style.display = intro.t > 0.8 ? 'block' : 'none';

    const shotId = INTRO_SHOTS[intro.shot].id;
    const o = INTRO_SET[shotId];
    const cam = introCam(intro);
    let ex = o.x + cam.eye[0]; let ey = cam.eye[1]; let ez = o.z + cam.eye[2];
    const lx = o.x + cam.look[0]; const ly = cam.look[1]; const lz = o.z + cam.look[2];
    if (introActs.shake > 0) {
      introActs.shake = Math.max(0, introActs.shake - dt * 0.5);
      const sh = introActs.shake * 0.25;
      ex += (Math.random() * 2 - 1) * sh; ey += (Math.random() * 2 - 1) * sh; ez += (Math.random() * 2 - 1) * sh;
    }
    camera.position.set(ex, ey, ez);
    camera.lookAt(lx, ly, lz);
    camera.fov = cam.fov;
    camera.updateProjectionMatrix();
    audio.listen(lx, lz, { x: ex, y: ey, z: ez }, { x: lx, y: ly, z: lz });

    
    
    {
      const cad = (now % 1.2) < 0.13;
      const bitSet = shotId === 'transit' ? introRefs.transitBits : introRefs.rocketBits;
      if (bitSet) for (const bc of bitSet.beacons) bc.visible = cad;
      if (shotId === 'wreck' && introRefs.wreckBits && introRefs.wreckBits.survivor) {
        
        introRefs.wreckBits.survivor.visible = (now % 1.7) < 0.3;
      }
    }
    if (shotId === 'moonFarm' || shotId === 'call' || shotId === 'ship') {
      
      for (let i = 0; i < 2 && i < birds.length; i += 1) {
        const m = birds[i].mesh;
        if (m) m.rotation.x = Math.abs(Math.sin(now * 2.1 + i * 1.7)) * 0.28;
      }
    }
    if (shotId === 'moonFarm' || shotId === 'call') {
      
      
      let gestured = false;
      if (introActs.feed >= 0) {
        introActs.feed += dt;
        const FT = 1.6;
        if (introActs.feed < FT) {
          const fr2 = Math.min(FEED_FRAMES - 1, Math.floor((introActs.feed / FT) * FEED_FRAMES));
          if (xander.geometry !== feedGeo[fr2]) xander.geometry = feedGeo[fr2];
          introDrop = feedDrop[fr2];
          gestured = true;
        } else introActs.feed = -1;
      }
      
      
      
      if (!gestured && introActs.toRadio >= 0) {
        const o2 = INTRO_SET.call;
        const from2 = { x: o2.x + 0.9, z: o2.z + 1.5 };
        const to2 = { x: o2.x + 1.25, z: o2.z + 2.55 };
        const total2 = Math.hypot(to2.x - from2.x, to2.z - from2.z);
        introActs.toRadio = Math.min(1, introActs.toRadio + (dt * 0.85) / total2);
        const k2 = introActs.toRadio;
        xRig.position.set(from2.x + (to2.x - from2.x) * k2, 0, from2.z + (to2.z - from2.z) * k2);
        if (k2 < 1) {
          introActs.walkDist += dt * 0.85;
          const wf2 = Math.floor(((introActs.walkDist / STRIDE) % 1) * WALK_FRAMES) % WALK_FRAMES;
          if (xander.geometry !== walkGeo[wf2]) xander.geometry = walkGeo[wf2];
          introDrop = walkPose(wf2 / WALK_FRAMES, 'walk').drop || 0;
          xRig.rotation.y = -Math.atan2(-(to2.x - from2.x), to2.z - from2.z);
          gestured = true;
        } else {
          
          xRig.rotation.y = -Math.atan2(-(1.6 - 1.25), 3.4 - 2.55);
          introActs.toRadio = -1;
        }
      }
      
      
      if (!gestured && introActs.talk >= 0) {
        introActs.talk += dt;
        const TT = 1.5;
        if (introActs.talk < TT) {
          const k3 = Math.sin(Math.PI * (introActs.talk / TT));
          const tf = Math.round(k3 * (TALK_FRAMES - 1));
          if (xander.geometry !== talkGeo[tf]) xander.geometry = talkGeo[tf];
          gestured = true;
        } else introActs.talk = -1;
      }
      if (!gestured) {
        const span = IDLE_FRAMES * 2 - 2;
        const k = Math.floor((now / IDLE_TIME) * span) % span;
        const fi = k < IDLE_FRAMES ? k : span - k;
        if (xander.geometry !== idleGeo[fi]) xander.geometry = idleGeo[fi];
      }
    }
    if (shotId === 'call' && introRefs.lamp) {
      const ringing = Math.sin(now * 9) > 0;
      introRefs.lamp.material.color.setHex(ringing ? 0x9df5d9 : 0x2a4a3e);
      
      if (introRefs.radioPool) introRefs.radioPool.material.opacity = ringing ? 0.2 : 0.05;
    }
    if (shotId === 'ship') {
      if (introActs.walking >= 0) {
        
        
        const { from, to } = shipWalkMarks();
        const total = Math.hypot(to.x - from.x, to.z - from.z);
        introActs.walking = Math.min(1, introActs.walking + (dt * 1.25) / total);
        const wk = introActs.walking;
        xRig.position.set(from.x + (to.x - from.x) * wk, 0, from.z + (to.z - from.z) * wk);
        xRig.rotation.y = -Math.atan2(-(to.x - from.x), to.z - from.z);
        introActs.walkDist += dt * 1.25;
        const wf = Math.floor(((introActs.walkDist / STRIDE) % 1) * WALK_FRAMES) % WALK_FRAMES;
        if (xander.geometry !== walkGeo[wf]) xander.geometry = walkGeo[wf];
        introDrop = walkPose(wf / WALK_FRAMES, 'walk').drop || 0;
      }
      if (introActs.ignite >= 0 && introRefs.flame && introRefs.rocket) {
        introActs.ignite += dt;
        const fl = introRefs.flame;
        fl.visible = true;
        fl.scale.set(1, 0.8 + Math.random() * 0.6, 1);
        const core = introRefs.flameCore;
        if (core) { core.visible = true; core.scale.set(1, 0.7 + Math.random() * 0.7, 1); }
        if (introActs.ignite > 1.1) {
          const risen = (introActs.ignite - 1.1);
          introRefs.rocket.position.y = risen * risen * 2.2;
          fl.position.y = -0.4 + introRefs.rocket.position.y;
          if (core) core.position.y = -0.3 + introRefs.rocket.position.y;
        }
        for (const md of introRefs.mach || []) {
          md.visible = introActs.ignite > 0.25;
          md.scale.set(1, 0.7 + Math.random() * 0.6, 1);
          md.position.y = md.userData.baseY ?? (md.userData.baseY = md.position.y);
          md.position.y = md.userData.baseY + (introRefs.rocket ? introRefs.rocket.position.y : 0);
        }
        if (introRefs.padGlow) {
          
          const clear2 = Math.max(0, 1 - (introRefs.rocket ? introRefs.rocket.position.y : 0) / 4);
          introRefs.padGlow.material.opacity = clear2 * (0.3 + Math.random() * 0.25);
        }
        for (const sq of introRefs.igSmoke || []) {
          const tIg = introActs.ignite - sq.seed * 0.3;
          if (tIg > 0 && tIg < 3.2) {
            const kIg = tIg / 3.2;
            sq.mesh.material.opacity = 0.4 * (1 - kIg);
            sq.mesh.position.set(-3.2 + INTRO_SET.ship.x + Math.cos(sq.dir) * (0.8 + kIg * 3.2),
              0.4 + kIg * 0.9, -2.6 + INTRO_SET.ship.z + Math.sin(sq.dir) * (0.8 + kIg * 3.2));
            sq.mesh.scale.setScalar(0.7 + kIg * 2.2);
          } else sq.mesh.material.opacity = 0;
        }
        if (introRefs.dust) {
          
          
          const du = Math.min(1, introActs.ignite / 2.8);
          introRefs.dust.scale.setScalar(0.6 + du * 3.2);
          introRefs.dust.material.opacity = Math.max(0, 0.65 * (1 - du * du));
        }
      }
    }
    if (shotId === 'transit' && introRefs.streaks) {
      for (const st2 of introRefs.streaks) {
        st2.position.x += dt * 7.5;
        if (st2.position.x > 9) st2.position.x = -9;
      }
    }
    if (shotId === 'transit' && introRefs.shipSmall) {
      const sh2 = introRefs.shipSmall;
      sh2.position.x -= dt * 1.05;
      sh2.position.y = 0.6 + Math.sin(now * 0.8) * 0.1;
      sh2.rotation.z = -Math.PI / 2 + Math.sin(now * 1.3) * 0.035;
      if (introRefs.tFlame) {
        introRefs.tFlame.position.set(sh2.position.x + 1.35, sh2.position.y, sh2.position.z);
        introRefs.tFlame.scale.set(1, 0.7 + Math.random() * 0.7, 1);
        introRefs.tFlame.visible = Math.random() > 0.08;
      }
    }
    if (shotId === 'wreck') {
      if (introRefs.sparkBit) introRefs.sparkBit.visible = Math.random() < 0.09;
      
      if (introRefs.smoke) {
        for (const sm of introRefs.smoke) {
          const m2 = sm.mesh;
          m2.position.y += dt * 0.42;
          const life = (m2.position.y - sm.y0) / 1.7;
          m2.material.opacity = Math.max(0, 0.32 * (1 - life));
          if (life >= 1) m2.position.y = sm.y0;
        }
      }
      if (introRefs.ember) {
        introRefs.ember.material.opacity = 0.3 + Math.abs(Math.sin(now * 5.2 + Math.sin(now * 2.1))) * 0.35;
      }
      
      
      if (introActs.step >= 0 && introActs.rise >= 3.4) {
        introActs.step += dt;
        const ST2 = 0.9;
        if (introActs.step < ST2) {
          const sf2 = Math.floor((introActs.step / ST2) * SHUFFLE_FRAMES) % SHUFFLE_FRAMES;
          if (xander.geometry !== shuffleGeo[sf2]) xander.geometry = shuffleGeo[sf2];
          xRig.position.x -= dt * 0.22;
        } else introActs.step = -1;
      }
      if (introActs.rise >= 0) {
        introActs.rise += dt;
        
        
        
        
        const RISE_T = 4.6;
        if (introActs.rise < RISE_T) {
          const u = introActs.rise / RISE_T;
          const gu = getUpAt(u);
          const fd = Math.min(GETUP_FRAMES - 1, Math.floor(u * GETUP_FRAMES));
          if (xander.geometry !== getUpGeo[fd]) xander.geometry = getUpGeo[fd];
          xRig.rotation.x = gu.pitch;
          xRig.position.y = gu.lift * XANDER_H;
        } else if (!(introActs.step >= 0 && introActs.step < 0.9)) {
          xRig.rotation.x = 0;
          xRig.position.y = 0;
          const span = IDLE_FRAMES * 2 - 2;
          const k = Math.floor((now / IDLE_TIME) * span) % span;
          const fi = k < IDLE_FRAMES ? k : span - k;
          if (xander.geometry !== idleGeo[fi]) xander.geometry = idleGeo[fi];
        }
      }
    }

    
    
    
    {
      const el = document.getElementById('introTitle');
      if (el) {
        if (shotId === 'title') {
          const tt = intro.tShot;
          const shotDur = INTRO_SHOTS[intro.shot].dur;
          const inK = Math.min(1, Math.max(0, (tt - 0.3) / 0.9));
          const outK = Math.min(1, Math.max(0, (shotDur - tt) / 1.1));
          const flick = 0.86 + Math.sin(now * 13.7) * 0.07 + Math.sin(now * 3.4) * 0.07;
          el.style.opacity = (Math.min(inK, outK) * flick).toFixed(3);
        } else if (el.style.opacity !== '0') el.style.opacity = '0';
      }
    }

    
    neck.position.z = neckHomeZ - introDrop * XANDER_H;

    
    if (intro.t > introCapUntil) {
      const el = document.getElementById('vox');
      if (el && el.textContent) { el.textContent = ''; el.classList.remove('pa'); }
    }
    const f = introFade(intro);
    if (shotId === 'crash' && introActs.impact <= 0) {
      
      
      const pulse = 0.10 + Math.abs(Math.sin(now * 6.3)) * 0.14;
      gradeEl.style.background = `rgba(150,20,10,${Math.max(pulse, f * 0.9).toFixed(3)})`;
      renderer.render(scene, camera);
      return;
    }
    if (introActs.impact > 0) {
      introActs.impact = Math.max(0, introActs.impact - dt);
      gradeEl.style.background = `rgba(255,244,230,${(introActs.impact / 0.4) * 0.95})`;
    } else {
      gradeEl.style.background = `rgba(0,0,0,${Math.max(0.2, f).toFixed(3)})`;
    }
    renderer.render(scene, camera);
  }

  
  
  
  function creatureDeath(b, bh, fallSide) {
    const voice = b.kind === 'chicken' ? chickVoice : porkVoice;
    voice(b, 'die', Math.hypot(player.x - b.x, player.z - b.z));
    b.alive = false;
    b.dying = 0;
    if (decals) decals.put(b.x, b.z, bh * 1.5, 0.9);
    b.fallSide = fallSide;
    
    
    
    if (b.latched) {
      const held = coopNet && b.latchTo && coopNet.partnerId() === b.latchTo;
      if (held) coopNet.free(b.latchTo, birds.indexOf(b));
      else {
        player.latchedBy = null; player.struggle = null; endGrapple(player.vitals);
        if (coopNet && coopNet.active && !coopNet.guest && b.latchTo) coopNet.free(b.latchTo, birds.indexOf(b));
      }
    }
    b.latched = false;
    b.latchTo = null;
    combatSay(barks, 'kill');
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  function maybeBleedOut(b, bh, fallSide) {
    
    
    
    
    
    
    if (b.anim && b.anim.dying) return;
    const st = statusOf(b.creature);
    const loco = b.creature ? locomotion(b.kind, mobilityOf(b.creature)) : null;
    if (st.causeOfDeath !== 'limbs' || !loco || !(loco.bleedOut > 0)) {
      creatureDeath(b, bh, fallSide);
      return;
    }
    b.anim = startBleedOut(b.anim, loco);
    b.fallSide = fallSide;
    b.bleedBh = bh;
    if (b.latched) {
      b.latched = false;
      player.latchedBy = null;
      player.struggle = null;
      endGrapple(player.vitals);
    }
    creatureStats.crawlers += 1;
    (b.kind === 'chicken' ? chickVoice : porkVoice)(b, 'hurt', Math.hypot(player.x - b.x, player.z - b.z));
  }

  
  
  
  
  
  
  function nearestPartner(self) {
    let best = null; let bd = Infinity;
    for (const q of birds) {
      if (q === self || !q.alive || q.entering || q.apparition || q.latched) continue;
      if (q.kind === 'horse' || q.retreat || !q.anim || q.anim.state === 'dormant') continue;
      const d = Math.hypot(q.x - player.x, q.z - player.z);
      if (d < bd) { bd = d; best = q; }
    }
    return best;
  }

  function step(nowMs) {
    const now = nowMs / 1000;
    const wallDt = Math.min(0.05, last ? now - last : 0.016);
    last = now;
    
    
    
    
    
    
    
    if (hitStopT > 0) hitStopT -= wallDt;
    
    const dt = menuUp ? 0 : (hitStopT > 0 ? wallDt * HIT_STOP_SLOW : wallDt);

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    stepTwoBody(dt);
    if (coopNet) coopNet.step(dt, nowMs);
    
    
    
    
    {
      const pb = coopNet && coopNet.active ? coopNet.partnerBody() : null;
      partnerBody.visible = !!pb;
      if (pb) {
        partnerBody.position.set(pb.x, 0, pb.z);
        
        
        partnerBody.rotation.y = -(pb.yaw || 0);
      }
    }

    
    
    
    
    
    if (paused) {
      
      
      
      
      
      
      
      
      
      requestAnimationFrame(step);
      return;
    }

    
    if (intro && !intro.done) {
      
      
      setLookMode('intro');
      scene.fog = null;
      runIntroFrame(now, dt);
      requestAnimationFrame(step);
      return;
    }
    
    
    if (setLookMode('game') || scene.fog !== gameFog) scene.fog = gameFog;

    
    
    
    if (coopDownT > 0) coopDownT = Math.max(0, coopDownT - dt);

    
    
    
    
    
    
    
    
    const watching = !!(coopNet && coopNet.watching);
    if (watching) { player.vitals.health = MAX_HEALTH; player.struggle = null; player.latchedBy = null; }

    lastMoved = 0;
    groundNow = 0;
    camVel = { x: 0, z: 0 };
    if (!player.dead && !hidden && coopDownT <= 0 && !watching) {
      
      
      
      
      const sprint = keys.has('ShiftLeft') || keys.has('ShiftRight') || (touch.active && touch.fwd > 0.75);
      sprintNow = sprint;
      let fwd = 0;
      if (keys.has('KeyW') || keys.has('ArrowUp')) fwd += 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) fwd -= 1;
      let strafe = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) strafe -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) strafe += 1;
      if (touch.active) { fwd = touch.fwd; strafe = touch.turn; }
      
      if (player.struggle) strafe = 0;

      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      const basis = moveBasis(camEye, camTarget);
      const mv = moveVector(basis, fwd, strafe);
      const pressing = mv.mag > 0;

      const slow = (player.latchedBy ? (1 - CHICKEN_LATCH_SLOW) : 1)
        * (isDanger(player.vitals.health, MAX_HEALTH) ? INJURY.dangerMoveScale
          : (isInjured(player.vitals.health, MAX_HEALTH) ? INJURY.moveScale : 1));
      
      
      
      
      
      
      
      
      
      const speed = ((player.struggle || reachT < REACH_TIME || player.staggerT > 0) ? 0 : (sprint ? 5.5 : 2.4)) * slow;
      
      
      
      
      
      
      
      
      
      let dx = 0; let dz = 0;
      if (pressing) {
        
        
        
        dx = mv.dx; dz = mv.dz;
        
        
        
        
        
        
        player.yaw = turnToward(player.yaw, yawFor(dx, dz), MOVE.turnRate, dt);
      }
      
      
      
      
      
      
      
      
      
      const beforeX = player.x; const beforeZ = player.z;
      let moved = moveInLevel(deck, player, dx * speed * dt, dz * speed * dt, 0.4, solidProps);
      
      
      
      
      
      moved = pushOutOfPillars(arenaPillars, moved, 0.42);
      lastMoved = Math.hypot(moved.x - player.x, moved.z - player.z);
      
      
      
      camVel = dt > 0 ? { x: (moved.x - player.x) / dt, z: (moved.z - player.z) / dt } : { x: 0, z: 0 };
      player.x = moved.x;
      player.z = moved.z;
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      groundNow = lastMoved;
      walkDist += groundNow;
      startDist += groundNow;
      
      
      
      moveTrace = {
        fwd: +fwd.toFixed(3), strafe: +strafe.toFixed(3), mag: +mv.mag.toFixed(3),
        wantX: +(dx * speed * dt).toFixed(4), wantZ: +(dz * speed * dt).toFixed(4),
        gotX: +(player.x - beforeX).toFixed(4), gotZ: +(player.z - beforeZ).toFixed(4),
        moved: +lastMoved.toFixed(4), speed: +speed.toFixed(3), slow: +slow.toFixed(3),
        reachT: +reachT.toFixed(2), staggerT: +(player.staggerT || 0).toFixed(2),
        struggle: !!player.struggle, latched: !!player.latchedBy,
        basis: { fx: +basis.fx.toFixed(3), fz: +basis.fz.toFixed(3) },
        keys: [...keys].filter((k) => /^(Key[WASD]|Arrow)/.test(k)),
      };

      const mode = player.struggle ? 'walk' : (sprint && pressing ? 'sprint' : 'walk');
      tickVitals(player.vitals, dt, mode, INJURY.enemyDamageScale);
    }

    
    
    
    
    
    
    
    
    
    
    
    if (entrances.length) {
      entrances = entrances.filter((en) => {
        const was2 = en.e.phase;
        en.e = stepEntrance(en.e, dt);
        const g = en.gm.gate;
        if (en.e.phase === 'telegraph') {
          en.telegraphSfxT -= dt;
          if (en.telegraphSfxT <= 0) {
            en.telegraphSfxT = g.kind === 'breach' ? 0.9 : 0.45;
            sfxSheet.play(g.kind === 'duct' ? 'ductRattle' : (g.kind === 'breach' ? 'wallThud' : 'debrisFall'),
              { dest: audio.at(g.x, g.z) || undefined, gain: 0.9 });
          }
          
          
          const sh3 = Math.sin(now * 43) * 0.012 * en.e.k;
          if (en.gm.grille) en.gm.grille.position.x = sh3;
          if (en.gm.cracks) en.gm.cracks.position.x = sh3 * 0.6;
          if (en.gm.tile) {
            en.gm.tile.position.y = -0.03 - en.e.k * 0.08;
            en.gm.tile.rotation.x = 0.04 + en.e.k * 0.10;
            if (Math.random() < 0.25 * en.e.k) throwDebris(g.x, g.z, 0, 0, 1);
          }
        }
        if (en.e.event === 'burst') {
          en.gm.opened = true;
          sfxSheet.play('breach', { dest: audio.at(g.x, g.z) || undefined, gain: 1.0 });
          sfxSheet.play('debrisFall', { dest: audio.at(g.x, g.z) || undefined, gain: 0.7, when: 0.12 });
          throwDebris(g.x, g.z, g.nx, g.nz, g.kind === 'breach' ? 8 : 5);
          shake = Math.max(shake, g.kind === 'breach' ? 0.5 : 0.3);
          if (en.gm.grille) {
            
            en.gm.grille.userData.fly = { vx: g.nx * 3, vz: g.nz * 3, vy: 2.2 };
          }
          if (en.gm.cracks && en.gm.group) {
            
            en.gm.cracks.visible = false;
            const hole2 = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.6),
              new THREE.MeshBasicMaterial({ color: 0x050807 }));
            hole2.position.set(0, 0.95, 0.065);
            en.gm.group.add(hole2);
          }
          if (en.gm.tile) {
            
            en.gm.tile.userData.fall = { vy: -0.5, spin: 6 };
            const chole = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3),
              new THREE.MeshBasicMaterial({ color: 0x050807 }));
            chole.rotation.x = Math.PI / 2; chole.position.set(g.x, HALL_H - 0.01, g.z);
            deckGroup.add(chole);
          }
          en.b.mesh.visible = true;
          if (en.b.shade) en.b.shade.visible = true;
        }
        if (en.e.phase === 'emerge' || en.e.event === 'emerged') {
          const p2 = emergeAt(g, en.e.phase === 'emerge' ? en.e.k : 1);
          en.b.x = p2.x; en.b.z = p2.z;
          if (en.b.mesh) en.b.mesh.position.set(en.b.x, g.kind === 'drop' ? emergeY(en.e.k) : 0, en.b.z);
        }
        if (en.e.event === 'emerged') {
          en.b.entering = false;
          return false;   
        }
        en.b.entering = isProtectedPhase(en.e);
        return true;
      });
    }
    
    for (const gm of gateMeshes) {
      const tf = gm.tile && gm.tile.userData.fall;
      if (tf) {
        gm.tile.position.y += tf.vy * dt;
        gm.tile.rotation.z += tf.spin * dt;
        tf.vy -= dt * 9;
        if (gm.group.position.y + gm.tile.position.y < 0.06) {
          gm.tile.userData.fall = null;   
        }
      }
      const fly = gm.grille && gm.grille.userData.fly;
      if (fly) {
        gm.grille.position.x += fly.vx * dt * 0.2;
        gm.grille.position.y += fly.vy * dt;
        gm.grille.position.z += fly.vz * dt * 0.2;
        gm.grille.rotation.x += dt * 6;
        fly.vy -= dt * 9;
        if (gm.grille.position.y < -0.9) {
          gm.grille.position.y = -0.9;
          gm.grille.userData.fly = null;   
        }
      }
    }
    for (const d of debrisPool) {
      if (!d.live || d.settled) continue;
      d.mesh.position.x += d.vx * dt;
      d.mesh.position.y += d.vy * dt;
      d.mesh.position.z += d.vz * dt;
      if (d.dust) {
        d.mesh.material.opacity = Math.max(0, d.mesh.material.opacity - dt * 0.25);
        if (d.mesh.material.opacity <= 0) { d.live = false; d.mesh.visible = false; }
      } else {
        d.vy -= dt * 9;
        if (d.mesh.position.y <= 0.03) {
          d.mesh.position.y = 0.03;
          d.settled = true;   
        }
      }
    }

    
    
    
    
    
    
    
    
    if (director && !player.dead && deck && deck.exit && !(coopNet && coopNet.guest)) {
      const progress = Math.min(1, Math.hypot(player.x - deck.start.x, player.z - deck.start.z)
        / (Math.hypot(deck.exit.x - deck.start.x, deck.exit.z - deck.start.z) || 1));
      lastRouteProgress = progress;
      const gctx = gateMeshes.map((m) => ({
        
        
        kind: m.gate.kind, opened: !!m.opened || !!m.gate.scripted,
        dist: Math.hypot(m.gate.x - player.x, m.gate.z - player.z),
      }));
      const r = stepDirector(director, dt, {
        progress, gates: gctx,
        inStruggle: !!player.struggle,
        healthFrac: player.vitals.health / MAX_HEALTH,
      });
      director = r.d;
      
      
      
      
      
      if (r.fire >= 0) {
        if (r.reissue) creatureStats.reissues += 1;
        beginEntrance(r.fire, r.reissue ? r.reissue.species : undefined,
          r.reissue ? r.reissue.creature : undefined);
      }
    }
    
    
    
    
    
    
    openingCooldown = Math.max(0, openingCooldown - dt);
    if (openingPending.length && !player.dead && openingCooldown <= 0) {
      
      
      
      
      
      
      
      
      
      
      const atLift = liftCar && Math.hypot(player.x - liftCar.x, player.z - liftCar.z) < 7;
      const idx = (inSafe || atLift || player.struggle) ? -1 : openingPending.findIndex((op) => {
        const gm = gateMeshes[op.gi];
        if (!gm || gm.opened) return false;
        
        
        
        
        
        if (op.notBefore && progressAt(deck, player.x, player.z) < op.notBefore) return false;
        const d2 = Math.hypot(gm.gate.x - player.x, gm.gate.z - player.z);
        return d2 < OPENING_FIRE.max && d2 > OPENING_FIRE.min;
      });
      if (idx >= 0 && entrances.length < 2) {
        beginEntrance(openingPending[idx].gi, openingPending[idx].species);
        openingPending.splice(idx, 1);
        openingCooldown = 5;
      }
    }
    openingPending = openingPending.filter((op) => {
      const gm = gateMeshes[op.gi];
      return gm && !gm.opened;
    });

    
    
    
    
    
    
    
    {
      const cbT = currentBark(barks);
      const keyT = cbT && cbT.who === 'xander' ? cbT.text : null;
      if (keyT !== lastTalkKey) {
        lastTalkKey = keyT;
        if (keyT) talkT = 0;
      }
      if (talkT >= 0) {
        talkT += dt;
        if (talkT > TALK_TIME) talkT = -1;
      }
    }

    
    
    
    const injuredNow = !player.dead && isInjured(player.vitals.health, MAX_HEALTH);
    const dangerNow = !player.dead && isDanger(player.vitals.health, MAX_HEALTH);
    
    
    
    
    
    if (stumbleT >= 0) {
      stumbleT += dt;
      if (stumbleT >= INJURY.stumbleTime) stumbleT = -1;
    }
    if (dangerNow) {
      walkedTotal += lastMoved;
      if (walkedTotal >= stumbleAt && stumbleT < 0) {
        stumbleT = 0;
        stumbleAt = nextStumbleAt(walkedTotal);
      }
    } else {
      
      
      walkedTotal = 0;
      stumbleAt = nextStumbleAt(0);
    }
    const wall = injuredNow && deck ? wallSupport(deck, player.x, player.z) : null;
    const wallTouch = !!wall && wall.dist <= INJURY.touchReach;
    const wallLeanClose = !!wall && wall.dist <= INJURY.leanReach;
    {
      
      
      
      const fx2 = -Math.sin(player.yaw);
      const fz2 = Math.cos(player.yaw);
      const side2 = wall ? (Math.sign(wall.dx * fz2 - wall.dz * fx2) || 1) : 0;
      const rollTarget = (injuredNow && (wallTouch || wallLeanClose)) ? side2 * 0.085 : 0;
      wallRoll += (rollTarget - wallRoll) * Math.min(1, dt * 6);
      injuryDbg = {
        injured: injuredNow,
        wall: wall ? { dist: +wall.dist.toFixed(2), side: side2 } : null,
        touch: wallTouch, leanClose: wallLeanClose,
      };
    }

    
    
    
    
    
    
    
    const bearingTo = (b) => {
      const off = Math.atan2(-(b.x - player.x), b.z - player.z) - player.yaw;
      return Math.atan2(Math.sin(off), Math.cos(off));
    };
    const range = player.weapon.spec?.range ?? 18;
    if (player.dead || player.struggle) target = null;
    if (target && (!target.alive
      || releases(Math.hypot(target.x - player.x, target.z - player.z), bearingTo(target), range))) {
      target = null;
    }
    if (!target && !player.dead && !player.struggle) {
      let best = Infinity;
      for (const b of birds) {
        if (!b.alive || b.kind === 'horse') continue;
        const d = Math.hypot(b.x - player.x, b.z - player.z);
        if (d > best || !acquires(d, bearingTo(b), range)) continue;
        best = d; target = b;
      }
    }
    
    aimLatch = stepAimLatch(aimLatch, dt, !player.dead && !!target);

    
    fireT += dt;
    kickT += dt;
    reachT += dt;
    flinchT += dt;
    
    
    tickWeapon(player.weapon, wallDt);
    aimLowNow = aimLow || aimLowToggle || keys.has('ControlLeft') || keys.has('KeyQ');
    
    
    
    
    const trigFree = (!player.struggle || player.weapon.spec?.breaksGrapple) && !player.dead && !hidden;
    
    
    if (!trigFree) dropClicks(trigger);
    const mayFire = trigFree && (fireHeld || trigger.clicks > 0);
    
    
    
    if (mayFire && !canFire(player.weapon) && player.weapon.ammo <= 0) {
      if (fireT > 1 / (player.weapon.spec?.fireRate ?? 1.6)) { dryClickSfx(); fireT = 0; }
    }
    
    
    const feelNow = feelOf(player.weapon.id);
    if (fireHeld && trigFree && feelNow.rumble > 0 && player.weapon.ammo > 0) {
      shake = Math.max(shake, feelNow.rumble * 0.22);
    }
    
    
    
    
    const pull = trigFree ? stepTrigger(trigger, player.weapon, wallDt) : { fire: false, click: false };
    if (pull.fire) {
      fire(player.weapon, { click: pull.click });
      
      
      
      
      
      
      
      if (coopNet && coopNet.active) {
        coopNet.reportShot({ from: [player.x, player.z], yaw: player.yaw, wid: player.weapon.id });
      }
      fireStats.shots += 1;
      if (pull.click) fireStats.clickShots += 1; else fireStats.holdShots += 1;
      if (player.struggle && player.weapon.spec?.breaksGrapple) {
        
        
        const gb = player.latchedBy;
        if (gb) {
          gb.latched = false;
          gb.kick = 0.6;
          gb.stagger = Math.max(gb.stagger || 0, 0.9);
        }
        player.latchedBy = null;
        player.struggle = null;
        endGrapple(player.vitals);
      }
      
      
      
      shotEnd = null;
      
      
      
      shotSfx();
      shotFlash = 0.06;
      lastFlashAt = now;
      fireT = 0;
      
      
      
      say(barks, 'firstShot');

      
      
      
      
      
      
      
      
      if (isBoss && fight && fight.boulder === 'hung') {
        const b0 = deck.boulder;
        const near = Math.hypot(player.x - b0.x, player.z - b0.z) < 9;
        const bearing = Math.atan2(-(b0.x - player.x), b0.z - player.z);
        let off = bearing - player.yaw;
        off = Math.atan2(Math.sin(off), Math.cos(off));
        if (near && Math.abs(off) < 0.5) {
          fight = cutCable(fight);
          liftChime();
        }
      }
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      const lowNow = aimLowNow;
      const muzzleY = lowNow ? 0.62 : 1.30;
      
      
      
      
      const SHOT_OVERSHOOT = 1.8;
      const aimDrop = lowNow ? 1.0 : 0.30;
      let lastAimYaw = player.yaw;
      
      
      
      
      
      let targetsLeft = player.weapon.spec?.targets ?? 1;
      let aimNoted = false;
      
      
      
      
      
      
      const shotOrder = (coopNet && coopNet.guest) ? [] : [...birds].sort((p, q) => (
        Math.hypot(player.x - p.x, player.z - p.z) - Math.hypot(player.x - q.x, player.z - q.z)));
      for (const b of shotOrder) {
        
        
        
        if (!b.alive || !b.creature) continue;
        const dx = player.x - b.x; const dz = player.z - b.z;
        const dist = Math.hypot(dx, dz);
        if (dist > (player.weapon.spec?.range ?? 18)) continue;
        
        const fx = dx / dist; const fz = dz / dist;
        const rx = fz; const rz = -fx;                 
        const bh = { porker: PORKER_HEIGHT_M, cow: COW_HEIGHT_M }[b.kind] ?? CHICKEN_H;
        const toLocal = (wx, wy, wz) => {
          const ox = wx - b.x; const oz = wz - b.z;
          return {
            
            
            
            
            
            x: (ox * rx + oz * rz) / bh,
            y: wy / bh,
            z: (ox * fx + oz * fz) / bh,
          };
        };
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        const aimAt = lowNow ? legAimHeight(b.kind) : centreMassHeight(b.kind);
        const tipY = aimAt * bh;
        void aimDrop;
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        let aimX = b.x;
        let aimZ = b.z;
        if (lowNow) {
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          const gone = new Set(statusOf(b.creature).severedLimbs || []);
          const cand = [];
          for (const [id, sgn] of [['leg-l', -1], ['leg-r', 1]]) {
            if (gone.has(id)) continue;
            const lx = b.x + rx * sgn * 0.062 * bh;
            const lz = b.z + rz * sgn * 0.062 * bh;
            let d = Math.atan2(-(lx - player.x), lz - player.z) - player.yaw;
            d = Math.atan2(Math.sin(d), Math.cos(d));
            cand.push({ lx, lz, err: Math.abs(d) });
          }
          if (cand.length) {
            cand.sort((p, q) => p.err - q.err);
            aimX = cand[0].lx;
            aimZ = cand[0].lz;
          }
        }
        
        
        
        
        
        if (!aimNoted) {
          aimNoted = true;
          lastAimPoint = { x: aimX, y: tipY, z: aimZ, kind: b.kind, bodyHeight: bh, mode: lowNow ? 'low' : 'centre', acquired: !!target, dist };
        }
        
        
        
        
        
        
        
        
        
        
        
        
        const aimYaw = target
          ? Math.atan2(-(aimX - player.x), aimZ - player.z)
          : player.yaw;
        
        
        
        
        lastAimYaw = aimYaw;
        const hit = resolveHit(
          b.creature,
          toLocal(player.x, muzzleY, player.z),
          
          
          
          
          
          
          
          
          
          
          
          
          
          toLocal(
            player.x - Math.sin(aimYaw) * dist * SHOT_OVERSHOOT,
            muzzleY + (tipY - muzzleY) * SHOT_OVERSHOOT,
            player.z + Math.cos(aimYaw) * dist * SHOT_OVERSHOOT,
          ),
        );
        if (!hit) continue;
        
        
        
        
        applyDamage(b.creature, hit.id,
          player.weapon.spec?.limbDamage ?? WEAPONS.boltDriver.limbDamage);
        
        
        
        
        
        if ((player.weapon.spec?.burnDps ?? 0) > 0 && hit.id !== 'torso') {
          b.burn = {
            left: player.weapon.spec.burnSeconds,
            dps: player.weapon.spec.burnDps,
            limb: hit.id,
          };
        }
        
        
        
        
        
        
        
        
        const boltX = -Math.sin(aimYaw);
        const boltZ = Math.cos(aimYaw);
        
        
        
        
        
        
        if (b.anim) {
          b.anim = hitReact(
            b.anim,
            b.kind,
            hit.id,
            player.weapon.spec?.stagger ?? WEAPONS.boltDriver.stagger,
            Math.atan2(boltX * rx + boltZ * rz, boltX * fx + boltZ * fz),
          );
          if (b.anim.react) {
            creatureStats.flinches += 1;
            if (b.anim.react.interrupted) creatureStats.interrupts += 1;
          }
        }
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        hitStopNow(feelNow.hitStop);
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        if (feelNow.knockback > 0) {
          const mass = (SHOVE_M[b.kind] ?? SHOVE_M.chicken) / SHOVE_M.chicken;
          const metres = feelNow.knockback * mass;
          b.knock = { x: boltX, z: boltZ, left: metres, total: metres, moved: 0 };
        }
        reticHitT = 0;
        {
          const at = audio.at(b.x, b.z);
          if (at) {
            sfxSheet.play('hitCrack', { dest: at, gain: 0.8, rate: 0.95 + Math.random() * 0.1 });
            const squeal = { chicken: 'squealChicken', porker: 'squealPorker', cow: 'squealCow' }[b.kind];
            if (squeal) sfxSheet.play(squeal, { dest: at, gain: 0.7 });
          }
        }

        
        
        
        
        
        
        
        const hy = (hit.z ?? 0.5) * bh;
        
        shotEnd = [b.x, Math.max(0.1, hy), b.z];
        impacts.burst(
          b.x, Math.max(0.1, hy), b.z,
          { x: -Math.sin(aimYaw), z: Math.cos(aimYaw) },
        );
        meatSfx(b.x, b.z);
        
        
        if (decals) decals.put(b.x, b.z, bh * 0.5, 0.15);
        hitCount += 1;
        fireStats.hits += 1;
        
        
        shake = Math.max(shake, 0.16);

        const st = statusOf(b.creature);
        
        
        
        
        
        if (!st.alive) {
          maybeBleedOut(b, bh,
            (hit.id === 'leg-l') ? -1 : ((hit.id === 'leg-r') ? 1 : (Math.random() < 0.5 ? -1 : 1)));
        }
        
        
        
        
        
        targetsLeft -= 1;
        if (targetsLeft <= 0) break;
      }

      
      
      
      
      
      
      
      
      
      
      if (fireT === 0) {
        const muzzle = [
          player.x - Math.sin(player.yaw) * 0.34,
          lowNow ? 0.72 : 1.16,
          player.z + Math.cos(player.yaw) * 0.34,
        ];
        if (!shotEnd) {
          
          
          
          
          
          
          const range = player.weapon.spec?.range ?? 18;
          const dirX = -Math.sin(lastAimYaw);
          const dirZ = Math.cos(lastAimYaw);
          let d = 0.4;
          let wallAt = null;
          while (d < range) {
            const px = player.x + dirX * d;
            const pz = player.z + dirZ * d;
            if (!insideLevel(deck, px, pz, 0.02)) { wallAt = [px, pz, d]; break; }
            d += 0.22;
          }
          if (wallAt) {
            
            
            
            const bx = player.x + dirX * (wallAt[2] - 0.22);
            const bz = player.z + dirZ * (wallAt[2] - 0.22);
            const acrossX = Math.abs(wallAt[0] - bx) > Math.abs(wallAt[1] - bz);
            const n = acrossX
              ? { x: dirX > 0 ? -1 : 1, z: 0 }
              : { x: 0, z: dirZ > 0 ? -1 : 1 };
            const wy = muzzle[1] + (0.02 * (Math.random() - 0.5));
            shotEnd = [wallAt[0], wy, wallAt[1]];
            if (ricochets) { ricochets.burst(wallAt[0], wy, wallAt[1], { x: dirX, z: dirZ }, n); shotStats.ricochets += 1; }
            ricochetSfx(wallAt[0], wallAt[1]);
          } else {
            shotEnd = [player.x + dirX * range, muzzle[1], player.z + dirZ * range];
          }
          
          
          onShotWorld(muzzle, { x: dirX, z: dirZ }, wallAt ? shotEnd : null);
        }
        if (tracers) { tracers.fire(muzzle, shotEnd); shotStats.bolts += 1; }
        
        
        if (feelNow.shell) { casings.eject(muzzle, player.yaw); fireStats.shells += 1; }
      }
    }

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const keepClear = (b) => {
      if (!liftCar) return;
      const kept = keepOut(liftCar, b.x, b.z, 0.2);
      if (!kept.moved) return;
      b.x = kept.x; b.z = kept.z;
      if (b.mesh) b.mesh.position.set(b.x, b.mesh.position.y, b.z);
    };

    
    
    
    
    
    
    for (const b of birds) {
      if (!b.burn) continue;
      if (!b.alive) { if (b.flame) b.flame.visible = false; b.burn = null; continue; }
      b.burn.left -= dt;
      applyDamage(b.creature, b.burn.limb, b.burn.dps * dt);
      const bh2 = { porker: PORKER_HEIGHT_M, cow: COW_HEIGHT_M }[b.kind] ?? CHICKEN_H;
      
      
      if (!b.flame) {
        b.flame = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.14, 0.09),
          new THREE.MeshBasicMaterial({ color: 0xff9a3d }));
        scene.add(b.flame);
      }
      b.flame.visible = Math.random() > 0.15;
      b.flame.position.set(b.x + (b.burn.limb === 'leg-l' ? -0.05 : 0.05) * bh2, bh2 * 0.28, b.z);
      b.flame.scale.setScalar(0.8 + Math.random() * 0.5);
      const stB = statusOf(b.creature);
      if (!stB.alive) {
        
        
        maybeBleedOut(b, bh2, b.burn.limb === 'leg-l' ? -1 : 1);
      } else if ((stB.severedLimbs || []).includes(b.burn.limb)) {
        
        b.burn = null; b.flame.visible = false;
      }
      if (b.burn && b.burn.left <= 0) { b.burn = null; b.flame.visible = false; }
    }

    
    
    
    creatureStats.crawling = 0;
    for (const b of birds) {
      
      
      
      
      
      
      
      
      
      
      
      
      if (coopNet && coopNet.guest) { puppetCreature(b, dt, now); continue; }
      
      
      
      
      
      
      
      
      
      
      
      if (b.retreat && b.retreat.phase !== 'approach') {
        b.retreat = stepRetreat(b.retreat, dt, b);
        const at = retreatAt(b.retreat);
        b.x = at.x; b.z = at.z;
        b.entering = true;
        b.mesh.position.set(b.x, 0, b.z);
        if (b.retreat.event === 'gone') {
          
          
          
          
          b.mesh.visible = false;
          if (b.shade) b.shade.visible = false;
          b.alive = false;
          b.entering = false;
          const gm = gateMeshes[b.retreat.gateIndex];
          if (gm) gm.opened = true;
          creatureStats.retreats += 1;
          
          
          
          
          
          director = returnToDirector(director, {
            species: b.kind,
            gateIndex: b.retreat.gateIndex,
            progress: lastRouteProgress,
            creature: b.creature,
          });
          b.retreat = null;
        }
        continue;
      }
      
      
      
      
      if (b.entering) continue;
      
      
      
      
      if (b.apparition) continue;
      keepClear(b);

      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      if (b.latched && ride && carIsSafe(ride, liftCar, player.x, player.z)) {
        b.latched = false;
        b.cool = 1.2;
        if (player.latchedBy === b) player.latchedBy = null;
        player.struggle = null;
        keepClear(b);
      }

      
      
      
      
      
      
      if (!b.alive && b.dying !== undefined && b.dying < DEATH_LIE) {
        b.dying += dt;
        const u = Math.min(1, b.dying / DEATH_FALL);
        
        
        const fall = u * u;
        
        
        
        b.mesh.rotation.x = -Math.PI / 2;
        b.mesh.rotation.y = b.fallSide * fall * (Math.PI / 2);
        
        
        
        
        
        
        
        
        b.mesh.position.set(b.x, -fall * 0.10 * (b.deathDrop ?? 1), b.z);
        
        
        if (u < 1) {
          const tw = Math.exp(-u * 5) * Math.sin(u * 34) * 0.10;
          b.mesh.rotation.y += tw;
          
          
          
          
          
          const dtw = deathTwitch(u, b.anim ? b.anim.seed : 0);
          const kickLeg = b.rig.named[dtw.side < 0 ? 'legL' : 'legR'];
          if (kickLeg && kickLeg.visible) kickLeg.rotation.y = dtw.legKick;
          const spasmAxis = b.rig.cfg === CHICKEN_RIG_CFG ? 'x' : 'y';
          const wing = b.rig.named.wingL || b.rig.named.armL || b.rig.named.tentacleL;
          if (wing && wing.visible) wing.rotation[spasmAxis] = -dtw.wingSpasm;
        }
        if (b.shade) {
          
          b.shade.visible = true;
          const k = 1 + fall * 0.5;
          const base = (b.kind === 'horse' ? 1.15 : 0.62)
            * ({ porker: PORKER_HEIGHT_M, cow: COW_HEIGHT_M, horse: HORSE_HEIGHT_M }[b.kind] ?? CHICKEN_H);
          b.shade.position.set(b.x, 0.02, b.z);
          b.shade.scale.set(base * k, 1, base * k);
          b.shade.material.opacity = 0.44 * (1 - fall * 0.35);
        }
        
        
        const left = DEATH_LIE - b.dying;
        if (left < 0.6) {
          const a = Math.max(0, left / 0.6);
          b.mesh.visible = a > 0.02;
          if (b.shade) b.shade.material.opacity *= a;
        }
        if (b.dying >= DEATH_LIE) {
          b.mesh.visible = false;
          if (b.shade) b.shade.visible = false;
        }
        continue;
      }
      if (!b.alive) continue;

      
      if (b.kick > 0) {
        b.kick -= dt;
        b.x += b.vx * dt;
        b.z += b.vz * dt;
        keepClear(b);
        b.vy -= 14 * dt;                       
                                               
        b.mesh.position.set(b.x, Math.max(0, b.mesh.position.y + b.vy * dt), b.z);
        b.mesh.rotation.x = -Math.PI / 2 + b.spin * (0.85 - b.kick);
        if (b.kick <= 0) { b.alive = false; b.mesh.visible = false; if (b.shade) b.shade.visible = false; }
        continue;
      }
      const dx = player.x - b.x; const dz = player.z - b.z;
      const dist = Math.hypot(dx, dz);
      
      
      
      
      
      
      
      
      const frozenNow = !!(b.anim && (b.anim.hitStopT || 0) > 0);
      const cdt = frozenNow ? wallDt : dt;
      
      
      
      
      
      const mob = b.creature ? mobilityOf(b.creature) : 1;
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      const loco = b.creature ? locomotion(b.kind, mob) : null;
      if (loco && (loco.mode === 'crawl' || loco.mode === 'drag')) creatureStats.crawling += 1;
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      if (b.creature && b.alive && !(b.anim && b.anim.dying) && !statusOf(b.creature).alive) {
        maybeBleedOut(b, bodyHeightOf(b.kind), Math.random() < 0.5 ? -1 : 1);
      }
      
      
      
      
      b.locoMode = loco ? loco.mode : undefined;

      
      
      
      
      if (b.latched) b.anim.state = 'latched';
      const prof = b.kind === 'porker' ? PORKER : (b.kind === 'cow' ? COW : undefined);
      
      
      
      
      
      
      if (b.kind === 'horse' && fight) {
        const step = stepBossFight(fight, dt, {
          dist,
          metres: bossMoved,
          toBoulder: Math.hypot(b.x - deck.boulder.x, b.z - deck.boulder.z),
        });
        fight = step.fight;
        bossHorseSpeed = step.speed;
        bossMoved = 0;

        
        
        
        
        if (fight.dead) hud.msg('IT IS DOWN');
        else if (fight.boulder === 'rewinding') hud.msg('THE BOULDER IS SPENT');
        else if (step.blown) hud.msg('IT IS BLOWN');
        else hud.msg('');
        if (fight.event === 'blown') porkVoice(b, 'die', dist);
        else if (fight.event === 'recovered') porkVoice(b, 'alert', dist);

        if (!fight.dead && step.speed > 0 && dist > 1.1 && !player.dead) {
          const move = step.speed * dt;
          
          
          const want = pushOutOfPillars(
            arenaPillars,
            { x: b.x + (dx / dist) * move, z: b.z + (dz / dist) * move },
            1.15,
          );
          
          
          bossMoved = Math.hypot(want.x - b.x, want.z - b.z);
          b.x = want.x; b.z = want.z;
        }
        
        
        
        if (!fight.dead && dist < 1.3 && !player.dead && b.cool <= 0) {
          b.cool = 1.6;
          
          
          
          
          player.vitals.health -= coopNet
            ? coopNet.damageFor(b, 16 * INJURY.enemyDamageScale)
            : 16 * INJURY.enemyDamageScale;
          shake = Math.max(shake, 0.8);
          hitSfx();
        }
        b.cool -= dt;

        
        
        
        
        
        const tired = step.exhaustion ?? 0;
        
        
        
        
        
        
        
        b.gallopGait = stepHorseGait(b.gallopGait || 0, dt, step.speed, tired);
        const hp = horsePose(b.gallopGait, step.speed / BOSS_HORSE.speed, tired);
        const sag = (k, ph) => {
          const m = b.rig.named[k];
          if (m) m.rotation.y = hp.neckPump + tired * (0.30 + 0.22 * Math.sin(now * (1.3 + ph) + ph * 2));
        };
        sag('neckC', 0); sag('neckL', 0.7); sag('neckR', 1.4);
        applyHorsePose(b.rig, hp, tired * 0.16 + (fight.dead ? 0.7 : 0));
        
        b.rig.body.scale.set(1, 1 + Math.sin(now * (3 + tired * 5)) * 0.02 * (0.4 + tired), 1);

        if (fight.dead && b.alive) {
          b.alive = false;
          
          
          
          
          
          
          
          
          
          
          
          
          if (isFinalDeck(level)) bossWonIn = 0.9;
          else { hud.msg('IT IS DOWN  -  THE WAY UP IS OPEN'); actCardT = 4.5; }
        }
        b.mesh.position.set(b.x, 0, b.z);
        
        
        
        b.mesh.rotation.z = Math.atan2(dx, dz) + Math.PI + CREATURE_FACE;
        continue;
      }

      
      
      
      
      
      
      
      
      
      const unseen = player.dead || inSafe
        || (hidden && b.anim.state !== 'stalk' && b.anim.state !== 'strike' && b.anim.state !== 'windup')
        
        
        
        
        
        
        || (b.notBefore > 0 && b.anim.state === 'dormant' && progressAt(deck, player.x, player.z) < b.notBefore);

      
      
      
      
      
      
      
      if (!unseen) b.lastSeen = { x: player.x, z: player.z };

      
      
      
      
      if (!b.fatigue) b.fatigue = createFatigue(b.kind);
      const chasing = !unseen && b.anim.state !== 'dormant' && !b.latched;
      b.fatigue = tickFatigue(b.fatigue, dt, {
        pursuing: chasing,
        metres: Math.hypot(b.x - (b.lastX ?? b.x), b.z - (b.lastZ ?? b.z)),
      });
      b.lastX = b.x; b.lastZ = b.z;

      
      
      
      
      
      
      
      
      
      
      const posted = ambushOpts(prof || {}, b.anim, !!b.posted);
      const r = stepChicken(b.anim, cdt, unseen ? 1e6 : dist, {
        ...posted,
        
        
        
        
        locomotion: loco,
        legsLost: (mob && typeof mob === 'object') ? mob.legsLost : 0,
        giveUp: b.fatigue.gaveUp,
      });
      b.anim = r.anim;
      
      
      if (b.posted && b.anim.state === 'stalk') { b.posted = false; creatureStats.ambushes += 1; }
      
      
      
      
      
      if (r.event === 'down') {
        b.deathDrop = loco ? loco.heightScale : 1;
        creatureDeath(b, b.bleedBh ?? CHICKEN_H, b.fallSide ?? (Math.random() < 0.5 ? -1 : 1));
        continue;
      }
      
      
      if (r.event === 'giveup') b.lastSeen = null;

      
      const voice = b.kind === 'chicken' ? chickVoice : porkVoice;
      if (r.event) voice(b, r.event === 'recover' ? 'idle' : r.event, dist);

      
      
      b.idleIn -= dt;
      if (b.idleIn <= 0) {
        b.idleIn = 3 + Math.random() * 7;
        if (b.anim.state === 'dormant' && dist < 30) voice(b, 'idle', dist);
      }

      
      
      
      
      
      const seek = (unseen && b.lastSeen) ? b.lastSeen : (unseen ? null : player);
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      if (!isBoss && !b.retreat && b.creature && !b.entering
        && shouldRetreat(statusOf(b.creature), b.anim, { latched: b.latched })) {
        const g = nearestGate(
          gateMeshes.map((m) => ({ ...m.gate, opened: !!m.opened })),
          b,
        );
        if (g && !g.gate.opened) { b.retreat = createRetreat(g.index, g.gate); voice(b, 'hurt', dist); }
      }
      
      
      
      
      
      
      
      
      
      
      let aim;
      if (b.retreat) {
        aim = retreatWaypoint(b.retreat.gate);
      } else if (seek && !isBoss && seek === player) {
        const partner = nearestPartner(b);
        const fw = flankWaypoint(deck, b, partner, player, {
          hand: b.anim.seed < 0.5 ? 1 : -1,
          committed: !!b.flanking,
        });
        b.flanking = fw.phase === 'flank';
        if (b.flanking) creatureStats.flanks += 1;
        aim = fw;
      } else {
        aim = (seek && !isBoss) ? chaseWaypoint(deck, b, seek) : seek;
      }
      const sdx = aim ? aim.x - b.x : 0;
      const sdz = aim ? aim.z - b.z : 0;
      const sdist = Math.hypot(sdx, sdz);
      const toTarget = seek ? Math.hypot(seek.x - b.x, seek.z - b.z) : 0;
      
      
      
      
      
      
      
      const reeling = !!(b.knock && b.knock.left > 0);
      if (reeling && !frozenNow && !b.latched) {
        const s = Math.min(b.knock.left, (b.knock.total / KNOCK_SECONDS) * dt);
        b.knock.left -= s;
        if (!b.entering && insideLevel(deck, b.x, b.z, 0)) {
          const n = moveInLevel(deck, b, b.knock.x * s, b.knock.z * s, CREATURE_PAD, solidProps);
          b.knock.moved += Math.hypot(n.x - b.x, n.z - b.z);
          b.x = n.x; b.z = n.z;
          keepClear(b);
          fireStats.knockbackMax = Math.max(fireStats.knockbackMax, b.knock.moved);
        }
      }
      
      
      
      
      const walking = b.retreat
        ? (b.retreat.phase === 'approach' && sdist > 0.01)
        : (seek && toTarget > 0.35 && sdist > 0.01);
      if (!b.latched && !player.dead && r.speed !== 0 && walking && !reeling) {
        
        
        
        
        const move = r.speed * cdt;
        let stepX = (sdx / sdist) * move;
        let stepZ = (sdz / sdist) * move;
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        if ((b.wedgeUntil || 0) > now) {
          const px = -stepZ * b.wedgeSide;
          const pz = stepX * b.wedgeSide;
          stepX = (stepX + px * 2) / 3;
          stepZ = (stepZ + pz * 2) / 3;
        }
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        if (b.entering || !insideLevel(deck, b.x, b.z, 0)) {
          b.x += stepX;
          b.z += stepZ;
        } else {
          const n = moveInLevel(deck, b, stepX, stepZ, CREATURE_PAD, solidProps);
          
          
          if (Math.hypot(n.x - b.x, n.z - b.z) < move * 0.2) {
            b.wedgeFor = (b.wedgeFor || 0) + cdt;
            if (b.wedgeFor > CREATURE_WEDGE_S && (b.wedgeUntil || 0) <= now) {
              b.wedgeUntil = now + CREATURE_SIDLE_S;
              b.wedgeSide = b.wedgeSide === 1 ? -1 : 1;
              b.wedgeFor = 0;
            }
          } else {
            b.wedgeFor = 0;
          }
          b.x = n.x;
          b.z = n.z;
        }
        keepClear(b);
      }

      
      
      
      
      if (b.retreat) {
        b.retreat = stepRetreat(b.retreat, dt, b);
        if (b.retreat.event === 'withdraw') voice(b, 'hurt', dist);
      }
      
      
      
      
      
      
      
      if (ride && carIsSafe(ride, liftCar, player.x, player.z)) continue;
      
      if (r.canLatch && !b.latched && !player.dead && !player.struggle && b.cool <= 0
        && !(coopNet && coopNet.watching)) {
        
        
        
        
        
        
        
        
        const pb = coopNet && coopNet.active && !coopNet.guest ? coopNet.partnerBody() : null;
        if (pb && coopNet.partnerId()
          && Math.hypot(pb.x - b.x, pb.z - b.z) < Math.hypot(player.x - b.x, player.z - b.z)) {
          b.latched = true;
          b.latchTo = coopNet.partnerId();
          coopNet.grab(b.latchTo, birds.indexOf(b));
          b.cool = 1.2;
          continue;
        }
        b.latched = true;
        b.latchTo = coopNet && coopNet.session ? coopNet.session.id : null;
        if (coopNet && coopNet.active && !coopNet.guest) coopNet.grab(b.latchTo, birds.indexOf(b));
        player.latchedBy = b;
        
        
        
        
        
        
        
        
        
        
        
        
        player.struggle = createStruggle({
          verb: VERB_FOR[b.kind] ?? VERB_FOR.chicken ?? 'mash',
          mode: struggleMode(access, 'reduced'),
        });
        shake = Math.max(shake, 0.55);
        hitSfx();
        beginGrapple(player.vitals, b.kind);
        
        
        combatSay(barks, 'hurt');
      }
      b.cool -= dt;

      
      const sev = statusOf(b.creature).severedLimbs;
      if (sev.length !== (b.sevShown ?? 0)) {
        b.sevShown = sev.length;
        for (const id of sev) {
          const part = b.rig.named[SEVER_PART[id]];
          if (part && part.visible) { part.visible = false; voice(b, 'hurt', dist); }
        }
      }

      const pose = chickenPose(b.anim, {
        ...(prof || {}),
        
        
        
        severed: { legL: sev.includes('leg-l'), legR: sev.includes('leg-r') },
        
        
        
        
        
        locomotion: loco,
      });
      applyChickenPose(b.rig, pose);

      
      
      
      
      
      
      
      
      
      
      
      
      if (b.latched) {
        const grip = b.kind === 'chicken' ? 0.42 : 0.72;
        
        
        
        
        const held = (coopNet && b.latchTo && coopNet.partnerId() === b.latchTo)
          ? coopNet.partnerBody() : null;
        const hx = held ? held.x : player.x;
        const hz = held ? held.z : player.z;
        const hyaw = held ? held.yaw : player.yaw;
        b.x = hx - Math.sin(hyaw) * grip;
        b.z = hz + Math.cos(hyaw) * grip;
        
        
        
        
        
        
        const lift = (b.kind === 'chicken' ? 0.28 : 0.42) * (loco ? loco.heightScale : 1);
        b.mesh.position.set(b.x, lift * (0.6 + 0.4 * Math.abs(Math.sin(now * 11))), b.z);
        
        
        
        b.mesh.rotation.z = hyaw + CREATURE_FACE;
        
        
        b.mesh.rotation.y = Math.sin(now * 9.5) * 0.30;
      } else {
        b.mesh.position.set(b.x, 0, b.z);
        
        
        
        
        
        if (!r.frozen) b.mesh.rotation.z = Math.atan2(dx, dz) + Math.PI + CREATURE_FACE;
        b.mesh.rotation.y = 0;
      }

      
      
      
      
      
      
      
      if (b.shade) {
        const air = Math.max(0, b.mesh.position.y);
        const k = 1 / (1 + air * 2.4);
        b.shade.visible = b.alive;
        b.shade.position.set(b.x, 0.02, b.z);
        const base = (b.kind === 'horse' ? 1.15 : 0.62)
          * ({ porker: PORKER_HEIGHT_M, cow: COW_HEIGHT_M, horse: HORSE_HEIGHT_M }[b.kind] ?? CHICKEN_H);
        b.shade.scale.set(base * k, 1, base * k);
        b.shade.material.opacity = 0.44 * k;
      }
    }

    
    if (player.struggle) {
      player.struggle.update(dt);
      if (player.struggle.progress >= 1 || player.struggle.done) {
        const b = player.latchedBy;
        if (b) {
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          b.latched = false;
          b.kick = 0.85;                       
          b.vz = -Math.cos(player.yaw) * 9.5;  
          b.vx = Math.sin(player.yaw) * 9.5;
          b.vy = 5.4;                          
          b.spin = 11 + Math.random() * 6;
          kickSfx();
          
          
          
          
          
          kickT = 0;
          shake = Math.max(shake, 0.5);
        }
        player.latchedBy = null;
        player.struggle = null;
        endGrapple(player.vitals);
      }
    }

    
    
    
    
    
    
    const coopSeated = !!(coopNet && coopNet.active && !coopNet.watching
      && coopNet.session && coopNet.session.seated);
    if (player.vitals.health <= 0 && !player.dead && !coopSeated && !watching) {
      player.dead = true;
      hud.dead();
      
      
      
      
      feh_track('run_death', { deck: level, act: actFor(level) });
    }

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    placeCamera(menuUp ? wallDt : dt);
    function placeCamera(dtCam) {
    const wideLens = navigator.maxTouchPoints > 1 || touch.active;
    const camOpts = {
      
      
      
      
      
      
      
      
      mobile: wideLens,
      
      
      
      
      back: camBack,
      aspect: camera.aspect,
      
      
      
      aiming: aimLatch.up,
      
      
      
      
      
      
      
      
      
      
      
      solids: solidProps,
    };
    let camWant = 'auto';
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    if (liftCar && ride.phase !== 'idle' && ride.phase !== 'opening' && ride.phase !== 'boarding'
      && (ride.phase !== 'clear' || ride.rise > 0)) {
      camWant = 'fixed';
      camOpts.fixed = {

        
        
        
        
        
        
        
        
        eye: { ...carWorld(liftCar, -(LIFT.depth / 2 - 0.16), LIFT.width * 0.34), y: 2.55 },
        
        
        
        
        
        
        
        
        
        target: { ...carWorld(liftCar, LIFT.depth / 2 + 8, 0), y: 0.9 },
        fov: 72,
      };
    }
    const camPlayer = { x: player.x, z: player.z, yaw: player.yaw, vx: camVel.x, vz: camVel.z };
    
    
    if (!camState) camState = createCameraState(deck, camPlayer, camWant, camOpts);
    const place = cameraFor(deck, camPlayer, camWant, camState, dtCam, camOpts);
    camMode = place.mode;
    camEye = place.eye;
    camTarget = place.target;
    
    
    
    audio.listen(player.x, player.z, place.eye, place.target);
    
    
    camera.fov = place.fov;
    camera.updateProjectionMatrix();
    
    if (player.struggle) shake = Math.min(0.9, Math.max(shake, player.struggle.progress * 0.25 + 0.35));
    shake = Math.max(0, shake - dtCam * 1.9);
    
    
    const shakeK = shakeScale(access);
    const sx = shake ? (Math.random() - 0.5) * shake * 0.34 * shakeK : 0;
    const sy = shake ? (Math.random() - 0.5) * shake * 0.28 : 0;
    camera.position.set(place.eye.x + sx, place.eye.y + sy, place.eye.z);
    camera.lookAt(place.target.x + sx * 0.4, place.target.y + sy * 0.4, place.target.z);
    camera.rotateX(camPunchNow());   
    }
    if (studio) {
      
      
      
      
      
      
      
      
      
      
      const a = player.yaw + Math.PI + (studio.bearing ?? 0);
      camera.fov = studio.fov ?? 34;
      camera.updateProjectionMatrix();
      const d = studio.dist ?? 3.2;
      
      
      
      
      
      
      
      
      
      const cx = studio.at ? studio.at.x : player.x;
      const cz = studio.at ? studio.at.z : player.z;
      camera.position.set(cx + Math.sin(a) * d, studio.eye ?? 1.05, cz + Math.cos(a) * d);
      camera.lookAt(cx, studio.aim ?? 0.95, cz);
      
      
      
      
      
      if (studio.solo) {
        if (!soloSaved) {
          soloSaved = new Map(scene.children.map((c) => [c, c.visible]));
        }
        for (const c of scene.children) c.visible = (c === xRig || c === shadowRig);
        
        
        
        const bgWant = studio.bg ?? 0x11161a;
        if (!studioBg || studioBg.getHex() !== bgWant) studioBg = new THREE.Color(bgWant);
        scene.background = studioBg;
      }
    }
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    if (!studio && soloSaved) {
      for (const [c, v] of soloSaved) c.visible = v;
      soloSaved = null;
      scene.background = null;
    }

    
    
    
    
    
    
    
    
    
    
    
    
    if (player.vitals.health < flinchHp - 2 && !player.dead
        && !player.struggle && !player.latchedBy) {
      flinchT = 0;
      
      
      
      
      let near = null;
      let nd = Infinity;
      for (const b of birds) {
        if (!b.alive) continue;
        const d2 = Math.hypot(b.x - player.x, b.z - player.z);
        if (d2 < nd) { nd = d2; near = b; }
      }
      if (near) {
        
        
        
        
        
        
        
        
        
        const rx2 = Math.cos(player.yaw);
        const rz2 = Math.sin(player.yaw);
        const right = (near.x - player.x) * rx2 + (near.z - player.z) * rz2;
        const ahead = (near.x - player.x) * -Math.sin(player.yaw) + (near.z - player.z) * Math.cos(player.yaw);
        flinchBearing = Math.atan2(right, ahead);
        flinchSide = Math.sign(right) || 1;
      }
    }
    flinchHp = player.vitals.health;

    
    
    
    
    
    
    
    
    
    
    const moving = !player.dead && !player.struggle && lastMoved > 0.02;
    
    
    
    
    
    
    
    
    
    let dYaw = player.yaw - prevYaw;
    dYaw = Math.atan2(Math.sin(dYaw), Math.cos(dYaw));
    const turning = !player.dead && !player.struggle && !moving
      && kickT >= KICK_TIME && reachT >= REACH_TIME && fireT >= FIRE_TIME
      && dt > 0 && Math.abs(dYaw) / dt > TURN_RATE_MIN;
    let lean = 0;
    let bob = 0;
    
    
    
    
    let posed = null;
    let studioPose = null;
    
    
    
    
    let stepOffU = -1;
    
    
    
    
    
    
    
    let poseClip = 'idle';
    
    
    
    
    
    
    
    
    
    
    let poseSupport = null;
    
    
    
    let struggleFrameT = 0;
    
    
    let struggleRoll = 0;
    
    
    
    let fall = 0;

    
    
    
    
    
    
    if (!moving && settle <= 0) { startDist = 0; startPhase = 0; steppedOff = false; }
    
    
    
    
    
    
    
    
    if (moving || turning) settle = SETTLE_TIME;
    else if (settle > 0) {
      const st = settleStep(walkPhase, settle, dt);
      walkPhase = st.phase;
      
      
      
      
      
      
      
      
      
      startPhase = walkPhase;
      settle = st.settle;
    }

    if (player.dead) {
      deathT = Math.min(DEATH_TIME, deathT + dt);
      poseClip = 'death';
      const f = Math.min(DEATH_FRAMES - 1, Math.floor((deathT / DEATH_TIME) * DEATH_FRAMES));
      if (xander.geometry !== deathGeo[f]) xander.geometry = deathGeo[f];
      
      
      
      
      
      
      
      
      
      
      fall = deathFall(deathT / DEATH_TIME);
    } else if (player.struggle) {
      const drive = player.struggle.progress ?? 0;
      poseClip = 'struggle';
      
      
      
      
      
      
      
      
      
      
      
      const rate = 0.85 + drive * 0.45;
      const sFrame = Math.floor((now * rate / STRUGGLE_TIME) * STRUGGLE_FRAMES) % STRUGGLE_FRAMES;
      struggleFrameT = (sFrame / STRUGGLE_FRAMES) * STRUGGLE_TIME;
      if (xander.geometry !== struggleGeo[sFrame]) xander.geometry = struggleGeo[sFrame];
      
      
      
      
      lean = strugglePose(struggleFrameT, drive).lean;
      bob = -0.05 - drive * 0.03;
      
      
      
      
      struggleRoll = fightWave(struggleFrameT) * (0.05 + drive * 0.10);
    } else if (kickT < KICK_TIME) {
      
      
      
      
      const f = Math.min(KICK_FRAMES - 1, Math.floor((kickT / KICK_TIME) * KICK_FRAMES));
      poseClip = 'kick';
      if (xander.geometry !== kickGeo[f]) xander.geometry = kickGeo[f];
      
      
      lean = kickPose(kickT).lean;
    } else if (fireT < FIRE_TIME) {
      const f = Math.min(FIRE_FRAMES - 1, Math.floor((fireT / FIRE_TIME) * FIRE_FRAMES));
      poseClip = 'fire';
      if (xander.geometry !== fireGeo[f]) xander.geometry = fireGeo[f];
      lean = -Math.exp(-fireT * 14) * 0.10;      
    } else if (reachT < REACH_TIME) {
      
      
      
      const f = Math.min(REACH_FRAMES - 1, Math.floor((reachT / REACH_TIME) * REACH_FRAMES));
      poseClip = 'reach';
      if (xander.geometry !== reachGeo[f]) xander.geometry = reachGeo[f];
      lean = reachPose(reachT).lean;             
    } else if (moving || turning || settle > 0) {
      const running = sprintNow && moving;
      
      
      
      
      
      
      
      
      
      
      
      
      
      const gunUp = !player.dead && aimLatch.up && !running;
      
      
      
      
      if (!wasGaitBranch) walkArmsShown = gunUp;
      wasGaitBranch = true;
      
      
      
      
      
      
      
      const turnOnly = turning && !moving;
      if (turnOnly) { walkPhase = turnStep(walkPhase, dYaw, dt); wasTurnStep = true; }
      if (moving) wasTurnStep = false;
      const useShuffle = turnOnly || (!moving && wasTurnStep);
      
      
      
      
      
      
      
      
      
      
      const woundedSet = injuredNow && !running && !walkArmsShown && !useShuffle
        ? (dangerNow
          ? (wallTouch ? dangerWallWalkGeo : dangerWalkGeo)
          : (wallTouch ? woundedWallWalkGeo : woundedWalkGeo))
        : null;
      const set = woundedSet || (useShuffle ? shuffleGeo
        : (running ? sprintGeo : (walkArmsShown ? walkAimGeo : walkGeo)));
      const n = useShuffle ? SHUFFLE_FRAMES
        : (running ? SPRINT_FRAMES : WALK_FRAMES);
      const stride = running ? SPRINT_STRIDE : STRIDE;
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      const stepping = moving && !running && set === walkGeo && startDist < STEP_OFF_DIST;
      if (moving && !stepping) {
        
        
        
        startPhase = (startPhase + groundNow / stride) % 1;
      }
      const ph = (walkPhase = moving
        ? startPhase
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        : walkPhase);
      
      
      
      poseClip = stepping ? 'stepoff'
        : (woundedSet ? `wounded${dangerNow ? 'D' : ''}${wallTouch ? 'W' : ''}`
          : (useShuffle ? 'shuffle' : (running ? 'sprint' : (walkArmsShown ? 'walkaim' : 'walk'))));
      if (stepping) {
        
        
        
        const su = clamp(startDist / STEP_OFF_DIST, 0, 1);
        const sfr = Math.min(STEP_OFF_FRAMES - 1, Math.floor(su * (STEP_OFF_FRAMES - 1) + 0.5));
        if (xander.geometry !== stepOffGeo[sfr]) xander.geometry = stepOffGeo[sfr];
        stepOffU = su;
        
        
        poseSupport = [su <= STEP_OFF_LOAD, true];
        walkPhase = 0;
        startPhase = 0;
        lastGait = 0;
        
        
        
        lean = stepOffPose(sfr / (STEP_OFF_FRAMES - 1)).lean;
      } else {
        stepOffU = -1;
        const frame = Math.floor(ph * n) % n;
        if (xander.geometry !== set[frame]) xander.geometry = set[frame];
        
        
        const sup = support(ph, useShuffle ? 'shuffle' : (running ? 'sprint' : 'walk'));
        poseSupport = [sup.left, sup.right];
      }
      
      
      
      
      if (moving && !stepping && !steppedOff && !running && !useShuffle) {
        footSfx(player.x, player.z, false, floorSurface());
        stepCount += 1;
      }
      if (moving) steppedOff = true;

      
      
      
      
      
      
      
      
      
      
      
      const half = (v) => ((v % 0.5) + 0.5) % 0.5;
      if (!stepping && (half(ph) < half(lastGait) || Math.abs(ph - lastGait) > 0.4)) {
        footSfx(player.x, player.z, running, floorSurface());
        stepCount += 1;
        walkArmsShown = gunUp;
      }
      lastGait = ph;
      
      
      
      
      
      bob = 0;
      
      
      
      if (!stepping) lean = useShuffle ? 0.015 : (running ? 0.16 : 0.05);
    } else if (!player.dead && aimLatch.u > 0.001) {
      
      
      
      
      
      
      
      walkPhase = 0;
      wasGaitBranch = false;
      if (aimLatch.u < 1) {
      poseClip = 'aim';
        
        
        
        const fr = Math.round(aimLatch.u * (RAISE_FRAMES - 1));
        if (xander.geometry !== raiseGeo[fr]) xander.geometry = raiseGeo[fr];
      } else {
        
        
        
        
        const span = AIM_FRAMES * 2 - 2;
        const k = Math.floor(now * 9) % span;
        const fa = k < AIM_FRAMES ? k : span - k;
        if (xander.geometry !== aimGeo[fa]) xander.geometry = aimGeo[fa];
      }
    } else if (restNow) {
      
      
      
      
      walkPhase = 0;
      wasGaitBranch = false;
      if (restNow.seated) {
      poseClip = 'rest';
        const seat = injuredNow ? 1 : 0;
        if (xander.geometry !== seatGeo[seat]) xander.geometry = seatGeo[seat];
        restRigPitch = seatPitch[seat];
        restRigLift = seatLift[seat];
      } else {
        const fr3 = Math.min(REST_FRAMES - 1, Math.round(restNow.k * (REST_FRAMES - 1)));
        if (xander.geometry !== restGeo[fr3]) xander.geometry = restGeo[fr3];
        restRigPitch = restPitch[fr3];
        restRigLift = restLift[fr3];
      }
    } else if (injuredNow) {
      
      
      walkPhase = 0;
      wasGaitBranch = false;
      if (wallLeanClose) {
      poseClip = 'hurtidle';
        
        
        const set2 = dangerNow ? forearmLeanGeo : wallLeanGeo;
        const n2 = dangerNow ? FOREARM_FRAMES : WALLLEAN_FRAMES;
        const fl2 = Math.floor(now * 9) % n2;
        if (xander.geometry !== set2[fl2]) xander.geometry = set2[fl2];
      } else {
        const span = IDLE_FRAMES * 2 - 2;
        const k = Math.floor((now / IDLE_TIME) * span) % span;
        const fi = k < IDLE_FRAMES ? k : span - k;
        const idleSet = dangerNow ? dangerIdleGeo : woundedIdleGeo;
        if (xander.geometry !== idleSet[fi]) xander.geometry = idleSet[fi];
      }
    } else if (talkT >= 0 && !injuredNow) {
      
      walkPhase = 0;
      wasGaitBranch = false;
      const kT = Math.sin(Math.PI * (talkT / TALK_TIME));
      poseClip = 'talk';
      const fT = Math.round(kT * (TALK_FRAMES - 1));
      if (xander.geometry !== talkGeo[fT]) xander.geometry = talkGeo[fT];
    } else if (fidgetT >= 0 && !injuredNow) {
      
      walkPhase = 0;
      wasGaitBranch = false;
      const fF = Math.min(FIDGET_FRAMES - 1, Math.floor((fidgetT / FIDGET_TIME) * FIDGET_FRAMES));
      poseClip = 'fidget';
      const setF = fidgetGeo[fidgetWhich];
      if (xander.geometry !== setF[fF]) xander.geometry = setF[fF];
    } else {
      walkPhase = 0;
      wasGaitBranch = false;
      poseClip = 'idle';
      
      
      
      const span = IDLE_FRAMES * 2 - 2;
      const k = Math.floor((now / IDLE_TIME) * span) % span;
      const f = k < IDLE_FRAMES ? k : span - k;
      if (xander.geometry !== idleGeo[f]) xander.geometry = idleGeo[f];
    }
    
    
    
    if (studio && studio.clip) {
      poseClip = `studio:${studio.clip}`;
      const SETS = {
        idle: [xGeo], walk: walkGeo, sprint: sprintGeo,
        fire: fireGeo, struggle: struggleGeo, death: deathGeo,
        kick: kickGeo, reach: reachGeo, shuffle: shuffleGeo,
        
        
        
        stepoff: stepOffGeo,
      };
      const set = SETS[studio.clip] || [xGeo];
      const f = Math.max(0, Math.min(set.length - 1, Math.floor((studio.phase ?? 0) * set.length)));
      if (xander.geometry !== set[f]) xander.geometry = set[f];
      lean = studio.lean ?? 0;
      bob = 0;
      
      
      
      if (studio.clip === 'death') fall = (studio.phase ?? 0) * 1.15;
      
      
      
      
      
      
      
      
      
      
      
      
      const ph = f / set.length;
      
      
      
      const phEnd = f / Math.max(1, set.length - 1);
      studioPose = studio.clip === 'idle'
        ? standPose(0)
        : studio.clip === 'kick' ? kickPose(phEnd * KICK_TIME)
          : studio.clip === 'reach' ? reachPose(phEnd * REACH_TIME)
            
            
            : studio.clip === 'stepoff' ? { ...standPose(0), ...stepOffPose(phEnd) }
              : gaitPose(ph, (studio.clip === 'sprint' || studio.clip === 'shuffle') ? studio.clip : 'walk');
      
      
      
      if (studio.clip === 'kick' || studio.clip === 'reach' || studio.clip === 'stepoff') {
        lean = studioPose.lean;
      }
    }

    
    
    
    
    
    
    
    {
      
      
      
      
      
      
      
      
      if (player.dead) posed = deathPose(deathT / DEATH_TIME);
      else if (player.struggle) posed = strugglePose(struggleFrameT, player.struggle.progress ?? 0);
      else if (kickT < KICK_TIME) posed = kickPose(kickT);
      else if (fireT < FIRE_TIME) posed = firePose(fireT);
      else if (reachT < REACH_TIME) posed = reachPose(reachT);
      else if (turning && !moving) posed = gaitPose(walkPhase, 'shuffle');
      
      
      
      
      
      else if (stepOffU >= 0) {
        
        
        
        
        
        
        
        
        
        posed = { ...standPose(0), ...stepOffPose(stepOffU) };
      } else if (moving) {
        
        
        const ph2 = walkPhase;
        const g = gaitPose(ph2, sprintNow ? 'sprint' : 'walk');
        
        
        
        
        
        
        
        
        const gd = dangerNow ? gaitPose(limpWarp(ph2, INJURY.limpBias), 'walk') : g;
        posed = (injuredNow && !sprintNow && !walkArmsShown)
          ? (dangerNow ? dangerGait(gd, wallTouch) : woundedGait(g, wallTouch))
          : ((walkArmsShown && !sprintNow) ? aimedGait(g, aimPose(ph2 * (1 / 0.9))) : g);
      } else if (settle > 0) {
        
        
        
        
        
        
        const g = gaitPose(walkPhase, wasTurnStep ? 'shuffle' : 'walk');
        posed = (injuredNow && !wasTurnStep && !walkArmsShown)
          ? (dangerNow ? dangerGait(g, wallTouch) : woundedGait(g, wallTouch))
          : ((walkArmsShown && !wasTurnStep) ? aimedGait(g, aimPose(walkPhase * (1 / 0.9))) : g);
      } else if (!player.dead && aimLatch.u > 0.001) {
        
        
        
        if (aimLatch.u < 1) {
          const k = Math.round(aimLatch.u * (RAISE_FRAMES - 1)) / (RAISE_FRAMES - 1);
          posed = raiseMix(standPose(0), aimPose(0), k);
        } else {
          const span = AIM_FRAMES * 2 - 2;
          const kk = Math.floor(now * 9) % span;
          const fa = kk < AIM_FRAMES ? kk : span - kk;
          posed = { ...standPose(0), ...aimPose((fa / AIM_FRAMES) * (1 / 0.9)) };
        }
      } else if (restNow) {
        posed = restNow.seated ? restPose(injuredNow).pose : restTravel(restNow.k, true).pose;
      } else if (talkT >= 0 && !injuredNow) {
        const kT2 = Math.sin(Math.PI * (talkT / TALK_TIME));
        const q = Math.round(kT2 * (TALK_FRAMES - 1)) / (TALK_FRAMES - 1);
        posed = raiseMix(standPose(0), { ...standPose(0), ...TALK_TO }, q);
      } else if (injuredNow) {
        posed = wallLeanClose
          ? (dangerNow ? forearmLeanPose(now) : wallLeanPose(now))
          : (dangerNow ? dangerGait(standPose(now)) : woundedGait(standPose(now)));
      } else posed = standPose(now);
      if (studioPose) posed = studioPose;
      
      
      lastPosedFeet = posed.feet ? posed.feet.map((f) => [+f[0].toFixed(4), +f[1].toFixed(4)]) : null;
      const hand = posed.hands[0];

      gun.position.set(hand[0] * XANDER_H, 0.17, hand[1] * XANDER_H);
      
      
      
      const ready = (fireT < FIRE_TIME * 2.2) || !!target;
      gun.rotation.y = ready ? 0.02 : 0.78;
      gun.rotation.z = ready ? 0 : -0.25;
      
      
      
      
      
      
      if (fireT < FIRE_TIME) {
        const kick = feelOf(player.weapon.id).kick;
        const k = fireT < 0.03 ? fireT / 0.03 : Math.max(0, 1 - (fireT - 0.03) / Math.max(0.05, FIRE_TIME - 0.03));
        gun.translateX(-kick * k * k);
      }
      
      
      
      
      
      
      gun.visible = !player.dead && (ready || !!target);
      
      
      
      
      const fk = flashHeld ? 1 : Math.max(0, 1 - fireT / 0.055);
      flashMat.opacity = fk * fk * 1.0;
      
      if (fireT < 0.004) {
        flash.rotation.z = Math.random() * Math.PI * 2;
        flashCross.rotation.z = Math.random() * Math.PI * 2;
        
        
        const sc = (0.85 + Math.random() * 0.4) * feelOf(player.weapon.id).flashSize;
        flash.scale.set(sc, sc, sc);
        flashCross.scale.set(sc * 0.9, sc * 0.9, sc * 0.9);
      }
      
      
      
      {
        
        
        
        
        
        
        
        
        
        FLASH_WORLD.set(
          player.x - Math.sin(player.yaw) * 0.34,
          aimLowNow ? 0.72 : 1.16,
          player.z + Math.cos(player.yaw) * 0.34,
        );
        for (const fm of FLASH_MATS) {
          if (!fm.uniforms.uFlash) continue;
          fm.uniforms.uFlashPos.value.copy(FLASH_WORLD);
          fm.uniforms.uFlash.value = fk * fk;
        }
        
        
        
        const lit = fk * fk;
        flashTicks += 1;
        for (const p of props) {
          if (lit <= 0.01) { if (p.mat.opacity !== 0) p.mat.opacity = 0; continue; }
          const ox = p.x - FLASH_WORLD.x; const oz = p.z - FLASH_WORLD.z;
          const d = Math.hypot(ox, oz) || 1;
          if (d > 9) { p.mat.opacity = 0; continue; }
          
          
          
          const long = Math.min(4.2, (p.h * d) / Math.max(0.35, FLASH_WORLD.y));
          p.shadow.scale.set(p.r * 2.1, long, 1);
          p.shadow.position.set(p.x + (ox / d) * long * 0.5, 0.012, p.z + (oz / d) * long * 0.5);
          p.shadow.rotation.z = -Math.atan2(ox, oz);
          p.mat.opacity = Math.min(0.72, lit * 0.85) * Math.max(0, 1 - d / 9);
        }
      }
      flash.rotation.y = now * 9;      
    }

    
    
    
    
    
    
    
    
    
    
    neck.position.z = neckHomeZ - ((posed && posed.drop) || 0) * XANDER_H;

    
    
    
    
    
    
    
    
    let flinchRollAdd = 0;
    if (!studio && !player.dead && flinchT < FLINCH_TIME) {
      
      
      
      
      
      
      const add = flinchAdd(flinchT, flinchBearing);
      lean += add.lean;
      bob += add.bob;
      flinchRollAdd = add.roll;
    }
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    let idleRoll = 0;
    if (!studio && !player.dead && !player.struggle && !moving && !turning) {
      const sh = idleShift(now);
      lean += sh.lean;
      bob += sh.bob;
      idleRoll = sh.roll;
    }

    
    {
      const was = hide.phase;
      hide = stepHide(hide, dt, { wantToggle: hideWant });
      hideWant = false;
      if (hide.event === 'creak' && hideLocker) creakSfx(hideLocker.x, hideLocker.z);
      if (hide.event === 'clank' && hideLocker) hitSfx();
      if (was === 'out' && hide.phase === 'opening') {
        hideFrom = { x: player.x, z: player.z };
      }
      if (hideLocker) {
        
        hideLocker.door.rotation.y = hide.door * 1.83 * (hideLocker.side || 1);
        
        if (hideFrom && !hideSettled(hide)) {
          const u = hide.step;
          player.x = hideFrom.x + (hideLocker.inX - hideFrom.x) * u;
          player.z = hideFrom.z + (hideLocker.inZ - hideFrom.z) * u;
          
          player.yaw = Math.atan2(-(hideFrom.x - hideLocker.inX), hideFrom.z - hideLocker.inZ);
        }
        if (hide.phase === 'out') { hideLocker = null; hideFrom = null; }
      }
      
      
      hidden = hideProtects(hide);
    }
    xRig.visible = !player.dead ? hideDrawsPlayer(hide) : xRig.visible;
    
    
    
    
    xRig.rotation.x = restRigPitch;
    xRig.position.set(player.x, bob + restRigLift * XANDER_H, player.z);
    
    
    
    xRig.rotation.y = -player.yaw;

    
    
    
    
    
    
    {
      const fwdX = -Math.sin(player.yaw); const fwdZ = Math.cos(player.yaw);
      const sideX = Math.cos(player.yaw); const sideZ = Math.sin(player.yaw);
      
      const HALF = XANDER_SPANS.hip * 0.5 * XANDER_H;
      const feet = posed.feet || [[0, 0], [0, 0]];
      for (let i = 0; i < 2; i += 1) {
        const f = feet[i][0] * XANDER_H;
        const lift = feet[i][1] * XANDER_H;
        const lat = (i === 0 ? 1 : -1) * HALF;
        blobs[i].position.x = fwdX * f + sideX * lat;
        blobs[i].position.z = fwdZ * f + sideZ * lat;
        
        
        
        
        const k = Math.min(1, lift / 0.30);
        blobs[i].scale.setScalar(0.20 * (1 + k * 0.85));
        shadowMats[i].opacity = 0.46 * (1 - k) ** 1.5;
      }
      
      
      blobs[2].position.set(fwdX * 0.04, 0.02, fwdZ * 0.04);
      blobs[2].scale.setScalar(0.36);
      shadowMats[2].opacity = player.dead ? 0.28 : 0.17;
      shadowRig.position.set(player.x, 0, player.z);
      shadowRig.visible = !hidden;

      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      if (dt > 0 && dt < 0.2 && !player.dead && !studio) {
        const jumped = Math.hypot(player.x - footPlantPrev.px, player.z - footPlantPrev.pz) > 0.6;
        
        
        
        
        
        const sameClip = poseClip === footPlantPrev.clip;
        if (!poseSupport) footPlantPrev.down[0] = footPlantPrev.down[1] = false;
        for (let i = 0; i < 2; i += 1) {
          const wx = player.x + blobs[i].position.x;
          const wz = player.z + blobs[i].position.z;
          const lift = (posed.feet ? posed.feet[i][1] : 0) * XANDER_H;
          
          
          
          
          
          
          
          const down = !!(poseSupport && poseSupport[i]) && lift <= FOOT_PLANT_LIFT;
          const wasDown = footPlantPrev.down[i];
          
          
          const fx = posed.feet ? posed.feet[i][0] : 0;
          const along = groundNow + (fx - footPlantPrev.fx[i]) * XANDER_H;
          if (down && wasDown && !jumped && footPlantPrev.t > 0 && sameClip
              && LOCOMOTION_CLIP.test(poseClip)) {
            const v = Math.abs(along) / dt;
            const raw = Math.hypot(wx - footPlantPrev.x[i], wz - footPlantPrev.z[i]) / dt;
            if (raw > footPlant.rawMax) footPlant.rawMax = raw;
            
            
            
            
            
            
            
            
            
            
            
            
            
            const bucket = moving ? footPlant : footPlant.settle;
            bucket.samples += 1;
            bucket.sum += v;
            if (v > bucket.max) {
              bucket.max = v;
              bucket.worst = {
                v: +v.toFixed(4), foot: i, clip: poseClip, moving, sprint: !!sprintNow,
                stepping: stepOffU >= 0, dist: +startDist.toFixed(3),
                
                
                
                
                dm: +Math.hypot(player.x - footPlantPrev.px, player.z - footPlantPrev.pz).toFixed(4),
                ground: +groundNow.toFixed(4),
                fx: [+footPlantPrev.fx[i].toFixed(4), +fx.toFixed(4)],
                lift: +lift.toFixed(4), dt: +dt.toFixed(4),
                yawRate: +(Math.abs(dYaw) / dt).toFixed(3),
              };
            }
            if (v >= FOOT_SKATE_FLOOR) bucket.over += 1;
          } else if (!sameClip && down && wasDown && !jumped && footPlantPrev.t > 0) {
            const m = Math.hypot(wx - footPlantPrev.x[i], wz - footPlantPrev.z[i]);
            footPlant.pops += 1;
            if (m > footPlant.popMax) {
              footPlant.popMax = m;
              footPlant.popWorst = {
                m: +m.toFixed(4), foot: i, from: footPlantPrev.clip, to: poseClip,
              };
            }
          }
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          if (!moving) footPlantPrev.dclip[i] = '';
          if (down && !wasDown) {
            footPlantPrev.dsum[i] = 0;
            footPlantPrev.dclip[i] = moving ? poseClip : '';
          }
          else if (down && wasDown && !jumped && sameClip) footPlantPrev.dsum[i] += along;
          else if (!down && wasDown && LOCOMOTION_CLIP.test(poseClip)
                   && footPlantPrev.dclip[i] === poseClip) {
            const drift = Math.abs(footPlantPrev.dsum[i]);
            footPlant.stances += 1;
            if (drift > footPlant.driftMax) {
              footPlant.driftMax = drift;
              footPlant.driftWorst = { m: +drift.toFixed(4), foot: i, clip: poseClip };
            }
          }
          footPlantPrev.x[i] = wx; footPlantPrev.z[i] = wz; footPlantPrev.down[i] = down;
          footPlantPrev.fx[i] = posed.feet ? posed.feet[i][0] : 0;
        }
        footPlantPrev.px = player.x; footPlantPrev.pz = player.z; footPlantPrev.t = now;
        footPlantPrev.clip = poseClip;
        
        
        
        
        
        
        
        
        
        footPlant.clips[poseClip] = (footPlant.clips[poseClip] || 0) + 1;
      }
    }
    
    
    
    
    
    
    
    let stumbleLean = 0;
    if (stumbleT >= 0) {
      const su = stumbleT / INJURY.stumbleTime;
      stumbleLean = Math.sin(Math.PI * (su ** 0.65)) * 0.22;
    }
    
    
    
    if (!restNow) { restRigPitch = 0; restRigLift = 0; }
    xTilt.rotation.x = lean + fall + stumbleLean;
    
    
    
    
    
    const bank = clamp(-dYaw * 0.9, -0.05, 0.05);
    bankRoll += (bank - bankRoll) * Math.min(1, dt * 7);
    
    
    
    
    
    
    xTilt.rotation.z = clamp(
      wallRoll + bankRoll + flinchRollAdd + struggleRoll + idleRoll, -0.16, 0.16,
    );

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    let wantLook = 0;
    let seen = Infinity;
    for (const b of birds) {
      if (!b.alive) continue;
      const d = Math.hypot(b.x - player.x, b.z - player.z);
      if (d >= seen || d > 26) continue;
      
      const world = Math.atan2(player.x - b.x, b.z - player.z);
      let rel = world - player.yaw;
      while (rel > Math.PI) rel -= Math.PI * 2;
      while (rel < -Math.PI) rel += Math.PI * 2;
      if (Math.abs(rel) > Math.PI / 2) continue;      
      seen = d;
      wantLook = clamp(rel * 0.55, -1.08, 1.08);      
    }
    
    
    
    
    
    
    
    
    
    
    
    
    
    if (!Number.isFinite(seen)) {
      const rate = dt > 0 ? (player.yaw - prevYaw) / dt : 0;
      wantLook = clamp(rate * 0.16, -0.5, 0.5);
      
      
      
      
      
      
      
      
      if (stillFor > 10 && Math.abs(wantLook) < 0.05) {
        const gt = stillFor - glanceAt;
        if (gt >= 0 && gt < 1.4) wantLook = glanceDir * 0.42;
        else if (gt >= 1.4) {
          glanceAt = stillFor + 4 + Math.random() * 6;
          glanceDir = Math.random() < 0.5 ? -1 : 1;
        }
      }
    }
    
    
    if (moving || turning || player.dead || player.struggle || target
        || kickT < KICK_TIME || reachT < REACH_TIME || fireT < FIRE_TIME) {
      if (stillFor > 0) { stillFor = 0; glanceAt = 10 + Math.random() * 4; }
    } else {
      stillFor += dt;
      
      
      
      if (fidgetT < 0 && stillFor > fidgetAt) {
        if (!fidgetBag.length) fidgetBag = [0, 1];
        const pick = Math.floor(Math.random() * fidgetBag.length);
        fidgetWhich = fidgetBag.splice(pick, 1)[0];
        fidgetT = 0;
        fidgetAt = stillFor + 20 + Math.random() * 14;
      }
    }
    if (fidgetT >= 0) {
      fidgetT += dt;
      if (fidgetT > FIDGET_TIME) fidgetT = -1;
    }
    if (stillFor < 0.2) { fidgetT = -1; fidgetAt = 26; }
    prevYaw = player.yaw;

    
    
    
    headLook = headLook + (wantLook - headLook) * (1 - Math.exp(-6.5 * dt));
    
    
    
    
    
    neck.rotation.z = -headLook;

    
    const w = canvas.clientWidth || 960; const h = canvas.clientHeight || 540;
    if (canvas.width !== w || canvas.height !== h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    
    
    
    
    
    
    
    
    if (look) look.step(now, dt, { calm });

    
    
    
    
    
    
    
    stepHazards(ctx, dt);
    
    
    
    
    
    
    
    
    
    if (!(coopNet && coopNet.guest)) stepBeats(ctx, dt);

    
    if (impacts) impacts.step(dt);
    if (ricochets) ricochets.step(dt);
    if (tracers) tracers.step(dt);
    {
      
      
      const c = casings.step(dt);
      if (c.landedAt) {
        const at = audio.at(c.landedAt[0], c.landedAt[2]);
        if (at) sfxSheet.play('shellDrop', { dest: at, gain: 0.35, rate: 0.9 + Math.random() * 0.2 });
      }
    }
    for (const l of leaks) l.step(dt);
    for (const w of wires) w.step(now);

    creakIn -= dt;
    if (creakIn <= 0) {
      creakIn = 9 + Math.random() * 16;
      
      
      
      
      
      const gx = player.x + (Math.random() - 0.5) * 9;
      const gz = player.z + (Math.random() - 0.5) * 22;
      if (!(Math.random() < 0.25 && settleSfx(gx, gz))) creakSfx(gx, gz);
    }

    sparkIn -= dt;
    if (sparkIn <= 0 && wires.length) {
      sparkIn = 3.5 + Math.random() * 6;
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      const inRange = wires.filter(
        (q) => Math.hypot(q.tip[0] - player.x, q.tip[2] - player.z) < 16,
      );
      const pool = inRange.length ? inRange : wires;
      const w = pool[Math.floor(Math.random() * pool.length)];
      sparkStats.fired += 1;
      if (Math.hypot(w.tip[0] - player.x, w.tip[2] - player.z) < 14) sparkStats.near += 1;
      sparkAt(w.tip);
      sparkFlash = 0.34;
      sparkSfx(w.tip[0], w.tip[2]);
    }
    if (actCardT > 0) { actCardT -= dt; if (actCardT <= 0) hud.msg(''); }
    {
      const el = document.getElementById('deckCard');
      if (el) {
        deckCardT = Math.max(0, deckCardT - dt);
        
        el.style.opacity = Math.min(1, deckCardT / 0.9).toFixed(3);
      }
    }
    
    
    
    if (gradeEl) gradeEl.style.background = 'rgba(2, 5, 4, 0.34)';
    
    
    
    
    
    if (library && library.screen) {
      const hum = 0.92 + Math.sin(now * 13.7) * 0.03 + Math.sin(now * 3.1) * 0.03;
      const drop = (Math.sin(now * 0.43) > 0.997) ? 0.55 : 1;
      
      
      
      library.screen.material.color.setHex(0x6ff0d8).multiplyScalar(hum * drop);
    }
    sparkFlash = Math.max(0, sparkFlash - dt);
    
    
    sparkPt.material.opacity = sparkFlash > 0
      ? (Math.random() > 0.35 ? 0.95 : 0.2) * flashScale(access) : 0;
    
    
    if (sparkFlash > 0 && sparkGeo) {
      const a = sparkGeo.attributes.position;
      for (let i = 0; i < SPARK_N; i += 1) {
        a.setY(i, a.getY(i) - dt * (0.9 + i * 0.15));
      }
      a.needsUpdate = true;
    }


    
    
    
    
    
    
    
    if (reticEl) {
      if (target) {
        
        
        
        
        const th = bodyHeightOf(target.kind);
        const ay = (aimLowNow ? legAimHeight(target.kind) : centreMassHeight(target.kind)) * th;
        tmpV.set(target.x, ay, target.z).project(camera);
        const on = tmpV.z < 1;
        reticEl.style.opacity = on ? '0.92' : '0';
        if (on) {
          reticEl.style.left = `${(tmpV.x * 0.5 + 0.5) * 100}%`;
          reticEl.style.top = `${(-tmpV.y * 0.5 + 0.5) * 100}%`;
        }
      } else {
        reticEl.style.opacity = '0';
      }
      
      
      
      reticHitT += dt;
      reticEl.classList.toggle('low', aimLowNow);
      reticEl.classList.toggle('hit', reticHitT < RETIC_HIT_S);
    }
    
    
    
    
    {
      const h = player.vitals.health;
      if (lastHealth !== null && h < lastHealth) hurtAcc += lastHealth - h;
      lastHealth = h;
      if (hurtAcc >= 3) { hurtAcc = 0; hurtT = 0; }
      hurtT += dt;
      if (hurtEl) {
        const k = hurtT < HURT_S ? 1 - hurtT / HURT_S : 0;
        hurtEl.style.opacity = k > 0 ? (0.88 * k * k).toFixed(3) : '0';
      }
    }

    
    paIn -= dt;
    if (paIn <= 0 && !player.dead) {
      paIn = 22 + Math.random() * 26;
      tannoy();
    }

    
    
    
    
    
    
    
    
    const barkSpotted = !player.dead
      && birds.some((b) => b.alive && b.anim && b.anim.state !== 'dormant'
        && Math.hypot(b.x - player.x, b.z - player.z) < 16);
    stepBarks(barks, dt, {
      busy: barkSpotted || !!player.struggle || !!player.latchedBy || player.dead,
    });
    
    
    
    
    
    {
      const cb = currentBark(barks);
      const key = cb ? cb.who + '|' + cb.text : null;
      if (key !== mumbleState.lastKey) {
        mumbleState.lastKey = key;
        if (cb && cb.who === 'xander') {
          
          
          
          
          
          
          
          const dv = voxSheet.speak(`x_${cb.id}`);
          if (dv > 0 && barks.current) {
            barks.current.until = Math.max(barks.current.until, barks.t + dv + 0.3);
            barks.quietUntil = Math.max(barks.quietUntil, barks.t + dv + 0.7);
          } else mumbleSay(cb.text);
        } else if (mumbleState.stop) { mumbleState.stop(); mumbleState.stop = null; }
      }
    }
    if (barkSpotted && !barkSpottedWas) {
      
      
      
      say(barks, barks.fired.has('see1') ? 'sight' : 'firstSight');
    }
    barkSpottedWas = barkSpotted;
    
    
    
    if (!player.dead) {
      if (player.vitals.health < 30 && barkHealthWas >= 30) say(barks, 'lowHealth');
      if (player.weapon.ammo <= 0 && barkAmmoWas > 0) say(barks, 'empty');
      else if (player.weapon.ammo < 10 && barkAmmoWas >= 10) say(barks, 'lowAmmo');
    }
    barkHealthWas = player.vitals.health;
    barkAmmoWas = player.weapon.ammo;

    
    const hunted = birds.some((b) => b.alive && Math.hypot(b.x - player.x, b.z - player.z) < 13);
    
    
    audio.duck(hunted || inSafe);
    
    
    
    
    roomToneLevel(inSafe);

    
    
    
    breathIn -= dt;
    if (breathIn <= 0 && !player.dead) {
      const sp = player.vitals.stamina ?? 100;
      const spent = Math.max(0, 1 - sp / 100);
      if (spent > 0.25) {
        breathSfx(spent > 0.65);
        breathIn = 1.5 - spent * 0.85;
      } else {
        breathIn = 1.2;
      }
    }

    
    nearLocker = null;
    if (!player.dead && !player.struggle) {
      for (const l of lockers) {
        if (Math.hypot(player.x - l.x, player.z - l.z) < 1.05) { nearLocker = l; break; }
      }
    }
    
    
    
    
    
    if (hidden && !nearLocker && hideSettled(hide)) {
      hide = createHide(); hideLocker = null; hideFrom = null; hidden = false;
    }
    const hint = $('hint');
    if (hint) {
      
      
      hint.style.display = (nearLocker || hidden) ? 'block' : (hintShown ? 'block' : 'none');
      if (nearLocker || hidden) hint.innerHTML = hidden ? '<kbd>E</kbd> come out' : '<kbd>E</kbd> hide';
      else if (hintShown) hint.innerHTML = HINT_HTML;
    }
    if (hidden) {
      
      player.x = nearLocker.x;
      player.z = nearLocker.z;
    }
    if (bars) bars.style.opacity = hidden ? '1' : '0';

    
    if (isBoss && boulder && fight) {
      const bp = deck.boulder;
      let y = bp.y;
      if (fight.boulder === 'falling') {
        
        const u = fight.boulderT / 0.42;
        y = bp.y - (bp.y - 0.9) * u * u;
      } else if (fight.boulder === 'landed') {
        y = 0.9;
      } else if (fight.boulder === 'rewinding') {
        y = 0.9 + (bp.y - 0.9) * Math.min(1, fight.boulderT / BOSS_HORSE.rewind);
      }
      boulder.position.y = y;
      boulder.rotation.set(now * 0.3, now * 0.21, 0);
      if (cable) {
        const cp = cable.geometry.attributes.position;
        cp.setXYZ(1, bp.x, y + 0.9, bp.z);
        cp.needsUpdate = true;
        cable.visible = fight.boulder === 'hung' || fight.boulder === 'rewinding';
      }
    }
    if (bossWonIn > 0) {
      bossWonIn -= dt;
      if (bossWonIn <= 0) { hud.won(); feh_track('run_win', { deck: level }); }
    }

    
    
    
    
    
    
    
    
    
    if (pendingPickup && reachT >= REACH_TIME * 0.5) {
      const it = pendingPickup;
      pendingPickup = null;
      it.mesh.visible = false;
      if (it.ammo) player.weapon.ammo += 24;
      
      
      
      
      
      else if (it.medkit) player.vitals.health = MAX_HEALTH;
      else player.vitals.health = Math.min(MAX_HEALTH, player.vitals.health + 35);
      liftChime();
    }
    for (const it of pickups) {
      if (it.taken) continue;
      
      
      
      
      it.mesh.rotation.y = now * (it.spin ?? 1.1);
      it.mesh.position.y = (it.baseY ?? 0.15) + Math.sin(now * 2.2) * (it.bob ?? 0.03);
      
      
      
      
      
      
      if (!player.dead && !player.struggle && reachT >= REACH_TIME
          && Math.hypot(player.x - it.x, player.z - it.z) < 0.9) {
        it.taken = true;
        reachT = 0;
        pendingPickup = it;
      }
    }

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const wasSafe = inSafe;
    inSafe = !player.dead && safeRoom
      && player.x > safeRoom.x0 && player.x < safeRoom.x1
      && player.z > safeRoom.z0 && player.z < safeRoom.z1;
    if (inSafe !== wasSafe) {
      hud.msg(inSafe ? 'SAFE' : '');
      if (inSafe) {
        liftChime();
        
        
        say(barks, 'safe');
      }
    }
    
    
    
    
    
    
    {
      
      
      
      
      
      
      const canRest = !player.dead && !player.struggle
        && !moving && !turning && !fireHeld && !hidden;
      const sp = player.vitals.stamina ?? 100;
      if (sp <= 1) blown = true;
      if (sp > 35 || !canRest) blown = false;
      const wantRest = canRest && (inSafe || blown);
      if (wantRest) safeIdle += dt; else safeIdle = 0;
      
      if (safeIdle > (blown ? 0.15 : REST_AFTER)) resting = true;
      if (!wantRest) resting = false;
      const RT = 1.45;
      restT = Math.max(0, Math.min(RT, restT + (resting ? dt : -dt * 1.6)));
      restNow = restT > 0 ? { k: restT / RT, seated: restT >= RT } : null;
    }
    if (inSafe) {
      player.vitals.health = Math.min(MAX_HEALTH, player.vitals.health + 5.5 * dt);
      if (!safeResupplied) {
        safeResupplied = true;
        player.weapon.ammo += 30;
      }
    }

    
    
    
    
    
    
    
    
    
    
    
    
    {
      const nearLib = !!library && !player.dead
        && Math.hypot(player.x - library.x, player.z - library.z) < 1.6;
      nearBench = !!workbench && !player.dead
        && Math.hypot(player.x - workbench.x, player.z - workbench.z) < 1.7;
      if (nearLib !== nearLibrary) {
        nearLibrary = nearLib;
        hud.lore(nearLib ? chapterFor(level) : null);
      }
    }

    
    
    
    
    
    
    
    
    
    if (liftCar && !player.dead) {
      const toCar = Math.hypot(player.x - liftCar.x, player.z - liftCar.z);
      const near = toCar < LIFT.callRadius;
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      const inCar = insideCar(liftCar, player.x, player.z, LEAF.pad - 0.02, LEAF.pad + LEAF.halfThick);
      const was = ride.phase;
      
      
      
      
      
      
      
      
      
      const coopInside = coopNet ? coopNet.liftInside(inCar) : inCar;
      ride = stepLift(ride, dt, { near, inside: coopInside, away: toCar > LIFT.clearRadius });
      
      
      
      
      
      
      
      
      if (sinceArrive >= 0) {
        sinceArrive += dt;
        if (ride.phase === 'clear' || ride.phase === 'idle') sinceArrive = -1;
        else if (sinceArrive > (LIFT.settle + LIFT.doorTime) * 2 + 1) {
          ride = { ...ride, phase: 'clear', t: 0, door: 1, sealed: false, event: 'ready' };
          liftForced += 1;
          sinceArrive = -1;
        }
      }

      
      
      
      
      
      
      
      
      
      
      
      
      if (was !== 'closing' && ride.phase === 'closing') {
        for (const b of birds) {
          b.alive = false;
          b.latched = false;
          if (b.mesh) b.mesh.visible = false;
          if (b.flame) b.flame.visible = false;
          b.burn = null;
        }
        
        
        
        
        
        
        
        
        
        
        
        endStruggleWith();
      }
      
      
      
      
      
      if (ride.phase === 'riding') {
        const floorsGone = Math.floor(ride.rise * LIFT_FLOORS);
        if (floorsGone > liftFloorsHeard) {
          liftFloorsHeard = floorsGone;
          sfxSheet.play('liftPass', { gain: 0.5, rate: 0.96 + Math.random() * 0.08 });
        }
      } else if (ride.phase === 'idle' || ride.phase === 'opening') liftFloorsHeard = 0;
      
      
      
      
      if (ride.event === 'open') { liftChime(); hud.msg('LIFT'); if (coopNet) coopNet.lift('boarding', level); }
      
      
      
      else if (ride.event === 'reopen') { doorSfx(true); liftStats.reopens += 1; }
      else if (ride.event === 'shut') { doorSfx(false); hud.msg(''); }
      else if (ride.event === 'arrive') { sinceArrive = 0; }
      else if (ride.event === 'ready') {
        
        
        
        const el = document.getElementById('deckCard');
        if (el) el.textContent = `DECK ${level}`;
        deckCardT = 3.4;
        sinceArrive = -1;
      }
      else if (ride.event === 'depart') {
        
        
        
        level += 1;
        
        
        
        if (coopNet && coopNet.active) { coopNet.setPhase('lift'); coopNet.lift('riding', level); }
        
        
        
        
        newDeck(barks, level);
        liftStats.rides += 1;
        
        
        saveProgress({ deck: level });
        feh_track('deck_reached', { deck: level, act: actFor(level) });
        buildWorld(level);
        
        
        
        
        
        
        
        placeCar(deck.bays[0]);
        player.x = liftCar.x; player.z = liftCar.z;
        
        
        player.yaw = Math.atan2(-liftCar.face.x, liftCar.face.z);
        
        
        
        
        
        if (coopNet && coopNet.active) {
          coopNet.setPhase('deck', { level, seed: level });
          coopNet.lift('arriving', level);
          const mine = coopNet.spawn({ x: liftCar.x, z: liftCar.z, yaw: player.yaw });
          if (mine) { player.x = mine.x; player.z = mine.z; player.yaw = mine.yaw; }
        }
        
        
        
        
        
        
        
        
        
        camState = null;
        placeCamera(0);
        
        
        
        
        hide = createHide(); hideLocker = null; hideFrom = null;
        hidden = false;
        inSafe = false;
        
        
        player.weapon = readyWeapon('boltDriver', { ammo: 48 });
        safeResupplied = false;
        hud.lift(level);
        liftHum(true);
        
        
        say(barks, 'lift');
      } else if (ride.event === 'arrive') {
        liftHum(false);
        
        
        
        if (!sfxSheet.play('liftChime', { gain: 0.9 })) {  }
        doorSfx(true);
      }
      else if (ride.event === 'ready') { hud.lift(0); hud.msg(''); }
      
      
      
      
      
      
      
      
      
      if (ride.phase === 'idle' && liftCar && liftCar.kind === 'arrival') {
        placeCar(deck.bays[1]);
      }
      
      if (liftLamp && liftCar) {
        const nearLift = Math.hypot(player.x - liftCar.x, player.z - liftCar.z) < LIFT.callRadius;
        liftLamp.color.setHex(nearLift ? 0x9df5d9 : 0x2a4a3e);
      }
      if (was === 'idle' && ride.phase === 'opening') doorSfx(true);

      
      
      if (liftDoors) {
        for (const d of liftDoors) {
          d.position.x = d.userData.homeX + d.userData.side * ride.door * (LIFT.width / 2);
        }
      }

      
      
      
      
      
      
      
      syncLiftColliders();
      liftStats.forced = liftForced;
      if (liftColliders && leafContact(liftColliders.all, player.x, player.z)) liftStats.leafHits += 1;
    }

    
    
    
    
    
    
    
    
    
    

    
    
    
    
    
    if (portrait) {
      const nearest = birds.reduce((d, b) => (b.alive
        ? Math.min(d, Math.hypot(b.x - player.x, b.z - player.z)) : d), Infinity);
      let expr = 'calm';
      if (player.struggle) expr = 'afraid';
      else if (player.vitals.health < 55) expr = 'hurt';
      else if (nearest < 7) expr = 'afraid';
      else if (nearest < 20) expr = 'alert';
      portrait.set(expr);
      
      faceMat.uniforms.uMap.value = faces[expr];
      portrait.draw(now);
    }

    if (mapCv) {
      
      
      
      
      
      
      
      const mb = Math.atan2(-(camTarget.x - camEye.x), camTarget.z - camEye.z);
      
      
      
      
      drawMap(mapCv, player, birds, EXIT, level, deck, mb, mapRise(ride, MAP.deckGap));
    }

    
    
    
    
    const splitCams = coopCameraList(dt);
    if (splitCams) renderSplit({ renderer, scene, cameras: splitCams, width: canvas.width, height: canvas.height });
    else renderer.render(scene, camera);
    if (coopHud) paintCoopHud();
    frameCount += 1;
    shotFlash = Math.max(0, shotFlash - dt);
    
    
    const flashK = flashScale(access);
    hud.paint({
      health: player.vitals.health,
      maxHealth: MAX_HEALTH,
      stamina: player.vitals.stamina,
      struggle: player.struggle,
      lastInput,
      alive: !player.dead,
      
      
      
      
      
      
      
      
      
      
      
      
      remaining: birds.filter((b) => b.alive && b.anim
        && b.anim.state !== 'dormant' && !(b.fatigue && b.fatigue.gaveUp)).length,
      ammo: player.weapon.ammo,
      range: Math.round(player.weapon.spec?.range ?? 0),
      
      
      
      
      
      
      
      
      
      
      ep: Math.max(0, 100 - gateMeshes.filter((m) => m.opened).length * 9
        - Math.min(30, (level - 1) * 3)),
      deckNo: level,
      flash: shotFlash > 0 && flashK > 0.3 && (now - lastFlashAt) >= flashGap(access),
      bark: currentBark(barks),
    });
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);

  
  {
    const el = (id) => document.getElementById(id);
    
    
    let onPauseOpen = null;
    const setPaused = (on) => {
      
      
      if (on && (intro && !intro.done)) return;
      if (on && player.dead) return;
      paused = !!on;
      const p = el('pause');
      if (p) p.style.display = paused ? 'flex' : 'none';
      document.body.classList.toggle('modalOpen', paused);
      if (paused) {
        if (onPauseOpen) onPauseOpen();
        const w = el('pauseWhere');
        if (w) w.textContent = `DECK ${level}`;
        const st = el('saveState');
        const existing = readLocalSave();
        if (st) st.textContent = existing ? `Last save: ${describeSave(existing, Date.now())}` : 'No save yet.';
        
        
        
        const cl = el('saveCloud');
        if (cl) {
          cl.textContent = 'Checking your account…';
          cloudWho().then((who) => {
            cl.textContent = who
              ? `Signed in as ${who} — saves also go to your account.`
              : 'Saved on this browser only. Sign up on magesticanstudios.com to keep your save if you clear your browser or switch device.';
          }).catch(() => { cl.textContent = 'Saved on this browser only.'; });
        }
      }
    };
    
    
    
    
    
    
    
    
    
    
    {
      const KEY = 'feh.muted';
      audio.setMuted(readMuted(KEY, false));
      const wire = (host, id) => {
        if (!host) return;
        mountSoundToggle({
          host,
          id,
          className: 'menuBtn',
          isMuted: () => audio.muted,
          setMuted: (on) => { audio.setMuted(writeMuted(KEY, on)); },
        });
      };
      wire(el('bootBtns'), 'bootSound');
      wire(el('pauseBtns') || el('resumeBtn')?.parentElement, 'pauseSound');
      syncSoundToggles();
    }
    el('resumeBtn')?.addEventListener('click', () => setPaused(false));
    el('pause')?.addEventListener('click', (e) => { if (e.target === el('pause')) setPaused(false); });

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    {
      const setSettings = (patch) => {
        settings = resolveSettings({ ...settings, ...patch });
        saveSettings(settings);
        applySettings();
        return settings;
      };
      
      
      
      const SLIDERS = [
        ['setCamDist', 'outCamDist', 'camDistance'],
        ['setSens', 'outSens', 'sensitivity'],
        ['setSubs', 'outSubs', 'subtitleScale'],
      ];
      for (const [inputId, outId, key] of SLIDERS) {
        const input = el(inputId); const out = el(outId);
        if (!input) continue;
        const show = () => { if (out) out.textContent = `${toPercent(settings[key])}%`; };
        input.value = String(toPercent(settings[key]));
        show();
        input.addEventListener('input', () => {
          setSettings({ [key]: fromPercent(input.value) });
          
          
          
          input.value = String(toPercent(settings[key]));
          show();
        });
      }
      const inv = el('setInvert');
      if (inv) {
        inv.checked = !!settings.invertStick;
        inv.addEventListener('change', () => setSettings({ invertStick: inv.checked }));
      }
      
      const PAUSE_ACCESS = { reducedMotion: 'psReduced', noFlash: 'psFlash', holdStruggle: 'psHold', bigText: 'psText' };
      const BOOT_ACCESS = { reducedMotion: 'acReduced', noFlash: 'acFlash', holdStruggle: 'acHold', bigText: 'acText' };
      const syncAccessBoxes = () => {
        for (const k of ACCESS_KEYS) {
          const a = el(PAUSE_ACCESS[k]); const b = el(BOOT_ACCESS[k]);
          if (a) a.checked = !!access[k];
          if (b) b.checked = !!access[k];
        }
      };
      for (const k of ACCESS_KEYS) {
        const box = el(PAUSE_ACCESS[k]);
        if (!box) continue;
        box.addEventListener('change', () => {
          access = resolveAccess({ ...access, [k]: box.checked }, { prefersReducedMotion: !!calm });
          saveAccess(access);
          applySettings();
          syncAccessBoxes();
        });
      }
      
      
      onPauseOpen = () => {
        syncAccessBoxes();
        for (const [inputId, outId, key] of SLIDERS) {
          const input = el(inputId); const out = el(outId);
          if (input) input.value = String(toPercent(settings[key]));
          if (out) out.textContent = `${toPercent(settings[key])}%`;
        }
        if (inv) inv.checked = !!settings.invertStick;
      };
    }
    el('saveBtn')?.addEventListener('click', async () => {
      const btn = el('saveBtn');
      const st = el('saveState');
      if (btn) btn.disabled = true;
      const save = makeSave(runState(), Date.now());
      const okLocal = writeLocalSave(save);
      
      
      saveProgress({ deck: save.deck, seenIntro: true });
      if (st) st.textContent = okLocal ? 'Saved on this browser…' : 'This browser refused to store the save.';
      if (okLocal) {
        const up = await cloudPush(save);
        if (st) {
          st.textContent = up
            ? `Saved — ${describeSave(save, Date.now())} — and copied to your account.`
            : `Saved — ${describeSave(save, Date.now())} — on this browser.`;
        }
        feh_track('game_saved', { deck: save.deck, cloud: up });
      }
      if (btn) btn.disabled = false;
    });
    
    window.addEventListener('keydown', (e) => {
      if (e.code !== 'Escape' && e.code !== 'KeyP') return;
      if (intro && !intro.done) return;      
      e.preventDefault();
      setPaused(!paused);
    });
    
    
    window.addEventListener('blur', () => { if (!player.dead) setPaused(true); });
    api_setPaused = setPaused;
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  return {
    beginIntro,
    
    
    progress: () => loadProgress(),
    markIntroSeen: () => saveProgress({ seenIntro: true }),
    
    
    
    loadSave(raw) {
      const save = normaliseSave(raw);
      if (!save) return null;
      level = Math.max(1, save.deck);
      buildWorld(level);
      ride = parkedOpen();
      syncLiftColliders();
      
      
      
      
      if (insideLevel(deck, save.x, save.z, 0.3)) {
        player.x = save.x; player.z = save.z; player.yaw = save.yaw;
      } else {
        player.x = deck.start.x; player.z = deck.start.z;
      }
      player.vitals.health = Math.max(1, save.health);
      if (player.vitals.stamina !== undefined) player.vitals.stamina = save.stamina;
      if (save.weapon) {
        try { player.weapon = readyWeapon(save.weapon, { ammo: save.ammo }); } catch {  }
      }
      
      player.latchedBy = null; player.struggle = null;
      for (const b of birds) b.latched = false;
      saveProgress({ deck: level, seenIntro: true });
      return level;
    },
    
    
    
    
    
    
    
    
    
    
    resumeAt(deckNo) {
      const n = Math.max(1, Math.floor(deckNo) || 1);
      level = n;
      buildWorld(n);
      ride = parkedOpen();
      syncLiftColliders();
      
      
      player.x = deck.start.x;
      player.z = deck.start.z;
      player.vitals.health = MAX_HEALTH;
      
      
      
      camState = null;
      saveProgress({ deck: n });
      return level;
    },
    
    setAccess(patch) {
      access = resolveAccess({ ...access, ...patch }, { prefersReducedMotion: !!calm });
      saveAccess(access);
      applyAccess();
      return { ...access };
    },
    getAccess() { return { ...access }; },
    introActive: () => !!(intro && !intro.done),
    
    
    
    
    
    
    
    beginRun() { menuUp = false; },
    player, birds, touch, faces, head: xHead, neck,
    
    
    
    
    get lockers() { return lockers; },
    get safeRoom() { return safeRoom; },
    get deck() { return deck; },
    debug: createDebug(ctx),
  };
}

export { promptFor };


























function wireCoopMenu(api, go) {
  const coop = () => (api.debug && api.debug.coop) || null;
  const el = (id) => document.getElementById(id);
  const statusEl = el('coopStatus');
  const card = el('coopCard');
  const idEl = el('coopId');
  const linkEl = el('coopLink');
  const joinRow = el('coopJoin');
  if (!statusEl) return;

  const show = () => {
    const c = coop();
    if (!c) return;
    statusEl.textContent = c.status || '';
    if (!c.code) { card.style.display = 'none'; return; }
    card.style.display = 'block';
    idEl.textContent = (c.spoken || c.code).toUpperCase();
    const link = c.mode === 'host' && globalThis.location
      ? `${globalThis.location.origin}${globalThis.location.pathname}?join=${encodeURIComponent(c.code)}`
      : '';
    linkEl.textContent = link;
  };
  
  
  
  const poll = setInterval(show, 500);

  const begin = () => { clearInterval(poll); go(); };

  el('hostBtn')?.addEventListener('click', () => {
    const c = coop();
    if (!c) return;
    c.host();
    show();
    
    
    
    
    
    
    statusEl.textContent = 'Room open. Read out the code, then press BEGIN.';
  });
  el('joinBtn')?.addEventListener('click', () => {
    joinRow.style.display = 'block';
    joinRow.dataset.watch = '0';
    el('coopCode')?.focus();
  });
  el('watchBtn')?.addEventListener('click', () => {
    joinRow.style.display = 'block';
    joinRow.dataset.watch = '1';
    el('coopCode')?.focus();
  });
  const doJoin = () => {
    const c = coop();
    if (!c) return;
    const typed = el('coopCode')?.value || '';
    const r = c.join(typed, joinRow.dataset.watch === '1');
    show();
    
    if (r && r.error) { statusEl.textContent = r.error; return; }
    setTimeout(begin, 60);
  };
  el('coopGo')?.addEventListener('click', doJoin);
  el('coopCode')?.addEventListener('keydown', (e) => { if (e.code === 'Enter') doJoin(); });
  el('localBtn')?.addEventListener('click', () => {
    const c = coop();
    if (!c) return;
    c.local();
    show();
    setTimeout(begin, 60);
  });

  
  
  
  
  const linked = coop()?.mode === 'off' ? joinFromUrl() : null;
  if (linked) {
    el('coopCode') && (el('coopCode').value = linked);
    joinRow.style.display = 'block';
    joinRow.dataset.watch = '0';
    statusEl.textContent = 'Joining from a link...';
    setTimeout(doJoin, 200);
  }
}


function joinFromUrl() {
  try {
    const u = new URL(globalThis.location.href);
    const v = u.searchParams.get('join');
    return v && /^[A-Za-z-]{3,20}$/.test(v) ? v : null;
  } catch { return null; }
}

function start() {
  lockZoom();
  
  
  
  
  installAudioUnlock();
  
  
  
  
  
  
  
  
  
  
  try { sfxSheet.load(); } catch {  }
  try { voxSheet.load(); } catch {  }
  
  
  try { initAnalytics(); trackEvent('game_open', { game: 'farmy-evil-hills' }); } catch {  }
  $('tapeMini').addEventListener('click', () => {
    const playing = tape.toggle();
    $('tapeMini').classList.toggle('on', tape.audible);
    $('tapeCap').textContent = playing ? tape.sideName : 'OFF';
  });
  $('again').addEventListener('click', () => window.location.reload());
  $('qteBtn').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const st = window.__feh && window.__feh.player && window.__feh.player.struggle;
    if (st) st.press('tap');
  });

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  {
    const pad = $('qtePad');
    const dot = $('qteDot');
    const toUnit = (e) => {
      const r = pad.getBoundingClientRect();
      const half = r.width / 2;
      if (!(half > 0)) return null;
      return {
        x: (e.clientX - (r.left + half)) / half,
        
        
        
        y: -(e.clientY - (r.top + r.height / 2)) / half,
      };
    };
    const showDot = (p) => {
      if (!p) { dot.style.opacity = '0'; return; }
      const r = pad.getBoundingClientRect();
      const half = r.width / 2;
      dot.style.transform = `translate(${p.x * half}px, ${-p.y * half}px)`;
      dot.style.opacity = '0.9';
    };
    let drawing = false;
    const sample = (e) => {
      const st = window.__feh && window.__feh.player && window.__feh.player.struggle;
      if (!st) return;
      const p = toUnit(e);
      if (!p) return;
      st.point(p.x, p.y);
      showDot(p);
    };
    pad.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      drawing = true;
      try { pad.setPointerCapture(e.pointerId); } catch {  }
      sample(e);
    });
    pad.addEventListener('pointermove', (e) => {
      if (!drawing) return;
      e.preventDefault();
      sample(e);
    });
    const end = (e) => {
      if (!drawing) return;
      drawing = false;
      showDot(null);
      const st = window.__feh && window.__feh.player && window.__feh.player.struggle;
      
      
      
      if (st && typeof st.release === 'function') st.release();
      if (e && e.pointerId != null) {
        try { pad.releasePointerCapture(e.pointerId); } catch {  }
      }
    };
    pad.addEventListener('pointerup', end);
    pad.addEventListener('pointercancel', end);
    pad.addEventListener('pointerleave', end);
  }

  
  
  
  
  
  
  
  try {
    const api = boot($('game'), hud);
    window.__feh = api;
    if (api) {
      let started = false;
      
      
      
      
      
      
      
      document.body.classList.add('modalOpen', 'bootOpen');
      let resumeDeck = 0;
      
      let resumeSave = null;
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      const go = () => {
        if (started) return;
        
        
        
        
        if (api.introActive && api.introActive()) return;
        started = true;
        
        
        
        
        if (api.beginRun) api.beginRun();
        $('boot').style.display = 'none';
        
        
        document.body.classList.remove('modalOpen', 'bootOpen');
        $('hint').style.display = 'block';
        
        
        
        audio.ensure();
        
        
        
        
        
        
        try { if (api.debug.coop.active) api.debug.coop.begin(); } catch {  }
        
        
        
        
        
        const seen = api.progress && api.progress() && api.progress().seenIntro;
        
        
        
        
        
        let inRoom = false;
        try { inRoom = !!(api.debug && api.debug.coop.active); } catch { inRoom = false; }
        if (api.beginIntro && !seen && !resumeDeck && !inRoom) {
          
          
          
          
          if (api.markIntroSeen) api.markIntroSeen();
          api.beginIntro(() => { startStationAudio(); });
          return;
        }
        if (resumeSave && api.loadSave) api.loadSave(resumeSave);
        else if (resumeDeck && api.resumeAt) api.resumeAt(resumeDeck);
        startStationAudio();
      };
      
      
      
      
      
      const startStationAudio = () => {
        if (!tape.audible) {
          tape.toggle();
          $('tapeMini').classList.toggle('on', tape.audible);
          $('tapeCap').textContent = tape.sideName;
        }
        roomTone();
      };
      
      
      
      
      {
        const boxes = {
          reducedMotion: $('acReduced'), noFlash: $('acFlash'),
          holdStruggle: $('acHold'), bigText: $('acText'),
        };
        const cur = api.getAccess ? api.getAccess() : {};
        for (const k of ACCESS_KEYS) {
          const box = boxes[k];
          if (!box) continue;
          box.checked = !!cur[k];
          box.addEventListener('change', () => {
            if (api.setAccess) api.setAccess({ [k]: box.checked });
          });
        }
      }
      $('startBtn').addEventListener('click', () => { resumeDeck = 0; go(); });
      
      {
        const prog = api.progress ? api.progress() : null;
        
        
        
        
        
        let saved = null;
        try { saved = normaliseSave(localStorage.getItem(SAVE_KEY)); } catch { saved = null; }
        if (saved || (prog && prog.deck > 1)) {
          const btn = $('contBtn');
          const num = $('contDeck');
          if (btn && num) {
            num.textContent = String(saved ? saved.deck : prog.deck);
            btn.style.display = 'inline-block';
            
            
            
            
            
            btn.classList.add('primary');
            $('startBtn')?.classList.remove('primary');
            if (saved) {
              const line = document.createElement('div');
              line.style.cssText = 'margin-top:6px;opacity:.5;font-size:11px';
              line.textContent = describeSave(saved, Date.now());
              btn.insertAdjacentElement('afterend', line);
            }
            btn.addEventListener('click', () => {
              resumeDeck = saved ? saved.deck : prog.deck;
              resumeSave = saved;
              go();
            });
          }
          const note = $('bootNote');
          
          
          
          
          if (note) {
            note.textContent = (saved || (prog && prog.seenIntro))
              ? 'BEGIN starts a new run from deck 1 · sound on'
              : 'opens with a short film · sound on · any key skips it';
          }
        }
      }
      
      
      
      
      
      
      wireCoopMenu(api, go);
      
      
      
      
      
      
      try {
        mountLiveBadge({
          host: $('liveHost'),
          mine: () => (window.__feh && window.__feh.debug.coop.code) || null,
          onJoin: (room) => {
            const path = LIVE_PATH[room.game];
            if (!path) return false;
            globalThis.location.href = `${path}?join=${encodeURIComponent(room.code)}`;
            return true;
          },
        });
      } catch {  }
      $('boot').addEventListener('click', (e) => {
        
        
        
        
        if (e.target && e.target.closest && e.target.closest('#coop')) return;
        go();
      });
      document.addEventListener('keydown', (e) => {
        if (document.activeElement && document.activeElement.id === 'coopCode') return;
        if (e.code === 'Space' || e.code === 'Enter') go();
      });
    }
  } catch (err) {
    hud.fatal(`The station did not come up.<br><small style="opacity:.6">${String(err).slice(0, 300)}</small>`);
    throw err;
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
