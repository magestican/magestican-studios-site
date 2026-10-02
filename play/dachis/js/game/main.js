

import { U } from '../engine/core/util.js';
import { createStage } from '../engine/iso/stage.js';
import { createInput, PAD } from '../engine/input/input.js';
import { createHints } from '../engine/ui/hints.js';
import { createDialog, toast } from '../engine/ui/dialog.js';
import { hydrateIcons } from '../engine/ui/icons.js';
import { createSfx } from '../engine/audio/sfx.js';
import { G, S, hasSave, loadGame, saveGame, healParty } from './state.js';
import { SOUNDS } from './sounds.js';
import { music } from './music.js';
import { ambience } from './ambience.js';
import { paintPortrait, paintChoiceIcon } from './art/portraits.js';
import { setPortraitStage, prewarmDex, aerowingRidePortrait } from './art/portraitRender.js';
import { celLook, setLineRole } from './art/look/celLook.js';
import { initBattleFx, updateBattleFx } from './features/battle/battleFx3d.js';
import { lookName } from './art/look/celRules.js';
import { material as castMaterial } from './art/dachiActor.js';
import { seeActorMaterial } from '../engine/iso/seeThrough.js';
import { generateMap, VOLC } from './features/world/mapgen.js';
import { buildWorld } from './features/world/worldView.js';
import { HOME, regionById, generateRegionSliced, mapsToDrop } from './features/world/regions.js';
import { slicer } from '../engine/core/slicer.js';
import { perchById, perchAt, perchesOpen, visit, flightPhase, VISIT_R } from './features/world/travel.js';
import { openPerchMenu, closePerchMenu, perchMenuOpen, pickPerch, installPerchMenu } from './features/hud/perchMenu.js';
import { cam, updateCamera, resetCamera, drawFade, updateSeeThrough, zoomInFromIntro } from './features/world/sectionCamera.js';
import { loadBakedForms } from './art/scenery/kit.js';
import { createPlayerView, updatePlayer, drawPlayer } from './features/world/player.js';
import { spawnNpcs, clearNpcs, updateNpcs, drawNpcs, nearestNpc, separateCrowd } from './features/world/npcs.js';
import { updateWilds, drawWilds, drawWildAlerts, removeWild } from './features/world/wilds.js';
import { CHAR_SCALE } from './features/world/crowd.js';
import { spotUnderKid, pickUp, hintPickup } from './features/pickups/pickups.js';
import { updateBossLairs, drawBossLairs, lairBodies } from './features/world/bossLair.js';
import { B, startBattle, updateBattle, orderSpecial, orderStance, orderFinisher, orderParry, STANCES, startRitual, useTonic, cycleSwap, tryRun, setFinishHandler } from './features/battle/battle.js';
import { onBattleFinished } from './features/battle/battleEnd.js';
import { placeFighters, drawBattleOverlay, battleFocus } from './features/battle/battleView.js';
import { inArena } from './features/battle/arena.js';
import { updateBattleHud } from './features/battle/battleHud.js';
import { installOrderRing, updateOrderRing } from './features/battle/orderRing.js';
import { updateRitual } from './features/capture/ritualView.js';
import { Cutscene } from './features/story/cutscene.js';
import { SCENES } from './features/story/scenes.js';
import { lineKind, lineText, introZoomK } from './features/onboarding/rules.js';
import { tapHint, installTapAnywhere, setupNames, startWithWipe, intro, showResume, youTag } from './features/onboarding/onboarding.js';
import { attract } from './features/onboarding/attract.js';
import { tick as clockTick, activityOf, chapterOf, newClock } from './features/clock/clock.js';
import { afterIntro, updateStory, storyLocksMovement, talkTo } from './features/story/beats.js';
import { updateHud, refreshHud, openMap, closeMap, mapOpen } from './features/hud/hud.js';
import { openMenu, closeMenu } from './features/menu/menu.js';

const $ = id => document.getElementById(id);



const PX = Number(new URLSearchParams(location.search).get('px') ?? 480);
S.stage = createStage($('world'), { viewHeight: 14, shadows: !matchMedia('(pointer: coarse)').matches, pixelHeight: PX || 480 });
if (PX === 0) S.stage.pixel.enabled = false;
setPortraitStage(S.stage); 
S.W = generateMap();

const packUrl = (file) => { const build = document.querySelector('meta[name=build]')?.content; return file + (build && build !== 'dev' ? '?v=' + encodeURIComponent(build) : ''); };
await loadBakedForms(packUrl(regionById(HOME).pack));
let worldView = await buildWorld(S.stage, S.W); 





