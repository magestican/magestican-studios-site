

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
import { attachRightClickMove } from 'arbelo/rmb-move';
import { stepProjectile } from '../../../web-engine/combat/projectileHit.js';
import { shotSolid } from '../../../web-engine/combat/shotWorld.js';
import { Chat } from './ui/chat.js';
import { KillAnnouncer, shouldHear } from './audio/killAnnouncer.js';
import { CornDrops, CORN } from './entities/cornDrop.js';
import { groundHeightAt } from '../../../web-engine/ai/botStep.js';
import { TickSource } from '../../../web-engine/loop/tickSource.js';
import { considerTaunt, newTauntState, TAUNT_RULES } from './entities/botTaunts.js';

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
import { activeViewmodel, isPickupViewmodel } from './entities/viewmodelSpec.js';
import { createPhysicsWorld } from 'arbelo/physics';
import { SnowSystem }         from './entities/snow.js';
import { ChickenPickup }      from './entities/chickenPickup.js';
import { SteakPickups, SIDES as STEAK_SIDES } from './entities/steakPickups.js';
import { PowerUpPickups }   from './entities/powerUps.js';
import {
  POWER_UPS, POWER_UP_IDS, emptyPowerUpState, applyPowerUp, expirePowerUp,
  clearOnDeath, remainingSeconds, activeDef, scaleFor, cooldownScaleFor,
  hitRadiusFor,
} from './entities/powerUpSpec.js';
import { computeFlagAction }  from '../../../../web-engine/ctf/flagLogic.js';
import { isInsideHay }        from '../../../web-engine/physics/hidingChecks.js';
import { hitBearingDeg }      from '../../../web-engine/input/hitMath.js';
import { KillFeed, killFeedLine } from '../../../web-engine/ui/killFeed.js';
import { flagKeysFor, hasFlags, flagHome, neutralFlagHome, objectiveMarkers,
         OBJECTIVE_IDS } from '../../../web-engine/modes/objective.js';
import { GoreSystem }         from './entities/gore.js';
import { AmbientCritters }    from './entities/ambientCritters.js';
import { aimPointY, isHeadshot, damageFor, HEADSHOT_MULTIPLIER } from 'arbelo/hitzones';
import { loadCareer, saveCareer, recordMatch, leaderboard } from 'arbelo/career';
import { publishScores, fetchTopPlayers, isGlobalEnabled } from 'arbelo/leaderboard';
import { emptyTally, tallyKill, scoreboardRows, teamTotals, resultCopy,
         captureFanfare }     from '../../../web-engine/match/matchFlow.js';








import { MATCH_CAP, MAX_BOTS, desiredBots, pickBotToDisplace, hasRoom }
                              from '../../../web-engine/scenarios/matchRoster.js';


const TEAM_HEX = { red: 0xd0503e, blue: 0x4f8adb };
const FLAG_HOME_RADIUS = 3.5;   











const STEAK_GOAL = 4;
const STEAK_THROWS = 2;




















const SHOT_RANGE = 80;





const LOW_HP = 30;

const ANNOUNCE_TEXT = Object.freeze({
  FIRST_BLOOD: 'FIRST BLOOD', DOUBLE_KILL: 'DOUBLE KILL',
  MULTI_KILL: 'MULTI KILL', ULTRA_KILL: 'ULTRA KILL',
  MONSTER_KILL: 'MONSTER KILL', KILLING_SPREE: 'KILLING SPREE',
  RAMPAGE: 'RAMPAGE', DOMINATING: 'DOMINATING',
  UNSTOPPABLE: 'UNSTOPPABLE', GODLIKE: 'GODLIKE',
  HUMILIATION: 'HUMILIATION', REVENGE: 'REVENGE', DENIED: 'DENIED',
});





function shotDirection(shot) {
  if (shot.dir) return new THREE.Vector3().fromArray(shot.dir);
  if (shot.vel) return new THREE.Vector3().fromArray(shot.vel).normalize();
  return new THREE.Vector3(0, 0, 1);
}





function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}










const COMPASS_PILL = Object.freeze({
  red: 'compassRedPill', blue: 'compassBluePill',
  neutral: 'compassObjectivePill', hill: 'compassObjectivePill',
});
const COMPASS_ARROW = Object.freeze({
  red: 'compassRed', blue: 'compassBlue',
  neutral: 'compassObjectiveArrow', hill: 'compassObjectiveArrow',
});
const COMPASS_DIST = Object.freeze({
  red: 'compassRedDist', blue: 'compassBlueDist',
  neutral: 'compassObjectiveDist', hill: 'compassObjectiveDist',
});
const COMPASS_EMOJI = Object.freeze({
  red: 'compassRedEmoji', blue: 'compassBlueEmoji',
  neutral: 'compassObjectiveEmoji', hill: 'compassObjectiveEmoji',
});

const NET_TICK_HZ = 20;
const RESPAWN_DELAY = 0.0;      
const ANAGRAM_SECONDS = 10;




const RESULT_DELAY_MS = 1900;








const INTERMISSION_MS = 10000;



const RESTART_DELAY_MS = 4000;






const RESTART_WATCHDOG_SLACK_MS = 2000;
const LOBBY_MIN_PLAYERS = 2;
const LOBBY_COUNTDOWN_SECONDS = 5;

export class Game {
  constructor(opts) {
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    this._peerScale = new Map();        
    this._steakPoisonBy = new Map();    
    this.opts = opts;
    this.mesh = opts.mesh;
    this.myId = opts.myId;
    this.isHost = opts.isHost;
    this.character = opts.character;
    this.team = opts.team;
    this.name = opts.name;
    this.seed = opts.seed;               
    
    
    
    
    this.mapId = opts.mapId || DEFAULT_MAP;
    this.map = getMap(this.mapId);
    this.sky = getSky(this.mapId);
    this.modeId = opts.mode || DEFAULT_MODE;
    this.mode = getMode(this.modeId);
    
    
    this._hold = { red: 0, blue: 0 };

    this.scores = { red: 0, blue: 0 };
    this.gameOver = false;
    this.matchState = 'lobby';           
    this._matchEndsAt = 0;               
    this.remotePlayers = new Map();      
    this.playerMeta = new Map();         
    this.playerMeta.set(this.myId, {
      name: this.name, character: this.character, team: this.team,
    });
    this.flagCarrier = { red: null, blue: null };  
    this.rngShots = new SeededRng((Math.random() * 2 ** 32) >>> 0);
    this._netAccum = 0;
    this._anagram = null;                
    this._lastRespawnAt = 0;
    
    
    
    this._killFeed = new KillFeed();
    
    
    
    this._tally = emptyTally();
    this._scoreboardOpen = false;
    this.audio = new Chiptune();
    
    
    
    
    
    try { SFX.setMusicDucker((secs) => this.audio.duck(secs)); } catch (_) {}
    this._buildCornBar();
    
    this.bots = new Map();               
    this.initialBotCount = opts.initialBots || 0;
  }

  

