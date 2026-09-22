


























































import * as THREE from 'three';
import { curveUniforms, windUniforms, waterUniforms } from '../render/material.js';
import { createSky } from '../render/sky.js';
import { createDaylight } from '../render/daylight.js';
import { createNightLights } from '../render/nightLights.js';
import { createParticles } from '../render/particles.js';
import { createInsects } from '../render/insects.js';
import { createBirds } from '../render/birds.js';
import { createPost } from '../render/post.js';
import { buildMoonScene } from '../lookdev/scene.js';





import { createCharacter } from '../render/character.js';
import { itemObject } from '../render/items.js';
import { TOOL_GRIP } from 'moon/art/item.mjs';
import { iconFor, portraitOf } from '../render/icons.js';
import { PLAYER_BUILD_KEY, PLAYER_BUILDS, PLAYER_NAMES, choosePlayerBuild } from 'moon/play/people.mjs';
import { createPlayerChoice } from './playerChoice.js';
import { createInput } from './input.js';
import { createOrchardDraw } from './orchardDraw.js';
import { createPopsDraw } from './popsDraw.js';
import { createHud } from './hud.js';
import { dayCycle, wrapHours } from 'moon/light/dayCycle.mjs';
import { flicker } from 'moon/light/flicker.mjs';


const FIRE_FLICKER_SEED = 4.7;
import { dayLine } from 'moon/play/dayline.mjs';
import { localHour } from 'moon/play/localClock.mjs';
import { SETTINGS, tierFromParam, decideTier, medianInterval, createTierWatch, isWorse, readTier, writeTier, rendererFlags, isCapturing } from 'moon/light/quality.mjs';
import { createTiming, timingLine } from 'moon/play/timing.mjs';
import { createDrawGate, createLoadingView } from 'moon/play/loading.mjs';
import { createPerfSampler } from 'moon/play/perfSample.mjs';
import { shouldStartAnalytics } from 'moon/play/liveHostGate.mjs';
import { createFunnel } from 'moon/play/funnel.mjs';
import { CURVE_K, bendDrop } from 'moon/world/curve.mjs';
import { heightAt, placements, setTerrainDelta, ISLAND_RADIUS } from 'moon/world/moonLayout.mjs';
import {
  createCollisionWorld, treeObstacle, PLAYER_RADIUS_M, FOOTPRINTS,
  obstaclesWithoutRuntime, buildingObstacle, plotObstacle, roomObstacle, toWorld,
} from 'moon/world/collision.mjs';
import { step, createPlayer, FEEL } from 'moon/play/movement.mjs';
import { CAMERA, framing, aimPoint, createFollow, followStep, cameraPose } from 'moon/play/followCamera.mjs';
import { SPAWN } from 'moon/play/spawn.mjs';
import { newWorld, act, advance, jobSlotsOf, summarize, upgradeCost, whyCannot } from 'moon/economy/world.mjs';



import { SAVE_SLOT, fitsMoon, legacyDoc, makeSave, readSave, restoreWorld } from 'moon/economy/save.mjs';
import { awayReport, createSaver } from 'moon/play/saving.mjs';
import { openSaveStore } from './saveDb.js';
import { BUILDINGS } from 'moon/economy/tables.mjs';
import { shopOf } from 'moon/economy/shop.mjs';
import { homeMoon } from 'moon/world/startWorld.mjs';
import { orchardView, diffOrchard, countByStage, fallYaw } from 'moon/play/orchard.mjs';
import { INTERACT, chooseTarget, promptFor, pressHold, holdStep, fellAction, tapPick, seedKinds, nextSeedKind, targetKey, trunkRadius } from 'moon/play/interact.mjs';



import { buildingObject, buildingAnchors } from '../render/buildings.js';
import { plotObject, plotProblems } from './buildPlot.js';
import { createShelvesDraw } from './shelvesDraw.js';
import { createCustomersDraw } from './customersDraw.js';
import { createCards } from './cards.js';
import { createWorldUi } from './worldUi.js';
import { createCoinSound } from './coinSound.js';
import { createSfx } from './sfx.js';
import { createMusic } from './music.js';
import { createAmbience } from './ambience.js';
import { CUES } from 'moon/audio/cues.mjs';
import { PATCHES } from 'moon/audio/patches.mjs';




import * as SCORE from 'moon/audio/score.mjs';
import * as MIX from 'moon/audio/mix.mjs';
import { silenceOf } from 'moon/audio/silence.mjs';


import * as AMBIENCE from 'moon/audio/ambience.mjs';


import { cueForEvents } from 'moon/audio/verbs.mjs';
import { createFootsteps } from 'moon/audio/footsteps.mjs';
import { recipeMenu, assignStations, stationViews, processorOf } from 'moon/play/processing.mjs';
import { collectSales, customerRoute, pruneVisits } from 'moon/play/customers.mjs';
import { MONEY, coinTarget, countStep, flightsAt, iconsFor, landedBetween, paidBetween } from 'moon/play/money.mjs';
import { toPlacementFrame } from 'moon/play/shelves.mjs';

import { generate as generateCat } from 'moon/art/cat.mjs';
import { toObject3D } from '../render/toMesh.js';
import { startTalk, talkNode, choose } from 'moon/play/talk.mjs';
import { MET_CAT, MET_MOLE, meet, metList, readMet, villagerKey, visitsOf } from 'moon/play/met.mjs';
import { createAudio } from './audio.js';
import { createVoice } from './voice.js';
import { createSoundCard } from './soundCard.js';




import { slowLine, spanKeep, spanThreshold } from './spanBudget.js';


import { createCardBack } from './cardBack.js';
import { createTalkCard } from './talkCard.js';
import { PARCELS, ownedIds, forSale, landView, parcelAt, signPoint } from 'moon/world/parcels.mjs';
import { obstacleFor as signObstacleFor } from 'moon/world/collision.mjs';
import { createLandDraw } from './landDraw.js';



import { exitPlaces, homePlaces, insideSpot, inRoom, ownsHome, playerHome, roomWalls } from 'moon/play/playerHome.mjs';
import { createInteriorDraw } from './interior.js';
import { createSignLabels } from './signLabels.js';




import {
  createVillage, badgeState, homeOf, homeStage, syncHomes, villagerPose, VILLAGE, PLAYER_TUNED, PLAYER_TUNED_HEIGHT_M, playerFit,
} from 'moon/play/village.mjs';
import { startTalk as startVillagerTalk, talkNode as villagerTalkNode, choose as chooseVillagerTalk, speakerOf, knockLine } from 'moon/play/villagerTalk.mjs';



import { mayEnter, villagerHomePlaces } from 'moon/play/enterable.mjs';





import { MOLE, createMole, moleView, stepMole, surfaceMole } from 'moon/play/mole.mjs';
import { startTalk as startMoleTalk, talkNode as moleTalkNode, choose as chooseMoleTalk } from 'moon/play/moleTalk.mjs';
import { createMoleDraw } from '../render/mole.js';
import { DAY_MS, hourAt, isDark } from 'moon/economy/clock.mjs';
import { homeObstacle, homeRoomObstacle } from 'moon/world/collision.mjs';
import { createVillagersDraw, villagerSpecs } from './villagersDraw.js';
import { villagerSource } from '../render/villagerSource.js';
import { createLevelBadges } from './levelBadge.js';
import { createHomesDraw } from './homesDraw.js';
import { createPondsDraw } from './pondsDraw.js';

import { forageSpots } from 'moon/world/forage.mjs';
import { forageObstacle } from 'moon/world/collision.mjs';
import { AUTO, chooseTool, choiceFor, forageTargets, keepChoice, rockTargets } from 'moon/play/tools.mjs';


import { CLOSED, closeCorners, cornerIsOpen, toggleCorner } from 'moon/play/corners.mjs';
import { forageIsReady } from 'moon/economy/world.mjs';
import { createToolBar } from './toolBar.js';
import { createForageDraw } from './forageDraw.js';

import { CRAFTABLES, CRAFT_CATEGORIES } from 'moon/economy/tables.mjs';
import { craftedName } from 'moon/economy/crafting.mjs';
import { craftMenu, madeCount, madeTray } from 'moon/play/craft.mjs';
import { placeSpot, placedFootprints, placedObstacle, placedTargets, whyNotPlaceHere } from 'moon/play/placing.mjs';
import { heftOf } from 'moon/play/heft.mjs';
import { placedLightSources } from 'moon/light/placedLights.mjs';





import {
  furnishSpot, furnishedSpot, furnitureFootprints, furnitureObstacle, furnitureTargets,
  isFurnitureItem, roomOf, whyNotFurnishHere,
} from 'moon/play/furnishing.mjs';



import {
  BRUSHES, BRUSH_NAMES, TERRAFORM, applyBrush, deltaField, pondObstacle, terrainOf, whyNotShape,
} from 'moon/world/terraform.mjs';
import { BAR_HIDDEN, barState } from 'moon/play/tools.mjs';
import { anchorsOf } from 'moon/art/decor.mjs';
import { decorIconFor } from '../render/icons.js';
import { createPlacedDraw } from './placedDraw.js';
import { createCraftCard } from './craftCard.js';

import { counterAt, noticeView, storeView, townPlaces } from 'moon/play/town.mjs';
import { TOWN_SPOTS } from 'moon/world/moonLayout.mjs';
import { townOf } from 'moon/economy/town.mjs';


import * as MOON from 'moon/world/moonLayout.mjs';
import {
  GENERATED_COUNT, SYSTEM_SEED, describe as describePlanet, landingOn, layoutOf, nextPlanetId, planetAt, planetSystem,
} from 'moon/world/planets.mjs';
import {
  FLIGHT, JUMP, airStep, createJump, holdAt, holdDone, holdStart, launch,
  onGround as feetOnGround, overDestination, poseOf, startHop, tapJump,
} from 'moon/play/flight.mjs';



import { createPlaceNotice } from './placeNotice.js';
import { createGuideUi } from './guideUi.js';
import { EDGE_MARGIN_M, obstaclesFrom } from 'moon/world/collision.mjs';

import { describeFinds, findsOnPlanet, offsetOf, systemFinds } from 'moon/world/collectibles.mjs';
import { findIsReady } from 'moon/economy/world.mjs';
import { FINDS } from 'moon/economy/tables.mjs';
import { createFindsDraw } from './findsDraw.js';






import { artStageOfPine, describeWild, forageOffsetOf, systemWild } from 'moon/world/wild.mjs';
import { forageOn as economyForageOn, placedOn, rocksOn, treesOn } from 'moon/economy/world.mjs';
import { forageOn as planetForage } from 'moon/world/planets.mjs';











import { PeerMesh } from 'net/peerMesh.js';
import { createSession, roomCode } from 'moon/play/session.mjs';
import { whyGuestCannot } from 'moon/play/visiting.mjs';
import { visitorsOn } from 'moon/play/visitors.mjs';
import { createLobbyPoll, lobbyAvailable, publishMoon } from './rooms.js';
import { createVisitCard } from './visitCard.js';
import { createVisitorsDraw } from './visitorsDraw.js';




import { doShare, joinCodeOf, sharePayload, shareParams } from 'moon/play/sharing.mjs';





import { netWorth } from 'moon/economy/netWorth.mjs';
import { BOARD_BEST_KEY, myRow } from 'moon/play/leaderboard.mjs';
import { createBoardCard } from './boardCard.js';

import { createDeedsCard } from './deedsCard.js';
import { createShapeCard } from './shapeCard.js';
import { deedLines, deedsOf, tally as tallyDeeds, visitPlanet } from 'moon/play/deeds.mjs';

import { abandon as abandonGoal, accept as acceptGoal, doneLines as goalDoneLines, goalView, goalsOf, settle as settleGoals } from 'moon/play/goals.mjs';
import {
  ASSEMBLY, assemblyOf, assemblyView, bellAt, bellPlaces, callAssembly, closeAssembly,
  gatherPose, gatherSpots, polyline, putToVote, settleWorks, whyNoAssembly, worksOf,
} from 'moon/play/assembly.mjs';
import { createAssemblyCard } from './assemblyCard.js';
import { walkPath } from 'moon/play/walks.mjs';

import { createInstallCard } from './installCard.js';
import { createOffline } from './offline.js';




import { createAccountCard } from './accountCard.js';
import { createCloud } from './cloud.js';

let presses = 0;               





import { AUTO_HIDE, autoHideStart, autoHideStep } from 'moon/play/autoHide.mjs';
import { refusalOf } from 'moon/play/actButton.mjs';
import { createMenu } from './menu.js';



import { createScreenFit } from './screenFit.js';


const SHADOW_EXTENT_M = 22;



const CROP_HEIGHT_M = 2.0;
const CROP_OUT_M = 1.1;
const CUT_HEIGHT_M = 0.6;

const q = new URLSearchParams(location.search);
const pinnedTier = tierFromParam(q.get('tier'));


const startAnalytics = shouldStartAnalytics({
  hostname: location.hostname, protocol: location.protocol, force: q.get('analytics') === '1',
});
const scaleParam = Number(q.get('timescale') ?? 1);
const animParam = Number(q.get('anim') ?? 1);


windUniforms.uFmlWind.value = q.get('wind') === '0' ? 0 : 1;





const waterParam = q.get('water') === '0' ? 0 : 1;





const timeParam = q.get('time');
const tzOffsetMin = q.get('shot') === '1' && q.get('tz') !== null ? Number(q.get('tz')) : new Date().getTimezoneOffset();
const localNowMs = () => (q.get('shot') === '1' && q.get('now') !== null ? Number(q.get('now')) : Date.now());
const state = {
  anim: Number.isFinite(animParam) && animParam > 0 ? animParam : 1,
  season: q.get('season') || 'summer',
  time: timeParam !== null ? Number(timeParam) : localHour(localNowMs(), tzOffsetMin),
  seed: Number(q.get('seed') || 1),
  carrying: q.get('carry') === '1',
  timescale: Number.isFinite(scaleParam) && scaleParam >= 0 ? scaleParam : 1,
  muted: q.get('mute') === '1',
  
  
  system: Number(q.get('system') || SYSTEM_SEED),
  planet: Math.max(0, Math.min(GENERATED_COUNT, Number(q.get('planet') || 0))),
};
if (q.get('shot') === '1') document.body.classList.add('shot');








const deviceStorage = (() => {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
})();
const rememberedTier = pinnedTier ? null : readTier(deviceStorage);
const tier = pinnedTier || rememberedTier || 'high';
let settings = SETTINGS[tier];
waterUniforms.uFmlWater.value = waterParam * settings.water;
const fml = (window.__fml = {
  
  
  
  
  
  
  
  
  
  
  
  ready: false, drawing: false, warmFrames: 0,
  error: null, state, tier, settings, rememberedTier, tierChanges: [],
  player: { x: SPAWN.x, z: SPAWN.z, heading: SPAWN.heading, speed: 0 },
  drawCalls: 0, triangles: 0, fps: 0, pickUps: 0, carrying: state.carrying, stick: null, frames: 0, track: null,
  
  
  
  memory: null,
  problems: [], missing: [], notes: [],
  interact: null, actions: 0, lastEvents: [], lastTap: null,
  timing: {},
});






















const funnel = createFunnel({ send: sendPerfSample });




fml.funnel = funnel;


const SALE_EVENTS = new Set([
  'sale',         
  'sellTo',       
  'fillRequest',  
]);












function noteEconomyEvents(events) {
  if (!events || !events.length) return;
  for (const e of events) {
    if (SALE_EVENTS.has(e.type)) {
      funnel.sale({ coins: Math.round(Number(e.coins) || 0) });
    } else if (e.type === 'buyParcel') {
      
      
      funnel.parcelBought(e.parcel, { parcels: e.parcels, coins: Math.round(Number(e.coins) || 0) });
    }
  }
}


























const loadingEl = document.getElementById('loading');
const loadingSay = document.getElementById('loadingsay');
const loadingFill = document.getElementById('loadingfill');
const loadingView = createLoadingView();
fml.loading = { phase: loadingView.label, percent: 0, gone: false };







function hideLoading() {
  fml.loading = { ...fml.loading, percent: 100, gone: true };
  if (!loadingEl || !loadingEl.isConnected) return;
  loadingEl.classList.add('gone');
  const drop = () => { if (loadingEl.isConnected) loadingEl.remove(); };
  loadingEl.addEventListener('transitionend', drop, { once: true });
  
  
  
  setTimeout(drop, 1200);
}

function sayLoading() {
  const view = loadingView.step(fml.timing);
  if (view.done) { hideLoading(); return; }
  if (!view.changed || !loadingEl) return;
  fml.loading = { phase: view.label, percent: view.percent, gone: false };
  loadingSay.textContent = view.label;
  loadingFill.style.width = `${view.percent}%`;
}

const timing = createTiming({ now: () => performance.now(), into: fml.timing, onMark: sayLoading });
timing.mark('modules');
const hudText = document.getElementById('hud');

hudText.hidden = q.get('hud') !== '1';

const canvas = document.getElementById('view');





const flags = rendererFlags({
  settings,
  devicePixelRatio: window.devicePixelRatio,
  coarsePointer: typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches,
  capturing: isCapturing(q, navigator),
});
const renderer = new THREE.WebGLRenderer({ canvas, ...flags });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.pixelRatio));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.info.autoReset = false;
curveUniforms.uCurve.value = CURVE_K;

const scene = new THREE.Scene();



const pondsDraw = createPondsDraw({ scene });
const camera = new THREE.PerspectiveCamera(CAMERA.landscape.fovDeg, 1, 0.1, 700);
const sky = createSky();
scene.add(sky.mesh);
sky.anchorYaw = -CAMERA.yawRad;

let skyMasked = false;
fml.skyMask = (on) => { skyMasked = Boolean(on); sky.mesh.visible = !on; scene.background = on ? new THREE.Color(0xff00ff) : null; };

const INSIDE_BACKDROP = new THREE.Color(0x1a1420);
const daylight = createDaylight(scene, settings, { shadowExtent: SHADOW_EXTENT_M });
let night = null, post = null, character = null, collision = null, orchard = null, pops = null;



let staticSources = [];
let insects = null;         
let birds = null;           
let particles = null;       
let staticObstacles = [], baseTriangles = 0;



const covers = [];














const SYSTEM = planetSystem(state.system, GENERATED_COUNT);



let planetId = 0;
let layout = MOON;
const groundNow = (x, z) => layout.heightAt(x, z);
const onHome = () => planetId === 0;



const seasonNow = () => (onHome() ? state.season : planetAt(planetId, state.system, GENERATED_COUNT).season);
const permanent = new Set();          
const visited = new Map();            
let homeCollision = null;






const worldCollision = () => (inside ? homeCollision : collision);






let interiorDraw = null;
let inside = null;
let wentInAt = null;
let goingThroughDoor = false;         
let air = null;                       
let jumpState = createJump();
let flightTo = null;                  
let flightScene = null;               





const ROOM_LAYOUT = { ...MOON, heightAt: () => 0 };



const INSIDE_CAM_DIST = 0.38;
let frameNow = framing(1);
function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  frameNow = framing(camera.aspect);
  camera.fov = frameNow.fovDeg;
  camera.updateProjectionMatrix();
  if (post) post.setSize(w, h);
}
window.addEventListener('resize', resize);
resize();

let player = createPlayer(SPAWN.x, SPAWN.z, SPAWN.heading);
let follow = createFollow(aimPoint(player, groundNow(player.x, player.z)));
const target = new THREE.Vector3();












const feet = createFootsteps();
const resetTrack = (x, z) => {
  fml.track = { minX: x, maxX: x, minZ: z, maxZ: z, maxR: Math.hypot(x, z) };
  feet.reset();
};
resetTrack(player.x, player.z);

fml.teleport = (x, z, heading = 0) => {
  player = createPlayer(x, z, heading);
  follow = createFollow(aimPoint(player, groundNow(x, z), cameraFit()));
  resetTrack(x, z);
  return true;
};




const P = placements();
const clock0 = Date.now(), wall0 = performance.now();
let skippedMs = 0;
const wallNow = () => Math.floor(clock0 + (performance.now() - wall0) * state.timescale + skippedMs);

const FORAGE_SPOTS = forageSpots(1);






const SYSTEM_FINDS = systemFinds(state.system, GENERATED_COUNT);





const SYSTEM_WILD = systemWild(state.system, GENERATED_COUNT);






const HOME_START = homeMoon({ layout: P, spots: FORAGE_SPOTS });
const world = newWorld({
  seed: 1, now: wallNow(),
  wildTrees: [...HOME_START.wildTrees, ...SYSTEM_WILD.trees],
  rocks: [...Array.from({ length: HOME_START.rocks }, () => ({})), ...SYSTEM_WILD.rocks],
  forageSpots: [...HOME_START.forageSpots, ...SYSTEM_WILD.forage],
  finds: SYSTEM_FINDS,
  tzOffsetMin,
});










const econNow = () => Math.max(wallNow(), world.clockAt);






let firstPlayed = world.createdAt;