const maps = new Map([[HOME, S.W]]);
const packsIn = new Set([regionById(HOME).pack]); 
const cover = { a: 0, target: 0, hold: false, done: null, label: '' };
const coverTo = (v) => new Promise((r) => { cover.target = v; cover.done = r; });
let regionJob = null;
function loadRegion(id, at = null) {
  if (regionJob) return regionJob;
  const r = regionById(id);
  if (!r) return Promise.reject(new Error('no region ' + id));
  regionJob = (async () => {
    cover.label = r.name;
    await coverTo(1);
    cover.hold = true;
    performance.mark('region:build ' + id);
    const slice = slicer(8), t0 = performance.now();
    for (const w of G.wilds.slice()) removeWild(w);
    clearNpcs();
    worldView.dispose();
    await slice('dispose');
    if (r.pack && !packsIn.has(r.pack)) { packsIn.add(r.pack); await loadBakedForms(packUrl(r.pack)); slice.mark(); }
    for (const k of mapsToDrop([...maps.keys()], id)) maps.delete(k);
    if (!maps.has(id)) maps.set(id, await generateRegionSliced(id, slice));
    S.W = maps.get(id); G.region = id;
    await slice('map');
    worldView = await buildWorld(S.stage, S.W, slice);
    S.scenery = worldView.scenery;
    const p = at || r.entry;
    G.player.x = p.x; G.player.y = p.y; G.follower.x = p.x; G.follower.y = p.y - 0.6;
    if (id === HOME) spawnNpcs();
    
    for (const k in worldView.scenery.groups) worldView.scenery.groups[k].visible = true;
    for (const k in worldView.tufts) worldView.tufts[k].visible = true;
    resetCamera(); updateCamera(0, G.player);
    await slice('camera');
    
    
    for (const o of worldView.owned) { S.stage.prepare(o); await slice('look ' + o.name); }
    const progBuilt = S.stage.renderer.info.programs.length;
    await S.stage.renderer.compileAsync(S.stage.scene, S.stage.camera);
    slice.mark();
    const progWarm = S.stage.renderer.info.programs.length;
    
    
    worldView.showSection(cam.sec);
    worldView.update(G.t); S.stage.render();
    await slice('first frame');
    S.lastRegionLoad = { id, ms: Math.round(performance.now() - t0), slices: slice.stats(), progBuilt, progWarm };
    if (G.mode === 'world') saveGame();
    if (cover.flight) await flightLanded(); 
    cover.hold = false;
    performance.mark('region:reveal ' + id);
    await coverTo(0);
    performance.mark('region:shown ' + id);
    return S.lastRegionLoad;
  })().finally(() => { regionJob = null; });
  return regionJob;
}
const unloadRegion = () => loadRegion(HOME, regionById(HOME).home);





const RIDE_PX = 220;
const rideFrames = () => [0, 1, 2].map((f) => aerowingRidePortrait(f, RIDE_PX, G.gender).canvas);
function flightLanded() {
  cover.flight.ready = true;
  return new Promise((r) => { cover.flight.land = r; });
}
async function flyTo(id) {
  const p = perchById(id);
  if (!p || regionJob || cover.flight) return null;
  const t0 = performance.now(), frames = rideFrames(); 
  G.mode = 'travel'; document.body.classList.add('flying'); 
  cover.flight = { to: p, t0, ready: false, land: null, frames };
  cover.label = p.name;
  S.sfx.play('dash');
  if (p.region !== G.region) await loadRegion(p.region, p.at);
  else {
    await coverTo(1);
    for (const w of G.wilds.slice()) removeWild(w);
    G.player.x = p.at.x; G.player.y = p.at.y; G.follower.x = p.at.x; G.follower.y = p.at.y - 0.6;
    resetCamera(); updateCamera(0, G.player);
    await flightLanded();
    await coverTo(0);
  }
  cover.flight = null; document.body.classList.remove('flying');
  G.mode = 'world';
  visit(G.flags, G.region, G.player.x, G.player.y);
  saveGame(); refreshHud();
  toast(`Aerowing sets you down at ${p.name}.`);
  S.lastFlight = { id, ms: Math.round(performance.now() - t0), load: S.lastRegionLoad };
  return S.lastFlight;
}
const travelOpts = () => ({ dev: !!S.devTravel });