  async boot() {
    this._wireNet();

    
    if (!this.isHost) {
      await new Promise((resolve) => {
        const check = () => {
          if (this.seed != null) { resolve(); return; }
          setTimeout(check, 100);
        };
        check();
      });
      
      
      this.map = getMap(this.mapId);
      this.sky = getSky(this.mapId);
      this.mode = getMode(this.modeId);
    } else {
      
      this.mesh.addEventListener('peer-joined', (e) => {
        this._sendWelcome(e.detail.id);
      });
    }

    this._initThree();
    this._buildWorld(this.seed);
    
    
    
    
    
    
    const canvas = this.renderer.domElement;
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this._contextLost = true;
      console.warn('[gfx] WebGL context lost — skipping draws until it returns');
    });
    canvas.addEventListener('webglcontextrestored', () => {
      this._contextLost = false;
      console.warn('[gfx] WebGL context restored');
    });

    
    
    
    this._loop = new TickSource({
      onTick: (dt, opts) => this._frame(dt, opts),
    });
    this._loop.start();

    try {
      await this._initPlayer();
    } catch (err) {
      console.error('[boot] physics init failed', err);
      alert('Physics engine failed to load: ' + err.message + '\n\nCheck your network and refresh.');
      throw err;
    }
    this._initInput();

    
    this._broadcast({ t: MSG.HELLO, name: this.name, character: this.character, team: this.team });

    
    
    
    
    if (this.isHost && this.initialBotCount > 0) {
      const want = desiredBots(this._occupancy().humans, this.initialBotCount);
      for (let i = 0; i < want; i++) this.addBot();
    }
    

    
    
    
    const muteBtn = document.getElementById('mute-btn');
    const paintMute = () => { muteBtn.textContent = this.audio.muted ? '🔇' : '🔊'; };
    paintMute();
    const handleMuteToggle = (e) => {
      if (e) e.preventDefault();
      
      
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

    
    const addBotBtn = document.getElementById('add-bot-btn');
    if (this.isHost) {
      addBotBtn.style.display = 'block';
      const onAddBot = (e) => { if (e) e.preventDefault(); this.addBot(); };
      addBotBtn.addEventListener('click', onAddBot);
      addBotBtn.addEventListener('touchstart', onAddBot, { passive: false });
    }

    
    
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
    
    
    this.chat = new Chat({
      onSend: (text) => {
        const msg = { t: MSG.CHAT, from: this.myId, name: this.name,
                      team: this.team, text, kind: 'say' };
        this._broadcast(msg);
        this.chat.push(msg);
      },
    });
    this._taunts = newTauntState();
    
    
    
    
    
    this._killAnnouncer = new KillAnnouncer();
    this.cornDrops = new CornDrops(this.scene);

    
    
    import('../../../web-engine/support/support.js')
      .then(({ mountSupportLink }) => mountSupportLink(document.getElementById('support-slot')))
      .catch(() => {});

    
    
    const aimCheck = document.getElementById('aim-assist');
    if (aimCheck) {
      this.aimAssist = localStorage.getItem('tb.aimassist') !== '0';
      aimCheck.checked = this.aimAssist;
      aimCheck.addEventListener('change', () => {
        this.aimAssist = aimCheck.checked;
        localStorage.setItem('tb.aimassist', this.aimAssist ? '1' : '0');
      });
    }
    
    
    
    
    
    const rmbCheck = document.getElementById('rmb-move');
    if (rmbCheck) {
      this.rmbMove = localStorage.getItem('tb.rmbmove') === '1';
      rmbCheck.checked = this.rmbMove;
      rmbCheck.addEventListener('change', () => {
        this.rmbMove = rmbCheck.checked;
        localStorage.setItem('tb.rmbmove', this.rmbMove ? '1' : '0');
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
    
    const onEnable = (e) => { if (e) e.preventDefault(); tryStartAudio(); };
    enablePrompt.addEventListener('click', onEnable);
    enablePrompt.addEventListener('touchstart', onEnable, { passive: false });
    
    setTimeout(() => {
      if (!this.audio.isPlaying) enablePrompt.classList.add('visible');
    }, 2000);
    
    this._tryStartAudio = tryStartAudio;

    
    
    
    this._updateLobbyBanner();
    if (this.isHost) this._maybeStartCountdown();

    
    this.opts.onReady && this.opts.onReady();
    
  }

  

  _initThree() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(new THREE.Color(this.sky.fog));
    this.opts.canvasParent.appendChild(this.renderer.domElement);

    window.addEventListener('resize', () => this._onResize());

    this.scene = new THREE.Scene();
    
    
    
    
    this.scene.fog = new THREE.Fog(this.sky.fog, this.sky.fogNear, this.sky.fogFar);
    this.scene.background = buildSkybox(this.sky);
    
    
    
    this.skyBrawl = new SkyBrawl(this.scene);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, CAMERA_FAR);
    this.camera.rotation.order = 'YXZ';

    
    
    
    this.scene.add(buildLightRig(rigFromSky(this.sky)));
  }

  _onResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  

  _buildWorld(seed) {
    const world = generateWorld(seed, this.mapId);
    this.world = world;
    this.grid = world.grid;
    this.scene.add(buildWorldMeshes(world.grid));

    
    
    
    this.flagState = { red: 'home', blue: 'home' };  
    this.flagPos   = { red: { ...world.flags.red }, blue: { ...world.flags.blue } };
    this.flagMeshes = {};
    if (this.mode.flags === 'both') {
      this.flagMeshes.red  = this._buildFlagMesh(world.flags.red,  0xff5c4a);
      this.flagMeshes.blue = this._buildFlagMesh(world.flags.blue, 0x7cb0ff);
    } else if (this.mode.flags === 'neutral') {
      
      
      
      
      
      
      
      const c = neutralFlagHome(world.hillSpawn);
      this.flagPos = { red: { ...c }, blue: { ...c } };
      this.flagMeshes.red = this._buildFlagMesh(c, 0xf0e6d2);
      this.neutralFlag = true;
    }
    
    addBarnSigns(this.scene, world);

    
    
    
    import('./entities/mapProps.js')
      .then(({ scatterMapProps }) => scatterMapProps(this.scene, world))
      .catch((err) => console.warn('[mapProps] scatter failed:', err));

    
    
    
    import('./entities/propKit.js')
      .then(({ scatterPropKit }) => scatterPropKit(this.scene, world))
      .catch((err) => console.warn('[propKit] scatter failed:', err));

    
    
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
    
    
    
    
    group.position.set(pos.x + 0.5, pos.y, pos.z + 0.5);
    this.scene.add(group);
    return group;
  }

  

  async _initPlayer() {
    const spawn = this.world.spawns[this.team];
    this.physics = await createPhysicsWorld({ grid: this.grid });
    
    
    
    this.player = new Player(this.camera, this.physics, spawn, this.team, this.character,
                             { friction: frictionFor(this.mapId), grid: this.grid });
    this.weapons = new WeaponSystem(this.scene);
    this.tracers = new TracerSystem(this.scene);
    this.snow    = new SnowSystem(this.scene, this.player.pos, this.grid);
    this.gore    = new GoreSystem(this.scene);
    
    
    this.scene.add(this.camera);
    this.viewmodel = new FirstPersonWeapon(this.camera);
    this.hazards = new HazardSystem(this.scene, this.grid);
    
    this.chickenPickup = new ChickenPickup(this.scene, this.world.hillSpawn, {
      onPickup: (peerId) => {
        
        this._broadcast({ t: MSG.CHICKEN_PICK, by: peerId, respawnAt: Date.now() + 30000 });
        this._grantChicken(peerId);
      },
    });
    
    this.chickenAmmo = 0;
    
    
    
    this.steakPickups = new SteakPickups(this.scene, {});
    
    
    
    
    
    
    
    
    
    
    if (this._pendingSteakState) {
      const pending = this._pendingSteakState;
      this._pendingSteakState = null;
      this._applySteakState(pending);
    }
    this.steakScore = 0;                
    this.steakAmmo = 0;                 
    this._steakPoisonBy = new Map();    
    
    
    
    this.powerUpPickups = new PowerUpPickups(this.scene, this.world.powerUpSpawns, {
      onPickup: (id, peerId) => {
        this._broadcast({ t: MSG.POWERUP_PICK, id, by: peerId,
                          respawnAt: Date.now() + 30000 });
        this._grantPowerUp(id, peerId);
      },
    });
    this.powerUpState = emptyPowerUpState();
    
    
    this._peerScale = new Map();        
    if (this.isHost) {
      
      this._steakPoisonTimer = setInterval(() => this._steakPoisonTick(), 1000);
    }
    this._hazardRngHost = this.isHost ? new SeededRng((this.seed ^ 0x51a9a7d1) >>> 0) : null;
    this._nextHazardAt = performance.now() + 4000;   
  }

  _initInput() {
    this.input = new InputBus(window);

    
    this.isTouch = ('ontouchstart' in window)
      || (navigator.maxTouchPoints > 0)
      || window.matchMedia?.('(pointer: coarse)').matches;

    
    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement !== this.renderer.domElement) return;
      this.player.addMouseLook(e.movementX, e.movementY);
    });

    
    
    
    
    
    
    
    if (!this.isTouch) {
      this.rmbMoveCtl = attachRightClickMove(window, this.input, {
        enabled: () => this.rmbMove === true,
        isLocked: () => document.pointerLockElement === this.renderer.domElement,
      });
    }

    
    if (this.isTouch) {
      this.touch = new TouchControls(this.opts.canvasParent, this.input, {
        onLook: (dx, dy) => this.player.addMouseLook(dx, dy, 0.006),
        onFire: () => {},                       
        onJump: () => this.input.setSynthetic('jump', true),
        onWeapon: (i) => this._switchWeapon(i),
      });
    }

    
    
    for (const el of document.querySelectorAll('#weaponbar .wpn:not(.chicken)')) {
      const idx = Number(el.dataset.w);
      if (!Number.isFinite(idx)) continue;
      el.addEventListener('click', (e) => { e.preventDefault(); this._switchWeapon(idx); });
    }

    
    
    
    
    
    
    
    
    
    
    
    const isScoreboardKey = (e) =>
      (this.input.bindings.scoreboard || []).includes(e.code);
    const typing = () => {
      const t = document.activeElement?.tagName;
      return t === 'INPUT' || t === 'TEXTAREA';
    };
    window.addEventListener('keydown', (e) => {
      if (!isScoreboardKey(e) || typing()) return;
      e.preventDefault();
      if (!this._scoreboardOpen) this._paintScoreboard(true);
    });
    window.addEventListener('keyup', (e) => {
      if (!isScoreboardKey(e) || typing()) return;
      e.preventDefault();
      this._paintScoreboard(false);
    });
    
    
    
    
    const pill = document.getElementById('topbar');
    if (pill) {
      pill.style.pointerEvents = 'auto';
      pill.style.cursor = 'pointer';
      const toggle = (e) => { if (e) e.preventDefault();
        this._paintScoreboard(!this._scoreboardOpen); };
      pill.addEventListener('click', toggle);
      pill.addEventListener('touchstart', toggle, { passive: false });
    }
  }

  pointerLock() {
    
    if (this.isTouch) return;
    this.renderer.domElement.requestPointerLock?.().catch(() => {});
    this.renderer.domElement.addEventListener('click', () => {
      if (document.pointerLockElement !== this.renderer.domElement) {
        this.renderer.domElement.requestPointerLock?.().catch(() => {});
      }
    });
  }

  

  _wireNet() {
    this.mesh.addEventListener('message', (e) => this._onMessage(e.detail.from, e.detail.message));
    this.mesh.addEventListener('peer-left', (e) => {
      const rp = this.remotePlayers.get(e.detail.id);
      if (rp) { rp.destroy(this.scene); this.remotePlayers.delete(e.detail.id); }
      this.playerMeta.delete(e.detail.id);
      
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
    
    
    
    
    
    
    
    const steaks = this._steakStateMsg();
    if (steaks) this.mesh.send(peerId, steaks);
  }

  
  
  
  _steakStateMsg() {
    if (!this.steakPickups) return null;
    const now = performance.now();
    const statuses = {};
    for (const side of STEAK_SIDES) {
      const s = this.steakPickups.status.get(side);
      if (!s) continue;
      
      
      statuses[side] = {
        alive: !!s.alive,
        respawnAt: s.alive ? 0 : Date.now() + Math.max(0, s.respawnAt - now),
      };
    }
    return { t: MSG.STEAK_STATE, statuses };
  }

  
  _applySteakState(statuses) {
    if (!statuses) return;
    
    
    if (!this.steakPickups) { this._pendingSteakState = statuses; return; }
    for (const side of STEAK_SIDES) {
      const incoming = statuses[side];
      const local = this.steakPickups.status.get(side);
      if (!incoming || !local) continue;
      if (incoming.alive) { local.alive = true; local.respawnAt = 0; continue; }
      local.alive = false;
      
      
      
      local.respawnAt = (incoming.respawnAt || 0)
        ? (incoming.respawnAt - Date.now()) + performance.now()
        : performance.now();
    }
  }

  
  
  
  _rebalanceTeams() {
    if (!this.isHost) return;
    const peers = [...this.playerMeta.entries()];
    const assignments = {};
    for (const [pid, meta] of peers) assignments[pid] = meta.team;
    
    const count = () => {
      let r = 0, b = 0;
      for (const pid in assignments) {
        if (assignments[pid] === 'red') r++; else b++;
      }
      return { r, b };
    };
    
    
    const orderedIds = Object.keys(assignments).sort();
    let safety = 20;
    while (safety-- > 0) {
      const { r, b } = count();
      if (Math.abs(r - b) <= 1) break;
      const overflowTeam = r > b ? 'red' : 'blue';
      const underTeam    = r > b ? 'blue' : 'red';
      
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
    
    for (const pid in assignments) {
      const meta = this.playerMeta.get(pid);
      if (meta && meta.team !== assignments[pid]) {
        meta.team = assignments[pid];
        if (pid === this.myId) {
          this.team = assignments[pid];
          this.player.team = this.team;
          this.player.spawn = { ...this.world.spawns[this.team] };
        }
        
        
      }
    }
    this._broadcast({ t: MSG.TEAM_ASSIGN, assignments });
  }

  _maybeStartCountdown() {
    if (!this.isHost) return;
    if (this.matchState !== 'lobby') return;
    const nPlayers = this.playerMeta.size;
    if (nPlayers < LOBBY_MIN_PLAYERS) return;
    
    this._rebalanceTeams();
    
    const endsAt = Date.now() + LOBBY_COUNTDOWN_SECONDS * 1000;
    this.matchState = 'countdown';
    this._matchEndsAt = endsAt;
    this._broadcast({ t: MSG.MATCH_STATE, state: 'countdown', endsAt });
    
    this._updateLobbyBanner();
    
    setTimeout(() => {
      if (this.matchState === 'countdown') {
        this.matchState = 'playing';
        this._broadcast({ t: MSG.MATCH_STATE, state: 'playing' });
        this._updateLobbyBanner();
      }
    }, LOBBY_COUNTDOWN_SECONDS * 1000);
  }

  
  
  
  
  
  _dropCorn(pos) {
    if (!pos || !this.cornDrops) return;
    const ground = this.grid
      ? groundHeightAt(this.grid, pos.x, pos.z, pos.y)
      : pos.y;
    this.cornDrops.drop(pos, ground);
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  _localDeath(killer, victim, weapon, pos) {
    this._killFeedPush(killFeedLine({
      killerName: killer ? this._name(killer) : null,
      victimName: this._name(victim),
      weapon,
    }));
    this._announceKill(killer, victim, weapon);
    this._dropCorn(pos || this._posOf(victim));
  }

  
  _tickCornDrops(dt) {
    if (!this.cornDrops) return;
    this.cornDrops.update(dt);
    if (!this.player?.alive || this.matchState !== 'playing') return;
    if (this.player.hp >= 100) return;      
    const heal = this.cornDrops.collect(this.player.pos);
    if (heal > 0) {
      this.player.hp = Math.min(100, this.player.hp + heal);
      this._paintCornBar();
      this._showPowerGet('🌽  +' + heal + ' HP  🌽', 'Corn restored');
      try { SFX.chirp(); } catch (_) {}
    }
  }

  
  
  
  
  
  
  
  
  _announceKill(killer, victim, weapon) {
    if (!this._killAnnouncer) return;
    let keys = [];
    try {
      keys = this._killAnnouncer.registerKill({
        killer, victim, weapon, atMs: performance.now(),
      }) || [];
    } catch (_) { return; }
    for (const key of keys) {
      if (!shouldHear(key, { killer, victim, listener: this.myId })) continue;
      try { SFX.announce(key); } catch (_) {}
      this._showAnnounceBanner(key);
    }
  }

  
  
  _showAnnounceBanner(key) {
    const text = ANNOUNCE_TEXT[key] || key.replace(/_/g, ' ');
    const el = document.createElement('div');
    el.textContent = text;
    Object.assign(el.style, {
      position: 'fixed', left: '50%', top: '26%',
      transform: 'translate(-50%,-50%) scale(0.55)',
      color: '#ffe9a8', font: '900 min(9vw, 74px)/1 Georgia, serif',
      letterSpacing: '0.06em', whiteSpace: 'nowrap',
      textShadow: '0 0 26px #f4c95d, 0 4px 0 #5a3a05, 0 9px 24px rgba(0,0,0,.9)',
      pointerEvents: 'none', zIndex: '9998', opacity: '1',
      transition: 'transform .34s cubic-bezier(.2,1.7,.3,1), opacity .5s ease-out 1.2s',
    });
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.style.transform = 'translate(-50%,-50%) scale(1)';
    });
    setTimeout(() => { el.style.opacity = '0'; }, 1200);
    setTimeout(() => el.remove(), 1900);
  }

  
  
  
  
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

  
  _repaintAuras() {
    for (const [pid, rp] of this.remotePlayers.entries()) {
      const team = this.playerMeta.get(pid)?.team ?? this.bots.get(pid)?.team;
      rp.setTeams?.(team, this.team);
    }
  }

  
  
  
  
  
  
  
  
  
  
  _tickBotBanter(dt) {
    if (!this.isHost || !this.bots.size) return;
    if (this.matchState !== 'playing') return;
    const [lo, hi] = TAUNT_RULES.idleEverySeconds ?? [9, 18];
    if (this._banterAt == null) { this._banterAt = lo + Math.random() * (hi - lo); return; }
    this._banterAt -= dt;
    if (this._banterAt > 0) return;
    this._banterAt = lo + Math.random() * (hi - lo);
    if (Math.random() > (TAUNT_RULES.idleChance ?? 0.55)) return;
    
    
    const alive = [...this.bots.values()].filter((b) => b.alive !== false);
    if (!alive.length) return;
    const bot = alive[Math.floor(Math.random() * alive.length)];
    this._botTaunt(bot.peerId, 'idle');
  }

  _botTaunt(botId, event) {
    if (!this.isHost) return;
    const bot = this.bots.get(botId);
    if (!bot) return;
    const decision = considerTaunt({
      botId, event, state: this._taunts, now: performance.now() / 1000,
    });
    if (!decision) return;
    setTimeout(() => {
      
      if (!this.bots.has(botId)) return;
      const msg = { t: MSG.CHAT, from: botId, name: bot.name, team: bot.team,
                    text: decision.text, kind: 'taunt' };
      this._broadcast(msg);
      this.chat?.push(msg);
    }, decision.delay * 1000);
  }

  
  _occupancy() {
    const humans = 1 + [...this.playerMeta.entries()]
      .filter(([id, m]) => !m.bot && id !== this.myId).length;
    return { humans, bots: this.bots.size, total: humans + this.bots.size };
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  _displaceBotFor(joinerTeam) {
    if (!this.isHost) return null;
    
    
    if (this._occupancy().total <= MATCH_CAP) return null;
    
    
    const counts = { red: 0, blue: 0 };
    for (const m of this.playerMeta.values()) counts[m.team === 'red' ? 'red' : 'blue']++;
    
    
    const victimId = pickBotToDisplace([...this.bots.values()], joinerTeam, counts);
    const victim = victimId ? this.bots.get(victimId) : null;
    if (!victim) return null;
    this.removeBot(victim.peerId);
    this._killFeedPush(`${victim.name} stepped aside for a human`);
    return victim.peerId;
  }

  
  removeBot(botId) {
    if (!this.bots.has(botId)) return false;
    this.bots.delete(botId);
    this.playerMeta.delete(botId);
    const rp = this.remotePlayers.get(botId);
    if (rp) { rp.destroy(this.scene); this.remotePlayers.delete(botId); }
    
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
    
    
    
    
    
    
    
    
    const { humans, bots } = this._occupancy();
    if (!hasRoom(humans, bots) || bots >= MAX_BOTS) return null;
    
    let r = 0, b = 0;
    for (const meta of this.playerMeta.values()) {
      if (meta.team === 'red') r++; else b++;
    }
    const team = preferredTeam || (r <= b ? 'red' : 'blue');
    
    
    
    
    
    
    const taken = [...this.bots.values()]
      .filter((b) => b.team === team)
      .map((b) => b.spawnSlot);
    const bot = Bot.make({ team, world: this.world, seed: this.seed, taken });
    this.bots.set(bot.peerId, bot);
    
    this.playerMeta.set(bot.peerId, {
      name: bot.name, character: bot.character, team: bot.team, bot: true,
    });
    
    
    
    
    
    
    const helloMsg = {
      t: MSG.HELLO, name: bot.name, character: bot.character, team: bot.team,
      from: bot.peerId, p: [bot.pos.x, bot.pos.y, bot.pos.z], y: bot.yaw,
    };
    this._broadcast({ ...helloMsg });
    
    
    
    
    if (!this.remotePlayers.has(bot.peerId)) {
      const rp = new RemotePlayer(this.scene, bot.peerId,
        { name: bot.name, character: bot.character, team: bot.team, localTeam: this.team });
      rp.placeAt(bot.pos, bot.yaw);
      this.remotePlayers.set(bot.peerId, rp);
    }
    this._updateLobbyBanner();
    
    this._maybeStartCountdown();
    return bot;
  }

  _updateBots(dt) {
    
    const enemyPlayersByTeam = { red: [], blue: [] };
    for (const [pid, rp] of this.remotePlayers.entries()) {
      const meta = this.playerMeta.get(pid);
      if (!meta) continue;
      enemyPlayersByTeam[meta.team === 'red' ? 'blue' : 'red'].push({
        peerId: pid, pos: rp.group.position, team: meta.team,
      });
    }
    
    const meMeta = { team: this.team };
    enemyPlayersByTeam[meMeta.team === 'red' ? 'blue' : 'red'].push({
      peerId: this.myId, pos: this.player.pos, team: meMeta.team,
    });

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const bodies = this._allPlayerRefs()
      .filter((p) => p.alive !== false)
      .map((p) => ({
        peerId: p.peerId, x: p.pos.x, z: p.pos.z,
        size: this.bots.get(p.peerId)?.sizeScale
              ?? (p.peerId === this.myId ? (this.player?.sizeScale ?? 1)
                                         : (this._peerScale.get(p.peerId) ?? 1)),
      }));

    
    
    
    
    
    
    
    const pickups = this.powerUpPickups
      ? POWER_UP_IDS.map((id) => {
          const at = this.powerUpPickups.position(id);
          if (!at) return null;
          const def = POWER_UPS[id];
          return {
            id, x: at.x, z: at.z,
            available: this.powerUpPickups.isAvailable(id),
            sizeMul: def.visualScale, fireRateMul: def.fireRateMul,
          };
        }).filter(Boolean)
      : [];
    
    
    
    const matesByTeam = { red: [], blue: [] };
    for (const b of this.bots.values()) {
      matesByTeam[b.team].push({
        id: b.peerId, x: b.pos.x, z: b.pos.z, hp: b.hp,
        alive: b.alive !== false, hasEnemyFlag: b.hasEnemyFlag,
        powerUpId: b.powerUp?.id ?? null,
      });
    }
    const nowMs = Date.now();

    for (const bot of this.bots.values()) {
      const enemyColor = bot.team === 'red' ? 'blue' : 'red';
      const ctx = {
        grid: this.grid,
        
        
        
        
        
        
        
        mode: this.mode,
        world: this.world,
        flagPos: this.flagPos,
        flagState: this.flagState,
        enemyPlayers: enemyPlayersByTeam[bot.team],
        bodies,
        powerUps: pickups,
        allies: matesByTeam[bot.team],
        now: nowMs,
        onShoot: (bid, origin, dir) => {
          if (this.matchState !== 'playing') return;
          
          
          
          
          
          
          
          const def = WEAPON_DEFS[0];
          const shot = { kind: 'hitscan', origin: origin.toArray(), dir: dir.toArray(),
            damage: def.damage, weaponId: def.id, ownerId: bid };
          this._broadcast({ t: MSG.SHOT, s: shot });
          this._resolveShotAgainstAll(shot);
          
          
          
          
          
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
          this._captureMoment(scoringTeam, color, bot.name, false);
          this._maybeTriggerAnagram();
        },
      };
      bot.update(dt, ctx);

      
      
      const rp = this.remotePlayers.get(bot.peerId);
      if (rp) {
        rp.setNet([bot.pos.x, bot.pos.y, bot.pos.z], bot.yaw, bot.pitch, bot.hp);
        
        
        
        
        
        rp.placeAt(bot.pos, bot.yaw);
        
        
        
        
        
        
        
        if ((this._peerScale.get(bot.peerId) ?? 1) !== bot.sizeScale) {
          this._peerScale.set(bot.peerId, bot.sizeScale);
          rp.setBodyScale(bot.sizeScale);
        }
      }

      
      if (!bot._netAccum) bot._netAccum = 0;
      bot._netAccum += dt;
      if (bot._netAccum >= 1 / 20) {
        bot._netAccum = 0;
        this._broadcast({ ...bot.statePacket(), from: bot.peerId });
      }
    }
  }

  
  
  _resolveShotAgainstAll(s) {
    const origin = new THREE.Vector3().fromArray(s.origin);
    const dir    = new THREE.Vector3().fromArray(s.dir);
    let best = null, bestT = Infinity;
    
    for (const [pid, rp] of this.remotePlayers.entries()) {
      if (pid === s.ownerId) continue;
      const target = rp.group.position.clone().add(new THREE.Vector3(0, 1, 0));
      const t = target.clone().sub(origin).dot(dir);
      if (t < 0.5 || t > 60) continue;
      const closest = origin.clone().addScaledVector(dir, t);
      if (target.distanceTo(closest) < 0.7 && t < bestT) { bestT = t; best = { kind: 'remote', pid }; }
    }
    
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
      
      const bot = this.bots.get(best.pid);
      if (bot) {
        const died = bot.takeDamage(s.damage);
        if (died) {
          this._broadcast({ t: MSG.DEATH, victim: bot.peerId, killer: s.ownerId, weapon: s.weaponId });
          
          
          this._tallyKill(s.ownerId, bot.peerId);
          this._localDeath(s.ownerId, bot.peerId, s.weaponId, bot.pos.clone());
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
        
        this._broadcast({ t: MSG.HIT, target: best.pid, dmg: s.damage, by: s.ownerId, weapon: s.weaponId });
      }
    }
  }

  
  _flashHit(byId) {
    const flash = document.getElementById('hit-flash');
    const dirEl = document.getElementById('hit-direction');
    if (!flash || !dirEl) return;
    flash.classList.add('visible');
    setTimeout(() => flash.classList.remove('visible'), 40);

    
    let attackerPos = null;
    if (byId === this.myId) attackerPos = null;   
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

  
  
  
  
  
  
  
  
  
  
  _flashHitmarker(dmg = 0, killed = false, headshot = false) {
    const el = document.getElementById('hitmarker');
    if (el) {
      el.classList.remove('visible');
      
      
      
      el.style.color = killed ? '#ff3a2a' : (headshot ? '#f4c95d' : '#ffffff');
      el.style.transform = 'translate(-50%,-50%) scale(1.9)';
      
      void el.offsetWidth;
      el.classList.add('visible');
      el.style.transform = 'translate(-50%,-50%) scale(1)';
      clearTimeout(this._hitmarkerT);
      this._hitmarkerT = setTimeout(() => el.classList.remove('visible'), killed ? 420 : 220);
    }
    if (dmg > 0) this._floatDamage(dmg, killed, headshot);
  }

  
  _floatDamage(dmg, killed, headshot = false) {
    const n = document.createElement('div');
    n.textContent = killed ? 'KILL'
                  : (headshot ? Math.round(dmg) + '  HEADSHOT' : String(Math.round(dmg)));
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
      
      if (this._chickenCdTimer) { clearInterval(this._chickenCdTimer); this._chickenCdTimer = null; }
      
      
      this._refreshViewmodel();
      
      this._showPowerGet('☢  SLINGSHOT READY  ☢', 'Any weapon — your next shot fires the chicken');
      try { SFX.chirp(); SFX.boom(0.4); } catch (_) {}
    }
  }

  
  
  
  _startChickenCooldownChip() {
    const slot = document.querySelector('.wpn.chicken');
    if (!slot || !this.chickenPickup) return;
    slot.style.display = '';
    slot.classList.add('cooldown');
    const paint = () => {
      const now = performance.now();
      const secsLeft = Math.max(0, Math.ceil((this.chickenPickup._nextSpawnAt - now) / 1000));
      if (secsLeft <= 0) {
        
        
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

  

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  _captureMoment(scoringTeam, capturedColor, capturerName, isMe) {
    this._showCaptureFanfare({
      scoringTeam, capturerName, isMe,
      capturedColor: this.mode.flags === 'neutral' ? 'neutral' : capturedColor,
    });
  }

  _showCaptureFanfare({ scoringTeam, capturedColor, capturerName, isMe }) {
    const f = captureFanfare({
      scoringTeam, myTeam: this.team, capturedColor, capturerName, isMe,
      scores: this.scores, winScore: this.mode.winScore,
    });
    try { SFX.announce(f.phrase); } catch (_) {}
    
    
    if (f.tone === 'scored') { try { SFX.boom(0.55); } catch (_) {} }

    document.getElementById('capture-fanfare')?.remove();
    const root = document.createElement('div');
    root.id = 'capture-fanfare';
    root.className = `cf-${f.tone}`;
    root.innerHTML = `
      <div class="cf-sweep"></div>
      <div class="cf-body">
        <div class="cf-title">${f.tone === 'scored' ? '🚩' : '🚨'} ${escapeHtml(f.title)}</div>
        <div class="cf-score">
          <span class="cf-red">${this.scores.red}</span>
          <span class="cf-dash">—</span>
          <span class="cf-blue">${this.scores.blue}</span>
        </div>
        <div class="cf-sub">${escapeHtml(f.subtitle)}</div>
        ${f.matchPointLine ? `<div class="cf-mp">${escapeHtml(f.matchPointLine)}</div>` : ''}
      </div>`;
    document.body.appendChild(root);
    this._injectMatchMomentStyles();
    setTimeout(() => root.remove(), 2600);
  }

  
  
  
  
  
  
  
  _showRoundResult(anagramComing) {
    if (this._roundResultShown) return;
    this._roundResultShown = true;
    this.matchState = 'ended';
    
    
    
    
    
    this._recordCareerMatch();
    const r = resultCopy({ scores: this.scores, myTeam: this.team,
                           anagramDue: !!anagramComing });
    try { SFX.announce(r.outcome === 'win' ? 'CAPTURE' : 'CONCEDED'); } catch (_) {}
    document.getElementById('round-result')?.remove();
    const root = document.createElement('div');
    root.id = 'round-result';
    root.className = `rr-${r.outcome}`;
    root.innerHTML = `
      <div class="rr-body">
        <div class="rr-title" style="color:${r.accent}">${r.title}</div>
        <div class="rr-score">
          <span class="rr-team rr-red ${r.winner === 'red' ? 'won' : ''}">RED <b>${r.red}</b></span>
          <span class="rr-dash">—</span>
          <span class="rr-team rr-blue ${r.winner === 'blue' ? 'won' : ''}"><b>${r.blue}</b> BLUE</span>
        </div>
        <div class="rr-sub">${escapeHtml(r.sub)}</div>
        <div class="rr-hint">hold TAB for the scoreboard</div>
      </div>`;
    document.body.appendChild(root);
    this._injectMatchMomentStyles();
  }

  _hideRoundResult() { document.getElementById('round-result')?.remove(); }

  

  _recordCareerMatch() {
    try {
      const rows = scoreboardRows({
        players: this._scoreboardPlayers(), tally: this._tally, myId: this.myId,
      });
      const players = [...rows.red, ...rows.blue].map((r) => ({
        name: r.name, team: r.team, kills: r.kills, deaths: r.deaths, bot: r.bot,
      }));
      const winner = this.scores.red === this.scores.blue ? null
                   : (this.scores.red > this.scores.blue ? 'red' : 'blue');
      const next = recordMatch(loadCareer(localStorage), {
        players, winner, endedAt: Date.now(),
      });
      saveCareer(localStorage, next);
      
      
      
      
      try { publishScores(leaderboard(next, { limit: 50 })); } catch (_) {}
    } catch (_) {
      
    }
  }

  
  
  
  async _paintCareerBoard(host) {
    if (!host) return;
    const career = loadCareer(localStorage);
    
    
    
    
    const global = isGlobalEnabled();
    let rows = leaderboard(career, { limit: 10 });
    let scope = 'local';
    
    
    
    const myName = String(this._name?.(this.myId) ?? '').toLowerCase();
    const render = () => {
    const body = () => rows.map((r, i) => `
      <tr class="${r.name.toLowerCase() === myName ? 'me' : ''}">
        <td class="cb-rank">${i + 1}</td>
        <td class="cb-name">${escapeHtml(r.name)}</td>
        <td class="cb-num">${r.kills}</td>
        <td class="cb-num">${r.deaths}</td>
        <td class="cb-num">${r.wins}</td>
        <td class="cb-num">${(r.kills / Math.max(1, r.deaths)).toFixed(2)}</td>
      </tr>`).join('');
    host.innerHTML = `
      <div class="cb-head">
        <span class="cb-title">ALL-TIME${scope === 'global' ? ' · GLOBAL' : ''}</span>
        <span class="cb-matches">${career.matches} match${career.matches === 1 ? '' : 'es'} played</span>
      </div>
      <div class="cb-scroll">
        <table>
          <tr class="cb-labels"><th>#</th><th>PLAYER</th><th>K</th><th>D</th><th>W</th><th>K/D</th></tr>
          ${body() || '<tr><td class="cb-empty" colspan="6">no finished matches yet</td></tr>'}
        </table>
      </div>
      <p class="cb-note">${scope === 'global'
        ? 'Everyone who has played, worldwide.'
        : (global
            ? 'Showing this device while the global board loads.'
            : 'Recorded on this device. The global board is not switched on yet — '
              + 'see deploy/SETUP-LEADERBOARD.md.')}</p>`;
    };
    render();
    if (!global) return;
    
    
    
    try {
      const top = await fetchTopPlayers(10);
      if (top.length && document.body.contains(host)) {
        rows = top; scope = 'global'; render();
      }
    } catch (_) {  }
  }

  _injectMatchMomentStyles() {
    if (document.getElementById('match-moment-styles')) return;
    const s = document.createElement('style');
    s.id = 'match-moment-styles';
    
    
    
    
    
    
    s.textContent = `
      #capture-fanfare { position: fixed; inset: 0; z-index: 9997;
        pointer-events: none; display: flex; align-items: center;
        justify-content: center; font-family: system-ui, sans-serif; }
      #capture-fanfare .cf-sweep { position: absolute; left: 0; right: 0;
        top: 34%; height: 32%; animation: cfSweep 2.6s ease-out forwards; }
      #capture-fanfare.cf-scored .cf-sweep {
        background: linear-gradient(90deg, rgba(0,0,0,0) 0%,
          rgba(255,205,90,0.34) 25%, rgba(255,235,150,0.42) 50%,
          rgba(255,205,90,0.34) 75%, rgba(0,0,0,0) 100%); }
      #capture-fanfare.cf-conceded .cf-sweep {
        background: linear-gradient(90deg, rgba(0,0,0,0) 0%,
          rgba(190,40,25,0.36) 25%, rgba(255,70,50,0.44) 50%,
          rgba(190,40,25,0.36) 75%, rgba(0,0,0,0) 100%); }
      #capture-fanfare .cf-body { position: relative; text-align: center;
        animation: cfBody 2.6s cubic-bezier(.2,1.5,.3,1) forwards; }
      #capture-fanfare .cf-title { font: 900 min(8.5vw,60px)/1 system-ui, sans-serif;
        letter-spacing: 0.05em; }
      #capture-fanfare.cf-scored .cf-title { color: #fff3bc;
        text-shadow: 0 0 26px #f4c95d, 0 3px 0 #7a4a10, 0 8px 26px rgba(0,0,0,.9); }
      #capture-fanfare.cf-conceded .cf-title { color: #ffd0c6;
        text-shadow: 0 0 26px #ff3a1a, 0 3px 0 #5a0d05, 0 8px 26px rgba(0,0,0,.9); }
      #capture-fanfare .cf-score { margin-top: 6px;
        font: 900 min(6vw,38px)/1 system-ui, sans-serif; letter-spacing: 0.08em;
        text-shadow: 0 3px 10px rgba(0,0,0,.95); }
      #capture-fanfare .cf-red { color: #ff8a7a; }
      #capture-fanfare .cf-blue { color: #9cc4ff; }
      #capture-fanfare .cf-dash { color: #e8f3ff; margin: 0 10px; }
      #capture-fanfare .cf-sub { margin-top: 8px; color: #fff;
        font: 800 min(3.4vw,17px)/1.3 system-ui, sans-serif; letter-spacing: 0.1em;
        text-shadow: 0 2px 6px #000; }
      #capture-fanfare .cf-mp { margin-top: 8px; display: inline-block;
        padding: 4px 12px; border-radius: 999px; background: rgba(0,0,0,0.6);
        border: 2px solid #f4c95d; color: #ffe9a8;
        font: 900 min(3.2vw,15px)/1 system-ui, sans-serif; letter-spacing: 0.12em; }
      @keyframes cfSweep { 0% { opacity: 0; transform: scaleX(0.2) }
                           18% { opacity: 1; transform: scaleX(1) }
                           70% { opacity: 1 } 100% { opacity: 0 } }
      @keyframes cfBody  { 0% { transform: scale(0.55); opacity: 0 }
                           14% { transform: scale(1.1); opacity: 1 }
                           22% { transform: scale(1); opacity: 1 }
                           82% { transform: scale(1); opacity: 1 }
                           100% { transform: scale(1.04); opacity: 0 } }

      #round-result { position: fixed; inset: 0; z-index: 9996;
        pointer-events: none; display: flex; align-items: center;
        justify-content: center; font-family: system-ui, sans-serif;
        background: radial-gradient(circle at center,
          rgba(6,10,16,0.72) 0%, rgba(6,10,16,0.94) 75%);
        animation: rrFade 0.5s ease-out forwards; }
      #round-result .rr-body { text-align: center; padding: 0 16px;
        animation: rrBody 0.75s cubic-bezier(.2,1.5,.3,1) forwards; }
      #round-result .rr-title { font: 900 min(14vw,110px)/1 Georgia, serif;
        letter-spacing: 0.05em;
        text-shadow: 0 0 40px rgba(0,0,0,0.9), 0 6px 0 rgba(0,0,0,0.55); }
      #round-result .rr-score { margin-top: 14px; color: #7d8da0;
        font: 900 min(7vw,44px)/1 system-ui, sans-serif; letter-spacing: 0.06em; }
      #round-result .rr-team { opacity: 0.55; }
      #round-result .rr-team.won { opacity: 1; }
      #round-result .rr-red  { color: #ff8a7a; }
      #round-result .rr-blue { color: #9cc4ff; }
      #round-result .rr-dash { color: #55627a; margin: 0 14px; }
      #round-result .rr-sub { margin-top: 16px; color: #e8f3ff;
        font: 800 min(3.8vw,19px)/1.4 system-ui, sans-serif; letter-spacing: 0.1em; }
      #round-result .rr-hint { margin-top: 10px; color: #6f7d90;
        font: 700 12px system-ui, sans-serif; letter-spacing: 0.14em; }
      @keyframes rrFade { 0% { opacity: 0 } 100% { opacity: 1 } }
      @keyframes rrBody { 0% { transform: scale(0.7); opacity: 0 }
                          70% { transform: scale(1.04); opacity: 1 }
                          100% { transform: scale(1); opacity: 1 } }
    `;
    document.head.appendChild(s);
  }

  
  
  
  
  
  
  _paintHayHide() {
    if (!this.player || !this.grid) return;
    const inside = isInsideHay(this.grid, this.player.pos.x, this.player.pos.y, this.player.pos.z);
    if (inside === this._insideHay) return;
    this._insideHay = inside;
    document.getElementById('hayPeekLeft')?.classList.toggle('visible', inside);
    document.getElementById('hayPeekRight')?.classList.toggle('visible', inside);
    document.getElementById('hiding-label')?.classList.toggle('visible', inside);
    
    const worldMesh = this.scene.getObjectByName('voxelWorld');
    const hayMat = worldMesh?.userData?.materialsByType?.[_VOX.HAY];
    if (hayMat) hayMat.opacity = hayOpacityFor(inside);
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  _paintCompass() {
    if (!this.player) return;
    const markers = objectiveMarkers(this.mode, {
      flagPos: this.flagPos, hillSpawn: this.world?.hillSpawn,
    });
    
    
    
    const strip = document.getElementById('compass');
    if (strip) strip.style.display = markers.length ? '' : 'none';
    const shown = new Set(markers.map((m) => m.id));
    for (const id of OBJECTIVE_IDS) {
      const pill = document.getElementById(COMPASS_PILL[id]);
      if (pill) pill.style.display = shown.has(id) ? '' : 'none';
    }
    const yaw = this.player.yaw;
    for (const m of markers) {
      const el = document.getElementById(COMPASS_ARROW[m.id]);
      const distEl = document.getElementById(COMPASS_DIST[m.id]);
      if (!el || !distEl) continue;
      const dx = m.pos.x + 0.5 - this.player.pos.x;
      const dz = m.pos.z + 0.5 - this.player.pos.z;
      
      
      const bearing = Math.atan2(dx, dz);
      const rel = bearing - yaw;
      
      let deg = (rel * 180 / Math.PI + 540) % 360 - 180;
      el.style.transform = `rotate(${deg}deg)`;
      distEl.textContent = Math.round(Math.hypot(dx, dz)) + 'm';
      const emojiEl = document.getElementById(COMPASS_EMOJI[m.id]);
      if (emojiEl) emojiEl.textContent = m.emoji;
    }
  }

  
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

  
  
  _paintCornBar() {
    const fill = document.getElementById('health-fill');
    if (!fill || !this.player) return;
    const hp = Math.max(0, this.player.hp);
    const remaining = Math.max(0, Math.ceil(hp / 2));   
    const kernels = fill.querySelectorAll('.kernel');
    for (let i = 0; i < kernels.length; i++) {
      kernels[i].classList.toggle('gone', i >= remaining);
    }
    
    
    
    
    
    document.getElementById('health-bar')
      ?.classList.toggle('critical', hp > 0 && hp < LOW_HP);
  }

  
  
  _spawnCornFly(n) {
    const fill = document.getElementById('health-fill');
    if (!fill || !this.player) return;
    const hpBefore = Math.max(0, Math.ceil((this.player.hp + n * 2) / 2));
    const kernels = fill.querySelectorAll('.kernel');
    
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

  
  _applyMature(on) {
    
    const oldMesh = this.scene.getObjectByName('voxelWorld');
    if (oldMesh) this.scene.remove(oldMesh);
    this.scene.add(buildWorldMeshes(this.grid, { mature: on }));
    
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
        
        if (!this.remotePlayers.has(from)) {
          const rp = new RemotePlayer(this.scene, from,
            { name: msg.name, character: msg.character, team: msg.team, localTeam: this.team });
          
          
          
          
          if (msg.p) rp.placeAt(msg.p, msg.y);
          this.remotePlayers.set(from, rp);
        }
        
        
        if (this.isHost) {
          this._sendWelcome(from);
          
          
          
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
        
        if (this.chickenPickup) {
          this.chickenPickup.available = false;
          this.chickenPickup.mesh.visible = false;
          this.chickenPickup._nextSpawnAt = msg.respawnAt - Date.now() + performance.now();
        }
        this._grantChicken(msg.by);
        break;

      case MSG.CHICKEN_SHOT:
        
        
        this._spawnChickenProjectile(msg);
        break;

      case MSG.STATE: {
        const rp = this.remotePlayers.get(from);
        if (rp) rp.setNet(msg.p, msg.y, msg.x, msg.h);
        
        const sc = Number.isFinite(msg.sc) && msg.sc > 0 ? msg.sc : 1;
        this._peerScale.set(from, sc);
        if (rp) rp.setBodyScale(sc);
        
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
        
        
        this._applyRemoteShot(msg.s);
        break;
      }
      case MSG.HIT: {
        if (msg.target === this.myId) this._takeDamage(msg.dmg, msg.by, msg.weapon);
        break;
      }
      case MSG.DEATH:
        
        
        
        this._creditKill(msg.killer, msg.victim);
        
        
        this._steakPoisonBy.delete(msg.victim);
        if (msg.victim === this.myId) this._hidePoisonHint();
        
        try {
          const meta = this.playerMeta.get(msg.victim);
          const bot = this.bots.get(msg.victim);
          const character = meta?.character
            || bot?.character
            || (msg.victim === this.myId ? this.character : 'cow');
          SFX.animalVoice(character, 1.0);
        } catch (_) {}
        
        
        this.critters?.cheer(this._posOf(msg.victim),
          msg.weapon === 'chicken' ? 'chicken' : 'kill');
        
        
        
        this._localDeath(msg.killer, msg.victim, msg.weapon);
        
        
        
        
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
        
        
        this.chat?.push({ name: msg.name || this._name(msg.from), text: msg.text,
                          team: msg.team, kind: msg.kind === 'taunt' ? 'taunt' : 'say' });
        break;
      case MSG.BOT_LEAVE: {
        
        
        const rp = this.remotePlayers.get(msg.id);
        if (rp) { rp.destroy(this.scene); this.remotePlayers.delete(msg.id); }
        this.playerMeta.delete(msg.id);
        this._updateLobbyBanner();
        break;
      }
      case MSG.FLAG_RETURN:
        
        
        
        this._returnFlag(msg.color);
        break;
      case MSG.STEAK_BREAK:
        this._steakBreakRemote(msg.at, msg.by);
        break;
      case MSG.STEAK_STATE:
        
        
        
        this._applySteakState(msg.statuses);
        break;
      case MSG.POWERUP_PICK:
        
        
        
        
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
        
        
        
        this._tallyKill(msg.killer, msg.victim);
        this._announceSteakAnnihilation(msg.victim, msg.killer);
        break;
      case MSG.FLAG_CAP: {
        
        const scoringTeam = msg.color === 'red' ? 'blue' : 'red';
        this.scores[scoringTeam]++;
        this._returnFlag(msg.color);
        this._updateScoreUi();
        this._killFeedPush(`${this._name(msg.by)} captured the ${msg.color} flag!`);
        
        
        this.critters?.cheer(this.world.flags[scoringTeam], 'capture');
        this._captureMoment(scoringTeam, msg.color, this._name(msg.by), false);
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
      case MSG.MATCH_RESTART:
        
        
        
        
        
        
        this._applyRestart(msg.scores);
        break;
    }
  }

  
  
  
  _name(peerId) {
    if (!peerId) return 'someone';
    return this.playerMeta.get(peerId)?.name || String(peerId).slice(0, 6);
  }

  

  
  
  
  
  
  
  _frame(dt, { render = true } = {}) {
    if (!this.gameOver) {
      try { this._tick(dt); }
      catch (err) {
        
        
        console.error('[tick error]', err);
        
        
        
        
        
        
        this._tickError = String(err.message || err);
        this._installDebugSnapshot();
      }
    }
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    try {
      this.skyBrawl?.update(dt, this.camera.position);
      this.critters?.update(dt, this.camera.position);
      if (!this.gameOver) this._tickHill(dt);
      
      
      
      if (render && !this._contextLost) this.renderer.render(this.scene, this.camera);
    } catch (err) {
      
      const key = String(err?.message || err);
      if (key !== this._lastFrameErr) {
        this._lastFrameErr = key;
        console.error('[frame error]', err);
      }
    }
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  _installDebugSnapshot() {
    if (this._debugSnapshotInstalled) return;
    this._debugSnapshotInstalled = true;
    if (typeof window === 'undefined') return;
    const g = this;
    const xyz = (v) => (v ? `${v.x.toFixed(1)},${v.y.toFixed(1)},${v.z.toFixed(1)}` : '?');
    
    
    const snapshot = {};
    Object.defineProperties(snapshot, {
      match:     { enumerable: true, get: () => g.matchState },
      alive:     { enumerable: true, get: () => g.player?.alive },
      ticks:     { enumerable: true, get: () => g._tickCount ?? 0 },
      grounded:  { enumerable: true, get: () => g.player?._grounded },
      jumps:     { enumerable: true, get: () => g.player?.jumpCount ?? 0 },
      pos:       { enumerable: true, get: () => xyz(g.player?.pos) },
      vel:       { enumerable: true, get: () => xyz(g.player?.vel) },
      tickError: { enumerable: true, get: () => g._tickError ?? null },
    });
    window.__tbDebug = snapshot;
  }

  _tick(dt) {
    
    
    
    
    if (!this.input) return;
    this._tickCount = (this._tickCount || 0) + 1;
    this._installDebugSnapshot();
    
    
    
    
    
    this.rmbMoveCtl?.poll();
    
    
    if (this.matchState !== 'playing' && this.matchState !== 'ended') {
      this._updateLobbyBanner();
      
      if (this.player?.alive && this.physics) this.player.update(dt, this.input);
      if (this.physics) this.physics.step(dt);
      this.weapons?.update(dt);
      this.viewmodel?.update(dt);
      for (const rp of this.remotePlayers.values()) rp.update(dt);
      
      
      
      
      
      this.critters?.update(dt, this.camera.position);
      
      if (this.input.wasPressed('weapon1')) this._switchWeapon(0);
      if (this.input.wasPressed('weapon2')) this._switchWeapon(1);
      if (this.input.wasPressed('weapon3')) this._switchWeapon(2);
      
      
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
      
      
      
      this.input.endFrame();
      return;
    }
    if (this._anagram && this._anagram.spectator) {
      
      this.input.endFrame();
      return;
    }

    
    if (this.input.wasPressed('weapon1')) this._switchWeapon(0);
    if (this.input.wasPressed('weapon2')) this._switchWeapon(1);
    if (this.input.wasPressed('weapon3')) this._switchWeapon(2);
    if (this.chickenAmmo > 0 && this.input.wasPressed('weapon4' )) this._switchWeapon(3);

    
    
    
    
    const canFire = this.isTouch
      || document.pointerLockElement === this.renderer.domElement;
    if (this.input.isDown('fire') && canFire) {
      this._tryFire();
    }

    
    this.tracers.update(dt, performance.now() / 1000);
    this.viewmodel?.update(dt);
    this.snow?.update(dt);
    this.gore?.update(dt);
    
    
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

    
    
    
    if (this.player?.alive && this.aimAssist !== false) {
      const enemyTeam = this.team === 'red' ? 'blue' : 'red';
      const targets = this._allPlayerRefs()
        .filter((p) => p.peerId !== this.myId && p.team === enemyTeam && p.alive !== false)
        
        
        
        
        
        
        
        
        
        
        
        .map((p) => {
          const sc = this._peerScale.get(p.peerId) ?? 1;
          return { x: p.pos.x, y: p.pos.y + aimPointY(sc), z: p.pos.z };
        });
      const nudge = computeAimAssist({
        eye: this.camera.position, yaw: this.player.yaw, pitch: this.player.pitch,
        targets, dt, enabled: true,
      });
      this.player.yaw += nudge.yaw;
      this.player.pitch += nudge.pitch;
    }

    
    if (this.player?.alive && this.physics) this.player.update(dt, this.input);
    if (this.physics) this.physics.step(dt);
    this.weapons?.update(dt);
    
    
    
    this._resolveOwnProjectiles();
    this._tickCornDrops(dt);

    
    for (const rp of this.remotePlayers.values()) rp.update(dt);

    
    if (this.isHost && this.bots.size) this._updateBots(dt);

    
    
    
    
    this._tickBotBanter(dt);

    
    const nowMs = performance.now();
    this.hazards.update(dt, nowMs);
    if (this.isHost && nowMs >= this._nextHazardAt) {
      const items = makeHostSchedule(WORLD_SIZE, this._hazardRngHost, nowMs);
      for (const item of items) this.hazards.spawn(item);
      this._broadcast({ t: MSG.HAZARD_SPAWN, items });
      SFX.whoosh();
      
      this._nextHazardAt = nowMs + this._hazardRngHost.rangeI(3000, 6000);
    }
    
    
    if (this.player.alive) {
      const hits = this.hazards.consumeHitsFor(this.player.pos);
      for (const dmg of hits) {
        this._takeDamage(dmg, this.myId, 'hazard');
        SFX.boom(1.0);
      }
      
      
      if (!hits.length) {
        for (const h of (this.hazards._explosions || [])) {
          if (h.shard) continue;
          const age = performance.now() / 1000 - h.bornAt;
          if (age > 0.05) continue;   
          const d = this.player.pos.distanceTo(h.mesh.position);
          if (d < 12) SFX.boom(Math.max(0.15, 1 - d / 12));
        }
      }
    }

    
    this._updateFlags();

    
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
    
    
    
    
    if (this.steakAmmo > 0) { this._updateSteakChip(); this._refreshViewmodel(); return; }
    this.weapons.selectSlot(i);
    
    
    
    
    this._refreshViewmodel();
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  _refreshViewmodel() {
    const held = activeViewmodel({
      chickenAmmo: this.chickenAmmo,
      steakAmmo: this.steakAmmo,
      weaponId: this.weapons.currentDef().id,
    });
    this.viewmodel?.setWeapon(held);
    
    
    
    
    
    
    
    this._paintWeaponBar(held);
  }

  
  
  
  
  
  
  
  
  _paintWeaponBar(held) {
    const slots = document.querySelectorAll('#weaponbar .wpn');
    if (!slots.length) return;
    const pickup = isPickupViewmodel(held);
    slots.forEach((el, idx) => {
      
      
      
      
      el.classList.toggle('active', el.classList.contains('chicken')
        ? pickup
        : (!pickup && idx === this.weapons.slot));
    });
  }

  _tryFire() {
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    const origin = this.camera.position.clone();
    
    
    
    
    if (this.steakAmmo > 0 && this.chickenAmmo === 0) {
      this.steakAmmo--;
      
      
      
      if (this.steakAmmo <= 0) this.steakScore = 0;
      const msg = { t: MSG.STEAK_THROW, origin: origin.toArray(), dir: dir.toArray(), by: this.myId };
      this._broadcast(msg);
      this._spawnSteakProjectile(msg);
      if (this.isHost) this._resolveSteakThrow(msg);
      SFX.pew();
      this._updateSteakChip();
      
      
      
      this._refreshViewmodel();
      this.viewmodel?.kick();
      return;
    }
    
    
    
    
    if (this.chickenAmmo > 0) {
      this.chickenAmmo = 0;
      const msg = { t: MSG.CHICKEN_SHOT, origin: origin.toArray(), dir: dir.toArray(), by: this.myId };
      this._broadcast(msg);
      this._spawnChickenProjectile(msg);
      if (this.isHost) this._resolveChickenShot(msg);
      SFX.snorkel();
      this._startChickenCooldownChip();
      
      
      this._refreshViewmodel();
      this.viewmodel?.kick();
      return;
    }
    const shots = this.weapons.tryFire(origin, dir, this.rngShots, this.myId);
    if (shots.length > 0) {
      SFX.pew();
      this.viewmodel?.kick();
      
      
      if (this.mature) SFX.fart(1.6);
    }
    for (const s of shots) {
      this._broadcast({ t: MSG.SHOT, s });
      this._applyLocalShot(s);
      
      if (s.kind === 'hitscan') {
        this._addTracerForShot(s);
        this.weapons.spawnMuzzleFx(s);
      }
    }
  }

  
  
  
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
      maxAge: flightDist / SPEED,   
    };
    this.weapons.spawnProjectileMesh(shot);
    
    setTimeout(() => this._spawnChickenExplosion(landing), (flightDist / SPEED) * 1000);
  }

  
  
  
  _chickenLandingPoint(origin, dir) {
    for (let t = 0.5; t < 40; t += 0.35) {
      const p = origin.clone().addScaledVector(dir, t);
      if (this.grid.isSolid(p.x, p.y, p.z)) return p;
    }
    return origin.clone().addScaledVector(dir, 40);
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
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
      
      const cf = Math.min(1, age / 0.16);
      core.scale.setScalar(0.6 + cf * 4.2);
      core.material.opacity = Math.max(0, 1 - age / 0.22);
      
      const bf = 1 - Math.pow(1 - f, 2.2);
      ball.scale.setScalar(0.9 + bf * 9.5);
      ball.material.opacity = 0.95 * Math.pow(1 - f, 1.5);
      ball.material.color.setRGB(1, 0.64 - 0.42 * f, 0.16 - 0.14 * f);
      
      const rf = 1 - Math.pow(1 - f, 3);
      ring.scale.setScalar(1 + rf * 20);
      ring.material.opacity = 0.9 * Math.pow(1 - f, 2);
      
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

  
  
  
  _resolveChickenShot(msg) {
    if (!this.isHost) return;
    const origin = new THREE.Vector3().fromArray(msg.origin);
    const dir = new THREE.Vector3().fromArray(msg.dir);
    const landing = this._chickenLandingPoint(origin, dir);
    
    let victim = null, best = 4.0;
    for (const p of this._allPlayerRefs()) {
      if (p.peerId === msg.by) continue;   
      const d = p.pos.distanceTo(landing);
      if (d < best) { best = d; victim = p; }
    }
    if (victim) {
      const bot = this.bots.get(victim.peerId);
      if (bot) {
        bot.takeDamage(100);
        this._broadcast({ t: MSG.DEATH, victim: victim.peerId, killer: msg.by, weapon: 'chicken' });
        this._tallyKill(msg.by, victim.peerId);
        this._localDeath(msg.by, victim.peerId, 'chicken', bot.pos.clone());
        setTimeout(() => bot.respawn(), 500);
      } else if (victim.peerId === this.myId) {
        this._takeDamage(100, msg.by, 'chicken');
      } else {
        this._broadcast({ t: MSG.HIT, target: victim.peerId, dmg: 100, by: msg.by, weapon: 'chicken' });
      }
      
      
      
      
      
      
    }
  }

  
  

  
  
  
  _steakBreakRemote(side, byId) {
    void byId;
    this.steakPickups?.markBroken(side);
  }

  
  
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

  
  
  _applySteakAttach(victimId, byId) {
    this._steakPoisonBy.set(victimId, byId);
    if (victimId === this.myId) {
      this._showPoisonHint();
    }
  }

  
  
  
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
          
          
          
          
          
          this._broadcast({ t: MSG.DEATH, victim: victimId, killer: byId, weapon: 'steak' });
          this._broadcast({ t: MSG.STEAK_DEATH, victim: victimId, killer: byId });
          this._tallyKill(byId, victimId);
          this._localDeath(byId, victimId, 'steak', bot.pos.clone());
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

  
  
  _hidePoisonHint() {
    const el = document.getElementById('poison-hint');
    if (el) el.style.display = 'none';
  }

  
  
  
  _updateSteakChip() {
    let slot = document.querySelector('.wpn.chicken');
    if (!slot) return;
    
    
    
    
    
    if (this.steakAmmo > 0) {
      slot.style.display = '';
      slot.classList.remove('cooldown');
      slot.innerHTML = '<span class="wpn-icon">🥩</span>'
        + `<span class="wpn-key">×${this.steakAmmo}</span>`
        + '<span class="wpn-name">MEAT</span>';
      return;
    }
    
    
    
    if (this.chickenAmmo > 0 || this._chickenCdTimer) return;
    if (this.steakScore > 0) {
      slot.style.display = '';
      slot.innerHTML = `<span class="wpn-icon">🥩</span><span class="wpn-key">${this.steakScore}/${STEAK_GOAL}</span><span class="wpn-name">steaks</span>`;
    } else {
      slot.style.display = 'none';
    }
  }

  
  
  
  
  

  _grantPowerUp(id, peerId) {
    
    
    
    
    
    
    const bot = this.bots.get(peerId);
    if (bot) {
      bot.grantPowerUp(id, Date.now());
      
      
      
      
      
      
      this._peerScale.set(peerId, bot.sizeScale);
      this.remotePlayers.get(peerId)?.setBodyScale(bot.sizeScale);
      return;
    }
    if (peerId !== this.myId) return;
    const def = POWER_UPS[id];
    if (!def) return;
    
    
    this.powerUpState = applyPowerUp(this.powerUpState, id, performance.now());
    this._updatePowerUpEffect();
    this._showPowerGet(`${def.emoji}  ${def.name}  ${def.emoji}`, def.blurb);
    try { SFX.chirp(); SFX.boom(0.35); } catch (_) {}
  }

  
  
  
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

  
  
  _applyLocalShot(s) {
    if (s.kind === 'hitscan') {
      const origin = new THREE.Vector3().fromArray(s.origin);
      const dir = new THREE.Vector3().fromArray(s.dir);
      
      
      const steakSide = this.steakPickups?.raycastHit(origin, dir, SHOT_RANGE);
      if (steakSide) { this._onSteakShot(steakSide); return; }   
      
      
      
      
      const hit = this._raycastPlayers(origin, dir);
      if (hit) {
        this._broadcast({ t: MSG.HIT, target: hit.peerId, dmg: s.damage, by: this.myId, weapon: s.weaponId });
        
        
        
        const bot = this.bots.get(hit.peerId);
        const rp = this.remotePlayers.get(hit.peerId);
        const hpLeft = bot ? bot.hp - s.damage
                     : (rp && rp.hp != null ? rp.hp - s.damage : null);
        const killed = hpLeft != null && hpLeft <= 0;
        this._flashHitmarker(s.damage, killed);
        SFX.splat();
        
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
      
      
      
      
      this._trackOwnProjectile(this.weapons.spawnProjectileMesh(s), s);
    }
  }

  _applyRemoteShot(s) {
    
    
    if (s.kind === 'projectile') this.weapons.spawnProjectileMesh(s);
    if (s.kind === 'hitscan') {
      this._addTracerForShot(s);
      this.weapons.spawnMuzzleFx(s);
    }
    SFX.pew();
  }

  
  _trackOwnProjectile(rec, shot) {
    if (!rec) return;
    (this._ownProjectiles ??= []).push({
      rec, shot,
      prev: rec.pos.clone(),
      travelled: 0,
    });
  }

  
  
  
  _resolveOwnProjectiles() {
    const live = this._ownProjectiles;
    if (!live || !live.length) return;
    const enemyTeam = this.team === 'red' ? 'blue' : 'red';

    
    
    
    
    
    
    
    
    
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
    
    
    
    
    
    
    
    
    const isSolid = shotSolid(this.grid);

    for (let i = live.length - 1; i >= 0; i--) {
      const p = live[i];
      const from = p.prev;
      const to = p.rec.pos;
      p.travelled += from.distanceTo(to);

      
      
      
      
      
      
      
      const steakSide = this.steakPickups?.segmentHit(from, to);
      if (steakSide) {
        this._onSteakShot(steakSide);
        this.weapons.despawnProjectile(p.rec);
        live.splice(i, 1);
        continue;
      }

      const result = stepProjectile({
        from: { x: from.x, y: from.y, z: from.z },
        to:   { x: to.x,   y: to.y,   z: to.z },
        targets, isSolid,
        age: p.rec.age, maxAge: 4,
        travelled: p.travelled, maxRange: SHOT_RANGE,
      });

      if (!result) { p.prev.copy(to); continue; }

      if (result.kind === 'player') {
        
        
        const victim = targets.find((t) => t.id === result.id);
        const head = victim ? isHeadshot(
          from, to,
          { x: victim.x, y: victim.y - aimPointY(this._peerScale.get(result.id) ?? 1), z: victim.z },
          this._peerScale.get(result.id) ?? 1) : false;
        this._onProjectileHitPlayer(result.id, p.shot, result.point, head);
      } else if (result.kind === 'world') {
        
        this.gore?.spatterAt?.(
          new THREE.Vector3(result.point.x, result.point.y, result.point.z),
          shotDirection(p.shot).multiplyScalar(-1));
      }
      this.weapons.despawnProjectile(p.rec);
      live.splice(i, 1);
    }
  }

  
  
  
  
  
  
  _onSteakShot(side) {
    if (!this.steakPickups?.markBroken(side)) return;
    this._broadcast({ t: MSG.STEAK_BREAK, at: side, by: this.myId });
    this.steakScore = Math.min(STEAK_GOAL, this.steakScore + 1);
    if (this.steakScore >= STEAK_GOAL && this.steakAmmo === 0) {
      
      
      this.steakAmmo = STEAK_THROWS;
      
      
      
      
      
      
      this._refreshViewmodel();
      this._showPowerGet('MEAT WEAPON',
        `${STEAK_THROWS} poison throws — FIRE to launch`);
      try { SFX.chirp(); SFX.boom(0.35); } catch (_) {}
    }
    this._updateSteakChip();
    this._flashHitmarker(0, false);
    SFX.splat();
  }

  
  _onProjectileHitPlayer(peerId, shot, point, headshot = false) {
    
    
    
    
    
    const dmg = damageFor(shot.damage, headshot);
    this._broadcast({ t: MSG.HIT, target: peerId, dmg,
                      by: this.myId, weapon: shot.weaponId, head: !!headshot });
    const bot = this.bots.get(peerId);
    const rp = this.remotePlayers.get(peerId);
    const hpLeft = bot ? bot.hp - dmg
                 : (rp && rp.hp != null ? rp.hp - dmg : null);
    this._flashHitmarker(dmg, hpLeft != null && hpLeft <= 0, headshot);
    if (headshot) { try { SFX.chirp(); } catch (_) {} }
    SFX.splat();
    if (this.mature) {
      const away = shotDirection(shot).multiplyScalar(-1);
      this.gore?.spatterAt?.(new THREE.Vector3(point.x, point.y, point.z), away);
    }
    
    if (bot && this.isHost) {
      const died = bot.takeDamage(dmg);
      if (died) {
        this._broadcast({ t: MSG.DEATH, victim: peerId, killer: this.myId, weapon: shot.weaponId });
        this._creditKill(this.myId, peerId);
        this.critters?.cheer(this._posOf(peerId), 'kill');
        
        
        
        this._localDeath(this.myId, peerId, shot.weaponId, bot.pos.clone());
        setTimeout(() => bot.respawn(), 500);
      }
    }
  }

  _raycastPlayers(origin, dir) {
    
    
    
    
    
    
    
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

  

  _takeDamage(dmg, byId, weaponId) {
    if (!this.player.alive) return;
    
    if (this.matchState !== 'playing') return;
    
    
    if (performance.now() < (this._invulnUntil || 0)) return;
    this.player.hp -= dmg;
    
    this._spawnCornFly(Math.min(Math.ceil(dmg / 2), 25));
    
    this._flashHit(byId);
    SFX.splat();
    if (this.player.hp <= 0) {
      this.player.hp = 0;
      this.player.alive = false;
      
      
      
      if (this.player.hasEnemyFlag) {
        const enemyColor = this.team === 'red' ? 'blue' : 'red';
        this.player.hasEnemyFlag = false;
        this._returnFlag(enemyColor);
        this._broadcast({ t: MSG.FLAG_RETURN, by: this.myId, color: enemyColor });
      }
      this._broadcast({ t: MSG.DEATH, victim: this.myId, killer: byId, weapon: weaponId });
      
      
      this._tallyKill(byId, this.myId);
      
      try { SFX.animalVoice(this.character, 1.0); } catch (_) {}
      
      
      this._localDeath(byId, this.myId, weaponId, this.player.pos.clone());
      
      
      
      
      if (this.mature) this._announceLoser();
      
      this._steakPoisonBy.delete(this.myId);
      this._hidePoisonHint();
      
      
      
      this.powerUpState = clearOnDeath();
      this._updatePowerUpEffect();
      
      this.player.respawn();
      this._invulnUntil = performance.now() + 2000;
    }
  }

  

  _updateFlags() {
    if (this.mode.flags === 'none') return;
    if (!this.player.alive) return;
    const enemyColor = this.team === 'red' ? 'blue' : 'red';
    const myColor    = this.team;

    
    
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
      this._captureMoment(myColor, enemyColor, this._name(this.myId), true);
      
      for (const bot of this.bots.values()) {
        this._botTaunt(bot.peerId, bot.team === myColor ? 'capture' : 'conceded');
      }
      this._maybeTriggerAnagram();
    }

    
    
    
    
    if (this.player.hasEnemyFlag) {
      this.flagPos[enemyColor] = {
        x: this.player.pos.x,
        y: this.player.pos.y + 1.8,   
        z: this.player.pos.z,
      };
      this._syncFlagMesh(enemyColor);
    }
    this._paintCarryBanner();
  }

  
  
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
    const home = flagHome(this.mode, color, this.world);
    if (home) this.flagPos[color] = { ...home };
    this._syncFlagMesh(color);
  }

  _syncFlagMesh(color) {
    const p = this.flagPos[color];
    const m = this.flagMeshes[color];
    
    
    
    
    
    
    
    
    
    if (!m || !p) return;
    
    
    m.position.set(p.x + 0.5, p.y, p.z + 0.5);
    
    
    const fabric = m.children[1];
    if (fabric && fabric.material && 'emissive' in fabric.material) {
      const carried = this.flagState[color] === 'carried' && this.flagCarrier[color] === this.myId;
      fabric.material.emissive.setHex(carried ? 0x3a7cff : 0x000000);
      fabric.material.emissiveIntensity = carried ? 1.2 : 0;
    }
  }

  

  
  
  
  
  
  
  
  _tallyKill(killerId, victimId) {
    tallyKill(this._tally, killerId, victimId);
    if (this._scoreboardOpen) this._paintScoreboard(true);   
  }

  
  
  
  _scoreboardPlayers() {
    return [...this.playerMeta.entries()].map(([id, m]) => ({
      id,
      name: m.name,
      team: m.team ?? this.bots.get(id)?.team ?? null,
      bot: !!(m.bot || this.bots.has(id)),
    }));
  }

  
  
  
  _paintScoreboard(show) {
    this._scoreboardOpen = !!show;
    let root = document.getElementById('scoreboard');
    if (!show) { root?.remove(); return; }
    if (!root) {
      root = document.createElement('div');
      root.id = 'scoreboard';
      document.body.appendChild(root);
      this._injectScoreboardStyles();
    }
    const rows = scoreboardRows({
      players: this._scoreboardPlayers(), tally: this._tally, myId: this.myId,
    });
    const column = (team) => {
      const totals = teamTotals(rows[team]);
      const body = rows[team].map((r) => `
        <tr class="${r.isMe ? 'me' : ''}">
          <td class="sb-name">${escapeHtml(r.name)}${r.bot ? '<span class="sb-bot">BOT</span>' : ''}</td>
          <td class="sb-num">${r.kills}</td>
          <td class="sb-num">${r.deaths}</td>
        </tr>`).join('');
      return `
        <div class="sb-col sb-${team}">
          <div class="sb-head">
            <span class="sb-team">${team.toUpperCase()}</span>
            <span class="sb-score">${this.scores[team]}</span>
          </div>
          <table>
            <tr class="sb-labels"><th>PLAYER</th><th>K</th><th>D</th></tr>
            ${body || '<tr><td class="sb-empty" colspan="3">nobody yet</td></tr>'}
          </table>
          <div class="sb-total">team ${totals.kills} kills · ${totals.deaths} deaths</div>
        </div>`;
    };
    root.innerHTML = `
      <div class="sb-card">
        <div class="sb-title">${this.mode.emoji} ${this.mode.name.toUpperCase()}
          <span class="sb-target">first to ${this.mode.winScore} ${this.mode.scoreLabel.toLowerCase()}</span></div>
        <div class="sb-cols">${column('red')}${column('blue')}</div>
      </div>`;
  }

  _injectScoreboardStyles() {
    if (document.getElementById('scoreboard-styles')) return;
    const s = document.createElement('style');
    s.id = 'scoreboard-styles';
    
    
    
    s.textContent = `
      #scoreboard { position: fixed; inset: 0; z-index: 19; pointer-events: none;
        display: flex; align-items: center; justify-content: center;
        font-family: system-ui, sans-serif; }
      #scoreboard .sb-card { background: rgba(8,11,17,0.93);
        border: 2px solid rgba(255,255,255,0.18); border-radius: 14px;
        padding: 14px 16px 12px; box-shadow: 0 18px 60px rgba(0,0,0,0.75);
        max-width: min(760px, 94vw); width: 100%; }
      #scoreboard .sb-title { text-align: center; color: #f4c95d;
        font: 900 15px/1.2 system-ui, sans-serif; letter-spacing: 0.08em;
        margin-bottom: 10px; }
      #scoreboard .sb-target { display: block; color: #9fb0c8; font: 700 11px/1.4 system-ui;
        letter-spacing: 0.12em; margin-top: 2px; }
      #scoreboard .sb-cols { display: flex; gap: 12px; }
      #scoreboard .sb-col { flex: 1 1 0; min-width: 0;
        border-radius: 10px; padding: 8px 10px 6px;
        background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.10); }
      #scoreboard .sb-red  { border-color: rgba(208,80,62,0.55); }
      #scoreboard .sb-blue { border-color: rgba(79,138,219,0.55); }
      #scoreboard .sb-head { display: flex; justify-content: space-between;
        align-items: baseline; margin-bottom: 6px; }
      #scoreboard .sb-team { font: 900 14px system-ui; letter-spacing: 0.12em; }
      #scoreboard .sb-red .sb-team, #scoreboard .sb-red .sb-score  { color: #ff8a7a; }
      #scoreboard .sb-blue .sb-team, #scoreboard .sb-blue .sb-score { color: #9cc4ff; }
      #scoreboard .sb-score { font: 900 24px system-ui; }
      #scoreboard table { width: 100%; border-collapse: collapse; }
      #scoreboard th, #scoreboard td { padding: 3px 2px; text-align: left; }
      #scoreboard .sb-labels th { color: #7d8da0;
        font: 800 10px system-ui; letter-spacing: 0.14em;
        border-bottom: 1px solid rgba(255,255,255,0.12); }
      #scoreboard .sb-labels th:not(:first-child), #scoreboard .sb-num { text-align: right; width: 34px; }
      #scoreboard .sb-name { color: #e8f3ff; font: 700 13px system-ui;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 0; }
      #scoreboard .sb-num { color: #cfe3ff; font: 800 13px system-ui; }
      #scoreboard tr.me .sb-name, #scoreboard tr.me .sb-num { color: #ffe9a8; }
      #scoreboard .sb-bot { margin-left: 6px; padding: 0 4px; border-radius: 4px;
        background: rgba(255,255,255,0.12); color: #9fb0c8;
        font: 800 9px system-ui; letter-spacing: 0.08em; vertical-align: 1px; }
      #scoreboard .sb-empty { color: #6f7d90; font: 700 12px system-ui; padding: 6px 0; }
      #scoreboard .sb-total { margin-top: 6px; padding-top: 5px;
        border-top: 1px solid rgba(255,255,255,0.10);
        color: #8fa0b6; font: 700 10px system-ui; letter-spacing: 0.06em; }
      @media (max-width: 520px) {
        #scoreboard .sb-cols { flex-direction: column; }
        #scoreboard .sb-card { max-height: 82vh; overflow-y: auto; pointer-events: auto; }
      }
    `;
    document.head.appendChild(s);
  }

  

  
  
  _creditKill(killerId, victimId) {
    
    
    this._tallyKill(killerId, victimId);
    if (!this.isHost || this.gameOver) return;
    
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

  

  _maybeTriggerAnagram() {
    if (this.gameOver) return;
    const { red, blue } = this.scores;
    
    
    const winning = modeWinner(this.mode, this.scores);
    if (!winning) return;
    const losing  = winning === 'red' ? 'blue' : 'red';
    this.gameOver = true;
    
    
    
    const steal = anagramDue(this.mode, this.scores);
    
    this._armRestartWatchdog(steal);
    
    
    
    setTimeout(() => this._showRoundResult(steal), RESULT_DELAY_MS);
    if (!steal) {
      
      
      
      if (this.isHost) {
        setTimeout(() => this._broadcastRestart(),
                   RESULT_DELAY_MS + INTERMISSION_MS);
      }
      return;
    }
    
    if (this.isHost) {
      const wordSeed = (this.seed ^ (red * 73856093) ^ (blue * 19349663)) >>> 0;
      const word = pickWord(wordSeed);
      const scrambled = scramble(word, wordSeed);
      
      
      
      const endsAt = Date.now() + RESULT_DELAY_MS + INTERMISSION_MS
                   + ANAGRAM_SECONDS * 1000;
      this._broadcast({ t: MSG.ANAGRAM_START, word, scrambled, losingTeam: losing, endsAt });
      this._startAnagram(word, scrambled, losing, endsAt);
    }
    
  }

  
  
  
  
  _startAnagram(word, scrambled, losingTeam, endsAt) {
    setTimeout(() => this._showRoundResult(true), RESULT_DELAY_MS);
    const openAt = endsAt - ANAGRAM_SECONDS * 1000;
    
    
    
    
    setTimeout(() => this._showIntermission(losingTeam, openAt), RESULT_DELAY_MS);
    setTimeout(() => this._openAnagram(word, scrambled, losingTeam, endsAt),
               Math.max(0, openAt - Date.now()));
  }

  _openAnagram(word, scrambled, losingTeam, endsAt) {
    
    
    this._hideRoundResult();
    
    
    this._hideIntermission();
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
    
    
    
    
    
    const tick = () => {
      if (!this._anagram) return;
      const remain = Math.max(0, Math.ceil((this._anagram.endsAt - Date.now()) / 1000));
      const timerEl = document.getElementById('anagramTimer');
      if (timerEl) timerEl.textContent = remain;
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
    
    
    
    
    
    if (this.isHost) setTimeout(() => this._broadcastRestart(), RESTART_DELAY_MS);
    const wrap = document.getElementById('anagramWrap');
    const msg  = document.getElementById('anagramMsg');
    const timer = document.getElementById('anagramTimer');
    document.getElementById('anagramTitle').textContent =
      winner === this.team ? 'YOUR TEAM WINS' : `${winner.toUpperCase()} TEAM WINS`;
    timer.textContent = '★';
    if (by) msg.textContent = `${this._name(by)} solved "${this._anagram?.word}" and stole the win for ${winner}.`;
    else    msg.textContent = `Time's up. ${winner.toUpperCase()} team keeps the score-based win.`;
    this._anagram = null;

    
    
    
    
    
    
    
    const count = document.getElementById('anagramTimer');
    let left = Math.ceil(RESTART_DELAY_MS / 1000);
    const tickDown = () => {
      if (this.matchState !== 'ended') return;   
      if (count) count.textContent = left > 0 ? String(left) : '*';
      if (left-- > 0) setTimeout(tickDown, 1000);
    };
    tickDown();
    if (msg) msg.textContent += '  Next round starting...';
    
  }

  

  _showIntermission(losingTeam, openAt) {
    const spectator = this.team !== losingTeam;
    document.getElementById('intermission')?.remove();
    const root = document.createElement('div');
    root.id = 'intermission';
    root.innerHTML = `
      <div class="im-card">
        <div class="im-head">
          <span class="im-kicker">ROUND OVER</span>
          <span class="im-count" id="im-count">10</span>
        </div>
        <div class="im-what">
          <div class="im-what-title">${spectator
            ? `The ${escapeHtml(losingTeam)} team gets one last chance`
            : 'You get one last chance'}</div>
          <p>${spectator
            ? `A scrambled word is about to appear. The ${escapeHtml(losingTeam)} team `
              + `has <b>${ANAGRAM_SECONDS} seconds</b> to unscramble it. If they do, `
              + 'they steal the win. You can only watch.'
            : `A scrambled word is about to appear. Type the real word within `
              + `<b>${ANAGRAM_SECONDS} seconds</b> and you steal the win for your team. `
              + 'You do not need to press enter - it unlocks the moment it is right.'}</p>
          <p class="im-then">Then the next round starts automatically.</p>
        </div>
        <div class="im-tabs">
          <button class="im-tab on" data-tab="round">THIS ROUND</button>
          <button class="im-tab" data-tab="career">ALL-TIME</button>
        </div>
        <div class="im-board" id="im-board"></div>
        <div class="im-board im-career" id="im-career" style="display:none;"></div>
      </div>`;
    document.body.appendChild(root);
    this._injectIntermissionStyles();
    this._paintIntermissionBoard();
    this._paintCareerBoard(root.querySelector('#im-career'));
    
    
    for (const tab of root.querySelectorAll('.im-tab')) {
      tab.addEventListener('click', () => {
        for (const t of root.querySelectorAll('.im-tab')) t.classList.toggle('on', t === tab);
        const career = tab.dataset.tab === 'career';
        root.querySelector('#im-board').style.display = career ? 'none' : '';
        root.querySelector('#im-career').style.display = career ? '' : 'none';
      });
    }

    
    
    
    const count = document.getElementById('im-count');
    const tick = () => {
      if (!document.getElementById('intermission')) return;
      const remain = Math.max(0, Math.ceil((openAt - Date.now()) / 1000));
      if (count) count.textContent = String(remain);
      if (remain > 0) setTimeout(tick, 250);
    };
    tick();
  }

  _hideIntermission() { document.getElementById('intermission')?.remove(); }

  _injectIntermissionStyles() {
    if (document.getElementById('intermission-styles')) return;
    const el = document.createElement('style');
    el.id = 'intermission-styles';
    
    
    
    
    
    
    
    
    
    
    el.textContent = `
      #intermission { position: fixed; inset: 0; z-index: 9995;
        display: flex; align-items: center; justify-content: center;
        background: rgba(6,8,13,0.72); pointer-events: none;
        font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
      #intermission .im-card { pointer-events: auto;
        width: min(92vw, 720px); max-height: 86vh; overflow: hidden;
        display: flex; flex-direction: column;
        background: rgba(10,14,21,0.97); color: #e8f3ff;
        border: 1px solid rgba(255,255,255,0.14); border-radius: 14px;
        box-shadow: 0 24px 70px rgba(0,0,0,0.65); padding: 16px 16px 12px; }
      #intermission .im-head { display: flex; align-items: center;
        justify-content: space-between; margin-bottom: 8px; }
      #intermission .im-kicker { font: 800 13px/1 system-ui, sans-serif;
        letter-spacing: 0.16em; color: #9fb2c8; }
      #intermission .im-count { font: 900 30px/1 system-ui, sans-serif;
        color: #f4c95d; min-width: 1.6em; text-align: right;
        font-variant-numeric: tabular-nums; }
      #intermission .im-what-title { font: 800 clamp(17px,3.4vw,22px)/1.2 system-ui, sans-serif;
        color: #fff; margin-bottom: 6px; }
      #intermission .im-what p { margin: 0 0 6px; font-size: clamp(13px,2.6vw,15px);
        line-height: 1.5; color: #cbd8e8; }
      #intermission .im-what b { color: #f4c95d; }
      #intermission .im-then { color: #8fa2b8 !important; font-style: italic; }
      #intermission .im-board { display: flex; gap: 10px; margin-top: 10px;
        min-height: 0; flex: 1 1 auto; }
      #intermission .im-tabs { display: flex; gap: 6px; margin-top: 12px; }
      #intermission .im-tab { flex: 0 0 auto; padding: 5px 12px; border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.16); background: rgba(255,255,255,0.05);
        color: #9fb2c8; font: 700 11px/1 system-ui, sans-serif; letter-spacing: 0.1em;
        cursor: pointer; }
      #intermission .im-tab.on { background: #f4c95d; border-color: #f4c95d; color: #1c1a17; }
      /* The all-time board is ONE column, not two teams, so it overrides the
         two-column flex above rather than inheriting it. */
      #intermission .im-career { display: block; overflow: hidden;
        background: rgba(255,255,255,0.04); border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.08); }
      #intermission .cb-head { display: flex; justify-content: space-between;
        align-items: baseline; padding: 7px 10px;
        border-bottom: 1px solid rgba(255,255,255,0.10); }
      #intermission .cb-title { font: 800 12px/1 system-ui, sans-serif;
        letter-spacing: 0.12em; color: #f4c95d; }
      #intermission .cb-matches { font: 600 11px/1 system-ui, sans-serif; color: #9fb2c8; }
      #intermission .cb-scroll { overflow-y: auto; -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain; max-height: min(30vh, 220px); }
      #intermission .cb-labels th { position: sticky; top: 0; background: #121824;
        color: #8fa2b8; font: 700 10px/1.6 system-ui, sans-serif;
        letter-spacing: 0.1em; text-align: right; padding: 4px 8px; }
      #intermission .cb-labels th:nth-child(1),
      #intermission .cb-labels th:nth-child(2) { text-align: left; }
      #intermission .cb-rank { color: #7f8798; width: 1%; padding: 4px 8px; }
      #intermission .cb-name { color: #dbe6f3; white-space: nowrap; overflow: hidden;
        text-overflow: ellipsis; max-width: 1px; width: 99%; padding: 4px 8px; }
      #intermission .cb-num { text-align: right; color: #b9c8da; padding: 4px 8px;
        font-variant-numeric: tabular-nums; }
      #intermission tr.me .cb-name { color: #f4c95d; font-weight: 700; }
      #intermission .cb-empty { color: #7f8798; font-style: italic; padding: 10px; }
      #intermission .cb-note { margin: 0; padding: 7px 10px; font-size: 11px;
        color: #7f8798; border-top: 1px solid rgba(255,255,255,0.08); line-height: 1.4; }
      #intermission .im-col { flex: 1 1 0; min-width: 0; min-height: 0;
        display: flex; flex-direction: column;
        background: rgba(255,255,255,0.04); border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.08); overflow: hidden; }
      #intermission .im-col-head { display: flex; justify-content: space-between;
        align-items: baseline; padding: 7px 10px;
        border-bottom: 1px solid rgba(255,255,255,0.10); }
      #intermission .im-team { font: 800 12px/1 system-ui, sans-serif; letter-spacing: 0.12em; }
      #intermission .im-red .im-team { color: #ff8a7a; }
      #intermission .im-blue .im-team { color: #7cb0ff; }
      #intermission .im-score { font: 900 20px/1 system-ui, sans-serif; color: #fff;
        font-variant-numeric: tabular-nums; }
      /* The scrollable part. max-height in CAPPED vh so a 16-player match
         scrolls instead of pushing the instructions off the top of the card,
         and -webkit-overflow-scrolling for momentum on iOS Safari. */
      #intermission .im-scroll { overflow-y: auto; overflow-x: hidden;
        -webkit-overflow-scrolling: touch; overscroll-behavior: contain;
        max-height: min(34vh, 260px); flex: 1 1 auto; }
      #intermission .im-scroll::-webkit-scrollbar { width: 8px; }
      #intermission .im-scroll::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,0.22); border-radius: 4px; }
      #intermission table { width: 100%; border-collapse: collapse; }
      #intermission th, #intermission td { padding: 4px 10px; font-size: 13px; }
      #intermission .im-labels th { position: sticky; top: 0;
        background: #121824; color: #8fa2b8; font: 700 10px/1.6 system-ui, sans-serif;
        letter-spacing: 0.1em; text-align: left; }
      #intermission .im-labels th + th { text-align: right; }
      #intermission .im-name { color: #dbe6f3; white-space: nowrap;
        overflow: hidden; text-overflow: ellipsis; max-width: 1px; width: 99%; }
      #intermission .im-num { text-align: right; font-variant-numeric: tabular-nums;
        color: #b9c8da; }
      #intermission tr.me .im-name { color: #f4c95d; font-weight: 700; }
      #intermission .im-bot { margin-left: 6px; padding: 1px 4px; border-radius: 3px;
        background: rgba(255,255,255,0.10); color: #8fa2b8;
        font: 700 9px/1.4 system-ui, sans-serif; }
      #intermission .im-empty { color: #7f8798; font-style: italic; }
      #intermission .im-total { padding: 6px 10px; font-size: 11px; color: #8fa2b8;
        border-top: 1px solid rgba(255,255,255,0.08); }
      /* Phones: the two team columns stop being columns. Side by side at
         360 px wide gives each one about 20 characters, which truncates every
         name to an ellipsis and makes the leaderboard useless on the device
         most likely to be showing it. */
      @media (max-width: 560px) {
        #intermission .im-board { flex-direction: column; gap: 8px; }
        #intermission .im-card { padding: 12px; }
        /* flex:0 0 auto and a DEFINITE height, not flex:1 + max-height.
           Stacked in a column the 'flex: 1 1 0' columns resolved to a zero
           basis inside a card with no definite height of its own, so both
           scroll boxes measured clientHeight 0 on a 375x812 phone: scrollable
           by the numbers, and completely invisible on the screen. Measured,
           not guessed - the desktop row layout never showed it. */
        #intermission .im-col { flex: 0 0 auto; }
        #intermission .im-scroll { height: min(22vh, 150px); max-height: none;
                                   flex: 0 0 auto; }
      }
      /* Short landscape phones: the instructions alone can fill the screen. */
      @media (max-height: 460px) {
        #intermission .im-what p { display: none; }
        #intermission .im-then { display: block !important; }
        #intermission .im-scroll { max-height: 26vh; }
      }`;
    document.head.appendChild(el);
  }

  
  
  _paintIntermissionBoard() {
    const host = document.getElementById('im-board');
    if (!host) return;
    const rows = scoreboardRows({
      players: this._scoreboardPlayers(), tally: this._tally, myId: this.myId,
    });
    const column = (team) => {
      const totals = teamTotals(rows[team]);
      const body = rows[team].map((r) => `
        <tr class="${r.isMe ? 'me' : ''}">
          <td class="im-name">${escapeHtml(r.name)}${r.bot ? '<span class="im-bot">BOT</span>' : ''}</td>
          <td class="im-num">${r.kills}</td>
          <td class="im-num">${r.deaths}</td>
        </tr>`).join('');
      return `
        <div class="im-col im-${team}">
          <div class="im-col-head">
            <span class="im-team">${team.toUpperCase()}</span>
            <span class="im-score">${this.scores[team]}</span>
          </div>
          <div class="im-scroll">
            <table>
              <tr class="im-labels"><th>PLAYER</th><th>K</th><th>D</th></tr>
              ${body || '<tr><td class="im-empty" colspan="3">nobody yet</td></tr>'}
            </table>
          </div>
          <div class="im-total">team ${totals.kills} kills - ${totals.deaths} deaths</div>
        </div>`;
    };
    host.innerHTML = column('red') + column('blue');
  }

  

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  _armRestartWatchdog(steal) {
    if (!this.isHost) return;
    clearTimeout(this._restartWatchdog);
    const sequence = steal
      ? RESULT_DELAY_MS + INTERMISSION_MS + ANAGRAM_SECONDS * 1000 + RESTART_DELAY_MS
      : RESULT_DELAY_MS + INTERMISSION_MS;
    this._restartWatchdog = setTimeout(() => {
      if (this.matchState !== 'ended') return;   
      this._broadcastRestart();
    }, sequence + RESTART_WATCHDOG_SLACK_MS);
  }

  _broadcastRestart() {
    if (!this.isHost) return;
    if (this.matchState !== 'ended') return;   
    const scores = { red: 0, blue: 0 };
    this._broadcast({ t: MSG.MATCH_RESTART, scores, startsAt: Date.now() });
    this._applyRestart(scores);
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  _applyRestart(scores) {
    if (this.matchState !== 'ended') return;   
    clearTimeout(this._restartWatchdog);
    try {
      
      
      
      this._hideRoundResult();
      this._hideIntermission();
      document.getElementById('anagramWrap')?.classList.remove('visible');
      const input = document.getElementById('anagramInput');
      if (input) { input.value = ''; input.oninput = null; input.blur(); }
      this._anagram = null;

      
      
      
      
      this.scores = scores ? { ...scores } : { red: 0, blue: 0 };
      this.gameOver = false;
      this._roundResultShown = false;
      this._tally = emptyTally();
      this._killFeed.clear();
      this._updateScoreUi();
      if (this._scoreboardOpen) this._paintScoreboard(true);

      
      
      for (const c of flagKeysFor(this.mode)) {
        this.flagState[c] = 'home';
        this.flagCarrier[c] = null;
        this._returnFlag(c);
      }
      if (this.player) this.player.hasEnemyFlag = false;

      
      
      try { this.player?.respawn(); } catch (_) {}
      for (const bot of this.bots.values()) { try { bot.respawn(); } catch (_) {} }
    } finally {
      
      this.matchState = 'playing';
      this._killFeedPush('New round - first to ' + this.mode.winScore + ' '
                         + this.mode.scoreLabel.toLowerCase());
    }
  }

  

  _updateHud() {
    
    
    
    
    this._updateScoreUi();
    this._paintCornBar();
    
    
    
    this._paintKillFeed();
    
    
    
    
    
    
    
    
    const flagStatus = [];
    if (hasFlags(this.mode)) {
      const neutral = this.mode.flags === 'neutral';
      if (this.player.hasEnemyFlag) {
        flagStatus.push(neutral
          ? '🏴 You have the flag - run it into THEIR base!'
          : '🚩 You have the enemy flag - run home!');
      }
      for (const c of flagKeysFor(this.mode)) {
        const name = neutral ? 'The' : c.toUpperCase();
        if (this.flagState[c] === 'carried' && this.flagCarrier[c] !== this.myId) {
          flagStatus.push(`${name} flag: carried by ${this._name(this.flagCarrier[c])}`);
        } else if (this.flagState[c] === 'dropped') {
          flagStatus.push(`${name} flag: dropped`);
        }
      }
    }
    const flagEl = document.getElementById('flagStatus');
    if (flagEl) flagEl.textContent = flagStatus.join(' · ');
  }

  _updateScoreUi() {
    document.getElementById('scoreRed').textContent  = this.scores.red;
    document.getElementById('scoreBlue').textContent = this.scores.blue;
    
    
    
    
    const target = document.getElementById('scoreTarget');
    if (target) {
      target.textContent = `· first to ${this.mode.winScore} `
        + `${this.mode.scoreLabel.toLowerCase()} ·`;
    }
  }

  
  
  
  
  
  
  
  
  
  _killFeedPush(text) {
    this._killFeed.push(text, Date.now());
    this._paintKillFeed();
  }

  
  
  
  
  
  
  
  
  _paintKillFeed() {
    const el = document.getElementById('kill-feed');
    if (!el) return;   
    const lines = this._killFeed.lines(Date.now());
    if (el.childElementCount === lines.length
        && lines.every((t, i) => el.children[i].textContent === t)) return;
    el.innerHTML = '';
    for (const text of lines) {
      const d = document.createElement('div');
      d.className = 'kill-line';
      d.textContent = text;
      el.appendChild(d);
    }
  }
}
