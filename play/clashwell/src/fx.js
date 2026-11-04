










import { HEIGHT, WIDTH, STONE } from '../../../web-engine/clashwell/well.js';
import { GEM, INK, OCHRE, PAPER, PERSIMMON, STONE_FILL, VERMILION } from './palette.js';

export const MAX_PARTICLES = 420;

export const FLASH_GAP_TICKS = 24;
export const MAX_FLASH_ALPHA = 0.35;

const CHAIN_STEP_TICKS = 14;
const DECAY = 0.9;
const TINY = 0.02;
const WORD_TICKS = 70;
const SEAL_WORD_TICKS = 100;
const KO_WORD_TICKS = 170;

export function createFx({ seed = 1, reduced = false } = {}) {
  let s;
  let rand = seed >>> 0;
  let nextId = 0;
  let lastFlash = -Infinity;

  const next = () => {
    rand = (Math.imul(rand, 1664525) + 1013904223) >>> 0;
    return rand / 4294967296;
  };
  const between = (a, b) => a + next() * (b - a);

  function reset() {
    s = {
      tick: 0,
      particles: [],
      rings: [],
      bolts: [],
      words: [],
      lines: 0,
      shake: 0,
      flash: 0,
      ko: null,
      wells: [{ jolt: 0, press: 0, bruise: 0 }, { jolt: 0, press: 0, bruise: 0 }],
    };
    lastFlash = -Infinity;
  }
  reset();

  const amount = (n) => (reduced ? Math.max(1, Math.round(n * 0.3)) : n);

  function particle(frame, kind, u, v, o) {
    s.particles.push({
      id: (nextId += 1), frame, kind, u, v, vx: 0, vy: 0, g: 0, drag: 0.97, rot: next() * 6.28, spin: 0, size: 0.2, left: 30, total: 30, wait: 0, ...o,
    });
  }

  function cap() {
    if (s.particles.length > MAX_PARTICLES) s.particles.splice(0, s.particles.length - MAX_PARTICLES);
  }

  function burst(frame, u, v, n, { speed = 0.25, colour = PAPER, size = 0.12, life = 26, g = 0.012, wait = 0, kind = 'spark' } = {}) {
    for (let i = 0, count = amount(n); i < count; i += 1) {
      const angle = next() * Math.PI * 2;
      const pace = speed * between(0.35, 1);
      const left = Math.round(life * between(0.7, 1.2));
      particle(frame, kind, u, v, {
        vx: Math.cos(angle) * pace, vy: Math.sin(angle) * pace, g, size: size * between(0.7, 1.3), colour, left, total: left, wait,
      });
    }
  }

  function shards(frame, x, y, gem, n, { wait = 0, lift = 0.1, speed = 0.14 } = {}) {
    for (let i = 0; i < n; i += 1) {
      const left = Math.round(between(30, 52));
      particle(frame, 'shard', x + between(-0.4, 0.4), y + between(-0.4, 0.4), {
        gem, vx: between(-speed, speed), vy: between(-speed - lift, speed * 0.3 - lift), g: 0.016, size: between(0.2, 0.42), spin: between(-0.3, 0.3), left, total: left, wait,
      });
    }
  }

  const ring = (frame, u, v, r, grow, colour, life, wide = 0.18, wait = 0) => s.rings.push({ frame, u, v, r, grow, colour, left: life, total: life, wide, wait });
  const bolt = (from, to, colour, wide, life = 10) => s.bolts.push({ from, to, colour, wide, left: life, total: life });

  function word(text, frame, { colour = PAPER, size = 1, seal = false, life = seal ? SEAL_WORD_TICKS : WORD_TICKS, wait = 0 } = {}) {
    s.words.push({ text, frame, colour, size, seal, left: life, total: life, wait });
  }

  function shake(n) {
    if (!reduced) s.shake = Math.max(s.shake, n);
  }
  function focus(n) {
    if (!reduced) s.lines = Math.max(s.lines, n);
  }
  function flash(alpha) {
    if (reduced || s.tick - lastFlash < FLASH_GAP_TICKS) return;
    lastFlash = s.tick;
    s.flash = Math.min(MAX_FLASH_ALPHA, alpha);
  }
  function jolt(seat, n) {
    if (!reduced) s.wells[seat].jolt = Math.max(s.wells[seat].jolt, n);
  }
  function press(seat, n) {
    if (!reduced) s.wells[seat].press = Math.max(s.wells[seat].press, n);
  }
  const bruise = (seat, n) => { s.wells[seat].bruise = Math.max(s.wells[seat].bruise, n); };

  const rowOf = (y) => HEIGHT - 1 - y + 0.5;

  function onLock(e, words) {
    const seat = e.player;
    press(seat, e.steps.length ? 0.22 : 0.09);
    for (const [x, y] of e.placed ?? []) {
      if (y < HEIGHT) burst(seat, x + 0.5, rowOf(y) + 0.45, 2, { speed: 0.06, colour: PAPER, size: 0.1, life: 14, g: -0.001, kind: 'dust' });
    }
    e.steps.forEach((step, i) => {
      const wait = i * CHAIN_STEP_TICKS;
      let [sumX, sumY] = [0, 0];
      const rows = new Map();
      for (const [x, y, gem] of step.cleared) {
        sumX += x;
        sumY += y;
        if (y >= HEIGHT) continue;
        shards(seat, x + 0.5, rowOf(y), gem, reduced ? 1 : 2 + Math.min(i, 2), { wait });
        rows.set(y, (rows.get(y) ?? 0) + 1);
      }
      for (const [y, n] of rows) {
        if (n === WIDTH) particle(seat, 'band', WIDTH / 2, rowOf(y), { left: 12, total: 12, wait, size: 1 });
      }
      const n = step.cleared.length || 1;
      const [cx, cy] = [sumX / n + 0.5, rowOf(sumY / n)];
      ring(seat, cx, cy, 0.5, 0.18 + i * 0.05, i ? OCHRE : PAPER, 20 + i * 4, 0.16 + i * 0.05, wait);
      if (i > 0) {
        burst(seat, cx, cy, 8 + i * 6, { speed: 0.26 + i * 0.05, colour: OCHRE, wait });
        word(words.chain(i + 1), seat, { colour: OCHRE, size: 1 + i * 0.25, wait, seal: i >= 2 });
      }
    });
  }

  function onFire(e, words) {
    const heavy = e.kind === 'heavy';
    const colour = heavy ? PERSIMMON : OCHRE;
    bolt(e.from, 'stage', colour, heavy ? 0.7 : 0.4, 12);
    press(e.from, heavy ? 0.3 : 0.16);
    burst(e.from, WIDTH / 2, 0.5, heavy ? 12 : 6, { speed: 0.3, colour });
    word(`${heavy ? words.combo : words.jab} ${e.stones}`, e.from, { colour });
  }

  function onLand(e, words) {
    const heavy = e.kind === 'heavy';
    const weight = Math.min(1, 0.25 + e.stones * 0.1 + (heavy ? 0.2 : 0));
    bolt('stage', e.to, heavy ? PERSIMMON : OCHRE, heavy ? 0.9 : 0.5, 9);
    jolt(e.to, 0.25 + weight * 0.5);
    bruise(e.to, 0.3 + weight * 0.35);
    if (heavy) shake(0.3 * weight);
    const [x, y] = [WIDTH / 2, HEIGHT - 2];
    burst(e.to, x, y, 12 + Math.round(weight * 22), { speed: 0.42, colour: PAPER, life: 24, size: 0.14 });
    burst(e.to, x, y, 6 + Math.round(weight * 12), { speed: 0.3, colour: VERMILION, life: 30, size: 0.16 });
    ring(e.to, x, y, 0.6, 0.45, PAPER, 18, 0.3);
    word(words.hit, e.to, { colour: PAPER, size: heavy ? 1.3 : 1, seal: heavy });
  }

  function onRise(e) {
    press(e.player, 0.16);
    for (let x = 0; x < WIDTH; x += 1) burst(e.player, x + 0.5, HEIGHT - 0.2, 2, { speed: 0.09, colour: STONE_FILL, size: 0.14, life: 20, g: -0.002, kind: 'dust' });
  }

  function onClash(e, words) {
    focus(1);
    shake(0.9);
    flash(0.3);
    ring('field', 0, 0, 0.8, 0.8, PAPER, 26, 0.5);
    ring('field', 0, 0, 0.3, 0.5, OCHRE, 34, 0.3);
    for (const colour of [OCHRE, PERSIMMON, PAPER]) burst('field', 0, 0, 16, { speed: 0.85, colour, life: 34, size: 0.15, g: 0.01 });
    if (e.winner !== null) {
      const loser = 1 - e.winner;
      bolt('stage', loser, PERSIMMON, 0.8, 14);
      jolt(loser, 0.5);
      bruise(loser, 0.5);
    }
    word(e.winner === null ? words.draw : words.clash, 'field', { colour: PAPER, seal: true, size: 1.2 });
  }

  function onRound(e, view, words) {
    if (e.winner === null) return;
    const loser = 1 - e.winner;
    s.ko = loser;
    focus(1);
    shake(1.2);
    flash(0.35);
    jolt(loser, 1);
    bruise(loser, 0.8);
    const well = view.players[loser].well;
    let gems = 0;
    for (let y = 0; y < HEIGHT; y += 1) for (const c of well[y]) if (c) gems += 1;
    const each = reduced || gems > 110 ? 1 : 2;
    for (let y = 0; y < HEIGHT; y += 1) {
      for (let x = 0; x < WIDTH; x += 1) {
        const c = well[y][x];
        if (c) shards(loser, x + 0.5, rowOf(y), c, each, { lift: 0.12, speed: 0.24, wait: reduced ? 0 : Math.floor(y * 0.8) });
      }
    }
    
    
    for (let i = 0, n = amount(26); i < n; i += 1) {
      const angle = next() * Math.PI * 2;
      const pace = between(0.08, 0.5);
      particle(loser, 'ink', WIDTH / 2, HEIGHT * 0.45, { vx: Math.cos(angle) * pace, vy: Math.sin(angle) * pace, drag: 0.92, g: 0.003, size: between(0.05, 0.16), left: 90, total: 90, colour: VERMILION });
    }
    ring(loser, WIDTH / 2, HEIGHT / 2, 1, 0.9, VERMILION, 40, 0.5);
    word(words.ko, loser, { seal: true, size: 1.5, life: KO_WORD_TICKS });
  }

  function onSqueeze(e, words) {
    for (const seat of [0, 1]) {
      bruise(seat, 0.25);
      for (let x = 0; x < WIDTH; x += 1) burst(seat, x + 0.5, 0.2, 1, { speed: 0.05, colour: PAPER, size: 0.1, life: 50, g: 0.006, kind: 'dust' });
    }
    word(words.squeeze, 'field', { colour: PERSIMMON });
  }

  function on(e, view, words) {
    if (e.type === 'lock') onLock(e, words);
    else if (e.type === 'fire') onFire(e, words);
    else if (e.type === 'land') onLand(e, words);
    else if (e.type === 'rise') onRise(e);
    else if (e.type === 'clash') onClash(e, words);
    else if (e.type === 'round') onRound(e, view, words);
    else if (e.type === 'squeeze') onSqueeze(e, words);
    else if (e.type === 'start') s.ko = null;
    cap();
  }

  
  function age(list, move) {
    let keep = 0;
    for (const item of list) {
      if (item.wait > 0) {
        item.wait -= 1;
      } else {
        item.left -= 1;
        if (item.left <= 0) continue;
        move?.(item);
      }
      list[keep] = item;
      keep += 1;
    }
    list.length = keep;
  }

  const fade = (x) => { const y = x * DECAY; return y < TINY ? 0 : y; };

  function moveParticle(p) {
    p.vy += p.g;
    p.vx *= p.drag;
    p.u += p.vx;
    p.v += p.vy;
    p.rot += p.spin;
  }

  function step(ticks = 1) {
    for (let i = 0; i < ticks; i += 1) {
      s.tick += 1;
      age(s.particles, moveParticle);
      age(s.rings, (r) => { r.r += r.grow; r.grow *= 0.95; });
      age(s.bolts);
      age(s.words);
      s.lines = fade(s.lines);
      s.shake = fade(s.shake);
      s.flash = fade(s.flash);
      for (const well of s.wells) {
        well.jolt = fade(well.jolt);
        well.press = fade(well.press);
        well.bruise = well.bruise * 0.97 < TINY ? 0 : well.bruise * 0.97;
      }
    }
  }

  return {
    on,
    step,
    reset,
    word,
    get state() { return s; },
  };
}