function restAtSpring() {
  const healed = 'The warm spring restores your companions!';
  healParty(); refreshHud(); S.sfx.play('heal');
  const perch = perchAt(G.region, G.player.x, G.player.y, VISIT_R + 2);
  if (perch) visit(G.flags, G.region, perch.at.x, perch.at.y);
  saveGame();
  if (!perch || !perchesOpen(G.flags, travelOpts()).some((q) => q.id === perch.id)) { toast(healed); return; }
  
  const menu = (note) => { rideFrames(); return openPerchMenu(perch.id, flyTo, travelOpts(), note); };
  if (G.flags.aerowingLent) { if (!menu(healed)) toast(healed); return; }
  toast(healed);
  G.flags.aerowingLent = true; saveGame();
  S.dialog.say([
    { who: 'Aerowing', portrait: 'aerowing', text: 'Kyaaa!' },
    { who: '', text: 'Aerowing swoops down onto the perch by the spring. The Elder has lent you a ride: from any spring you have rested at, it will fly you to another.' },
  ], () => menu());
}
function drawFlight(ctx, f) {
  const W = innerWidth, H = innerHeight, t = (performance.now() - f.t0) / 1000;
  ctx.save(); ctx.globalAlpha = cover.a;
  
  const bands = ['#3fb8ff', '#6fd0ff', '#a8e6ff', '#fff1c4'];
  bands.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, (H * i) / bands.length, W, H / bands.length + 1); });
  
  ctx.lineWidth = 3; ctx.strokeStyle = '#111'; ctx.fillStyle = '#fff';
  for (let i = 0; i < 6; i++) {
    const sp = 90 + i * 37, y = H * (0.12 + ((i * 0.37) % 0.8)), w = 70 + (i % 3) * 40;
    const x = ((t * sp + i * 260) % (W + w * 2)) - w;
    ctx.beginPath(); ctx.ellipse(x, y, w, w * 0.32, 0, 0, 6.3); ctx.fill(); ctx.stroke();
  }
  
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2;
  for (let i = 0; i < 9; i++) {
    const y = H * ((i * 0.113 + 0.05) % 1), x = ((t * 900 + i * 173) % (W + 200)) - 100;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 60 + (i % 3) * 30, y); ctx.stroke();
  }
  const css = Math.min(340, Math.min(W, H) * 0.8), img = f.frames[[0, 1, 2, 1][Math.floor(t * 8) % 4]];
  const bob = Math.sin(t * 3) * 10;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, W / 2 - css / 2, H / 2 - css / 2 + bob, css, css);
  ctx.textAlign = 'center'; ctx.font = '400 26px "Permanent Marker", cursive';
  ctx.lineWidth = 5; ctx.strokeStyle = '#111'; ctx.fillStyle = '#ffe14a';
  const label = 'To ' + f.to.name;
  ctx.strokeText(label, W / 2, H * 0.14); ctx.fillText(label, W / 2, H * 0.14);
  ctx.restore();
  ctx.textAlign = 'left';
}
function drawCover(ctx, dt) {
  if (cover.a !== cover.target) {
    cover.a = cover.target > cover.a ? Math.min(cover.target, cover.a + dt / 0.25) : Math.max(cover.target, cover.a - dt / 0.25);
  }
  if (cover.a === cover.target && cover.done) { const d = cover.done; cover.done = null; d(); }
  const f = cover.flight;
  if (f && f.land && flightPhase((performance.now() - f.t0) / 1000, f.ready).phase === 'land') { const l = f.land; f.land = null; l(); }
  if (cover.a <= 0) return;
  if (f) { drawFlight(ctx, f); return; }
  ctx.fillStyle = `rgba(13,10,20,${cover.a})`; ctx.fillRect(0, 0, innerWidth, innerHeight);
  if (cover.hold && cover.label) {
    ctx.fillStyle = '#ffe45a'; ctx.font = '700 22px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(cover.label, innerWidth / 2, innerHeight / 2); ctx.textAlign = 'left';
  }
}

const rebuildWorld = () => loadRegion(G.region || HOME, { x: G.player.x, y: G.player.y });



if (lookName(location.search) === 'cel') {
  S.stage.setLook(celLook({ phone: matchMedia('(pointer: coarse)').matches }));
  initBattleFx(S.stage); 
  const cast = [];
  for (const v of ['n', 'c', 'b']) for (const id of ['fur', 'metal', 'lamp-glow']) { const m = castMaterial(v, id, '#ffffff'); cast.push(m, seeActorMaterial(m)); }
  celLook().prewarm(S.stage, cast);
}