const ROCK_TARGETS = rockTargets(world, P, { planet: 0 });
const FORAGE_TARGETS = forageTargets(world, FORAGE_SPOTS, { planet: 0 });



const wildTargets = new Map();
function targetsHere() {
  if (onHome()) return { rocks: ROCK_TARGETS, forage: FORAGE_TARGETS, spots: FORAGE_SPOTS };
  if (!wildTargets.has(planetId)) {
    const planet = planetAt(planetId, state.system, GENERATED_COUNT);
    const places = layoutOf(planet).placements();
    const spots = planetForage(planet);
    wildTargets.set(planetId, {
      rocks: rockTargets(world, places, { planet: planetId }),
      forage: forageTargets(world, spots, { planet: planetId }),
      spots,
    });
  }
  return wildTargets.get(planetId);
}

const FORAGE_PLANT_OBSTACLES = FORAGE_SPOTS.map((s) => ({ shape: 'circle', module: 'forage', x: s.x, z: s.z, r: s.r, reach: s.r }));
let toolChoice = AUTO;      
let forageDraw = null;






const wildForageDraws = new Map();
let forageProblems = () => {};
function forageHere() {
  if (onHome()) return null;
  if (!wildForageDraws.has(planetId)) {
    const planet = planetAt(planetId, state.system, GENERATED_COUNT);
    
    
    
    const base = FORAGE_SPOTS.length + forageOffsetOf(planetId, state.system, GENERATED_COUNT);
    const spots = planetForage(planet).map((sp) => ({ ...sp, id: base + sp.id }));
    const draw = createForageDraw({
      scene, season: planet.season, spots, heightAt: (x, z) => groundNow(x, z), onProblems: forageProblems,
    });
    permanent.add(draw.group);
    wildForageDraws.set(planetId, draw);
  }
  return wildForageDraws.get(planetId);
}

function syncForage(t, focus) {
  forageDraw.group.visible = onHome();
  if (onHome()) forageDraw.update(world, t, focus);
  for (const [id, draw] of wildForageDraws) {
    draw.group.visible = !onHome() && id === planetId;
    if (draw.group.visible) draw.update(world, t, focus);
  }
  const here = forageHere();
  if (here) { here.group.visible = true; here.update(world, t, focus); }
}



let findsDraw = null;
let findsShown = '';        
function findsHere() {
  if (onHome()) return [];
  const base = offsetOf(planetId, state.system, GENERATED_COUNT);
  const t = econNow();
  return findsOnPlanet(planetAt(planetId, state.system, GENERATED_COUNT)).map((f) => {
    const record = world.finds[base + f.id];
    return {
      id: base + f.id, kind: f.kind, good: FINDS[f.kind].good, treasure: Boolean(FINDS[f.kind].treasure),
      container: f.container, style: f.style, rotY: f.rotY,
      x: f.x, y: f.y, z: f.z, r: f.r,
      ready: Boolean(record) && findIsReady(record, t),
    };
  });
}

const findPlaces = () => findsHere().filter((f) => f.ready).map((f) => ({ type: 'find', id: f.id, x: f.x, z: f.z, r: f.r }));

const radiusOf = (item) => anchorsOf(item).r;
const blocksOf = (item) => Boolean(CRAFTABLES[item] && CRAFTABLES[item].blocks);
let placedDraw = null, craftCard = null;
let craftTab = CRAFT_CATEGORIES[0];   
let craftPick = null;                 
let placing = null;                   
let placeWhy = null, placeAt = null;  
let toolBarState = BAR_HIDDEN;        




let corners = CLOSED;
const placedKeys = new Set();         




let shaping = null;                   
let shapeWhy = null, shapeAt = null;







let shapeCard = null;                 
let homeScene = null;                 
let terrainField = null;              
let terrainSig = null;                
const pondKeys = new Set();           



let roomDraw = null;
const sizeOf = (item) => anchorsOf(item);
const furnitureKeys = new Set();

let view = [];              
let aim = null;             
let prompt = null;          
let hold = null, holdProgress = 0;




let holdStartedAt = 0;
let prefer = null;          
let seedKind = null;
let seconds = 0;            



let animSeconds = 0;


const SHOP_P = P.find((p) => p.role === 'shop');
const PRESS_P = P.find((p) => p.role === 'processor');
const CAT_P = P.find((p) => p.module === 'cat');


const CUSTOMER_ENTRY = [{ x: -14.5, z: -2.0 }, { x: -11, z: 0.0 }];
const CUSTOMER_EXIT = [{ x: -11, z: 0.5 }, { x: -14.5, z: -1.5 }];

const TIMER_LIFT_M = 1.6;
const CARD_LIFT_M = 2.3;

const POP_SHOWN_MAX = 6;

const anchorsFor = (type, stage) => buildingAnchors(type, { seed: (type === 'shop' ? SHOP_P : PRESS_P).seed, stage });
let shopAnchors = anchorsFor('shop', 'level1');
let pressAnchors = anchorsFor('processor', 'level1');
let route = customerRoute(SHOP_P, shopAnchors, { entry: CUSTOMER_ENTRY, exit: CUSTOMER_EXIT });
let visits = [];            
let assignment = [];        
const batchChoice = {};     
let card = null;            
let shownCoins = 0, lastMoneyT = null;
const money = { landed: 0, paid: 0 };
let shopDrawn = '', pressDrawn = '', shopObj = null, pressObj = null, buildingsLoading = 0;
const buildingTris = { shop: 0, press: 0 };
let shelvesDraw = null, customersDraw = null, cards = null, ui = null;







const audio = createAudio({
  muted: state.muted,
  limiter: MIX.LIMITER,
  silenceRule: silenceOf,
  
  
  
  
  
  
  onDead: () => {
    if (music) music.stop();
    if (ambience) ambience.stop();
  },
});
const sfx = createSfx({ audio, cues: CUES, patches: PATCHES });
const sound = createCoinSound({ audio, sfx });
const voice = createVoice({ audio });



const music = createMusic({ audio, score: SCORE, mix: MIX });














const isGrassAt = (x, z) => {
  if (!onHome()) return true;
  if (Math.hypot(x, z) > MOON.ISLAND_RADIUS - MOON.RIM_WIDTH) return false;
  if (MOON.pathDistance(x, z) < MOON.PATH_HALF_WIDTH + 0.5) return false;
  if (MOON.plazaDistance(x, z) < 0) return false;
  return true;
};
const ambience = createAmbience({ audio, beds: AMBIENCE, mix: MIX, isGrass: isGrassAt });






function nearestWaterM() {
  let best = Infinity;
  for (const p of placedOn(world, planetId)) {
    const craft = p.spot && CRAFTABLES[p.item];
    if (!craft || craft.category !== 'water') continue;
    const d = Math.hypot(p.spot.x - player.x, p.spot.z - player.z);
    if (d < best) best = d;
  }
  if (onHome() && processorOf(world)) {
    const d = Math.hypot(PRESS_P.x - player.x, PRESS_P.z - player.z);
    if (d < best) best = d;
  }
  return best;
}


state.muted = audio.muted;


let talk = null;            
let talkShown = null;       
let talkVisits = 0;         








let met = readMet(null);
let talkCard = null, catObj = null, catTris = 0, catBob = 0;

const LOOK_S = 0.9;
let lookBlend = 0, lookPoint = null;


let land = null, signLabels = null, landDrawn = '', highlighted = null;
const signKeys = new Set();
const fromCat = (id) => Math.hypot(PARCELS[id].sign.x - CAT_P.x, PARCELS[id].sign.z - CAT_P.z);
function landNearCat(w) {
  const v = landView(w);
  return { ...v, forSale: [...v.forSale].sort((a, b) => fromCat(a.id) - fromCat(b.id)) };
}
const landNow = () => ({ ...landNearCat(world), selected: talk ? talk.selected : null });




const TALK_WALK_MAX_S = 2;        
const TALK_LEAVE_M = 2.5;         
let talkAt = null, talkWalkS = 0;





let talkWith = null;
const villagerVisits = new Map();  












let moleDraw = null, mole = null, moleVisits = 0;
let moleOwned = null, moleOwnedKey = '';


const MOLE_BODY_M = MOLE.moundM * 0.55;
const talkingToMole = () => Boolean(talkWith && talkWith.type === 'mole');
function moleLand(x, z) {
  const key = ownedIds(world).join(',');
  if (key !== moleOwnedKey) { moleOwnedKey = key; moleOwned = new Set(ownedIds(world)); }
  const id = parcelAt(x, z);
  return id !== null && moleOwned.has(id);
}
const molePoint = () => (mole ? { x: mole.x, z: mole.z, y: groundNow(mole.x, mole.z), height: 0.35 } : null);
const village = createVillage({ P });
let villagersDraw = null, levelBadges = null;
const badgeShown = new Map();      
const talkingToVillager = () => Boolean(talkWith && talkWith.type === 'villager');
function speakerPoint() {
  
  
  if (talkingToMole()) {
    const p = molePoint();
    if (p) return p;
  }
  if (talkingToVillager()) {
    const p = villagersDraw && villagersDraw.positionOf(talkWith.id);
    if (p) return p;
  }
  return { x: CAT_P.x, z: CAT_P.z, y: CAT_P.y, height: 0.9 };
}






function playerHeightNow() {
  if (!character) return PLAYER_TUNED_HEIGHT_M;
  const h = character.rig && Number.isFinite(character.rig.height_m) ? character.rig.height_m : character.height;
  return Number.isFinite(h) && h > 0 ? h : PLAYER_TUNED_HEIGHT_M;
}



const cameraFit = () => ({ ...CAMERA, aimHeightM: playerFit(playerHeightNow()).aimHeightM });



function talkHeightM() {
  if (!talkingToVillager()) return playerHeightNow();
  const p = villagersDraw && villagersDraw.positionOf(talkWith.id);
  return p && p.height > 0 ? p.height : playerHeightNow();
}




const talkTall = () => Math.max(1, 0.7 + 0.3 * (talkHeightM() / playerHeightNow()));



function talkSpot() {
  const s = speakerPoint();
  const fit = playerFit(playerHeightNow());
  const tall = talkTall();
  const rx = Math.cos(CAMERA.yawRad), rz = -Math.sin(CAMERA.yawRad); 
  const bx = Math.sin(CAMERA.yawRad), bz = Math.cos(CAMERA.yawRad);  
  const side = (player.x - s.x) * rx + (player.z - s.z) * rz >= 0 ? 1 : -1;
  return {
    x: s.x + rx * side * fit.talkSideM * tall + bx * fit.talkTowardM * tall,
    z: s.z + rz * side * fit.talkSideM * tall + bz * fit.talkTowardM * tall,
  };
}

const talkLeaveM = () => TALK_LEAVE_M * playerFit(playerHeightNow()).scale * talkTall();
const catScreen = () => fml.screenOf(CAT_P.x, CAT_P.y + 0.9, CAT_P.z);

function speakerScreen() {
  if (!talkingToVillager()) return catScreen();
  const s = speakerPoint();
  return fml.screenOf(s.x, s.y + s.height, s.z);
}

function openTalk(target = { type: 'cat' }) {
  if (!talkCard || talk) return;
  stopPlacing(); 
  if (craftCard) craftCard.hide();
  if (target.type === 'mole') {
    if (!mole || !onHome()) return;
    closeCard();
    talk = startMoleTalk({ visits: moleVisits });
    moleVisits += 1;
    if (meet(met, MET_MOLE)) touchSave('met');
    talkWith = { type: 'mole' };
    
    surfaceMole(mole, true);
  } else if (target.type === 'villager') {
    const v = world.villagers.find((x) => x.id === target.id);
    if (!v || !villagersDraw || !villagersDraw.positionOf(v.id)) return;
    closeCard();
    
    
    const n = villagerVisits.get(v.id) ?? visitsOf(met, villagerKey(v.id));
    talk = startVillagerTalk({ villager: v, visits: n });
    villagerVisits.set(v.id, n + 1);
    if (meet(met, villagerKey(v.id))) touchSave('met');
    talkWith = { type: 'villager', id: v.id };
    villagersDraw.hold(v.id, { x: player.x, z: player.z });
  } else {
    closeCard();
    talk = startTalk({ visits: talkVisits });
    talkVisits += 1;
    
    
    if (meet(met, MET_CAT)) touchSave('met');
    talkWith = { type: 'cat' };
  }
  talkAt = talkSpot();
  talkWalkS = 0;
  talkCard.open();
}
function closeTalk() {
  if (!talk) return;
  if (mole) surfaceMole(mole, false);   
  talk = null;
  talkAt = null;
  talkShown = null;
  talkWith = null;
  if (villagersDraw) villagersDraw.release();
  talkCard.close();
}
function onTalkChoice(choice) {
  if (!talk) return;
  
  
  
  if (choice.goal) { if (acceptGoal(world, choice.goal)) touchSave('goal'); }
  else if (choice.drop) { if (abandonGoal(world)) touchSave('goal'); }
  const outcome = choice.action && !choice.why ? doAct(choice.action) : undefined;
  const next = talkingToMole() ? chooseMoleTalk(talk, choice, outcome)
    : talkingToVillager() ? chooseVillagerTalk(talk, choice, outcome)
      : choose(talk, choice, outcome);
  if (next) talk = next; else closeTalk();
}


function syncLand() {
  if (!land) return null;
  const owned = ownedIds(world), key = owned.join(',');
  if (key === landDrawn) return null;
  landDrawn = key;
  const sale = forSale(owned);
  for (const k of signKeys) worldCollision().remove(k);
  signKeys.clear();
  for (const id of sale) {
    const k = `sign:${id}`;
    worldCollision().add(k, signObstacleFor({ module: 'parcelSign', ...PARCELS[id].sign }));
    signKeys.add(k);
  }
  refreshPlantObstacles(); 
  return Promise.resolve(land.show(owned, sale)).catch(fail);
}

function refreshPlantObstacles() {
  
  
  
  
  
  
  
  
  
  
  const base = worldCollision().obstacles.filter((o) => typeof o.key !== 'number');
  if (!onHome()) {
    const spots = targetsHere().spots || [];
    staticObstacles = [
      ...base,
      ...spots.map((sp) => ({ shape: 'circle', module: 'forage', x: sp.x, z: sp.z, r: sp.r, reach: sp.r })),
    ];
    return;
  }
  staticObstacles = [...base, roomObstacle(SHOP_P), roomObstacle(PRESS_P), ...Object.values(village.homes).map(homeRoomObstacle), ...FORAGE_PLANT_OBSTACLES];
}

function swapBuilding(which, p, promise, key) {
  buildingsLoading += 1;
  promise.then((obj) => {
    const current = which === 'shop' ? shopDrawn : pressDrawn;
    if (current !== key) return;
    obj.position.set(p.x, p.y, p.z);
    obj.rotation.y = p.rotY;
    obj.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
    const old = which === 'shop' ? shopObj : pressObj;
    if (old) scene.remove(old);
    scene.add(obj);
    if (which === 'shop') shopObj = obj; else pressObj = obj;
    buildingTris[which] = obj.userData.triangles || 0;
  }).catch(fail).finally(() => { buildingsLoading -= 1; });
}













































const SLOW_MS = spanThreshold(q.get('spanms'));
const SLOW_KEEP = spanKeep(q.get('spankeep'));
const slowSpans = [];




let worstSpan = null;
let slowCount = 0;
function timed(what, fn) {
  const t0 = performance.now();
  try {
    return fn();
  } finally {
    const ms = performance.now() - t0;
    if (ms >= SLOW_MS) {
      
      
      
      
      
      
      
      const span = { what, ms: Math.round(ms * 100) / 100, atMs: Math.round(t0) };
      slowCount += 1;
      slowSpans.push(span);
      if (slowSpans.length > SLOW_KEEP) slowSpans.shift();
      if (!worstSpan || span.ms > worstSpan.ms) worstSpan = span;
    }
  }
}
Object.defineProperty(fml, 'slow', { enumerable: true, get: () => slowSpans.slice() });




Object.defineProperty(fml, 'spans', {
  enumerable: true,
  get: () => ({
    thresholdMs: SLOW_MS,
    keep: SLOW_KEEP,
    count: slowCount,
    last: slowSpans.length ? { ...slowSpans[slowSpans.length - 1] } : null,
    worst: worstSpan ? { ...worstSpan } : null,
  }),
});

function syncBuildings() {
  return timed('syncBuildings', () => syncBuildingsNow());
}
function syncBuildingsNow() {
  const shop = shopOf(world);
  const shopKey = `level${shop.level}`;
  if (shopKey !== shopDrawn) {
    shopDrawn = shopKey;
    shopAnchors = anchorsFor('shop', shopKey);
    route = customerRoute(SHOP_P, shopAnchors, { entry: CUSTOMER_ENTRY, exit: CUSTOMER_EXIT });
    worldCollision().add('shop', buildingObstacle(SHOP_P, shopAnchors.footprint));
    refreshPlantObstacles();
    swapBuilding('shop', SHOP_P, buildingObject('shop', { seed: SHOP_P.seed, season: state.season, stage: shopKey, lod: 0 }), shopKey);
  }
  const press = processorOf(world);
  const pressKey = press ? `level${press.level}` : 'plot';
  if (pressKey !== pressDrawn) {
    pressDrawn = pressKey;
    pressAnchors = anchorsFor('processor', press ? pressKey : 'level1');
    worldCollision().add('processor', press ? buildingObstacle(PRESS_P, pressAnchors.footprint) : plotObstacle(PRESS_P));
    refreshPlantObstacles();
    swapBuilding('press', PRESS_P, press ? buildingObject('processor', { seed: PRESS_P.seed, season: state.season, stage: pressKey, lod: 0 }) : plotObject(), pressKey);
  }
}






function syncFinds(force = false) {
  return timed('syncFinds', () => syncFindsNow(force));
}
function syncFindsNow(force = false) {
  if (!findsDraw) return;
  findsDraw.group.visible = !onHome();
  if (onHome()) {
    if (findsShown !== '') { findsShown = ''; findsDraw.show(null, []); }
    return;
  }
  const here = findsHere();
  const key = String(planetId);
  if (force || key !== findsShown || !findsDraw.refresh(here)) {
    findsShown = key;
    findsDraw.show(planetId, here);
  }
}

function placesNow() {
  
  
  
  
  
  
  
  if (inside) return [...exitPlaces(inside), ...furnitureTargets(world, inside.id, sizeOf)];
  
  
  
  
  
  if (!onHome()) {
    const here = targetsHere();
    return [
      ...findPlaces(),
      ...here.rocks, ...here.forage,
      ...placedTargets(world, radiusOf, { planet: planetId }),
    ];
  }
  return [
    { type: 'shop', x: SHOP_P.x, z: SHOP_P.z, front: toWorld(SHOP_P, shopAnchors.front.x, shopAnchors.front.z) },
    { type: 'processor', x: PRESS_P.x, z: PRESS_P.z, front: toWorld(PRESS_P, pressAnchors.front.x, pressAnchors.front.z) },
    { type: 'cat', x: CAT_P.x, z: CAT_P.z, r: FOOTPRINTS.cat.radiusM },
    
    ...(mole ? [{ type: 'mole', x: mole.x, z: mole.z, r: MOLE_BODY_M }] : []),
    
    ...ROCK_TARGETS, ...FORAGE_TARGETS,
    
    ...villagersHere().map((v) => ({ type: 'villager', id: v.id, x: v.x, z: v.z, r: VILLAGER_BODY_M })),
    
    ...placedTargets(world, radiusOf),
    
    ...TOWN_PLACES,
    
    ...homePlaces(world),
    
    ...villagerHomePlaces(world, village, econNow()),
    
    ...bellPlaces(world, { planet: planetId }),
  ];
}

const TOWN_PLACES = townPlaces();
const TOWN_P = Object.fromEntries(Object.keys(TOWN_SPOTS).map((id) => [id, P.find((p) => p.role === 'town' && p.stage === id)]));

const VILLAGER_BODY_M = 0.35;


const reachCfg = () => ({ ...INTERACT, reachM: playerFit(playerHeightNow()).reachM });
const villagersHere = () => (villagersDraw ? villagersDraw.shown.filter((v) => v.visible && !v.inside) : []);

