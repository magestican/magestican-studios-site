















import { HITSTOP_BOSS, hurtPlayer, stompBounce } from '../combat.js';
import { STEP } from '../constants.js';
import { overlaps, registerKind } from '../entities.js';


const TYPES = {};


export function registerBossType(type, impl) {
  TYPES[type] = impl;
}

const HIT_IMMUNE = 0.8; 
const INTRO_TIME = 1.2;


const clodOn = (e, ctx) => ctx.session.entities.some((c) => c.kind === 'clod' && c.alive && c.state === 'fall' && overlaps(c, e));
const poundOn = (e, ctx) => ctx.player.ab?.pound === 'fall' && overlaps(ctx.player, e); 

function enterPhase(e, ctx, i) {
  
  const spawn = e.phases[i].spawn;
  if (spawn) ctx.session.respawnAt = { ...spawn };
  e.phaseHearts = ctx.session.hearts; 
  e.phaseHurt = false;
  e.phase = i;
  e.hp = e.phases[i].hp;
  e.attackIdx = 0;
  e.stage = 'intro';
  e.t = 0;
  e.endActive = false;
  e.recoverFor = undefined;
  e.weakNow = undefined;
  ctx.events.push({ type: 'bossPhase', id: e.id, phase: i, name: e.phases[i].name });
}

registerKind('boss', {
  create(e) {
    e.w = e.w ?? 2.4;
    e.h = e.h ?? 1.8;
    e.phase = e.startPhase ?? 0;
    e.hp = e.phases[e.phase].hp;
    e.attackIdx = 0;
    e.stage = 'dormant';
    e.engaged = false;
    e.deathsSeen = 0;
    TYPES[e.type]?.create?.(e);
  },
  step(e, ctx) {
    const s = ctx.session;
    const p = ctx.player;
    const impl = TYPES[e.type];
    if (e.stage === 'defeated') return;
    if (e.stage === 'escaped') {
      impl.escape?.(e, ctx); 
      return;
    }
    if (!e.engaged) {
      if (p.x < e.arena.x0 || p.x > e.arena.x1) return;
      if (e.arena.y0 !== undefined && e.arena.y1 !== undefined && (p.y < e.arena.y0 || p.y > e.arena.y1)) return;
      e.engaged = true;
      e.deathsSeen = s.deaths;
      enterPhase(e, ctx, e.phase);
      ctx.events.push({ type: 'bossIntro', id: e.id, name: e.name });
      return;
    }
    
    if (s.deaths !== e.deathsSeen) {
      e.deathsSeen = s.deaths;
      enterPhase(e, ctx, e.phase);
      ctx.events.push({ type: 'bossRetry', id: e.id, phase: e.phase });
      return;
    }
    const ph = e.phases[e.phase];
    const atk = ph.attacks[e.attackIdx % ph.attacks.length];
    
    
    if (s.hearts < e.phaseHearts) e.phaseHurt = true;
    
    
    if (e.stage === 'intro' && e.t >= INTRO_TIME) {
      e.stage = 'telegraph';
      e.t = 0;
      ctx.events.push({ type: 'telegraph', id: e.id, attack: atk.name, seconds: atk.telegraph, x: e.x, y: e.y });
    } else if (e.stage === 'telegraph' && e.t >= atk.telegraph) {
      e.stage = 'active';
      e.t = 0;
      e.endActive = false;
      ctx.events.push({ type: 'bossAttack', id: e.id, attack: atk.name });
    } else if (e.stage === 'active' && (e.t >= atk.active || e.endActive)) {
      e.stage = 'recover';
      e.t = 0;
      e.endActive = false;
      ctx.events.push({ type: 'bossRecover', id: e.id, attack: atk.name });
    } else if (e.stage === 'recover' && e.t >= (e.recoverFor ?? atk.recover)) {
      e.recoverFor = undefined;
      e.weakNow = undefined;
      e.attackIdx += 1;
      const next = ph.attacks[e.attackIdx % ph.attacks.length];
      e.stage = 'telegraph';
      e.t = 0;
      ctx.events.push({ type: 'telegraph', id: e.id, attack: next.name, seconds: next.telegraph, x: e.x, y: e.y });
    }
    
    if (e.stage !== 'intro') impl.attack(e, ctx, ph.attacks[e.attackIdx % ph.attacks.length], e.stage);
    
    e.x = Math.max(e.arena.x0 + e.w / 2, Math.min(e.arena.x1 - e.w / 2, e.x));
    if (e.flies) e.y = Math.max(e.arena.y0 - e.h, Math.min(e.arena.y1 - e.h, e.y)); 

    
    if (e.immune > 0) e.immune -= STEP;
    
    
    let how = impl.hit(e, ctx);
    const weakWindow = e.stage === 'recover' && e.weakNow !== false;
    if (!how && weakWindow && clodOn(e, ctx)) how = 'cave-in';
    if (!how && poundOn(e, ctx)) {
      if (weakWindow && ph.weakness === 'pound') how = 'pound';
      else {
        stompBounce(ctx.player);
        ctx.player.ab.pound = null;
      }
    }
    if (how && how === ph.weakness && !(e.immune > 0)) {
      e.immune = HIT_IMMUNE;
      e.hp -= 1;
      s.hitstop = Math.max(s.hitstop, HITSTOP_BOSS);
      ctx.events.push({ type: 'bossHit', id: e.id, hp: e.hp, phase: e.phase, how, x: e.x, y: e.y });
      if (e.hp <= 0) {
        
        if (ph.deed && !e.phaseHurt) {
          for (const x of s.entities) if (x.id === ph.deed) x.alive = true;
          ctx.events.push({ type: 'deedEarned', id: e.id, deed: ph.deed, phase: e.phase });
        }
        if (e.phase + 1 < e.phases.length) enterPhase(e, ctx, e.phase + 1);
        else if (e.escape) {
          
          e.stage = 'escaped';
          e.t = 0;
          ctx.events.push({ type: 'bossEscape', id: e.id, x: e.x, y: e.y });
          for (const x of s.entities) if (x.kind === 'finish' && x.bossGate === e.id) x.alive = true;
        } else {
          e.stage = 'defeated';
          ctx.events.push({ type: 'bossDefeat', id: e.id, x: e.x, y: e.y });
          for (const x of s.entities) if (x.kind === 'finish' && x.bossGate === e.id) x.alive = true;
        }
      } else {
        e.stage = 'recover'; 
        e.t = 0;
      }
      return;
    }
    
    if (!e.harmless && !weakWindow && overlaps(p, e)) hurtPlayer(s, e.x);
  },
});
