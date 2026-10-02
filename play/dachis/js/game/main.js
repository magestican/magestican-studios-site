

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
import { setPortraitStage, prewarmDex } from './art/portraitRender.js';
import { celLook, setLineRole } from './art/look/celLook.js';
import { initBattleFx, updateBattleFx } from './features/battle/battleFx3d.js';
import { lookName } from './art/look/celRules.js';
import { material as castMaterial } from './art/dachiActor.js';
import { seeActorMaterial } from '../engine/iso/seeThrough.js';
import { generateMap, VOLC } from './features/world/mapgen.js';
import { buildWorld } from './features/world/worldView.js';
import { cam, updateCamera, resetCamera, drawFade, updateSeeThrough, zoomInFromIntro } from './features/world/sectionCamera.js';
import { loadBakedForms } from './art/scenery/kit.js';
import { createPlayerView, updatePlayer, drawPlayer } from './features/world/player.js';
import { spawnNpcs, updateNpcs, drawNpcs, nearestNpc, separateCrowd } from './features/world/npcs.js';
import { updateWilds, drawWilds, drawWildAlerts } from './features/world/wilds.js';
import { CHAR_SCALE } from './features/world/crowd.js';
import { spotUnderKid, pickUp, hintPickup } from './features/pickups/pickups.js';
import { updateBossLairs, drawBossLairs, lairBodies } from './features/world/bossLair.js';
import { B, startBattle, updateBattle, orderSpecial, orderStance, orderFinisher, orderParry, STANCES, startRitual, useTonic, cycleSwap, tryRun, setFinishHandler } from './features/battle/battle.js';
import { onBattleFinished } from './features/battle/battleEnd.js';
import { placeFighters, drawBattleOverlay, battleFocus } from './features/battle/battleView.js';
import { inArena } from './features/battle/arena.js';
import { updateBattleHud } from './features/battle/battleHud.js';
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

{
  const build = document.querySelector('meta[name=build]')?.content;
  await loadBakedForms('assets/scenery-forms.bin' + (build && build !== 'dev' ? '?v=' + encodeURIComponent(build) : ''));
}
const worldView = buildWorld(S.stage, S.W);



if (lookName(location.search) === 'cel') {
  S.stage.setLook(celLook({ phone: matchMedia('(pointer: coarse)').matches }));
  initBattleFx(S.stage); 
  const cast = [];
  for (const v of ['n', 'c', 'b']) for (const id of ['fur', 'metal', 'lamp-glow']) { const m = castMaterial(v, id, '#ffffff'); cast.push(m, seeActorMaterial(m)); }
  celLook().prewarm(S.stage, cast);
}
S.cam = cam; S.scenery = worldView.scenery; cam.onSection = (id) => worldView.showSection(id);
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
window.__dachis = { G, S, B: () => B, heal: healParty, save: saveGame, music: music.state };


$('touchZone').addEventListener('pointerdown', e => {
  if (S.dialog.active) return; 
  const h = S.hints.hit(e.clientX, e.clientY);
  if (h) { h.onTap(); e.preventDefault(); }
});
installTapAnywhere();
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
$('contBtn').onclick = () => { if (loadGame()) startWithWipe($('contBtn'), () => { intro.clear(); leaveTitle(); enterWorld(); spawnNpcs(); }); };
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
  if (spring) { healParty(); refreshHud(); S.sfx.play('heal'); toast('The warm spring restores your companions!'); saveGame(); }
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
    S.hints.add({ x, y, r: S.stage.pxPerUnit() * 0.8, action: 'action', label: 'Rest', color: '#8ff0ff', onTap: () => { healParty(); refreshHud(); S.sfx.play('heal'); toast('The warm spring restores your companions!'); saveGame(); } });
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
        separateCrowd(dt, lairBodies()); 
        updateStory(dt);
        updateBossLairs(); 
        worldActions();
        if (touched && G.mode === 'world') startBattle(touched);
      }
    } else if (G.mode === 'battle') {
      if (S.dialog.active) dialogActions(); else battleActions();
      updateBattle(dt);
    } else if (G.mode === 'menu') {
      if (mapOpen()) { if (I.pressed('map') || I.pressed('menu') || I.pressed('cancel') || I.pressed('action')) closeMap(); }
      else if (I.pressed('menu') || I.pressed('cancel')) closeMenu();
    }
    else if (G.mode === 'evolve') { if (I.pressed('cancel') && S.evolveCancel) S.evolveCancel(); }
    
    if (G.mode === 'title') { const a = t * 0.12; updateCamera(dt, { x: VOLC.x + Math.cos(a) * 3.5, y: VOLC.y + Math.sin(a) * 3.5 }); }
    else updateCamera(dt, B ? battleFocus() : G.player);
    worldView.update(t);
    drawPlayer(t, { hidden: G.mode === 'title', shout: !!(B && B.shout), hidePet: !!B || !G.party.length, lookAt: B ? B.enemy : null });
    drawNpcs(t);
    drawBossLairs(t, B);
    drawWilds(t, B ? (w => w === B.wild || inArena(w.x, w.y, B, -0.8)) : null);
    if (B) placeFighters(t);
    updateBattleFx(B); setLineRole(B ? 'battle' : 'world'); 
    updateSeeThrough(dt, B, lairBodies()); 
    S.stage.render();
    
    if (B) drawBattleOverlay(octx, t);
    if (G.mode === 'world' && !S.dialog.active) { drawWildAlerts(octx); worldHints(); }
    if (G.mode === 'battle') updateRitual(dt); else updateRitual(0);
    S.hints.draw(octx, t);
    drawFade(octx, innerWidth, innerHeight);
    if (G.mode !== 'title') { updateHud(dt); updateBattleHud(); }
    $('actionBtn').classList.toggle('hidden', !(G.mode === 'world' && I.mode === 'touch'));
  }
  if (S.flash > 0) { octx.fillStyle = `rgba(255,255,255,${Math.min(1, S.flash)})`; octx.fillRect(0, 0, innerWidth, innerHeight); }
  I.endFrame();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
