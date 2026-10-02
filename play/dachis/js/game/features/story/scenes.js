


import { U } from '../../../engine/core/util.js';
import { G } from '../../state.js';
import { KUMABO } from '../../data/species.js';
import { ART } from '../../art/characters.js';
import { dachiPortrait, aerowingPortrait, aerowingRidePortrait, castFigure, RIDE_SHOT, kidFallFigure, FALL_FRAMES } from '../../art/portraitRender.js';
import { lookName } from '../../art/look/celRules.js';
import * as SKY from '../../art/look/celSky.js';


const CEL = typeof location !== 'undefined' && lookName(location.search) === 'cel';



const CROWD_PX = 86;
const crowd = (id, opts) => dachiPortrait(id, opts, CROWD_PX, 'fixed').canvas;


const AERO_PX = 200, AERO_CSS = 300;
const FLAP = (t) => [0, 1, 2, 1][Math.floor(t * 8) % 4];

const RIDE_PX = 220, RIDE_CSS = 340;



export const SWOOP = { shot: RIDE_SHOT, px: RIDE_PX, css: RIDE_CSS }; 
const aero = (t) => aerowingPortrait(FLAP(t), SWOOP.px, 'fit', SWOOP.shot).canvas;
const ride = (t) => aerowingRidePortrait(FLAP(t), RIDE_PX, G.gender).canvas;



const FIG_PX = 110, KID_H = 48; 
function figure(ctx, kind, x, y, cssH, o = {}) {
  const e = castFigure(kind, G.gender, FIG_PX, o.back ? 'back' : 'front');
  ctx.save(); ctx.translate(x, y - cssH / 2);
  if (o.rot) ctx.rotate(o.rot);
  if (o.flip) ctx.scale(-1, 1);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(e.canvas, -cssH / 2, -cssH / 2, cssH, cssH);
  ctx.restore();
}
const kid3d = (ctx, x, y, scale, o) => figure(ctx, 'kid', x, y, KID_H * scale, o);


function kidPosed(ctx, x, y, scale, pose, t) {
  const e = pose && kidFallFigure(G.gender, FIG_PX, pose), cssH = KID_H * scale;
  if (!e || !e.ready) return kid3d(ctx, x, y, scale);
  const br = 1 + Math.sin(t * 2.4) * 0.012; 
  ctx.save(); ctx.translate(x, y); ctx.scale(1, br); ctx.translate(0, -cssH / 2);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(e.canvas, -cssH / 2, -cssH / 2, cssH, cssH);
  ctx.restore();
}


const VILLAGE_POSE = ['land', 'surprised', 'surprised', null, null, null, null, null, null, null, 'cheer'];


function kidFalling(ctx, w, h, t, cssH) {
  const f = Math.floor(t * 7) % FALL_FRAMES, e = kidFallFigure(G.gender, FIG_PX, f);
  if (!e.ready) { ctx.save(); ctx.translate(w / 2, h * 0.5); ctx.rotate(Math.sin(t * 3) * 0.6); kid3d(ctx, 0, 30, cssH / KID_H); ctx.restore(); return; }
  ctx.save(); ctx.translate(w / 2 + Math.sin(t * 1.7) * 14, h * 0.5 + Math.sin(t * 2.3) * 8);
  ctx.rotate(t * 1.4 + Math.sin(t * 2.1) * 0.5); 
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(e.canvas, -cssH / 2, -cssH / 2, cssH, cssH);
  ctx.restore();
}


export const CS = { t: 0, flash: 0 };

export const KID = () => ({ who: G.name, portrait: 'kid' });
export const ELDER = { who: 'Elder Ojiji', portrait: 'elder' };
export const NARR = { who: '' };