function tapBoxes() {
  
  if (inside) {
    const e = exitPlaces(inside)[0];
    return [{ type: 'homeExit', x: e.x, z: e.z, rotY: 0, hx: inside.room.door.w / 2 + 0.12, hz: 0.25, h: inside.room.door.h }];
  }
  if (!onHome()) {
    const here = targetsHere();
    return [
      ...findsHere().filter((f) => f.ready)
        .map((f) => ({ type: 'find', id: f.id, x: f.x, z: f.z, rotY: 0, hx: f.r + 0.25, hz: f.r + 0.25, h: 0.7 })),
      ...here.rocks.map((r) => ({ type: 'rock', id: r.id, x: r.x, z: r.z, rotY: 0, hx: r.r + 0.1, hz: r.r + 0.1, h: 0.4 + r.r })),
      ...here.forage.map((sp) => ({ type: 'forage', id: sp.id, x: sp.x, z: sp.z, rotY: 0, hx: sp.r + 0.15, hz: sp.r + 0.15, h: sp.spot === 'berries' ? 1.1 : 0.5 })),
      ...placedTargets(world, radiusOf, { planet: planetId })
        .map((t) => ({ type: 'placed', id: t.id, x: t.x, z: t.z, rotY: 0, hx: t.r + 0.1, hz: t.r + 0.1, h: anchorsOf(t.item).height + 0.2 })),
    ];
  }
  return [
    { type: 'shop', x: SHOP_P.x, z: SHOP_P.z, rotY: SHOP_P.rotY, hx: shopAnchors.footprint.hx, hz: shopAnchors.footprint.hz, h: 3 },
    { type: 'processor', x: PRESS_P.x, z: PRESS_P.z, rotY: PRESS_P.rotY, hx: pressAnchors.footprint.hx, hz: pressAnchors.footprint.hz, h: processorOf(world) ? 3.2 : 1.4 },
    { type: 'cat', x: CAT_P.x, z: CAT_P.z, rotY: 0, hx: 0.55, hz: 0.55, h: 1.3 },
    
    
    ...(mole ? [{ type: 'mole', x: mole.x, z: mole.z, rotY: 0, hx: 0.45, hz: 0.45, h: 0.6 }] : []),
    ...ROCK_TARGETS.map((r) => ({ type: 'rock', id: r.id, x: r.x, z: r.z, rotY: 0, hx: r.r + 0.1, hz: r.r + 0.1, h: 0.4 + r.r })),
    ...FORAGE_TARGETS.map((s) => ({ type: 'forage', id: s.id, x: s.x, z: s.z, rotY: 0, hx: s.r + 0.15, hz: s.r + 0.15, h: s.spot === 'berries' ? 1.1 : 0.5 })),
    ...villagersHere().map((v) => ({ type: 'villager', id: v.id, x: v.x, z: v.z, rotY: 0, hx: 0.5, hz: 0.5, h: v.height + 0.3 })),
    
    ...placedTargets(world, radiusOf).map((t) => ({ type: 'placed', id: t.id, x: t.x, z: t.z, rotY: 0, hx: t.r + 0.1, hz: t.r + 0.1, h: anchorsOf(t.item).height + 0.2 })),
    
    ...TOWN_PLACES.map((place) => {
      const c = counterAt(place.id || 'townHall');
      return { type: place.type, id: place.id, x: c.spot.x, z: c.spot.z, rotY: c.spot.rotY, hx: c.footprint.hx, hz: c.footprint.hz, h: 3.4 };
    }),
    
    ...homePlaces(world).map((d) => ({ type: d.type, x: d.x, z: d.z, rotY: 0, hx: 0.6, hz: 0.4, h: 2.2 })),
    
    ...villagerHomePlaces(world, village, econNow()).map((d) => ({ type: d.type, id: d.id, x: d.x, z: d.z, rotY: 0, hx: 0.6, hz: 0.4, h: 2.2 })),
    
    ...bellPlaces(world, { planet: planetId }).map((b) => ({ type: b.type, x: b.x, z: b.z, rotY: 0, hx: 0.5, hz: 0.5, h: 2.6 })),
  ];
}
const screenAt = (p, local) => {
  const w = toPlacementFrame(p, local);
  return fml.screenOf(w.x, w.y, w.z);
};

function shopInfo(t) {
  const shop = shopOf(world);
  const cost = upgradeCost(shop);
  const action = { type: 'upgrade', building: shop.id };
  return {
    level: shop.level,
    stack: BUILDINGS.shop.levels[shop.level - 1].shelfStack,
    shelves: world.shop.shelves.map((s) => (s ? { good: s.good, count: s.count } : null)),
    upgrade: cost === null ? null : { level: shop.level + 1, cost, action, why: whyCannot(world, action, t) },
    hint: 'Customers drop by every few seconds while there is something on the shelves.',
  };
}





let placedSig = '';
function syncPlaced() {
  return timed('syncPlaced', () => syncPlacedNow());
}
function syncPlacedNow() {
  if (!collision) return;
  
  
  
  
  
  
  const here = placedOn(world, planetId).filter((p) => roomOf(p) === null);
  const sig = `${planetId}|${here.map((p) => `${p.id}:${p.item}:${p.spot ? `${p.spot.x},${p.spot.z}` : ''}`).join('|')}`;
  if (sig === placedSig) return;
  placedSig = sig;
  for (const k of placedKeys) worldCollision().remove(k);
  placedKeys.clear();
  for (const p of here) {
    if (!p.spot || !blocksOf(p.item)) continue;
    const k = `placed:${p.id}`;
    worldCollision().add(k, placedObstacle(p, radiusOf(p.item)));
    placedKeys.add(k);
  }
  refreshPlantObstacles();
  
  
  
  syncNightLights();
  syncVillagePlaced();
}


function syncNightLights() {
  if (!night) return;
  night.setSources([
    ...staticSources,
    ...placedLightSources(placedOn(world, planetId), { planet: planetId, heightAt }),
  ]);
}






function fireSources() {
  if (!night) return [];
  return night.sources
    .filter((s) => s.kind === 'fire')
    .map((s) => ({ key: s.id != null ? `p${s.id}` : `${s.x.toFixed(2)}:${s.z.toFixed(2)}`, x: s.x, y: s.y, z: s.z }));
}









function syncVillagePlaced() {
  village.setPlaced(placedOn(world, 0)
    .filter((p) => p.spot && blocksOf(p.item))
    .map((p) => ({ id: p.id, x: p.spot.x, z: p.spot.z, r: radiusOf(p.item) })));
}


const furnitureHere = () => (inside ? world.placed.filter((p) => roomOf(p) === inside.id) : []);







let furnitureSig = '';
function syncFurniture() {
  if (!collision) return;
  const mine = furnitureHere();
  const sig = inside ? `${inside.id}|${mine.map((p) => `${p.id}:${p.item}:${p.spot.x},${p.spot.z},${p.spot.rotY || 0}`).join('|')}` : '';
  if (sig === furnitureSig) return;
  furnitureSig = sig;
  for (const k of furnitureKeys) collision.remove(k);
  furnitureKeys.clear();
  if (!inside) return;
  for (const p of mine) {
    const a = sizeOf(p.item);
    const k = `furniture:${p.id}`;
    collision.add(k, furnitureObstacle(p, { hx: a.hx, hz: a.hz }));
    furnitureKeys.add(k);
  }
}
















function applyTerrain({ rebuild = true } = {}) {
  const sig = JSON.stringify(world.terrain || {});
  if (sig === terrainSig) return;
  const first = terrainSig === null;
  terrainSig = sig;
  terrainField = deltaField(terrainOf(world));
  setTerrainDelta(terrainField.empty ? null : terrainField.at);
  syncPonds();
  if (rebuild && !first && homeScene) homeScene.reground().catch(fail);
}


function syncPonds() {
  if (!homeCollision) return;
  for (const k of pondKeys) homeCollision.remove(k);
  pondKeys.clear();
  const ponds = terrainField ? terrainField.ponds : [];
  ponds.forEach((pond, i) => {
    const k = `pond:${i}`;
    homeCollision.add(k, pondObstacle(pond));
    pondKeys.add(k);
  });
  if (homeCollision === collision) staticObstacles = collision.obstacles.slice();
  pondsDraw.sync(ponds, { season: state.season });
}


const terraformBlockers = () => [
  ...staticObstacles.map((o) => ({ x: o.x, z: o.z, r: o.reach || 0 })),
  ...view.map((v) => ({ x: v.x, z: v.z, r: trunkRadius(v) })),
  ...placedFootprints(world, radiusOf, blocksOf, null, { planet: 0 }),
];


function shapingNow() {
  if (inside || !onHome()) return { spot: null, why: 'This is the shaping of your own land - go back to the moon first.' };
  const spot = placeSpot(player, { r: 0.4 });
  const why = whyNotShape(shaping, spot.x, spot.z, {
    world, terrain: terrainOf(world), blockers: terraformBlockers(),
  });
  return { spot, why };
}


function shapingPrompt() {
  if (!shaping || !shapeAt) return null;
  return {
    target: null, verb: 'shape', open: null, chosen: null, tool: null, hold: null, holdLabel: '',
    action: shapeWhy ? null : { type: 'shapeHere' },
    label: shaping === 'pond' ? 'Dig a pond here' : `${BRUSH_NAMES[shaping]} the ground here`,
    why: shapeWhy,
  };
}


function useBrush() {
  if (!shaping || !shapeAt) return;
  if (shapeWhy) { hud.nope(shapeWhy, seconds); return; }
  const parcel = parcelAt(shapeAt.x, shapeAt.z);
  const next = applyBrush(terrainOf(world), {
    kind: shaping, x: shapeAt.x, z: shapeAt.z, parcel, blockers: terraformBlockers(),
  });
  const r = doAct({ type: 'terraform', parcel, brush: shaping, cells: next[parcel].cells, ponds: next[parcel].ponds });
  if (r.error) { hud.say(r.error, seconds); return; }
  applyTerrain();
}


function chooseBrush(kind) {
  shaping = kind && BRUSHES.includes(kind) ? kind : null;
  shapeWhy = null;
  shapeAt = null;
  if (shaping) stopPlacing();
}

let shapePainted = null;
function paintShape() {
  if (!shapeCard) return;
  const on = onHome() && !inside ? parcelAt(player.x, player.z) : null;
  
  
  
  
  const sig = `${on}|${shaping}|${inside ? 'in' : 'out'}|${ownedIds(world).join(',')}`;
  if (sig === shapePainted && shapeCard.isOpen) return;
  shapePainted = sig;
  const mine = on !== null && ownedIds(world).includes(on);
  shapeCard.render({
    brushes: BRUSHES.map((kind) => ({
      kind,
      label: kind === 'pond' ? 'Dig a pond' : `${BRUSH_NAMES[kind]} the ground`,
      hint: kind === 'pond'
        ? 'A pool of water, as wide as the spot will allow'
        : `${Math.round(TERRAFORM.riseM * 100)} cm a press, up to ${kind === 'raise' ? TERRAFORM.maxRiseM : TERRAFORM.maxLowerM} m`,
      on: shaping === kind,
    })),
    note: inside ? 'Step outside first - this is for the land, not the floor.'
      : on === null ? 'Stand on the moon to shape it.'
        : mine ? `You are on ${PARCELS[on].label}, and it is yours. Walk to a spot and press the button.`
          : `${PARCELS[on].label} is not yours yet - buy it from the cat first.`,
  });
}


function startPlacing(item) {
  if (talk || choice.isOpen) return;
  
  
  
  
  
  if (inside && inside.kind !== 'player') { hud.say('There is nothing to put down in here.', seconds); return; }
  
  
  
  
  
  
  if ((world.made[item] || 0) < 1) { hud.say(`There is no ${craftedName(item)} to place.`, seconds); return; }
  
  if (shaping) chooseBrush(null);
  
  placing = { item, rotY: player.heading + Math.PI };
  if (craftCard) craftCard.hide();
  closeCard();
}

function stopPlacing() {
  placing = null;
  placeWhy = null;
  placeAt = null;
  if (placedDraw) placedDraw.ghost(null, null);
  if (roomDraw) roomDraw.ghost(null, null);
}


function placingNow() {
  if (!placing) return null;
  
  
  
  
  if (inside) {
    const a = sizeOf(placing.item);
    const size = { hx: a.hx, hz: a.hz, rotY: placing.rotY };
    const spot = furnishSpot(player, inside.room, size);
    const why = isFurnitureItem(placing.item)
      ? whyNotFurnishHere(spot.x, spot.z, {
        room: inside.room, ...size, placed: furnitureFootprints(world, inside.id, sizeOf, null),
      })
      : `A ${craftedName(placing.item)} belongs outside - only furniture goes in the house.`;
    return { spot: { ...spot, rotY: placing.rotY }, why };
  }
  const r = radiusOf(placing.item);
  const spot = placeSpot(player, { r });
  const why = whyNotPlaceHere(spot.x, spot.z, {
    r, blocks: blocksOf(placing.item), obstacles: staticObstacles, trees: treeFootprints(), placed: placedFootprints(world, radiusOf, blocksOf, null, { planet: planetId }),
  });
  return { spot: { ...spot, rotY: placing.rotY }, why };
}

const treeFootprints = () => view.map((v) => ({ x: v.x, z: v.z, r: trunkRadius(v), kind: v.kind, stage: v.stage }));


function placingPrompt() {
  if (!placing || !placeAt) return null;
  const name = craftedName(placing.item);
  return {
    target: null, verb: 'place', open: null, chosen: null, tool: null, hold: null, holdLabel: '',
    action: placeWhy ? null : { type: 'place', item: placing.item, spot: placeAt, planet: planetId },
    label: inside ? `Put the ${name} down here` : `Put the ${name} here`,
    why: placeWhy,
  };
}

function craftTabTo(key) {
  craftTab = key || craftTab;
  if (!craftCard) return;
  if (key === null && craftCard.isOpen) { craftCard.hide(); return; }
  craftPick = null;
  showCraft();
}

function showCraft() {
  if (!craftCard) return;
  craftCard.show(craftMenu(world, { category: craftTab, chosen: craftPick }), world);
}


function openCard(kind, prompt = null) {
  
  
  if (corners.open) { corners = closeCorners(corners); syncCorners(); }
  card = kind;
  if (kind === 'store') storeShown = (prompt && prompt.storeId) || storeShown;
}
let storeShown = 'emporium';
function closeCard() {
  card = null;
  if (cards) cards.hide();
}


const placementsHere = () => (onHome() ? P : layoutOf(planetAt(planetId, state.system, GENERATED_COUNT)).placements());

function syncOrchard(t) {
  return timed('syncOrchard', () => syncOrchardNow(t));
}
function syncOrchardNow(t) {
  
  
  
  const next = timed('syncOrchard:view', () => orchardView(world, t, placementsHere(), undefined, { planet: planetId, focus: layout.FOCUS }));
  const d = timed('syncOrchard:diff', () => diffOrchard(view, next));
  view = next;
  if (!d.any) return;
  timed('syncOrchard:collision', () => {
    for (const v of d.removed) worldCollision().remove(v.id);
    for (const v of d.added) worldCollision().add(v.id, treeObstacle(v));
    for (const { to } of d.changed) worldCollision().add(to.id, treeObstacle(to));
  });
  timed('syncOrchard:show', () => orchard.show(view).catch(fail));
}

const holdPoint = new THREE.Vector3();
function armsOf() {
  if (character.hold) character.hold.getWorldPosition(holdPoint);
  else holdPoint.set(player.x, groundNow(player.x, player.z) + 0.7, player.z);
  return holdPoint;
}





function onHomes(chosen) {
  if (chosen.length && collision) refreshPlantObstacles();
  if (chosen.length) touchSave('home');   
  return chosen;
}
function onHomeStage(id, home, stage) {
  if (!collision) return;
  if (stage === 'none') worldCollision().remove(`home:${id}`);
  else worldCollision().add(`home:${id}`, homeObstacle(home));
  refreshPlantObstacles();
}



function doAct(action, { quiet = false } = {}) {
  
  
  
  
  if (visit.amGuest()) return visit.ask(action);
  const t = econNow();
  const before = action.tree !== undefined ? view.find((v) => v.id === action.tree) || null : null;
  let events;
  try {
    events = act(world, action, t);
  } catch (e) {
    hud.nope();
    hud.say(e.message, seconds);
    return { error: e.message };
  }
  fml.actions += 1;
  fml.lastEvents = events;
  
  
  
  
  noteEconomyEvents(events);
  
  
  
  
  
  
  tallyDeeds(world, events);
  
  
  
  
  
  
  settleTown();
  touchSave(action.type);   
  
  
  
  paintBoard();
  
  visits = collectSales(visits, events, route);
  onHomes(syncHomes(village, world, t));
  if (quiet) {
    syncOrchard(t);
    syncBuildings();
    syncPlaced();
    return { events };
  }
  
  
  
  
  
  
  const actCue = cueForEvents(events);
  if (actCue) sfx.play(actCue);
  let gesture = false;
  events.forEach((e, n) => {
    const popSeed = (fml.actions * 131 + n * 17) | 0;
    if (e.type === 'collect') {
      const out = pressAnchors.outputs[0] || pressAnchors.stations[0];
      const from = toPlacementFrame(PRESS_P, { x: out.x, y: out.y + 0.3, z: out.z });
      Object.entries(e.goods).forEach(([good, count], i) => {
        pops.launch({ good, count: Math.min(count, POP_SHOWN_MAX), from, seed: popSeed + i, nowS: animSeconds + i * 0.2 });
      });
      gesture = true;
    } else if (e.type === 'buy') {
      pops.launch({ good: e.good, count: Math.min(e.count, POP_SHOWN_MAX), from: { x: CAT_P.x, y: CAT_P.y + 0.9, z: CAT_P.z }, seed: popSeed, nowS: animSeconds });
      if (e.coins > 0) ui.spend(`spend${fml.actions}-${n}`, e.coins, animSeconds);
      gesture = true;
    } else if (e.type === 'buyParcel') {
      
      ui.spend(`spend${fml.actions}-${n}`, e.coins, animSeconds);
      gesture = true;
    } else if (e.type === 'gift') {
      
      
      if (action.coins) ui.spend(`spend${fml.actions}-${n}`, action.coins, animSeconds);
      gesture = true;
    } else if (e.type === 'mine') {
      
      const r = ROCK_TARGETS.find((x) => x.id === e.rock);
      if (r) {
        const from = { x: r.x, y: heightAt(r.x, r.z) + 0.3 + r.r, z: r.z };
        pops.launch({ good: e.good, count: e.count, from, seed: popSeed, nowS: animSeconds });
        if (e.moonRock) pops.launch({ good: 'moonRock', count: e.moonRock, from, seed: popSeed + 3, nowS: animSeconds + 0.15 });
        if (e.rare) pops.launch({ good: e.rare, count: 1, from, seed: popSeed + 5, nowS: animSeconds + 0.3 });
      }
      gesture = true;
    } else if (e.type === 'craft') {
      
      if (e.coins > 0) ui.spend(`spend${fml.actions}-${n}`, e.coins, animSeconds);
      gesture = true;
    } else if (e.type === 'place' || e.type === 'takeBack') {
      
      
      gesture = true;
    } else if (e.type === 'forage' || e.type === 'dig') {
      const s = FORAGE_SPOTS[e.spot];
      pops.launch({ good: e.good, count: Math.min(e.count, POP_SHOWN_MAX), from: { x: s.x, y: heightAt(s.x, s.z) + 0.4, z: s.z }, seed: popSeed, nowS: animSeconds });
      gesture = true;
    } else if (e.type === 'pickUpFind') {
      
      
      
      const f = findsHere().find((x) => x.id === e.find);
      if (f) pops.launch({ good: e.good, count: Math.min(e.count, POP_SHOWN_MAX), from: { x: f.x, y: f.y + 0.5, z: f.z }, seed: popSeed, nowS: animSeconds });
      gesture = true;
    } else if (['stock', 'startJob', 'build', 'upgrade'].includes(e.type)) {
      gesture = true;
    }
  });
  for (const e of events) {
    if (e.tree === undefined) continue;
    const v = view.find((x) => x.id === e.tree) || before;
    if (!v) continue;
    const g = heightAt(v.x, v.z);
    const popSeed = (e.tree * 977 + fml.actions * 31) | 0;
    if (e.type === 'harvest' || (e.type === 'fell' && e.good)) {
      const from = { x: v.x + Math.sin(CAMERA.yawRad) * CROP_OUT_M, y: g + CROP_HEIGHT_M, z: v.z + Math.cos(CAMERA.yawRad) * CROP_OUT_M };
      pops.launch({ good: e.good, count: e.count, from, seed: popSeed, nowS: animSeconds });
      if (e.rare) pops.launch({ good: e.rare, count: 1, from, seed: popSeed + 101, nowS: animSeconds + 0.2 });
    }
    if (e.type === 'fell') {
      pops.launch({ good: e.seed, count: e.seeds, from: { x: v.x, y: g + CUT_HEIGHT_M, z: v.z }, seed: popSeed + 7, nowS: animSeconds + 0.15 });
      if (e.wood) pops.launch({ good: 'wood', count: Math.min(e.wood, POP_SHOWN_MAX), from: { x: v.x, y: g + CUT_HEIGHT_M, z: v.z }, seed: popSeed + 13, nowS: animSeconds + 0.3 });
      
      
      
      
      
      
      if (before && particles) {
        const [crown] = orchard.sourcesOf([before]);
        if (crown) particles.burst(crown);
      }
      if (before) orchard.topple(before, fallYaw(before, player)).catch(fail);
    }
    
    if (e.type === 'clearStump' && e.wood) pops.launch({ good: 'wood', count: e.wood, from: { x: v.x, y: g + 0.3, z: v.z }, seed: popSeed + 17, nowS: animSeconds });
    if (['harvest', 'fell', 'clearStump', 'plant', 'water'].includes(e.type)) gesture = true;
  }
  
  
  const swing = events.map((e) => SWING_OF_EVENT[e.type]).find(Boolean);
  if (swing && character.act) swingTool(swing);
  else if (gesture) character.pickUp();
  if (gesture) fml.pickUps += 1;
  syncOrchard(t);
  syncBuildings();
  syncPlaced();
  return { events };
}


