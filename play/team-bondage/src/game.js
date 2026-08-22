// Team Bondage - main game orchestrator.

import * as THREE from 'three';
import { InputBus } from 'arbelo/input';
import { SeededRng } from 'arbelo/rng';
import { VOX } from 'arbelo/voxel';
import { generateWorld, WORLD_SIZE } from 'arbelo/procgen';
import { getMap, getSky, frictionFor, DEFAULT_MAP } from 'arbelo/mapspec';
import { getMode, DEFAULT_MODE, killScores, hillOwner, onHill, winner as modeWinner,
         anagramDue } from 'arbelo/modes';

import { buildWorldMeshes, hayOpacityFor } from './map/voxelMesh.js';
import { buildLightRig } from './lightRig.js';
import { rigFromSky } from './lightRigSpec.js';
import { VOX as _VOX } from 'arbelo/voxel';
import { buildCharacter }   from './entities/character.js';
import { Player }           from './entities/player.js';
import { WeaponSystem, WEAPON_DEFS } from './entities/weapon.js';
import { computeAimAssist } from 'arbelo/aim-assist';
import { stepProjectile } from '../../../web-engine/combat/projectileHit.js';
import { Chat } from './ui/chat.js';
import { considerTaunt, newTauntState } from './entities/botTaunts.js';
// (WEAPON_DEFS used in _addTracerForShot)
import { RemotePlayer }     from './entities/remotePlayer.js';
import { MSG }              from './net/protocol.js';
import { pickWord, scramble } from './util/anagram.js';
import { TouchControls }     from './touchControls.js';
import { Chiptune }           from './audio/chiptune.js';
import * as SFX               from './audio/sfx.js';
import { HazardSystem, makeHostSchedule } from './entities/hazard.js';
import { buildSkybox }        from './entities/skybox.js';
import { SkyBrawl }           from './entities/skyBrawl.js';
import { CAMERA_FAR }         from './entities/skyBrawlSpec.js';
import { addBarnSigns }       from './entities/barnSign.js';
import { Bot }                from './entities/bot.js';
import { TracerSystem }       from './entities/tracer.js';
import { FirstPersonWeapon }  from './entities/firstPersonWeapon.js';
import { createPhysicsWorld } from 'arbelo/physics';
import { SnowSystem }         from './entities/snow.js';
import { ChickenPickup }      from './entities/chickenPickup.js';
import { SteakPickups, SIDES as STEAK_SIDES } from './entities/steakPickups.js';
import { PowerUpPickups }   from './entities/powerUps.js';
import {
  POWER_UPS, emptyPowerUpState, applyPowerUp, expirePowerUp, clearOnDeath,
  remainingSeconds, activeDef, scaleFor, cooldownScaleFor, hitRadiusFor,
} from './entities/powerUpSpec.js';
import { computeFlagAction }  from '../../../../web-engine/ctf/flagLogic.js';
import { isInsideHay }        from '../../../web-engine/physics/hidingChecks.js';
import { hitBearingDeg }      from '../../../web-engine/input/hitMath.js';
import { GoreSystem }         from './entities/gore.js';
import { AmbientCritters }    from './entities/ambientCritters.js';
// WORLD_SIZE is already imported above alongside WorldMapGenerator.

const TEAM_HEX = { red: 0xd0503e, blue: 0x4f8adb };
const FLAG_HOME_RADIUS = 3.5;   // steps within this of your own flag stand = capture

// The meat weapon. Shoot STEAK_GOAL floating steaks to arm it, and it holds
// STEAK_THROWS poison shots — Bryan asked for "at least 2". While it is armed
// it is auto-selected and cannot be swapped away from (see _switchWeapon):
// it is a commitment, not an option in a menu.
const STEAK_GOAL = 5;
const STEAK_THROWS = 2;

// A match holds sixteen bodies in total — humans plus bots. Bots exist to fill
// the seats humans have not taken, so every human who joins displaces one
// (see _displaceBotFor) until all sixteen are real people.
export const MATCH_CAP = 16;
export const MAX_BOTS = MATCH_CAP - 1;   // a host is always one of the sixteen
// Bumped from 2.0 → 3.5 on 2026-08-20: the flag stand voxel blocks the
// player from standing directly on top of it, so we can't require an exact
// centre-touch — the whole 3-tile radius around the base centre counts as
// "delivered". Bryan: "when I deliver the flag to my base nothing happens".
// (WIN_SCORE used to live here as a constant. It is now the MODE's — 5
// captures, 30 kills or 90 seconds of held hill — see web-engine/modes/
// gameModes.js and modeWinner()/anagramDue().)
// How far a hitscan shot reaches, and how far a tracer is drawn.
//
// This was a hard-coded 60 (and a 50 for tracers) chosen when the map was 64
// tiles across. At 80x80 the bases are ~96 m apart and the fog now clears to
// 150 m, so a 60 m gun could not reach a target the player could plainly see
// — the shot simply did nothing, which is the worst kind of miss.
const SHOT_RANGE = 80;

// The direction a shot is travelling. Hitscan shots carry `dir`; projectile
// shots carry `vel` and no `dir` at all — which is what broke the first cut of
// contact resolution, because the gore spatter reached for `shot.dir` on a
// pellet that had never had one.
function shotDirection(shot) {
  if (shot.dir) return new THREE.Vector3().fromArray(shot.dir);
  if (shot.vel) return new THREE.Vector3().fromArray(shot.vel).normalize();
  return new THREE.Vector3(0, 0, 1);
}
const NET_TICK_HZ = 20;
const RESPAWN_DELAY = 0.0;      // "immediate" per spec
const ANAGRAM_SECONDS = 10;
const LOBBY_MIN_PLAYERS = 2;
const LOBBY_COUNTDOWN_SECONDS = 5;

export class Game {
  constructor(opts) {
    this.opts = opts;
    this.mesh = opts.mesh;
    this.myId = opts.myId;
    this.isHost = opts.isHost;
    this.character = opts.character;
    this.team = opts.team;
    this.name = opts.name;
    this.seed = opts.seed;               // null on joiner until welcome
    // The map and the mode are HOST-CHOSEN and arrive with the seed in the
    // WELCOME. A joiner that generated a different map from the host would be
    // walking around a world nobody else can see — same failure mode as a
    // seed mismatch, and the same fix: only the host decides.
    this.mapId = opts.mapId || DEFAULT_MAP;
    this.map = getMap(this.mapId);
    this.sky = getSky(this.mapId);
    this.modeId = opts.mode || DEFAULT_MODE;
    this.mode = getMode(this.modeId);
    // KOTH accumulates a fraction of a point per frame; the score on the HUD
    // is the whole part of it, so a 1 Hz tick does not make the number jump.
    this._hold = { red: 0, blue: 0 };

    this.scores = { red: 0, blue: 0 };
    this.gameOver = false;
    this.matchState = 'lobby';           // lobby -> countdown -> playing -> ended
    this._matchEndsAt = 0;               // for countdown / anagram timers
    this.remotePlayers = new Map();      // peerId -> RemotePlayer
    this.playerMeta = new Map();         // peerId -> {name, character, team}
    this.playerMeta.set(this.myId, {
      name: this.name, character: this.character, team: this.team,
    });
    this.flagCarrier = { red: null, blue: null };  // peerId or null
    this.rngShots = new SeededRng((Math.random() * 2 ** 32) >>> 0);
    this._netAccum = 0;
    this._anagram = null;                // { word, scrambled, endsAt, losingTeam }
    this._lastRespawnAt = 0;
    this._killFeed = [];                 // recent kill lines
    this.audio = new Chiptune();
    this._buildCornBar();
    // Bots: host-only. Simulated locally, broadcast as fake peers.
    this.bots = new Map();               // peerId -> Bot
    this.initialBotCount = opts.initialBots || 0;
  }

  // -------------------------------------------------------------------------