const ALLEY_R = U.rng(1992);
const ALLEY_WINDOWS = Array.from({ length: 70 }, () => [ALLEY_R(), ALLEY_R(), ALLEY_R() < 0.55]);
const RAIN = Array.from({ length: 160 }, () => [ALLEY_R(), ALLEY_R(), 0.6 + ALLEY_R() * 0.8]);
function drawAlley(ctx, w, h, t) {
  const vx = w / 2, top = h * 0.18, bot = h * 0.64, inL = w * 0.36, inR = w * 0.64;
  let g = ctx.createLinearGradient(0, 0, 0, bot);
  g.addColorStop(0, '#07041a'); g.addColorStop(1, '#3a1a4a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  if (CEL) SKY.bands(ctx, 0, 0, w, bot, ['#07041a', '#1d0f35', '#3a1a4a'], Math.max(6, Math.round(h / 90)));
  
  for (const [a, b] of [[0, 0.4], [0.12, 0.7], [0.3, 0.55], [0.5, 0.85], [0.7, 0.5], [0.85, 0.75]]) {
    const bx = inL + (inR - inL) * a, bw = (inR - inL) * 0.22, bh = (bot - top) * b;
    ctx.fillStyle = '#140c2a'; ctx.fillRect(bx, bot - bh - 30, bw, bh + 30);
  }
  ctx.save(); ctx.beginPath(); ctx.rect(inL, top, inR - inL, bot - top); ctx.clip();
  for (const [a, b, on] of ALLEY_WINDOWS) if (on) { ctx.fillStyle = `rgba(255,${200 + b * 50},120,${0.5 + 0.3 * Math.sin(t + a * 20)})`; ctx.fillRect(inL + a * (inR - inL), top + b * (bot - top) * 0.8, 3, 4); }
  ctx.restore();
  
  g = ctx.createRadialGradient(vx, bot, 5, vx, bot, (inR - inL) * 0.8);
  g.addColorStop(0, 'rgba(255,190,110,0.8)'); g.addColorStop(1, 'rgba(255,120,60,0)');
  ctx.fillStyle = g; ctx.fillRect(inL, top, inR - inL, bot - top + 20);
  
  g = ctx.createLinearGradient(0, bot, 0, h);
  g.addColorStop(0, '#2b2a33'); g.addColorStop(1, '#121118');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(inL, bot); ctx.lineTo(inR, bot); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,170,120,0.18)'; U.ellipse(ctx, vx + 30, h * 0.82, w * 0.12, h * 0.03); ctx.fill(); 
  
  const wall = (x0, xIn, dark) => {
    ctx.save();
    ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(xIn, top); ctx.lineTo(xIn, bot); ctx.lineTo(x0, h); ctx.closePath();
    const wg = ctx.createLinearGradient(x0, 0, xIn, 0);
    wg.addColorStop(0, dark ? '#2a0f0e' : '#3a1512'); wg.addColorStop(1, '#6a2a22');
    ctx.fillStyle = wg; ctx.fill(); ctx.clip();
    ctx.strokeStyle = 'rgba(20,6,6,0.6)'; ctx.lineWidth = 1;
    for (let k = 0; k <= 40; k++) { const f = k / 40; ctx.beginPath(); ctx.moveTo(x0, f * h); ctx.lineTo(xIn, top + f * (bot - top)); ctx.stroke(); }
    for (let k = 0; k < 40; k++) for (let m = 0; m < 8; m++) {
      const f = (k + 0.5) / 40, e = (m + (k % 2) * 0.5) / 8;
      const x = U.lerp(x0, xIn, e), y = U.lerp(f * h, top + f * (bot - top), e), hh = U.lerp(h / 40, (bot - top) / 40, e);
      ctx.beginPath(); ctx.moveTo(x, y - hh / 2); ctx.lineTo(x, y + hh / 2); ctx.stroke();
    }
    ctx.restore();
  };
  wall(0, inL, false); wall(w, inR, true);
  
  ctx.strokeStyle = '#11090a'; ctx.lineWidth = 3;
  for (let k = 0; k < 3; k++) {
    const y0 = h * (0.12 + k * 0.17), e0 = 0.25, e1 = 0.75;
    const p = (e, y) => [U.lerp(w, inR, e), U.lerp(y, top + (y / h) * (bot - top), e)];
    ctx.beginPath(); ctx.moveTo(...p(e0, y0)); ctx.lineTo(...p(e1, y0)); ctx.moveTo(...p(e0, y0 - 30)); ctx.lineTo(...p(e1, y0 - 30));
    ctx.moveTo(...p(e0, y0)); ctx.lineTo(...p(e1, y0 + h * 0.17)); ctx.stroke();
  }
  
  const on = Math.sin(t * 17) > -0.8;
  ctx.font = `bold ${Math.floor(h * 0.05)}px Impact, sans-serif`;
  ctx.fillStyle = on ? '#ff4fa3' : '#5a1a3a'; ctx.shadowColor = '#ff4fa3'; ctx.shadowBlur = on ? 20 : 0;
  ctx.save(); ctx.translate(w * 0.14, h * 0.3); ctx.transform(1, 0.35, 0, 1, 0, 0); ctx.fillText('DELI', 0, 0); ctx.restore();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(120,230,255,0.75)'; ctx.font = `bold ${Math.floor(h * 0.03)}px "Comic Sans MS", cursive`;
  ctx.save(); ctx.translate(w * 0.72, h * 0.62); ctx.transform(1, -0.3, 0, 1, 0, 0); ctx.fillText("NYC '92", 0, 0); ctx.restore();
  
  ctx.fillStyle = '#1f4a34'; ctx.beginPath(); ctx.moveTo(w * 0.08, h * 0.9); ctx.lineTo(w * 0.24, h * 0.8); ctx.lineTo(w * 0.24, h * 0.68); ctx.lineTo(w * 0.08, h * 0.74); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#143324'; ctx.beginPath(); ctx.moveTo(w * 0.08, h * 0.74); ctx.lineTo(w * 0.24, h * 0.68); ctx.lineTo(w * 0.27, h * 0.66); ctx.lineTo(w * 0.11, h * 0.72); ctx.closePath(); ctx.fill();
  
  for (let k = 0; k < 6; k++) {
    const p = (t * 0.3 + k / 6) % 1;
    ctx.fillStyle = `rgba(220,220,240,${0.18 * (1 - p)})`; U.ellipse(ctx, w * 0.58 + Math.sin(p * 6 + k) * 20, h * 0.8 - p * h * 0.3, 30 + p * 50, 18 + p * 30); ctx.fill();
  }
  
  ctx.strokeStyle = 'rgba(170,190,255,0.35)'; ctx.lineWidth = 1;
  ctx.beginPath();
  for (const [a, b, s] of RAIN) { const x = (a * w + t * 60 * s) % w, y = (b * h + t * 900 * s) % h; ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 18 * s); }
  ctx.stroke();
}

