// Team Bondage - main game orchestrator.

import * as THREE from 'three';
import { InputBus } from 'arbelo/input';
import { SeededRng } from 'arbelo/rng';
import { VOX } from 'arbelo/voxel';
import { generateWorld, WORLD_SIZE } from 'arbelo/procgen';

import { buildWorldMeshes } from './map/voxelMesh.js';
import { buildCharacter }   from './entities/character.js';
import { Player }           from './entities/player.js';
import { WeaponSystem, WEAPON_DEFS } from './entities/weapon.js';
import { RemotePlayer }     from './entities/remotePlayer.js';
import { MSG }              from './net/protocol.js';
import { pickWord, scramble } from './util/anagram.js';
import { TouchControls }     from './touchControls.js';
import { Chiptune }           from './audio/chiptune.js';
import { HazardSystem, makeHostSchedule } from './entities/hazard.js';
import { WORLD_SIZE }         from 'arbelo/procgen';

const TEAM_HEX = { red: 0xd0503e, blue: 0x4f8adb };
const FLAG_HOME_RADIUS = 2.0;   // steps within this of your own flag stand = capture
const WIN_SCORE = 5;
const NET_TICK_HZ = 20;
const RESPAWN_DELAY = 0.0;      // "immediate" per spec
const ANAGRAM_SECONDS = 10;
const LOBBY_MIN_PLAYERS = 2;
const LOBBY_COUNTDOWN_SECONDS = 10;

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
    } else {
      // Host: broadcast welcome to all newcomers as they join.
      this.mesh.addEventListener('peer-joined', (e) => {
        this._sendWelcome(e.detail.id);
      });
    }

    this._initThree();
    this._buildWorld(this.seed);
    this._initPlayer();
    this._initInput();

    // Send our HELLO to whoever's out there.
    this._broadcast({ t: MSG.HELLO, name: this.name, character: this.character, team: this.team });

    // Wire mute button. iOS Safari needs touchstart in addition to click:
    // click sometimes doesn't dispatch on button elements inside a
    // pointer-events:none HUD without a real tap chain.
    const muteBtn = document.getElementById('mute-btn');
    const paintMute = () => { muteBtn.textContent = this.audio.muted ? '🔇' : '🔊'; };
    paintMute();
    const handleMuteToggle = (e) => {
      if (e) e.preventDefault();
      this.audio.toggleMuted();
      paintMute();
      // Also try to (re)start audio in this same gesture - in case iOS Safari
      // never accepted our earlier autoplay attempt.
      tryStartAudio();
    };
    muteBtn.addEventListener('click', handleMuteToggle);
    muteBtn.addEventListener('touchstart', handleMuteToggle, { passive: false });

    // Kick off audio. iOS Safari requires the AudioContext to be created
    // AND resumed inside a user-gesture callback; a stale "once: true" that
    // failed silently would then never retry. Instead, retry on every
    // touch/click until we hear playback start.
    let audioStarted = false;
    const tryStartAudio = () => {
      if (audioStarted) return;
      this.audio.ensureContext();
      const ctx = this.audio.ctx;
      if (!ctx) return;
      const finish = () => { if (!audioStarted) { this.audio.start(); audioStarted = true; } };
      if (ctx.state === 'suspended') ctx.resume().then(finish, () => {});
      else finish();
    };
    window.addEventListener('pointerdown', tryStartAudio);
    window.addEventListener('touchstart', tryStartAudio, { passive: true });
    window.addEventListener('click', tryStartAudio);

    // Show the lobby banner. Solo host: waits for 2+ players; countdown then
    // starts and match transitions to 'playing'. Joiners get the current
    // matchState via WELCOME.
    this._updateLobbyBanner();
    if (this.isHost) this._maybeStartCountdown();

    // On next frame:
    this.opts.onReady && this.opts.onReady();

    this._lastFrame = performance.now();
    requestAnimationFrame((now) => this._frame(now));
  }

  // ---- three.js scene -----------------------------------------------------

  _initThree() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(new THREE.Color(0x8ec5ff));   // sky
    this.opts.canvasParent.appendChild(this.renderer.domElement);

    window.addEventListener('resize', () => this._onResize());

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x8ec5ff, 30, 90);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
    this.camera.rotation.order = 'YXZ';

    // Lights
    const sun = new THREE.DirectionalLight(0xffffff, 1.05);
    sun.position.set(0.6, 1.0, 0.4);
    this.scene.add(sun);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.55));

    // Sky-blue hemisphere for depth
    const hemi = new THREE.HemisphereLight(0x9fd7ff, 0x2a4a24, 0.55);
    this.scene.add(hemi);
  }

  _onResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  // ---- world --------------------------------------------------------------

  _buildWorld(seed) {
    const world = generateWorld(seed);
    this.world = world;
    this.grid = world.grid;
    this.scene.add(buildWorldMeshes(world.grid));

    // Flag meshes (visible pole + fabric on top of each flag stand)
    this.flagMeshes = {
      red:  this._buildFlagMesh(world.flags.red,  0xff5c4a),
      blue: this._buildFlagMesh(world.flags.blue, 0x7cb0ff),
    };
    this.flagState = { red: 'home', blue: 'home' };  // 'home' | 'carried' | 'dropped'
    this.flagPos   = { red: { ...world.flags.red }, blue: { ...world.flags.blue } };
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
    group.position.set(pos.x + 0.5, pos.y - 1, pos.z + 0.5);
    this.scene.add(group);
    return group;
  }

  // ---- player -------------------------------------------------------------

  _initPlayer() {
    const spawn = this.world.spawns[this.team];
    this.player = new Player(this.camera, this.grid, spawn, this.team);
    this.weapons = new WeaponSystem(this.scene);
    this.hazards = new HazardSystem(this.scene, this.grid);
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
      t: MSG.WELCOME, seed: this.seed, scores: this.scores,
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

  _onMessage(from, msg) {
    if (!msg || !msg.t) return;
    switch (msg.t) {
      case MSG.WELCOME:
        this.seed = msg.seed;
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
            { name: msg.name, character: msg.character, team: msg.team }));
        }
        // If we're host, welcome this new peer to catch them up, then trigger
        // team-balance + potentially start the countdown.
        if (this.isHost) {
          this._sendWelcome(from);
          this._rebalanceTeams();
          this._maybeStartCountdown();
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
        break;
      }

      case MSG.MATCH_STATE:
        this.matchState = msg.state;
        this._matchEndsAt = msg.endsAt || 0;
        this._updateLobbyBanner();
        break;

      case MSG.HAZARD_SPAWN:
        if (this.hazards) for (const item of msg.items) this.hazards.spawn(item);
        break;

      case MSG.STATE: {
        const rp = this.remotePlayers.get(from);
        if (rp) rp.setNet(msg.p, msg.y, msg.x, msg.h);
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
      case MSG.FLAG_CAP: {
        // host-authoritative: increment scoring team's score
        const scoringTeam = msg.color === 'red' ? 'blue' : 'red';
        this.scores[scoringTeam]++;
        this._returnFlag(msg.color);
        this._updateScoreUi();
        this._killFeedPush(`${this._name(msg.by)} captured the ${msg.color} flag!`);
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
    if (!this.gameOver) this._tick(dt);
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame((t) => this._frame(t));
  }

  _tick(dt) {
    // Lobby / countdown state -- update banner, freeze gameplay input.
    if (this.matchState !== 'playing' && this.matchState !== 'ended') {
      this._updateLobbyBanner();
      for (const rp of this.remotePlayers.values()) rp.update(dt);
      // Still send our state so peers can see the character standing at spawn.
      this._netAccum += dt;
      if (this._netAccum >= 1 / 5) {
        this._netAccum = 0;
        this._broadcast({
          t: MSG.STATE,
          p: [this.player.pos.x, this.player.pos.y, this.player.pos.z],
          y: this.player.yaw, x: this.player.pitch, h: this.player.hp,
          c: this.character, tm: this.team, hf: false,
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

    // Weapon switch
    if (this.input.wasPressed('weapon1')) this._switchWeapon(0);
    if (this.input.wasPressed('weapon2')) this._switchWeapon(1);
    if (this.input.wasPressed('weapon3')) this._switchWeapon(2);

    // Fire - on desktop require pointer-lock to avoid firing while the user
    // is interacting with menu/HUD; on touch, the FIRE button drives it.
    const canFire = this.isTouch
      || document.pointerLockElement === this.renderer.domElement;
    if (this.input.isDown('fire') && canFire) {
      this._tryFire();
    }

    // Movement
    if (this.player.alive) this.player.update(dt, this.input);
    this.weapons.update(dt);

    // Remote players
    for (const rp of this.remotePlayers.values()) rp.update(dt);

    // Hazard rain (eggs + milk pints)
    const nowMs = performance.now();
    this.hazards.update(dt, nowMs);
    if (this.isHost && nowMs >= this._nextHazardAt) {
      const items = makeHostSchedule(WORLD_SIZE, this._hazardRngHost, nowMs);
      for (const item of items) this.hazards.spawn(item);
      this._broadcast({ t: MSG.HAZARD_SPAWN, items });
      // Reschedule 3-6 seconds later.
      this._nextHazardAt = nowMs + this._hazardRngHost.rangeI(3000, 6000);
    }
    // Local player damage from hazards that just landed.
    if (this.player.alive) {
      for (const dmg of this.hazards.consumeHitsFor(this.player.pos)) {
        this._takeDamage(dmg, this.myId, 'hazard');
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
      });
    }

    this._updateHud();
    this.input.endFrame();
  }

  _switchWeapon(i) {
    this.weapons.selectSlot(i);
    document.querySelectorAll('#weaponbar .wpn').forEach((el, idx) => {
      el.classList.toggle('active', idx === i);
    });
  }

  _tryFire() {
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    const origin = this.camera.position.clone();
    const shots = this.weapons.tryFire(origin, dir, this.rngShots, this.myId);
    for (const s of shots) {
      this._broadcast({ t: MSG.SHOT, s });
      this._applyLocalShot(s);
    }
  }

  // Resolve a shot fired by us: check hitscan vs remote players + world;
  // report HITs to the target.
  _applyLocalShot(s) {
    if (s.kind === 'hitscan') {
      const hit = this._raycastPlayers(new THREE.Vector3().fromArray(s.origin),
                                       new THREE.Vector3().fromArray(s.dir));
      if (hit) {
        this._broadcast({ t: MSG.HIT, target: hit.peerId, dmg: s.damage, by: this.myId, weapon: s.weaponId });
      }
    } else if (s.kind === 'projectile') {
      this.weapons.spawnProjectileMesh(s);
    }
  }

  _applyRemoteShot(s) {
    if (s.kind === 'projectile') this.weapons.spawnProjectileMesh(s);
    // We don't need to hitscan for others; each shooter reports HIT for their
    // own shots.
  }

  _raycastPlayers(origin, dir) {
    // Simple: sphere test against each remote player at 1.4m radius.
    let best = null;
    let bestT = Infinity;
    for (const [pid, rp] of this.remotePlayers.entries()) {
      const to = rp.group.position.clone().add(new THREE.Vector3(0, 1, 0)).sub(origin);
      const projT = to.dot(dir);
      if (projT < 0.5 || projT > 60) continue;
      const closest = origin.clone().addScaledVector(dir, projT);
      const perp = rp.group.position.clone().add(new THREE.Vector3(0, 1, 0)).distanceTo(closest);
      if (perp < 0.7 && projT < bestT) {
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
    const iters = Math.min(300, Math.ceil(tMax / step));
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
    this.player.hp -= dmg;
    if (this.player.hp <= 0) {
      this.player.hp = 0;
      this.player.alive = false;
      // If carrying a flag, drop it.
      if (this.player.hasEnemyFlag) {
        const enemyColor = this.team === 'red' ? 'blue' : 'red';
        this.player.hasEnemyFlag = false;
        this._broadcast({ t: MSG.FLAG_DROP, by: this.myId, color: enemyColor,
          at: [this.player.pos.x, this.player.pos.y, this.player.pos.z] });
        this.flagState[enemyColor] = 'dropped';
        this.flagCarrier[enemyColor] = null;
        this.flagPos[enemyColor] = { x: this.player.pos.x, y: this.player.pos.y, z: this.player.pos.z };
        this._syncFlagMesh(enemyColor);
      }
      this._broadcast({ t: MSG.DEATH, victim: this.myId, killer: byId, weapon: weaponId });
      this._killFeedPush(`${this._name(byId)} ➜ ${this._name(this.myId)} (${weaponId})`);
      // Immediate respawn per spec.
      this.player.respawn();
    }
  }

  // ---- flags -----------------------------------------------------------

  _updateFlags() {
    if (!this.player.alive) return;
    const enemyColor = this.team === 'red' ? 'blue' : 'red';
    const myColor    = this.team;

    // Pickup enemy flag if standing on it and it's at home or dropped.
    if (!this.player.hasEnemyFlag && this.flagState[enemyColor] !== 'carried') {
      const fp = this.flagPos[enemyColor];
      const d = Math.hypot(this.player.pos.x - fp.x - 0.5, this.player.pos.z - fp.z - 0.5);
      if (d < 1.2) {
        this.player.hasEnemyFlag = true;
        this.flagState[enemyColor] = 'carried';
        this.flagCarrier[enemyColor] = this.myId;
        this._broadcast({ t: MSG.FLAG_PICK, by: this.myId, color: enemyColor });
      }
    }

    // Capture: if carrying enemy flag AND my own flag is at home AND I'm near
    // my own flag stand.
    if (this.player.hasEnemyFlag && this.flagState[myColor] === 'home') {
      const myFlagPos = this.world.flags[myColor];
      const d = Math.hypot(this.player.pos.x - myFlagPos.x - 0.5, this.player.pos.z - myFlagPos.z - 0.5);
      if (d < FLAG_HOME_RADIUS) {
        // Capture!
        this.player.hasEnemyFlag = false;
        this.scores[myColor]++;
        this._broadcast({ t: MSG.FLAG_CAP, by: this.myId, color: enemyColor });
        // Also broadcast the authoritative score.
        this._broadcast({ t: MSG.SCORE, scores: this.scores });
        this._returnFlag(enemyColor);
        this._updateScoreUi();
        this._killFeedPush(`${this._name(this.myId)} captured the ${enemyColor} flag!`);
        this._maybeTriggerAnagram();
      }
    }

    // Sync flag position visually if I'm carrying it.
    if (this.player.hasEnemyFlag) {
      this.flagPos[enemyColor] = { x: this.player.pos.x, y: this.player.pos.y, z: this.player.pos.z };
      this._syncFlagMesh(enemyColor);
    }
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
    m.position.set(p.x + 0.5, p.y - 1, p.z + 0.5);
  }

  // ---- anagram tiebreaker ---------------------------------------------

  _maybeTriggerAnagram() {
    if (this.gameOver) return;
    const { red, blue } = this.scores;
    if (Math.max(red, blue) < WIN_SCORE) return;
    if (red === blue) return;
    const winning = red > blue ? 'red' : 'blue';
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
    document.getElementById('health-fill').style.width = (this.player.hp) + '%';
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