export function meetingPoint(layout) {
  if (layout.wide && layout.stage) return { x: layout.stage.x + layout.stage.w / 2, y: layout.stage.y + layout.stage.h * 0.42 };
  const big = layout.wells[0].cell >= layout.wells[1].cell ? layout.wells[0] : layout.wells[1];
  return { x: big.x + big.w, y: big.y + big.h * 0.42 };
}

const unitOf = (layout) => Math.max(layout.wells[0].cell, layout.wells[1].cell);

function frameOf(layout, frame) {
  if (frame === 'field') {
    const { x, y } = meetingPoint(layout);
    return { x, y, scale: unitOf(layout) };
  }
  const box = layout.wells[frame];
  return { x: box.x, y: box.y, scale: box.cell };
}

function placeOf(layout, where) {
  if (where === 'stage') {
    const { x, y } = meetingPoint(layout);
    return { x, y };
  }
  const box = layout.wells[where];
  return { x: box.x + box.w / 2, y: box.y + box.h * 0.45 };
}


export function shakeOffset(state, layout) {
  if (!state.shake) return { x: 0, y: 0 };
  const a = state.shake * unitOf(layout) * 0.7;
  return { x: Math.sin(state.tick * 1.9) * a, y: Math.cos(state.tick * 2.7) * a };
}