const CLOUDS = Array.from({ length: 18 }, (_, i) => [U.ih(i, 1, 3), U.ih(i, 2, 3), 0.5 + U.ih(i, 3, 3)]);
const WAVES = Array.from({ length: 40 }, (_, k) => [U.ih(k, 9, 1), U.ih(k, 8, 1)]);
function drawIslandFromAbove(ctx, w, h, t, zoom) {
  if (CEL) { SKY.ocean(ctx, w, h, t, WAVES); SKY.island(ctx, w / 2, h / 2, Math.min(w, h) * 0.12 * zoom, Math.max(2, h / 220)); return; }
  let g = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, Math.max(w, h));
  g.addColorStop(0, '#1fa0d8'); g.addColorStop(1, '#0a4f8a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(200,240,255,0.25)'; ctx.lineWidth = 2;
  for (let k = 0; k < 40; k++) { const x = (U.ih(k, 9, 1) * w + t * 10) % w, y = U.ih(k, 8, 1) * h; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 12, y - 4, x + 24, y); ctx.stroke(); }
  const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.12 * zoom;
  ctx.fillStyle = 'rgba(120,240,230,0.5)'; U.ellipse(ctx, cx, cy, R * 1.25, R * 1.1); ctx.fill();
  ctx.fillStyle = '#f0dca0'; U.ellipse(ctx, cx, cy, R * 1.1, R * 0.98); ctx.fill();
  g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
  g.addColorStop(0, '#7de86a'); g.addColorStop(1, '#2f9a3e');
  ctx.fillStyle = g; U.ellipse(ctx, cx, cy, R, R * 0.88); ctx.fill();
  g = ctx.createRadialGradient(cx - R * 0.2, cy - R * 0.2, 0, cx - R * 0.2, cy - R * 0.2, R * 0.45);
  g.addColorStop(0, '#3a2020'); g.addColorStop(0.35, '#ff5a1a'); g.addColorStop(0.45, '#7a4a3a'); g.addColorStop(1, 'rgba(110,80,60,0)');
  ctx.fillStyle = g; U.ellipse(ctx, cx - R * 0.2, cy - R * 0.2, R * 0.45, R * 0.45); ctx.fill();
}
function drawClouds(ctx, w, h, t, speed) {
  for (const [a, b, s] of CLOUDS) {
    const y = ((b * h * 1.5 - t * speed * s) % (h * 1.5) + h * 1.5) % (h * 1.5) - h * 0.25;
    const x = a * w;
    if (CEL) { SKY.cloud(ctx, x, y, s, Math.max(2, h / 240)); continue; }
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let k = 0; k < 4; k++) { U.ellipse(ctx, x + k * 30 * s - 45 * s, y + Math.sin(k) * 10, 50 * s, 26 * s); ctx.fill(); }
  }
}
const STREAKS = Array.from({ length: 30 }, (_, k) => [U.ih(k, 4, 7), U.ih(k, 5, 7)]);
function drawSpeedLines(ctx, w, h, t) {
  if (CEL) { SKY.speedLines(ctx, w, h, t, STREAKS); return; }
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2;
  for (let k = 0; k < 30; k++) { const x = U.ih(k, 4, 7) * w, y = ((U.ih(k, 5, 7) * h - t * 1500) % h + h) % h; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 80); ctx.stroke(); }
}