const SWING_OF_EVENT = Object.freeze({ fell: 'chop', mine: 'mine', dig: 'dig', clearStump: 'dig', plant: 'dig', water: 'water' });
const TOOL_OF_SWING = Object.freeze({ chop: 'axe', mine: 'pickaxe', dig: 'shovel', water: 'wateringCan' });
let toolInHand = null; 

function swingTool(swing) {
  const pc = character, kind = TOOL_OF_SWING[swing];
  pc.act(swing);
  fml.swings = (fml.swings || 0) + 1;
  fml.lastSwing = { swing, tool: kind, frame: fml.frames, held: false };
  itemObject(kind, { season: state.season }).then((obj) => {
    
    if (pc !== character || pc.action !== swing) return;
    pc.holdTool(obj, TOOL_GRIP[kind]);
    toolInHand = { pc, swing };
    fml.lastSwing.held = true;
  }).catch(fail);
}

function press() {
  
  
  
  presses += 1;
  if (!fml.ready) return;
  
  if (choice.isOpen) return;
  
  if (talk) { talkCard.advance('key'); return; }
  
  if (placing) { putDown(); return; }
  
  
  
  if (shaping) { useBrush(); return; }
  const p = prompt;
  hold = pressHold(p);
  holdStartedAt = performance.now();
  if (p && p.open === 'talk') { openTalk(p.target); return; }
  
  
  if (p && p.open === 'homeIn') { goInside(); return; }
  if (p && p.open === 'homeOut') { goOutside(); return; }
  
  
  if (p && p.open === 'villagerIn') { goInsideVillager(p.target.id); return; }
  if (p && p.open === 'knock') { knockAt(p.target.id); return; }
  
  
  
  if (p && p.open === 'assembly') { if (p.why) hud.nope(p.why, seconds); else ringBell(); return; }
  if (p && p.action && !p.why) { doAct(p.action); return; }
  
  if (p && p.open) { if (card === p.open) closeCard(); else openCard(p.open, p); return; }
  if (p && p.hold) return;        
  
  
  
  
  if (p) { hud.nope(refusalOf(p), seconds); return; }
  
  character.pickUp();
  fml.pickUps += 1;
}




function putDown() {
  if (!placing || !placeAt) return;
  if (placeWhy) { hud.say(placeWhy, seconds); return; }
  const item = placing.item;
  
  
  
  
  const spot = inside ? furnishedSpot(inside, placeAt.x, placeAt.z, placeAt.rotY || 0) : { ...placeAt };
  const r = doAct({ type: 'place', item, spot, planet: planetId });
  if (r.error) { hud.say(r.error, seconds); return; }
  if ((world.made[item] || 0) < 1) stopPlacing();
}





const ctxFor = (t) => ({
  world, t, trees: inside ? [] : view, seedKind, obstacles: staticObstacles,
  owned: onHome() ? ownedIds(world) : null,
  
  
  
  
  forSale: onHome() ? forSale(ownedIds(world)) : null,
  tool: choiceFor(toolChoice, targetKey(aim)),
  planet: planetId,
});

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
function tap(cx, cy) {
  
  
  
  
  
  
  if (!fml.ready) return;
  
  
  
  
  
  
  
  if (corners.open) { corners = closeCorners(corners); syncCorners(); return; }
  if (!character || choice.isOpen) return;
  if (!feetOnGround(air)) return;
  
  
  if (placing) return;
  const r = canvas.getBoundingClientRect();
  ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const f = curveUniforms.uCurveFocus.value;
  
  
  
  
  
  const hit = tapPick(raycaster.ray.origin, raycaster.ray.direction, { x: f.x, z: f.z }, inside ? [] : view, { heightAt: groundNow, radius: layout.ISLAND_RADIUS, k: curveUniforms.uCurve.value, places: tapBoxes() });
  fml.lastTap = { cx, cy, hit, frame: fml.frames };
  if (!hit || hit.type === 'ground') return;
  
  prefer = hit.type === 'tree' ? hit.id : targetKey(hit);
  const chosen = chooseTarget(aim, inside ? [] : view, player, { canPlant: false, prefer, places: placesNow() }, reachCfg());
  if (!chosen || targetKey(chosen) !== targetKey(hit)) { hud.say('Walk a little closer.', seconds); return; }
  aim = chosen;
  const p = promptFor(aim, ctxFor(econNow()));
  if (p && p.action && !p.why) doAct(p.action); 
  else if (p && p.open === 'homeIn') goInside();
  else if (p && p.open === 'homeOut') goOutside();
  else if (p && p.open === 'villagerIn') goInsideVillager(p.target.id);
  else if (p && p.open === 'knock') knockAt(p.target.id);
  else if (p && p.open === 'assembly') { if (p.why) hud.nope(p.why, seconds); else ringBell(); }
  else if (p && p.open === 'talk') openTalk(aim);
  else if (p && p.open) openCard(p.open, p);
  else if (p) hud.nope(refusalOf(p), seconds);
}

const pickButton = document.getElementById('pick');
const promptEl = document.getElementById('prompt');
const todayEl = document.getElementById('today');
const pocketsEl = document.getElementById('pockets');
const hud = createHud({
  prompt: promptEl,
  pockets: pocketsEl,
  seeds: document.getElementById('seeds'),
  today: todayEl,
  
  quest: document.getElementById('quest'),
  button: pickButton,
  iconFor,
  onChooseSeed: (kind) => { seedKind = kind; },
  
  
  
  
  onVerbChange: () => { sfx.play('ui.verb'); },
  
  onTogglePockets: () => { corners = toggleCorner(corners, 'pockets'); syncCorners(); },
});




function syncCorners() {
  hud.setPocketsOpen(cornerIsOpen(corners, 'pockets'));
  toolBar.setOpen(cornerIsOpen(corners, 'tools'));
}














const weatherNow = () => planetAt(planetId, state.system, GENERATED_COUNT).weather;
const todayLine = (t) => dayLine({
  now: t, firstPlayed, hour: state.time, weather: weatherNow(), tzOffsetMin,
});



fml.l2Hour = (hour) => {
  state.time = wrapHours(Number(hour) || 0);
  return state.time;
};




const toolBar = createToolBar({
  el: document.getElementById('tools'),
  iconFor,
  onChoose: (tool) => {
    if (!character || talk || choice.isOpen) return;
    toolChoice = chooseTool(toolChoice, tool, targetKey(aim));
    corners = closeCorners(corners);
    syncCorners();
  },
  onToggle: () => {
    if (!character || talk || choice.isOpen) return;
    corners = toggleCorner(corners, 'tools');
    syncCorners();
  },
});













const jumpButton = document.getElementById('jump');



jumpButton.replaceChildren(
  Object.assign(document.createElement('span'), { className: 'word', textContent: 'Jump' }),
  Object.assign(document.createElement('span'), { className: 'hint', textContent: 'x2 FLY' }),
);
const placeNotice = createPlaceNotice({
  place: document.getElementById('place'),
  where: document.getElementById('where'),
  ring: document.getElementById('ring'),
  arrive: document.getElementById('arrive'),
  systemSeed: state.system,
  count: GENERATED_COUNT,
});

async function buildPlanet(id) {
  if (visited.has(id)) return visited.get(id);
  const planet = planetAt(id, state.system, GENERATED_COUNT);
  const planetLayout = layoutOf(planet);
  
  
  const area = (planet.radius * planet.radius) / (MOON.ISLAND_RADIUS * MOON.ISLAND_RADIUS);
  const built = await buildMoonScene({
    scene, state, settings, fml,
    layout: planetLayout,
    season: planet.season,
    coverCount: Math.round(1500 * Math.max(0.25, area) * planet.weather.cover),
    name: `planet-${id}`,
    
    
    
    
    skipRoles: ['tree'],
  });
  
  
  
  
  covers.push({ cover: built.cover, effects: built.coverEffects, counted: false });
  built.root.visible = false;
  
  
  
  const obstacles = obstaclesFrom(planetLayout.placements().filter((x) => x.module && x.role !== 'tree'));
  const entry = {
    planet,
    layout: planetLayout,
    root: built.root,
    collision: createCollisionWorld({ obstacles, walkEdgeM: planet.radius - planet.rimWidth - EDGE_MARGIN_M }),
  };
  visited.set(id, entry);
  
  
  
  
  
  
  
  
  
  
  
  
  
  try {
    await orchard.warm(orchardView(world, econNow(), planetLayout.placements(), undefined, { planet: id, focus: planetLayout.FOCUS }));
  } catch (e) { fml.problems.push(`warm planet ${id}: ${(e && e.message) || e}`); }
  return entry;
}











const hidden = new Map();






const outdoors = () => onHome() && !inside;
function applyPlanetVisibility() {
  if (outdoors()) {
    for (const [o, was] of hidden) o.visible = was;
    hidden.clear();
    for (const e of visited.values()) e.root.visible = false;
    if (interiorDraw) interiorDraw.group.visible = false;
    return;
  }
  const here = (visited.get(planetId) || {}).root;
  for (const o of scene.children) {
    
    
    
    if (interiorDraw && o === interiorDraw.group) { o.visible = Boolean(inside); continue; }
    if (permanent.has(o)) continue;
    if (o.name && o.name.startsWith('planet-')) { o.visible = o === here; continue; }
    if (!hidden.has(o)) hidden.set(o, o.visible);
    o.visible = false;
  }
}













async function enterHome(buildHome) {
  if (inside || goingThroughDoor || !outdoors()) return false;
  const home = buildHome();
  if (!home) return false;
  goingThroughDoor = true;
  try {
    
    if (shaping) chooseBrush(null);
    
    
    
    
    
    
    if (home.kind === 'player') { if (placing && !isFurnitureItem(placing.item)) stopPlacing(); } else stopPlacing();
    const ok = await interiorDraw.show(home);
    if (!ok) { hud.say('The door will not open just now.', seconds); return false; }
    wentInAt = { x: player.x, z: player.z, heading: player.heading };
    inside = home;
    layout = ROOM_LAYOUT;
    collision = createCollisionWorld({ obstacles: roomWalls(home.room), walkEdgeM: 1000 });
    const at = insideSpot(home);
    player = createPlayer(at.x, at.z, at.heading);
    follow = createFollow(aimPoint(player, 0, cameraFit()));
    resetTrack(at.x, at.z);
    aim = null;
    prompt = null;
    hold = null;
    applyPlanetVisibility();
    return true;
  } finally {
    goingThroughDoor = false;
  }
}

async function goInside() {
  return enterHome(() => {
    const home = playerHome(world);
    return home ? { ...home, kind: 'player' } : null;
  });
}




async function goInsideVillager(villagerId) {
  return enterHome(() => {
    const v = world.villagers.find((x) => x.id === villagerId);
    if (!v) return null;
    const t = econNow();
    if (!mayEnter(v, homeStage(v, t))) return null;
    const place = villagerHomePlaces(world, village, t).find((p) => p.id === villagerId);
    if (!place || !place.room) return null;
    return {
      id: `villager:${villagerId}`, kind: 'villager', villagerId, species: place.species, seed: place.seed,
      front: place.front, room: place.room,
    };
  });
}


function knockAt(villagerId) {
  const v = world.villagers.find((x) => x.id === villagerId);
  if (!v) return;
  hud.say(knockLine(v, world.villagers), seconds);
}

function goOutside() {
  if (!inside) return false;
  const back = wentInAt || { x: inside.front.x, z: inside.front.z, heading: Math.PI };
  inside = null;
  wentInAt = null;
  layout = MOON;
  collision = homeCollision;
  player = createPlayer(back.x, back.z, back.heading);
  follow = createFollow(aimPoint(player, groundNow(back.x, back.z), cameraFit()));
  resetTrack(back.x, back.z);
  aim = null;
  prompt = null;
  hold = null;
  interiorDraw.hide();
  applyPlanetVisibility();
  return true;
}


function arriveAt(id) {
  const entry = visited.get(id);
  planetId = id;
  
  
  
  
  
  if (visitPlanet(world, id)) touchSave('visit');
  layout = entry ? entry.layout : MOON;
  collision = entry ? entry.collision : homeCollision;
  const planet = planetAt(id, state.system, GENERATED_COUNT);
  
  
  
  
  const at = onHome() ? SPAWN : landingOn(planet);
  player = createPlayer(at.x, at.z, at.heading);
  follow = createFollow(aimPoint(player, groundNow(at.x, at.z), cameraFit()));
  resetTrack(at.x, at.z);
  applyPlanetVisibility();
  syncFinds(true);
  
  
  
  syncOrchard(econNow());
  syncPlaced();
  
  
  
  refreshPlantObstacles();
  sky.planetId = id;
  
  document.body.classList.toggle('away', !onHome());
  
  
  
  
  
  const lying = describeFinds(planet);
  const work = onHome() ? '' : describeWild(planet);
  const extra = [lying, work].filter(Boolean).join('; ');
  
  
  
  
  
  
  
  
  
  
  
  const full = describePlanet(planet);
  const kind = full.startsWith(`${planet.name} - `) ? full.slice(planet.name.length + 3) : full;
  placeNotice.arriveOn(id, { name: planet.name, home: onHome(), card: { kind, here: extra } });
  if (guideUi) guideUi.rethink();
  touchSave('travel');
}





let jumpHold = null;


function flyHome() {
  if (onHome()) {
    hud.say(`You are already home on ${SYSTEM[0].name}.`, seconds, 2);
    return;
  }
  if (!visit.canTravel()) {
    hud.nope();
    hud.say('You are visiting - you go where your host goes.', seconds);
    return;
  }
  startFlight(0);
}

function doJump(nowMs) {
  if (!character || talk || choice.isOpen || placing) return;
  
  
  
  if (inside) { hud.say('Not indoors - step outside first.', seconds); return; }
  
  
  
  
  const tap = tapJump(jumpState, nowMs, air);
  jumpState = tap.jump;
  if (tap.kind === 'hop') {
    air = startHop(groundNow(player.x, player.z));
    
    
    jumpButton.classList.add('again');
    setTimeout(() => jumpButton.classList.remove('again'), JUMP.doubleTapMs);
    return;
  }
  if (tap.kind !== 'flight') return;
  if (!visit.canTravel()) {
    hud.nope();
    hud.say('You are visiting - you go where your host goes.', seconds);
    return;
  }
  startFlight(nextPlanetId(planetId, 1, GENERATED_COUNT));
}







function startFlight(to) {
  jumpButton.classList.remove('again');
  flightTo = to;
  
  
  const landY = to === 0 ? MOON.heightAt(SPAWN.x, SPAWN.z) : 0;
  air = launch(air, { from: planetId, to, groundY: groundNow(player.x, player.z), landY });
  flightScene = (to === 0 ? Promise.resolve(null) : buildPlanet(to)).then((entry) => entry, (e) => {
    
    
    
    fail(e);
    flightTo = 0;
    return null;
  });
  fml.actions += 1;
}







function placeOf(place) {
  if (!place) return null;
  const lift = (x, z, y = 1.2) => ({ x, y: groundNow(x, z) + y, z });
  switch (place.type) {
    case 'shop': return lift(SHOP_P.x, SHOP_P.z, 2.6);
    case 'press': return lift(PRESS_P.x, PRESS_P.z, 2.6);
    case 'cat': return lift(CAT_P.x, CAT_P.z, 1.1);
    case 'tree': {
      const tree = view.find((t) => t.id === place.id);
      return tree ? lift(tree.x, tree.z, 1.8) : null;
    }
    case 'villager': {
      const at = villagersDraw && villagersDraw.positionOf(place.id);
      return at ? lift(at.x, at.z, 1.4) : null;
    }
    case 'find': {
      const f = findsHere().find((x) => x.id === place.id);
      return f ? lift(f.x, f.z, 0.8) : null;
    }
    case 'forage': {
      const spot = targetsHere().forage.find((x) => x.id === place.id);
      return spot ? lift(spot.x, spot.z, 0.6) : null;
    }
    
    
    
    default: return null;
  }
}

const guideUi = createGuideUi({
  goal: document.getElementById('goal'),
  markers: document.getElementById('markers'),
  tip: document.getElementById('tip'),
  placeOf,
  ndcOf: (x, y, z) => fml.ndcOf(x, y, z),
  storage: (() => { try { return window.localStorage; } catch { return null; } })(),
});

const input = createInput({
  surface: canvas,
  ring: document.getElementById('stick'),
  knob: document.getElementById('knob'),
  ghost: document.getElementById('ghost'),
  pickButton: document.getElementById('pick'),
  jumpButton,
  onJump: doJump,
  
  
  
  onJumpDown: (nowMs) => { jumpHold = holdStart(nowMs); },
  onJumpUp: () => { jumpHold = null; jumpButton.style.setProperty('--hold', '0'); },
  onPress: () => { if (character) press(); },
  onRelease: () => { hold = null; holdProgress = 0; },
  onFell: () => {
    if (!character || talk || choice.isOpen) return;
    const a = fellAction(aim, world, econNow());
    if (a) doAct(a); else hud.say('There is no tree here to fell.', seconds);
  },
  onSeed: () => { seedKind = nextSeedKind(seedKind, world) || seedKind; },
  onTap: tap,
  onToggleCarry: () => { state.carrying = !state.carrying; fml.carrying = state.carrying; },
  
  onCraft: () => toggleCraft(),
  onTurn: () => { if (placing) placing = { ...placing, rotY: placing.rotY + Math.PI / 8 }; },
  onCancel: () => {
    
    
    if (corners.open) { corners = closeCorners(corners); syncCorners(); return; }
    if (menu.isOpen) { menu.hide(); return; }
    if (placing) stopPlacing();
    else if (craftCard && craftCard.isOpen) craftCard.hide();
  },
});

function toggleCraft() {
  if (!craftCard || talk || choice.isOpen) return;
  
  
  
  
  
  if (placing) { stopPlacing(); return; }
  if (craftCard.isOpen) craftCard.hide(); else showCraft();
}


const placingEl = document.getElementById('placing');
const craftButton = document.getElementById('craft');
const placingButton = (cls, label, fn) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = cls;
  b.dataset.act = cls;
  b.textContent = label;
  b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); fn(); });
  return b;
};
placingEl.replaceChildren(
  placingButton('turn', 'Turn', () => { if (placing) placing = { ...placing, rotY: placing.rotY + Math.PI / 8 }; }),
  placingButton('cancel', 'Put away', () => stopPlacing()),
);

fml.act = (action, opts) => doAct(action, opts);



fml.g8c = {
  get trees() {
    return treesOn(world, planetId).map((t) => {
      const v = view.find((x) => x.id === t.id);
      return {
        id: t.id, kind: t.kind, planet: t.planet ?? 0, wild: t.wild,
        stage: v ? v.stage : null, x: v ? v.x : null, z: v ? v.z : null,
      };
    });
  },
  get standing() { return view.filter((v) => v.stage !== 'stump').length; },
  get homeTrees() { return treesOn(world, 0).length; },
  get rocks() { return rocksOn(world, planetId).map((r) => ({ id: r.id, planet: r.planet ?? 0, hits: r.hits })); },
  get forage() { return economyForageOn(world, planetId).map((f) => ({ id: f.id, type: f.type, planet: f.planet ?? 0, picks: f.picks })); },
  get placed() { return placedOn(world, planetId).map((p) => ({ id: p.id, item: p.item, planet: p.planet ?? 0, spot: p.spot })); },
  get placedHome() { return placedOn(world, 0).length; },
  
  
  get made() { return { ...world.made }; },
  
  place: (item) => {
    startPlacing(item);
    const now = placingNow();
    if (!now) return { error: 'nothing is being placed' };
    if (now.why) { stopPlacing(); return { error: now.why }; }
    placeAt = now.spot;
    const out = doAct({ type: 'place', item, spot: { ...placeAt }, planet: planetId });
    stopPlacing();
    return out;
  },
};


fml.g4front = (type) => (type === 'shop'
  ? toWorld(SHOP_P, shopAnchors.front.x, shopAnchors.front.z)
  : toWorld(PRESS_P, pressAnchors.front.x, pressAnchors.front.z));
fml.g4pressId = () => (processorOf(world) || { id: null }).id;

fml.g5cat = () => ({ x: CAT_P.x, z: CAT_P.z, rotY: CAT_P.rotY });






let homesDraw = null;



fml.g6dHour = (hour) => {
  const t0 = econNow();
  const now = hourAt(world, t0);
  const ahead = ((hour - now) % 24 + 24) % 24;
  const ms = Math.round((ahead / 24) * DAY_MS);
  if (ms > 0) fml.advance(ms);
  return Math.round(hourAt(world, econNow()) * 100) / 100;
};

