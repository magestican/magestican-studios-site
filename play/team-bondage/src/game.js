

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
import { KillAnnouncer, shouldHear } from './audio/killAnnouncer.js';
import { CornDrops, CORN } from './entities/cornDrop.js';
import { groundHeightAt } from '../../../web-engine/ai/botStep.js';
import { considerTaunt, newTauntState } from './entities/botTaunts.js';

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


const TEAM_HEX = { red: 0xd0503e, blue: 0x4f8adb };
const FLAG_HOME_RADIUS = 3.5;   





const STEAK_GOAL = 5;
const STEAK_THROWS = 2;




export const MATCH_CAP = 16;
export const MAX_BOTS = MATCH_CAP - 1;   













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
const NET_TICK_HZ = 20;
const RESPAWN_DELAY = 0.0;      
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
    this._killFeed = [];                 
    this.audio = new Chiptune();
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

    
    this._broadcast({ t: MSG.HELLO, name: this.name, character: this.character, team: this.team });

    
    if (this.isHost && this.initialBotCount > 0) {
      for (let i = 0; i < this.initialBotCount; i++) this.addBot();
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
      
      
      
      const c = { x: world.hillSpawn.x - 0.5, y: Math.floor(world.hillSpawn.y),
                  z: world.hillSpawn.z - 0.5 };
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
    
    
    if (this._occupancy().total >= MATCH_CAP) return null;
    
    let r = 0, b = 0;
    for (const meta of this.playerMeta.values()) {
      if (meta.team === 'red') r++; else b++;
    }
    const team = preferredTeam || (r <= b ? 'red' : 'blue');
    const bot = Bot.make({ team, world: this.world, seed: this.seed });
    this.bots.set(bot.peerId, bot);
    
    this.playerMeta.set(bot.peerId, {
      name: bot.name, character: bot.character, team: bot.team, bot: true,
    });
    
    const helloMsg = { t: MSG.HELLO, name: bot.name, character: bot.character, team: bot.team, from: bot.peerId };
    this._broadcast({ ...helloMsg });
    
    if (!this.remotePlayers.has(bot.peerId)) {
      this.remotePlayers.set(bot.peerId, new RemotePlayer(this.scene, bot.peerId,
        { name: bot.name, character: bot.character, team: bot.team, localTeam: this.team }));
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
          this._maybeTriggerAnagram();
        },
      };
      bot.update(dt, ctx);

      
      
      const rp = this.remotePlayers.get(bot.peerId);
      if (rp) {
        rp.setNet([bot.pos.x, bot.pos.y, bot.pos.z], bot.yaw, bot.pitch, bot.hp);
        rp.group.position.set(bot.pos.x, bot.pos.y, bot.pos.z);
        rp.group.rotation.y = bot.yaw;
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

  
  
  
  
  
  
  
  
  
  
  _flashHitmarker(dmg = 0, killed = false) {
    const el = document.getElementById('hitmarker');
    if (el) {
      el.classList.remove('visible');
      el.style.color = killed ? '#ff3a2a' : '#ffffff';
      el.style.transform = 'translate(-50%,-50%) scale(1.9)';
      
      void el.offsetWidth;
      el.classList.add('visible');
      el.style.transform = 'translate(-50%,-50%) scale(1)';
      clearTimeout(this._hitmarkerT);
      this._hitmarkerT = setTimeout(() => el.classList.remove('visible'), killed ? 420 : 220);
    }
    if (dmg > 0) this._floatDamage(dmg, killed);
  }

  
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
    if (!this.player || !this.flagPos) return;
    const yaw = this.player.yaw;
    for (const color of ['red', 'blue']) {
      const el = document.getElementById(color === 'red' ? 'compassRed' : 'compassBlue');
      const distEl = document.getElementById(color === 'red' ? 'compassRedDist' : 'compassBlueDist');
      if (!el || !distEl) continue;
      const f = this.flagPos[color];
      const dx = f.x + 0.5 - this.player.pos.x;
      const dz = f.z + 0.5 - this.player.pos.z;
      
      
      const bearing = Math.atan2(dx, dz);
      const rel = bearing - yaw;
      
      let deg = (rel * 180 / Math.PI + 540) % 360 - 180;
      el.style.transform = `rotate(${deg}deg)`;
      distEl.textContent = Math.round(Math.hypot(dx, dz)) + 'm';
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
          this.remotePlayers.set(from, new RemotePlayer(this.scene, from,
            { name: msg.name, character: msg.character, team: msg.team, localTeam: this.team }));
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
        this._killFeedPush(`${this._name(msg.killer)} ➜ ${this._name(msg.victim)} (${msg.weapon})`);
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
        this._announceKill(msg.killer, msg.victim, msg.weapon);
        
        this._dropCorn(this._posOf(msg.victim));
        
        
        
        
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
        this._announceSteakAnnihilation(msg.victim, msg.killer);
        break;
      case MSG.FLAG_CAP: {
        
        const scoringTeam = msg.color === 'red' ? 'blue' : 'red';
        this.scores[scoringTeam]++;
        this._returnFlag(msg.color);
        this._updateScoreUi();
        this._killFeedPush(`${this._name(msg.by)} captured the ${msg.color} flag!`);
        
        
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

  

  _frame(now) {
    const dt = Math.min(0.05, (now - this._lastFrame) / 1000);
    this._lastFrame = now;
    if (!this.gameOver) {
      try { this._tick(dt); }
      catch (err) {
        
        
        console.error('[tick error]', err);
        window.__tbDebug = { ...(window.__tbDebug || {}), tickError: String(err.message || err) };
      }
    }
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    try {
      this.skyBrawl?.update(dt, this.camera.position);
      this.critters?.update(dt, this.camera.position);
      if (!this.gameOver) this._tickHill(dt);
      if (!this._contextLost) this.renderer.render(this.scene, this.camera);
    } catch (err) {
      
      const key = String(err?.message || err);
      if (key !== this._lastFrameErr) {
        this._lastFrameErr = key;
        console.error('[frame error]', err);
      }
    } finally {
      requestAnimationFrame((t) => this._frame(t));
    }
  }

  _tick(dt) {
    
    
    
    
    if (!this.input) return;
    
    
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
    
    
    if (this.touch) this.touch._paintDebug();
    
    
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
        
        .map((p) => ({ x: p.pos.x, y: p.pos.y + 1.0, z: p.pos.z }));
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
    
    
    
    
    if (this.steakAmmo > 0 && this.chickenAmmo === 0) {
      this.steakAmmo--;
      
      
      
      if (this.steakAmmo <= 0) this.steakScore = 0;
      const msg = { t: MSG.STEAK_THROW, origin: origin.toArray(), dir: dir.toArray(), by: this.myId };
      this._broadcast(msg);
      this._spawnSteakProjectile(msg);
      if (this.isHost) this._resolveSteakThrow(msg);
      SFX.pew();
      this._updateSteakChip();
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
        setTimeout(() => bot.respawn(), 500);
      } else if (victim.peerId === this.myId) {
        this._takeDamage(100, msg.by, 'chicken');
      } else {
        this._broadcast({ t: MSG.HIT, target: victim.peerId, dmg: 100, by: msg.by, weapon: 'chicken' });
      }
      this._killFeedPush(`${this._name(msg.by)} obliterated ${this._name(victim.peerId)} with a chicken!`);
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
      if (steakSide) {
        this.steakPickups.markBroken(steakSide);
        this._broadcast({ t: MSG.STEAK_BREAK, at: steakSide, by: this.myId });
        this.steakScore = Math.min(STEAK_GOAL, this.steakScore + 1);
        if (this.steakScore >= STEAK_GOAL && this.steakAmmo === 0) {
          
          
          this.steakAmmo = STEAK_THROWS;
          this._showPowerGet('🥩  MEAT WEAPON  🥩',
            `${STEAK_THROWS} poison throws — FIRE to launch`);
          try { SFX.chirp(); SFX.boom(0.35); } catch (_) {}
        }
        this._updateSteakChip();
        SFX.splat();
        return;   
      }
      
      
      
      
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
        
        this.gore?.spatterAt?.(
          new THREE.Vector3(result.point.x, result.point.y, result.point.z),
          shotDirection(p.shot).multiplyScalar(-1));
      }
      this.weapons.despawnProjectile(p.rec);
      live.splice(i, 1);
    }
  }

  
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
      
      try { SFX.animalVoice(this.character, 1.0); } catch (_) {}
      
      
      this._announceKill(byId, this.myId, weaponId);
      this._dropCorn(this.player.pos.clone());
      
      
      
      
      if (this.mature) this._announceLoser();
      this._killFeedPush(`${this._name(byId)} ➜ ${this._name(this.myId)} (${weaponId})`);
      
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
    this.flagPos[color] = { ...this.world.flags[color] };
    this._syncFlagMesh(color);
  }

  _syncFlagMesh(color) {
    const p = this.flagPos[color];
    const m = this.flagMeshes[color];
    
    
    m.position.set(p.x + 0.5, p.y, p.z + 0.5);
    
    
    const fabric = m.children[1];
    if (fabric && fabric.material && 'emissive' in fabric.material) {
      const carried = this.flagState[color] === 'carried' && this.flagCarrier[color] === this.myId;
      fabric.material.emissive.setHex(carried ? 0x3a7cff : 0x000000);
      fabric.material.emissiveIntensity = carried ? 1.2 : 0;
    }
  }

  

  
  
  _creditKill(killerId, victimId) {
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
    if (!winning || !anagramDue(this.mode, this.scores)) return;
    const losing  = winning === 'red' ? 'blue' : 'red';
    this.gameOver = true;
    
    if (this.isHost) {
      const wordSeed = (this.seed ^ (red * 73856093) ^ (blue * 19349663)) >>> 0;
      const word = pickWord(wordSeed);
      const scrambled = scramble(word, wordSeed);
      const endsAt = Date.now() + ANAGRAM_SECONDS * 1000;
      this._broadcast({ t: MSG.ANAGRAM_START, word, scrambled, losingTeam: losing, endsAt });
      this._startAnagram(word, scrambled, losing, endsAt);
    }
    
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
    
    this._anagram = null;
  }

  

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
