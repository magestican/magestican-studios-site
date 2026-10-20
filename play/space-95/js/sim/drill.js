















import { boxFree } from './body.js';
import { JUMP_VELOCITY, STEP } from './constants.js';
import { launch } from './launch.js';

export const DRILL = Object.freeze({
  SIDE: 7.0, 
  UP: 5.0, 
  SPIN: 0.1, 
  TUBE_H: 1.5, 
  TUBE_W: 1.0, 
  BREACH: 0.75, 
  STAGGER: 0.25, 
  PUSH: 0.3, 
});

const EPS = 1e-7;


function state(p) {
  p.drill ??= { prev: false, held: 0, mode: null, dir: 0, cells: 0, downSaid: false };
  return p.drill;
}


function columnsAhead(world, p, dir, dx) {
  const T = world.tile;
  const front = p.x + (dir * p.w) / 2;
  const out = [];
  if (dir > 0) for (let c = Math.floor((front - EPS) / T) + 1; c <= Math.floor((front + dx - EPS) / T); c++) out.push(c);
  else for (let c = Math.floor((front + EPS) / T) - 1; c >= Math.floor((front - dx + EPS) / T); c--) out.push(c);
  return out;
}


function rowsAbove(world, p, dy) {
  const T = world.tile;
  const top = p.y + p.h;
  const out = [];
  for (let r = Math.floor((top - EPS) / T) + 1; r <= Math.floor((top + dy - EPS) / T); r++) out.push(r);
  return out;
}


const rock = (world, c, r) => world.solid(c, r) && !world.soil(c, r);


function rearm(p) {
  p.ab.usedDouble = false;
  p.ab.dashUsed = false;
}

function end(p, d, why) {
  if (d.mode)
    p.events.push({ type: 'drillEnd', dir: d.mode === 'up' ? 'up' : d.dir > 0 ? 'right' : 'left', cells: d.cells, why, x: p.x, y: p.y });
  d.mode = null;
  d.cells = 0;
  p.drilling = null;
}

function refuse(p, d, dirName, world) {
  end(p, d, 'rock');
  p.drillStagger = DRILL.STAGGER;
  p.vx = 0;
  if (dirName !== 'up') {
    const back = -(dirName === 'right' ? 1 : -1) * DRILL.PUSH;
    const moved = { ...p, x: p.x + back };
    if (boxFree(world, moved)) p.x += back;
  } else if (p.vy > 0) p.vy = 0;
  p.events.push({ type: 'drillRefuse', dir: dirName, x: p.x, y: p.y, signals: ['visual:sparks', 'audio:skreek'] });
}








