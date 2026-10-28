



import { COMBOS } from './game.js';
import { COMBO_SHAPES, MAGIC, SPELLS } from './spells.js';

export const MAX_PARTICLES = 420; 








function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Effects {
  
  constructor(seed = 1, max = MAX_PARTICLES) {
    this.rand = rng(seed);
    this.max = max;
    
    this.particles = [];
    
    this.rings = [];
    this.flowAcc = 0; 
  }

  
  
  setMax(max) {
    this.max = max;
    if (this.particles.length > max) this.particles.splice(0, this.particles.length - max);
  }

  add(p) {
    if (this.particles.length >= this.max) this.particles.shift();
    this.particles.push({ vx: 0, vy: 0, g: 0, life: 1.4, age: 0, size: 40, rot: 0, spin: 0, wobble: 0, ...p });
  }

  



  trigger(ev, costume, stage) {
    const r = this.rand;
    const u = stage.unit;
    const between = (a, b) => a + (b - a) * r();
    if (ev.type === 'nearly') {
      for (let i = 0; i < 4; i++)
        this.add({
          kind: 'sparkle',
          x: stage.centre.x + between(-0.8, 0.8) * u,
          y: stage.centre.y + between(-1, 0.3) * u,
          vy: -0.4 * u,
          size: 0.22 * u,
          life: 0.7,
        });
      return;
    }
    if (ev.type !== 'hit' && ev.type !== 'step') return;
    const book = SPELLS[costume] ?? SPELLS.wizard;
    const magic = MAGIC[costume] ?? MAGIC.wizard;
    const spell = book[ev.move ?? ''];
    const k = (ev.power ? 2 : 1) * (ev.finale ? 1.5 : 1) * (ev.type === 'step' ? 0.5 : 1);
    const n = (base) => Math.max(1, Math.round(base * k));
    const big = ev.power ? 1.35 : 1;
    const at = ev.at?.length ? ev.at : [stage.centre];
    const combo = typeof ev.spell === 'string' ? COMBO_SHAPES[ev.spell] : undefined;
    const first = combo && book[COMBOS.find((x) => x.id === ev.spell)?.first ?? ''];
    if (combo && spell) {
      
      const kinds = [...new Set([...(first?.kinds ?? []), ...spell.kinds])];
      
      this.rings.push({ x: at[0].x, y: at[0].y, r0: 0.5 * u, r1: 3.2 * u, life: 0.7, age: 0, colour: magic.light });
      for (const shape of combo)
        this.cast({ shape, kinds }, { at, from: at[0], stage, u, n, big: Math.max(big, 1.35), between, light: magic.light });
    } else if (spell) this.cast(spell, { at, from: at[0], stage, u, n, big, between, light: spell.light ?? magic.light });
    
    if (ev.power)
      for (let i = 0; i < n(6); i++)
        this.add({
          kind: magic.signature,
          x: between(0.1, 0.9) * stage.width,
          y: stage.ground,
          vx: between(-0.3, 0.3) * u,
          vy: -between(2.5, 4) * u,
          size: 0.5 * u,
          life: 1.6,
          spin: between(-2, 2),
        });
  }

  






  cast(spell, { at, from, stage, u, n, big, between, light }) {
    const kinds = spell.kinds;
    const kind = (i) => kinds[i % kinds.length];
    const gravity = 4.5 * u * (spell.g ?? 1);
    
    const side = Math.sign(from.x - stage.centre.x) || 1;
    switch (spell.shape) {
      case 'fountain': 
        for (const h of at)
          for (let i = 0; i < n(8); i++)
            this.add({
              kind: kind(i),
              x: h.x + between(-0.12, 0.12) * u,
              y: h.y,
              vx: between(-0.35, 0.35) * u,
              vy: -between(2.2, 3.4) * u,
              size: between(0.35, 0.6) * u * big,
              life: between(0.8, 1.3),
              spin: between(-2, 2),
            });
        break;
      case 'burst': {
        
        const m = n(14);
        for (let i = 0; i < m; i++) {
          const a = (i / m) * Math.PI * 2;
          const v = between(1.8, 2.8) * u;
          this.add({
            kind: kind(i),
            x: from.x,
            y: from.y,
            vx: Math.cos(a) * v,
            vy: Math.sin(a) * v,
            size: between(0.3, 0.5) * u * big,
            life: 1.2,
            spin: between(-4, 4),
          });
        }
        this.rings.push({ x: from.x, y: from.y, r0: 0.3 * u, r1: 2.4 * u * big, life: 0.6, age: 0, colour: light });
        break;
      }
      case 'swarm': 
        for (let i = 0; i < n(kinds.length > 1 ? 6 : 4); i++) {
          const left = i % 2 === 0;
          this.add({
            kind: kind(Math.floor(i / 2)),
            x: left ? -0.4 * u : stage.width + 0.4 * u,
            y: stage.centre.y + between(-1.4, 0.4) * u,
            vx: (left ? 1 : -1) * between(1.6, 2.2) * u,
            vy: between(-0.2, 0.2) * u,
            size: 0.55 * u * big,
            life: 2.2,
            wobble: between(3, 6),
          });
        }
        break;
      case 'shock': 
        this.rings.push({ x: stage.centre.x, y: stage.ground, r0: 0.4 * u, r1: 3 * u * big, life: 0.7, age: 0, colour: light });
        for (let i = 0; i < n(10); i++)
          this.add({
            kind: kind(i),
            x: stage.centre.x + between(-1.2, 1.2) * u,
            y: stage.ground,
            vx: between(-0.6, 0.6) * u,
            vy: -between(2.4, 3.6) * u,
            g: gravity,
            size: 0.32 * u * big,
            life: 1.4,
            spin: between(-6, 6),
          });
        break;
      case 'rise': {
        
        const thrown = spell.g != null;
        for (let i = 0; i < n(12); i++)
          this.add({
            kind: kind(i),
            x: stage.centre.x + between(-1.1, 1.1) * u,
            y: stage.ground - between(0, 0.4) * u,
            vx: between(-0.15, 0.15) * u,
            vy: -(thrown ? between(1.6, 2.4) : between(0.6, 1.3)) * u,
            g: thrown ? gravity : 0,
            size: between(0.22, 0.45) * u * big,
            life: thrown ? 2.6 : between(1.4, 2.2),
            wobble: between(2, 5),
          });
        break;
      }
      case 'orbit': 
        for (let i = 0; i < n(18); i++)
          this.add({
            kind: kind(i),
            x: from.x,
            y: from.y,
            size: between(0.18, 0.35) * u * big,
            life: 1.6,
            orbit: {
              cx: from.x,
              cy: from.y + 1.2 * u,
              r: between(0.7, 1.4) * u,
              w: between(5, 8),
              a: between(0, Math.PI * 2),
              rise: -between(1, 1.8) * u,
            },
          });
        break;
      case 'beam': 
        for (let i = 0; i < n(12); i++)
          this.add({
            kind: kind(i),
            x: from.x,
            y: from.y,
            vx: side * between(2.6, 4) * u,
            vy: between(-0.25, 0.25) * u,
            size: between(0.25, 0.45) * u * big,
            life: between(0.6, 1),
            spin: between(-3, 3),
          });
        break;
      case 'breath': {
        
        const mouth = stage.head ?? from;
        for (let i = 0; i < n(14); i++)
          this.add({
            kind: kind(i),
            x: mouth.x,
            y: mouth.y,
            vx: side * between(2.4, 3.6) * u,
            vy: between(-0.6, 0.6) * u,
            size: between(0.35, 0.7) * u * big,
            life: between(0.7, 1.1),
            spin: between(-3, 3),
          });
        break;
      }
      case 'pop': {
        
        this.add({ kind: kind(0), x: from.x, y: from.y, vy: -0.5 * u, size: 1.6 * u * big, life: 1.4, wobble: 3 });
        const m = n(5);
        for (let i = 0; i < m; i++) {
          const a = -Math.PI / 2 + (i / Math.max(1, m - 1) - 0.5) * Math.PI * 1.4;
          this.add({
            kind: kind(i),
            x: from.x,
            y: from.y,
            vx: Math.cos(a) * 1.8 * u,
            vy: Math.sin(a) * 1.8 * u,
            size: 0.45 * u * big,
            life: 1.3,
            wobble: 4,
          });
        }
        this.rings.push({ x: from.x, y: from.y, r0: 0.2 * u, r1: 1.6 * u * big, life: 0.4, age: 0, colour: light });
        break;
      }
      case 'halo': 
        this.rings.push({ x: from.x, y: from.y, r0: 0.2 * u, r1: 1.2 * u * big, life: 0.8, age: 0, colour: light });
        for (let i = 0; i < n(10); i++)
          this.add({
            kind: kind(i),
            x: from.x,
            y: from.y,
            size: between(0.2, 0.3) * u * big,
            life: 1.8,
            orbit: { cx: from.x, cy: from.y - 0.2 * u, r: between(0.6, 0.85) * u, w: between(3, 4), a: (i / n(10)) * Math.PI * 2, rise: 0 },
          });
        break;
      case 'rain': 
        this.rings.push({ x: from.x, y: from.y, r0: 0.2 * u, r1: 1.2 * u * big, life: 0.8, age: 0, colour: light });
        for (let i = 0; i < n(12); i++)
          this.add({
            kind: kind(i),
            x: from.x + between(-1.6, 1.6) * u,
            y: from.y - between(0.6, 1.4) * u,
            vx: between(-0.3, 0.3) * u,
            vy: between(0.4, 0.9) * u,
            size: between(0.2, 0.32) * u * big,
            life: 2,
            spin: between(-3, 3),
            wobble: between(2, 4),
          });
        break;
      default:
        break;
    }
  }

  
  

  
  worldStart(id, stage) {
    this.flowAcc = 0;
    const u = stage.unit;
    if (id === 'storm_cloud')
      
      this.add({
        kind: 'storm_cloud',
        event: id,
        x: -u,
        y: stage.height * 0.16,
        vx: (stage.width + 2 * u) / 15,
        size: 1.9 * u,
        life: 15,
        wobble: 1.2,
      });
  }

  
  worldFlow(id, dt, stage) {
    const r = this.rand;
    const u = stage.unit;
    const rate = { meteor_shower: 2.2, bubble_flood: 3 }[id];
    if (!rate) return;
    this.flowAcc = (this.flowAcc ?? 0) + dt * rate;
    for (; this.flowAcc >= 1; this.flowAcc -= 1) {
      const x = stage.width * (0.05 + 0.9 * r());
      if (id === 'meteor_shower')
        this.add({
          kind: 'meteor',
          event: id,
          x,
          y: -0.4 * u,
          vx: -0.5 * u,
          vy: (1.4 + r()) * u,
          size: (0.45 + 0.2 * r()) * u,
          life: 3.5,
          spin: 1.5,
        });
      else
        this.add({
          kind: 'bubble',
          event: id,
          x,
          y: stage.ground,
          vy: -(0.8 + 0.6 * r()) * u,
          size: (0.3 + 0.3 * r()) * u,
          life: 4,
          wobble: 3,
        });
    }
  }

  
  worldHit(id, count, stage) {
    const u = stage.unit;
    const cloud = this.particles.find((p) => p.event === id && p.kind === 'storm_cloud');
    const at = cloud ?? { x: stage.centre.x, y: stage.height * 0.2 };
    const colour = { storm_cloud: '#FFC83D', meteor_shower: '#FFE7A3', bubble_flood: '#8ED8FF', night_falls: '#FFF6E0' }[id] ?? '#ffffff';
    this.rings.push({ x: at.x, y: at.y, r0: 0.2 * u, r1: (0.8 + 0.3 * count) * u, life: 0.6, age: 0, colour });
    const kind = { storm_cloud: 'sparkle', meteor_shower: 'coin', bubble_flood: 'sparkle', night_falls: 'star' }[id] ?? 'sparkle';
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 * i) / 6;
      this.add({ kind, x: at.x, y: at.y, vx: Math.cos(a) * 1.4 * u, vy: Math.sin(a) * 1.4 * u, size: 0.3 * u, life: 0.9, spin: 3 });
    }
  }

  
  worldEnd(id, success, stage) {
    const r = this.rand;
    const u = stage.unit;
    const props = this.particles.filter((p) => p.event === id && p.age < p.life);
    for (const p of props) p.life = Math.min(p.life, p.age + 0.4); 
    if (!success) return;
    const burst = (x, y, kind, n, speed, size, life = 1.6) => {
      for (let i = 0; i < n; i++) {
        const a = Math.PI * 2 * r();
        const v = speed * (0.5 + r()) * u;
        this.add({ kind, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 1.2 * u, size: size * u, life, spin: 4 });
      }
    };
    this.rings.push({ x: stage.centre.x, y: stage.centre.y, r0: 0.3 * u, r1: 3 * u, life: 1, age: 0, colour: '#FFC83D' });
    if (id === 'meteor_shower') {
      
      for (const p of props.slice(-8)) burst(p.x, p.y, 'coin', 4, 1.2, 0.28);
      if (!props.length) burst(stage.centre.x, stage.height * 0.2, 'coin', 12, 1.4, 0.3);
    } else if (id === 'storm_cloud') {
      const c = props.find((p) => p.kind === 'storm_cloud') ?? { x: stage.centre.x, y: stage.height * 0.16 };
      this.add({ kind: 'rainbow', x: c.x, y: c.y, size: 2.4 * u, life: 3, vx: 0 });
      burst(c.x, c.y, 'sparkle', 10, 1.2, 0.3);
    } else if (id === 'bubble_flood') {
      
      const x = stage.centre.x;
      const y = stage.height * 0.3;
      this.add({ kind: 'bubble', x, y, size: 2.2 * u, life: 0.5 });
      burst(x, y, 'sparkle', 16, 2, 0.32);
    } else if (id === 'night_falls') {
      
      for (let i = 0; i < 12; i++)
        this.add({
          kind: 'fairy',
          x: stage.width * r(),
          y: stage.height * (0.15 + 0.6 * r()),
          vx: (r() - 0.5) * u,
          vy: -0.4 * u,
          size: 0.35 * u,
          life: 2.5,
          wobble: 3,
        });
    }
  }

  
  dim(id, count) {
    return id === 'night_falls' ? 0.55 * Math.max(0, 1 - count / 3) : 0;
  }

  
  update(dt) {
    for (const p of this.particles) {
      p.age += dt;
      if (p.orbit) {
        const o = p.orbit;
        o.a += o.w * dt;
        o.cy += o.rise * dt;
        p.x = o.cx + Math.cos(o.a) * o.r * (1 + p.age * 0.5);
        p.y = o.cy + Math.sin(o.a) * o.r * 0.3;
      } else {
        p.vy += p.g * dt;
        p.x += p.vx * dt + (p.wobble ? Math.sin(p.age * p.wobble) * p.size * 0.04 : 0);
        p.y += p.vy * dt;
      }
      p.rot += p.spin * dt;
    }
    this.particles = this.particles.filter((p) => p.age < p.life);
    for (const g of this.rings) g.age += dt;
    this.rings = this.rings.filter((g) => g.age < g.life);
  }

  
  draw(ctx, images) {
    ctx.save();
    for (const g of this.rings) {
      const t = g.age / g.life;
      ctx.globalAlpha = 1 - t;
      ctx.strokeStyle = g.colour;
      ctx.lineWidth = Math.max(2, g.r1 * 0.08 * (1 - t));
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.r0 + (g.r1 - g.r0) * t, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (const p of this.particles) {
      const img = images.get(p.kind);
      if (!img) continue;
      const t = p.age / p.life;
      ctx.globalAlpha = t < 0.75 ? 1 : 1 - (t - 0.75) / 0.25;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.drawImage(img, -p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }
    ctx.restore();
  }
}
