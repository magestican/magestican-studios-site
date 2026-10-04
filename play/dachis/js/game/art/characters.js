

import { U } from '../../engine/core/util.js';

export const ART = {
  shadow(ctx, x, y, rx, a = 0.28) {
    ctx.fillStyle = `rgba(10,20,30,${a})`; U.ellipse(ctx, x, y, rx, rx * 0.45); ctx.fill();
  },
  
  heart(ctx, x, y, s, fill) {
    ctx.beginPath(); ctx.moveTo(x, y + s * 0.9);
    ctx.bezierCurveTo(x - s * 1.4, y, x - s * 0.7, y - s * 1.1, x, y - s * 0.35);
    ctx.bezierCurveTo(x + s * 0.7, y - s * 1.1, x + s * 1.4, y, x, y + s * 0.9);
    ctx.fillStyle = fill; ctx.fill();
  },

  
  kid(ctx, x, y, o = {}) {
    const s = o.scale || 1, t = o.walk || 0, back = o.back, flip = o.flip, girl = o.gender === 'girl';
    ctx.save(); ctx.translate(x, y); ctx.scale(flip ? -s : s, s);
    if (!o.noShadow) ART.shadow(ctx, 0, 0, 9);
    const sw = Math.sin(t) * 3;
    ctx.lineJoin = 'round'; ctx.strokeStyle = '#1c1830'; ctx.lineWidth = 1.4;
    
    ctx.fillStyle = '#3d5ea8';
    ctx.fillRect(-5, -14 + Math.max(0, sw) * 0.3, 4, 11); ctx.fillRect(1, -14 + Math.max(0, -sw) * 0.3, 4, 11);
    ctx.fillStyle = '#fafafa';
    ctx.beginPath(); ctx.roundRect(-6.5, -4 - Math.max(0, sw), 6, 4.5, 1.5); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(0.5, -4 - Math.max(0, -sw), 6, 4.5, 1.5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e03c52'; ctx.fillRect(-6, -2 - Math.max(0, sw), 5, 1.2); ctx.fillRect(1, -2 - Math.max(0, -sw), 5, 1.2);
    
    const jg = ctx.createLinearGradient(-8, -28, 8, -12);
    jg.addColorStop(0, '#2ed1c0'); jg.addColorStop(1, '#1a8f8a');
    ctx.fillStyle = jg; ctx.beginPath(); ctx.roundRect(-7.5, -27, 15, 15, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7b3fc4'; ctx.fillRect(-7.5, -16, 15, 3); ctx.fillRect(-2, -27, 4, 11);
    
    ctx.fillStyle = '#2ed1c0';
    ctx.save(); ctx.translate(-7.5, -25); ctx.rotate(0.2 - sw * 0.06 + (o.shout ? -1.6 : 0)); ctx.beginPath(); ctx.roundRect(-2.5, 0, 5, 12, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f2c9a0'; U.ellipse(ctx, 0, 13, 2.4, 2.4); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#2ed1c0';
    ctx.save(); ctx.translate(7.5, -25); ctx.rotate(-0.2 + sw * 0.06); ctx.beginPath(); ctx.roundRect(-2.5, 0, 5, 12, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f2c9a0'; U.ellipse(ctx, 0, 13, 2.4, 2.4); ctx.fill(); ctx.restore();
    
    ctx.fillStyle = '#f2c9a0'; U.ellipse(ctx, 0, -35, 8, 8.5); ctx.fill(); ctx.stroke();
    
    ctx.fillStyle = '#4a2c1c';
    if (girl) {
      ctx.beginPath(); ctx.arc(0, -36, 8.6, Math.PI, 0); ctx.fill();
      ctx.save(); ctx.translate(back ? 0 : -6, -38); U.ellipse(ctx, back ? 0 : -3, 8, 3.5, 8); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#ff4fa3'; U.ellipse(ctx, back ? 0 : -8, -38, 3, 2.2); ctx.fill();
    }
    if (!back) {
      if (!girl) { ctx.fillStyle = '#4a2c1c'; ctx.fillRect(-7, -38, 14, 3); }
      ctx.fillStyle = '#1d1a26';
      if (o.scared) { U.ellipse(ctx, -3, -34, 1.8, 2.4); ctx.fill(); U.ellipse(ctx, 3, -34, 1.8, 2.4); ctx.fill(); ctx.beginPath(); ctx.arc(0, -29, 1.8, 0, Math.PI * 2); ctx.fill(); }
      else { U.ellipse(ctx, -3, -34, 1.3, 1.9); ctx.fill(); U.ellipse(ctx, 3, -34, 1.3, 1.9); ctx.fill(); ctx.beginPath(); ctx.arc(0, -31, 2.2, 0.2, Math.PI - 0.2); ctx.stroke(); }
      if (o.tear) { ctx.fillStyle = '#7fd4ff'; U.ellipse(ctx, -4, -30.5, 1, 1.6); ctx.fill(); }
    } else if (!girl) { ctx.fillStyle = '#4a2c1c'; ctx.beginPath(); ctx.arc(0, -35, 8.2, 0.1, Math.PI - 0.1); ctx.fill(); }
    if (!girl) { 
      ctx.fillStyle = '#d8283c'; ctx.beginPath(); ctx.arc(0, -38, 8.6, Math.PI, 0); ctx.fill(); ctx.stroke();
      ctx.fillRect(back ? -5 : -2, -39, back ? 10 : 12, 2.5);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-1, -45, 2, 3);
    }
    ctx.restore();
  },

  
  elder(ctx, x, y, t = 0, s = 1, noShadow = false) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (!noShadow) ART.shadow(ctx, 0, 0, 16);
    ctx.strokeStyle = '#231a14'; ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
    
    ctx.strokeStyle = '#6b4424'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(-20, -62); ctx.stroke();
    const glow = 0.6 + Math.sin(t * 3) * 0.3;
    const g = ctx.createRadialGradient(-20, -66, 0, -20, -66, 12);
    g.addColorStop(0, `rgba(255,120,80,${glow})`); g.addColorStop(1, 'rgba(255,60,20,0)');
    ctx.fillStyle = g; ctx.fillRect(-34, -80, 28, 28);
    ctx.fillStyle = '#ff5a3a'; U.ellipse(ctx, -20, -66, 4.5, 4.5); ctx.fill();
    ctx.strokeStyle = '#231a14'; ctx.lineWidth = 1.8;
    
    ctx.fillStyle = '#7a4a9c';
    ctx.beginPath(); ctx.moveTo(-14, -2); ctx.lineTo(-10, -34); ctx.lineTo(10, -34); ctx.lineTo(15, -2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e9b83a'; ctx.fillRect(-12, -18, 25, 3);
    
    ctx.fillStyle = '#9aa7b5'; ctx.beginPath(); ctx.roundRect(9, -32, 7, 18, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4c5866'; U.ellipse(ctx, 12.5, -24, 2, 2); ctx.fill();
    
    ctx.fillStyle = '#b07a4a'; ctx.beginPath(); ctx.roundRect(-18, -32, 8, 16, 3); ctx.fill(); ctx.stroke();
    
    ctx.fillStyle = '#b07a4a'; U.ellipse(ctx, 0, -44, 13, 12); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.rect(0, -60, 20, 30); ctx.clip();
    const mg = ctx.createLinearGradient(0, -56, 14, -32); mg.addColorStop(0, '#eef3f8'); mg.addColorStop(1, '#6d7a89');
    ctx.fillStyle = mg; U.ellipse(ctx, 0, -44, 13, 12); ctx.fill();
    ctx.strokeStyle = 'rgba(30,40,50,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(2, -50); ctx.lineTo(12, -50); ctx.moveTo(2, -38); ctx.lineTo(12, -40); ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = '#231a14'; ctx.lineWidth = 1.8; U.ellipse(ctx, 0, -44, 13, 12); ctx.stroke();
    
    ctx.fillStyle = '#efd2a8'; U.ellipse(ctx, -3, -42, 7, 6.5); ctx.fill();
    
    ctx.strokeStyle = '#231a14'; ctx.beginPath(); ctx.moveTo(-8, -45); ctx.lineTo(-3, -45); ctx.stroke();
    ctx.fillStyle = '#20252e'; U.ellipse(ctx, 5, -45, 3.6, 3.6); ctx.fill();
    ctx.fillStyle = `rgba(255,${60 + glow * 60},60,1)`; U.ellipse(ctx, 5, -45, 2.2, 2.2); ctx.fill();
    
    ctx.fillStyle = '#f4f1ea';
    U.ellipse(ctx, -6, -49, 4.5, 1.8); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-9, -38); ctx.quadraticCurveTo(-3, -12 + Math.sin(t * 2) * 1.5, 3, -38); ctx.closePath(); ctx.fill();
    
    ctx.fillStyle = '#b07a4a'; U.ellipse(ctx, -13, -44, 3.5, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#9aa7b5'; ctx.fillRect(11, -48, 5, 8); ctx.strokeRect(11, -48, 5, 8);
    
    ctx.beginPath(); ctx.moveTo(8, -54); ctx.lineTo(12, -64); ctx.stroke();
    ctx.fillStyle = '#ff5a3a'; U.ellipse(ctx, 12, -64, 2, 2); ctx.fill();
    ctx.restore();
  },

  
  
  
  
  redHand(ctx, x0, y0, x1, y1, grip) {
    const ang = Math.atan2(y1 - y0, x1 - x0), len = Math.hypot(x1 - x0, y1 - y0);
    const S = Math.max(1.8, Math.min(3.2, len / 60)), L = len / S;
    ctx.save(); ctx.translate(x0, y0); ctx.rotate(ang); ctx.scale(S, S);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const INK = '#14000a', line = 2.2 / S * 1.6;
    
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? 'rgba(20,0,30,0.85)' : 'rgba(60,10,80,0.7)'; ctx.beginPath(); ctx.arc(4 + i * 3, (i % 2 ? -1 : 1) * (10 + i), 7 - i * 0.6, 0, 6.2832); ctx.fill(); }
    
    ctx.beginPath(); ctx.moveTo(0, -13); ctx.quadraticCurveTo(L * 0.45, -17, L - 4, -8); ctx.lineTo(L - 4, 8); ctx.quadraticCurveTo(L * 0.45, 15, 0, 13); ctx.closePath();
    ctx.fillStyle = '#b3001e'; ctx.fill(); ctx.lineWidth = line; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = '#ff3a3a'; ctx.beginPath(); ctx.moveTo(L * 0.1, -12); ctx.quadraticCurveTo(L * 0.45, -15.5, L - 6, -7); ctx.lineTo(L - 8, -4); ctx.quadraticCurveTo(L * 0.45, -10, L * 0.1, -7); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#5a0010'; ctx.lineWidth = line * 0.7; ctx.beginPath(); ctx.moveTo(L * 0.25, 4); ctx.quadraticCurveTo(L * 0.5, 9, L * 0.7, 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(L * 0.35, -3); ctx.quadraticCurveTo(L * 0.55, 1, L * 0.75, -2); ctx.stroke();
    ctx.translate(L, 0);
    
    ctx.fillStyle = '#e0102a'; ctx.strokeStyle = INK; ctx.lineWidth = line;
    ctx.beginPath(); ctx.ellipse(4, 0, 12, 14, 0, 0, 6.2832); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff5a4a'; ctx.beginPath(); ctx.ellipse(1, -6, 6, 4, -0.3, 0, 6.2832); ctx.fill();
    const curl = grip ? 1.15 : 0.1;
    for (let i = 0; i < 4; i++) { 
      const fl = 13 - Math.abs(i - 1.5) * 2.2;
      ctx.save(); ctx.translate(13, -10.5 + i * 7); ctx.rotate(curl * 0.5 * (i % 2 ? 1 : 0.85));
      ctx.fillStyle = '#e0102a'; ctx.beginPath(); ctx.roundRect(0, -3, fl * 0.55, 6, 3); ctx.fill(); ctx.stroke();
      ctx.translate(fl * 0.5, 0); ctx.rotate(curl * 0.7);
      ctx.beginPath(); ctx.roundRect(0, -2.6, fl * 0.5, 5.2, 2.6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(fl * 0.45, -2.4); ctx.lineTo(fl * 0.5 + 5, 0); ctx.lineTo(fl * 0.45, 2.4); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.save(); ctx.translate(3, 12); ctx.rotate(0.9 + curl * 0.8); ctx.fillStyle = '#e0102a';
    ctx.beginPath(); ctx.roundRect(0, -3.2, 13, 6.4, 3.2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(12, -2.6); ctx.lineTo(17, 0); ctx.lineTo(12, 2.6); ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.restore();
  },

  
  portal(ctx, x, y, r, t) {
    if (r < 1) return;
    ctx.save(); ctx.translate(x, y);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.35);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.7, 'rgba(20,0,30,0.95)'); g.addColorStop(0.85, 'rgba(160,40,255,0.5)'); g.addColorStop(1, 'rgba(160,40,255,0)');
    ctx.fillStyle = g; U.ellipse(ctx, 0, 0, r * 1.35, r * 1.35); ctx.fill();
    ctx.rotate(t * 2.2);
    for (let arm = 0; arm < 5; arm++) {
      ctx.rotate(Math.PI * 2 / 5);
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const k = i / 40, a = k * 5.5, rr = k * r;
        const px = Math.cos(a) * rr + Math.sin(t * 7 + k * 9) * 2, py = Math.sin(a) * rr;
        if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
      }
      ctx.strokeStyle = `rgba(${120 + arm * 20},40,${200 + arm * 10},0.8)`; ctx.lineWidth = 3; ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.9)'; ctx.lineWidth = 6; ctx.globalCompositeOperation = 'source-atop'; ctx.stroke(); ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  },

  roundTree(ctx, x, y, s, t, seed) {
    ART.shadow(ctx, x + 6 * s, y + 2, 22 * s, 0.22);
    ctx.fillStyle = '#6b4424'; ctx.strokeStyle = '#3a2412'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x - 4 * s, y); ctx.lineTo(x - 3 * s, y - 26 * s); ctx.lineTo(x + 3 * s, y - 26 * s); ctx.lineTo(x + 4 * s, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    const sway = Math.sin(t * 1.2 + seed) * 1.5;
    const blobs = [[0, -44, 22], [-15, -34, 14], [15, -36, 15], [-6, -56, 14], [9, -52, 13]];
    for (const [bx, by, br] of blobs) {
      const g = ctx.createRadialGradient(x + (bx - br * 0.4) * s + sway, y + (by - br * 0.5) * s, 1, x + bx * s, y + by * s, br * s * 1.1);
      g.addColorStop(0, '#9be86a'); g.addColorStop(0.5, '#3fae45'); g.addColorStop(1, '#1f6e33');
      ctx.fillStyle = g; U.ellipse(ctx, x + bx * s + sway, y + by * s, br * s, br * s * 0.9); ctx.fill();
    }
  },
  palm(ctx, x, y, s, t, seed) {
    ART.shadow(ctx, x + 12 * s, y + 2, 18 * s, 0.2);
    ctx.strokeStyle = '#8a6236'; ctx.lineWidth = 5 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 10 * s, y - 30 * s, x + 6 * s, y - 58 * s); ctx.stroke();
    ctx.strokeStyle = '#5e3f1e'; ctx.lineWidth = 1;
    for (let i = 1; i < 7; i++) { const k = i / 7; const px = x + 10 * s * 2 * k * (1 - k) * 1.1 + 6 * s * k * k, py = y - 58 * s * k; ctx.beginPath(); ctx.moveTo(px - 2.5 * s, py); ctx.lineTo(px + 2.5 * s, py - 1); ctx.stroke(); }
    const tx = x + 6 * s, ty = y - 58 * s, sway = Math.sin(t * 1.5 + seed) * 0.06;
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i - 3) * 0.75 + sway;
      const ex = tx + Math.cos(a) * 30 * s, ey = ty + Math.sin(a) * 14 * s + 10 * s;
      ctx.strokeStyle = i % 2 ? '#2f9a3e' : '#44b84d'; ctx.lineWidth = 4 * s;
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo((tx + ex) / 2, ty - 12 * s, ex, ey); ctx.stroke();
    }
    ctx.fillStyle = '#6b4a24'; U.ellipse(ctx, tx - 3, ty + 3, 3 * s, 3 * s); ctx.fill(); U.ellipse(ctx, tx + 3, ty + 4, 3 * s, 3 * s); ctx.fill();
    ctx.lineCap = 'butt';
  },
  rock(ctx, x, y, s, dark) {
    ART.shadow(ctx, x, y, 14 * s, 0.25);
    const g = ctx.createLinearGradient(x - 10 * s, y - 20 * s, x + 10 * s, y);
    g.addColorStop(0, dark ? '#7b6a66' : '#c9c1b5'); g.addColorStop(1, dark ? '#3a302e' : '#7d7466');
    ctx.fillStyle = g; ctx.strokeStyle = '#2c2522'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x - 13 * s, y); ctx.lineTo(x - 10 * s, y - 12 * s); ctx.lineTo(x - 2 * s, y - 18 * s); ctx.lineTo(x + 9 * s, y - 13 * s); ctx.lineTo(x + 13 * s, y - 2 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
  },
  hut(ctx, x, y, s, roof) {
    ART.shadow(ctx, x, y, 34 * s, 0.25);
    ctx.strokeStyle = '#3a2412'; ctx.lineWidth = 1.5;
    
    const w = 26 * s, h = 22 * s;
    ctx.fillStyle = '#d9b27a'; ctx.beginPath(); ctx.moveTo(x - w, y - w * 0.5 + 6); ctx.lineTo(x, y + 6); ctx.lineTo(x, y + 6 - h); ctx.lineTo(x - w, y - w * 0.5 + 6 - h); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#b58a52'; ctx.beginPath(); ctx.moveTo(x + w, y - w * 0.5 + 6); ctx.lineTo(x, y + 6); ctx.lineTo(x, y + 6 - h); ctx.lineTo(x + w, y - w * 0.5 + 6 - h); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3a2412'; ctx.beginPath(); ctx.roundRect(x + w * 0.3, y - 13 * s, 9 * s, 15 * s, [4 * s, 4 * s, 0, 0]); ctx.fill();
    
    const ry = y + 6 - h;
    const rg = ctx.createLinearGradient(x - w, ry - 30 * s, x + w, ry);
    rg.addColorStop(0, U.shade(roof, 0.3)); rg.addColorStop(1, U.shade(roof, -0.3));
    ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(x - w * 1.25, ry - w * 0.3); ctx.lineTo(x, ry - 36 * s); ctx.lineTo(x + w * 1.25, ry - w * 0.3); ctx.lineTo(x, ry + 10 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = U.shade(roof, -0.4, 0.5);
    for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(x, ry - 36 * s); ctx.lineTo(x - w * 1.25 + i * w * 0.5, ry - w * 0.3 + (i < 3 ? i : 5 - i) * 5 * s + 4); ctx.stroke(); }
  },
  temple(ctx, x, y, t) {
    ART.shadow(ctx, x, y, 80, 0.25);
    ctx.strokeStyle = '#2c2522'; ctx.lineWidth = 1.5;
    
    for (let i = 0; i < 3; i++) {
      const w = 74 - i * 12, yy = y - i * 10;
      ctx.fillStyle = i % 2 ? '#d8d2c4' : '#c4bcab';
      ctx.beginPath(); ctx.moveTo(x - w, yy - w * 0.5 + 10); ctx.lineTo(x, yy + 10); ctx.lineTo(x + w, yy - w * 0.5 + 10); ctx.lineTo(x + w, yy - w * 0.5); ctx.lineTo(x, yy); ctx.lineTo(x - w, yy - w * 0.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    
    const py = y - 30;
    ctx.fillStyle = '#e8413c';
    for (const px of [-34, -12, 12, 34]) { ctx.fillRect(x + px - 3, py - 44 + Math.abs(px) * 0.5, 6, 44); ctx.strokeRect(x + px - 3, py - 44 + Math.abs(px) * 0.5, 6, 44); }
    
    for (let k = 0; k < 2; k++) {
      const ry = py - 44 - k * 26, w = 62 - k * 18;
      const g = ctx.createLinearGradient(0, ry - 20, 0, ry + 10);
      g.addColorStop(0, '#3fae8f'); g.addColorStop(1, '#1d5e52');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - w - 12, ry - 6); ctx.quadraticCurveTo(x - w * 0.5, ry, x, ry - 26); ctx.quadraticCurveTo(x + w * 0.5, ry, x + w + 12, ry - 6); ctx.quadraticCurveTo(x, ry + 14, x - w - 12, ry - 6); ctx.fill(); ctx.stroke();
    }
    const gl = 0.5 + Math.sin(t * 2) * 0.3;
    ctx.fillStyle = `rgba(255,220,120,${gl})`; U.ellipse(ctx, x, py - 104, 6, 6); ctx.fill();
  },
  spring(ctx, x, y, t) {
    ctx.fillStyle = '#8c7f73'; U.ellipse(ctx, x, y, 34, 17); ctx.fill();
    const g = ctx.createRadialGradient(x - 8, y - 4, 2, x, y, 28);
    g.addColorStop(0, '#d8fbff'); g.addColorStop(0.5, '#5fd6e8'); g.addColorStop(1, '#2a8fb0');
    ctx.fillStyle = g; U.ellipse(ctx, x, y, 28, 13); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) { const k = (t * 0.4 + i / 3) % 1; U.ellipse(ctx, x + 4, y + 1, 26 * k, 12 * k); ctx.globalAlpha = 1 - k; ctx.stroke(); }
    ctx.globalAlpha = 1;
  },
  torch(ctx, x, y, t, seed) {
    ctx.fillStyle = '#5e3f1e'; ctx.fillRect(x - 2, y - 26, 4, 26);
    const f = Math.sin(t * 13 + seed) * 2;
    const g = ctx.createRadialGradient(x, y - 30, 0, x, y - 30, 26);
    g.addColorStop(0, 'rgba(255,200,90,0.45)'); g.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 26, y - 56, 52, 52);
    ctx.fillStyle = '#ffb030'; ctx.beginPath(); ctx.moveTo(x - 5, y - 26); ctx.quadraticCurveTo(x - 4, y - 36, x + f * 0.5, y - 42 + f); ctx.quadraticCurveTo(x + 5, y - 34, x + 5, y - 26); ctx.fill();
    ctx.fillStyle = '#fff2a0'; U.ellipse(ctx, x, y - 30, 2.5, 4); ctx.fill();
  },
  speech(ctx, x, y, text) {
    ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
    const w = ctx.measureText(text).width + 16;
    ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.strokeStyle = '#1c1830'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(x - w / 2, y - 30, w, 22, 9); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 4, y - 8.5); ctx.lineTo(x, y); ctx.lineTo(x + 5, y - 8.5); ctx.fill();
    ctx.fillStyle = '#1c1830'; ctx.textAlign = 'center'; ctx.fillText(text, x, y - 14.5); ctx.textAlign = 'left';
  },
};
