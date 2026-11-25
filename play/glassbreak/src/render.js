




import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import {
  BOSS_CORE_R, BOSS_GUARD_R, CH, CW, C_EMPTY, DANGER_Y, ECHO_HW, ECHO_Y, EMBER_R, ENEMY_R, FIELD_H, FIELD_W, FLARE_AT, GAP,
  PADDLE_H, PADDLE_HW, PADDLE_Y, SHIELD_Y, WIDE_HW, bossGuardPos, cellXY, massBottom,
} from './sim/sim.js';
import { COLS, MAX_ROWS, WINDOWS, ACTS } from './sim/windows.js';
import { FP } from './sim/fixed.js';
import { BACK_FRAG, BACK_VERT, GLASS_FRAG, GLASS_VERT, SHAPE_FRAG, SHAPE_VERT } from './shaders.js';
import { CELL_KIND, crackStage, emberRgb, tintRgb } from './view.js';
import { BACKDROP_DIM, BACKDROP_FADE_S, backdropPath } from './backdrops.js';

const NCELL = COLS * MAX_ROWS;

const BLANK = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
BLANK.needsUpdate = true;
const ASSETS = new URL('../assets/', import.meta.url);
const wx = (v) => v / FP;        
const wy = (v) => -v / FP;       
const CAP_RGB = [[0.95, 0.7, 0.3], [1, 0.55, 0.25], [0.55, 0.8, 1], [1, 0.9, 0.4], [0.7, 1, 0.6], [0.6, 0.85, 1],
  [1, 0.95, 0.6]];


class ShapeBatch {
  constructor(max, additive) {
    this.max = max;
    this.n = 0;
    const g = new THREE.InstancedBufferGeometry();
    const base = new THREE.PlaneGeometry(1, 1);
    g.index = base.index;
    g.setAttribute('position', base.getAttribute('position'));
    const mk = (name, size) => {
      const a = new THREE.InstancedBufferAttribute(new Float32Array(max * size), size);
      a.setUsage(THREE.DynamicDrawUsage);
      g.setAttribute(name, a);
      return a;
    };
    this.pos = mk('iPos', 2); this.scale = mk('iScale', 2); this.rot = mk('iRot', 1);
    this.color = mk('iColor', 4); this.shape = mk('iShape', 1); this.param = mk('iParam', 2);
    g.instanceCount = 0;
    this.uniforms = { uTime: { value: 0 }, uAdd: { value: additive ? 1 : 0 } };
    const m = new THREE.ShaderMaterial({
      vertexShader: SHAPE_VERT, fragmentShader: SHAPE_FRAG, uniforms: this.uniforms, transparent: true,
      depthTest: false, depthWrite: false,
      ...(additive ? { blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor } : {}),
    });
    this.mesh = new THREE.Mesh(g, m);
    this.mesh.frustumCulled = false;
    this.geo = g;
  }
  add(shape, x, y, sx, sy, rgb, alpha = 1, rot = 0, p0 = 0, p1 = 0) {
    if (this.n >= this.max) return;
    const i = this.n++;
    this.pos.array[i * 2] = x; this.pos.array[i * 2 + 1] = y;
    this.scale.array[i * 2] = sx; this.scale.array[i * 2 + 1] = sy;
    this.rot.array[i] = rot;
    this.color.array[i * 4] = rgb[0]; this.color.array[i * 4 + 1] = rgb[1]; this.color.array[i * 4 + 2] = rgb[2];
    this.color.array[i * 4 + 3] = alpha;
    this.shape.array[i] = shape;
    this.param.array[i * 2] = p0; this.param.array[i * 2 + 1] = p1;
  }
  flush(time) {
    for (const a of [this.pos, this.scale, this.rot, this.color, this.shape, this.param]) a.needsUpdate = true;
    this.geo.instanceCount = this.n;
    this.uniforms.uTime.value = time;
    this.n = 0;
  }
}