fml.g6dCounters = () => Object.fromEntries(TOWN_PLACES.map((place) => {
  const id = place.id || 'townHall';
  const c = counterAt(id);
  return [id, { x: c.spot.x, z: c.spot.z, front: c.front, keeper: c.keeper, open: c.spec.openHour, close: c.spec.closeHour, keptBy: c.spec.keeper }];
}));

fml.g6seek = (id, doing = 'shop') => {
  const v = world.villagers.find((x) => x.id === id);
  if (!v) return null;
  const t0 = econNow();
  for (let s = 0; s <= DAY_MS / 1000; s += 5) {
    const t = t0 + s * 1000;
    const p = villagerPose(village, world, v, t);
    if (p.doing === doing && p.speed === 0 && !isDark(world, t)) {
      if (s > 0) fml.advance(t - t0);
      return { id, x: p.x, z: p.z, advancedMs: t - t0 };
    }
  }
  return null;
};







fml.g6house = (id) => {
  const v = world.villagers.find((x) => x.id === id);
  if (!v) return null;
  const t = econNow();
  if (!v.levels.length) v.levels = [{ at: t - 2000, doneAt: t - 1000 }];
  onHomes(syncHomes(village, world, t));
  return homeOf(village, v);
};
fml.g6boost = (id, points) => {
  const v = world.villagers.find((x) => x.id === id);
  if (!v) return null;
  v.points = Math.max(0, Math.floor(points));
  return v.points;
};
Object.defineProperty(fml, 'village', {
  enumerable: true,
  get: () => {
    const t = econNow();
    return {
      villagers: world.villagers.map((v) => {
        const s = villagersDraw ? villagersDraw.shown.find((x) => x.id === v.id) : null;
        return {
          id: v.id, species: v.species, favourite: v.favourite, points: v.points, level: v.levels.length, voice: speakerOf(v).voice,
          x: s ? s.x : null, z: s ? s.z : null, speed: s ? s.speed : 0, doing: s ? s.doing : null,
          visible: s ? s.visible : false, inside: s ? s.inside : false, stage: homeStage(v, t).stage,
          build: s ? s.build || null : null, height: s ? s.height : null, lod: s ? s.lod : null, shadow: s ? s.shadow : false,
        };
      }),
      badges: levelBadges ? levelBadges.stats : { visible: [], gains: 0, last: null },
      homes: homesDraw ? homesDraw.stats : null,
      
      
      spots: { ...village.homes },
      held: villagersDraw ? villagersDraw.held : null,
    };
  },
});
Object.defineProperty(fml, 'talk', {
  enumerable: true,
  get: () => ({
    ...(talkCard ? talkCard.state : { open: false }),
    with: talkWith,
    state: talk ? { node: talk.node, selected: talk.selected, visits: talk.visits } : null,
    look: lookPoint && lookBlend > 0 ? { ...lookPoint, blend: lookBlend } : null,
    voice: voice.state,
    bob: catBob,
    visits: talkVisits,
    
    
    met: metList(met),
  }),
});




fml.advance = (ms) => {
  skippedMs += Math.max(0, Math.floor(ms));
  const t = econNow();
  if (collision) {
    visits = collectSales(visits, advance(world, t), route);
    onHomes(syncHomes(village, world, t));
    syncOrchard(t);
    syncBuildings();
    syncPlaced();
  }
  touchSave('advance');   
  return t;
};





fml.ndcOf = (x, y, z) => {
  const f = curveUniforms.uCurveFocus.value;
  const v = new THREE.Vector3(x, y - bendDrop(x - f.x, z - f.z, curveUniforms.uCurve.value), z).project(camera);
  return { x: v.x, y: v.y, behind: v.z >= 1 };
};
fml.screenOf = (x, y, z) => {
  const f = curveUniforms.uCurveFocus.value;
  const v = new THREE.Vector3(x, y - bendDrop(x - f.x, z - f.z, curveUniforms.uCurve.value), z).project(camera);
  const r = canvas.getBoundingClientRect();
  return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height, inView: Math.abs(v.x) < 1 && Math.abs(v.y) < 1 && v.z < 1 };
};
Object.defineProperty(fml, 'g6b', {
  enumerable: true,
  get: () => ({
    tools: toolBar.stats,
    choice: toolChoice,
    rocks: ROCK_TARGETS.map((r) => {
      const s = world.rocks.find((x) => x.id === r.id);
      return { id: r.id, x: r.x, z: r.z, r: r.r, hits: s.hits, dayHits: s.dayHits, minedAt: s.minedAt };
    }),
    forage: FORAGE_TARGETS.map((f) => ({ id: f.id, type: f.spot, x: f.x, z: f.z, r: f.r, ready: forageIsReady(world.forage[f.id], world.clockAt), picks: world.forage[f.id].picks })),
    drawn: forageDraw ? forageDraw.stats : null,
  }),
});





Object.defineProperty(fml, 'l9', {
  enumerable: true,
  get: () => {
    
    
    
    
    
    const box = (sel) => {
      const e = document.querySelector(sel);
      if (!e || e.closest('[hidden]')) return null;
      const r = e.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0)) return null;
      return { w: r.width, h: r.height, left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    };
    const chips = (sel) => [...document.querySelectorAll(sel)].map((e) => e.dataset.good || e.dataset.tool);
    return {
      open: corners.open,
      pockets: {
        badge: box('#pocketbadge'),
        count: Number((document.querySelector('#pocketbadge .n') || {}).textContent || 0),
        tray: box('#pockettray'),
        items: chips('#pockettray .chip'),
        hidden: pocketsEl.hidden,
      },
      tools: {
        badge: box('#toolglyph'),
        glyph: toolBar.stats.glyph,
        tray: box('#tooltray'),
        items: chips('#tooltray .tool'),
        hidden: document.getElementById('tools').hidden,
      },
    };
  },
});






fml.l9Carry = (counts = {}, tool = null) => {
  for (const [good, n] of Object.entries(counts)) world.pockets[good] = Number(n) || 0;
  toolChoice = tool ? chooseTool(AUTO, tool, targetKey(aim)) : AUTO;
  return { pockets: { ...world.pockets }, tool: toolChoice.tool };
};



fml.g6cPlace = (item) => { startPlacing(item); return placing ? { ...placing } : null; };
fml.g6cTurn = (rad = Math.PI / 8) => { if (placing) placing = { ...placing, rotY: placing.rotY + rad }; return placing ? placing.rotY : null; };
fml.g6cStop = () => { stopPlacing(); return true; };
fml.g6cCraft = (item, count = 1) => doAct({ type: 'craft', item, count });
Object.defineProperty(fml, 'g6c', {
  enumerable: true,
  get: () => ({
    made: { ...world.made },
    madeCount: madeCount(world),
    tray: madeTray(world).map(({ item, count }) => ({ item, count })),
    placed: world.placed.map((p) => ({ id: p.id, item: p.item, x: p.spot ? p.spot.x : null, z: p.spot ? p.spot.z : null, rotY: p.spot ? p.spot.rotY : null })),
    placing: placing ? { item: placing.item, rotY: placing.rotY, spot: placeAt, why: placeWhy } : null,
    card: craftCard ? { ...craftCard.stats } : null,
    drawn: placedDraw ? { ...placedDraw.stats } : null,
    bar: { ...toolBarState, shown: toolBar.stats.visible },
    obstacles: placedKeys.size,
  }),
});





fml.l17Brush = (kind = null) => { chooseBrush(kind); paintShape(); return shaping; };
fml.l17Shape = () => {
  if (!shaping) return { ok: false, why: 'no brush in hand' };
  const sh = shapingNow();
  shapeAt = sh.spot;
  shapeWhy = sh.why;
  if (shapeWhy) return { ok: false, why: shapeWhy, spot: shapeAt };
  useBrush();
  return { ok: true, why: null, spot: shapeAt };
};
Object.defineProperty(fml, 'l17', {
  enumerable: true,
  get: () => {
    const field = terrainField || deltaField({});
    return {
      brush: shaping,
      why: shapeWhy,
      spot: shapeAt ? { ...shapeAt } : null,
      nodes: field.size,
      ponds: field.ponds.map((q) => ({ x: q.x, z: q.z, r: q.r, y: q.y, parcel: q.parcel })),
      
      
      
      groundY: onHome() && !inside ? groundNow(player.x, player.z) : null,
      deltaHere: onHome() && !inside ? field.at(player.x, player.z) : null,
      parcel: onHome() && !inside ? parcelAt(player.x, player.z) : null,
      owned: ownedIds(world),
      pondObstacles: pondKeys.size,
      
      
      
      pondWater: { ...pondsDraw.stats },
      card: shapeCard ? { open: shapeCard.isOpen, ...shapeCard.stats } : null,
    };
  },
});



Object.defineProperty(fml, 'l18', {
  enumerable: true,
  get: () => {
    const home = playerHome(world);
    const mine = home ? world.placed.filter((q) => roomOf(q) === home.id) : [];
    return {
      home: home ? home.id : null,
      inside: Boolean(inside),
      pieces: mine.map((q) => ({ id: q.id, item: q.item, x: q.spot.x, z: q.spot.z, rotY: q.spot.rotY || 0 })),
      obstacles: furnitureKeys.size,
      drawn: roomDraw ? { ...roomDraw.stats } : null,
      floor: home ? { ...home.room.floor } : null,
    };
  },
});



Object.defineProperty(fml, 'home', {
  enumerable: true,
  get: () => {
    const home = playerHome(world);
    return {
      owned: ownsHome(world),
      placed: home ? home.id : null,
      item: home ? home.item : null,
      species: home ? home.species : null,
      spot: home ? { ...home.spot } : null,
      door: home ? { ...home.door } : null,
      front: home ? { ...home.front } : null,
      room: home ? { hx: home.room.hx, hz: home.room.hz, wallH: home.room.wallH, door: { ...home.room.door } } : null,
      inside: Boolean(inside),
      
      standingInRoom: Boolean(inside) && inRoom(inside.room, player.x, player.z),
      drawn: interiorDraw ? { ...interiorDraw.stats } : null,
    };
  },
});
Object.defineProperty(fml, 'focus', { enumerable: true, get: () => ({ x: curveUniforms.uCurveFocus.value.x, z: curveUniforms.uCurveFocus.value.z }) });
Object.defineProperty(fml, 'world', {
  enumerable: true,
  get: () => ({
    clockAt: world.clockAt,
    coins: world.coins,
    parcels: world.parcels,
    pockets: { ...world.pockets },
    shown: pops ? pops.shown(world.pockets) : { ...world.pockets },
    trees: view.map(({ id, kind, x, z, stage, ripe, wild }) => ({ id, kind, x, z, stage, ripe, wild })),
    byStage: countByStage(view),
    seedKind,
    seedKinds: seedKinds(world),
  }),
});
Object.defineProperty(fml, 'orchard', {
  enumerable: true,
  get: () => (orchard ? { ...orchard.stats, pops: pops.active } : null),
});


Object.defineProperty(fml, 'mole', {
  enumerable: true,
  get: () => (moleDraw && mole ? { ...moleDraw.stats, heading: mole.heading, trail: moleView(mole).mounds } : null),
});






Object.defineProperty(fml, 'meshes', {
  enumerable: true,
  get: () => ({ ...villagerSource().stats }),
});

Object.defineProperty(fml, 'leaves', {
  enumerable: true,
  get: () => (particles ? { ...particles.stats, sources: orchard ? orchard.sources().length : 0 } : null),
});


Object.defineProperty(fml, 'insects', {
  enumerable: true,
  get: () => (insects ? { ...insects.stats, player: { x: player.x, z: player.z } } : null),
});

Object.defineProperty(fml, 'birds', {
  enumerable: true,
  get: () => (birds ? { ...birds.stats, sources: orchard ? orchard.sources().length : 0 } : null),
});


fml.birdsAt = () => (birds && orchard ? birds.at(orchard.sources()) : []);





Object.defineProperty(fml, 'smoke', {
  get: () => (particles ? {
    ...particles.smokeStats,
    sources: homesDraw ? homesDraw.smokeSources().length : 0,
    hearths: homesDraw ? homesDraw.hearths : [],
  } : null),
});

Object.defineProperty(fml, 'embers', {
  get: () => (particles ? { ...particles.emberStats, sources: fireSources().length } : null),
});
Object.defineProperty(fml, 'shop', {
  enumerable: true,
  get: () => (shelvesDraw ? {
    level: shopOf(world).level,
    shelves: world.shop.shelves.map((s) => (s ? { ...s } : null)),
    drawn: shelvesDraw.stats,
    visits: visits.map(({ id, good, coins, walker, startMs, payMs, endMs }) => ({ id, good, coins, walker, startMs, payMs, endMs })),
    walkers: customersDraw.shown,
    stats: { customers: world.stats.customers, earned: world.stats.earned_coins },
  } : null),
});
Object.defineProperty(fml, 'press', {
  enumerable: true,
  get: () => {
    const pr = processorOf(world);
    return {
      built: Boolean(pr), level: pr ? pr.level : 0, jobs: pr ? pr.jobs.map((j) => ({ ...j })) : [],
      card, selected: cards ? cards.selected : null, drawn: pressDrawn, timers: ui ? ui.state.timers : [],
    };
  },
});
Object.defineProperty(fml, 'money', {
  enumerable: true,
  get: () => ({
    coins: world.coins, shown: Math.round(shownCoins), text: ui ? ui.state.coinsText : '', flying: ui ? ui.state.flying : 0,
    gains: ui ? ui.state.gains : [], lastGain: ui ? ui.state.lastGain : '', ...money, sound: sound.state,
    spending: ui ? ui.state.spending : 0, lastSpend: ui ? ui.state.lastSpend : '',
  }),
});
Object.defineProperty(fml, 'audio', {
  enumerable: true,
  
  
  
  
  
  get: () => ({ ...audio.state, sfx: sfx.state, card: { ...soundCard.stats }, feet: feet.state, music: music.state, ambience: ambience.state }),
});
Object.defineProperty(fml, 'buildings', {
  enumerable: true,
  get: () => ({ loading: buildingsLoading, shop: shopDrawn, press: pressDrawn, problems: plotProblems.slice() }),
});




const muteButton = document.getElementById('mute');
function paintMute() {
  muteButton.classList.toggle('off', state.muted);
  muteButton.textContent = state.muted ? 'Sound off' : 'Sound on';
}
function toggleMute() {
  state.muted = !audio.muted;
  audio.setMuted(state.muted);
  paintMute();
  soundCard.paint();
}
const soundCard = createSoundCard({
  el: document.getElementById('sound'),
  button: muteButton,
  audio,
  onMute: toggleMute,
  
  onTouch: () => sfx.play('ui.tap'),
});
paintMute();
muteButton.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); audio.unlock(); soundCard.toggle(); });
















let repaintFit = () => {};
const menu = createMenu({
  el: document.getElementById('menusheet'),
  button: document.getElementById('menu'),
  onOpen: () => { soundCard.hide(); repaintFit(); },
  onTouch: () => { audio.unlock(); sfx.play('ui.tap'); },
});
















let hudAway = autoHideStart;
let hudWokeAtS = 0;
window.addEventListener('pointerdown', () => { hudWokeAtS = seconds; }, true);
window.addEventListener('keydown', (e) => { if (e.code === 'KeyM' && !e.repeat) toggleMute(); });







const kept = {
  get() { try { return localStorage.getItem(PLAYER_BUILD_KEY); } catch { return null; } },
  set(build) { try { localStorage.setItem(PLAYER_BUILD_KEY, build); } catch {  } },
};
const startChoice = choosePlayerBuild({ param: q.get('build'), choose: q.get('choose') === '1', stored: kept.get() });
let playerBuild = startChoice.build;
const bodies = new Map();          
function playerBody(build) {
  if (!bodies.has(build)) bodies.set(build, createCharacter({ seed: state.seed, season: state.season, lod: 0, species: 'human', build }));
  return bodies.get(build);
}
const whoButton = document.getElementById('who');
whoButton.textContent = PLAYER_NAMES[playerBuild];
const choice = createPlayerChoice({
  el: document.getElementById('choose'),
  builds: PLAYER_BUILDS,
  names: PLAYER_NAMES,
  onChoose: (build) => { kept.set(build); touchSave('build'); setPlayer(build).catch(fail); },
});
const portraits = new Set();
async function portraitFor(build) {
  if (portraits.has(build)) return;
  portraits.add(build);
  const pc = await playerBody(build);
  choice.preview(build, await portraitOf(pc.object, { width: 240, height: 320 }));
}

async function setPlayer(build) {
  playerBuild = build;
  whoButton.textContent = PLAYER_NAMES[build];
  const pc = await playerBody(build);
  if (playerBuild !== build || !character || character === pc) return;
  scene.remove(character.object);
  character = pc;
  scene.add(character.object);
}
function askWho() {
  if (talk || choice.isOpen) return;
  stopPlacing();
  if (craftCard) craftCard.hide();
  closeCard();
  choice.show(playerBuild);
  for (const b of PLAYER_BUILDS) portraitFor(b).catch(fail);
}
whoButton.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); askWho(); });


let askAtStart = startChoice.ask;
Object.defineProperty(fml, 'choice', {
  enumerable: true,
  get: () => ({ ...choice.state, build: playerBuild, from: startChoice.from, kept: kept.get() }),
});













const saveParam = q.get('save');
const savingOn = saveParam !== 'off';
const saveSlot = savingOn && saveParam ? saveParam : SAVE_SLOT;


const SAVE_MOVE_M = 8;
let saveStore = null, saver = null, awayLine = null, savedSpot = null;
const saveInfo = { on: savingOn, slot: saveSlot, kind: 'off', loaded: false, reason: null, steps: [], filled: [], away: null };





function snapshotArgs() {
  
  
  
  
  
  const at = inside && wentInAt ? wentInAt : player;
  return {
    world,
    homes: village.homes,
    player: { build: playerBuild, x: at.x, z: at.z, heading: at.heading, at: planetId },
    seedKind,
    savedAt: econNow(),
    firstPlayed,
    
    
    
    met: metList(met),
  };
}

function saveDoc() {
  const at = inside && wentInAt ? wentInAt : player;
  savedSpot = { x: at.x, z: at.z };
  return makeSave(snapshotArgs());
}

const touchSave = (reason) => { if (saver) saver.touch(performance.now(), reason); };
const flushSave = () => { if (saver) saver.flush(performance.now()); };

















const cloud = createCloud({
  slot: saveSlot,
  liveSave: () => (savingOn ? saveDoc() : null),
  readLocal: (id) => (saveStore ? saveStore.get(id) : null),
  writeLocal: (id, doc) => (saveStore ? saveStore.put(id, doc) : undefined),
  onChange: () => { if (accountCard) accountCard.render(); },
});
const accountCard = createAccountCard({
  el: document.getElementById('cloud'),
  button: document.getElementById('cloudopen'),
  cloud,
});



accountCard.render();











const visitEl = document.getElementById('visit');
const visitButton = document.getElementById('visitopen');
let visitorsDraw = null;

const visit = {
  mode: 'off',        
  mesh: null,
  session: null,
  code: null,
  unpublish: null,
  moons: [],
  lobby: false,
  problem: null,
  
  amGuest() { return Boolean(this.session) && this.session.role === 'guest'; },
  
  canTravel() { return !this.session || this.session.canTravel; },
  
  ask(action) {
    const why = whyGuestCannot(action.type);
    if (why) {
      hud.nope();
      hud.say(why, seconds);
      return { error: why };
    }
    this.session.ask(action, econNow());
    
    
    return { events: [] };
  },
  say(problem) {
    this.problem = problem || null;
    if (problem) hud.say(problem, seconds, 6);
    this.paint();
  },
  paint() {
    panel.render({
      mode: this.mode,
      code: this.code,
      session: this.session,
      knocks: this.session && this.session.role === 'host' ? this.session.knocks : [],
      moons: this.moons,
      lobby: this.lobby,
      problem: this.problem,
    });
  },
};



















const shares = { clicks: 0, shared: 0, copied: 0, dismissed: 0, failed: 0, last: null, how: null };

function shareFrom(kind) {
  const hosting = visit.mode === 'hosting' || visit.mode === 'opening';
  const code = hosting ? visit.code : null;
  const worth = kind === 'worth' ? netWorth(world).total : null;
  const day = kind === 'worth' ? myBoardRow().day : null;
  const payload = sharePayload({ kind, href: location.href, code, worth, day });
  shares.clicks += 1;
  shares.last = payload;
  sendSiteEvent('share_click', shareParams({ kind, code }));
  
  
  doShare(payload, { nav: navigator }).then((how) => {
    shares.how = how;
    if (how in shares) shares[how] += 1;
    if (how === 'copied') hud.say('Link copied - paste it to a friend.', seconds, 5);
    if (how === 'failed') hud.say('This browser would not share the link.', seconds, 5);
  }, () => { shares.how = 'failed'; shares.failed += 1; });
}