S.cam = cam; S.scenery = worldView.scenery; cam.onSection = (id) => { worldView.showSection(id); if (G.mode === 'world') saveGame(); };
S.sfx = createSfx({ key: 'dachis:sfx-muted', recipes: SOUNDS });
ambience.init(() => S.sfx.muted);
S.input = createInput({
  bindings: {
    up: ['KeyW', 'ArrowUp'], down: ['KeyS', 'ArrowDown'], left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'],
    run: ['ShiftLeft', 'ShiftRight'], action: ['KeyE', 'Space', 'Enter'], menu: ['Escape', 'KeyM'], map: ['KeyN'],
    special1: ['Digit1', 'Numpad1'], special2: ['Digit2', 'Numpad2'], special3: ['Digit3', 'Numpad3'],
    rit1: ['Digit1', 'Numpad1'], rit2: ['Digit2', 'Numpad2'], rit3: ['Digit3', 'Numpad3'],
    befriend: ['KeyC'], tonic: ['KeyT'], swap: ['KeyQ', 'Tab'], flee: ['KeyR'], cancel: ['Escape', 'Backspace'],
    stance1: ['Digit4', 'Numpad4'], stance2: ['Digit5', 'Numpad5'], stance3: ['Digit6', 'Numpad6'], finisher: ['KeyF'], parry: ['KeyG'],
  },
  padBindings: {
    action: [PAD.A], menu: [PAD.START], run: [PAD.B], cancel: [PAD.B],
    special1: [PAD.X], special2: [PAD.Y], special3: [PAD.RB],
    rit1: [PAD.X], rit2: [PAD.Y], rit3: [PAD.B],
    befriend: [PAD.RT], tonic: [PAD.LT], swap: [PAD.LB], flee: [PAD.BACK],
    stance1: [PAD.UP], stance2: [PAD.DOWN], stance3: [PAD.LEFT, PAD.RIGHT], finisher: [PAD.A], parry: [PAD.B],
  },
  glyphs: { action: { key: 'E', pad: 'A' }, befriend: { key: 'C', pad: 'RT' }, menu: { key: 'Esc', pad: 'Start' } },
  stickZone: $('touchZone'),
  canStartStick: e => G.mode === 'world' && !S.dialog.active && !S.hints.hit(e.clientX, e.clientY),
});
hydrateIcons(document); 
S.hints = createHints(S.input);
S.dialog = createDialog({ paintPortrait, paintChoiceIcon, onBlip: () => S.sfx.play('blip'), format: s => s.replace(/\{name\}/g, G.name),
  
  kindOf: lineKind, textOf: lineText, onAdvance: () => tapHint.learned(),
  onType: (l) => { const k = lineKind(l); if (k !== 'narrate') S.sfx.play(k === 'think' ? 'thought' : 'voice'); } });