export class Painter {
  constructor(canvas) {
    this.canvas = canvas;
    const r = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    r.setClearColor(0x05040a, 1);
    this.renderer = r;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(0, FIELD_W, 0, -FIELD_H, -10, 10);
    this.time = 0;
    this.shake = 0;
    this.light = 0;

    
    this.backU = { uTime: { value: 0 }, uMass: { value: 0 }, uDanger: { value: 0 }, uLight: { value: 0 },
      uActTint: { value: new THREE.Color(1, 0.3, 0.5) },
      uArtA: { value: BLANK }, uArtB: { value: BLANK }, uArtMix: { value: 1 }, uArtOnA: { value: 0 }, uArtOnB: { value: 0 },
      uArtDim: { value: BACKDROP_DIM } };
    this.art = { act: null, tex: new Map() }; 
    const back = new THREE.Mesh(new THREE.PlaneGeometry(FIELD_W * 6, FIELD_H * 3),
      new THREE.ShaderMaterial({ vertexShader: BACK_VERT, fragmentShader: BACK_FRAG, uniforms: this.backU, depthTest: false }));
    back.position.set(FIELD_W / 2, -FIELD_H / 2, 0);
    back.renderOrder = 0;
    this.scene.add(back);

    
    const g = new THREE.InstancedBufferGeometry();
    const base = new THREE.PlaneGeometry(1, 1);
    g.index = base.index;
    g.setAttribute('position', base.getAttribute('position'));
    const mk = (name, size) => {
      const a = new THREE.InstancedBufferAttribute(new Float32Array(NCELL * size), size);
      a.setUsage(THREE.DynamicDrawUsage);
      g.setAttribute(name, a);
      return a;
    };
    this.gPos = mk('iPos', 2); this.gSize = mk('iSize', 2); this.gKind = mk('iKind', 1); this.gTint = mk('iTint', 3);
    this.gCrack = mk('iCrack', 1); this.gSeed = mk('iSeed', 1); this.gFlash = mk('iFlash', 1);
    for (let i = 0; i < NCELL; i++) { this.gSeed.array[i] = ((i * 2654435761) >>> 0) / 4294967296; }
    g.instanceCount = NCELL;
    this.glassU = { uTime: { value: 0 }, uGlow: { value: 0.3 } };
    this.glass = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: GLASS_VERT, fragmentShader: GLASS_FRAG,
      uniforms: this.glassU, depthTest: false, depthWrite: false }));
    this.glass.frustumCulled = false;
    this.glass.renderOrder = 1;
    this.scene.add(this.glass);
    this.flash = new Float32Array(NCELL);

    this.solid = new ShapeBatch(1200, false);
    this.solid.mesh.renderOrder = 2;
    this.scene.add(this.solid.mesh);
    this.glow = new ShapeBatch(4000, true);
    this.glow.mesh.renderOrder = 3;
    this.scene.add(this.glow.mesh);

    this.parts = [];   
    this.trails = new Map(); 

    this.composer = new EffectComposer(r);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.85, 0.55, 0.62);
    this.composer.addPass(this.bloom);
  }

  
  resize(w, h, fit) {
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    const s = fit.scale;
    const vw = w / s, vh = h / s;
    
    const oy = (fit.y + fit.h / 2 - h / 2) / s, ox = (fit.x + fit.w / 2 - w / 2) / s;
    this.view = { vw, vh, cx: FIELD_W / 2 - ox, cy: -FIELD_H / 2 + oy };
    this.applyCamera(0, 0);
  }

  applyCamera(ox, oy) {
    const v = this.view;
    if (!v) return;
    const c = this.camera;
    c.left = v.cx - v.vw / 2 + ox; c.right = v.cx + v.vw / 2 + ox;
    c.top = v.cy + v.vh / 2 + oy; c.bottom = v.cy - v.vh / 2 + oy;
    c.updateProjectionMatrix();
  }

  
  spawn(p) { if (this.parts.length < 2500) this.parts.push(p); }

  burst(x, y, rgb, n, speed, size = 8) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.35 + Math.random() * 0.9);
      this.spawn({ shape: 1, add: false, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v + speed * 0.3,
        rot: Math.random() * 6.3, vr: (Math.random() - 0.5) * 14, life: 0, max: 0.7 + Math.random() * 0.7,
        size: size * (0.5 + Math.random()), rgb, grav: -900 });
    }
    for (let i = 0; i < n / 2; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.6 + Math.random() * 1.2);
      this.spawn({ shape: 0, add: true, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, rot: 0, vr: 0, life: 0,
        max: 0.25 + Math.random() * 0.35, size: 7 + Math.random() * 6, rgb, grav: 0 });
    }
  }

  shaft(x, y, rgb, width = 46, life = 0.7, alpha = 0.55) {
    
    const h = Math.max(40, -y + 60);
    this.spawn({ shape: 2, add: true, x, y: y + h / 2 - 10, vx: 0, vy: 0, rot: 0, vr: 0, life: 0, max: life,
      size: width, sy: h, rgb, grav: 0, alpha, grow: 1 });
  }

  ring(x, y, rgb, size, life = 0.45) {
    this.spawn({ shape: 3, add: true, x, y, vx: 0, vy: 0, rot: 0, vr: 0, life: 0, max: life, size, rgb, grav: 0, ring: 1 });
  }

  
  events(s, evs) {
    for (const e of evs) {
      const x = wx(e.x), y = wy(e.y);
      if (e.k === 'break' || e.k === 'sun') {
        const tn = e.a & 3, t = (e.a >> 2) & 15, chain = (e.a >> 6) & 15;
        const rgb = t === 3 ? [0.5, 0.5, 0.55] : t === 5 ? [0.8, 0.88, 1] : e.k === 'sun' ? [1, 0.78, 0.3] : tintRgb(tn);
        this.burst(x, y, rgb, e.k === 'sun' ? 40 : 14 + Math.min(chain, 8) * 2, e.k === 'sun' ? 520 : 300, e.k === 'sun' ? 10 : 7);
        this.shaft(x, y, rgb, e.k === 'sun' ? 140 : 44, e.k === 'sun' ? 1.3 : 0.75, e.k === 'sun' ? 0.8 : 0.45);
        if (chain >= 3) this.ring(x, y, rgb, 40 + chain * 6);
        this.light = Math.min(1, this.light + (e.k === 'sun' ? 0.9 : 0.12));
      } else if (e.k === 'crack') {
        this.burst(x, y, [0.95, 0.92, 0.85], 4, 160, 4);
        const c = this.cellAt(s, e.x, e.y);
        if (c >= 0) this.flash[c] = 1;
      } else if (e.k === 'clank') {
        this.burst(x, y, [1, 0.75, 0.4], 3, 200, 3);
      } else if (e.k === 'paddle') {
        const tn = (e.a >> 2) & 3;
        this.ring(x, y, tintRgb(tn), 34, 0.3);
      } else if (e.k === 'wall') {
        this.spawn({ shape: 0, add: true, x, y, vx: 0, vy: 0, rot: 0, vr: 0, life: 0, max: 0.18, size: 24,
          rgb: [1, 0.85, 0.6], grav: 0 });
      } else if (e.k === 'punch') {
        
        this.burst(x, y, [1, 0.9, 0.6], 10, 380, 5);
        this.ring(x, y, [1, 0.8, 0.45], 30, 0.25);
      } else if (e.k === 'draft') {
        
        
        const dir = e.a ? -1 : 1;
        for (let i = 0; i < 3; i++) {
          this.spawn({ shape: 0, add: true, x: x + dir * (8 + i * 6), y: y - i * 5, vx: dir * (90 + i * 40), vy: -30,
            rot: 0, vr: 0, life: 0, max: 0.32, size: 14 - i * 3, rgb: [1, 0.78, 0.42], grav: 0 });
        }
      } else if (e.k === 'lost') {
        this.burst(x, -FIELD_H + 20, [1, 0.5, 0.2], 18, 420, 5);
      } else if (e.k === 'breach') {
        this.ring(FIELD_W / 2, wy(e.y), [0.8, 0.3, 1], 700, 0.8);
      } else if (e.k === 'ring' || e.k === 'bellwarn') {
        this.ring(x, y, [1, 0.8, 0.4], e.k === 'ring' ? 520 : 70, e.k === 'ring' ? 0.9 : 0.4);
      } else if (e.k === 'enter') {
        this.ring(x, y, [0.7, 0.5, 1], 60, 0.5);
      } else if (e.k === 'kill' || e.k === 'enemydown' || e.k === 'mothburn') {
        this.burst(x, y, [1, 0.8, 0.5], 16, 320, 5);
      } else if (e.k === 'bosshit') {
        this.burst(x, y, [1, 0.95, 0.8], 10, 360, 6);
        this.bossFlash = 1;
      } else if (e.k === 'bossland') {
        
        this.ring(x, y, [1, 0.55, 0.6], 640, 1.0);
        this.burst(x, y, [1, 0.7, 0.6], 30, 520, 9);
        this.shaft(x, y, [1, 0.75, 0.6], 200, 1.4, 0.7);
      } else if (e.k === 'guardbreak') {
        this.burst(x, y, [0.9, 0.6, 1], 18, 340, 7);
      } else if (e.k === 'bossdown') {
        for (let i = 0; i < 4; i++) this.burst(x, y, tintRgb(i % 3), 40, 700, 12);
        this.shaft(x, y, [1, 0.9, 0.6], 260, 2.2, 0.9);
        this.ring(x, y, [1, 0.9, 0.6], 900, 1.2);
        this.light = 1;
      } else if (e.k === 'echo' || e.k === 'echobreak') {
        this.burst(x, y, [0.8, 0.85, 1], e.k === 'echobreak' ? 50 : 10, 380, 8);
      } else if (e.k === 'capsule') {
        this.ring(x, y, CAP_RGB[e.a & 15] || [1, 1, 1], 80, 0.5);
      } else if (e.k === 'catch') {
        this.ring(x, y, [1, 0.86, 0.45], 70, 0.35);
        this.burst(x, y, [1, 0.85, 0.5], 6, 160, 3);
      } else if (e.k === 'kindle') {
        this.ring(x, y, [1, 0.85, 0.4], 220, 0.7);
        this.shaft(x, y, [1, 0.85, 0.5], 120, 0.9, 0.6);
      } else if (e.k === 'flare') {
        this.burst(x, y, [1, 0.92, 0.65], 22, 420, 6);
        this.ring(x, y, [1, 0.9, 0.6], 160, 0.5);
      } else if (e.k === 'shieldsave') {
        this.ring(x, y, [0.6, 0.85, 1], 60, 0.4);
      } else if (e.k === 'clear') {
        this.light = 1;
        for (let i = 0; i < 6; i++) this.shaft(60 + i * 120, -500, tintRgb(i % 3), 90, 2, 0.5);
      } else if (e.k === 'solder') {
        this.burst(x, y, [1, 0.6, 0.2], 6, 120, 3);
      } else if (e.k === 'refirewarn') {
        
        
        const life = (e.a || 105) / 60;
        this.spawn({ shape: 0, add: true, x, y, vx: 0, vy: 0, rot: 0, vr: 0, life: 0, max: life, size: 52, sy: 28,
          rgb: [1, 0.42, 0.12], grav: 0, alpha: 0.6, pulse: 1 });
        this.ring(x, y, [1, 0.5, 0.15], 64, life);
      } else if (e.k === 'refire') {
        this.burst(x, y, [1, 0.55, 0.2], 12, 220, 5);
      } else if (e.k === 'surgewarn') {
        
        const life = (e.a || 150) / 60;
        this.ring(FIELD_W / 2, y, [0.75, 0.35, 1], 760, life);
        this.ring(FIELD_W / 2, y, [0.75, 0.35, 1], 380, life * 0.6);
      } else if (e.k === 'surge') {
        this.ring(FIELD_W / 2, y, [0.8, 0.3, 1], 800, 0.7);
        this.bossFlash = Math.max(this.bossFlash || 0, 0.6);
      } else if (e.k === 'surgestop') {
        this.shaft(x, y, [1, 0.85, 0.35], 200, 1.4, 0.85);
        this.ring(x, y, [1, 0.85, 0.35], 420, 0.8);
      }
    }
  }

  cellAt(s, x, y) {
    let best = -1, bd = Infinity;
    for (let i = 0; i < NCELL; i++) {
      if (s.grid.t[i] === C_EMPTY) continue;
      const p = cellXY(s, i % COLS, (i / COLS) | 0);
      const d = Math.abs(p.x + (CW * FP) / 2 - x) + Math.abs(p.y + (CH * FP) / 2 - y);
      if (d < bd) { bd = d; best = i; }
    }
    return bd < 60 * FP ? best : -1;
  }

  
  showField(on) {
    this.glass.visible = on; this.solid.mesh.visible = on; this.glow.mesh.visible = on;
  }

  
  draw(s, dt, seatColours = null, mySeat = -1) {
    this.time += dt;
    const t = this.time;
    this.light = Math.max(0, this.light - dt * 0.9);
    this.bossFlash = Math.max(0, (this.bossFlash || 0) - dt * 6);

    
    const mb = massBottom(s);
    this.backU.uTime.value = t;
    this.backU.uMass.value = mb === null ? 0 : wy(mb);
    this.backU.uDanger.value = mb === null ? 0 : Math.max(0, Math.min(1, (mb / FP - 500) / (DANGER_Y - 500)));
    this.backU.uLight.value = this.light;
    const act = WINDOWS[s.wi] ? ACTS[WINDOWS[s.wi].act] : null;
    if (act) { const c = tintRgb(act.tint); this.backU.uActTint.value.setRGB(c[0], c[1], c[2]); }
    if (act) this.actBackdrop(act.id, dt);

    
    const g = s.grid;
    for (let i = 0; i < NCELL; i++) {
      const tp = g.t[i];
      const c = i % COLS, r = (i / COLS) | 0;
      const p = cellXY(s, c, r);
      this.gPos.array[i * 2] = wx(p.x) + CW / 2;
      this.gPos.array[i * 2 + 1] = wy(p.y) - CH / 2;
      this.gSize.array[i * 2] = CW; this.gSize.array[i * 2 + 1] = CH;
      this.gKind.array[i] = CELL_KIND[tp] || 0;
      const rgb = tintRgb(g.tn[i] & 3);
      this.gTint.array[i * 3] = rgb[0]; this.gTint.array[i * 3 + 1] = rgb[1]; this.gTint.array[i * 3 + 2] = rgb[2];
      this.gCrack.array[i] = crackStage(tp, g.hp[i]);
      this.flash[i] = Math.max(0, this.flash[i] - dt * 5);
      this.gFlash.array[i] = this.flash[i];
    }
    for (const a of [this.gPos, this.gSize, this.gKind, this.gTint, this.gCrack, this.gFlash]) a.needsUpdate = true;
    this.glassU.uTime.value = t;
    this.glassU.uGlow.value = 0.25 + this.light * 0.6;

    const S = this.solid, G = this.glow;

    
    const danger = this.backU.uDanger.value;
    if (danger > 0.2) G.add(21, FIELD_W / 2, -DANGER_Y, FIELD_W, 10, [0.8, 0.25, 1], (danger - 0.2) * (0.6 + 0.4 * Math.sin(t * 8)));
    if (s.shield > 0) G.add(21, FIELD_W / 2, -SHIELD_Y, FIELD_W, 14, [0.55, 0.85, 1], 0.8);

    
    if (s.echo && s.echo.on) S.add(20, wx(s.echo.x), -ECHO_Y, ECHO_HW * 2, 16, [1, 1, 1], 1);

    
    const b = s.boss;
    if (b && b.on && !b.beaten) {
      const bx = wx(b.x), by = wy(b.y);
      G.add(0, bx, by, BOSS_CORE_R * 5, BOSS_CORE_R * 5, [1, 0.6, 0.5], 0.35 + 0.15 * Math.sin(t * 2));
      S.add(16, bx, by, BOSS_CORE_R * 2.2, BOSS_CORE_R * 2.2, [1, 1, 1], 1, 0, b.max ? b.hp / b.max : 1, this.bossFlash);
      for (let i = 0; i < b.guards.length; i++) {
        if (b.guards[i] <= 0) continue;
        const q = bossGuardPos(s, i);
        S.add(17, wx(q.x), wy(q.y), BOSS_GUARD_R * 2, BOSS_GUARD_R * 2, tintRgb(i % 3), 1, t * 0.6 + i, b.guards[i] < 2 ? 1 : 0, i);
      }
    }

    
    for (const en of s.enemies) {
      const r = ENEMY_R[en.k] || 15;
      const grow = en.enter > 0 ? 1 - en.enter / 60 : 1;
      const warn = en.k === 4 && en.t % 360 > 300 ? (en.t % 360 - 300) / 60 : 0;
      S.add(11 + en.k, wx(en.x), wy(en.y), r * 2.4 * grow, r * 2.4 * grow, [1, 1, 1], 1, 0, warn, en.id);
      if (en.k === 0) G.add(0, wx(en.x), wy(en.y) - r, 16, 16, [1, 0.7, 0.3], 0.6);
    }

    
    for (const c of s.caps) S.add(18, wx(c.x), wy(c.y), 44, 26, CAP_RGB[c.k] || [1, 1, 1], 1, 0, c.k);

    
    
    for (const k of s.sparks || []) {
      const x = wx(k.x), y = wy(k.y);
      const tw = 0.75 + 0.25 * Math.sin(t * 14 + k.x * 0.01);
      
      
      G.add(0, x, y + 18, 12, 44, [1, 0.75, 0.3], 0.45);
      G.add(0, x, y, 56 * tw, 56 * tw, [1, 0.8, 0.35], 0.75);
      S.add(1, x, y, 40, 40, [1, 0.82, 0.3], 1, t * 5 + k.x * 0.003);
      G.add(4, x, y, 12, 12, [1, 0.98, 0.85], 1);
    }

    
    for (const bo of s.bolts) {
      const mine = bo.own >= 0;
      G.add(0, wx(bo.x), wy(bo.y), mine ? 12 : 16, mine ? 34 : 22, mine ? [1, 0.9, 0.45] : [1, 0.25, 0.6], 1);
      G.add(4, wx(bo.x), wy(bo.y), mine ? 5 : 8, mine ? 14 : 8, mine ? [1, 0.95, 0.7] : [1, 0.5, 0.8], 1);
    }

    
    for (let i = 0; i < s.players.length; i++) {
      const p = s.players[i];
      if (!p.on) continue;
      const hw = p.wide > 0 ? WIDE_HW : PADDLE_HW;
      const rgb = tintRgb(p.tint);
      G.add(0, wx(p.x), -PADDLE_Y - PADDLE_H / 2 + 14, hw * 2.4, 46, rgb, 0.1);
      S.add(10, wx(p.x), -PADDLE_Y - PADDLE_H / 2, hw * 2, PADDLE_H + 4, rgb, 1, 0, p.stun > 0 ? 1 : 0);
      if (p.cat > 0) G.add(21, wx(p.x), -PADDLE_Y + 4, hw * 2, 8, [0.7, 1, 0.6], 0.6);
      
      
      if (p.flare) {
        G.add(0, wx(p.x), -PADDLE_Y - PADDLE_H / 2, hw * 3.2, 70, [1, 0.82, 0.4], 0.45 + 0.25 * Math.sin(t * 9));
        G.add(21, wx(p.x), -PADDLE_Y - PADDLE_H / 2, hw * 2, PADDLE_H, [1, 0.9, 0.55], 0.75);
      } else {
        for (let k = 0; k < FLARE_AT; k++) {
          const nx = wx(p.x) + (k - (FLARE_AT - 1) / 2) * hw * 0.27;
          const lit = k < p.spark;
          G.add(4, nx, -PADDLE_Y - PADDLE_H / 2, lit ? 8 : 5, lit ? 8 : 5, lit ? [1, 0.86, 0.45] : [0.35, 0.3, 0.25], lit ? 1 : 0.7);
        }
      }
      if (seatColours && s.players.filter((q) => q.on).length > 1) {
        
        
        
        
        
        const mine = i === mySeat;
        if (mine) G.add(0, wx(p.x), -PADDLE_Y - PADDLE_H / 2 - 22, hw * 2.6, 40, seatColours[i], 0.35);
        G.add(21, wx(p.x), -PADDLE_Y - PADDLE_H / 2 - (mine ? 22 : 18), mine ? hw * 2 : hw * 1.6, mine ? 20 : 10, seatColours[i], 1);
      }
    }

    
    const alive = new Set();
    for (const e of s.embers) {
      alive.add(e.id);
      const x = wx(e.x), y = wy(e.y);
      const rgb = emberRgb(e.tint, e.heat);
      let tr = this.trails.get(e.id);
      if (!tr) { tr = []; this.trails.set(e.id, tr); }
      if (!e.held) { tr.push({ x, y }); if (tr.length > 18) tr.shift(); } else tr.length = 0;
      for (let k = 0; k < tr.length; k++) {
        const f = (k + 1) / tr.length;
        G.add(0, tr[k].x, tr[k].y, EMBER_R * 3.2 * f, EMBER_R * 3.2 * f, rgb, 0.5 * f);
      }
      const big = 1 + e.heat * 0.12;
      G.add(0, x, y, EMBER_R * 7 * big, EMBER_R * 7 * big, rgb, 0.55);
      G.add(4, x, y, EMBER_R * 2.3 * big, EMBER_R * 2.3 * big, rgb, 1);
      if (e.chg > 0 && !e.held) G.add(3, x, y, EMBER_R * 4, EMBER_R * 4, rgb, 0.35 + 0.1 * e.chg);
      if (e.rush) {
        
        
        
        const vl = Math.hypot(e.vx, e.vy) || 1, bx = -e.vx / vl, by = e.vy / vl;
        for (let k = 1; k <= 9; k++) {
          const d = k * EMBER_R * 1.5, r = EMBER_R * (5.2 - k * 0.5);
          G.add(0, x + bx * d, y + by * d, r, r, [1, 0.55 + k * 0.04, 0.2], 0.95 - k * 0.09);
        }
        G.add(4, x + bx * EMBER_R * 2, y + by * EMBER_R * 2, EMBER_R * 2.4, EMBER_R * 2.4, [1, 0.85, 0.5], 0.9);
      }
      if (e.flare > 0) G.add(0, x, y, EMBER_R * 11, EMBER_R * 11, [1, 0.92, 0.7], 0.5 + 0.2 * Math.sin(t * 20));
      if (e.moth) S.add(12, x, y + 10, 26, 22, [1, 1, 1], 1, 0, 0, e.id);
    }
    for (const id of this.trails.keys()) if (!alive.has(id)) this.trails.delete(id);

    
    const keep = [];
    for (const p of this.parts) {
      p.life += dt;
      if (p.life >= p.max) continue;
      p.vy += (p.grav || 0) * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      const f = 1 - p.life / p.max;
      const B = p.add ? G : S;
      if (p.ring) B.add(3, p.x, p.y, p.size * (0.3 + 0.7 * (1 - f)), p.size * (0.3 + 0.7 * (1 - f)), p.rgb, f);
      
      else if (p.pulse) B.add(p.shape, p.x, p.y, p.size, p.sy || p.size, p.rgb, (p.alpha || 0.5) * (0.55 + 0.45 * Math.sin(p.life * 12)));
      else if (p.grow) B.add(2, p.x, p.y, p.size * (0.6 + 0.4 * f), p.sy, p.rgb, (p.alpha || 0.5) * f);
      else B.add(p.shape, p.x, p.y, p.size, p.size, p.rgb, p.add ? f : Math.min(1, f * 2), p.rot);
      keep.push(p);
    }
    this.parts = keep;

    S.flush(t); G.flush(t);

    
    this.shake = Math.max(0, this.shake - dt * 60);
    const k = this.shake;
    this.applyCamera(k ? (Math.random() - 0.5) * k : 0, k ? (Math.random() - 0.5) * k : 0);
    this.bloom.strength = 0.75 + this.light * 0.5;
    this.composer.render();
  }

  

  actBackdrop(actId, dt) {
    const U = this.backU, A = this.art;
    if (!A.tex.has(actId)) {
      A.tex.set(actId, null);
      const rel = backdropPath(actId);
      if (rel) {
        new THREE.TextureLoader().load(new URL(rel, ASSETS).href, (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.minFilter = THREE.LinearFilter;
          tex.generateMipmaps = false;
          A.tex.set(actId, tex);
        }, undefined, () => {});
      }
    }
    const tex = A.tex.get(actId);
    if (actId !== A.act) {
      
      U.uArtA.value = U.uArtB.value; U.uArtOnA.value = U.uArtOnB.value * U.uArtMix.value;
      U.uArtB.value = BLANK; U.uArtOnB.value = 0; U.uArtMix.value = 0;
      A.act = actId;
    }
    if (tex && U.uArtB.value !== tex) { U.uArtB.value = tex; U.uArtOnB.value = 1; }
    U.uArtMix.value = Math.min(1, U.uArtMix.value + dt / BACKDROP_FADE_S);
  }

  addShake(v) { this.shake = Math.min(30, this.shake + v); }
  clearFx() { this.parts = []; this.trails.clear(); this.flash.fill(0); }
}