const panel = createVisitCard({
  el: visitEl,
  button: visitButton,
  onShare: shareFrom,
  onOpened: () => { poll.now(); poll.tick().catch(() => {}); },
  onHost: () => { openMoon().catch((e) => { endVisit(); visit.say(String(e.message || e)); }); },
  onJoin: (code) => { goVisit(code).catch((e) => { endVisit(); visit.say(String(e.message || e)); }); },
  onLeave: () => endVisit(),
  onApprove: (id) => { if (visit.session) visit.session.approve(id, econNow()); visit.paint(); },
  onRefuse: (id) => { if (visit.session) visit.session.refuse(id); visit.paint(); },
});

const poll = createLobbyPoll({
  mine: () => visit.code,
  onMoons: (moons) => { visit.moons = moons; visit.paint(); },
});









function newMesh(hostIdHint) {
  const mesh = new PeerMesh(hostIdHint ? { hostIdHint } : {});
  mesh.addEventListener('join-failed', (e) => { endVisit(); visit.say(e.detail.reason); });
  mesh.addEventListener('error', (e) => { fml.notes.push(`net: ${e.detail.message}`); });
  mesh.addEventListener('peer-left', (e) => {
    if (visit.session) visit.session.peerGone(e.detail.id);
    visit.paint();
  });
  return mesh;
}

const meshOpen = (mesh) => new Promise((res, rej) => {
  if (mesh.myId) { res(mesh.myId); return; }
  mesh.addEventListener('open', (e) => res(e.detail.id), { once: true });
  mesh.addEventListener('error', (e) => rej(new Error(e.detail.message)), { once: true });
});


function meshTransport(mesh) {
  return {
    broadcast: (msg) => mesh.broadcast(msg),
    send: (to, msg) => mesh.send(to, msg),
    onMessage: (fn) => mesh.addEventListener('message', (e) => fn(e.detail.message, e.detail.from)),
  };
}


function playerBodyDoc() {
  return {
    x: player.x,
    z: player.z,
    heading: player.heading,
    speed: Math.hypot(player.vx, player.vz),
    state: air ? 'air' : 'ground',
  };
}


async function openMoon() {
  if (visit.mode !== 'off') return;
  visit.mode = 'opening';
  visit.paint();
  
  
  
  
  const want = roomCode((state.seed * 7919 + Date.now()) >>> 0);
  const mesh = newMesh(want);
  visit.mesh = mesh;
  const id = await meshOpen(mesh);
  mesh.host();
  visit.code = id;
  visit.session = createSession({
    id,
    role: 'host',
    transport: meshTransport(mesh),
    name: PLAYER_NAMES[playerBuild] || null,
    build: playerBuild,
    code: id,
    host: {
      
      
      
      act: (action) => doAct(action),
      snapshot: () => snapshotArgs(),
      planet: () => planetId,
      body: () => playerBodyDoc(),
    },
    on: {
      knock: () => { hud.say('Somebody would like to visit.', seconds, 6); visit.paint(); },
      arrived: (p) => { hud.say(`${p.name} has come to visit.`, seconds, 6); visit.paint(); },
      left: (p) => { hud.say(`${p.name} has gone home.`, seconds, 6); visit.paint(); },
      problem: (why) => fml.notes.push(`visit: ${why}`),
    },
  });
  visit.mode = 'hosting';
  
  
  
  
  funnel.visitHosted(visit.code);
  visit.unpublish = publishMoon({
    code: visit.code,
    players: () => 1 + (visit.session ? visit.session.others.length : 0),
  });
  hud.say(`Your moon is open. The code is ${String(visit.code).toUpperCase()}.`, seconds, 8);
  visit.paint();
}


async function goVisit(code) {
  if (visit.mode !== 'off') return;
  visit.mode = 'joining';
  visit.paint();
  const mesh = newMesh(null);
  visit.mesh = mesh;
  const id = await meshOpen(mesh);
  visit.session = createSession({
    id,
    role: 'guest',
    transport: meshTransport(mesh),
    hostId: code,
    name: PLAYER_NAMES[playerBuild] || null,
    build: playerBuild,
    guest: { body: () => playerBodyDoc() },
    on: {
      approved: ({ host }) => {
        visit.mode = 'visiting';
        
        
        
        
        funnel.visitJoined(code);
        hud.say(`${host.name} has let you in.`, seconds, 6);
        visit.paint();
      },
      refused: ({ why }) => { endVisit(); visit.say(why); },
      world: (doc) => adoptHostWorld(doc),
      where: (planet) => followHostTo(planet),
      result: (r) => {
        if (r.ok) return;
        hud.nope();
        hud.say(r.why, seconds);
      },
      problem: (why) => fml.notes.push(`visit: ${why}`),
    },
  });
  
  
  mesh.addEventListener('peer-joined', (e) => {
    if (e.detail.id === code && visit.session) visit.session.hello(econNow());
  });
  mesh.connectTo(code);
  hud.say('Knocking...', seconds, 6);
  visit.paint();
}


function endVisit() {
  const wasGuest = visit.amGuest();
  if (visit.session) visit.session.leave();
  if (visit.unpublish) { visit.unpublish(); visit.unpublish = null; }
  try { if (visit.mesh) visit.mesh.destroy(); } catch {  }
  visit.mesh = null;
  visit.session = null;
  visit.mode = 'off';
  visit.code = null;
  if (visitorsDraw) visitorsDraw.clear();
  
  
  
  
  
  if (wasGuest) { location.reload(); return; }
  visit.paint();
}


function adoptHostWorld(doc) {
  const why = fitsMoon(doc.world, world);
  if (why) { visit.say(`That moon is not one this game can draw - ${why}`); return; }
  restoreWorld(world, doc.world);
  world.tzOffsetMin = tzOffsetMin; 
  onHomes(syncHomes(village, world, econNow()));
  syncOrchard(econNow());
  syncBuildings();
  syncPlaced();
  
  
  applyTerrain();
  syncFinds(true);
  fml.g9.adopted += 1;
}


function followHostTo(id) {
  if (id === planetId) return;
  fml.g9.followed += 1;
  const built = id === 0 ? Promise.resolve(null) : buildPlanet(id);
  built.then(() => {
    arriveAt(id);
    
    
    
    if (visitorsDraw) visitorsDraw.clear();
  }, fail);
}











let visitBroken = null;
let visitSteps = 0;
function stepVisit(dt) {
  visitSteps += 1;
  if (!visit.session || visitBroken) return;
  try {
    visit.session.step(econNow());
    if (!visitorsDraw) {
      visitorsDraw = createVisitorsDraw({
        scene,
        createCharacter,
        seed: state.seed,
        season: state.season,
        groundAt: (x, z) => groundNow(x, z),
      });
    }
    visitorsDraw.update(visitorsOn(visit.session.others, planetId), dt);
  } catch (e) {
    visitBroken = String(e && e.stack ? e.stack : e).slice(0, 400);
    fml.problems.push(`visit: ${visitBroken}`);
    hud.say('Something went wrong with the visit - your moon is fine.', seconds, 8);
  }
}






const LOBBY_TICK_MS = 5000;
setInterval(() => { poll.tick().catch(() => {}); }, LOBBY_TICK_MS);




const boardEl = document.getElementById('board');
const boardButton = document.getElementById('boardopen');
const boardState = {
  name: null,
  best: 0,
  rows: [],
  
  
  
  
  global: false,
};
const boardKept = {
  get() { try { return JSON.parse(localStorage.getItem(BOARD_BEST_KEY) || 'null'); } catch { return null; } },
  set(v) { try { localStorage.setItem(BOARD_BEST_KEY, JSON.stringify(v)); } catch {  } },
};
{
  const kept = boardKept.get();
  if (kept && typeof kept === 'object') {
    boardState.name = kept.name || null;
    boardState.best = Number(kept.best) || 0;
  }
}
const myBoardRow = () => myRow(world, { name: boardState.name, build: playerBuild, now: Date.now() });

function paintBoard() {
  const worth = netWorth(world);
  if (worth.total > boardState.best) {
    boardState.best = worth.total;
    boardKept.set({ name: boardState.name, best: boardState.best });
  }
  boardCard.render({
    worth,
    mine: myBoardRow(),
    rows: boardState.rows,
    global: boardState.global,
    best: boardState.best,
    now: Date.now(),
  });
}

const boardCard = createBoardCard({
  el: boardEl,
  button: boardButton,
  onShare: shareFrom,
  onOpened: () => paintBoard(),
  onName: (name) => {
    boardState.name = name;
    boardKept.set({ name, best: boardState.best });
    paintBoard();
  },
});

fml.g10 = {
  get worth() { return netWorth(world); },
  get mine() { return myBoardRow(); },
  get best() { return boardState.best; },
  get global() { return boardState.global; },
  card: () => ({ open: boardCard.isOpen, ...boardCard.stats }),
  open: () => { boardCard.show(); return true; },
  close: () => { boardCard.hide(); return true; },
  name: (n) => { boardState.name = n; paintBoard(); return boardState.name; },
};








paintBoard();






















const deedsCard = createDeedsCard({
  el: document.getElementById('deeds'),
  button: document.getElementById('deedsopen'),
  onOpened: () => paintDeeds(),
});

function paintDeeds() {
  deedsCard.render({ world, firstPlayed, now: econNow() });
}




shapeCard = createShapeCard({
  el: document.getElementById('shape'),
  button: document.getElementById('shapeopen'),
  onChoose: (kind) => { chooseBrush(kind); paintShape(); },
  onOpened: () => paintShape(),
});














const cardBack = createCardBack({
  history: window.history,
  panels: [
    { name: 'menu', isOpen: () => menu.isOpen, hide: () => menu.hide() },
    { name: 'sound', isOpen: () => soundCard.isOpen, hide: () => soundCard.hide() },
    { name: 'account', isOpen: () => accountCard.isOpen, hide: () => accountCard.hide() },
    { name: 'visit', isOpen: () => panel.isOpen, hide: () => panel.hide() },
    { name: 'worth', isOpen: () => boardCard.isOpen, hide: () => boardCard.hide() },
    { name: 'deeds', isOpen: () => deedsCard.isOpen, hide: () => deedsCard.hide() },
    { name: 'install', isOpen: () => installCard.isOpen, hide: () => installCard.hide() },
    { name: 'assembly', isOpen: () => assemblyCard.isOpen, hide: () => assemblyCard.hide() },
    { name: 'workshop', isOpen: () => Boolean(craftCard && craftCard.isOpen), hide: () => craftCard.hide() },
    
    
    { name: 'shape', isOpen: () => Boolean(shapeCard && shapeCard.isOpen), hide: () => shapeCard.hide() },
  ],
});
window.addEventListener('popstate', () => { cardBack.popped(); });

fml.l12 = {
  get deeds() { return deedsOf(world); },
  
  
  get lines() { return Object.fromEntries(deedLines({ world, firstPlayed, now: econNow() }).map((l) => [l.key, l.value])); },
  
  
  get shown() {
    const root = document.getElementById('deeds');
    if (!root || root.hidden) return null;
    return Object.fromEntries([...root.querySelectorAll('.part')]
      .map((row) => [row.querySelector('.lab').textContent, row.querySelector('.much').textContent]));
  },
  card: () => ({ open: deedsCard.isOpen, ...deedsCard.stats }),
  open: () => { deedsCard.show(); return true; },
  close: () => { deedsCard.hide(); return true; },
};




paintDeeds();













let meeting = null;

const assemblyCard = createAssemblyCard({
  el: document.getElementById('assembly'),
  onVote: (motionId) => {
    const out = putToVote(world, motionId, econNow());
    if (out && !out.why) { meeting = null; touchSave('assembly'); }
    return out;
  },
  
  onClose: () => { if (closeAssembly(world)) touchSave('assembly'); meeting = null; },
});









function ringBell() {
  const t = econNow();
  const called = callAssembly(world, t);
  if (called.why) { hud.nope(called.why, seconds); return; }
  const spots = gatherSpots(world.villagers.length);
  const walks = {};
  world.villagers.forEach((v, i) => {
    const at = villagersDraw ? villagersDraw.positionOf(v.id) : null;
    const from = at ? { x: at.x, z: at.z } : spots[i % spots.length];
    const to = spots[i % spots.length];
    let points = [from, to];
    try {
      const found = walkPath(village.grid(), from, to);
      if (found && found.points && found.points.length) points = [from, ...found.points, to];
    } catch (e) {  }
    walks[v.id] = { poly: polyline(points), spot: to };
  });
  meeting = { calledAt: t, walks };
  sfx.play('ui.open');
  touchSave('assembly');
  assemblyCard.show();
  paintAssembly();
}


function assemblyPoseFor(v) {
  if (!meeting) return null;
  const walk = meeting.walks[v.id];
  if (!walk) return null;
  return gatherPose(walk.poly, walk.spot, econNow() - meeting.calledAt, VILLAGE.walkMps);
}

function paintAssembly() {
  if (!assemblyCard.isOpen) return;
  assemblyCard.render({
    world,
    now: econNow(),
    poses: villagersDraw ? villagersDraw.shown.map((v) => ({ id: v.id, x: v.x, z: v.z })) : [],
  });
}





function settleTown() {
  const t = econNow();
  const goals = settleGoals(world, t);
  const works = settleWorks(world, t);
  if (goals.length) {
    hud.say(`Goal done: ${goals[0].done}.`, seconds);
    sfx.play('ui.open');
    paintDeeds();
  }
  if (works.length) hud.say(`The town has finished the ${works[0].name}.`, seconds);
  if (goals.length || works.length) touchSave('goal');
  return goals.length + works.length;
}

fml.l11 = {
  get goals() { return goalsOf(world); },
  
  get goal() { return goalView(world, econNow()); },
  
  get shown() {
    const el = document.getElementById('quest');
    if (!el || el.hidden) return null;
    const what = el.querySelector('.what');
    return { text: what ? what.textContent : '', label: el.getAttribute('aria-label'), ready: el.classList.contains('ready') };
  },
  get lines() { return goalDoneLines(world); },
  settle: () => settleTown(),
};

fml.l16 = {
  get state() { return assemblyOf(world); },
  get bell() { return bellAt(); },
  get places() { return bellPlaces(world, { planet: planetId }); },
  get why() { return whyNoAssembly(world, econNow()); },
  get view() { return assemblyView(world, econNow(), { poses: villagersDraw ? villagersDraw.shown.map((v) => ({ id: v.id, x: v.x, z: v.z })) : [] }); },
  get works() { return worksOf(world, econNow()); },
  get gathering() { return meeting ? Object.keys(meeting.walks).length : 0; },
  card: () => ({ open: assemblyCard.isOpen, result: assemblyCard.result, ...assemblyCard.stats }),
  ring: () => { ringBell(); return assemblyCard.isOpen; },
};
























let repaintInstall = () => {};
const offline = createOffline({ onChange: () => repaintInstall() });
const installCard = createInstallCard({
  el: document.getElementById('install'),
  button: document.getElementById('installopen'),
  read: () => offline.state,
  onInstall: () => offline.promptInstall(),
});
repaintInstall = () => installCard.render();


installCard.render();
window.addEventListener('load', () => { offline.register(); });

fml.l14 = {
  get state() { return { ...offline.state }; },
  get line() { return offline.line; },
  
  
  get shown() {
    const root = document.getElementById('install');
    if (!root || root.hidden) return null;
    return {
      title: root.querySelector('.title b').textContent,
      state: root.querySelector('.state').textContent,
      ready: root.querySelector('.state').dataset.ready === '1',
      steps: [...root.querySelectorAll('.step')].map((n) => n.textContent),
      note: root.querySelector('.note') ? root.querySelector('.note').textContent : null,
    };
  },
  card: () => ({ open: installCard.isOpen, ...installCard.stats }),
  open: () => { installCard.show(); return true; },
  close: () => { installCard.hide(); return true; },
};













const screenFit = createScreenFit({
  open: document.getElementById('fitopen'),
  lock: document.getElementById('fitlock'),
  note: document.getElementById('fitnote'),
  onRoute: (where) => { if (where === 'install') installCard.show(); },
});
repaintFit = () => screenFit.apply();




fml.q5 = fml.q6 = {
  get state() { return screenFit.state; },
  
  
  
  get bumps() { return hud.bumps; },
  
  
  
  press: () => { screenFit.pressOpen(); return true; },
  pressLock: () => { screenFit.pressLock(); return true; },
  offerFor: (e) => screenFit.offerFor(e),
  
  
  
  
  get text() {
    const read = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      return Math.round(parseFloat(window.getComputedStyle(el).fontSize) * 100) / 100;
    };
    return {
      coins: read('#coins'),
      today: read('#today'),
      pick: read('#pick'),
      goal: read('#goal'),
      sheet: read('#menusheet button'),
      prompt: read('#prompt'),
    };
  },
};







fml.l15 = {
  get cloud() { return cloud.read(); },
  get lines() { return accountCard.lines; },
  get shown() {
    const root = document.getElementById('cloud');
    if (!root || root.hidden) return null;
    return [...root.querySelectorAll('.say')].map((p) => p.textContent);
  },
  get acts() {
    const root = document.getElementById('cloud');
    if (!root || root.hidden) return [];
    return [...root.querySelectorAll('button[data-act]')].map((b) => b.dataset.act);
  },
  card: () => ({ open: accountCard.isOpen, ...accountCard.stats }),
  open: () => { accountCard.show(); return true; },
  close: () => { accountCard.hide(); return true; },
  
  
  
  
  preview: (state) => accountCard.preview(state),
};

lobbyAvailable().then((on) => { visit.lobby = on; visit.paint(); }, () => {});


window.addEventListener('pagehide', () => { if (visit.unpublish) visit.unpublish(); });
visit.paint();



fml.g9 = {
  adopted: 0,
  followed: 0,
  get mode() { return visit.mode; },
  get code() { return visit.code; },
  get canTravel() { return visit.canTravel(); },
  get amGuest() { return visit.amGuest(); },
  get knocks() {
    if (!visit.session || visit.session.role !== 'host') return [];
    return visit.session.knocks.map((k) => ({ id: k.id, name: k.name }));
  },
  get others() {
    return (visit.session ? visit.session.others : [])
      .map((p) => ({ id: p.id, name: p.name, build: p.build, role: p.role, body: p.body }));
  },
  get stats() { return visit.session ? visit.session.stats : null; },
  get moons() { return visit.moons.map((m) => ({ code: m.code, players: m.players })); },
  get lobby() { return visit.lobby; },
  get problem() { return visit.problem; },
  get broken() { return visitBroken; },
  
  
  
  get steps() { return visitSteps; },
  get drawing() { return Boolean(visitorsDraw); },
  get drawn() { return visitorsDraw ? visitorsDraw.view() : []; },
  get drawStats() { return visitorsDraw ? visitorsDraw.stats : null; },
  card: () => ({ open: panel.isOpen, ...panel.stats }),
  open: () => { panel.show(); return true; },
  close: () => { panel.hide(); return true; },
};











fml.i13 = {
  link: null,
  opened: 0,
  get clicks() { return shares.clicks; },
  get how() { return shares.how; },
  get counts() { return { shared: shares.shared, copied: shares.copied, dismissed: shares.dismissed, failed: shares.failed }; },
  get payload() { return shares.last; },
  get buttons() {
    
    
    const on = (id) => {
      const root = document.getElementById(id);
      if (!root || root.hidden) return null;
      const b = root.querySelector('.share');
      if (!b) return null;
      const r = b.getBoundingClientRect();
      return { text: b.textContent, w: Math.round(r.width), h: Math.round(r.height) };
    };
    return { visit: on('visit'), worth: on('board') };
  },
  share: (kind) => { shareFrom(kind); return true; },
};