  async boot() {
    this._wireNet();

    // On the joiner, we have to wait for the host's WELCOME to get the seed.
    if (!this.isHost) {
      await new Promise((resolve) => {
        const check = () => {
          if (this.seed != null) { resolve(); return; }
          setTimeout(check, 100);
        };
        check();
      });
      // The WELCOME carries the map and the mode too; re-read both before
      // anything is built off them.
      this.map = getMap(this.mapId);
      this.sky = getSky(this.mapId);
      this.mode = getMode(this.modeId);
    } else {
      // Host: broadcast welcome to all newcomers as they join.
      this.mesh.addEventListener('peer-joined', (e) => {
        this._sendWelcome(e.detail.id);
      });
    }

    this._initThree();
    this._buildWorld(this.seed);
    // Kick off render loop IMMEDIATELY so the user sees the world while
    // rapier's WASM downloads (~1 MB). Physics-dependent code guards on
    // `this.physics` being ready.
    this._lastFrame = performance.now();
    requestAnimationFrame((now) => this._frame(now));

    try {
      await this._initPlayer();
    } catch (err) {
      console.error('[boot] physics init failed', err);
      alert('Physics engine failed to load: ' + err.message + '\n\nCheck your network and refresh.');
      throw err;
    }
    this._initInput();

    // Send our HELLO to whoever's out there.
    this._broadcast({ t: MSG.HELLO, name: this.name, character: this.character, team: this.team });

    // Add any initial bots the host requested at match creation.
    if (this.isHost && this.initialBotCount > 0) {
      for (let i = 0; i < this.initialBotCount; i++) this.addBot();
    }
    // Wire mute button. iOS Safari needs touchstart in addition to click:

    // Wire mute button. iOS Safari needs touchstart in addition to click:
    // click sometimes doesn't dispatch on button elements inside a
    // pointer-events:none HUD without a real tap chain.
    const muteBtn = document.getElementById('mute-btn');
    const paintMute = () => { muteBtn.textContent = this.audio.muted ? '🔇' : '🔊'; };
    paintMute();
    const handleMuteToggle = (e) => {
      if (e) e.preventDefault();
      // If audio isn't started yet, the button acts as an ENABLE (not a
      // toggle to muted). Otherwise, plain mute/unmute.
      if (!this.audio.isPlaying) {
        this.audio.setMuted(false);
        paintMute();
        this._tryStartAudio();
      } else {
        this.audio.toggleMuted();
        paintMute();
      }
    };
    muteBtn.addEventListener('click', handleMuteToggle);
    muteBtn.addEventListener('touchstart', handleMuteToggle, { passive: false });

    // Host-only admin control: +Bot button, live-in-session.
    const addBotBtn = document.getElementById('add-bot-btn');
    if (this.isHost) {
      addBotBtn.style.display = 'block';
      const onAddBot = (e) => { if (e) e.preventDefault(); this.addBot(); };
      addBotBtn.addEventListener('click', onAddBot);
      addBotBtn.addEventListener('touchstart', onAddBot, { passive: false });
    }

    // Mature-mode toggle. Persists in localStorage. Toggles blood textures
    // on the world + character armbands + turns on the announcer.
    this.mature = localStorage.getItem('tb.mature') === '1';
    const matureBtn = document.getElementById('mature-btn');
    const paintMature = () => { matureBtn.classList.toggle('on', this.mature); };
    paintMature();
    if (this.mature) this._applyMature(true);
    const onMatureToggle = (e) => {
      if (e) e.preventDefault();
      this.mature = !this.mature;
      localStorage.setItem('tb.mature', this.mature ? '1' : '0');
      paintMature();
      this._applyMature(this.mature);
    };
    matureBtn.addEventListener('click', onMatureToggle);
    matureBtn.addEventListener('touchstart', onMatureToggle, { passive: false });

    // Settings modal (opens with the gear button or Escape).
    const settingsBtn   = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const settingsClose = document.getElementById('settings-close');
    const volSlider     = document.getElementById('volume-slider');
    const volValue      = document.getElementById('volume-value');
    const muteCheck     = document.getElementById('music-mute');
    const savedVol = parseInt(localStorage.getItem('tb.vol') || '35', 10);
    volSlider.value = String(savedVol); volValue.textContent = String(savedVol);
    muteCheck.checked = this.audio.muted;
    const applyVolume = () => {
      const v = parseInt(volSlider.value, 10);
      volValue.textContent = String(v);
      localStorage.setItem('tb.vol', String(v));
      // Both audio paths (HTMLAudio + Web Audio fallback) get scaled.
      if (this.audio._audio) this.audio._audio.volume = (this.audio.muted ? 0 : v / 100);
      if (this.audio.master) this.audio.master.gain.value = (this.audio.muted ? 0 : v / 200);
    };
    applyVolume();
    volSlider.addEventListener('input', applyVolume);
    muteCheck.addEventListener('change', () => {
      this.audio.setMuted(muteCheck.checked);
      paintMute();
      applyVolume();
    });
    // Chat. Outgoing messages go to every peer AND straight into our own log,
    // because _broadcast does not loop back to the sender.
    this.chat = new Chat({
      onSend: (text) => {
        const msg = { t: MSG.CHAT, from: this.myId, name: this.name,
                      team: this.team, text, kind: 'say' };
        this._broadcast(msg);
        this.chat.push(msg);
      },
    });
    this._taunts = newTauntState();

    // Ko-fi link in Settings. A plain anchor, and only if a username has been
    // configured — see web-engine/support/support.js.
    import('../../../web-engine/support/support.js')
      .then(({ mountSupportLink }) => mountSupportLink(document.getElementById('support-slot')))
      .catch(() => {});

    // Aim assist, on by default and remembered. See web-engine/input/aimAssist.js
    // for why it is a hard cone with falloff and a rate cap rather than a snap.
    const aimCheck = document.getElementById('aim-assist');
    if (aimCheck) {
      this.aimAssist = localStorage.getItem('tb.aimassist') !== '0';
      aimCheck.checked = this.aimAssist;
      aimCheck.addEventListener('change', () => {
        this.aimAssist = aimCheck.checked;
        localStorage.setItem('tb.aimassist', this.aimAssist ? '1' : '0');
      });
    }
    const openSettings = (e) => { if (e) e.preventDefault(); settingsModal.classList.add('visible'); };
    const closeSettings = (e) => { if (e) e.preventDefault(); settingsModal.classList.remove('visible'); };
    settingsBtn.addEventListener('click', openSettings);
    settingsBtn.addEventListener('touchstart', openSettings, { passive: false });
    settingsClose.addEventListener('click', closeSettings);
    settingsClose.addEventListener('touchstart', closeSettings, { passive: false });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeSettings();
    });

    // Audio startup - iOS Safari refuses to unlock without a user gesture,
    // and quiet gestures during the initial menu can be lost. Approach:
    //   1. Try to start on ANY gesture that reaches window.
    //   2. Also try again on any tap of the mute button.
    //   3. If audio still isn't playing after ~2s, show a big "Tap to enable
    //      sound" prompt so the user has an unambiguous target.
    const enablePrompt = document.getElementById('enable-sound');
    const tryStartAudio = async () => {
      if (this.audio.isPlaying) return;
      await this.audio.start();
      if (this.audio.isPlaying) {
        enablePrompt.classList.remove('visible');
      }
    };
    window.addEventListener('pointerdown', tryStartAudio);
    window.addEventListener('touchstart', tryStartAudio, { passive: true });
    window.addEventListener('click', tryStartAudio);
    // The big "tap to enable sound" pill.
    const onEnable = (e) => { if (e) e.preventDefault(); tryStartAudio(); };
    enablePrompt.addEventListener('click', onEnable);
    enablePrompt.addEventListener('touchstart', onEnable, { passive: false });
    // Show the prompt if audio hasn't started after 2 seconds.
    setTimeout(() => {
      if (!this.audio.isPlaying) enablePrompt.classList.add('visible');
    }, 2000);
    // Also try to unlock inside the caller of pointerLock() (desktop path).
    this._tryStartAudio = tryStartAudio;

    // Show the lobby banner. Solo host: waits for 2+ players; countdown then
    // starts and match transitions to 'playing'. Joiners get the current
    // matchState via WELCOME.
    this._updateLobbyBanner();
    if (this.isHost) this._maybeStartCountdown();

    // On next frame:
    this.opts.onReady && this.opts.onReady();
    // (frame loop already started above right after _buildWorld)
  }

  // ---- three.js scene -----------------------------------------------------

  _initThree() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(new THREE.Color(this.sky.fog));
    this.opts.canvasParent.appendChild(this.renderer.domElement);

    window.addEventListener('resize', () => this._onResize());

    this.scene = new THREE.Scene();
    // Fog, sky and light rig all come from the map's own entry in mapSpec.js
    // SKIES. Time of day is the cheapest way to make four maps feel like four
    // places, and the fog colour has to be the sky's own 0.75 stop or the map
    // ends in a visible band where the ground stops.
    this.scene.fog = new THREE.Fog(this.sky.fog, this.sky.fogNear, this.sky.fogFar);
    this.scene.background = buildSkybox(this.sky);
    // The brawl itself is real geometry hung 140 m out at 30 degrees of
    // elevation — look north and up. It used to be painted into the texture
    // above; entities/skyBrawlSpec.js records why that could never fight.
    this.skyBrawl = new SkyBrawl(this.scene);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, CAMERA_FAR);
    this.camera.rotation.order = 'YXZ';

    // Lights. Every number lives in lightRigSpec.js — it is the same rig the
    // art/preview/*.html pages hang, and the one art/preview/lightrig.mjs
    // measures, so "measured through the game's own rig" stays true.
    this.scene.add(buildLightRig(rigFromSky(this.sky)));
  }

  _onResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  // ---- world --------------------------------------------------------------

  _buildWorld(seed) {
    const world = generateWorld(seed, this.mapId);
    this.world = world;
    this.grid = world.grid;
    this.scene.add(buildWorldMeshes(world.grid));

    // Flags, if the mode has any. 'both' is CTF's flag-per-base; 'neutral' is
    // One Flag's single flag at the centre, which both teams want and which
    // scores by being carried into the ENEMY base; 'none' is TDM and KOTH.
    this.flagState = { red: 'home', blue: 'home' };  // 'home' | 'carried' | 'dropped'
    this.flagPos   = { red: { ...world.flags.red }, blue: { ...world.flags.blue } };
    this.flagMeshes = {};
    if (this.mode.flags === 'both') {
      this.flagMeshes.red  = this._buildFlagMesh(world.flags.red,  0xff5c4a);
      this.flagMeshes.blue = this._buildFlagMesh(world.flags.blue, 0x7cb0ff);
    } else if (this.mode.flags === 'neutral') {
      // One flag, on the centre feature. It is stored under BOTH keys so the
      // rest of the flag machinery — pickup, drop, carry banner, return —
      // keeps working untouched, and only the capture rule differs.
      const c = { x: world.hillSpawn.x - 0.5, y: Math.floor(world.hillSpawn.y),
                  z: world.hillSpawn.z - 0.5 };
      this.flagPos = { red: { ...c }, blue: { ...c } };
      this.flagMeshes.red = this._buildFlagMesh(c, 0xf0e6d2);
      this.neutralFlag = true;
    }
    // Hand-painted "BARN" name-plate over each barn doorway.
    addBarnSigns(this.scene, world);

    // Scatter snow-farm props (snowmen, barrels, hay bales, fence posts,
    // crates, tractor). Async — the empty group is added immediately and
    // meshes stream in as the GLBs load. Feature: docs/features/map-props.md
    import('./entities/mapProps.js')
      .then(({ scatterMapProps }) => scatterMapProps(this.scene, world))
      .catch((err) => console.warn('[mapProps] scatter failed:', err));

    // The procedural prop kit — the map's own `kit` block. Separate from the
    // GLB props above because it is synchronous and needs no network: the
    // GLBs stream in, these are up on the first frame.
    import('./entities/propKit.js')
      .then(({ scatterPropKit }) => scatterPropKit(this.scene, world))
      .catch((err) => console.warn('[propKit] scatter failed:', err));

    // Ambient life — the arctic's penguins. They stand still and turn to watch
    // whoever is nearest. No other map has any (worldgen returns no spots).
    if (world.ambientSpots?.length) {
      this.critters = new AmbientCritters(this.scene, world.ambientSpots, this.map.ambient);
    }
  }

  _buildFlagMesh(pos, color) {
    const group = new THREE.Group();
    const pole = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 2.2, 0.1),
      new THREE.MeshLambertMaterial({ color: 0x8a5a2b }),
    );
    pole.position.y = 1.1;
    group.add(pole);
    const fabric = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.6, 0.05),
      new THREE.MeshLambertMaterial({ color, flatShading: true }),
    );
    fabric.position.set(0.5, 1.9, 0);
    group.add(fabric);
    // Sit the pole ON TOP of the barn floor voxel (which fills y in [1,2)),
    // not below it. Previous `pos.y - 1` buried 90 % of the pole in the
    // floor so only the flag fabric poked out — Bryan called that "flags
    // somewhere off the map".
    group.position.set(pos.x + 0.5, pos.y, pos.z + 0.5);
    this.scene.add(group);
    return group;
  }

  // ---- player -------------------------------------------------------------

  async _initPlayer() {
    const spawn = this.world.spawns[this.team];
    this.physics = await createPhysicsWorld({ grid: this.grid });
    // Ice-drift is the game's identity so no map turns it off, but a swept
    // rink is not the same surface as a snow field. frictionFor() is the one
    // number that differs.
    this.player = new Player(this.camera, this.physics, spawn, this.team, this.character,
                             { friction: frictionFor(this.mapId), grid: this.grid });
    this.weapons = new WeaponSystem(this.scene);
    this.tracers = new TracerSystem(this.scene);
    this.snow    = new SnowSystem(this.scene, this.player.pos, this.grid);
    this.gore    = new GoreSystem(this.scene);
    // Camera child = first-person weapon viewmodel. Also attach the camera
    // to the scene so its children (the viewmodel) render.
    this.scene.add(this.camera);
    this.viewmodel = new FirstPersonWeapon(this.camera);
    this.hazards = new HazardSystem(this.scene, this.grid);
    // Chicken slingshot pickup on the centre hill (host-authoritative).
    this.chickenPickup = new ChickenPickup(this.scene, this.world.hillSpawn, {
      onPickup: (peerId) => {
        // Host: broadcast the pickup + give the pickup to whoever it was.
        this._broadcast({ t: MSG.CHICKEN_PICK, by: peerId, respawnAt: Date.now() + 30000 });
        this._grantChicken(peerId);
      },
    });
    // Local per-player "have a chicken shot ready" flag.
    this.chickenAmmo = 0;
    // Steak system: 4 floating breakable steaks (one per edge). Count how
    // many the local player has broken. At 5, next fire launches a
    // sticky-poison steak. See docs/features/steak-weapon.md.
    this.steakPickups = new SteakPickups(this.scene, {});
    this.steakScore = 0;                // local counter, 0..5
    this.steakAmmo = 0;                 // 0 or 1 charged throws
    this._steakPoisonBy = new Map();    // victimId -> attackerId
    // Power-ups: a protein shake on the gym deck, a cheese wheel on the dairy
    // deck. Both are 20-second effects on ONE local slot — see
    // docs/features/power-ups.md and entities/powerUpSpec.js.
    this.powerUpPickups = new PowerUpPickups(this.scene, this.world.powerUpSpawns, {
      onPickup: (id, peerId) => {
        this._broadcast({ t: MSG.POWERUP_PICK, id, by: peerId,
                          respawnAt: Date.now() + 30000 });
        this._grantPowerUp(id, peerId);
      },
    });
    this.powerUpState = emptyPowerUpState();
    // Every other player's current size, so a shot at a giant is a shot at a
    // giant-sized target (see _raycastPlayers).
    this._peerScale = new Map();        // peerId -> sizeScale
    if (this.isHost) {
      // Host-side poison DOT: 2 dmg/sec to every poisoned player.
      this._steakPoisonTimer = setInterval(() => this._steakPoisonTick(), 1000);
    }
    this._hazardRngHost = this.isHost ? new SeededRng((this.seed ^ 0x51a9a7d1) >>> 0) : null;
    this._nextHazardAt = performance.now() + 4000;   // first wave 4s after boot
  }

  _initInput() {
    this.input = new InputBus(window);

    // Detect touch device: no pointer-lock on iOS Safari; use touch UI instead.
    this.isTouch = ('ontouchstart' in window)
      || (navigator.maxTouchPoints > 0)
      || window.matchMedia?.('(pointer: coarse)').matches;

    // Desktop: mouse look via pointer-lock movement events.
    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement !== this.renderer.domElement) return;
      this.player.addMouseLook(e.movementX, e.movementY);
    });

    // Touch: virtual joystick + look pad + button cluster overlay.
    if (this.isTouch) {
      this.touch = new TouchControls(this.opts.canvasParent, this.input, {
        onLook: (dx, dy) => this.player.addMouseLook(dx, dy, 0.006),
        onFire: () => {},                       // handled via synthetic 'fire' action
        onJump: () => this.input.setSynthetic('jump', true),
        onWeapon: (i) => this._switchWeapon(i),
      });
    }

    // Desktop HUD weapon slots (top row) are clickable too. Slot 4 (chicken)
    // is wired lazily on pickup — see _grantChicken.
    for (const el of document.querySelectorAll('#weaponbar .wpn:not(.chicken)')) {
      const idx = Number(el.dataset.w);
      if (!Number.isFinite(idx)) continue;
      el.addEventListener('click', (e) => { e.preventDefault(); this._switchWeapon(idx); });
    }
  }

  pointerLock() {
    // Desktop only. On touch, controls appear immediately with no lock needed.
    if (this.isTouch) return;
    this.renderer.domElement.requestPointerLock?.().catch(() => {});
    this.renderer.domElement.addEventListener('click', () => {
      if (document.pointerLockElement !== this.renderer.domElement) {
        this.renderer.domElement.requestPointerLock?.().catch(() => {});
      }
    });
  }

  // ---- net ----------------------------------------------------------------

  _wireNet() {
    this.mesh.addEventListener('message', (e) => this._onMessage(e.detail.from, e.detail.message));
    this.mesh.addEventListener('peer-left', (e) => {
      const rp = this.remotePlayers.get(e.detail.id);
      if (rp) { rp.destroy(this.scene); this.remotePlayers.delete(e.detail.id); }
      this.playerMeta.delete(e.detail.id);
      // If they were carrying a flag, drop it at home (simplification).
      for (const c of ['red', 'blue']) {
        if (this.flagCarrier[c] === e.detail.id) {
          this._returnFlag(c);
          if (this.isHost) this._broadcast({ t: MSG.FLAG_DROP, by: e.detail.id, color: c, at: [this.world.flags[c].x, this.world.flags[c].y, this.world.flags[c].z] });
        }
      }
    });
  }

  _sendWelcome(peerId) {
    this.mesh.send(peerId, {
      t: MSG.WELCOME, seed: this.seed, mapId: this.mapId, mode: this.modeId,
      scores: this.scores,
      playersMeta: [...this.playerMeta.entries()],
      matchState: this.matchState,
      matchEndsAt: this._matchEndsAt,
    });
  }

  // Host-only: recount teams across all known peers (including self) and
  // reassign anyone breaking balance. Broadcasts a TEAM_ASSIGN with the
  // resulting map so every client sees the same assignments.
  _rebalanceTeams() {
    if (!this.isHost) return;
    const peers = [...this.playerMeta.entries()];
    const assignments = {};
    for (const [pid, meta] of peers) assignments[pid] = meta.team;
    // Count
    const count = () => {
      let r = 0, b = 0;
      for (const pid in assignments) {
        if (assignments[pid] === 'red') r++; else b++;
      }
      return { r, b };
    };
    // Reassign peers newest-first until |r-b| <= 1. Deterministic order by
    // peerId sort so every peer arrives at the same result if they replay it.
    const orderedIds = Object.keys(assignments).sort();
    let safety = 20;
    while (safety-- > 0) {
      const { r, b } = count();
      if (Math.abs(r - b) <= 1) break;
      const overflowTeam = r > b ? 'red' : 'blue';
      const underTeam    = r > b ? 'blue' : 'red';
      // Move the LAST peer on the overflow team (newest joiner) to under.
      let moved = false;
      for (let i = orderedIds.length - 1; i >= 0; i--) {
        const pid = orderedIds[i];
        if (assignments[pid] === overflowTeam) {
          assignments[pid] = underTeam;
          moved = true;
          break;
        }
      }
      if (!moved) break;
    }
    // Apply locally + broadcast.
    for (const pid in assignments) {
      const meta = this.playerMeta.get(pid);
      if (meta && meta.team !== assignments[pid]) {
        meta.team = assignments[pid];
        if (pid === this.myId) {
          this.team = assignments[pid];
          this.player.team = this.team;
          this.player.spawn = { ...this.world.spawns[this.team] };
        }
        // Update remote player visual (armband colour would need rebuild;
        // simplification: just log for now, respawn will use new spawn).
      }
    }
    this._broadcast({ t: MSG.TEAM_ASSIGN, assignments });
  }

  _maybeStartCountdown() {
    if (!this.isHost) return;
    if (this.matchState !== 'lobby') return;
    const nPlayers = this.playerMeta.size;
    if (nPlayers < LOBBY_MIN_PLAYERS) return;
    // Rebalance first.
    this._rebalanceTeams();
    // Start countdown.
    const endsAt = Date.now() + LOBBY_COUNTDOWN_SECONDS * 1000;
    this.matchState = 'countdown';
    this._matchEndsAt = endsAt;
    this._broadcast({ t: MSG.MATCH_STATE, state: 'countdown', endsAt });
    // Also send SCORES + CURRENT playerMeta again for good measure.
    this._updateLobbyBanner();
    // Timer to flip to 'playing'.
    setTimeout(() => {
      if (this.matchState === 'countdown') {
        this.matchState = 'playing';
        this._broadcast({ t: MSG.MATCH_STATE, state: 'playing' });
        this._updateLobbyBanner();
      }
    }, LOBBY_COUNTDOWN_SECONDS * 1000);
  }

  // Host-only: add an AI bot. Team is chosen to balance current sides.
  // GORE mode: "LOOOOSERRR", to the player who just died. Voice + a big red
  // banner, because the announcer can be muted and the insult should still
  // land. Deliberately does NOT reuse the STEAK-ANIHILATION overlay — that one
  // celebrates a kill for the room; this one is addressed to one person.
  _announceLoser() {
    try { SFX.announce('LOSER'); } catch (_) {}
    const el = document.createElement('div');
    el.textContent = 'LOOOOSERRR';
    Object.assign(el.style, {
      position: 'fixed', left: '50%', top: '34%',
      transform: 'translate(-50%,-50%) scale(0.5) rotate(-4deg)',
      color: '#ff2a1a', font: '900 min(13vw, 104px)/1 Georgia, serif',
      letterSpacing: '0.04em',
      textShadow: '0 0 24px #ff0, 0 5px 0 #4a0000, 0 10px 26px rgba(0,0,0,.9)',
      pointerEvents: 'none', zIndex: '9999', opacity: '1',
      transition: 'transform .4s cubic-bezier(.2,1.7,.3,1), opacity .5s ease-out 1.5s',
    });
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.style.transform = 'translate(-50%,-50%) scale(1) rotate(-4deg)';
    });
    setTimeout(() => { el.style.opacity = '0'; }, 1500);
    setTimeout(() => el.remove(), 2300);
  }

  // Re-colour every remote player's aura from the CURRENT teams.
  _repaintAuras() {
    for (const [pid, rp] of this.remotePlayers.entries()) {
      const team = this.playerMeta.get(pid)?.team ?? this.bots.get(pid)?.team;
      rp.setTeams?.(team, this.team);
    }
  }

  // A bot says something in chat, if the pacing rules allow it. Host only —
  // bots do not exist on other peers, so the host speaks for them and the line
  // goes out over the wire like any other message.
  //
  // All the judgement lives in botTaunts.js (pure + tested); this just owns the
  // clock and the socket. See docs/features/chat.md.
  _botTaunt(botId, event) {
    if (!this.isHost) return;
    const bot = this.bots.get(botId);
    if (!bot) return;
    const decision = considerTaunt({
      botId, event, state: this._taunts, now: performance.now() / 1000,
    });
    if (!decision) return;
    setTimeout(() => {
      // The bot may have been displaced by a joining human in the meantime.
      if (!this.bots.has(botId)) return;
      const msg = { t: MSG.CHAT, from: botId, name: bot.name, team: bot.team,
                    text: decision.text, kind: 'taunt' };
      this._broadcast(msg);
      this.chat?.push(msg);
    }, decision.delay * 1000);
  }

  // How many seats are filled right now: me, every human peer, every bot.
  _occupancy() {
    const humans = 1 + [...this.playerMeta.entries()]
      .filter(([id, m]) => !m.bot && id !== this.myId).length;
    return { humans, bots: this.bots.size, total: humans + this.bots.size };
  }

  // A human arrived. Give them a bot's seat rather than growing the match past
  // MATCH_CAP. Bryan: "each person who jumps in the match, then replacing a
  // bot until there's 16 real players."
  //
  // Prefers a bot on the JOINER'S OWN team so the swap is team-neutral — the
  // alternative silently hands one side an extra body every time somebody
  // joins, which is the opposite of what a backfill is for. Falls back to the
  // largest team's bot if their own side has none.
  _displaceBotFor(joinerTeam) {
    if (!this.isHost) return null;
    if (this._occupancy().total <= MATCH_CAP) return null;
    const sameTeam = [...this.bots.values()].filter((b) => b.team === joinerTeam);
    let victim = sameTeam[0];
    if (!victim) {
      const counts = { red: 0, blue: 0 };
      for (const m of this.playerMeta.values()) counts[m.team === 'red' ? 'red' : 'blue']++;
      const biggest = counts.red >= counts.blue ? 'red' : 'blue';
      victim = [...this.bots.values()].find((b) => b.team === biggest)
            ?? [...this.bots.values()][0];
    }
    if (!victim) return null;
    this.removeBot(victim.peerId);
    this._killFeedPush(`${victim.name} stepped aside for a human`);
    return victim.peerId;
  }

  // Remove a bot everywhere: simulation, metadata, and every peer's scene.
  removeBot(botId) {
    if (!this.bots.has(botId)) return false;
    this.bots.delete(botId);
    this.playerMeta.delete(botId);
    const rp = this.remotePlayers.get(botId);
    if (rp) { rp.destroy(this.scene); this.remotePlayers.delete(botId); }
    // Any flag it was carrying goes home rather than vanishing with it.
    for (const c of ['red', 'blue']) {
      if (this.flagCarrier[c] === botId) {
        this._returnFlag(c);
        this._broadcast({ t: MSG.FLAG_RETURN, by: botId, color: c });
      }
    }
    this._broadcast({ t: MSG.BOT_LEAVE, id: botId });
    this._updateLobbyBanner();
    return true;
  }

  addBot(preferredTeam) {
    if (!this.isHost) return null;
    // A match holds MATCH_CAP bodies. Bots only ever fill seats humans are not
    // using, so this cap is what makes the backfill meaningful.
    if (this._occupancy().total >= MATCH_CAP) return null;
    // Count current team sizes (real players + existing bots).
    let r = 0, b = 0;
    for (const meta of this.playerMeta.values()) {
      if (meta.team === 'red') r++; else b++;
    }
    const team = preferredTeam || (r <= b ? 'red' : 'blue');
    const bot = Bot.make({ team, world: this.world, seed: this.seed });
    this.bots.set(bot.peerId, bot);
    // Register meta so all peers render it via RemotePlayer.
    this.playerMeta.set(bot.peerId, {
      name: bot.name, character: bot.character, team: bot.team, bot: true,
    });
    // Announce HELLO for the bot to all peers.
    const helloMsg = { t: MSG.HELLO, name: bot.name, character: bot.character, team: bot.team, from: bot.peerId };
    this._broadcast({ ...helloMsg });
    // Locally add a RemotePlayer so the host sees it too.
    if (!this.remotePlayers.has(bot.peerId)) {
      this.remotePlayers.set(bot.peerId, new RemotePlayer(this.scene, bot.peerId,
        { name: bot.name, character: bot.character, team: bot.team, localTeam: this.team }));
    }
    this._updateLobbyBanner();
    // Adding a bot bumps the lobby count - potentially trigger the countdown.
    this._maybeStartCountdown();
    return bot;
  }

  _updateBots(dt) {
    // Prepare AI ctx once per tick.
    const enemyPlayersByTeam = { red: [], blue: [] };
    for (const [pid, rp] of this.remotePlayers.entries()) {
      const meta = this.playerMeta.get(pid);
      if (!meta) continue;
      enemyPlayersByTeam[meta.team === 'red' ? 'blue' : 'red'].push({
        peerId: pid, pos: rp.group.position, team: meta.team,
      });
    }
    // Self is an enemy of the opposing team.
    const meMeta = { team: this.team };
    enemyPlayersByTeam[meMeta.team === 'red' ? 'blue' : 'red'].push({
      peerId: this.myId, pos: this.player.pos, team: meMeta.team,
    });

    for (const bot of this.bots.values()) {
      const enemyColor = bot.team === 'red' ? 'blue' : 'red';
      const ctx = {
        grid: this.grid,
        world: this.world,
        flagPos: this.flagPos,
        flagState: this.flagState,
        enemyPlayers: enemyPlayersByTeam[bot.team],
        onShoot: (bid, origin, dir) => {
          if (this.matchState !== 'playing') return;
          // Bots fire the shovel, like everyone else. This carried
          // `damage: 2, weaponId: 'pistol'` for months, which was wrong twice
          // over: 2 is the damage number from before the +50% pass (players do
          // 12), so bots were SIX TIMES weaker than the design doc claims; and
          // 'pistol' is not a weapon id that exists, so _addTracerForShot's
          // WEAPON_DEFS lookup missed and every bot tracer fell back to the
          // default gold instead of the shovel's brown.
          const def = WEAPON_DEFS[0];
          const shot = { kind: 'hitscan', origin: origin.toArray(), dir: dir.toArray(),
            damage: def.damage, weaponId: def.id, ownerId: bid };
          this._broadcast({ t: MSG.SHOT, s: shot });
          this._resolveShotAgainstAll(shot);
          // ...and DRAW it here. _broadcast does not loop back to the sender,
          // so on the host — which is every solo game against bots — a bot's
          // shot was resolved for damage and never rendered. Bryan: "I still
          // can't see the bullets of the enemies shooting at me." The bots
          // were shooting him with invisible bullets the entire time.
          this._applyRemoteShot(shot);
        },
        onFlagPickup: (bid, color) => {
          if (this.matchState !== 'playing') return;
          this.flagCarrier[color] = bid;
          this.flagState[color] = 'carried';
          this._broadcast({ t: MSG.FLAG_PICK, by: bid, color });
        },
        onFlagCapture: (bid, color) => {
          if (this.matchState !== 'playing') return;
          const scoringTeam = color === 'red' ? 'blue' : 'red';
          this.scores[scoringTeam]++;
          this._returnFlag(color);
          this._broadcast({ t: MSG.FLAG_CAP, by: bid, color });
          this._broadcast({ t: MSG.SCORE, scores: this.scores });
          this._updateScoreUi();
          this._killFeedPush(`${bot.name} captured the ${color} flag!`);
          this._maybeTriggerAnagram();
        },
      };
      bot.update(dt, ctx);

      // Sync local RemotePlayer position for immediate rendering (no lerp
      // needed because we set both target and current at the same time).
      const rp = this.remotePlayers.get(bot.peerId);
      if (rp) {
        rp.setNet([bot.pos.x, bot.pos.y, bot.pos.z], bot.yaw, bot.pitch, bot.hp);
        rp.group.position.set(bot.pos.x, bot.pos.y, bot.pos.z);
        rp.group.rotation.y = bot.yaw;
      }

      // Broadcast bot state at 20Hz (piggy-backed on tick, so 60Hz => downscale).
      if (!bot._netAccum) bot._netAccum = 0;
      bot._netAccum += dt;
      if (bot._netAccum >= 1 / 20) {
        bot._netAccum = 0;
        this._broadcast({ ...bot.statePacket(), from: bot.peerId });
      }
    }
  }

  // Host-side helper: apply a hitscan shot to all real players + bots and
  // report HITs (for real players) or apply directly (for bots).
  _resolveShotAgainstAll(s) {
    const origin = new THREE.Vector3().fromArray(s.origin);
    const dir    = new THREE.Vector3().fromArray(s.dir);
    let best = null, bestT = Infinity;
    // vs remote players
    for (const [pid, rp] of this.remotePlayers.entries()) {
      if (pid === s.ownerId) continue;
      const target = rp.group.position.clone().add(new THREE.Vector3(0, 1, 0));
      const t = target.clone().sub(origin).dot(dir);
      if (t < 0.5 || t > 60) continue;
      const closest = origin.clone().addScaledVector(dir, t);
      if (target.distanceTo(closest) < 0.7 && t < bestT) { bestT = t; best = { kind: 'remote', pid }; }
    }
    // vs local player (host might shoot self? unlikely)
    if (s.ownerId !== this.myId && this.player.alive) {
      const target = this.player.pos.clone().add(new THREE.Vector3(0, 1, 0));
      const t = target.clone().sub(origin).dot(dir);
      if (t >= 0.5 && t <= 60) {
        const closest = origin.clone().addScaledVector(dir, t);
        if (target.distanceTo(closest) < 0.7 && t < bestT) { bestT = t; best = { kind: 'self' }; }
      }
    }
    if (!best) return;
    if (best.kind === 'self') this._takeDamage(s.damage, s.ownerId, s.weaponId);
    else if (best.kind === 'remote') {
      // If it's a bot, apply damage locally on host.
      const bot = this.bots.get(best.pid);
      if (bot) {
        const died = bot.takeDamage(s.damage);
        if (died) {
          this._broadcast({ t: MSG.DEATH, victim: bot.peerId, killer: s.ownerId, weapon: s.weaponId });
          if (bot.hasEnemyFlag) {
            const enemyColor = bot.team === 'red' ? 'blue' : 'red';
            this._broadcast({ t: MSG.FLAG_DROP, by: bot.peerId, color: enemyColor,
              at: [bot.pos.x, bot.pos.y, bot.pos.z] });
            this.flagState[enemyColor] = 'dropped';
            this.flagCarrier[enemyColor] = null;
            this.flagPos[enemyColor] = { x: bot.pos.x, y: bot.pos.y, z: bot.pos.z };
            this._syncFlagMesh(enemyColor);
          }
          setTimeout(() => { bot.respawn(); }, 500);
        }
      } else {
        // Real player: tell them.
        this._broadcast({ t: MSG.HIT, target: best.pid, dmg: s.damage, by: s.ownerId, weapon: s.weaponId });
      }
    }
  }

  // Red vignette flash + directional arrow pointing at the attacker.
  _flashHit(byId) {
    const flash = document.getElementById('hit-flash');
    const dirEl = document.getElementById('hit-direction');
    if (!flash || !dirEl) return;
    flash.classList.add('visible');
    setTimeout(() => flash.classList.remove('visible'), 40);

    // Directional arrow: figure out where the attacker is relative to my yaw.
    let attackerPos = null;
    if (byId === this.myId) attackerPos = null;   // self-damage (hazard)
    const rp = this.remotePlayers.get(byId);
    if (rp) attackerPos = rp.group.position;
    const bot = this.bots.get(byId);
    if (bot) attackerPos = bot.pos;
    if (attackerPos) {
      const deg = hitBearingDeg(attackerPos, this.player.pos, this.player.yaw);
      dirEl.style.transform = `translate(-50%, -50%) rotate(${deg}deg)`;
      dirEl.classList.add('visible');
      setTimeout(() => dirEl.classList.remove('visible'), 1200);
    }
  }

  // Brief hitmarker "x" when YOUR shot lands on a target. Called from
  // _applyLocalShot after a HIT is broadcast.
  // Hit feedback. Bryan: "I also need some feedback when I hit someone."
  // The old version flashed a 34 px "×" for 130 ms and nothing else — in a
  // firefight that is indistinguishable from not having hit. Now a hit gives
  // three things at once, on three different channels, because one channel is
  // exactly what you miss when you are busy:
  //   * a hitmarker that SNAPS in and scales down (motion beats opacity)
  //   * a floating damage number that drifts up from the crosshair
  //   * a rising pitch on the splat, so a kill sounds different from a graze
  _flashHitmarker(dmg = 0, killed = false) {
    const el = document.getElementById('hitmarker');
    if (el) {
      el.classList.remove('visible');
      el.style.color = killed ? '#ff3a2a' : '#ffffff';
      el.style.transform = 'translate(-50%,-50%) scale(1.9)';
      // Force a reflow so the transform restart is not coalesced away.
      void el.offsetWidth;
      el.classList.add('visible');
      el.style.transform = 'translate(-50%,-50%) scale(1)';
      clearTimeout(this._hitmarkerT);
      this._hitmarkerT = setTimeout(() => el.classList.remove('visible'), killed ? 420 : 220);
    }
    if (dmg > 0) this._floatDamage(dmg, killed);
  }

  // A damage number that floats up off the crosshair and fades.
  _floatDamage(dmg, killed) {
    const n = document.createElement('div');
    n.textContent = killed ? 'KILL' : String(Math.round(dmg));
    const dx = (Math.random() - 0.5) * 70;
    Object.assign(n.style, {
      position: 'fixed', left: `calc(50% + ${dx}px)`, top: '48%',
      transform: 'translate(-50%,-50%)',
      font: `900 ${killed ? 30 : 22}px system-ui, sans-serif`,
      color: killed ? '#ff3a2a' : '#fff2b0',
      textShadow: '0 2px 4px rgba(0,0,0,.85), 0 0 12px rgba(0,0,0,.6)',
      pointerEvents: 'none', zIndex: '40',
      transition: 'transform .75s cubic-bezier(.2,.8,.3,1), opacity .75s ease-out',
      opacity: '1',
    });
    document.body.appendChild(n);
    requestAnimationFrame(() => {
      n.style.transform = `translate(-50%,-50%) translateY(-${killed ? 78 : 54}px)`;
      n.style.opacity = '0';
    });
    setTimeout(() => n.remove(), 800);
  }

  // Return a list of {peerId, pos} for every player + bot on this client.
  // Every body on the map: me, every remote peer, every bot. Since King of the
  // Hill has to know WHOSE feet are on the hill and whether they are alive,
  // the refs carry team and liveness as well as a position — the hill tick is
  // the only caller that reads them and the others ignore the extra fields.
  // Where a peer is right now, or null if we have never heard of them. Used by
  // the crowd so a cheer starts at the thing that caused it rather than at the
  // map centre. Falls back to the map centre so a cheer is never LOST — a
  // missing position should cost the wave its origin, not the reaction.
  _posOf(peerId) {
    const ref = this._allPlayerRefs().find((p) => p.peerId === peerId);
    if (ref) return ref.pos;
    return this.world?.hillSpawn ?? null;
  }

  _allPlayerRefs() {
    const arr = [{
      peerId: this.myId, pos: this.player.pos,
      team: this.team, alive: this.player.alive !== false,
    }];
    // A bot exists TWICE on the host: once in `bots` (the simulation, which is
    // authoritative for its position) and once in `remotePlayers` (its visual).
    // Listing both put every bot in here twice, and the RemotePlayer copy
    // reports the render group's position, which for a host-simulated bot lags
    // its real one — so half the entries were phantom bodies, several of them
    // parked at the world origin because their group had never been moved.
    // Anything that hit-tests against this list (shots, splash, the hill, aim
    // assist) was testing against ghosts. The simulation wins.
    for (const [pid, rp] of this.remotePlayers.entries()) {
      if (this.bots.has(pid)) continue;
      arr.push({
        peerId: pid, pos: rp.group.position,
        team: this.playerMeta.get(pid)?.team ?? null,
        alive: rp.hp == null ? true : rp.hp > 0,
      });
    }
    for (const bot of this.bots.values()) {
      arr.push({
        peerId: bot.peerId, pos: bot.pos,
        team: bot.team, alive: bot.alive !== false,
      });
    }
    return arr;
  }

  // Grant a chicken shot to a peer. If it's us, splash "SLINGSHOT READY",
  // tag the chip to show it's armed, and let the NEXT fire (from any slot)
  // consume it. No slot selection needed — see docs/features/chicken-auto-fire.md.
  _grantChicken(peerId) {
    if (peerId === this.myId) {
      this.chickenAmmo = 1;
      const slot = document.querySelector('.wpn.chicken');
      if (slot) {
        slot.style.display = '';
        slot.classList.remove('cooldown');
        slot.innerHTML =
          '<span class="wpn-icon">🐔</span><span class="wpn-key">GO</span><span class="wpn-name">READY</span>';
      }
      // Cancel any previous countdown interval.
      if (this._chickenCdTimer) { clearInterval(this._chickenCdTimer); this._chickenCdTimer = null; }
      // POWER GET FX
      this._showPowerGet('☢  SLINGSHOT READY  ☢', 'Any weapon — your next shot fires the chicken');
      try { SFX.chirp(); SFX.boom(0.4); } catch (_) {}
    }
  }

  // After the local player fires their chicken shot, replace the chip with
  // a live 30s countdown showing when the pickup respawns on the hill.
  // Ticks every 500ms so the visible seconds don't drift more than 1s.
  _startChickenCooldownChip() {
    const slot = document.querySelector('.wpn.chicken');
    if (!slot || !this.chickenPickup) return;
    slot.style.display = '';
    slot.classList.add('cooldown');
    const paint = () => {
      const now = performance.now();
      const secsLeft = Math.max(0, Math.ceil((this.chickenPickup._nextSpawnAt - now) / 1000));
      if (secsLeft <= 0) {
        // Pickup is available on the hill again; hide the countdown chip
        // (it'll reappear as READY when someone grabs it).
        slot.style.display = 'none';
        slot.classList.remove('cooldown');
        clearInterval(this._chickenCdTimer);
        this._chickenCdTimer = null;
        return;
      }
      slot.innerHTML =
        `<span class="wpn-icon">🐔</span><span class="wpn-key">${secsLeft}s</span><span class="wpn-name">respawn</span>`;
    };
    paint();
    if (this._chickenCdTimer) clearInterval(this._chickenCdTimer);
    this._chickenCdTimer = setInterval(paint, 500);
  }

  // Big centre-screen splash + screen flash for "you got the super weapon".
  // Adds once, animates via CSS. Removed after 2.2s.
  _showPowerGet(title, subtitle) {
    let root = document.getElementById('power-get');
    if (root) root.remove();
    root = document.createElement('div');
    root.id = 'power-get';
    root.innerHTML = `
      <div class="pg-flash"></div>
      <div class="pg-ring"></div>
      <div class="pg-text">
        <div class="pg-title">${title}</div>
        <div class="pg-sub">${subtitle || ''}</div>
      </div>
    `;
    document.body.appendChild(root);
    if (!document.getElementById('power-get-styles')) {
      const s = document.createElement('style');
      s.id = 'power-get-styles';
      s.textContent = `
        #power-get { position: fixed; inset: 0; pointer-events: none; z-index: 9998;
          display: flex; align-items: center; justify-content: center; }
        #power-get .pg-flash { position: absolute; inset: 0;
          background: radial-gradient(circle at center, rgba(255,240,140,0.85) 0%,
                                                       rgba(255,180,40,0.55) 30%,
                                                       rgba(0,0,0,0) 70%);
          animation: pgFlash 0.55s ease-out forwards; }
        #power-get .pg-ring { position: absolute; width: 30vmin; height: 30vmin;
          border: 6px solid #f4c95d; border-radius: 50%;
          box-shadow: 0 0 40px 20px rgba(244,201,93,0.75), inset 0 0 40px 5px rgba(244,201,93,0.55);
          animation: pgRing 1.1s ease-out forwards; }
        #power-get .pg-text { position: relative; text-align: center;
          animation: pgText 2.2s ease-out forwards; }
        #power-get .pg-title { font: 900 min(9vw,64px)/1 system-ui, sans-serif;
          color: #fff2b0; letter-spacing: 0.05em;
          text-shadow: 0 0 24px #f4c95d, 0 3px 0 #7a4a10, 0 6px 0 #402208,
                       0 0 60px rgba(244,201,93,0.85); }
        #power-get .pg-sub { margin-top: 10px; font: 800 min(3.6vw,20px)/1 system-ui, sans-serif;
          color: #fff; text-shadow: 0 2px 4px #000, 0 0 12px rgba(0,0,0,0.85);
          letter-spacing: 0.15em; }
        @keyframes pgFlash { 0% { opacity: 1 } 100% { opacity: 0 } }
        @keyframes pgRing  { 0% { transform: scale(0.2); opacity: 0.95 }
                             80% { transform: scale(2.4); opacity: 0.2 }
                             100% { transform: scale(2.9); opacity: 0 } }
        @keyframes pgText  { 0% { transform: scale(0.5); opacity: 0 }
                             15% { transform: scale(1.15); opacity: 1 }
                             25% { transform: scale(1); opacity: 1 }
                             80% { transform: scale(1); opacity: 1 }
                             100% { transform: scale(1.05); opacity: 0 } }
      `;
      document.head.appendChild(s);
    }
    setTimeout(() => root.remove(), 2200);
  }

  // Toggle the hay-peek overlays + hiding label based on whether the local
  // player's torso is currently inside a hay voxel. Also dim the hay mesh
  // to near-invisible so the player has a clear view outside.
  //
  // Per docs/features/hay-hiding.md acceptance criterion #5.
  // Enforced by web-engine tests + map/hayVisibility.test.js.
  _paintHayHide() {
    if (!this.player || !this.grid) return;
    const inside = isInsideHay(this.grid, this.player.pos.x, this.player.pos.y, this.player.pos.z);
    if (inside === this._insideHay) return;
    this._insideHay = inside;
    document.getElementById('hayPeekLeft')?.classList.toggle('visible', inside);
    document.getElementById('hayPeekRight')?.classList.toggle('visible', inside);
    document.getElementById('hiding-label')?.classList.toggle('visible', inside);
    // Dim the hay material on this client only.
    const worldMesh = this.scene.getObjectByName('voxelWorld');
    const hayMat = worldMesh?.userData?.materialsByType?.[_VOX.HAY];
    if (hayMat) hayMat.opacity = hayOpacityFor(inside);
  }

  // Rotate the compass arrows so they always point at each team's flag from
  // the player's current position + heading.
  _paintCompass() {
    if (!this.player || !this.flagPos) return;
    const yaw = this.player.yaw;
    for (const color of ['red', 'blue']) {
      const el = document.getElementById(color === 'red' ? 'compassRed' : 'compassBlue');
      const distEl = document.getElementById(color === 'red' ? 'compassRedDist' : 'compassBlueDist');
      if (!el || !distEl) continue;
      const f = this.flagPos[color];
      const dx = f.x + 0.5 - this.player.pos.x;
      const dz = f.z + 0.5 - this.player.pos.z;
      // Angle relative to the player's forward direction (yaw). yaw=0 looks +Z.
      // atan2 returns bearing from +Z axis measured toward +X (rotation around -Y).
      const bearing = Math.atan2(dx, dz);
      const rel = bearing - yaw;
      // Convert to degrees, normalise
      let deg = (rel * 180 / Math.PI + 540) % 360 - 180;
      el.style.transform = `rotate(${deg}deg)`;
      distEl.textContent = Math.round(Math.hypot(dx, dz)) + 'm';
    }
  }

  // Build the 50-kernel HP bar (100 HP / 2 HP per kernel = 50 kernels).
  _buildCornBar() {
    const fill = document.getElementById('health-fill');
    if (!fill) return;
    fill.innerHTML = '';
    for (let i = 0; i < 50; i++) {
      const k = document.createElement('span');
      k.className = 'kernel';
      k.dataset.i = String(i);
      fill.appendChild(k);
    }
    this._paintCornBar();
  }

  // Sync visible kernels to player.hp. HP 100 = all 50 visible;
  // HP 1..99 = pop the trailing (100-hp)/2 kernels away.
  _paintCornBar() {
    const fill = document.getElementById('health-fill');
    if (!fill || !this.player) return;
    const hp = Math.max(0, this.player.hp);
    const remaining = Math.max(0, Math.ceil(hp / 2));   // 50..0
    const kernels = fill.querySelectorAll('.kernel');
    for (let i = 0; i < kernels.length; i++) {
      kernels[i].classList.toggle('gone', i >= remaining);
    }
  }

  // On damage, fly the "just-gone" kernels off the bar as physical
  // particles. `n` is the number of kernels to fling.
  _spawnCornFly(n) {
    const fill = document.getElementById('health-fill');
    if (!fill || !this.player) return;
    const hpBefore = Math.max(0, Math.ceil((this.player.hp + n * 2) / 2));
    const kernels = fill.querySelectorAll('.kernel');
    // Fling the highest-index kernels that are about to vanish.
    for (let i = 0; i < n; i++) {
      const idx = Math.min(hpBefore - 1 - i, kernels.length - 1);
      const src = kernels[idx];
      if (!src) continue;
      const r = src.getBoundingClientRect();
      const fly = document.createElement('div');
      fly.className = 'corn-fly';
      fly.style.left = r.left + 'px';
      fly.style.top  = r.top + 'px';
      fly.style.transform = 'translate(0,0) rotate(0deg)';
      fly.style.transition = 'transform 0.7s ease-out, opacity 0.7s ease-out';
      document.body.appendChild(fly);
      const dx = 20 + Math.random() * 100;
      const dy = -50 - Math.random() * 120;
      requestAnimationFrame(() => {
        fly.style.transform =
          `translate(${dx}px, ${dy}px) rotate(${(Math.random() - 0.5) * 900}deg)`;
        fly.style.opacity = '0';
      });
      setTimeout(() => fly.remove(), 800);
    }
    this._paintCornBar();
  }

  // Toggle blood-tinted textures on the world + character re-tints.
  _applyMature(on) {
    // Re-render the world meshes with the mature flag.
    const oldMesh = this.scene.getObjectByName('voxelWorld');
    if (oldMesh) this.scene.remove(oldMesh);
    this.scene.add(buildWorldMeshes(this.grid, { mature: on }));
    // Body colour: swap the sky background for a bloody tint too.
    if (this.scene.fog) this.scene.fog.color.setHex(on ? 0xa03a34 : 0x8ec5ff);
    this.renderer.setClearColor(on ? 0xa03a34 : 0x8ec5ff);
  }

  _updateLobbyBanner() {
    const el = document.getElementById('lobby-banner');
    const title = document.getElementById('lobby-title');
    const count = document.getElementById('lobby-count');
    const hint = document.getElementById('lobby-hint');
    if (this.matchState === 'lobby') {
      el.classList.add('visible');
      title.textContent = 'Waiting for players…';
      count.textContent = this.playerMeta.size + ' / ' + LOBBY_MIN_PLAYERS;
      hint.textContent = this.isHost
        ? 'Share the room link. Countdown starts when 2 are here.'
        : 'Waiting for the host to have 2+ players before the match starts.';
    } else if (this.matchState === 'countdown') {
      el.classList.add('visible');
      title.textContent = 'Match starting…';
      const remain = Math.max(0, Math.ceil((this._matchEndsAt - Date.now()) / 1000));
      count.textContent = remain;
      hint.textContent = `You are on ${this.team.toUpperCase()} team, playing as ${this.character}.`;
    } else {
      el.classList.remove('visible');
    }
  }

  _broadcast(msg) { this.mesh.broadcast(msg); }

  _onMessage(fromTransport, msg) {
    if (!msg || !msg.t) return;
    // Bots are relayed by the host; the sender's peerId is the host's, but
    // the actual originator is msg.from (a bot peerId).
    const from = msg.from || fromTransport;
    switch (msg.t) {
      case MSG.WELCOME:
        this.seed = msg.seed;
        if (msg.mapId) this.mapId = msg.mapId;
        if (msg.mode) { this.modeId = msg.mode; this.mode = getMode(msg.mode); }
        this.scores = msg.scores || this.scores;
        for (const [pid, meta] of msg.playersMeta || []) {
          if (pid === this.myId) continue;
          this.playerMeta.set(pid, meta);
        }
        if (msg.matchState) {
          this.matchState = msg.matchState;
          this._matchEndsAt = msg.matchEndsAt || 0;
        }
        this._updateScoreUi();
        this._updateLobbyBanner();
        break;

      case MSG.HELLO:
        this.playerMeta.set(from, { name: msg.name, character: msg.character, team: msg.team });
        // Spawn remote player.
        if (!this.remotePlayers.has(from)) {
          this.remotePlayers.set(from, new RemotePlayer(this.scene, from,
            { name: msg.name, character: msg.character, team: msg.team, localTeam: this.team }));
        }
        // If we're host, welcome this new peer to catch them up, then trigger
        // team-balance + potentially start the countdown.
        if (this.isHost) {
          this._sendWelcome(from);
          // A human just took a seat. If that pushes us over MATCH_CAP, a bot
          // gives up its place rather than the match growing — bots exist to
          // fill seats humans are not using.
          this._displaceBotFor(msg.team);
          this._rebalanceTeams();
          this._maybeStartCountdown();
          this.chat?.system(`${msg.name} joined`);
        }
        this._updateLobbyBanner();
        break;

      case MSG.TEAM_ASSIGN: {
        for (const pid in msg.assignments) {
          const meta = this.playerMeta.get(pid);
          if (!meta) continue;
          meta.team = msg.assignments[pid];
          if (pid === this.myId && this.team !== msg.assignments[pid]) {
            this.team = msg.assignments[pid];
            this.player.team = this.team;
            this.player.spawn = { ...this.world.spawns[this.team] };
            this.player.respawn();
          }
        }
        // Teams just moved, so every aura may now be lying about who is an
        // enemy. Repaint them all — a halo baked at construction is the one
        // way this feature fails dangerously.
        this._repaintAuras();
        break;
      }

      case MSG.MATCH_STATE:
        this.matchState = msg.state;
        this._matchEndsAt = msg.endsAt || 0;
        this._updateLobbyBanner();
        break;

      case MSG.HAZARD_SPAWN:
        if (this.hazards) {
          for (const item of msg.items) this.hazards.spawn(item);
          SFX.whoosh();
        }
        break;

      case MSG.CHICKEN_PICK:
        // Any peer receiving this hides the pickup + starts the respawn timer.
        if (this.chickenPickup) {
          this.chickenPickup.available = false;
          this.chickenPickup.mesh.visible = false;
          this.chickenPickup._nextSpawnAt = msg.respawnAt - Date.now() + performance.now();
        }
        this._grantChicken(msg.by);
        break;

      case MSG.CHICKEN_SHOT:
        // Visual only: a chicken projectile flying + explosion at first collision.
        // Damage is host-authoritative (see _resolveChickenShot).
        this._spawnChickenProjectile(msg);
        break;

      case MSG.STATE: {
        const rp = this.remotePlayers.get(from);
        if (rp) rp.setNet(msg.p, msg.y, msg.x, msg.h);
        // Power-up size. Older peers don't send `sc`; they are normal-sized.
        const sc = Number.isFinite(msg.sc) && msg.sc > 0 ? msg.sc : 1;
        this._peerScale.set(from, sc);
        if (rp) rp.setBodyScale(sc);
        // If they were carrying a flag, sync flag position.
        if (msg.hf) {
          const c = msg.tm === 'red' ? 'blue' : 'red';
          this.flagCarrier[c] = from;
          this.flagState[c] = 'carried';
          this.flagPos[c] = { x: msg.p[0], y: msg.p[1], z: msg.p[2] };
          this._syncFlagMesh(c);
        }
        break;
      }

      case MSG.SHOT: {
        // Play visual for the shot; if hitscan, resolve locally (only apply
        // damage to OUR own player).
        this._applyRemoteShot(msg.s);
        break;
      }
      case MSG.HIT: {
        if (msg.target === this.myId) this._takeDamage(msg.dmg, msg.by, msg.weapon);
        break;
      }
      case MSG.DEATH:
        this._killFeedPush(`${this._name(msg.killer)} ➜ ${this._name(msg.victim)} (${msg.weapon})`);
        this._creditKill(msg.killer, msg.victim);
        // Death ends any steak poison on the victim — dying of ANY cause
        // clears the DOT, so respawned players never carry stale poison.
        this._steakPoisonBy.delete(msg.victim);
        if (msg.victim === this.myId) this._hidePoisonHint();
        // Animal death voice. Any peer plays the victim's character sound.
        try {
          const meta = this.playerMeta.get(msg.victim);
          const bot = this.bots.get(msg.victim);
          const character = meta?.character
            || bot?.character
            || (msg.victim === this.myId ? this.character : 'cow');
          SFX.animalVoice(character, 1.0);
        } catch (_) {}
        // Crowd reacts at the victim. Chicken obliterations get their own,
        // louder tier — the slingshot is the rarest thing on the map.
        this.critters?.cheer(this._posOf(msg.victim),
          msg.weapon === 'chicken' ? 'chicken' : 'kill');
        // GORE mode: the announcer calls the dead player a loser, and it is
        // aimed AT them — only the victim's own client hears it and sees the
        // banner. Shouting it at the room would be announcing someone else's
        // death to them, which is neither the joke nor what was asked for.
        if (this.mature && msg.victim === this.myId) this._announceLoser();
        break;
      case MSG.FLAG_PICK:
        this.flagCarrier[msg.color] = msg.by;
        this.flagState[msg.color] = 'carried';
        break;
      case MSG.FLAG_DROP:
        this.flagCarrier[msg.color] = null;
        this.flagState[msg.color] = 'dropped';
        this.flagPos[msg.color] = { x: msg.at[0], y: msg.at[1], z: msg.at[2] };
        this._syncFlagMesh(msg.color);
        break;
      case MSG.CHAT:
        // Untrusted text from a peer. Chat.push uses textContent, never
        // innerHTML — see ui/chat.js.
        this.chat?.push({ name: msg.name || this._name(msg.from), text: msg.text,
                          team: msg.team, kind: msg.kind === 'taunt' ? 'taunt' : 'say' });
        break;
      case MSG.BOT_LEAVE: {
        // Host says a bot gave up its seat to a human. Non-hosts do not
        // simulate bots, they just render them, so this is purely a despawn.
        const rp = this.remotePlayers.get(msg.id);
        if (rp) { rp.destroy(this.scene); this.remotePlayers.delete(msg.id); }
        this.playerMeta.delete(msg.id);
        this._updateLobbyBanner();
        break;
      }
      case MSG.FLAG_RETURN:
        // Someone died carrying this flag — snap it back to its home
        // stand. Bryan 2026-08-20: "when I die with the flag, the flag
        // should go back to its initial location".
        this._returnFlag(msg.color);
        break;
      case MSG.STEAK_BREAK:
        this._steakBreakRemote(msg.at, msg.by);
        break;
      case MSG.POWERUP_PICK:
        // Host authority: hide the pickup for everyone, start the effect for
        // whoever took it (a no-op on every client but theirs). The respawn
        // instant arrives as a Date.now() stamp and has to be rebased onto
        // this peer's performance.now() clock, which starts at page load.
        this.powerUpPickups?.markTaken(
          msg.id, (msg.respawnAt - Date.now()) + performance.now());
        this._grantPowerUp(msg.id, msg.by);
        break;
      case MSG.STEAK_THROW:
        this._spawnSteakProjectile(msg);
        break;
      case MSG.STEAK_ATTACH:
        this._applySteakAttach(msg.victim, msg.by);
        break;
      case MSG.STEAK_TICK:
        if (msg.victim === this.myId) this._takeDamage(msg.dmg, this._steakPoisonBy?.get(this.myId), 'steak');
        break;
      case MSG.STEAK_DEATH:
        this._steakPoisonBy.delete(msg.victim);
        if (msg.victim === this.myId) this._hidePoisonHint();
        this._announceSteakAnnihilation(msg.victim, msg.killer);
        break;
      case MSG.FLAG_CAP: {
        // host-authoritative: increment scoring team's score
        const scoringTeam = msg.color === 'red' ? 'blue' : 'red';
        this.scores[scoringTeam]++;
        this._returnFlag(msg.color);
        this._updateScoreUi();
        this._killFeedPush(`${this._name(msg.by)} captured the ${msg.color} flag!`);
        // The crowd reacts to a remote capture too — cheer at the home stand
        // of the team that scored, which is where the flag was just delivered.
        this.critters?.cheer(this.world.flags[scoringTeam], 'capture');
        this._maybeTriggerAnagram();
        break;
      }
      case MSG.SCORE:
        this.scores = msg.scores;
        this._updateScoreUi();
        break;
      case MSG.ANAGRAM_START:
        this._startAnagram(msg.word, msg.scrambled, msg.losingTeam, msg.endsAt);
        break;
      case MSG.ANAGRAM_WIN:
        this._endAnagram({ winner: msg.winner, by: msg.by });
        break;
    }
  }

  _name(peerId) {
    return this.playerMeta.get(peerId)?.name || peerId.slice(0, 6);
  }

  // ---- frame loop --------------------------------------------------------

  _frame(now) {
    const dt = Math.min(0.05, (now - this._lastFrame) / 1000);
    this._lastFrame = now;
    if (!this.gameOver) {
      try { this._tick(dt); }
      catch (err) {
        // Don't let a per-tick error kill the render loop - surface it in
        // the debug HUD so we can see what broke.
        console.error('[tick error]', err);
        window.__tbDebug = { ...(window.__tbDebug || {}), tickError: String(err.message || err) };
      }
    }
    // Outside the _tick try/catch and outside its "no input yet" early
    // return: the sky is scenery, not simulation. It should keep fighting
    // while rapier's WASM downloads and while the match is over, and a
    // gameplay tick that throws should not freeze it mid-punch.
    this.skyBrawl?.update(dt, this.camera.position);
    this.critters?.update(dt, this.camera.position);
    if (!this.gameOver) { try { this._tickHill(dt); } catch (_) {} }
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame((t) => this._frame(t));
  }

  _tick(dt) {
    // Boot race guard: the render loop starts BEFORE _initPlayer/_initInput
    // finish (deliberate — the world shows while rapier WASM downloads).
    // Until input exists there is nothing to simulate; without this, every
    // frame during physics load threw "[tick error] … wasPressed" in prod.
    if (!this.input) return;
    // Publish a small debug snapshot so the touch-debug HUD can show what
    // the game actually thinks is happening (why isn't the player moving?).
    this._tickCount = (this._tickCount || 0) + 1;
    window.__tbDebug = {
      match: this.matchState,
      alive: this.player?.alive,
      ticks: this._tickCount,
      grounded: this.player?._grounded,
      jumps: this.player?.jumpCount ?? 0,
      pos: this.player ? `${this.player.pos.x.toFixed(1)},${this.player.pos.y.toFixed(1)},${this.player.pos.z.toFixed(1)}` : '?',
      vel: this.player ? `${this.player.vel.x.toFixed(1)},${this.player.vel.y.toFixed(1)},${this.player.vel.z.toFixed(1)}` : '?',
    };
    // Repaint the touch-debug HUD every frame so we see live pos/vel/actions
    // without needing another touch to trigger the repaint.
    if (this.touch) this.touch._paintDebug();
    // Lobby / countdown state -- player can still walk around and look
    // (practice mode), but no damage is dealt and flags don't count.
    if (this.matchState !== 'playing' && this.matchState !== 'ended') {
      this._updateLobbyBanner();
      // Physics might not be loaded yet (rapier WASM is async). Guard.
      if (this.player?.alive && this.physics) this.player.update(dt, this.input);
      if (this.physics) this.physics.step(dt);
      this.weapons?.update(dt);
      this.viewmodel?.update(dt);
      for (const rp of this.remotePlayers.values()) rp.update(dt);
      // The wildlife is alive in the lobby too. It was not, and that is the
      // one place it matters most: waiting for a second player is exactly when
      // somebody stands still and looks at the scenery. Without this the
      // colony is a set of frozen statues until the match starts — and a solo
      // host testing the map never sees it move at all.
      this.critters?.update(dt, this.camera.position);
      // Weapon-switch still works so people can preview.
      if (this.input.wasPressed('weapon1')) this._switchWeapon(0);
      if (this.input.wasPressed('weapon2')) this._switchWeapon(1);
      if (this.input.wasPressed('weapon3')) this._switchWeapon(2);
      // Broadcast our position at 10Hz so any other lobby-watchers see us
      // wandering around.
      this._netAccum += dt;
      if (this._netAccum >= 1 / 10) {
        this._netAccum = 0;
        this._broadcast({
          t: MSG.STATE,
          p: [this.player.pos.x, this.player.pos.y, this.player.pos.z],
          y: this.player.yaw, x: this.player.pitch, h: this.player.hp,
          c: this.character, tm: this.team, hf: false,
          sc: this.player.sizeScale,
        });
      }
      this.input.endFrame();
      return;
    }
    if (this._anagram && !this._anagram.spectator) {
      // Local player is on the losing team during an anagram - freeze the FPS
      // world (they still see it but can't move) so their focus goes to the
      // typing overlay.
      this.input.endFrame();
      return;
    }
    if (this._anagram && this._anagram.spectator) {
      // Winning team spectates - freeze but keep rendering.
      this.input.endFrame();
      return;
    }

    // Weapon switch (1-3 normal, 4 super chicken if you've picked one up)
    if (this.input.wasPressed('weapon1')) this._switchWeapon(0);
    if (this.input.wasPressed('weapon2')) this._switchWeapon(1);
    if (this.input.wasPressed('weapon3')) this._switchWeapon(2);
    if (this.chickenAmmo > 0 && this.input.wasPressed('weapon4' /* unbound, use touch */)) this._switchWeapon(3);

    // Fire - on desktop require pointer-lock to avoid firing while the user
    // is interacting with menu/HUD; on touch, the FIRE button drives it.
    // Firing is allowed in the lobby (visual/practice) but no damage sticks
    // (see _takeDamage).
    const canFire = this.isTouch
      || document.pointerLockElement === this.renderer.domElement;
    if (this.input.isDown('fire') && canFire) {
      this._tryFire();
    }

    // Age out tracers + animate viewmodel + snowfall + gore + chicken.
    this.tracers.update(dt, performance.now() / 1000);
    this.viewmodel?.update(dt);
    this.snow?.update(dt);
    this.gore?.update(dt);
    // Chicken pickup: host authority. Assemble candidate positions from
    // local + bots + remote players (remote pos comes from RemotePlayer group).
    if (this.chickenPickup) {
      const hostPlayers = this.isHost ? this._allPlayerRefs() : null;
      this.chickenPickup.update(dt, hostPlayers);
    }
    this.steakPickups?.update(dt);
    if (this.powerUpPickups) {
      this.powerUpPickups.update(dt, this.isHost ? this._allPlayerRefs() : null);
    }
    this._updatePowerUpEffect();
    this._paintCompass();
    this._paintHayHide();

    // Aim assist, BEFORE the player update so the camera is built from the
    // corrected angles in the same frame. Only living enemies are offered as
    // targets — the module itself has no opinion about teams.
    if (this.player?.alive && this.aimAssist !== false) {
      const enemyTeam = this.team === 'red' ? 'blue' : 'red';
      const targets = this._allPlayerRefs()
        .filter((p) => p.peerId !== this.myId && p.team === enemyTeam && p.alive !== false)
        // Aim at the chest, not the feet: pos is ground level.
        .map((p) => ({ x: p.pos.x, y: p.pos.y + 1.0, z: p.pos.z }));
      const nudge = computeAimAssist({
        eye: this.camera.position, yaw: this.player.yaw, pitch: this.player.pitch,
        targets, dt, enabled: true,
      });
      this.player.yaw += nudge.yaw;
      this.player.pitch += nudge.pitch;
    }

    // Movement + physics (guarded on physics-loaded)
    if (this.player?.alive && this.physics) this.player.update(dt, this.input);
    if (this.physics) this.physics.step(dt);
    this.weapons?.update(dt);
    // Immediately AFTER the projectiles move: what did mine just touch?
    // Ordering matters — resolving before the move would test last frame's
    // segment and put every hit one frame late.
    this._resolveOwnProjectiles();

    // Remote players
    for (const rp of this.remotePlayers.values()) rp.update(dt);

    // Bots (host only) - simulate + broadcast as fake peers.
    if (this.isHost && this.bots.size) this._updateBots(dt);

    // Hazard rain (eggs + milk pints)
    const nowMs = performance.now();
    this.hazards.update(dt, nowMs);
    if (this.isHost && nowMs >= this._nextHazardAt) {
      const items = makeHostSchedule(WORLD_SIZE, this._hazardRngHost, nowMs);
      for (const item of items) this.hazards.spawn(item);
      this._broadcast({ t: MSG.HAZARD_SPAWN, items });
      SFX.whoosh();
      // Reschedule 3-6 seconds later.
      this._nextHazardAt = nowMs + this._hazardRngHost.rangeI(3000, 6000);
    }
    // Local player damage from hazards that just landed. Loud boom if we
    // took a splash; quieter one if a hazard landed nearby but missed.
    if (this.player.alive) {
      const hits = this.hazards.consumeHitsFor(this.player.pos);
      for (const dmg of hits) {
        this._takeDamage(dmg, this.myId, 'hazard');
        SFX.boom(1.0);
      }
      // Even if we weren't hit, play a softer boom if a hazard exploded
      // within earshot in the last tick.
      if (!hits.length) {
        for (const h of (this.hazards._explosions || [])) {
          if (h.shard) continue;
          const age = performance.now() / 1000 - h.bornAt;
          if (age > 0.05) continue;   // only brand-new
          const d = this.player.pos.distanceTo(h.mesh.position);
          if (d < 12) SFX.boom(Math.max(0.15, 1 - d / 12));
        }
      }
    }

    // Flag interaction
    this._updateFlags();

    // Broadcast state at NET_TICK_HZ
    this._netAccum += dt;
    const netStep = 1 / NET_TICK_HZ;
    if (this._netAccum >= netStep) {
      this._netAccum = 0;
      this._broadcast({
        t: MSG.STATE,
        p: [this.player.pos.x, this.player.pos.y, this.player.pos.z],
        y: this.player.yaw,
        x: this.player.pitch,
        h: this.player.hp,
        c: this.character,
        tm: this.team,
        hf: this.player.hasEnemyFlag,
        sc: this.player.sizeScale,
      });
    }

    this._updateHud();
    this.input.endFrame();
  }

  _switchWeapon(i) {
    // The meat weapon is UNSWAPPABLE while armed. Bryan: "auto selected and
    // unswappable". Without this the player can collect five steaks and then
    // silently lose the weapon by brushing a number key, which is the worst
    // possible outcome for something that took five pickups to earn.
    if (this.steakAmmo > 0) { this._updateSteakChip(); return; }
    this.weapons.selectSlot(i);
    document.querySelectorAll('#weaponbar .wpn').forEach((el, idx) => {
      el.classList.toggle('active', idx === i);
    });
    if (this.viewmodel) {
      const id = this.weapons.currentDef().id;
      this.viewmodel.setWeapon(id === 'shovel' ? 'shovel'
        : id === 'shotgun' ? 'shotgun' : 'rocket');
    }
  }

  _tryFire() {
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    const origin = this.camera.position.clone();
    // STEAK weapon: if the local player has a charged steak (collected 5),
    // the NEXT fire throws it as a sticky-poison projectile. Priority: if
    // player also has a chicken ready, chicken fires first (bigger + rarer).
    // See docs/features/steak-weapon.md.
    if (this.steakAmmo > 0 && this.chickenAmmo === 0) {
      this.steakAmmo--;
      // Only when the LAST throw is spent do you go back to normal weapons and
      // have to earn another set. Bryan asked for at least two shots out of a
      // set of five steaks.
      if (this.steakAmmo <= 0) this.steakScore = 0;
      const msg = { t: MSG.STEAK_THROW, origin: origin.toArray(), dir: dir.toArray(), by: this.myId };
      this._broadcast(msg);
      this._spawnSteakProjectile(msg);
      if (this.isHost) this._resolveSteakThrow(msg);
      SFX.pew();
      this._updateSteakChip();
      return;
    }
    // Chicken shot short-circuits the weapon system: whenever the local
    // player has a chicken ready, the NEXT fire — from ANY slot — launches
    // the super shot instead. No slot selection required. Chip then flips
    // to a 30s respawn countdown. See docs/features/chicken-auto-fire.md.
    if (this.chickenAmmo > 0) {
      this.chickenAmmo = 0;
      const msg = { t: MSG.CHICKEN_SHOT, origin: origin.toArray(), dir: dir.toArray(), by: this.myId };
      this._broadcast(msg);
      this._spawnChickenProjectile(msg);
      if (this.isHost) this._resolveChickenShot(msg);
      SFX.snorkel();
      this._startChickenCooldownChip();
      return;
    }
    const shots = this.weapons.tryFire(origin, dir, this.rngShots, this.myId);
    if (shots.length > 0) {
      SFX.pew();
      this.viewmodel?.kick();
      // Gore-mode joke SFX: layer a fart on every shot. Farm animals shoot
      // farm-animal ordnance, after all. Docs: docs/features/gore-fart-sfx.md
      if (this.mature) SFX.fart(1.6);
    }
    for (const s of shots) {
      this._broadcast({ t: MSG.SHOT, s });
      this._applyLocalShot(s);
      // Local tracer + muzzle poo for THIS shooter.
      if (s.kind === 'hitscan') {
        this._addTracerForShot(s);
        this.weapons.spawnMuzzleFx(s);
      }
    }
  }

  // Visual: a small white voxel chicken flying from origin along dir. STOPS
  // at the first solid voxel it hits (walls now block it — no more bypass),
  // then a POW explosion. See docs/features/chicken-collision.md.
  _spawnChickenProjectile(msg) {
    const origin = new THREE.Vector3().fromArray(msg.origin);
    const dir = new THREE.Vector3().fromArray(msg.dir);
    const landing = this._chickenLandingPoint(origin, dir);
    const start = origin.clone().addScaledVector(dir, 0.7);
    const flightDist = start.distanceTo(landing);
    const SPEED = 28;
    const shot = {
      kind: 'projectile', color: 0xffffff,
      origin: start.toArray(),
      vel: dir.clone().multiplyScalar(SPEED).toArray(),
      damage: 100,
      maxAge: flightDist / SPEED,   // die exactly on impact
    };
    this.weapons.spawnProjectileMesh(shot);
    // Big visual boom + audible thump at the landing point on ALL clients.
    setTimeout(() => this._spawnChickenExplosion(landing), (flightDist / SPEED) * 1000);
  }

  // Raymarch up to 40m; return the first solid-cell centre (or the ray's
  // 40m endpoint). Uses the same grid the physics does — walls / cover /
  // hay bales all count as hits. See docs/features/chicken-collision.md.
  _chickenLandingPoint(origin, dir) {
    for (let t = 0.5; t < 40; t += 0.35) {
      const p = origin.clone().addScaledVector(dir, t);
      if (this.grid.isSolid(p.x, p.y, p.z)) return p;
    }
    return origin.clone().addScaledVector(dir, 40);
  }

  // Explosive kaboom mesh + SFX at the landing point. Cheap: expanding
  // yellow sphere + a puff of orange particles, both fading over 0.5s.
  // The slingshot detonation. Bryan asked for "a more powerful explosion, a
  // bigger explosion with a better explosion sound".
  //
  // The old one was a single pale sphere scaling to 5× over half a second —
  // at distance that is a soap bubble. A blast reads as a blast when several
  // things happen on DIFFERENT timescales at once, which is what this does:
  //   * a white-hot core that appears instantly and dies fast
  //   * a slower orange fireball that swells and darkens as it goes
  //   * an expanding shockwave RING, flat to the ground — the single most
  //     legible part of any explosion at distance, because it is huge, thin,
  //     and moving fast against a static world
  //   * a debris burst of voxel chunks thrown outward on ballistic arcs
  //   * a screen shake if you were close enough to be pushed around by it
  _spawnChickenExplosion(pos) {
    try { SFX.explosion(1.0); } catch (_) { try { SFX.boom(1.0); } catch (_) {} }

    const grp = new THREE.Group();
    grp.position.copy(pos);
    this.scene.add(grp);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(1.0, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xfffbe6, transparent: true, opacity: 1 }));
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(1.0, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xffa32a, transparent: true, opacity: 0.95 }));
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.75, 1.0, 40),
      new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.9,
                                    side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    grp.add(ball, core, ring);

    // Debris: voxel chunks on ballistic arcs, so the blast throws something.
    const debris = [];
    const dGeo = new THREE.BoxGeometry(0.26, 0.26, 0.26);
    for (let i = 0; i < 16; i++) {
      const m = new THREE.Mesh(dGeo, new THREE.MeshLambertMaterial({
        color: i % 3 === 0 ? 0xf6f1e6 : (i % 3 === 1 ? 0xd8a23a : 0x8a5a2b),
        flatShading: true,
      }));
      const a = Math.random() * Math.PI * 2;
      const up = 5.5 + Math.random() * 6.5;
      const out = 5 + Math.random() * 9;
      m.userData.v = new THREE.Vector3(Math.cos(a) * out, up, Math.sin(a) * out);
      m.userData.spin = new THREE.Vector3(Math.random() * 9, Math.random() * 9, Math.random() * 9);
      grp.add(m); debris.push(m);
    }

    // Screen shake, scaled by how close you were.
    const d = this.camera.position.distanceTo(pos);
    if (d < 22) this._shakeCamera(Math.max(0.12, 0.85 * (1 - d / 22)), 0.5);

    const LIFE = 1.25;
    const start = performance.now();
    const tick = () => {
      const age = (performance.now() - start) / 1000;
      if (age >= LIFE) {
        this.scene.remove(grp);
        grp.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
        return;
      }
      const f = age / LIFE;
      // Core: fast and brief.
      const cf = Math.min(1, age / 0.16);
      core.scale.setScalar(0.6 + cf * 4.2);
      core.material.opacity = Math.max(0, 1 - age / 0.22);
      // Fireball: slower, swells further, cools to red as it dies.
      const bf = 1 - Math.pow(1 - f, 2.2);
      ball.scale.setScalar(0.9 + bf * 9.5);
      ball.material.opacity = 0.95 * Math.pow(1 - f, 1.5);
      ball.material.color.setRGB(1, 0.64 - 0.42 * f, 0.16 - 0.14 * f);
      // Shockwave: outruns the fireball and stays thin.
      const rf = 1 - Math.pow(1 - f, 3);
      ring.scale.setScalar(1 + rf * 20);
      ring.material.opacity = 0.9 * Math.pow(1 - f, 2);
      // Debris.
      const dt2 = 1 / 60;
      for (const m of debris) {
        m.userData.v.y -= 22 * dt2;
        m.position.addScaledVector(m.userData.v, dt2);
        m.rotation.x += m.userData.spin.x * dt2;
        m.rotation.y += m.userData.spin.y * dt2;
        m.material.opacity = 1;
        m.visible = age < LIFE * 0.92;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // Brief positional camera shake. Restores the exact pre-shake position each
  // frame before applying a fresh offset, so it can never drift the camera.
  _shakeCamera(power = 0.4, secs = 0.4) {
    if (this._shakeUntil && performance.now() < this._shakeUntil) {
      this._shakePower = Math.max(this._shakePower, power);
      return;
    }
    this._shakePower = power;
    this._shakeUntil = performance.now() + secs * 1000;
    const start = performance.now();
    const tick = () => {
      const now = performance.now();
      if (now >= this._shakeUntil) { this._shakePower = 0; return; }
      const left = 1 - (now - start) / (this._shakeUntil - start);
      const p = this._shakePower * left * left;
      this.camera.position.x += (Math.random() - 0.5) * p;
      this.camera.position.y += (Math.random() - 0.5) * p;
      this.camera.position.z += (Math.random() - 0.5) * p;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // Host: find where the chicken lands (SAME raymarch as the visual, so
  // both stop at exactly the same voxel), then insta-kill the closest
  // player within blast radius.
  _resolveChickenShot(msg) {
    if (!this.isHost) return;
    const origin = new THREE.Vector3().fromArray(msg.origin);
    const dir = new THREE.Vector3().fromArray(msg.dir);
    const landing = this._chickenLandingPoint(origin, dir);
    // Closest player within 4m of landing.
    let victim = null, best = 4.0;
    for (const p of this._allPlayerRefs()) {
      if (p.peerId === msg.by) continue;   // don't blow up yourself
      const d = p.pos.distanceTo(landing);
      if (d < best) { best = d; victim = p; }
    }
    if (victim) {
      const bot = this.bots.get(victim.peerId);
      if (bot) {
        bot.takeDamage(100);
        this._broadcast({ t: MSG.DEATH, victim: victim.peerId, killer: msg.by, weapon: 'chicken' });
        setTimeout(() => bot.respawn(), 500);
      } else if (victim.peerId === this.myId) {
        this._takeDamage(100, msg.by, 'chicken');
      } else {
        this._broadcast({ t: MSG.HIT, target: victim.peerId, dmg: 100, by: msg.by, weapon: 'chicken' });
      }
      this._killFeedPush(`${this._name(msg.by)} obliterated ${this._name(victim.peerId)} with a chicken!`);
    }
  }

  // -- Steak system ------------------------------------------------------
  // Every method here is a small, focused helper. See docs/features/steak-weapon.md.

  // Someone else broke a steak — update our local pickup visibility. Their
  // score doesn't affect ours; we only pop the pickup so the world looks
  // right.
  _steakBreakRemote(side, byId) {
    void byId;
    this.steakPickups?.markBroken(side);
  }

  // Fire a sticky-poison steak. Straight projectile at 22 m/s, dies at
  // impact or 30 m. See docs/features/bullets-straight.md — no gravity.
  _spawnSteakProjectile(msg) {
    const origin = new THREE.Vector3().fromArray(msg.origin);
    const dir = new THREE.Vector3().fromArray(msg.dir);
    this.weapons.spawnProjectileMesh({
      kind: 'projectile', color: 0xa02020,
      origin: origin.clone().addScaledVector(dir, 0.6).toArray(),
      vel: dir.clone().multiplyScalar(22).toArray(),
      damage: 0, maxAge: 30 / 22,
    });
  }

  // Host: find the closest enemy along the ray and attach poison. Also
  // covers self-shooters (chunky friendly-fire) if the ray happens to
  // pass through anyone but the thrower first.
  _resolveSteakThrow(msg) {
    if (!this.isHost) return;
    const origin = new THREE.Vector3().fromArray(msg.origin);
    const dir = new THREE.Vector3().fromArray(msg.dir);
    let victim = null, bestT = 30;
    for (const p of this._allPlayerRefs()) {
      if (p.peerId === msg.by) continue;
      const toP = p.pos.clone().sub(origin);
      const t = toP.dot(dir);
      if (t < 0 || t > 30) continue;
      const closest = origin.clone().addScaledVector(dir, t);
      const d = closest.distanceTo(p.pos);
      if (d < 1.1 && t < bestT) { bestT = t; victim = p; }
    }
    if (victim) {
      this._broadcast({ t: MSG.STEAK_ATTACH, victim: victim.peerId, by: msg.by });
      this._applySteakAttach(victim.peerId, msg.by);
    }
  }

  // Attach poison to the victim. Every peer tracks who's poisoned so their
  // HUD + death-cause read correctly.
  _applySteakAttach(victimId, byId) {
    this._steakPoisonBy.set(victimId, byId);
    if (victimId === this.myId) {
      this._showPoisonHint();
    }
  }

  // Host: 1 Hz tick — apply 2 dmg to every poisoned player. If the victim
  // is the local host, apply direct damage; else broadcast a HIT + track
  // for the death announcer.
  _steakPoisonTick() {
    if (!this.isHost) return;
    if (this.matchState !== 'playing') return;
    for (const [victimId, byId] of this._steakPoisonBy) {
      const victim = this._allPlayerRefs().find((p) => p.peerId === victimId);
      if (!victim) { this._steakPoisonBy.delete(victimId); continue; }
      const bot = this.bots.get(victimId);
      if (bot) {
        const died = bot.takeDamage(2);
        if (died) {
          this._broadcast({ t: MSG.STEAK_DEATH, victim: victimId, killer: byId });
          this._announceSteakAnnihilation(victimId, byId);
          this._steakPoisonBy.delete(victimId);
          setTimeout(() => bot.respawn(), 500);
        }
      } else if (victimId === this.myId) {
        this._takeDamage(3, byId, 'steak');
        if (this.player.hp <= 0) {
          this._broadcast({ t: MSG.STEAK_DEATH, victim: victimId, killer: byId });
          this._announceSteakAnnihilation(victimId, byId);
          this._steakPoisonBy.delete(victimId);
        }
      } else {
        this._broadcast({ t: MSG.HIT, target: victimId, dmg: 2, by: byId, weapon: 'steak' });
        this._broadcast({ t: MSG.STEAK_TICK, victim: victimId, dmg: 2 });
      }
    }
  }

  // Big red STEAK ANIHILATION overlay + Unreal-Tournament-style announcer.
  _announceSteakAnnihilation(victimId, killerId) {
    void killerId;
    try { SFX.announcer('STEAK ANIHILATION'); } catch (_) {}
    this.critters?.cheer(this._posOf(victimId), 'annihilation');
    const el = document.createElement('div');
    el.textContent = 'STEAK-ANIHILATION!';
    Object.assign(el.style, {
      position: 'fixed', left: '50%', top: '20%',
      transform: 'translateX(-50%) scale(0.4)',
      color: '#ff2a1a', font: '900 min(11vw, 88px)/1 "Georgia", serif',
      letterSpacing: '0.06em',
      textShadow: '0 0 20px #ff0, 0 4px 0 #440000, 0 8px 20px rgba(0,0,0,0.9)',
      pointerEvents: 'none', zIndex: '9999',
      transition: 'transform 0.35s cubic-bezier(0.2,1.6,0.3,1), opacity 0.6s ease-out 1.6s',
      opacity: '1',
    });
    document.body.appendChild(el);
    requestAnimationFrame(() => { el.style.transform = 'translateX(-50%) scale(1)'; });
    setTimeout(() => { el.style.opacity = '0'; }, 1600);
    setTimeout(() => { el.remove(); }, 2400);
  }

  // Small HUD hint for the poisoned player.
  _showPoisonHint() {
    let el = document.getElementById('poison-hint');
    if (!el) {
      el = document.createElement('div');
      el.id = 'poison-hint';
      Object.assign(el.style, {
        position: 'fixed', left: '50%', top: 'calc(max(8px, env(safe-area-inset-top)) + 170px)',
        transform: 'translateX(-50%)', padding: '6px 14px',
        background: 'rgba(90,10,10,0.85)', color: '#ffb0a0',
        font: '800 14px system-ui, sans-serif', borderRadius: '999px',
        border: '1px solid #ff5a3a', boxShadow: '0 0 18px rgba(255,60,20,0.7)',
        pointerEvents: 'none', zIndex: '30',
        animation: 'poisonPulse 0.8s ease-in-out infinite',
      });
      el.textContent = '☠  dying from steak poisoning';
      document.body.appendChild(el);
      const s = document.createElement('style');
      s.textContent = '@keyframes poisonPulse { 0%,100% { opacity: 0.85; } 50% { opacity: 1; box-shadow: 0 0 30px rgba(255,60,20,1); } }';
      document.head.appendChild(s);
    }
    el.style.display = 'block';
  }

  // Hide the poison pill. Called on any death of the local player and when
  // a STEAK_DEATH names them — previously the pill stayed up forever (bug).
  _hidePoisonHint() {
    const el = document.getElementById('poison-hint');
    if (el) el.style.display = 'none';
  }

  // HUD chip: reuse the chicken chip slot. Shows 🥩 3/5 while collecting,
  // then 🥩 READY on 5, then vanishes on throw (chicken chip takes over
  // its own state).
  _updateSteakChip() {
    let slot = document.querySelector('.wpn.chicken');
    if (!slot) return;
    // An ARMED meat weapon outranks everything, including the chicken's 30 s
    // respawn countdown. The countdown used to suppress the steak chip
    // entirely, so a player could collect all five steaks and get no UI at
    // all — which is exactly what "I don't seem to get the meat weapon" looks
    // like from the outside, whether or not the weapon was really armed.
    if (this.steakAmmo > 0) {
      slot.style.display = '';
      slot.classList.remove('cooldown');
      slot.innerHTML = '<span class="wpn-icon">🥩</span>'
        + `<span class="wpn-key">×${this.steakAmmo}</span>`
        + '<span class="wpn-name">MEAT</span>';
      return;
    }
    // Otherwise the chicken owns the chip while READY *or* while its countdown
    // is repainting it every 500 ms — writing steak state on top of the
    // ticking countdown made the chip flicker between the two.
    if (this.chickenAmmo > 0 || this._chickenCdTimer) return;
    if (this.steakScore > 0) {
      slot.style.display = '';
      slot.innerHTML = `<span class="wpn-icon">🥩</span><span class="wpn-key">${this.steakScore}/${STEAK_GOAL}</span><span class="wpn-name">steaks</span>`;
    } else {
      slot.style.display = 'none';
    }
  }

  // ---- power-ups ---------------------------------------------------------
  // docs/features/power-ups.md. The pickup is host-authoritative (like the
  // chicken); the EFFECT is entirely local — every client runs its own
  // 20-second clock on its own player and tells the world its size on the
  // normal 20 Hz STATE packet.

  _grantPowerUp(id, peerId) {
    if (peerId !== this.myId) return;
    const def = POWER_UPS[id];
    if (!def) return;
    // applyPowerUp REPLACES rather than stacks: you cannot be a giant and a
    // mouse, and re-drinking what you already have refreshes the full 20 s.
    this.powerUpState = applyPowerUp(this.powerUpState, id, performance.now());
    this._updatePowerUpEffect();
    this._showPowerGet(`${def.emoji}  ${def.name}  ${def.emoji}`, def.blurb);
    try { SFX.chirp(); SFX.boom(0.35); } catch (_) {}
  }

  // Runs every frame: expire the clock, push the current size at the player
  // and the weapon, repaint the pill. Every call is idempotent, so this is
  // safe to run from the frame loop AND from the moment of pickup.
  _updatePowerUpEffect() {
    if (!this.player) return;
    const now = performance.now();
    const { state, expired } = expirePowerUp(this.powerUpState, now);
    this.powerUpState = state;
    if (expired) { try { SFX.splat(); } catch (_) {} }
    const scale = scaleFor(state);
    this.player.setSizeScale(scale);
    if (this.weapons) this.weapons.cooldownScale = cooldownScaleFor(state);
    this._paintPowerUpPill(now);
  }

  // HUD rung 200 — the first free one under the poison hint. See the ladder in
  // docs/GAME_DESIGN.md: every element gets its own rung and nothing shares.
  _paintPowerUpPill(now) {
    const def = activeDef(this.powerUpState);
    let el = document.getElementById('powerup-pill');
    if (!def) { if (el) el.style.display = 'none'; return; }
    if (!el) {
      el = document.createElement('div');
      el.id = 'powerup-pill';
      Object.assign(el.style, {
        position: 'fixed', left: '50%',
        top: 'calc(max(8px, env(safe-area-inset-top)) + 200px)',
        transform: 'translateX(-50%)', padding: '6px 14px',
        font: '800 14px system-ui, sans-serif', borderRadius: '999px',
        pointerEvents: 'none', zIndex: '30', whiteSpace: 'nowrap',
      });
      document.body.appendChild(el);
    }
    const hex = `#${def.tint.toString(16).padStart(6, '0')}`;
    el.style.display = 'block';
    el.style.color = hex;
    el.style.background = 'rgba(12,16,26,0.85)';
    el.style.border = `1px solid ${hex}`;
    el.style.boxShadow = `0 0 16px ${hex}66`;
    el.textContent = `${def.emoji}  ${def.hud}  ${remainingSeconds(this.powerUpState, now)}s`;
  }

  _addTracerForShot(s) {
    const def = WEAPON_DEFS.find((d) => d.id === s.weaponId);
    const color = def && def.tracerColor ? def.tracerColor : 0xf4c95d;
    const origin = new THREE.Vector3().fromArray(s.origin);
    const dir    = new THREE.Vector3().fromArray(s.dir);
    this.tracers.addHitscan(origin, dir, SHOT_RANGE * 0.8, color);
  }

  // Resolve a shot fired by us: check hitscan vs remote players + world;
  // report HITs to the target.
  _applyLocalShot(s) {
    if (s.kind === 'hitscan') {
      const origin = new THREE.Vector3().fromArray(s.origin);
      const dir = new THREE.Vector3().fromArray(s.dir);
      // STEAK pickup detection: if the ray hits a floating steak before a
      // player, count it. Steaks respawn 2 s later. At 5, next fire = steak throw.
      const steakSide = this.steakPickups?.raycastHit(origin, dir, SHOT_RANGE);
      if (steakSide) {
        this.steakPickups.markBroken(steakSide);
        this._broadcast({ t: MSG.STEAK_BREAK, at: steakSide, by: this.myId });
        this.steakScore = Math.min(STEAK_GOAL, this.steakScore + 1);
        if (this.steakScore >= STEAK_GOAL && this.steakAmmo === 0) {
          // Collecting the set ARMS the meat weapon: two throws, auto-selected
          // and locked in until they are spent (see _switchWeapon).
          this.steakAmmo = STEAK_THROWS;
          this._showPowerGet('🥩  MEAT WEAPON  🥩',
            `${STEAK_THROWS} poison throws — FIRE to launch`);
          try { SFX.chirp(); SFX.boom(0.35); } catch (_) {}
        }
        this._updateSteakChip();
        SFX.splat();
        return;   // steak absorbs the shot
      }
      // NOTE: with the shovel and shotgun converted to real projectiles
      // (weapon.js), nothing reaches this branch any more except a genuinely
      // instant weapon, should one ever be added. Damage for the travelling
      // weapons is resolved on CONTACT in _resolveOwnProjectiles.
      const hit = this._raycastPlayers(origin, dir);
      if (hit) {
        this._broadcast({ t: MSG.HIT, target: hit.peerId, dmg: s.damage, by: this.myId, weapon: s.weaponId });
        // Did that finish them? Bots we can read directly; remote humans
        // report their own death, so this is a local best guess for FEEL only
        // — the kill feed remains the source of truth.
        const bot = this.bots.get(hit.peerId);
        const rp = this.remotePlayers.get(hit.peerId);
        const hpLeft = bot ? bot.hp - s.damage
                     : (rp && rp.hp != null ? rp.hp - s.damage : null);
        const killed = hpLeft != null && hpLeft <= 0;
        this._flashHitmarker(s.damage, killed);
        SFX.splat();
        // In GORE mode, spatter voxel blood at the hit location.
        if (this.mature) {
          const rp = this.remotePlayers.get(hit.peerId);
          if (rp) {
            const hitPos = rp.group.position.clone().add(new THREE.Vector3(0, 1, 0));
            const awayDir = new THREE.Vector3().fromArray(s.dir).multiplyScalar(-1);
            this.gore.spatterAt(hitPos, awayDir);
          }
        }
      }
    } else if (s.kind === 'projectile') {
      // MY projectile: spawn it and follow it, because I am the client that
      // decides what it hits. Authority is unchanged — each shooter has always
      // resolved their own shots — only the moment moved, from the trigger
      // frame to the frame the pellet arrives.
      this._trackOwnProjectile(this.weapons.spawnProjectileMesh(s), s);
    }
  }

  _applyRemoteShot(s) {
    // Somebody else's shot: visual only. They resolve their own contacts, so
    // this client must never damage anyone on their behalf.
    if (s.kind === 'projectile') this.weapons.spawnProjectileMesh(s);
    if (s.kind === 'hitscan') {
      this._addTracerForShot(s);
      this.weapons.spawnMuzzleFx(s);
    }
    SFX.pew();
  }

  // Start following one of my own projectiles for contact resolution.
  _trackOwnProjectile(rec, shot) {
    if (!rec) return;
    (this._ownProjectiles ??= []).push({
      rec, shot,
      prev: rec.pos.clone(),
      travelled: 0,
    });
  }

  // Advance every projectile I own and resolve what it touched THIS FRAME.
  // Called after weapons.update(dt), which is what actually moves them, so
  // `prev -> rec.pos` is exactly the segment the pellet swept.
  _resolveOwnProjectiles() {
    const live = this._ownProjectiles;
    if (!live || !live.length) return;
    const enemyTeam = this.team === 'red' ? 'blue' : 'red';

    // ENEMIES ONLY. Bryan 2026-08-22: "i seem to be able to hit allies, which
    // i dont want to have in the game." The old hitscan raycast walked every
    // remote player irrespective of team, so a team-mate between you and your
    // target ate the shot. Friendly fire is now impossible by construction:
    // an ally is simply not in the list a pellet can collide with.
    // Chest offset and hit radius both scale with the target's power-up size,
    // exactly as the old raycast did — a giant is a bigger target and a mouse
    // a smaller one, floored by hitRadiusFor() so the cheese wheel makes you
    // hard to hit rather than impossible (powerUpSpec.js).
    const targets = this._allPlayerRefs()
      .filter((p) => p.peerId !== this.myId && p.team === enemyTeam && p.alive !== false)
      .map((p) => {
        const sc = this._peerScale.get(p.peerId) ?? 1;
        return {
          id: p.peerId,
          x: p.pos.x, y: p.pos.y + 1.0 * sc, z: p.pos.z,
          radius: hitRadiusFor(sc),
        };
      });
    const isSolid = (x, y, z) => this.grid.isSolid(x, y, z);

    for (let i = live.length - 1; i >= 0; i--) {
      const p = live[i];
      const from = p.prev;
      const to = p.rec.pos;
      p.travelled += from.distanceTo(to);

      const result = stepProjectile({
        from: { x: from.x, y: from.y, z: from.z },
        to:   { x: to.x,   y: to.y,   z: to.z },
        targets, isSolid,
        age: p.rec.age, maxAge: 4,
        travelled: p.travelled, maxRange: SHOT_RANGE,
      });

      if (!result) { p.prev.copy(to); continue; }

      if (result.kind === 'player') {
        this._onProjectileHitPlayer(result.id, p.shot, result.point);
      } else if (result.kind === 'world') {
        // A visible puff where it struck, so a miss reads as a miss.
        this.gore?.spatterAt?.(
          new THREE.Vector3(result.point.x, result.point.y, result.point.z),
          shotDirection(p.shot).multiplyScalar(-1));
      }
      this.weapons.despawnProjectile(p.rec);
      live.splice(i, 1);
    }
  }

  // My pellet touched an enemy. Same reporting as before — only later.
  _onProjectileHitPlayer(peerId, shot, point) {
    this._broadcast({ t: MSG.HIT, target: peerId, dmg: shot.damage,
                      by: this.myId, weapon: shot.weaponId });
    const bot = this.bots.get(peerId);
    const rp = this.remotePlayers.get(peerId);
    const hpLeft = bot ? bot.hp - shot.damage
                 : (rp && rp.hp != null ? rp.hp - shot.damage : null);
    this._flashHitmarker(shot.damage, hpLeft != null && hpLeft <= 0);
    SFX.splat();
    if (this.mature) {
      const away = shotDirection(shot).multiplyScalar(-1);
      this.gore?.spatterAt?.(new THREE.Vector3(point.x, point.y, point.z), away);
    }
    // Bots take damage locally on the host; humans apply their own from HIT.
    if (bot && this.isHost) {
      const died = bot.takeDamage(shot.damage);
      if (died) {
        this._broadcast({ t: MSG.DEATH, victim: peerId, killer: this.myId, weapon: shot.weaponId });
        this._creditKill(this.myId, peerId);
        this._killFeedPush(`${this._name(this.myId)} ➜ ${bot.name} (${shot.weaponId})`);
        this.critters?.cheer(this._posOf(peerId), 'kill');
        setTimeout(() => bot.respawn(), 500);
      }
    }
  }

  _raycastPlayers(origin, dir) {
    // Sphere test against each remote player, centred on their chest.
    //
    // Both the chest offset and the sphere SCALE with the target's power-up
    // size: a giant is a chest-high aim point 2 m up and a 1.4 m sphere, a
    // mouse is one 0.2 m up and a 0.42 m sphere. hitRadiusFor() floors the
    // shrunk case so the cheese wheel makes you a harder target, never an
    // impossible one (powerUpSpec.js).
    let best = null;
    let bestT = Infinity;
    for (const [pid, rp] of this.remotePlayers.entries()) {
      const sc = this._peerScale.get(pid) ?? 1;
      const chest = rp.group.position.clone().add(new THREE.Vector3(0, 1 * sc, 0));
      const to = chest.clone().sub(origin);
      const projT = to.dot(dir);
      if (projT < 0.5 || projT > SHOT_RANGE) continue;
      const closest = origin.clone().addScaledVector(dir, projT);
      const perp = chest.distanceTo(closest);
      if (perp < hitRadiusFor(sc) && projT < bestT) {
        bestT = projT;
        best = { peerId: pid };
      }
    }
    // Also check that we didn't shoot through a wall (voxel raymarch).
    if (best) {
      if (this._rayHitsWall(origin, dir, bestT)) return null;
    }
    return best;
  }

  _rayHitsWall(origin, dir, tMax) {
    const step = 0.25;
    const iters = Math.min(Math.ceil(SHOT_RANGE / step) + 4, Math.ceil(tMax / step));
    for (let i = 0; i < iters; i++) {
      const t = i * step;
      const p = origin.clone().addScaledVector(dir, t);
      if (this.grid.isSolid(p.x, p.y, p.z)) return true;
    }
    return false;
  }

  // ---- damage / death ---------------------------------------------------

  _takeDamage(dmg, byId, weaponId) {
    if (!this.player.alive) return;
    // Solo / lobby / countdown = practice mode, no damage.
    if (this.matchState !== 'playing') return;
    // Respawn protection: 2 s of invulnerability after a death so spawn
    // camping can't chain-kill. Design pass 2026-08-21 (docs/GAME_DESIGN.md).
    if (performance.now() < (this._invulnUntil || 0)) return;
    this.player.hp -= dmg;
    // Corn kernels fly off the health bar for every point of damage.
    this._spawnCornFly(Math.min(Math.ceil(dmg / 2), 25));
    // Visual + directional hit feedback so you SEE getting shot.
    this._flashHit(byId);
    SFX.splat();
    if (this.player.hp <= 0) {
      this.player.hp = 0;
      this.player.alive = false;
      // If carrying a flag, RETURN it to its home stand (Bryan 2026-08-20:
      // "when I die with the flag, the flag should go back to its initial
      // location"). Broadcast so peers do the same server-authoritatively.
      if (this.player.hasEnemyFlag) {
        const enemyColor = this.team === 'red' ? 'blue' : 'red';
        this.player.hasEnemyFlag = false;
        this._returnFlag(enemyColor);
        this._broadcast({ t: MSG.FLAG_RETURN, by: this.myId, color: enemyColor });
      }
      this._broadcast({ t: MSG.DEATH, victim: this.myId, killer: byId, weapon: weaponId });
      // Local animal death voice (broadcast doesn't loop back to me).
      try { SFX.animalVoice(this.character, 1.0); } catch (_) {}
      // ...and in GORE mode the announcer rubs it in. Same reason as the
      // animal voice above: my own DEATH broadcast never comes back to me, so
      // the handler in _onMessage cannot cover the case where the dead player
      // is me — which is the only case that matters for this taunt.
      if (this.mature) this._announceLoser();
      this._killFeedPush(`${this._name(byId)} ➜ ${this._name(this.myId)} (${weaponId})`);
      // Death clears any steak poison + its HUD hint.
      this._steakPoisonBy.delete(this.myId);
      this._hidePoisonHint();
      // ...and any power-up. A buff that survives death is a buff the player
      // can no longer see the source of, and respawning giant would also drop
      // them a metre into their own barn floor (Player.respawn).
      this.powerUpState = clearOnDeath();
      this._updatePowerUpEffect();
      // Immediate respawn per spec, with 2 s spawn protection.
      this.player.respawn();
      this._invulnUntil = performance.now() + 2000;
    }
  }

  // ---- flags -----------------------------------------------------------

  _updateFlags() {
    if (this.mode.flags === 'none') return;
    if (!this.player.alive) return;
    const enemyColor = this.team === 'red' ? 'blue' : 'red';
    const myColor    = this.team;

    // Pickup + capture logic is delegated to web-engine/ctf/flagLogic so
    // it's node-testable. See flagLogic.test.js + docs/features/carried-flag-visibility.md.
    const action = computeFlagAction({
      playerPos: { x: this.player.pos.x, z: this.player.pos.z },
      playerTeam: this.team,
      hasEnemyFlag: this.player.hasEnemyFlag,
      flagState: this.flagState,
      flagPos: {
        red:  { x: this.world.flags.red.x,  z: this.world.flags.red.z  },
        blue: { x: this.world.flags.blue.x, z: this.world.flags.blue.z },
      },
    });
    if (action === 'pickup') {
      this.player.hasEnemyFlag = true;
      this.flagState[enemyColor] = 'carried';
      this.flagCarrier[enemyColor] = this.myId;
      this._broadcast({ t: MSG.FLAG_PICK, by: this.myId, color: enemyColor });
      this.critters?.cheer(this.player.pos, 'pickup');
    } else if (action === 'capture') {
      this.player.hasEnemyFlag = false;
      this.scores[myColor]++;
      this._broadcast({ t: MSG.FLAG_CAP, by: this.myId, color: enemyColor });
      this._broadcast({ t: MSG.SCORE, scores: this.scores });
      this._returnFlag(enemyColor);
      this._updateScoreUi();
      this._killFeedPush(`${this._name(this.myId)} captured the ${enemyColor} flag!`);
      this.critters?.cheer(this.player.pos, 'capture');
      // The bots have opinions about a human scoring on them.
      for (const bot of this.bots.values()) {
        this._botTaunt(bot.peerId, bot.team === myColor ? 'capture' : 'conceded');
      }
      this._maybeTriggerAnagram();
    }

    // Sync flag position visually if I'm carrying it — LIFT it above my
    // head so I can actually see the fabric in my first-person view, and
    // set a bright HUD banner so I know I'm carrying. See
    // docs/features/carried-flag-visibility.md.
    if (this.player.hasEnemyFlag) {
      this.flagPos[enemyColor] = {
        x: this.player.pos.x,
        y: this.player.pos.y + 1.8,   // above my head, visible in FPV
        z: this.player.pos.z,
      };
      this._syncFlagMesh(enemyColor);
    }
    this._paintCarryBanner();
  }

  // Big pulsing HUD banner shown ONLY while the local player carries a flag.
  // "🚩 YOU HAVE THE FLAG — RUN HOME!" — reads on mobile too.
  _paintCarryBanner() {
    let el = document.getElementById('carry-banner');
    if (!el) {
      el = document.createElement('div');
      el.id = 'carry-banner';
      el.innerHTML = '🚩 YOU HAVE THE ENEMY FLAG — RUN HOME!';
      Object.assign(el.style, {
        position: 'fixed',
        left: '50%',
        top: 'calc(max(8px, env(safe-area-inset-top)) + 130px)',
        transform: 'translateX(-50%)',
        padding: '8px 16px',
        background: 'linear-gradient(90deg,#3a7cff,#7cb0ff,#3a7cff)',
        color: '#fff',
        font: '900 15px system-ui, sans-serif',
        letterSpacing: '0.03em',
        borderRadius: '999px',
        border: '2px solid #fff2b0',
        boxShadow: '0 0 24px rgba(58,124,255,0.85)',
        zIndex: '30',
        pointerEvents: 'none',
        display: 'none',
        animation: 'carryPulse 1.1s ease-in-out infinite',
      });
      document.body.appendChild(el);
      const style = document.createElement('style');
      style.textContent = '@keyframes carryPulse { 0%,100% { transform: translateX(-50%) scale(1); } 50% { transform: translateX(-50%) scale(1.08); box-shadow: 0 0 44px rgba(58,124,255,1); } }';
      document.head.appendChild(style);
    }
    el.style.display = this.player?.hasEnemyFlag ? 'block' : 'none';
  }

  _returnFlag(color) {
    this.flagState[color] = 'home';
    this.flagCarrier[color] = null;
    this.flagPos[color] = { ...this.world.flags[color] };
    this._syncFlagMesh(color);
  }

  _syncFlagMesh(color) {
    const p = this.flagPos[color];
    const m = this.flagMeshes[color];
    // Match _buildFlagMesh — sit ON TOP of the floor voxel, not buried
    // inside it. Bryan 2026-08-20: "flags somewhere off the map".
    m.position.set(p.x + 0.5, p.y, p.z + 0.5);
    // Make the carried flag GLOW so it's obvious it's the one you have.
    // Uses the fabric material's emissive; safe to toggle every sync.
    const fabric = m.children[1];
    if (fabric && fabric.material && 'emissive' in fabric.material) {
      const carried = this.flagState[color] === 'carried' && this.flagCarrier[color] === this.myId;
      fabric.material.emissive.setHex(carried ? 0x3a7cff : 0x000000);
      fabric.material.emissiveIntensity = carried ? 1.2 : 0;
    }
  }

  // ---- mode scoring -----------------------------------------------------

  // Host-authoritative. A kill is worth a point only in a kill mode, and
  // never for a suicide or a team-kill — see killScores() in gameModes.js.
  _creditKill(killerId, victimId) {
    if (!this.isHost || this.gameOver) return;
    // Bots trash-talk about kills they were part of, either end of it.
    if (this.bots.has(killerId)) this._botTaunt(killerId, 'kill');
    if (this.bots.has(victimId)) this._botTaunt(victimId, 'death');
    const team = (id) => this.playerMeta.get(id)?.team
      || this.bots.get(id)?.team
      || (id === this.myId ? this.team : null);
    const scoring = killScores(this.mode, team(killerId), team(victimId));
    if (!scoring) return;
    this.scores[scoring]++;
    this._broadcast({ t: MSG.SCORE, scores: this.scores });
    this._updateScoreUi();
    this._maybeTriggerAnagram();
  }

  // Host-authoritative, called once per frame in KOTH. Accumulates real
  // seconds of SOLE possession — one enemy on the hill stops the clock for
  // everyone, which is what stops the mode being a camp.
  _tickHill(dt) {
    if (!this.isHost || this.gameOver) return;
    if (this.mode.scoring !== 'hold' || !this.world || !this.player) return;
    const centre = this.world.hillSpawn;
    const occupants = [];
    for (const ref of this._allPlayerRefs()) {
      if (ref.alive === false) continue;
      if (onHill(this.mode, ref.pos, centre)) occupants.push(ref.team);
    }
    const owner = hillOwner(this.mode, occupants);
    // Broadcast the contested/held state so every client's HUD agrees; the
    // banner is the only feedback the mode has and it has to be immediate.
    if (owner !== this._hillOwner) {
      this._hillOwner = owner;
      this._paintHillBanner(owner, occupants.length);
    }
    if (!owner) return;
    this._hold[owner] += dt;
    const whole = Math.floor(this._hold[owner]);
    if (whole > this.scores[owner]) {
      this.scores[owner] = whole;
      this._broadcast({ t: MSG.SCORE, scores: this.scores });
      this._updateScoreUi();
      this._maybeTriggerAnagram();
    }
  }

  // Its own element, deliberately. `flagStatus` is shared by the compass and
  // the power-up chip and has already caused one overprinting bug; a mode
  // banner that fights the compass for the same node would be the second.
  _paintHillBanner(owner, count) {
    if (this.mode.scoring !== 'hold') return;
    let el = document.getElementById('hill-banner');
    if (!el) {
      el = document.createElement('div');
      el.id = 'hill-banner';
      Object.assign(el.style, {
        position: 'fixed', left: '50%',
        top: 'calc(max(8px, env(safe-area-inset-top)) + 96px)',
        transform: 'translateX(-50%)',
        padding: '6px 14px', borderRadius: '999px',
        font: '900 14px system-ui, sans-serif', letterSpacing: '0.03em',
        background: 'rgba(16,18,24,0.72)', border: '2px solid rgba(255,255,255,0.25)',
        color: '#fff', zIndex: '30', pointerEvents: 'none',
      });
      document.body.appendChild(el);
    }
    if (owner) {
      el.textContent = owner === this.team ? '👑 HOLDING THE HILL' : `👑 ${owner.toUpperCase()} HOLDS THE HILL`;
      el.style.color = owner === 'red' ? '#ff8a7a' : '#9cc4ff';
    } else if (count > 0) {
      el.textContent = '⚔️ HILL CONTESTED — clear them off';
      el.style.color = '#f4c95d';
    } else {
      el.textContent = '👑 HILL IS OPEN';
      el.style.color = '#e8f3ff';
    }
  }

  // ---- anagram tiebreaker ---------------------------------------------

  _maybeTriggerAnagram() {
    if (this.gameOver) return;
    const { red, blue } = this.scores;
    // The target is the MODE's, not a constant: 5 captures, 30 kills or 90
    // seconds of held hill all mean "somebody won".
    const winning = modeWinner(this.mode, this.scores);
    if (!winning || !anagramDue(this.mode, this.scores)) return;
    const losing  = winning === 'red' ? 'blue' : 'red';
    this.gameOver = true;
    // Host picks the word and broadcasts.
    if (this.isHost) {
      const wordSeed = (this.seed ^ (red * 73856093) ^ (blue * 19349663)) >>> 0;
      const word = pickWord(wordSeed);
      const scrambled = scramble(word, wordSeed);
      const endsAt = Date.now() + ANAGRAM_SECONDS * 1000;
      this._broadcast({ t: MSG.ANAGRAM_START, word, scrambled, losingTeam: losing, endsAt });
      this._startAnagram(word, scrambled, losing, endsAt);
    }
    // Non-host waits for ANAGRAM_START.
  }

  _startAnagram(word, scrambled, losingTeam, endsAt) {
    this._anagram = { word, scrambled, losingTeam, endsAt,
      spectator: (this.team !== losingTeam) };
    const wrap = document.getElementById('anagramWrap');
    const input = document.getElementById('anagramInput');
    document.getElementById('scrambled').textContent = scrambled;
    document.getElementById('anagramTitle').textContent = this._anagram.spectator
      ? `The ${losingTeam} team is trying to steal the win…`
      : 'Last chance — solve to steal the win!';
    document.getElementById('anagramMsg').textContent = this._anagram.spectator
      ? 'You can only watch. If they solve it in 10 seconds, they win.'
      : 'Unscramble the letters. First correct answer wins for your team.';
    wrap.classList.add('visible');
    input.value = '';
    input.disabled = this._anagram.spectator;
    if (!this._anagram.spectator) {
      setTimeout(() => input.focus(), 30);
      input.oninput = () => {
        if (input.value.trim().toUpperCase() === word.toUpperCase()) {
          this._broadcast({ t: MSG.ANAGRAM_WIN, winner: losingTeam, by: this.myId });
          this._endAnagram({ winner: losingTeam, by: this.myId });
        }
      };
    } else {
      input.oninput = null;
    }
    // Countdown
    const tick = () => {
      if (!this._anagram) return;
      const remain = Math.max(0, Math.ceil((this._anagram.endsAt - Date.now()) / 1000));
      document.getElementById('anagramTimer').textContent = remain;
      if (remain <= 0) {
        const originalWinner = this.scores.red > this.scores.blue ? 'red' : 'blue';
        this._endAnagram({ winner: originalWinner, by: null });
        return;
      }
      setTimeout(tick, 200);
    };
    tick();
  }

  _endAnagram({ winner, by }) {
    const wrap = document.getElementById('anagramWrap');
    const msg  = document.getElementById('anagramMsg');
    const timer = document.getElementById('anagramTimer');
    document.getElementById('anagramTitle').textContent =
      winner === this.team ? 'YOUR TEAM WINS' : `${winner.toUpperCase()} TEAM WINS`;
    timer.textContent = '★';
    if (by) msg.textContent = `${this._name(by)} solved "${this._anagram?.word}" and stole the win for ${winner}.`;
    else    msg.textContent = `Time's up. ${winner.toUpperCase()} team keeps the score-based win.`;
    // Freeze; leave overlay up.
    this._anagram = null;
  }

  // ---- HUD --------------------------------------------------------------

  _updateHud() {
    document.getElementById('scoreRed').textContent  = this.scores.red;
    document.getElementById('scoreBlue').textContent = this.scores.blue;
    this._paintCornBar();
    const flagStatus = [];
    if (this.player.hasEnemyFlag)  flagStatus.push('🚩 You have the enemy flag - run home!');
    for (const c of ['red', 'blue']) {
      if (this.flagState[c] === 'carried' && this.flagCarrier[c] !== this.myId) {
        flagStatus.push(`${c.toUpperCase()} flag: carried by ${this._name(this.flagCarrier[c])}`);
      } else if (this.flagState[c] === 'dropped') {
        flagStatus.push(`${c.toUpperCase()} flag: dropped`);
      }
    }
    document.getElementById('flagStatus').textContent = flagStatus.join(' · ');
  }

  _updateScoreUi() {
    document.getElementById('scoreRed').textContent  = this.scores.red;
    document.getElementById('scoreBlue').textContent = this.scores.blue;
  }

  _killFeedPush(text) {
    this._killFeed.push({ text, at: Date.now() });
    if (this._killFeed.length > 5) this._killFeed.shift();
    const el = document.getElementById('kill-feed');
    el.innerHTML = '';
    for (const k of this._killFeed) {
      const d = document.createElement('div');
      d.className = 'kill-line';
      d.textContent = k.text;
      el.appendChild(d);
    }
    // Fade after 6s.
    setTimeout(() => {
      this._killFeed = this._killFeed.filter(k => Date.now() - k.at < 6000);
      const el2 = document.getElementById('kill-feed');
      el2.innerHTML = '';
      for (const k of this._killFeed) {
        const d = document.createElement('div');
        d.className = 'kill-line';
        d.textContent = k.text;
        el2.appendChild(d);
      }
    }, 6100);
  }
}