S.flash = 0;
setFinishHandler(onBattleFinished);
createPlayerView();
const overlay = $('fx'), octx = overlay.getContext('2d');
function sizeOverlay() {
  const dpr = Math.min(2, devicePixelRatio || 1);
  overlay.width = Math.round(innerWidth * dpr); overlay.height = Math.round(innerHeight * dpr);
  octx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener('resize', sizeOverlay); sizeOverlay();
window.__dachis = { G, S, B: () => B, heal: healParty, save: saveGame, music: music.state, rebuildWorld, loadRegion, unloadRegion, flyTo, rest: restAtSpring, devTravel: (on = true) => { S.devTravel = on; } };
installPerchMenu();


$('touchZone').addEventListener('pointerdown', e => {
  if (S.dialog.active) return; 
  const h = S.hints.hit(e.clientX, e.clientY);
  if (h) { h.onTap(); e.preventDefault(); }
});
installTapAnywhere();
installOrderRing($('touchZone')); 
$('skipBtn').onclick = () => Cutscene.skip();
$('skullBtn').onclick = () => (G.mode === 'menu' ? closeMenu() : openMenu());
$('minimap').onclick = () => openMap();          
$('bigMap').onclick = () => closeMap();
$('actionBtn').addEventListener('pointerdown', e => { e.preventDefault(); S.input.tap('action'); });


document.querySelectorAll('.gbtn').forEach(b => {
  b.onclick = () => { document.querySelectorAll('.gbtn').forEach(x => x.classList.remove('on')); b.classList.add('on'); G.gender = b.dataset.g; };
});
setupNames(); 
if (hasSave()) $('contBtn').classList.remove('hidden');
function leaveTitle() {
  $('title').classList.add('hidden');
  if (music.lofi.wasOn()) music.lofi.setOn(true);
}

function playIntro(start) {
  Cutscene.play(SCENES, () => {
    intro.clear(); enterWorld(); afterIntro();
    zoomInFromIntro(introZoomK); youTag.start(); 
  }, { start, onLine: (sc, li) => intro.save(sc, li) });
}
$('newBtn').onclick = () => {
  if (hasSave() && !confirm('Start a new game? Your current save will be replaced.')) return;
  G.name = ($('nameInput').value.trim() || $('nameInput').placeholder || 'Ace').slice(0, 14);
  G.clock = newClock(); 
  startWithWipe($('newBtn'), () => { intro.clear(); leaveTitle(); playIntro(null); });
};
showResume(SCENES, (p) => {
  G.name = p.name; G.gender = p.gender;
  startWithWipe($('resumeBtn'), () => { leaveTitle(); playIntro({ scene: p.scene, li: p.li }); });
});
attract.init(paintPortrait); 

$('contBtn').onclick = () => { if (loadGame()) startWithWipe($('contBtn'), () => {
  intro.clear(); leaveTitle(); enterWorld();
  if (G.region !== worldView.region) loadRegion(G.region, { x: G.player.x, y: G.player.y }); else spawnNpcs();
}); };
function enterWorld() { resetCamera(); G.mode = 'world';$('hud').classList.remove('hidden'); refreshHud(); }


function worldActions() {
  const I = S.input;
  if (I.pressed('menu')) return openMenu();
  if (I.pressed('map')) return openMap();
  if (!I.pressed('action')) return;
  const spot = spotUnderKid();
  if (spot) return pickUp(spot);
  const n = nearestNpc(G.player.x, G.player.y);
  if (n) return talkTo(n);
  const spring = S.W.objects.find(o => o.heal && U.dist(G.player.x, G.player.y, o.x, o.y) < 1.7);
  if (spring) restAtSpring();
}
function battleActions() {
  const I = S.input;
  if (B && B.ritual) { if (I.pressed('flee') || I.pressed('cancel') && !I.pressed('rit3')) tryRun(); return; }
  for (let k = 0; k < 3; k++) if (I.pressed('special' + (k + 1))) orderSpecial(k);
  for (let k = 0; k < 3; k++) if (I.pressed('stance' + (k + 1))) orderStance(STANCES[k]);
  if (I.pressed('parry')) orderParry();   
  if (I.pressed('finisher') || I.pressed('action')) orderFinisher();
  if (I.pressed('befriend')) startRitual();
  if (I.pressed('tonic')) useTonic();
  if (I.pressed('swap')) cycleSwap();
  if (I.pressed('flee')) tryRun();
}
function dialogActions() {
  const I = S.input;
  if (S.dialog.choosing) { for (let k = 0; k < 3; k++) if (I.pressed('special' + (k + 1))) S.dialog.choose(k); return; }
  if (I.pressed('action')) S.dialog.advance();
  if (G.mode === 'cutscene' && I.pressed('menu')) Cutscene.skip();
}


function worldHints() {
  const p = G.player;
  const spot = spotUnderKid();
  if (spot) { hintPickup(spot); return; }
  const n = nearestNpc(p.x, p.y, 3);
  if (n) {
    const near = U.dist(p.x, p.y, n.x, n.y) < 1.5, [x, y] = S.stage.toScreen(n.x, n.y, S.W.groundAt(n.x, n.y));
    const [, top] = S.stage.toScreen(n.x, n.y, S.W.groundAt(n.x, n.y) + (n.kind === 'elder' ? 1.8 : 1.2) * CHAR_SCALE);
    S.hints.add({ x, y, r: S.stage.pxPerUnit() * 0.45, bubbleY: top - 8, action: near ? 'action' : null, label: near ? 'Talk' : null, onTap: () => { if (U.dist(p.x, p.y, n.x, n.y) < 3) talkTo(n); } });
  }
  const spring = S.W.objects.find(o => o.heal && U.dist(p.x, p.y, o.x, o.y) < 2.4);
  if (spring) {
    const [x, y] = S.stage.toScreen(spring.x, spring.y, S.W.groundAt(spring.x, spring.y));
    S.hints.add({ x, y, r: S.stage.pxPerUnit() * 0.8, action: 'action', label: 'Rest', color: '#8ff0ff', onTap: restAtSpring });
  }
}


let last = performance.now(), dexWarm = false;
function frame(now) {
  
  if (!dexWarm && G.mode === 'world') { dexWarm = true; setTimeout(() => prewarmDex(Object.keys(G.dex.seen).map(Number)), 3000); }
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  G.t += dt;
  const t = G.t, I = S.input;
  I.update(); S.hints.begin(); S.dialog.update(dt); tapHint.update(); youTag.update(dt);
  S.flash = Math.max(0, S.flash - dt * 1.4);
  octx.clearRect(0, 0, innerWidth, innerHeight);
  if (cover.hold) { drawCover(octx, dt); I.endFrame(); requestAnimationFrame(frame); return; } 
  const csc = G.mode === 'cutscene' && Cutscene.scenes ? Cutscene.scenes[Math.min(Cutscene.scene, Cutscene.scenes.length - 1)] : null;
  music.update(G.mode, B, S.cam && S.cam.sec, csc && csc.mood); 
  ambience.update(B ? 'battle' : G.mode, S.cam && S.cam.sec); 
  clockTick(G.clock, dt, activityOf(G.mode, { dialog: S.dialog.active, ritual: !!(B && B.ritual) }), chapterOf(G.flags)); 

  if (G.mode === 'cutscene') {
    Cutscene.update(dt);
    if (S.dialog.active) dialogActions();
    Cutscene.draw(octx, innerWidth, innerHeight);
  } else {
    if (G.mode === 'world') {
      if (S.dialog.active) dialogActions();
      else {
        updatePlayer(dt, !storyLocksMovement());
        updateNpcs(dt);
        const touched = updateWilds(dt, { active: !!G.flags.starter });
        separateCrowd(dt, G.region === HOME ? lairBodies() : []); 
        if (G.region === HOME) { updateStory(dt); updateBossLairs(); } 
        visit(G.flags, G.region, G.player.x, G.player.y); 
        worldActions();
        if (touched && G.mode === 'world') startBattle(touched);
      }
    } else if (G.mode === 'battle') {
      if (S.dialog.active) dialogActions(); else battleActions();
      updateBattle(dt);
    } else if (G.mode === 'menu') {
      if (perchMenuOpen()) { for (let k = 0; k < 3; k++) if (I.pressed('special' + (k + 1))) pickPerch(k); if (I.pressed('menu') || I.pressed('cancel')) closePerchMenu(); }
      else if (mapOpen()) { if (I.pressed('map') || I.pressed('menu') || I.pressed('cancel') || I.pressed('action')) closeMap(); }
      else if (I.pressed('menu') || I.pressed('cancel')) closeMenu();
    }
    else if (G.mode === 'evolve') { if (I.pressed('cancel') && S.evolveCancel) S.evolveCancel(); }
    
    if (G.mode === 'title') { const a = t * 0.12; updateCamera(dt, { x: VOLC.x + Math.cos(a) * 3.5, y: VOLC.y + Math.sin(a) * 3.5 }); }
    else updateCamera(dt, B ? battleFocus() : G.player);
    worldView.update(t);
    drawPlayer(t, { hidden: G.mode === 'title', shout: !!(B && B.shout), hidePet: !!B || !G.party.length, lookAt: B ? B.enemy : null });
    drawNpcs(t);
    if (G.region === HOME) drawBossLairs(t, B);
    drawWilds(t, B ? (w => w === B.wild || inArena(w.x, w.y, B, -0.8)) : null);
    if (B) placeFighters(t);
    updateBattleFx(B); setLineRole(B ? 'battle' : 'world'); 
    updateSeeThrough(dt, B, G.region === HOME ? lairBodies() : []); 
    S.stage.render();
    
    if (B) drawBattleOverlay(octx, t);
    if (G.mode === 'world' && !S.dialog.active) { drawWildAlerts(octx); worldHints(); }
    if (G.mode === 'battle') updateRitual(dt); else updateRitual(0);
    S.hints.draw(octx, t);
    drawFade(octx, innerWidth, innerHeight);
    if (G.mode !== 'title') { updateHud(dt); updateBattleHud(); updateOrderRing(); }
    $('actionBtn').classList.toggle('hidden', !(G.mode === 'world' && I.mode === 'touch'));
  }
  drawCover(octx, dt);
  if (S.flash > 0) { octx.fillStyle = `rgba(255,255,255,${Math.min(1, S.flash)})`; octx.fillRect(0, 0, innerWidth, innerHeight); }
  I.endFrame();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