const VILLAGE_EXTRAS = [[0.12, 0.66, 7, true], [0.86, 0.6, 13, true], [0.74, 0.72, 22, false], [0.24, 0.74, 31, true], [0.94, 0.76, 40, false], [0.05, 0.8, 55, true]];

export const SCENES = [
  { 
    mood: 'alley', 
    prewarm() { castFigure('kid', G.gender, FIG_PX, 'back'); castFigure('kid', G.gender, FIG_PX); },
    lines: () => [
      Object.assign({}, NARR, { text: 'New York City. Summer, 1992.' }),
      Object.assign(KID(), { text: 'Mom? ...Dad? You were right behind me at the hot dog cart...' }),
      Object.assign(KID(), { text: '(Maybe this alley cuts back to the avenue. It has to.)' }), 
    ],
    draw(ctx, w, h, t) {
      drawAlley(ctx, w, h, t);
      const k = Math.min(1, t / 5);
      const ks = U.lerp(3.4, 2.4, k), ky = U.lerp(h * 0.98, h * 0.7, k);
      ART.shadow(ctx, w * 0.5, ky, 9 * ks);
      kid3d(ctx, w * 0.5, ky - Math.abs(Math.sin(t * 8)) * 1.5 * ks, ks, { back: true });
      if (t < 6) {
        ctx.globalAlpha = Math.min(1, t) * Math.min(1, 6 - t);
        ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.floor(h * 0.045)}px Georgia, serif`;
        ctx.fillText('NEW YORK CITY — 1992', w * 0.06, h * 0.14); ctx.globalAlpha = 1;
      }
    },
  },
  { 
    mood: 'spiral', 
    lines: () => [
      Object.assign(KID(), { text: "...What's that noise? It sounds like... breathing?" }),
      Object.assign({}, NARR, { text: 'The wall beside you warps. A black circle spirals open like a whirlpool.' }),
      Object.assign(KID(), { text: 'Wh-what IS that?!' }),
      Object.assign({}, NARR, { text: 'A huge RED HAND lunges out of the spiral and grabs you by the jacket!', fx: c => { c.grabT = c.t; } }),
      Object.assign(KID(), { text: 'HEY! LET GO! MOOOOM!!', fx: c => { c.pullT = c.t; } }),
    ],
    shake: c => c.li >= 3,
    draw(ctx, w, h, t, li) {
      drawAlley(ctx, w, h, t + 5);
      const px = w * 0.2, py = h * 0.52;
      const pr = li >= 1 ? Math.min(h * 0.16, (t - 0) * h * 0.08 + (li >= 2 ? h * 0.1 : 0)) : h * 0.01 * (1 + Math.sin(t * 20));
      ART.portal(ctx, px, py, pr, t);
      let kx = w * 0.5, ky = h * 0.7, ks = 2.4;
      if (li >= 4) {
        const k = Math.min(1, (t - (CS.pullT || 0)) / 1.2);
        kx = U.lerp(kx, px + 10, k); ky = U.lerp(ky, py + 40, k); ks = U.lerp(2.4, 0.6, k * k);
        if (k >= 1 && !CS.flashed) { CS.flash = 1; CS.flashed = true; }
      }
      if (ks > 1.5) ART.shadow(ctx, kx, ky, 9 * ks);
      kid3d(ctx, kx, ky, ks, { flip: true });
      if (li >= 3) {
        const k = Math.min(1, (t - (CS.grabT || 0)) / 0.35);
        const hx = U.lerp(px + 10, kx - 20 * ks / 2.4, k), hy = U.lerp(py, ky - 60 * ks / 2.4, k);
        ART.redHand(ctx, px, py, hx, hy, k >= 1);
      }
    },
  },
  { 
    mood: 'fall', 
    prewarm() { for (let f = 0; f < FALL_FRAMES; f++) kidFallFigure(G.gender, FIG_PX, f); },
    lines: () => [
      Object.assign(KID(), { text: 'AAAAAAAAAAHHHHHH!!!', fx: () => { CS.flashed = false; } }),
      Object.assign({}, NARR, { text: 'Sky. Wind. Endless ocean. You are falling toward a tiny island at incredible speed!' }),
      Object.assign({}, NARR, { text: 'A volcano. Jungle. The ground rushes up to meet you—' }),
    ],
    shake: () => true,
    draw(ctx, w, h, t) {
      drawIslandFromAbove(ctx, w, h, t, 0.4 + t * 0.12);
      drawClouds(ctx, w, h, t, 700); drawSpeedLines(ctx, w, h, t);
      kidFalling(ctx, w, h, t, KID_H * 2.6 * 1.25);
    },
  },
  { 
    mood: 'wonder', 
    prewarm() { for (const f of [0, 1, 2]) { aerowingPortrait(f, SWOOP.px, 'fit', SWOOP.shot); aerowingRidePortrait(f, RIDE_PX, G.gender); } },
    lines: () => [
      Object.assign({}, NARR, { text: 'Right before impact, a winged creature snatches you out of the sky!', fx: c => { c.t = 0; } }),
      { who: 'Winged Dachi', portrait: 'aerowing', text: 'Kyaaaaa!!' },
      Object.assign({}, NARR, { text: 'It carries you up, up, over the jungle... to the top of the smoking volcano.' }),
    ],
    draw(ctx, w, h, t, li) {
      drawIslandFromAbove(ctx, w, h, t, 2.2 + (li >= 2 ? t * 0.4 : 0));
      drawClouds(ctx, w, h, t, 80);
      const k = Math.min(1, t / 0.8);
      const bx = U.lerp(w * 1.2, w / 2, k), by = h * 0.45 + Math.sin(t * 2) * 10;
      ctx.save(); ctx.imageSmoothingEnabled = false;
      if (li >= 1 || k >= 1) { 
        ctx.drawImage(ride(t), bx - RIDE_CSS / 2, by - RIDE_CSS / 2, RIDE_CSS, RIDE_CSS);
      } else { 
        ctx.restore(); kidFalling(ctx, w, h, t, KID_H * 2.2 * 1.25); ctx.save(); ctx.imageSmoothingEnabled = false;
        ctx.drawImage(aero(t), bx - SWOOP.css / 2, by - SWOOP.css / 2, SWOOP.css, SWOOP.css);
      }
      ctx.restore();
    },
  },
  { 
    mood: 'wonder', 
    prewarm() { for (const p of ['land', 'surprised', 'cheer']) kidFallFigure(G.gender, FIG_PX, p); castFigure('elder', G.gender, FIG_PX); VILLAGE_EXTRAS.forEach(([, , id, band]) => crowd(id, { bandage: band })); crowd(KUMABO, { bandage: true }); },
    lines: () => [
      Object.assign({}, ELDER, { text: 'At last... You have come. I have been expecting you, child of the other world.' }),
      Object.assign(KID(), { text: 'W-what?! Where am I?! What ARE you?! I was just in New York, and a hand—' }),
      Object.assign({}, NARR, { text: 'Before you can finish, creatures pour out of the huts all around you. This is a village... on top of a volcano. Many of them are hurt.' }),
      Object.assign({}, NARR, { text: 'A tiny pink one limps toward you. Half teddy bear, half robot. A bandage is wrapped over her ear.' }),
      Object.assign(KID(), { text: "Hey... hey, little one. Are you okay? Does it hurt?" }),
      { who: 'Kumabo', portrait: 'kumabo', text: '...Ku...ma... bo...' },
      Object.assign({}, ELDER, { text: 'There is no time for that! We are Dachis — friends of humans, or so all Dachis are meant to be. But something is turning our world against itself.' }),
      Object.assign({}, ELDER, { text: 'You must run to the next village. The Priest Dachis are waiting for you, for your initiation ceremony.' }),
      Object.assign(KID(), { text: "(Initiation...? I don't understand any of this...)" }),
      Object.assign({}, ELDER, { text: 'Do this, and there may yet be hope for little Kumabo. For all of us.' }),
      Object.assign(KID(), { text: '*sniff* ...All right. I’ll do it.' }),
    ],
    draw(ctx, w, h, t, li) {
      let g = ctx.createLinearGradient(0, 0, 0, h * 0.6);
      g.addColorStop(0, '#5a3c8c'); g.addColorStop(0.5, '#ff8a6a'); g.addColorStop(1, '#ffd08a');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      if (CEL) SKY.sunset(ctx, w, h);
      ctx.fillStyle = '#3a7ac0'; ctx.fillRect(0, h * 0.5, w, h * 0.1);
      ctx.fillStyle = 'rgba(255,240,200,0.5)'; for (let k = 0; k < 12; k++) ctx.fillRect(U.ih(k, 1, 2) * w, h * 0.5 + U.ih(k, 2, 2) * h * 0.1, 30, 2);
      
      for (let k = 0; k < 10; k++) { const p = (t * 0.08 + k / 10) % 1; ctx.fillStyle = `rgba(90,80,90,${0.35 * (1 - p)})`; U.ellipse(ctx, w * 0.18 + p * 80, h * 0.42 - p * h * 0.4, 40 + p * 70, 30 + p * 40); ctx.fill(); }
      
      g = ctx.createLinearGradient(0, h * 0.55, 0, h);
      g.addColorStop(0, '#6a3a2a'); g.addColorStop(0.3, '#8a6a5a'); g.addColorStop(1, '#b8a890');
      ctx.fillStyle = CEL ? '#9a7a62' : g; ctx.beginPath(); ctx.moveTo(0, h * 0.6); ctx.quadraticCurveTo(w * 0.5, h * 0.52, w, h * 0.6); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
      if (CEL) { 
        ctx.save(); ctx.clip(); SKY.dots(ctx, 0, h * 0.53, w, h * 0.08, '#6a3a2a', Math.max(6, Math.round(h / 90)), false); ctx.restore();
        ctx.beginPath(); ctx.moveTo(0, h * 0.6); ctx.quadraticCurveTo(w * 0.5, h * 0.52, w, h * 0.6);
        ctx.lineWidth = Math.max(2, h / 220); ctx.strokeStyle = '#0d0a14'; ctx.stroke();
      }
      ctx.fillStyle = `rgba(255,110,40,${0.5 + 0.2 * Math.sin(t * 3)})`; U.ellipse(ctx, w * 0.18, h * 0.6, w * 0.08, h * 0.015); ctx.fill();
      ART.hut(ctx, w * 0.35, h * 0.63, 1.6, '#d8763a');
      ART.hut(ctx, w * 0.62, h * 0.61, 1.4, '#c9543a');
      ART.hut(ctx, w * 0.84, h * 0.64, 1.7, '#e0a040');
      ART.torch(ctx, w * 0.46, h * 0.7, t, 1); ART.torch(ctx, w * 0.74, h * 0.72, t, 2);
      if (li >= 2) {
        VILLAGE_EXTRAS.forEach(([x, y, id, band], i) => {
          const k = Math.min(1, Math.max(0, (t - i * 0.2) / 0.5));
          ctx.globalAlpha = li > 2 ? 1 : k;
          ctx.drawImage(crowd(id, { bandage: band }), w * x - 64, Math.round(h * y - 112 + Math.sin(t * 3 + i) * 2), 128, 128);
        });
        ctx.globalAlpha = 1;
      }
      ART.shadow(ctx, w * 0.6, h * 0.74, 22); figure(ctx, 'elder', w * 0.6, h * 0.74 + Math.sin(t * 1.5) * 1, KID_H * 2.6 * 1.2, { flip: true });
      
      const drop = li === 0 ? Math.max(0, 1 - t / 0.45) ** 2 * h * 0.06 : 0;
      ART.shadow(ctx, w * 0.36, h * 0.76, 22); kidPosed(ctx, w * 0.36, h * 0.76 - drop, 2.6, VILLAGE_POSE[li], t);
      if (li >= 3) {
        const k = Math.min(1, (li > 3 ? 1 : t / 2.5));
        const img = crowd(KUMABO, { bandage: true });
        const x = U.lerp(w * 0.3, w * 0.46, k), y = h * 0.79;
        ctx.save(); ctx.translate(x, y + Math.abs(Math.sin(t * 4)) * -3 * (k < 1 ? 1 : 0)); ctx.scale(0.8, 0.8);
        ART.shadow(ctx, 0, 0, 24); ctx.drawImage(img, -64, -112, 128, 128); ctx.restore();
        if (li === 4 || li === 5) { ART.heart(ctx, x + 10, h * 0.64 - Math.sin(t * 3) * 6, 8, 'rgba(255,110,170,0.9)'); }
      }
    },
  },
];