export function wellOffset(state, layout, seat) {
  const w = state.wells[seat];
  const cell = layout.wells[seat].cell;
  return { x: Math.sin(state.tick * 2.3) * w.jolt * cell * 0.8, y: w.press * cell };
}

function drawFocusLines(ctx, size, layout, state) {
  const { x, y } = meetingPoint(layout);
  const reach = Math.hypot(size.width, size.height);
  const inner = unitOf(layout) * 3.2;
  ctx.save();
  ctx.globalAlpha = Math.min(0.75, state.lines);
  ctx.fillStyle = PAPER;
  for (let i = 0; i < 44; i += 1) {
    
    const angle = (i / 44) * Math.PI * 2 + Math.sin(i * 12.9898 + state.tick * 0.4) * 0.05;
    const half = 0.008 + (Math.abs(Math.sin(i * 78.233)) * 0.016);
    const start = inner * (1 + Math.abs(Math.sin(i * 4.1)) * 0.7);
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * start, y + Math.sin(angle) * start);
    ctx.lineTo(x + Math.cos(angle - half) * reach, y + Math.sin(angle - half) * reach);
    ctx.lineTo(x + Math.cos(angle + half) * reach, y + Math.sin(angle + half) * reach);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawBruise(ctx, box, alpha) {
  const glow = ctx.createRadialGradient(box.x + box.w / 2, box.y + box.h / 2, Math.min(box.w, box.h) * 0.25, box.x + box.w / 2, box.y + box.h / 2, Math.max(box.w, box.h) * 0.65);
  glow.addColorStop(0, 'rgba(200,50,31,0)');
  glow.addColorStop(1, `rgba(200,50,31,${Math.min(0.75, alpha)})`);
  ctx.fillStyle = glow;
  ctx.fillRect(box.x, box.y, box.w, box.h);
}

function drawBolt(ctx, layout, b) {
  const from = placeOf(layout, b.from);
  const to = placeOf(layout, b.to);
  const t = 1 - b.left / b.total;
  const head = Math.min(1, t * 1.4);
  const tail = Math.max(0, t * 1.4 - 0.45);
  const at = (n) => ({ x: from.x + (to.x - from.x) * n, y: from.y + (to.y - from.y) * n });
  const [a, c] = [at(tail), at(head)];
  const wide = b.wide * unitOf(layout);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = b.colour;
  ctx.lineWidth = wide;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(c.x, c.y);
  ctx.stroke();
  ctx.strokeStyle = PAPER;
  ctx.lineWidth = wide * 0.35;
  ctx.stroke();
  ctx.restore();
}

function drawParticle(ctx, layout, p) {
  const f = frameOf(layout, p.frame);
  const x = f.x + p.u * f.scale;
  const y = f.y + p.v * f.scale;
  const size = p.size * f.scale;
  const life = p.left / p.total;
  ctx.globalAlpha = Math.min(1, life * 2.2);
  if (p.kind === 'shard') {
    const gem = p.gem === STONE ? null : GEM[p.gem];
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(p.rot);
    ctx.fillStyle = gem ? gem.fill : STONE_FILL;
    ctx.beginPath();
    ctx.moveTo(-size, -size * 0.6);
    ctx.lineTo(size * 0.9, -size * 0.8);
    ctx.lineTo(size * 0.5, size * 0.8);
    ctx.lineTo(-size * 0.7, size * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(-size * 0.4, -size * 0.45, size * 0.6, size * 0.28);
    ctx.restore();
  } else if (p.kind === 'band') {
    const box = layout.wells[p.frame];
    ctx.fillStyle = PAPER;
    ctx.fillRect(box.x, y - (f.scale * life) / 2, box.w, f.scale * life);
  } else if (p.kind === 'ink') {
    ctx.fillStyle = p.colour;
    ctx.globalAlpha = Math.min(0.85, life * 1.6);
    ctx.beginPath();
    
    ctx.ellipse(x, y, size * 1.7, size * 0.7, Math.atan2(p.vy, p.vx), 0, Math.PI * 2);
    ctx.fill();
  } else if (p.kind === 'dust') {
    ctx.fillStyle = p.colour;
    ctx.globalAlpha *= 0.6;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.5, size * (1.6 - life)), 0, Math.PI * 2);
    ctx.fill();
  } else {
    
    ctx.strokeStyle = p.colour;
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(1, size);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - p.vx * f.scale * 2.2, y - p.vy * f.scale * 2.2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawRing(ctx, layout, r) {
  const f = frameOf(layout, r.frame);
  const life = r.left / r.total;
  ctx.globalAlpha = Math.min(1, life * 1.5);
  ctx.strokeStyle = r.colour;
  ctx.lineWidth = Math.max(1, r.wide * f.scale * life);
  ctx.beginPath();
  ctx.arc(f.x + r.u * f.scale, f.y + r.v * f.scale, r.r * f.scale, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

const STAMP_FONT = "900 {s}px 'Yu Mincho', 'Hiragino Mincho ProN', 'Noto Serif JP', Georgia, 'Times New Roman', serif";


function drawWord(ctx, size, layout, w, slot) {
  const field = w.frame === 'field';
  const box = field ? null : layout.wells[w.frame];
  const room = field ? size.width - 32 : box.w;
  const point = field ? meetingPoint(layout) : { x: box.x + box.w / 2, y: box.y + box.h * 0.32 };
  
  const seen = Math.min(w.total - w.left, 8) / 8;
  const slam = 1 + (1 - seen) * 0.8;
  const px = Math.min(field ? 76 : 56, room / (field ? 5 : 4.2)) * w.size * (w.seal ? 1 : 0.72);
  ctx.save();
  ctx.font = STAMP_FONT.replace('{s}', Math.round(px));
  const textW = ctx.measureText(w.text).width;
  const halfW = textW / 2 + px * 0.42;
  const x = field ? Math.max(16 + halfW, Math.min(size.width - 16 - halfW, point.x)) : point.x;
  const y = point.y + slot * px * 1.3 - (w.seal ? 0 : (1 - w.left / w.total) * px * 0.7);
  ctx.translate(x, y);
  ctx.scale(slam, slam);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.globalAlpha = Math.min(1, (w.left / w.total) * 4);
  if (w.seal) {
    ctx.rotate(-0.05);
    ctx.fillStyle = VERMILION;
    ctx.beginPath();
    ctx.roundRect(-halfW, -px * 0.78, halfW * 2, px * 1.56, px * 0.14);
    ctx.fill();
    ctx.strokeStyle = PAPER;
    ctx.lineWidth = Math.max(2, px * 0.05);
    ctx.beginPath();
    ctx.roundRect(-halfW + px * 0.12, -px * 0.66, halfW * 2 - px * 0.24, px * 1.32, px * 0.08);
    ctx.stroke();
    ctx.fillStyle = PAPER;
    ctx.fillText(w.text, 0, px * 0.04);
  } else {
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3, px / 5);
    ctx.strokeStyle = INK;
    ctx.fillStyle = w.colour;
    ctx.strokeText(w.text, 0, 0);
    ctx.fillText(w.text, 0, 0);
  }
  ctx.restore();
}


export function drawFx(ctx, size, layout, state) {
  if (state.lines) drawFocusLines(ctx, size, layout, state);
  for (const seat of [0, 1]) {
    if (state.wells[seat].bruise) drawBruise(ctx, layout.wells[seat], state.wells[seat].bruise);
  }
  for (const r of state.rings) if (!r.wait) drawRing(ctx, layout, r);
  for (const b of state.bolts) drawBolt(ctx, layout, b);
  for (const p of state.particles) if (!p.wait) drawParticle(ctx, layout, p);
  const slots = new Map();
  for (const w of state.words) {
    if (w.wait) continue;
    const slot = slots.get(w.frame) ?? 0;
    slots.set(w.frame, slot + 1);
    drawWord(ctx, size, layout, w, slot);
  }
  if (state.flash) {
    ctx.fillStyle = `rgba(241,228,200,${state.flash})`;
    ctx.fillRect(0, 0, size.width, size.height);
  }
}
