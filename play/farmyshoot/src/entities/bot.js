














import * as THREE from 'three';
import { laneFor, nextWaypoint, guardPost, nearestChoke }
  from '../../../../web-engine/ai/laneTactics.js';








import { acquireTarget, emptyAcquisition }
  from '../../../../web-engine/ai/targetAcquisition.js';
import { stepBot }        from '../../../../web-engine/ai/botStep.js';
import { botGoalFor }    from '../../../../web-engine/modes/objective.js';
import { dealRole, profileFor, closeDesire, offLeash, mayFire }
  from '../../../../web-engine/ai/botRoles.js';
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
  
  
  
  
  static make({ team, world, seed, taken = [], takenRoles = [] }) {
    const id = `bot-${(seed ^ (++_botId << 5)).toString(36).slice(-6)}`;
    const character = CHARACTERS[(_botId + (team === 'red' ? 0 : 2)) % CHARACTERS.length];
    const name = NAMES[_botId % NAMES.length];
    return new Bot({
      id, name, team, character, world,
      slot: pickSpawnSlot(taken),
      
      
      
      role: dealRole(takenRoles),
    });
  }

  constructor({ id, name, team, character, world, slot = null, role = 'rusher' }) {
    this.peerId = id;
    this.name = name;
    this.team = team;
    this.character = character;
    this.world = world;
    const spawn = world.spawns[team];
    this.peerId = id;                      
    
    
    this.spawnSlot = Number.isInteger(slot) ? slot : pickSpawnSlot([]);
    
    
    
    
    this.role = role;
    this.roleProfile = profileFor(role);
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
    
    
    
    
    this._aim = emptyAcquisition();
    
    
    
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
    
    
    this._aim = emptyAcquisition();
    
    
    
    
    
    this._path.waypoint = null;
    this._path.repathT = 0;
    this._path.wanderT = 0;
    this._path.stuckRef = null;
    this._path.stuckT = 0;
  }

  
  
  
  
  
  
  
  
  _laneSlot() {
    const s = String(this.peerId ?? '');
    let h = 0;
    for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  update(dt, ctx) {
    if (!this.alive) return;

    const enemyColor = this.team === 'red' ? 'blue' : 'red';
    const myColor    = this.team;

    
    
    this._tickPowerUp(ctx.now ?? Date.now());

    
    
    
    
    
    
    
    
    
    
    
    
    
    const modeGoal = botGoalFor(ctx.mode, {
      team: myColor,
      hasEnemyFlag: this.hasEnemyFlag,
      flagPos: ctx.flagPos,
      worldFlags: ctx.world?.flags,
      hillSpawn: ctx.world?.hillSpawn,
      nearestEnemyPos: nearestPos(this.pos, ctx.enemyPlayers),
    });
    
    
    const flagTarget = modeGoal.pos || this.pos;

    
    
    
    
    
    
    
    
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

    
    
    
    
    
    
    
    
    let gx = this.objective.x, gz = this.objective.z;

    
    
    
    
    
    
    
    
    
    
    
    const lanes = ctx.world?.lanes;
    if (lanes && lanes.length) {
      if (this.role === 'guard') {
        
        
        
        
        
        
        this._post = this._post || guardPost(lanes, this._laneSlot());
        if (this._post) { gx = this._post.x; gz = this._post.z; }
      } else {
        
        
        this._lane = this._lane || laneFor(lanes, this.peerId);
        
        
        const wp = nextWaypoint(lanes, this._lane, this.pos,
          { x: gx, z: gz }, this.team === 'red');
        if (wp) { gx = wp.x; gz = wp.z; }
      }
    }

    const foe = this._aim?.targetPos || nearestPos(this.pos, ctx.enemyPlayers);
    if (foe) {
      const dEnemy = Math.hypot(foe.x - this.pos.x, foe.z - this.pos.z);
      const desire = closeDesire(this.role, dEnemy);
      if (desire < 0) {
        
        
        const away = Math.hypot(this.pos.x - foe.x, this.pos.z - foe.z) || 1;
        const step = 8 * -desire;
        gx = this.pos.x + ((this.pos.x - foe.x) / away) * step;
        gz = this.pos.z + ((this.pos.z - foe.z) / away) * step;
      } else if (desire > 0 && this.roleProfile.engageRange > 8) {
        
        
        const toward = Math.max(dEnemy - this.roleProfile.engageRange, 0);
        const k = dEnemy ? toward / dEnemy : 0;
        gx = this.pos.x + (foe.x - this.pos.x) * k;
        gz = this.pos.z + (foe.z - this.pos.z) * k;
      }
    }
    
    
    
    
    
    
    
    const anchor = (this.role === 'guard' && this._post) ? this._post : this.objective;
    if (offLeash(this.role, Math.hypot(anchor.x - this.pos.x,
                                       anchor.z - this.pos.z))) {
      gx = anchor.x; gz = anchor.z;
    }
    const goal = new THREE.Vector3(gx, this.pos.y, gz);

    
    
    
    
    
    
    
    
    
    
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
    const acq = this.hasEnemyFlag
      ? { state: emptyAcquisition(), target: null, fire: false }
      : acquireTarget(this._aim, {
          grid: ctx.grid,
          self: this.pos,
          enemies: ctx.enemyPlayers,
          seeRange: RANGE_SEE_ENEMY,
          fireRange: RANGE_FIRE_ENEMY,
        });
    this._aim = acq.state;

    if (acq.fire && this._fireCd <= 0) {
      const enemy = acq.target;
      const aim = enemy.pos.clone().sub(this.pos).normalize();
      this.yaw = Math.atan2(aim.x, aim.z);
      ctx.onShoot(this.peerId, this.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), aim);
      
      
      
      
      this._fireCd = (FIRE_COOLDOWN + Math.random() * 0.4)
                   / fireRateMulFor(this.powerUp);
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









function nearestPos(from, enemies) {
  let best = null, bestD = Infinity;
  for (const e of enemies || []) {
    if (!e?.pos) continue;
    const d = e.pos.distanceTo ? e.pos.distanceTo(from)
      : Math.hypot(e.pos.x - from.x, e.pos.z - from.z);
    if (d < bestD) { bestD = d; best = e.pos; }
  }
  return best;
}