async function loadSave() {
  if (!savingOn) { saveInfo.reason = 'saving is off for this page (?save=off)'; return; }
  saveStore = await openSaveStore();
  saveInfo.kind = saveStore.kind;
  if (saveStore.why) fml.notes.push(`save: ${saveStore.why} - this visit will not be kept`);
  
  
  
  
  saver = createSaver({
    write: async () => {
      const doc = saveDoc();
      await saveStore.put(saveSlot, doc);
      cloud.keep(doc);
    },
  });

  
  
  
  
  
  
  
  await cloud.beforeRestore();

  let raw = null;
  try {
    raw = await saveStore.get(saveSlot);
  } catch (e) {
    saveInfo.reason = `the save could not be read: ${e.message}`;
    fml.notes.push(`save: ${saveInfo.reason}`);
    return;
  }
  
  
  
  const read = readSave(raw ?? legacyDoc(kept.get()));
  saveInfo.steps = read.steps;
  if (!read.ok) {
    saveInfo.reason = read.reason;
    if (raw !== null && raw !== undefined) fml.notes.push(`save: ${read.reason} - starting a new moon`);
    return;
  }
  const doc = read.doc;
  
  if (!q.get('build') && PLAYER_BUILDS.includes(doc.player.build)) {
    playerBuild = doc.player.build;
    kept.set(playerBuild);
    whoButton.textContent = PLAYER_NAMES[playerBuild];
    if (startChoice.from === 'first') askAtStart = false;
  }
  if (!doc.world) { saveInfo.reason = 'the save held only which body you play'; return; }
  
  
  
  const why = fitsMoon(doc.world, world);
  if (why) {
    saveInfo.reason = why;
    fml.notes.push(`save: ${why} - starting a new moon`);
    return;
  }
  const shutFor = Math.max(0, econNow() - doc.world.clockAt);
  saveInfo.filled = restoreWorld(world, doc.world).filled;
  
  
  
  world.tzOffsetMin = tzOffsetMin;
  
  
  applyTerrain({ rebuild: false });
  
  
  
  if (Number.isInteger(doc.firstPlayed) && doc.firstPlayed > 0) firstPlayed = doc.firstPlayed;
  
  
  
  met = readMet(doc.met);
  talkVisits = visitsOf(met, MET_CAT);
  moleVisits = visitsOf(met, MET_MOLE);
  village.restoreHomes(doc.village.homes);
  if (doc.seedKind) seedKind = doc.seedKind;
  
  
  
  if (!q.get('planet') && Number.isInteger(doc.player.at) && doc.player.at > 0 && doc.player.at <= GENERATED_COUNT) {
    planetId = doc.player.at;
  }
  if (doc.player.x !== null && doc.player.z !== null && !planetId) fml.teleport(doc.player.x, doc.player.z, doc.player.heading || 0);
  awayLine = awayReport(summarize(advance(world, econNow())), shutFor);
  saveInfo.loaded = true;
  saveInfo.away = awayLine;
}





window.addEventListener('pagehide', () => { flushSave(); cloud.flush(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { flushSave(); cloud.flush(); } });




















const endedWith = () => (world ? { parcels: world.parcels } : {});
window.addEventListener('pagehide', () => { funnel.endSession(endedWith()); });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') funnel.endSession(endedWith());
});


fml.saveNow = () => { touchSave('asked'); flushSave(); return true; };
fml.clearSave = () => { if (saveStore) saveStore.remove(saveSlot); return true; };
Object.defineProperty(fml, 'save', {
  enumerable: true,
  get: () => ({
    ...saveInfo,
    dirty: saver ? saver.state.dirty : false,
    
    
    
    
    
    
    writing: saver ? saver.state.writing : false,
    writes: saver ? saver.state.writes : 0,
    failures: saver ? saver.state.failures : 0,
    lastError: saver ? saver.state.lastError : null,
    lastReason: saver ? saver.state.lastReason : null,
  }),
});

function fail(e) {
  fml.error = String(e && e.stack ? e.stack : e);
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  hideLoading();
  stopWarming();
  hudText.hidden = false;
  hudText.textContent = `failed: ${fml.error}`;
  console.error(e);
}



















async function load() {
  
  await loadSave();
  timing.mark('save');
  
  
  
  
  
  
  
  
  
  
  villagerSource().warm(villagerSpecs(world, { season: state.season, playerSeed: state.seed })).catch(() => {});
  if (askAtStart) choice.show(playerBuild);
  
  
  for (const o of scene.children) permanent.add(o);
  
  
  
  
  
  
  applyTerrain({ rebuild: false });
  const built = await buildMoonScene({ scene, state, settings, fml, skipRoles: ['tree', 'shop', 'processor'], skipModules: ['cat'] });
  
  
  
  homeScene = built;
  staticSources = built.sources;
  night = createNightLights({ scene, sources: built.sources.slice(), size: settings.lights, groundHeight: heightAt });
  syncNightLights();
  covers.push({ cover: built.cover, effects: built.coverEffects, counted: true });
  timing.mark('scene');
  
  character = await playerBody(playerBuild);
  
  
  
  character.object.rotation.order = 'YXZ';
  scene.add(character.object);
  permanent.add(character.object);
  
  if (choice.isOpen) for (const b of PLAYER_BUILDS) portraitFor(b).catch(fail);
  whoButton.hidden = false;
  const catData = generateCat({ seed: CAT_P.seed, season: state.season, lod: 0 });
  const catProblems = catData.validate();
  if (catProblems.length) fml.problems = [...new Set([...fml.problems, ...catProblems])];
  catObj = await toObject3D(catData);
  catObj.position.set(CAT_P.x, CAT_P.y, CAT_P.z);
  catObj.rotation.y = CAT_P.rotY;
  catObj.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
  scene.add(catObj);
  catTris = catData.triangleCount;
  timing.mark('player');   
  baseTriangles = fml.triangles + (character.triangles || 0) + catTris;

  
  
  
  
  
  
  
  
  
  
  post = createPost(renderer, scene, camera, settings);
  resize();
  startWarming();

  await fillIn();
}





async function fillIn() {
  collision = homeCollision = createCollisionWorld({ obstacles: obstaclesWithoutRuntime(P) });
  
  for (const s of FORAGE_SPOTS) {
    const ob = forageObstacle(s);
    if (ob) homeCollision.add(`forage:${s.id}`, ob);
  }
  staticObstacles = collision.obstacles.slice();
  
  
  syncPonds();
  paintShape();
  
  
  
  
  orchard = createOrchardDraw({
    scene,
    season: state.season,
    heightAt: (x, z) => groundNow(x, z),
    seasonNow,
    onProblems: (list) => { if (list.length) fml.problems = [...new Set([...fml.problems, ...list])]; },
  });
  pops = createPopsDraw({ scene, itemObject, season: state.season });
  
  
  particles = createParticles({ scene, max: settings.leaves, seed: state.seed });
  
  
  
  
  insects = createInsects({ scene, max: settings.insects, seed: state.seed, season: state.season });
  
  
  
  birds = await createBirds({ scene, max: settings.birds, seed: state.seed, season: state.season });
  
  
  
  particles.setSmokeMax(settings.smoke);
  
  particles.setEmberMax(settings.embers);
  syncOrchard(econNow());
  await orchard.show(view);
  
  const onProblems = (list) => { if (list.length) fml.problems = [...new Set([...fml.problems, ...list])]; };
  forageDraw = createForageDraw({ scene, season: state.season, spots: FORAGE_SPOTS, heightAt, onProblems });
  forageProblems = onProblems;
  
  
  
  
  
  mole = createMole({ seed: state.seed, x: PARCELS[0].centre.x, z: PARCELS[0].centre.z, heading: 2.2 });
  createMoleDraw({ scene, season: state.season, seed: state.seed, heightAt, onProblems })
    .then((m) => { moleDraw = m; permanent.add(m.group); })
    .catch(fail);
  
  
  
  
  
  findsDraw = createFindsDraw({ scene, season: state.season, onProblems });
  permanent.add(findsDraw.group);
  
  
  
  
  
  permanent.add(orchard.root);
  
  
  Promise.all(Object.values(TOOL_OF_SWING).map((kind) => itemObject(kind, { season: state.season }))).catch(fail);
  syncBuildings();
  shelvesDraw = createShelvesDraw({ scene, season: state.season, onProblems });
  
  customersDraw = await createCustomersDraw({ scene, season: state.season, worldSeed: 1, heightAt });
  cards = createCards({
    el: document.getElementById('card'),
    iconFor,
    onAct: (action) => {
      const r = doAct(action);
      if (!r.error && action.type === 'startJob') closeCard();
    },
    onChoose: (recipe, n) => { batchChoice[recipe] = n; },
    onClose: closeCard,
  });
  ui = createWorldUi({ layer: document.getElementById('worldui'), coinsEl: document.getElementById('coins'), iconFor });
  
  
  
  placedDraw = createPlacedDraw({
    scene, season: state.season, heightAt: (x, z) => groundNow(x, z), onProblems,
    
    
    
    select: (item) => roomOf(item) === null,
  });
  
  
  
  permanent.add(placedDraw.group);
  craftCard = createCraftCard({
    el: document.getElementById('workshop'),
    trayEl: document.getElementById('made'),
    button: craftButton,
    iconFor: decorIconFor,
    onCraft: (action) => { doAct(action); showCraft(); },
    onPlace: (item) => startPlacing(item),
    onTab: (key) => craftTabTo(key),
    onPick: (item) => { craftPick = item; showCraft(); },
    onClose: () => {},
  });
  craftButton.hidden = false;
  
  
  
  
  interiorDraw = createInteriorDraw({ scene, season: state.season, onProblems });
  permanent.add(interiorDraw.group);
  
  
  
  
  roomDraw = createPlacedDraw({
    scene: interiorDraw.group, season: state.season, heightAt: () => 0, onProblems,
    name: 'furniture', select: (item) => inside !== null && roomOf(item) === inside.id,
  });
  syncPlaced();
  talkCard = createTalkCard({ el: document.getElementById('talk'), voice, onChoose: onTalkChoice, onClose: closeTalk });
  
  land = createLandDraw({ scene, season: state.season, obstacles: staticObstacles, onProblems });
  signLabels = createSignLabels({ layer: document.getElementById('worldui'), screenOf: fml.screenOf, iconFor });
  await syncLand();
  
  
  const layer = document.getElementById('worldui');
  onHomes(syncHomes(village, world, econNow()));
  villagersDraw = await createVillagersDraw({ scene, season: state.season, playerSeed: state.seed, heightAt, village });
  await villagersDraw.sync(world);
  timing.mark('villagers');
  levelBadges = createLevelBadges({ layer });
  homesDraw = createHomesDraw({ scene, season: state.season, heightAt, sfx, voice, layer, onProblems, onStage: onHomeStage });
  await homesDraw.ready;
  
  for (const v of world.villagers) villagerPose(village, world, v, econNow());
  while (buildingsLoading > 0) await new Promise((r) => setTimeout(r, 20));
  timing.mark('buildings');   
  onProblems(plotProblems);
  
  sky.planetId = planetId;
  jumpButton.hidden = false;
  document.body.classList.add('canjump');
  
  
  const startOn = state.planet || planetId;
  if (startOn !== 0) {
    await buildPlanet(startOn);
    arriveAt(startOn);
  } else {
    applyPlanetVisibility();
  }
  
  
  
  
  
  
  
  
  if (visitPlanet(world, planetId)) touchSave('visit');
  resize();
}

const clock = new THREE.Clock();
let frames = 0, fpsFrames = 0, fpsStart = 0, measureStart = 0;
const samples = [];
let watch = null;               
































const drawGate = createDrawGate();
let warmSeconds = 0;

function startWarming() {
  
  if (!drawGate.begin(fml.timing)) return;
  document.body.classList.add('arriving');
  requestAnimationFrame(warmFrame);
}


function stopWarming() {
  drawGate.handOver();
  document.body.classList.remove('arriving');
}

function warmFrame() {
  if (!drawGate.drawing) return;
  const raw = clock.getDelta();
  const dt = Math.min(raw, FEEL.maxFrameS);
  warmSeconds += raw;
  
  
  
  const aimAt = aimPoint(player, groundNow(player.x, player.z), cameraFit());
  follow = followStep(follow, aimAt, dt);
  const pose = cameraPose(follow, frameNow);
  camera.position.set(pose.position.x, pose.position.y, pose.position.z);
  target.set(pose.target.x, pose.target.y, pose.target.z);
  camera.lookAt(target);
  curveUniforms.uCurveFocus.value.copy(target);
  const cycle = dayCycle(state.time);
  
  
  
  
  
  cycle.emissive.fire *= flicker(animSeconds, FIRE_FLICKER_SEED);
  daylight.apply(cycle, target, renderer);
  sky.update(cycle, camera, target, warmSeconds, curveUniforms.uCurve.value);
  const pixelsPerRadian = renderer.domElement.height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  if (night) night.update(cycle, target, pixelsPerRadian);
  post.setBloom(cycle.bloom * settings.effects);
  renderer.info.reset();
  post.render();
  
  
  
  timing.mark('firstFrame');
  fml.drawing = true;
  fml.warmFrames += 1;
  
  
  fml.drawCalls = renderer.info.render.calls;
  if (drawGate.drawing) requestAnimationFrame(warmFrame);
}






















function applyTier(next, why) {
  if (next === fml.tier || !SETTINGS[next]) return false;
  const from = fml.tier;
  settings = SETTINGS[next];
  fml.tier = next;
  fml.settings = settings;
  fml.tierChanges.push({ from, to: next, why, atMs: Math.round(performance.now()) });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.pixelRatio));
  daylight.setQuality(settings);                 
  if (night) night.setSize(settings.lights);     
  if (post) post.setTier(settings);              
  if (particles) particles.setMax(settings.leaves); 
  if (insects) insects.setMax(settings.insects);    
  if (birds) birds.setMax(settings.birds);          
  waterUniforms.uFmlWater.value = waterParam * settings.water; 
  if (particles) particles.setSmokeMax(settings.smoke); 
  if (particles) particles.setEmberMax(settings.embers); 
  for (const entry of covers) {
    const before = entry.cover.drawnTriangles;
    const after = entry.cover.setDensity(settings.effects / entry.effects);
    if (entry.counted) baseTriangles += after - before;
  }
  
  
  
  writeTier(deviceStorage, next);
  resize();                                      
  return true;
}












const FRAME_WINDOW = 600;
const frameMs = [];
let frameCursor = 0;
const perf = createPerfSampler({
  read: () => ({
    
    
    
    
    
    
    
    
    
    ready: fml.ready && (Boolean(pinnedTier) || watch !== null),
    error: fml.error,
    tier: fml.tier,
    medianMs: medianInterval(frameMs),
    
    
    
    
    
    
    
    
    
    loadMs: fml.timing.firstFrame,
    readyMs: fml.timing.ready,
    dpr: window.devicePixelRatio,
    calls: fml.drawCalls,
  }),
  send: sendPerfSample,
});


fml.perfSampleNow = () => perf.tick(Number.POSITIVE_INFINITY);
Object.defineProperty(fml, 'perfSample', { enumerable: true, get: () => perf.payload });
















function sendPerfSample(name, params) {
  
  
  
  
  
  
  if (!startAnalytics) return;
  import('../../../../web-engine/visits/visits.js').then((mod) => {
    
    
    
    if (typeof mod.initAnalytics === 'function') mod.initAnalytics({ page: 'farmy-moon-life' });
    if (typeof mod.trackEvent === 'function') mod.trackEvent(name, params);
  }).catch(() => {});
}















const sendSiteEvent = sendPerfSample;