export function drillStep(p, input, world, dir) {
  const d = state(p);
  const held = !!input.dash;
  const pressed = held && !d.prev;
  d.prev = held;
  d.held = held ? d.held + STEP : 0;
  if (!world.mutable) return false; 
  const T = world.tile;
  if (!held) {
    if (d.mode) end(p, d, 'release');
    return false;
  }
  const want = dir !== 0 ? (dir > 0 ? 'right' : 'left') : input.up ? 'up' : input.down ? 'down' : null;
  if (want === 'down') {
    if (pressed) {
      p.ab.prevDash = true; 
      p.events.push({ type: 'drillDown', x: p.x, y: p.y, signals: ['audio:whirr'] });
    }
    if (d.mode) end(p, d, 'turn');
    return false;
  }
  
  if (want === null) {
    if (d.mode === 'up') {
      p.vx = 0;
      p.vy = 0;
      p.ab.prevDash = true;
      p.drilling = 'brace';
      return true;
    }
    return false;
  }
  if (d.mode && ((d.mode === 'up') !== (want === 'up') || (d.mode === 'side' && d.dir !== dir))) end(p, d, 'turn');

  if (want === 'up') {
    p.ab.prevDash = true; 
    
    const cx = Math.round(p.x / T);
    
    
    const scan = (dy) => {
      let soil = false;
      let hard = false;
      for (const r of rowsAbove(world, p, dy))
        for (const c of [cx - 1, cx]) {
          if (world.soil(c, r)) soil = true;
          else if (rock(world, c, r)) hard = true;
        }
      return { soil, hard };
    };
    const near = scan(Math.max(DRILL.UP, p.vy) * STEP);
    const far = scan(Math.max(DRILL.UP, p.vy) * STEP + T);
    if (near.hard) {
      if (d.mode === 'up' || pressed || far.soil) {
        p.ab.prevDash = true;
        refuse(p, d, 'up', world); 
        return true;
      }
      return false;
    }
    if (!far.soil) {
      if (d.mode === 'up' && !far.hard) {
        
        const full = !!input.jump;
        end(p, d, 'breach');
        launch(p, full ? JUMP_VELOCITY : DRILL.BREACH * JUMP_VELOCITY, { cut: !full });
        rearm(p);
        p.ab.prevDash = true;
        p.events.push({ type: 'drillBreach', x: p.x, y: p.y, full });
        return true;
      }
      if (d.mode !== 'up') return false;
    }
    
    if (!d.mode) {
      const snapped = { ...p, x: cx * T };
      if (boxFree(world, snapped)) p.x = cx * T;
      d.mode = 'up';
      d.dir = 0;
      d.cells = 0;
      p.ab.dashT = 0;
      p.climbing = false;
      p.events.push({ type: 'drillStart', dir: 'up', x: p.x, y: p.y });
    }
    p.ab.prevDash = true;
    p.drilling = 'up';
    p.vx = 0;
    if (d.held < DRILL.SPIN - EPS) {
      p.vy = 0; 
      return true;
    }
    let n = 0;
    const cut = rowsAbove(world, p, DRILL.UP * STEP);
    for (const r of cut) for (const c of [cx - 1, cx]) if (world.breakSoil(c, r)) n++;
    if (n) {
      d.cells += n;
      p.events.push({ type: 'drillBore', dir: 'up', cells: n, total: d.cells, x: p.x, y: p.y });
    }
    p.vy = DRILL.UP;
    p.rising = false;
    p.grounded = false;
    return true;
  }

  
  const r0 = Math.round(p.y / T);
  
  
  const scan = (dx) => {
    let soil = false;
    let hard = false;
    for (const c of columnsAhead(world, p, dir, dx))
      for (let r = r0; r < r0 + 2; r++) {
        if (world.soil(c, r)) soil = true;
        else if (rock(world, c, r)) hard = true;
      }
    return { soil, hard };
  };
  
  const near = scan(DRILL.SIDE * STEP + (d.mode === 'side' ? 0 : pressed ? DRILL.PUSH + 0.1 : T * 0.25));
  const far = scan(DRILL.SIDE * STEP + T);
  if (near.hard) {
    if (d.mode === 'side' || pressed) {
      p.ab.prevDash = true;
      refuse(p, d, want, world); 
      return true;
    }
    return false;
  }
  
  if (d.mode === 'side' ? !far.soil && !far.hard : !near.soil) {
    if (d.mode === 'side') {
      
      end(p, d, 'exit');
      p.vx = dir * DRILL.SIDE;
      rearm(p);
    }
    return false;
  }
  if (!d.mode) {
    
    const snapped = { ...p, y: r0 * T };
    if (Math.abs(p.y - r0 * T) > EPS && boxFree(world, snapped)) p.y = r0 * T;
    d.mode = 'side';
    d.dir = dir;
    d.cells = 0;
    p.ab.dashT = 0;
    p.climbing = false;
    p.events.push({ type: 'drillStart', dir: want, x: p.x, y: p.y });
  }
  p.ab.prevDash = true;
  p.drilling = 'side';
  p.facing = dir;
  p.vy = 0;
  if (d.held < DRILL.SPIN - EPS) {
    p.vx = 0;
    return true;
  }
  let n = 0;
  for (const c of columnsAhead(world, p, dir, DRILL.SIDE * STEP)) for (let r = r0; r < r0 + 3; r++) if (world.breakSoil(c, r)) n++;
  if (n) {
    d.cells += n;
    p.events.push({ type: 'drillBore', dir: want, cells: n, total: d.cells, x: p.x, y: p.y });
  }
  p.vx = dir * DRILL.SIDE;
  return true;
}
