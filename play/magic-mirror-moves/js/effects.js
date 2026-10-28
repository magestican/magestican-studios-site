



import { COSTUMES } from './render.js';

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
    const c = COSTUMES[costume] ?? COSTUMES.wizard;
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
    const k = (ev.power ? 2 : 1) * (ev.finale ? 1.5 : 1) * (ev.type === 'step' ? 0.5 : 1);
    const n = (base) => Math.max(1, Math.round(base * k));
    const big = ev.power ? 1.35 : 1;
    const at = ev.at?.length ? ev.at : [stage.centre];
    const from = at[0];

    switch (ev.move) {
      case 'arms_up': 
        for (const h of at)
          for (let i = 0; i < n(8); i++)
            this.add({
              kind: c.fire,
              x: h.x + between(-0.12, 0.12) * u,
              y: h.y,
              vx: between(-0.35, 0.35) * u,
              vy: -between(2.2, 3.4) * u,
              size: between(0.35, 0.6) * u * big,
              life: between(0.8, 1.3),
              spin: between(-2, 2),
            });
        break;
      case 'star': 
        for (let i = 0; i < n(14); i++) {
          const a = (i / n(14)) * Math.PI * 2;
          const v = between(1.8, 2.8) * u;
          this.add({
            kind: 'star',
            x: from.x,
            y: from.y,
            vx: Math.cos(a) * v,
            vy: Math.sin(a) * v,
            size: between(0.3, 0.5) * u * big,
            life: 1.2,
            spin: between(-4, 4),
          });
        }
        this.rings.push({ x: from.x, y: from.y, r0: 0.3 * u, r1: 2.4 * u * big, life: 0.6, age: 0, colour: '#ffe27a' });
        break;
      case 'flap': 
        for (let i = 0; i < n(4); i++) {
          const left = i % 2 === 0;
          const x = left ? -0.4 * u : stage.width + 0.4 * u;
          const y = stage.centre.y + between(-1.4, 0.4) * u;
          this.add({
            kind: 'fairy',
            x,
            y,
            vx: (left ? 1 : -1) * between(1.6, 2.2) * u,
            vy: between(-0.2, 0.2) * u,
            size: 0.55 * u * big,
            life: 2.2,
            wobble: between(3, 6),
          });
        }
        break;
      case 'jump': 
        this.rings.push({ x: stage.centre.x, y: stage.ground, r0: 0.4 * u, r1: 3 * u * big, life: 0.7, age: 0, colour: '#9ff3ff' });
        for (let i = 0; i < n(10); i++)
          this.add({
            kind: 'coin',
            x: stage.centre.x + between(-1.2, 1.2) * u,
            y: stage.ground,
            vx: between(-0.6, 0.6) * u,
            vy: -between(2.4, 3.6) * u,
            g: 4.5 * u,
            size: 0.32 * u * big,
            life: 1.4,
            spin: between(-6, 6),
          });
        break;
      case 'squat': 
        for (let i = 0; i < n(12); i++)
          this.add({
            kind: 'bubble',
            x: from.x + between(-1, 1) * u,
            y: from.y + between(-0.2, 0.4) * u,
            vx: between(-0.15, 0.15) * u,
            vy: -between(0.6, 1.3) * u,
            size: between(0.2, 0.45) * u * big,
            life: between(1.4, 2.2),
            wobble: between(2, 5),
          });
        break;
      case 'twirl': 
        for (let i = 0; i < n(18); i++)
          this.add({
            kind: 'sparkle',
            x: from.x,
            y: from.y,
            size: between(0.18, 0.35) * u * big,
            life: 1.6,
            orbit: {
              cx: from.x,
              cy: from.y + 1.2 * u,
              r: between(0.7, 1.4) * u,
              w: between(5, 8),
              a: r() * Math.PI * 2,
              rise: -between(1, 1.8) * u,
            },
          });
        break;
      case 'wand': {
        
        const dir = Math.sign(from.x - stage.centre.x) || 1;
        const kind = c.fire === 'mini_ghost' ? 'sparkle' : c.fire === 'sparkle' ? 'star' : c.fire;
        for (let i = 0; i < n(12); i++)
          this.add({
            kind,
            x: from.x,
            y: from.y,
            vx: dir * between(2.6, 4) * u,
            vy: between(-0.25, 0.25) * u,
            size: between(0.25, 0.45) * u * big,
            life: between(0.6, 1),
            spin: between(-3, 3),
          });
        break;
      }
      case 'boo': 
        for (let i = 0; i < n(6); i++) {
          const a = -Math.PI / 2 + (i / Math.max(1, n(6) - 1) - 0.5) * Math.PI * 1.4;
          this.add({
            kind: 'mini_ghost',
            x: from.x,
            y: from.y,
            vx: Math.cos(a) * 1.8 * u,
            vy: Math.sin(a) * 1.8 * u,
            size: 0.5 * u * big,
            life: 1.5,
            wobble: 4,
          });
        }
        break;
      case 'crown': 
        this.rings.push({ x: from.x, y: from.y, r0: 0.2 * u, r1: 1.2 * u * big, life: 0.8, age: 0, colour: '#ffd36b' });
        for (let i = 0; i < n(12); i++)
          this.add({
            kind: 'petal',
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
    
    if (ev.power)
      for (let i = 0; i < n(6); i++)
        this.add({
          kind: c.signature,
          x: between(0.1, 0.9) * stage.width,
          y: stage.ground,
          vx: between(-0.3, 0.3) * u,
          vy: -between(2.5, 4) * u,
          size: 0.5 * u,
          life: 1.6,
          spin: between(-2, 2),
        });
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
