// Simple AI bot. Simulated locally by the host only; every other peer sees
// bots as normal RemotePlayers via the standard HELLO + STATE messages.
//
// AI behaviour:
//   * If not carrying a flag, path toward the enemy flag stand.
//   * If carrying the enemy flag, path back to own team's flag stand.
//   * When line-of-sight blocked, jitter direction slightly (no real
//     path-finding - fine for a small open CTF map).
//   * Shoot at any enemy player within cone-of-vision + range.

import * as THREE from 'three';
import { hasLineOfSight } from '../../../../web-engine/physics/lineOfSight.js';
import { stepBot }        from '../../../../web-engine/ai/botStep.js';

const NAMES = [
  'Bot-Buttercup', 'Bot-Hoof', 'Bot-Cluck', 'Bot-Trotter',
  'Bot-Fuzzy', 'Bot-Bramble', 'Bot-Dustpan', 'Bot-Waddles',
  'Bot-Mudflap', 'Bot-Rascal', 'Bot-Turnip', 'Bot-Bramblehat',
];
const CHARACTERS = ['cow', 'chicken', 'pig', 'sheep'];

const RANGE_SEE_ENEMY = 22;
const RANGE_FIRE_ENEMY = 18;
const FIRE_COOLDOWN = 0.9;

let _botId = 0;

export class Bot {
  static make({ team, world, seed }) {
    const id = `bot-${(seed ^ (++_botId << 5)).toString(36).slice(-6)}`;
    const character = CHARACTERS[(_botId + (team === 'red' ? 0 : 2)) % CHARACTERS.length];
    const name = NAMES[_botId % NAMES.length];
    return new Bot({ id, name, team, character, world });
  }

  constructor({ id, name, team, character, world }) {
    this.peerId = id;
    this.name = name;
    this.team = team;
    this.character = character;
    this.world = world;
    const spawn = world.spawns[team];
    this.pos   = new THREE.Vector3(spawn.x, spawn.y, spawn.z);
    this.yaw   = team === 'red' ? Math.PI / 4 : Math.PI + Math.PI / 4;
    this.pitch = 0;
    this.hp    = 100;
    this.alive = true;
    this.hasEnemyFlag = false;
    this._fireCd = FIRE_COOLDOWN + Math.random();
    // Path state shared with the pure web-engine/ai/botStep module.
    this._path = { pos: this.pos, yaw: this.yaw, wanderDir: { x: 1, z: 0 }, wanderT: 0 };
  }

  respawn() {
    const spawn = this.world.spawns[this.team];
    this.pos.set(spawn.x, spawn.y, spawn.z);
    this.hp = 100; this.alive = true; this.hasEnemyFlag = false;
    this._fireCd = FIRE_COOLDOWN;
  }

  // Called by host each frame. `game` provides:
  //   - grid (for basic solid checks)
  //   - flagPos { red, blue }, flagState
  //   - enemyPlayers (Array<{peerId, pos, team}>)
  //   - onShoot(botPeerId, origin, dir)  - report a shot
  //   - onFlagPickup(botPeerId, color)
  //   - onFlagCapture(botPeerId, color)
  update(dt, ctx) {
    if (!this.alive) return;

    const enemyColor = this.team === 'red' ? 'blue' : 'red';
    const myColor    = this.team;

    // Objective: pick up flag OR carry it home.
    let goal;
    if (this.hasEnemyFlag) {
      const f = ctx.world.flags[myColor];
      goal = new THREE.Vector3(f.x, this.pos.y, f.z);
    } else {
      const fp = ctx.flagPos[enemyColor];
      goal = new THREE.Vector3(fp.x, this.pos.y, fp.z);
    }

    // Movement + collision + turn: delegated to pure web-engine/ai/botStep
    // so it's node-testable without three.js. See docs/features/bot-pathing.md.
    this._path.yaw = this.yaw;
    stepBot(this._path, dt, ctx.grid, { x: goal.x, z: goal.z });
    this.yaw = this._path.yaw;
    // pos was mutated in-place by stepBot (same Vector3 reference).

    // Flag pickup / capture: host-side, delegate to game.
    if (!this.hasEnemyFlag && ctx.flagState[enemyColor] !== 'carried') {
      const fp = ctx.flagPos[enemyColor];
      const d = Math.hypot(this.pos.x - fp.x - 0.5, this.pos.z - fp.z - 0.5);
      if (d < 1.2) {
        this.hasEnemyFlag = true;
        ctx.onFlagPickup(this.peerId, enemyColor);
      }
    } else if (this.hasEnemyFlag && ctx.flagState[myColor] === 'home') {
      const myFlagPos = ctx.world.flags[myColor];
      const d = Math.hypot(this.pos.x - myFlagPos.x - 0.5, this.pos.z - myFlagPos.z - 0.5);
      if (d < 2.0) {
        this.hasEnemyFlag = false;
        ctx.onFlagCapture(this.peerId, enemyColor);
      }
    }

    // Shooting: look for closest enemy inside vision/range AND with a
    // clear line of sight through the voxel grid. Bots no longer shoot
    // through walls.
    this._fireCd -= dt;
    if (this._fireCd <= 0 && !this.hasEnemyFlag) {
      const enemy = pickClosestEnemy(this.pos, ctx.enemyPlayers, RANGE_SEE_ENEMY);
      if (enemy) {
        const d = enemy.pos.distanceTo(this.pos);
        if (d < RANGE_FIRE_ENEMY) {
          const eyeFrom = { x: this.pos.x, y: this.pos.y + 1.2, z: this.pos.z };
          const eyeTo   = { x: enemy.pos.x, y: enemy.pos.y + 1.0, z: enemy.pos.z };
          if (hasLineOfSight(ctx.grid, eyeFrom, eyeTo)) {
            const aim = enemy.pos.clone().sub(this.pos).normalize();
            this.yaw = Math.atan2(aim.x, aim.z);
            ctx.onShoot(this.peerId, this.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), aim);
            this._fireCd = FIRE_COOLDOWN + Math.random() * 0.4;
          }
        }
      }
    }
  }

  // Simulate taking damage locally on the host.
  takeDamage(dmg) {
    if (!this.alive) return false;
    this.hp -= dmg;
    if (this.hp <= 0) { this.alive = false; return true; }   // just died
    return false;
  }

  helloPacket() {
    return { t: 'hello', name: this.name, character: this.character, team: this.team };
  }
  statePacket() {
    return {
      t: 'state',
      p: [this.pos.x, this.pos.y, this.pos.z],
      y: this.yaw, x: this.pitch, h: this.hp,
      c: this.character, tm: this.team, hf: this.hasEnemyFlag,
    };
  }
}

function pickClosestEnemy(from, enemies, maxDist) {
  let best = null, bestD = maxDist;
  for (const e of enemies) {
    const d = e.pos.distanceTo(from);
    if (d < bestD) { bestD = d; best = e; }
  }
  return best;
}