function frame(now) {
  const raw = clock.getDelta();
  const dt = Math.min(raw, FEEL.maxFrameS);
  seconds += raw;
  animSeconds += dt * state.anim;
  windUniforms.uFmlTime.value = animSeconds; 
  
  
  if (timeParam === null) state.time = localHour(localNowMs(), tzOffsetMin);

  
  
  
  
  const waitingForWorld = Boolean(air && air.kind === 'flight' && air.t >= FLIGHT.swapS && flightTo !== null && flightTo !== 0 && !visited.has(flightTo));
  if (air && !waitingForWorld) air = airStep(air, dt);
  const airPose = poseOf(air);
  
  if (air && air.kind === 'flight' && overDestination(air) && flightTo !== null && planetId !== flightTo) {
    if (flightTo === 0 || visited.has(flightTo)) {
      arriveAt(flightTo);
      flightTo = null;
      flightScene = null;
    }
  }
  if (air && air.done) {
    jumpState = { ...jumpState, landedMs: now };
    air = null;
  }
  document.body.classList.toggle('flying', Boolean(air && air.kind === 'flight'));

  
  
  
  
  if (jumpHold) {
    jumpButton.style.setProperty('--hold', String(Math.round(holdAt(jumpHold, now) * 50) / 50));
    if (holdDone(jumpHold, now)) {
      jumpHold.fired = true;
      jumpButton.style.setProperty('--hold', '0');
      flyHome();
    }
  }
  placeNotice.tick(dt);
  if (!outdoors()) applyPlanetVisibility();

  
  
  
  
  const heardIntent = input.read(CAMERA.yawRad);
  let intent = heardIntent;
  if (choice.isOpen) intent = { dirX: 0, dirZ: 0, amount: 0, run: false, cameraYaw: heardIntent.cameraYaw };
  
  
  if (!feetOnGround(air)) intent = { dirX: 0, dirZ: 0, amount: 0, run: false, cameraYaw: heardIntent.cameraYaw };
  if (talk) {
    intent = { dirX: 0, dirZ: 0, amount: 0, run: false, cameraYaw: heardIntent.cameraYaw };
    const dx = talkAt.x - player.x, dz = talkAt.z - player.z, d = Math.hypot(dx, dz);
    talkWalkS += dt;
    if (d > 0.12 && talkWalkS < TALK_WALK_MAX_S) intent = { ...intent, dirX: dx, dirZ: dz, amount: Math.max(0.3, Math.min(0.7, d / 0.8)) };
  }
  
  
  
  
  const wasAt = { x: player.x, z: player.z };
  player = step(player, intent, dt, (x0, z0, x1, z1) => collision.move(x0, z0, x1, z1, PLAYER_RADIUS_M));
  if (talk && intent.amount === 0) {
    const s = speakerPoint();
    const want = Math.atan2(s.x - player.x, s.z - player.z);
    const err = Math.atan2(Math.sin(want - player.heading), Math.cos(want - player.heading));
    player = { ...player, heading: player.heading + err * Math.min(1, dt * 8) };
  }
  if (talk && talkingToVillager() && villagersDraw) villagersDraw.face(player);
  const groundY = groundNow(player.x, player.z);
  const groundSpeed = Math.hypot(player.vx, player.vz);
  
  
  
  
  
  
  
  if (feet.walked({
    distanceM: Math.hypot(player.x - wasAt.x, player.z - wasAt.z),
    speedMs: groundSpeed,
    running: Boolean(intent.run),
    grounded: feetOnGround(air),
    nowS: seconds,
  })) sfx.play('move.step');
  
  
  
  
  
  
  
  const lift = airPose.lift + character.hop.lift;
  character.object.position.set(player.x, groundY + lift, player.z);
  character.object.rotation.y = player.heading;
  character.object.rotation.x = airPose.flip;
  
  
  const squashY = airPose.squash * character.hop.squash;
  const squashXZ = 1 / Math.sqrt(squashY);
  character.object.scale.set(squashXZ, squashY, squashXZ);
  
  
  
  
  
  character.update(dt, { speed: groundSpeed, carrying: state.carrying, heft: placing ? heftOf(placing.item) : 0 });
  
  if (toolInHand && (toolInHand.pc !== character || toolInHand.pc.action !== toolInHand.swing)) {
    toolInHand.pc.holdTool(null);
    toolInHand = null;
  }

  
  
  const t = econNow();
  const frameEvents = advance(world, t);
  visits = collectSales(visits, frameEvents, route);
  
  
  
  
  noteEconomyEvents(frameEvents);
  
  
  if (frameEvents.length) touchSave('world');
  
  
  
  
  const walkAt = inside && wentInAt ? wentInAt : player;
  if (!savedSpot || Math.hypot(walkAt.x - savedSpot.x, walkAt.z - savedSpot.z) > SAVE_MOVE_M) touchSave('walk');
  if (saver) saver.tick(now);
  
  
  
  
  cloud.tick(Date.now());
  if (awayLine && frames > 2) { hud.say(awayLine.text, seconds, 8); awayLine = null; }
  syncOrchard(t);
  syncBuildings();
  syncLand();
  onHomes(syncHomes(village, world, t));
  const kinds = seedKinds(world);
  if (!kinds.includes(seedKind)) seedKind = kinds[0] || null;
  
  const talkAim = talkingToVillager() ? { type: 'villager', id: talkWith.id } : { type: 'cat' };
  
  
  
  
  
  
  
  
  
  aim = !feetOnGround(air) ? null
    : talk ? talkAim
      : chooseTarget(aim, inside ? [] : view, player,
        
        
        { canPlant: !inside && kinds.length > 0, prefer, places: placesNow() }, reachCfg());
  if (prefer !== null && targetKey(aim) !== (typeof prefer === 'string' ? prefer : `tree:${prefer}`)) prefer = null;
  toolChoice = keepChoice(toolChoice, targetKey(aim)); 
  prompt = promptFor(aim, ctxFor(t));
  
  
  if (placing) {
    const p = placingNow();
    placeAt = p.spot;
    placeWhy = p.why;
    prompt = placingPrompt();
    hold = null;
  } else if (placeAt) {
    placeAt = null;
    placeWhy = null;
  }
  
  
  
  if (shaping) {
    const sh = shapingNow();
    shapeAt = sh.spot;
    shapeWhy = sh.why;
    prompt = shapingPrompt() || prompt;
    hold = null;
  } else if (shapeAt) {
    shapeAt = null;
    shapeWhy = null;
  }
  if (hold) {
    
    const h = holdStep(hold, Math.max(0, (performance.now() - holdStartedAt) / 1000 - hold.s), prompt);
    hold = h.hold;
    holdProgress = h.progress;
    if (h.fire) doAct(h.fire);
  } else {
    holdProgress = 0;
  }

  
  
  
  
  const wantLook = talk && talkShown && talkShown.look ? signPoint(talkShown.look) : null;
  if (wantLook) lookPoint = wantLook;
  lookBlend = Math.max(0, Math.min(1, lookBlend + (wantLook ? dt : -dt) / LOOK_S));
  if (lookBlend === 0 && !wantLook) lookPoint = null;
  const aimAt = aimPoint(player, groundY + lift, cameraFit());
  
  
  if (talk && talkingToVillager()) aimAt.y += Math.max(0, talkHeightM() - playerHeightNow()) * 0.6;
  if (lookPoint && lookBlend > 0) {
    const k = lookBlend * lookBlend * (3 - 2 * lookBlend);
    const ly = groundNow(lookPoint.x, lookPoint.z) + cameraFit().aimHeightM;
    aimAt.x += (lookPoint.x - aimAt.x) * k;
    aimAt.y += (ly - aimAt.y) * k;
    aimAt.z += (lookPoint.z - aimAt.z) * k;
  }
  follow = followStep(follow, aimAt, dt);
  
  
  
  
  
  
  const camDist = airPose.camDist * (inside ? INSIDE_CAM_DIST : 1);
  const pose = cameraPose(follow, camDist === 1 ? frameNow : { ...frameNow, distanceM: frameNow.distanceM * camDist });
  camera.position.set(pose.position.x, pose.position.y, pose.position.z);
  target.set(pose.target.x, pose.target.y, pose.target.z);
  camera.lookAt(target);

  curveUniforms.uCurveFocus.value.copy(target);
  pops.update(animSeconds, armsOf());
  orchard.update(animSeconds);
  
  
  
  
  
  
  particles.update(dt * state.anim, animSeconds, orchard.sources(), { wind: windUniforms.uFmlWind.value });
  
  
  insects.update(dt * state.anim, { x: player.x, z: player.z, season: seasonNow(), planet: planetId, heightAt: groundNow });
  
  
  
  if (birds) birds.update(dt * state.anim, animSeconds, orchard.sources(), { player: { x: player.x, z: player.z, speed: groundSpeed } });
  
  
  
  
  
  if (moleDraw) {
    moleDraw.group.visible = onHome();
    if (onHome() && mole) {
      stepMole(mole, dt * state.anim, { inside: moleLand, player });
      moleDraw.update(moleView(mole), { look: talkingToMole() ? { x: player.x, z: player.z } : null });
    }
  }
  land.update(seconds);
  const cycle = dayCycle(state.time);
  cycle.emissive.fire *= flicker(animSeconds, FIRE_FLICKER_SEED);
  daylight.apply(cycle, target, renderer);
  sky.space = airPose.fade;
  sky.update(cycle, camera, target, seconds, curveUniforms.uCurve.value);
  
  
  
  
  
  
  
  
  if (inside) {
    sky.mesh.visible = false;
    scene.background = INSIDE_BACKDROP;
  } else {
    if (scene.background === INSIDE_BACKDROP) scene.background = null;
    if (!skyMasked) sky.mesh.visible = true;
  }
  const pixelsPerRadian = renderer.domElement.height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  night.update(cycle, target, pixelsPerRadian);
  post.setBloom(cycle.bloom * settings.effects);
  renderer.info.reset();
  post.render();
  
  
  
  

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const anyOpen = Boolean(card || talk || choice.isOpen || placing || menu.isOpen || soundCard.isOpen
    || (craftCard && craftCard.isOpen) || panel.isOpen || boardCard.isOpen
    || deedsCard.isOpen || installCard.isOpen || accountCard.isOpen || assemblyCard.isOpen
    || Boolean(shaping) || Boolean(shapeCard && shapeCard.isOpen));
  
  
  
  
  cardBack.sync();
  const nextAway = autoHideStep(hudAway, { nowS: seconds, speed: player.speed, wokeAtS: hudWokeAtS, anyOpen });
  
  
  if (nextAway !== hudAway) {
    hudAway = nextAway;
    document.body.classList.toggle('hudaway', hudAway.hidden);
  }
  
  
  menu.setLive(visitButton.classList.contains('live'));
  
  
  
  
  
  
  
  
  
  
  audio.listen(seconds, { expecting: Boolean(music.state.playing) });
  menu.setSilent(audio.silence);
  
  if (soundCard.isOpen) soundCard.paint();

  hud.update(prompt, holdProgress, seconds);
  
  
  
  hud.today(todayLine(t));
  
  
  
  hud.quest(goalView(world, t));
  
  
  
  settleTown();
  
  
  paintAssembly();
  
  
  
  
  
  guideUi.update({
    world,
    t: econNow(),
    planet: planetId,
    player,
    nowS: seconds,
    dt,
    view: { width: window.innerWidth, height: window.innerHeight },
    tipState: {
      canJump: !jumpButton.hidden,
      
      
      
      hasTools: toolBarState.visible,
      placing: Boolean(placing),
      visitOpen: panel.isOpen,
      
      
      busy: Boolean(anyOpen || air || !document.getElementById('arrive').hidden
        || document.body.classList.contains('arriving')),
    },
  });
  hud.pockets(pops.shown(world.pockets));
  hud.seeds(kinds, seedKind);
  
  const chosenTool = choiceFor(toolChoice, targetKey(aim));
  toolBarState = barState(toolBarState, { tool: prompt ? prompt.tool : null, chosen: chosenTool, nowS: seconds });
  toolBar.update(prompt ? prompt.tool : null, chosenTool);
  
  
  
  
  toolBar.setVisible(toolBarState.visible || cornerIsOpen(corners, 'tools'));
  
  
  
  
  if (cornerIsOpen(corners, 'pockets') && pocketsEl.hidden) corners = closeCorners(corners);
  syncCorners();
  syncForage(t, { x: target.x, z: target.z });
  
  
  
  syncFinds();
  findsDraw.update(animSeconds, { x: target.x, z: target.z });
  
  craftCard.tray(madeTray(world), placing ? placing.item : null);
  if (craftCard.isOpen) showCraft();
  craftButton.classList.toggle('on', craftCard.isOpen || Boolean(placing));
  placingEl.hidden = !placing;
  document.body.classList.toggle('placing', Boolean(placing));
  
  
  placedDraw.ghost(placing && !inside ? placing.item : null, inside ? null : placeAt, !placeWhy);
  placedDraw.update(world, { x: target.x, z: target.z });
  if (roomDraw) {
    roomDraw.ghost(placing && inside ? placing.item : null, inside ? placeAt : null, !placeWhy);
    roomDraw.update(world, inside ? { x: player.x, z: player.z } : { x: 0, z: 0 });
  }
  syncFurniture();
  if (shapeCard && shapeCard.isOpen) paintShape();

  
  
  
  
  const focusNow = { x: target.x, z: target.z };
  shelvesDraw.show(world.shop.shelves, shopAnchors, SHOP_P);
  customersDraw.update(visits, route, t, dt * state.anim, { focus: focusNow });

  
  
  
  
  
  villagersDraw.update(world, t, dt, {
    animDt: dt * state.anim, focus: focusNow, activity: talk && talkingToVillager() ? voice.activity() : 0,
    poseFor: meeting ? assemblyPoseFor : null,
  });
  
  
  let badgeId = aim && aim.type === 'villager' ? aim.id : null;
  if (badgeId === null) {
    let best = Infinity;
    for (const v of villagersDraw.shown) {
      const d = Math.hypot(v.x - player.x, v.z - player.z);
      if (v.visible && !v.inside && d < best) { best = d; badgeId = v.id; }
    }
  }
  const badgeList = [];
  for (const v of villagersDraw.shown) {
    const villager = world.villagers.find((x) => x.id === v.id);
    if (!villager) continue;
    const distance = Math.hypot(v.x - player.x, v.z - player.z);
    const badge = badgeState(villager, { distance, wasVisible: badgeShown.get(v.id) || false, playerHeightM: playerHeightNow() });
    const shownNow = badge.visible && v.visible && !v.inside && v.id === badgeId;
    badgeShown.set(v.id, shownNow);
    const door = mayEnter(villager, homeStage(villager, t));
    badgeList.push({ id: v.id, x: v.x, y: v.y + v.height, z: v.z, state: { ...badge, visible: shownNow, door }, drawn: v.visible });
  }
  levelBadges.update(badgeList, { screenOf: fml.screenOf, nowS: seconds });
  homesDraw.update(world, t, { village, animS: animSeconds, dtS: dt, focus: focusNow, player, screenOf: fml.screenOf, canSpeak: () => !talk, glass: cycle.emissive.glass });
  
  
  
  
  particles.updateSmoke(dt * state.anim, animSeconds, homesDraw.smokeSources(), { wind: windUniforms.uFmlWind.value });
  
  
  particles.updateEmbers(dt * state.anim, animSeconds, fireSources(), { wind: windUniforms.uFmlWind.value });
  const counterLocal = { x: shopAnchors.counter.x, y: shopAnchors.counter.y + 0.35, z: shopAnchors.counter.z };
  const counterScreen = screenAt(SHOP_P, counterLocal);
  shownCoins = countStep(shownCoins, coinTarget(world.coins, visits, t), dt);
  ui.coins(shownCoins);
  if (lastMoneyT !== null && t > lastMoneyT) {
    for (const id of paidBetween(visits, lastMoneyT, t)) {
      const v = visits.find((x) => x.id === id);
      money.paid += 1;
      
      if (v && t < v.payMs + MONEY.flyS * 1000) ui.gain(id, v.coins, { x: counterScreen.x, y: counterScreen.y - 34 }, v.payMs);
    }
    const landed = landedBetween(visits, lastMoneyT, t);
    if (landed.length) {
      money.landed += landed.length;
      ui.bump();
      sound.play(Math.max(...landed.map((id) => iconsFor((visits.find((x) => x.id === id) || { coins: 1 }).coins))));
    }
  }
  lastMoneyT = t;
  ui.updateGains(t);
  ui.flights(flightsAt(visits, t).map((f) => ({ ...f, from: counterScreen })));
  visits = pruneVisits(visits, t);

  const pr = processorOf(world);
  let timerViews = [];
  if (pr) {
    assignment = assignStations(assignment, pr.jobs, jobSlotsOf(pr));
    timerViews = stationViews(pr, t, assignment).map((v, i) => {
      const st = pressAnchors.stations[i] || pressAnchors.stations[0];
      const s = screenAt(PRESS_P, { x: st.x, y: st.y + TIMER_LIFT_M, z: st.z });
      return { ...v, key: `station${i}`, x: s.x, y: s.y, inView: s.inView };
    });
  }
  ui.timers(timerViews);
  
  
  if (talk) {
    const s = speakerPoint();
    if (Math.hypot(player.x - s.x, player.z - s.z) > talkLeaveM()) closeTalk();
  }
  if (talk) {
    talkShown = talkingToMole() ? moleTalkNode(talk, { world, t })
      : talkingToVillager() ? villagerTalkNode(talk, { world, t })
        : talkNode(talk, { world, t, land: landNow() });
    talkCard.update(talkShown);
  }
  
  const wantParcel = talk && talkShown && talkShown.look != null ? talkShown.look : null;
  if (wantParcel !== highlighted) {
    highlighted = wantParcel;
    Promise.resolve(land.highlight(wantParcel)).catch(fail);
  }
  signLabels.update(land.labelPoints(), { player, price: landView(world).nextPrice });
  
  ui.updateSpends(animSeconds, speakerScreen());
  if (catObj) {
    
    catBob += ((talk && !talkingToVillager() ? voice.activity() : 0) - catBob) * Math.min(1, dt * 20);
    catObj.scale.set(1 - 0.03 * catBob, 1 + 0.06 * catBob, 1 - 0.03 * catBob);
    catObj.rotation.z = 0.05 * catBob * Math.sin(seconds * 7);
  }

  if (card === 'press' && (!pr || !aim || aim.type !== 'processor')) closeCard();
  if (card === 'shop' && (!aim || aim.type !== 'shop')) closeCard();
  
  if (card === 'store' && (!aim || aim.type !== 'store')) closeCard();
  if (card === 'notice' && (!aim || aim.type !== 'townHall')) closeCard();
  
  
  
  if (card === 'store' && aim && aim.id && aim.id !== storeShown) closeCard();
  if (card === 'store') {
    const c = counterAt(storeShown);
    cards.store(storeView(world, t, storeShown), screenAt(TOWN_P[storeShown], { x: 0, y: 2.4, z: 0 }));
  } else if (card === 'notice') {
    const c = counterAt('townHall');
    cards.notice(noticeView(world, t), screenAt(TOWN_P.townHall, { x: 0, y: 3.0, z: 0 }));
  } else if (card === 'press') {
    const free = Math.max(0, timerViews.findIndex((v) => v.idle));
    const st = pressAnchors.stations[free] || pressAnchors.stations[0];
    cards.press(recipeMenu(world, pr, t, { chosen: batchChoice }), screenAt(PRESS_P, { x: st.x, y: st.y + CARD_LIFT_M, z: st.z }));
  } else if (card === 'shop') {
    cards.shop(shopInfo(t), screenAt(SHOP_P, { ...counterLocal, y: counterLocal.y + 1.6 }));
  }

  fml.land = land.stats;
  
  fml.town = {
    hour: Math.round(hourAt(world, t) * 100) / 100,
    card: card === 'store' ? storeShown : card === 'notice' ? 'townHall' : null,
    at: aim && (aim.type === 'store' || aim.type === 'townHall') ? (aim.id || 'townHall') : null,
    store: card === 'store' ? storeView(world, t, storeShown) : null,
    notice: noticeView(world, t),
    register: townOf(world),
  };
  
  const drawnBuild = character.rig && character.rig.build ? character.rig.build : playerBuild;
  fml.player = {
    x: player.x, z: player.z, heading: player.heading, speed: groundSpeed,
    species: character.rig ? character.rig.species : null, build: drawnBuild, name: PLAYER_NAMES[drawnBuild] || null, height: playerHeightNow(),
  };
  
  
  
  fml.jump = {
    kind: air ? air.kind : null,
    phase: airPose.phase,
    lift: Math.round(airPose.lift * 1000) / 1000,
    flip: Math.round((((airPose.flip % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) * 1000) / 1000,
    fade: Math.round(airPose.fade * 1000) / 1000,
    control: airPose.control,
    to: flightTo,
    y: Math.round(character.object.position.y * 1000) / 1000,
    ground: Math.round(groundY * 1000) / 1000,
  };
  
  
  
  fml.hold = {
    
    progress: jumpHold ? Math.round(holdAt(jumpHold, now) * 1000) / 1000 : 0,
    fired: Boolean(jumpHold && jumpHold.fired),
  };
  fml.place = placeNotice.stats;
  fml.guide = { ...guideUi.stats };
  fml.finds = {
    here: findsHere().map((f) => ({ id: f.id, kind: f.kind, good: f.good, container: f.container, style: f.style, treasure: f.treasure, ready: f.ready, x: f.x, z: f.z })),
    drawn: findsDraw ? findsDraw.stats : null,
    total: world.finds.length,
    taken: world.finds.filter((f) => f.takenAt !== null).length,
  };
  fml.planet = {
    id: planetId,
    name: SYSTEM[planetId].name,
    home: onHome(),
    radius: SYSTEM[planetId].radius,
    season: SYSTEM[planetId].season || state.season,
    weather: SYSTEM[planetId].weather.id,
    elements: SYSTEM[planetId].elements,
    visited: [...visited.keys()].sort((a, b) => a - b),
  };
  
  
  
  stepVisit(dt);
  
  fml.intent = intent;
  fml.stick = input.stick;
  fml.interact = {
    target: aim, verb: prompt ? prompt.verb : null, label: prompt ? prompt.label : '', why: prompt ? prompt.why : null,
    holdLabel: prompt ? prompt.holdLabel : '', holdProgress, holding: Boolean(hold),
    tool: prompt ? prompt.tool : null, chosen: choiceFor(toolChoice, targetKey(aim)),
    
    
    open: prompt ? prompt.open : null, storeId: prompt ? prompt.storeId || null : null,
  };
  
  
  
  
  
  
  
  fml.l8 = hud.verb;
  fml.q1 = {
    
    
    
    
    act: hud.act,
    actCannot: pickButton.classList.contains('cannot'),
    refusal: promptEl.hidden ? null : promptEl.textContent,
    
    said: hud.said,
    presses,
    hudAway: hudAway.hidden,
    walkingSinceS: hudAway.walkingSinceS,
    wokeAtS: hudWokeAtS,
    nowS: seconds,
    afterS: AUTO_HIDE.afterS,
    menu: { open: menu.isOpen, live: menu.live, ...menu.stats },
    
    
    
    
    
    back: { ...cardBack.stats, armed: cardBack.armed, historyLength: window.history.length },
  };
  
  
  
  
  fml.l2 = {
    ...todayLine(t),
    firstPlayed,
    shown: todayEl.hidden ? null : todayEl.getAttribute('aria-label'),
    skyHour: state.time,
    econHour: Math.round(hourAt(world, t) * 100) / 100,
  };
  const tr = fml.track;
  tr.minX = Math.min(tr.minX, player.x); tr.maxX = Math.max(tr.maxX, player.x);
  tr.minZ = Math.min(tr.minZ, player.z); tr.maxZ = Math.max(tr.maxZ, player.z);
  tr.maxR = Math.max(tr.maxR, Math.hypot(player.x, player.z));
  
  
  
  audio.duck(voice.state.speaking);
  
  
  
  
  
  
  
  music.tick({ frames: fml.frames, season: seasonNow(), night: isDark(world, t) });
  
  
  
  
  
  
  ambience.tick({
    frames: fml.frames, season: seasonNow(), night: isDark(world, t), weather: weatherNow().id, waterM: nearestWaterM(),
    x: player.x, z: player.z, heading: player.heading, tier: fml.tier,
  });
  fml.frames++;
  fml.drawCalls = renderer.info.render.calls;
  
  
  
  
  
  
  
  
  
  
  
  fml.memory = {
    geometries: renderer.info.memory.geometries,
    textures: renderer.info.memory.textures,
    programs: renderer.info.programs ? renderer.info.programs.length : null,
  };
  fml.triangles = baseTriangles + orchard.triangles + shelvesDraw.triangles + buildingTris.shop + buildingTris.press 
    + customersDraw.drawnTriangles
    + villagersDraw.drawnTriangles + homesDraw.triangles 
    + forageDraw.triangles 
    + placedDraw.triangles 
    + findsDraw.triangles; 

  fpsFrames++;
  if (!fpsStart) fpsStart = now;
  if (now - fpsStart >= 1000) {
    fml.fps = Math.round((fpsFrames * 1000) / (now - fpsStart));
    fpsFrames = 0;
    fpsStart = now;
    
    
    const load = timingLine(fml.timing);
    const sample = fml.perfSample ? `  perf_sample ${JSON.stringify(fml.perfSample)}` : '';
    
    
    
    
    
    
    hudText.textContent = `tier ${fml.tier}  ${fml.fps} fps  calls ${fml.drawCalls}  tris ${fml.triangles}${slowLine(fml.spans)}  audio ${audio.contextState}${audio.muted ? ' muted' : ''}${audio.speaking ? ' ducked' : ''}\nWASD/arrows walk, Shift run, E act (hold: fell), F fell, Q seed, C carry${state.carrying ? ' (carrying)' : ''}, B workshop, R turn, Esc put away, J jump (twice: fly), M sound${load ? `\n${load}${sample}` : ''}`;
  }

  
  
  
  
  
  
  
  if (raw > 0) {
    frameMs[frameCursor] = raw * 1000;
    frameCursor = (frameCursor + 1) % FRAME_WINDOW;
  }
  perf.tick(now);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  if (!pinnedTier && fml.ready) {
    if (!watch) {
      if (frames > 3) {
        if (!measureStart) measureStart = now;
        samples.push(raw * 1000);
        const decision = decideTier(samples, samples.length, now - measureStart);
        if (decision) {
          if (isWorse(decision.tier, fml.tier)) applyTier(decision.tier, 'load');
          watch = createTierWatch({ tier: fml.tier, startedAt: now });
        }
      }
    } else {
      const change = watch.sample(raw * 1000, now);
      if (change) applyTier(change.tier, change.reason);
    }
  }
  
  
  if (++frames === 3) {
    fml.ready = true;
    timing.mark('ready');
    offline.gameReady();
    openJoinLink();
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    funnel.gameStart({ tier: fml.tier });
    
    
    
    
    villagerSource().sweep().catch(() => {});
  }
  requestAnimationFrame(frame);
}





load().then(() => { stopWarming(); requestAnimationFrame(frame); }, fail);




























function openJoinLink() {
  const code = joinCodeOf(location.search);
  fml.i13.link = code;
  if (!code) return;
  fml.i13.opened += 1;
  panel.show();
  goVisit(code).catch((e) => { endVisit(); visit.say(String(e.message || e)); });
}
