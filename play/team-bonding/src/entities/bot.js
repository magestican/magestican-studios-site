












import * as THREE from 'three';
import { hasLineOfSight } from '../../../../web-engine/physics/lineOfSight.js';
import { stepBot }        from '../../../../web-engine/ai/botStep.js';
import { chooseObjective, OBJECTIVE_POWER_UP }
  from '../../../../web-engine/ai/objective.js';
import { spawnOffset, pickSpawnSlot }
  from '../../../../web-engine/movement/spawnScatter.js';
import {
  POWER_UPS, POWER_UP_MS, applyPowerUp, expirePowerUp, clearOnDeath,
  emptyPowerUpState, scaleFor, fireRateMulFor,
} from './powerUpSpec.js';

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
  
  
  
  
  static make({ team, world, seed, taken = [] }) {
    const id = `bot-${(seed ^ (++_botId << 5)).toString(36).slice(-6)}`;
    const character = CHARACTERS[(_botId + (team === 'red' ? 0 : 2)) % CHARACTERS.length];
    const name = NAMES[_botId % NAMES.length];
    return new Bot({ id, name, team, character, world, slot: pickSpawnSlot(taken) });
  }

  constructor({ id, name, team, character, world, slot = null }) {
    this.peerId = id;
    this.name = name;
    this.team = team;
    this.character = character;
    this.world = world;
    const spawn = world.spawns[team];
    this.peerId = id;                      
    
    
    this.spawnSlot = Number.isInteger(slot) ? slot : pickSpawnSlot([]);
    const off = this._spawnOffset();
    this.pos   = new THREE.Vector3(spawn.x + off.x, spawn.y, spawn.z + off.z);
    this.yaw   = team === 'red' ? Math.PI / 4 : Math.PI + Math.PI / 4;
    this.pitch = 0;
    this.hp    = 100;
    this.alive = true;
    this.hasEnemyFlag = false;
    
    
    
    
    this.sizeScale = 1;
    
    
    
    
    
    
    this.powerUp = emptyPowerUpState();
    this._fireCd = FIRE_COOLDOWN + Math.random();
    
    
    
    this._path = { pos: this.pos, yaw: this.yaw, wanderDir: { x: 1, z: 0 }, wanderT: 0 };
  }

  respawn() {
    const spawn = this.world.spawns[this.team];
    
    
    
    
    
    
    
    
    
    
    
    const spread = this._spawnOffset();
    this.pos.set(spawn.x + spread.x, spawn.y, spawn.z + spread.z);
    this.hp = 100; this.alive = true; this.hasEnemyFlag = false;
    
    
    
    this.powerUp = clearOnDeath();
    this.sizeScale = 1;
    this._fireCd = FIRE_COOLDOWN;
    
    
    
    
    
    this._path.waypoint = null;
    this._path.repathT = 0;
    this._path.wanderT = 0;
    this._path.stuckRef = null;
    this._path.stuckT = 0;
  }

  
  
  
  
  
  
  
  update(dt, ctx) {
    if (!this.alive) return;

    const enemyColor = this.team === 'red' ? 'blue' : 'red';
    const myColor    = this.team;

    
    
    this._tickPowerUp(ctx.now ?? Date.now());

    
    const flagTarget = this.hasEnemyFlag
      ? ctx.world.flags[myColor]
      : ctx.flagPos[enemyColor];

    
    
    
    
    
    
    
    
    this.objective = chooseObjective({
      self: {
        id: this.peerId, x: this.pos.x, z: this.pos.z,
        hp: this.hp, alive: this.alive,
        hasEnemyFlag: this.hasEnemyFlag,
        powerUpId: this.powerUp.id,
      },
      flag: { x: flagTarget.x, z: flagTarget.z },
      powerUps: ctx.powerUps ?? [],
      allies: ctx.allies ?? [],
    });

    const goal = new THREE.Vector3(this.objective.x, this.pos.y, this.objective.z);

    
    
    
    
    
    
    
    
    
    
    this._path.yaw = this.yaw;
    this._path.id = this.peerId;
    this._path.sizeScale = this.sizeScale;
    stepBot(this._path, dt, ctx.grid, { x: goal.x, z: goal.z },
            Math.random, ctx.bodies ?? null);
    this.yaw = this._path.yaw;
    

    
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
            
            
            
            
            this._fireCd = (FIRE_COOLDOWN + Math.random() * 0.4)
                         / fireRateMulFor(this.powerUp);
          }
        }
      }
    }
  }

  
  
  
  
  
  grantPowerUp(id, nowMs = Date.now()) {
    if (!POWER_UPS[id]) return false;
    this.powerUp = applyPowerUp(this.powerUp, id, nowMs);
    this.sizeScale = scaleFor(this.powerUp);
    return true;
  }

  
  
  
  _tickPowerUp(nowMs) {
    const { state } = expirePowerUp(this.powerUp, nowMs);
    this.powerUp = state;
    this.sizeScale = scaleFor(state);
  }

  powerUpRemainingMs(nowMs = Date.now()) {
    return this.powerUp.id ? Math.max(0, this.powerUp.endsAt - nowMs) : 0;
  }

  
  
  
  
  
  
  
  
  
  
  _spawnOffset() {
    if (this._spawnOff) return this._spawnOff;
    this._spawnOff = spawnOffset(this.spawnSlot);
    return this._spawnOff;
  }

  
  takeDamage(dmg) {
    if (!this.alive) return false;
    this.hp -= dmg;
    if (this.hp <= 0) { this.alive = false; return true; }   
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
      
      
      
      
      
      sc: this.sizeScale,
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

