

import { fabric, dye, part, looseThreads, designSeed } from './logic.js';

let uid = 0;
const NS = 'http://www.w3.org/2000/svg';
const INK = '#5b3b2a';


function rgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function hex(r, g, b) { return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
export function mix(a, b, t) { const x = rgb(a), y = rgb(b); return hex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t); }
export function shade(c, amt) { return amt >= 0 ? mix(c, '#ffffff', amt) : mix(c, '#000000', -amt); }
const lum = (c) => { const [r, g, b] = rgb(c); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };


let measurer = null;
export function sample(d, spacing) {
  if (!measurer) {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
    svg.style.position = 'absolute'; svg.style.visibility = 'hidden';
    measurer = document.createElementNS(NS, 'path');
    svg.appendChild(measurer);
    document.body.appendChild(svg);
  }
  measurer.setAttribute('d', d);
  const L = measurer.getTotalLength();
  const n = Math.max(1, Math.round(L / spacing));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const p = measurer.getPointAtLength((i / n) * L);
    const q = measurer.getPointAtLength(Math.min(L, (i / n) * L + 0.5));
    const r = measurer.getPointAtLength(Math.max(0, (i / n) * L - 0.5));
    pts.push({ x: p.x, y: p.y, a: Math.atan2(q.y - r.y, q.x - r.x) });
  }
  return pts;
}


const NECK_Y = { bustier: 154, square: 150, highneck: 86, vneck: 176, corset: 148, halter: 82, empire: 146, offshoulder: 132 };

const BODICE = {
  bustier: {
    d: 'M150,152 C152,136 170,128 186,134 C195,138 199,146 200,154 C201,146 205,138 214,134 C230,128 248,136 250,152 L238,227 L162,227 Z',
    neck: 'M150,152 C152,136 170,128 186,134 C195,138 199,146 200,154 C201,146 205,138 214,134 C230,128 248,136 250,152',
    details: ['M176,137 C177,170 172,200 176,227', 'M224,137 C223,170 228,200 224,227', 'M200,154 L200,227', 'M163,150 L168,227', 'M237,150 L232,227'],
  },
  square: {
    d: 'M146,114 L166,112 L168,150 L232,150 L234,112 L254,114 C256,140 250,165 246,178 L237,227 L163,227 L154,178 C150,165 144,140 146,114 Z',
    neck: 'M166,112 L168,150 L232,150 L234,112',
    details: ['M176,150 C180,180 174,205 178,227', 'M224,150 C220,180 226,205 222,227'],
  },
  highneck: {
    d: 'M176,82 C186,88 214,88 224,82 L228,100 C240,104 250,108 256,114 C257,140 251,165 246,178 L237,227 L163,227 L154,178 C149,165 143,140 144,114 C150,108 160,104 172,100 Z',
    neck: 'M176,82 C186,88 214,88 224,82',
    details: ['M172,100 C178,140 172,200 178,227', 'M228,100 C222,140 228,200 222,227', 'M200,88 L200,227'],
    buttons: true,
  },
  vneck: {
    d: 'M146,114 L178,110 L200,178 L222,110 L254,114 C256,140 250,165 246,178 L237,227 L163,227 L154,178 C150,165 144,140 146,114 Z',
    neck: 'M178,110 L200,178 L222,110',
    details: ['M170,140 C176,180 172,205 178,227', 'M230,140 C224,180 228,205 222,227'],
  },
  corset: {
    d: 'M152,146 C170,140 190,142 200,148 C210,142 230,140 248,146 L241,190 L237,230 L200,242 L163,230 L159,190 Z',
    neck: 'M152,146 C170,140 190,142 200,148 C210,142 230,140 248,146',
    details: ['M172,143 L176,234', 'M228,143 L224,234', 'M162,160 L166,230', 'M238,160 L234,230'],
    lacing: true,
  },
  
  
  halter: {
    d: 'M180,80 C192,85 208,85 220,80 L222,93 C230,116 244,134 252,150 C253,164 249,172 246,178 L237,227 L163,227 L154,178 C151,172 147,164 148,150 C156,134 170,116 178,93 Z',
    neck: 'M200,102 C210,113 210,129 200,140 C190,129 190,113 200,102',
    hole: 'M200,102 C210,113 210,129 200,140 C190,129 190,113 200,102 Z',
    details: ['M178,93 C192,98 208,98 222,93', 'M190,98 C190,124 184,150 178,180', 'M210,98 C210,124 216,150 222,180', 'M196,98 C197,110 198,118 199,124', 'M204,98 C203,110 202,118 201,124', 'M168,172 L172,227', 'M232,172 L228,227'],
  },
  empire: {
    d: 'M146,114 L170,112 C174,134 186,146 200,146 C214,146 226,134 230,112 L254,114 C256,138 251,158 246,170 L241,227 L159,227 L154,170 C149,158 144,138 146,114 Z',
    neck: 'M170,112 C174,134 186,146 200,146 C214,146 226,134 230,112',
    band: 'M153,165 C180,172 220,172 247,165 L246,182 C220,189 180,189 154,182 Z', bandColor: 3,
    waist: 'M154,174 C180,181 220,181 246,174',
    details: ['M166,128 C170,144 172,156 172,167', 'M234,128 C230,144 228,156 228,167', 'M182,146 C183,154 184,160 185,169', 'M218,146 C217,154 216,160 215,169',
      ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => { const x = 163 + i * 9.25; return `M${x.toFixed(1)},187 C${(x + 1.5).toFixed(1)},200 ${(x - 1.5).toFixed(1)},214 ${(x + (x - 200) * 0.03).toFixed(1)},227`; })],
  },
  offshoulder: {
    d: 'M120,124 C150,132 180,134 200,132 C220,134 250,132 280,124 L281,145 C268,149 258,152 252,156 C250,166 248,172 246,178 L237,227 L163,227 L154,178 C152,172 150,166 148,156 C142,152 132,149 119,145 Z',
    neck: 'M120,124 C150,132 180,134 200,132 C220,134 250,132 280,124',
    band: 'M120,124 C150,132 180,134 200,132 C220,134 250,132 280,124 L281,146 C250,155 220,157 200,155 C180,157 150,155 119,146 Z',
    bandDetails: ['M132,129 C131,136 132,142 134,149', 'M150,132 C149,139 150,145 152,152', 'M170,134 C169,141 170,147 172,154', 'M190,134 C189,141 190,148 191,155', 'M210,134 C211,141 210,148 209,155', 'M230,134 C231,141 230,147 228,154', 'M250,132 C251,139 250,145 248,152', 'M268,129 C269,136 268,142 266,149'],
    details: ['M176,156 C180,182 174,205 178,227', 'M224,156 C220,182 226,205 222,227', 'M200,156 L200,227'],
    sleeveShift: [-6, 32],
  },
};

const SLEEVE = {
  cap: { d: 'M146,114 C130,114 118,124 116,140 C126,146 140,146 150,140 C148,130 147,122 146,114 Z', cuff: 'M116,140 C126,146 140,146 150,140', details: ['M140,118 C132,124 128,132 126,142'], ball: false },
  puff: { d: 'M148,112 C128,104 104,112 100,136 C98,156 112,168 128,164 C140,160 148,150 150,140 Z', cuff: 'M101,146 C106,162 122,168 140,158', details: ['M140,112 C132,118 128,126 126,134', 'M128,110 C118,118 114,128 114,138', 'M116,114 C108,122 106,132 108,142', 'M103,148 C110,160 124,163 139,155'], ball: true },
  bishop: { d: 'M146,114 C126,116 112,130 108,160 L96,280 C94,292 100,302 114,302 L130,302 C140,302 144,292 142,280 L146,190 C150,160 152,130 146,114 Z', cuff: 'M96,300 C110,307 130,307 143,300', details: ['M128,130 C120,180 112,230 108,278', 'M140,150 C136,200 130,240 128,280', 'M97,282 L143,282'], ball: false, cuffBand: 'M97,282 L143,282 L143,300 C130,306 110,306 97,300 Z' },
  angel: { d: 'M154,150 C130,128 90,126 74,156 C60,184 66,224 90,236 C110,244 128,226 138,206 C146,190 152,172 156,160 Z', cuff: 'M68,210 C76,236 100,246 124,230', details: ['M146,150 C120,150 100,168 92,190', 'M140,166 C118,176 104,196 100,220', 'M150,144 C126,136 100,142 84,160', 'M132,196 C120,210 108,222 92,230'], ball: true },
  
  flutter: { d: 'M148,112 C130,106 112,114 104,132 Q106,142 112,141 Q116,152 124,148 Q130,157 137,150 Q144,154 148,144 C151,134 151,122 148,112 Z', cuff: 'M104,132 Q106,142 112,141 Q116,152 124,148 Q130,157 137,150 Q144,154 148,144', details: ['M142,114 C134,122 128,134 124,146', 'M132,112 C122,120 116,130 112,140', 'M147,122 C143,132 140,142 137,150', 'M147,114 C134,113 120,118 110,127'], ball: false },
  bell: { d: 'M146,114 C130,116 120,128 118,150 L114,206 C104,236 88,270 74,300 Q86,312 99,305 Q112,316 125,307 Q138,315 150,302 C146,270 142,236 140,206 L145,168 C149,146 150,128 146,114 Z', cuff: 'M74,300 Q86,312 99,305 Q112,316 125,307 Q138,315 150,302', inner: 'M77,301 C98,292 128,292 149,302 Q138,309 125,303 Q112,310 99,302 Q88,307 77,301 Z', details: ['M114,206 C122,211 132,211 140,206', 'M120,212 C110,244 96,272 86,304', 'M130,212 C124,246 116,278 112,308', 'M137,212 C136,248 136,280 138,310', 'M132,124 C126,150 124,180 126,204'], ball: false },
  juliet: { d: 'M148,112 C128,104 104,112 100,136 C98,152 104,160 112,162 L106,284 C106,296 112,302 122,302 L132,302 C140,302 143,296 143,286 L146,156 C149,148 150,144 150,140 Z', puff: 'M148,112 C128,104 104,112 100,136 C98,156 112,168 128,164 C140,160 148,150 150,140 Z', cuff: 'M106,300 C116,305 134,305 143,300', cuffBand: 'M107,278 L143,278 L143,298 C132,304 116,304 106,298 Z', details: ['M140,112 C132,118 128,126 126,134', 'M128,110 C118,118 114,128 114,138', 'M116,114 C108,122 106,132 108,142', 'M103,148 C110,160 124,163 139,155', 'M130,168 L126,278', 'M111,222 C120,226 132,225 141,220'], ball: false },
};

function hemWave(xs, x0, x1, hy, drop, amp, range) {
  
  const [a, b] = range;
  const yAt = (x) => hy + drop * Math.sin(Math.PI * Math.min(1, Math.max(0, (x - a) / (b - a))));
  let s = '';
  for (let i = 1; i < xs.length; i++) {
    const mx = (xs[i - 1] + xs[i]) / 2;
    s += ` Q${mx.toFixed(1)},${(yAt(mx) + amp).toFixed(1)} ${xs[i].toFixed(1)},${yAt(xs[i]).toFixed(1)}`;
  }
  return { s, yAt };
}


function skirtShape(o) {
  const { tl, tr, ty, hl, hr, hy, R, L, waves, amp, drop } = o;
  const range = o.range || [hl, hr];
  const rl = []; for (let i = 0; i <= waves; i++) rl.push(hr - (i * (hr - hl)) / waves);
  const w = hemWave(rl, hr, hl, hy, drop, amp, range);
  const lr = [...rl].reverse();
  const w2 = hemWave(lr, hl, hr, hy, drop, amp, range);
  const d = `M${tl},${ty} L${tr},${ty} C${R.join(' ')} ${hr},${w.yAt(hr).toFixed(1)}${w.s} C${L.join(' ')} ${tl},${ty} Z`;
  const hem = `M${hl},${w.yAt(hl).toFixed(1)}${w2.s}`;
  const ft = o.foldTop || [tl, tr, ty];
  const folds = [], lights = [];
  for (let i = 1; i < waves; i++) {
    const hx = rl[i], hyy = w.yAt(hx);
    const wx = ft[1] - (i * (ft[1] - ft[0])) / waves;
    folds.push(`M${wx.toFixed(1)},${ft[2] + 6} Q${(wx + (hx - wx) * 0.35).toFixed(1)},${((ft[2] + hyy) / 2).toFixed(1)} ${hx.toFixed(1)},${(hyy - 2).toFixed(1)}`);
  }
  for (let i = 0; i < waves; i++) {
    const hx = (rl[i] + rl[i + 1]) / 2, hyy = w.yAt(hx) + amp * 0.8;
    const wx = ft[1] - ((i + 0.5) * (ft[1] - ft[0])) / waves;
    lights.push(`M${wx.toFixed(1)},${ft[2] + 14} Q${(wx + (hx - wx) * 0.4).toFixed(1)},${((ft[2] + hyy) / 2).toFixed(1)} ${hx.toFixed(1)},${(hyy - 8).toFixed(1)}`);
  }
  return { d, hem, folds, lights };
}

function skirtLayers(id, q) {
  const wob = 1 + (1 - q) * 1.6;
  if (id === 'aline') return [{ ...skirtShape({ tl: 166, tr: 234, ty: 224, hl: 96, hr: 304, hy: 540, R: [256, 300, 294, 440], L: [106, 440, 144, 300], waves: 6, amp: 7 * wob, drop: 14 }), slot: 1 }];
  if (id === 'ballgown') return [{ ...skirtShape({ tl: 164, tr: 236, ty: 224, hl: 36, hr: 364, hy: 552, R: [310, 250, 360, 380], L: [40, 380, 90, 250], waves: 10, amp: 9 * wob, drop: 18 }), slot: 1 }];
  if (id === 'mermaid') {
    const s = skirtShape({ tl: 166, tr: 234, ty: 224, hl: 84, hr: 316, hy: 552, R: [252, 330, 226, 440], L: [174, 440, 148, 330], waves: 8, amp: 6 * wob, drop: 12, foldTop: [176, 224, 430] });
    
    s.d = s.d.replace(/C252 330 226 440 316,([\d.]+)/, (m, y) => `C244,300 244,380 228,430 C252,470 292,520 316,${y}`)
      .replace(/C174 440 148 330 166,224 Z/, 'C108,520 148,470 172,430 C156,380 156,300 166,224 Z');
    return [{ ...s, slot: 1 }];
  }
  if (id === 'flounce') {
    const up = skirtShape({ tl: 166, tr: 234, ty: 224, hl: 112, hr: 288, hy: 450, R: [250, 290, 282, 380], L: [118, 380, 150, 290], waves: 6, amp: 3 * wob, drop: 10 });
    const fl = skirtShape({ tl: 114, tr: 286, ty: 440, hl: 78, hr: 322, hy: 556, R: [300, 470, 318, 520], L: [82, 520, 100, 470], waves: 14, amp: 6 * wob, drop: 14 });
    return [{ ...fl, slot: 2 }, { ...up, slot: 1, band: up.hem }];
  }
  if (id === 'odette') {
    const under = skirtShape({ tl: 164, tr: 236, ty: 224, hl: 36, hr: 364, hy: 552, R: [310, 250, 360, 380], L: [40, 380, 90, 250], waves: 10, amp: 8 * wob, drop: 18 });
    const left = skirtShape({ tl: 164, tr: 202, ty: 224, hl: 30, hr: 162, hy: 546, R: [198, 320, 188, 430], L: [34, 380, 88, 250], waves: 6, amp: 9 * wob, drop: 18, range: [30, 370] });
    const right = skirtShape({ tl: 198, tr: 236, ty: 224, hl: 238, hr: 370, hy: 546, R: [312, 250, 366, 380], L: [212, 430, 202, 320], waves: 6, amp: 9 * wob, drop: 18, range: [30, 370] });
    return [{ ...under, slot: 2 }, { ...left, slot: 1, ruffle: true }, { ...right, slot: 1, ruffle: true }];
  }
  
  
  if (id === 'tea') {
    const pet = skirtShape({ tl: 170, tr: 230, ty: 300, hl: 76, hr: 324, hy: 482, R: [262, 330, 318, 420], L: [82, 420, 138, 330], waves: 20, amp: 4 * wob, drop: 12 });
    const main = skirtShape({ tl: 166, tr: 234, ty: 224, hl: 64, hr: 336, hy: 466, R: [270, 244, 334, 372], L: [66, 372, 130, 244], waves: 12, amp: 9 * wob, drop: 12 });
    return [{ ...pet, slot: 2 }, { ...main, slot: 1, main: true }];
  }
  if (id === 'highlow') {
    const back = skirtShape({ tl: 166, tr: 234, ty: 224, hl: 78, hr: 322, hy: 540, R: [262, 300, 320, 440], L: [80, 440, 138, 300], waves: 8, amp: 6 * wob, drop: 16 });
    const front = skirtShape({ tl: 166, tr: 234, ty: 224, hl: 92, hr: 308, hy: 516, R: [256, 290, 298, 420], L: [102, 420, 144, 290], waves: 8, amp: 6 * wob, drop: -122 });
    return [{ ...back, slot: 1, dark: true }, { ...front, slot: 1, main: true }];
  }
  if (id === 'bubble') {
    const s = skirtShape({ tl: 166, tr: 234, ty: 224, hl: 122, hr: 278, hy: 408, R: [300, 236, 326, 384], L: [74, 384, 100, 236], waves: 9, amp: 4 * wob, drop: 8 });
    return [{ ...s, slot: 1, main: true, ball: true, tuck: true }];
  }
  if (id === 'bustle') {
    const back = skirtShape({ tl: 170, tr: 230, ty: 236, hl: 84, hr: 316, hy: 392, R: [306, 236, 340, 340], L: [60, 340, 94, 236], waves: 5, amp: 10 * wob, drop: -30 });
    const under = skirtShape({ tl: 166, tr: 234, ty: 224, hl: 92, hr: 308, hy: 552, R: [272, 262, 300, 420], L: [100, 420, 128, 262], waves: 8, amp: 7 * wob, drop: 14 });
    const apron = skirtShape({ tl: 166, tr: 234, ty: 224, hl: 118, hr: 282, hy: 322, R: [262, 240, 292, 290], L: [108, 290, 138, 240], waves: 3, amp: 18 * wob, drop: 40 });
    apron.folds.push('M168,244 Q200,262 232,244', 'M156,268 Q200,300 244,268', 'M146,292 Q200,330 254,292');
    apron.lights.push('M166,254 Q200,274 234,254', 'M154,280 Q200,314 246,280');
    return [{ ...back, slot: 2, ball: true }, { ...under, slot: 1, main: true }, { ...apron, slot: 2, band: apron.hem }];
  }
  return [];
}


function texturePattern(id, tex, c) {
  const dk = shade(c, -0.35), lt = shade(c, 0.3), P = (w, h, body) => `<pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse">${body}</pattern>`;
  switch (tex) {
    case 'weave': return P(4, 4, `<path d="M0,.5H4M.5,0V4" stroke="${dk}" stroke-opacity=".16" stroke-width=".6"/>`);
    case 'slub': return P(26, 8, `<path d="M0,2H9M13,2H26M4,6H7M11,6H22" stroke="${dk}" stroke-opacity=".16" stroke-width=".9"/><path d="M2,4H8M16,4H19" stroke="${lt}" stroke-opacity=".3" stroke-width=".8"/>`);
    case 'check': return P(18, 18, `<rect width="9" height="18" fill="#fff" fill-opacity=".32"/><rect width="18" height="9" fill="#fff" fill-opacity=".32"/><path d="M0,0H18M0,9H18" stroke="${dk}" stroke-opacity=".08"/>`);
    case 'floral': return P(46, 46,
      `<g fill="${lt}" fill-opacity=".38" stroke="${lt}" stroke-opacity=".5" stroke-width=".6">` +
      [0, 72, 144, 216, 288].map((r) => `<ellipse cx="23" cy="16" rx="3.4" ry="6.5" transform="rotate(${r} 23 23)"/>`).join('') +
      `<circle cx="23" cy="23" r="2.4" fill="${dk}" fill-opacity=".25"/>` +
      `<path d="M0,0 C6,2 8,8 4,10 M46,46 C40,44 38,38 42,36 M46,0 C40,3 39,8 43,10 M0,46 C5,43 7,38 3,36" fill="none"/>` +
      `<circle cx="0" cy="23" r="1.2"/><circle cx="46" cy="23" r="1.2"/><circle cx="23" cy="0" r="1.2"/><circle cx="23" cy="46" r="1.2"/></g>`);
    case 'net': return P(8, 7, `<path d="M0,3.5 L2,0 H6 L8,3.5 L6,7 H2 Z" fill="none" stroke="#fff" stroke-opacity=".32" stroke-width=".5"/>`);
    case 'velvet': return P(6, 6, `<circle cx="1" cy="2" r=".7" fill="#000" fill-opacity=".12"/><circle cx="4" cy="5" r=".6" fill="#fff" fill-opacity=".06"/>`);
    case 'sparkle': return P(10, 10,
      `<circle cx="2.5" cy="2.5" r="2" fill="${lt}" fill-opacity=".8"/><circle cx="7.5" cy="2.5" r="2" fill="${dk}" fill-opacity=".45"/>` +
      `<circle cx="5" cy="7.5" r="2" fill="${shade(c, 0.55)}" fill-opacity=".8"/><circle cx="0" cy="7.5" r="2" fill="${c}"/><circle cx="10" cy="7.5" r="2" fill="${c}"/><circle cx="2" cy="2" r=".6" fill="#fff"/>`);
    case 'brocade': return P(40, 40,
      `<g fill="none" stroke="#e5c472" stroke-opacity=".8" stroke-width="1.1"><path d="M20,4 L32,20 L20,36 L8,20 Z"/><circle cx="20" cy="20" r="5"/>` +
      `<path d="M20,11 C24,15 24,25 20,29 C16,25 16,15 20,11"/><path d="M0,0 C4,4 4,8 0,10 M40,0 C36,4 36,8 40,10 M0,40 C4,36 4,32 0,30 M40,40 C36,36 36,32 40,30"/></g><circle cx="20" cy="20" r="1.5" fill="#e5c472"/>`);
    
    case 'chiffon': return P(14, 14, `<path d="M0,14 L14,0 M-3,3 L3,-3 M11,17 L17,11" stroke="${lt}" stroke-opacity=".32" stroke-width="1.6"/><path d="M0,7 L7,0 M7,14 L14,7" stroke="${dk}" stroke-opacity=".1" stroke-width=".8"/>`);
    case 'organza': return P(5, 5, `<path d="M0,.5H5M.5,0V5" stroke="#fff" stroke-opacity=".3" stroke-width=".45"/><circle cx="3" cy="3" r=".45" fill="#fff" fill-opacity=".55"/>`);
    case 'tartan': return P(36, 36,
      `<rect width="12" height="36" fill="${dk}" fill-opacity=".36"/><rect width="36" height="12" fill="${dk}" fill-opacity=".36"/>` +
      `<rect x="18" width="4" height="36" fill="${lt}" fill-opacity=".38"/><rect y="18" width="36" height="4" fill="${lt}" fill-opacity=".38"/>` +
      `<path d="M28.5,0V36M0,28.5H36" stroke="#f4ecd8" stroke-opacity=".6" stroke-width="1.1"/><path d="M6,0V36M0,6H36" stroke="#1d2233" stroke-opacity=".32" stroke-width="1.6"/>` +
      `<path d="M0,36 L36,0" stroke="#000" stroke-opacity=".04" stroke-width="2"/>`);
    case 'lame': return P(8, 4, `<path d="M0,1 Q2,0 4,1 T8,1" stroke="${shade(c, 0.6)}" stroke-opacity=".55" stroke-width=".7" fill="none"/><path d="M0,3 Q2,4 4,3 T8,3" stroke="${dk}" stroke-opacity=".35" stroke-width=".6" fill="none"/>`);
    case 'damask': return P(40, 52,
      `<g fill="${lt}" fill-opacity=".2"><path d="M20,6 C28,16 32,22 20,34 C8,22 12,16 20,6 Z"/><path d="M20,34 C25,40 30,46 20,52 C10,46 15,40 20,34 Z" fill-opacity=".12"/><circle cx="20" cy="26" r="2.4"/>` +
      `<path d="M0,26 C6,20 8,12 0,6 M40,26 C34,20 32,12 40,6 M0,26 C6,32 8,40 0,46 M40,26 C34,32 32,40 40,46" fill="none" stroke="${lt}" stroke-opacity=".34" stroke-width="1.6"/></g>` +
      `<path d="M20,13 C24,18 25,22 20,28 C15,22 16,18 20,13 Z" fill="${dk}" fill-opacity=".16"/><circle cx="0" cy="0" r="2" fill="${lt}" fill-opacity=".25"/><circle cx="40" cy="0" r="2" fill="${lt}" fill-opacity=".25"/><circle cx="0" cy="52" r="2" fill="${lt}" fill-opacity=".25"/><circle cx="40" cy="52" r="2" fill="${lt}" fill-opacity=".25"/>`);
    
    case 'guipure': return P(30, 30,
      `<g fill="${lt}" fill-opacity=".5" stroke="${dk}" stroke-opacity=".35" stroke-width=".5">` +
      [0, 60, 120, 180, 240, 300].map((r) => `<ellipse cx="15" cy="9.5" rx="2.6" ry="4.2" transform="rotate(${r} 15 15)"/>`).join('') +
      `<circle cx="15" cy="15" r="2.2" fill="${shade(c, 0.55)}" fill-opacity=".8"/></g>` +
      `<path d="M0,0 L7,7 M30,0 L23,7 M0,30 L7,23 M30,30 L23,23" stroke="${lt}" stroke-opacity=".55" stroke-width="1.1"/>` +
      `<circle cx="0" cy="15" r="2.4" fill="${dk}" fill-opacity=".45"/><circle cx="30" cy="15" r="2.4" fill="${dk}" fill-opacity=".45"/><circle cx="15" cy="0" r="2.4" fill="${dk}" fill-opacity=".45"/><circle cx="15" cy="30" r="2.4" fill="${dk}" fill-opacity=".45"/>` +
      `<circle cx="0" cy="0" r="1.3" fill="#fff" fill-opacity=".7"/><circle cx="30" cy="30" r="1.3" fill="#fff" fill-opacity=".7"/><circle cx="30" cy="0" r="1.3" fill="#fff" fill-opacity=".7"/><circle cx="0" cy="30" r="1.3" fill="#fff" fill-opacity=".7"/>`);
    default: return '';
  }
}


const SHEER = { net: 0.82, chiffon: 0.74, organza: 0.64 };
function shadeKind(tex) { return tex === 'sheen' || tex === 'silk' || tex === 'organza' || tex === 'damask' ? 'sheen' : tex === 'velvet' ? 'velvet' : tex === 'sparkle' ? 'sheen' : tex === 'lame' ? 'metal' : 'cyl'; }
const shiny = (tex) => ['sheen', 'metal'].includes(shadeKind(tex));

function commonDefs(p) {
  const lin = (id, stops, attrs = 'x1="0" y1="0" x2="1" y2="0"') => `<linearGradient id="${p}${id}" ${attrs}>${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</linearGradient>`;
  return lin('cyl', [[0, '#000', 0.38], [0.18, '#000', 0.06], [0.42, '#fff', 0.14], [0.6, '#fff', 0], [0.82, '#000', 0.1], [1, '#000', 0.4]]) +
    lin('sheen', [[0, '#000', 0.45], [0.14, '#000', 0.05], [0.3, '#fff', 0.55], [0.4, '#fff', 0.06], [0.55, '#000', 0.08], [0.68, '#fff', 0.32], [0.84, '#000', 0.12], [1, '#000', 0.48]]) +
    lin('metal', [[0, '#000', 0.55], [0.1, '#fff', 0.5], [0.2, '#000', 0.22], [0.34, '#fff', 0.72], [0.44, '#000', 0.1], [0.58, '#fff', 0.28], [0.7, '#000', 0.3], [0.84, '#fff', 0.5], [1, '#000', 0.6]]) +
    lin('velvet', [[0, '#000', 0.7], [0.28, '#000', 0.18], [0.5, '#fff', 0.1], [0.72, '#000', 0.18], [1, '#000', 0.7]]) +
    lin('top', [[0, '#000', 0.32], [0.08, '#000', 0]], 'x1="0" y1="0" x2="0" y2="1"') +
    `<radialGradient id="${p}ball" cx=".42" cy=".36" r=".72"><stop offset="0" stop-color="#fff" stop-opacity=".32"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".42"/></radialGradient>` +
    `<radialGradient id="${p}pearl" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#efe6d4"/><stop offset="1" stop-color="#a99a80"/></radialGradient>` +
    `<radialGradient id="${p}rhin" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#dfeefa"/><stop offset="1" stop-color="#7f93a8"/></radialGradient>` +
    `<radialGradient id="${p}jet" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#8a8a96"/><stop offset=".4" stop-color="#26232b"/><stop offset="1" stop-color="#050407"/></radialGradient>` +
    `<radialGradient id="${p}form" cx=".45" cy=".3" r=".9"><stop offset="0" stop-color="#f3e6d2"/><stop offset=".7" stop-color="#dcc6a6"/><stop offset="1" stop-color="#b89c78"/></radialGradient>` +
    `<filter id="${p}soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.2"/></filter>` +
    `<filter id="${p}drop" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity=".28"/></filter>` +
    `<pattern id="${p}emb" width="22" height="22" patternUnits="userSpaceOnUse"><g fill="none" stroke="#d9b25a" stroke-width="1"><path d="M11,2 C16,6 16,10 11,11 C6,12 6,17 11,20"/><path d="M2,11 C5,8 8,9 8,12"/><path d="M20,11 C17,14 14,13 14,10"/></g><circle cx="11" cy="11" r="1" fill="#e9c878"/></pattern>`;
}


function paintShape(ctx, d, slot, opts = {}) {
  const { p, mode, f1, f2, c1, c2 } = ctx;
  const f = slot === 2 ? f2 : f1, c = opts.color || (slot === 2 ? c2 : c1);
  if (mode === 'sketch') {
    return `<path d="${d}" fill="${mix(c, '#fbf6ee', 0.12)}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
  }
  const texId = `${p}tx${slot}${opts.color ? 'x' : ''}`;
  const kind = opts.ball ? 'ball' : shadeKind(f.tex);
  const alpha = SHEER[f.tex] ? ` fill-opacity="${SHEER[f.tex]}"` : '';
  let s = `<path d="${d}" fill="${c}"${alpha}/>`;
  if (ctx.tex[slot]) s += `<path d="${d}" fill="url(#${texId})"/>`;
  s += `<path d="${d}" fill="url(#${p}${kind})"/>`;
  if (opts.top) s += `<path d="${d}" fill="url(#${p}top)"/>`;
  s += `<path d="${d}" fill="none" stroke="${shade(c, -0.45)}" stroke-width="1.1" stroke-opacity=".8" stroke-linejoin="round"/>`;
  return s;
}

function details(ctx, list, c) {
  if (!list || !list.length) return '';
  if (ctx.mode === 'sketch') return list.map((d) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="1.1" stroke-opacity=".55"/>`).join('');
  return list.map((d) => `<path d="${d}" fill="none" stroke="${shade(c, -0.5)}" stroke-width="1.3" stroke-opacity=".45"/>`).join('');
}

function folds(ctx, layer, c, clipId) {
  if (ctx.mode === 'sketch') return layer.folds.map((d) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="1.1" stroke-opacity=".5"/>`).join('');
  const sheen = shiny((layer.slot === 2 ? ctx.f2 : ctx.f1).tex);
  return `<g clip-path="url(#${clipId})"><g filter="url(#${ctx.p}soft)">` +
    layer.folds.map((d) => `<path d="${d}" fill="none" stroke="#000" stroke-opacity=".26" stroke-width="11"/>`).join('') +
    layer.lights.map((d) => `<path d="${d}" fill="none" stroke="#fff" stroke-opacity="${sheen ? 0.34 : 0.14}" stroke-width="${sheen ? 9 : 8}"/>`).join('') +
    `</g>` + layer.folds.map((d) => `<path d="${d}" fill="none" stroke="${shade(c, -0.5)}" stroke-opacity=".35" stroke-width="1"/>`).join('') + `</g>`;
}


function bowMark(x, y, s, c, rot = 0) {
  const dk = shade(c, -0.35);
  return `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${rot}) scale(${s})"><path d="M-1,2 L-7,15 L-3,13 L-1,16 Z M1,2 L7,15 L3,13 L1,16 Z" fill="${c}" stroke="${dk}" stroke-width=".8"/>` +
    `<path d="M0,0 C-6,-9 -17,-9 -17,0 C-17,9 -6,9 0,0 Z M0,0 C6,-9 17,-9 17,0 C17,9 6,9 0,0 Z" fill="${c}" stroke="${dk}" stroke-width=".9"/>` +
    `<path d="M-4,-2 C-8,-4 -12,-3 -13,0 M4,-2 C8,-4 12,-3 13,0" fill="none" stroke="${shade(c, 0.4)}" stroke-width="1"/><circle r="3.2" fill="${shade(c, -0.1)}" stroke="${dk}" stroke-width=".8"/></g>`;
}
function rosette(x, y, r, c) {
  const dk = shade(c, -0.4);
  return `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)})"><ellipse cx="${r * 0.9}" cy="${r * 0.7}" rx="${r * 0.7}" ry="${r * 0.32}" fill="#5f7f4f" transform="rotate(30)"/>` +
    `<circle r="${r}" fill="${c}" stroke="${dk}" stroke-width=".8"/><path d="M0,0 C${r * 0.4},-${r * 0.3} ${r * 0.3},${r * 0.5} -${r * 0.2},${r * 0.4} C-${r * 0.8},${r * 0.3} -${r * 0.6},-${r * 0.7} ${r * 0.1},-${r * 0.7} C${r * 0.9},-${r * 0.6} ${r * 0.9},${r * 0.6} ${r * 0.2},${r * 0.85}" fill="none" stroke="${dk}" stroke-width="1"/>` +
    `<circle cx="-${r * 0.3}" cy="-${r * 0.3}" r="${r * 0.25}" fill="#fff" fill-opacity=".25"/></g>`;
}
function beads(pts, p, kind, r) {
  const grad = kind === 'jet' ? 'jet' : 'pearl';
  return pts.map((q) => `<circle cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="${r}" fill="url(#${p}${grad})"/>`).join('');
}
function crystals(pts, s = 3.2) {
  return pts.map((q, i) => `<path class="twinkle" style="animation-delay:${((i * 0.37) % 2.4).toFixed(2)}s" d="M${q.x},${q.y - s} L${q.x + s * 0.35},${q.y} L${q.x},${q.y + s} L${q.x - s * 0.35},${q.y} Z M${q.x - s},${q.y} L${q.x},${q.y + s * 0.35} L${q.x + s},${q.y} L${q.x},${q.y - s * 0.35} Z" fill="#f4fbff" stroke="#9fc6e8" stroke-width=".4"/>`).join('');
}
function lace(pts, side) {
  let s = '';
  for (const q of pts) {
    const nx = -Math.sin(q.a) * side, ny = Math.cos(q.a) * side;
    const cx = q.x + nx * 3, cy = q.y + ny * 3;
    s += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="4.4" fill="#fbf6ea" stroke="#cfc3ad" stroke-width=".5"/><circle cx="${(cx + nx * 0.8).toFixed(1)}" cy="${(cy + ny * 0.8).toFixed(1)}" r="1.3" fill="#cfc3ad" fill-opacity=".7"/>`;
  }
  return `<g>${s}</g>`;
}
function scatter(clipD, box, n, seed, fn) {
  let a = seed, out = '';
  const r = () => { a = (a * 9301 + 49297) % 233280; return a / 233280; };
  for (let i = 0; i < n; i++) out += fn(box[0] + r() * (box[2] - box[0]), box[1] + r() * (box[3] - box[1]), i, r);
  return out;
}



function fringe(d, c, len) {
  const pts = sample(d, 2.6);
  const dk = shade(c, -0.35), lt = shade(c, 0.3);
  let s = '';
  pts.forEach((q, i) => {
    const sway = Math.sin(i * 1.7) * 1.6 + Math.sin(i * 0.31) * 1.2;
    const L = len * (0.86 + 0.14 * Math.sin(i * 2.3));
    s += `<path d="M${q.x.toFixed(1)},${q.y.toFixed(1)} q${(sway * 0.3).toFixed(1)},${(L * 0.5).toFixed(1)} ${sway.toFixed(1)},${L.toFixed(1)}" stroke="${i % 3 === 0 ? lt : i % 3 === 1 ? c : dk}" stroke-width="1.15" stroke-linecap="round" fill="none"/>`;
  });
  return `<g>${s}<path d="${d}" fill="none" stroke="${dk}" stroke-width="5"/><path d="${d}" fill="none" stroke="${c}" stroke-width="3.4"/><path d="${d}" fill="none" stroke="${lt}" stroke-width="1" stroke-dasharray="2 2" stroke-opacity=".8"/></g>`;
}

function feathers(d, c, p, dir = 1) {
  const pts = sample(d, 3.4);
  const lt = shade(c, 0.45), dk = shade(c, -0.25);
  let base = '', wisps = '';
  pts.forEach((q, i) => {
    for (let k = 0; k < 3; k++) {
      const a = (Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1;
      const ang = Math.PI / 2 * dir + (a - 0.5) * 2.2;
      const L = 7 + Math.abs(a) * 9;
      const ex = q.x + Math.cos(ang) * L, ey = q.y + Math.sin(ang) * L;
      const mx = q.x + Math.cos(ang + 0.5) * L * 0.55, my = q.y + Math.sin(ang + 0.5) * L * 0.55;
      wisps += `<path d="M${q.x.toFixed(1)},${q.y.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}" stroke="${k === 0 ? lt : k === 1 ? c : dk}" stroke-width="${(1.3 - k * 0.2).toFixed(1)}" stroke-linecap="round" fill="none" stroke-opacity=".9"/>`;
    }
  });
  base = `<path d="${d}" fill="none" stroke="${c}" stroke-width="13" stroke-linecap="round" filter="url(#${p}soft)" stroke-opacity=".9"/>`;
  return `<g>${base}${wisps}<path d="${d}" fill="none" stroke="${lt}" stroke-width="3" stroke-opacity=".6" filter="url(#${p}soft)"/></g>`;
}

function rhinestones(d, p, spacing = 5.2) {
  const pts = sample(d, spacing);
  return `<g><path d="${d}" fill="none" stroke="#9aa7b4" stroke-width="1.4"/>` + pts.map((q, i) =>
    `<rect x="${(q.x - 2.7).toFixed(1)}" y="${(q.y - 2.7).toFixed(1)}" width="5.4" height="5.4" rx="1" fill="#aeb9c4" transform="rotate(${(q.a * 180 / Math.PI).toFixed(0)} ${q.x.toFixed(1)} ${q.y.toFixed(1)})"/>` +
    `<circle cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="2.1" fill="url(#${p}rhin)"/>`).join('') +
    crystals(pts.filter((_, i) => i % 4 === 1), 3.4) + '</g>';
}

function smockRows(x0, x1, y0, rows, c, accent) {
  let s = '';
  for (let r = 0; r < rows; r++) {
    const y = y0 + r * 9;
    let zig = `M${x0},${y}`, puck = '';
    for (let x = x0, k = 0; x < x1; x += 7, k++) {
      zig += ` L${x + 3.5},${y + (k % 2 ? -2.6 : 2.6)} L${x + 7},${y}`;
      puck += `<path d="M${x + 3.5},${y + 3.5} q-1,2.4 0,4.5" stroke="${shade(c, -0.45)}" stroke-opacity=".35" stroke-width="1.4" fill="none"/><path d="M${x + 1.5},${y + 3.5} q-.6,2.2 0,4" stroke="#fff" stroke-opacity=".25" stroke-width="1" fill="none"/>`;
    }
    s += puck + `<path d="${zig}" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linejoin="round"/>`;
  }
  return s;
}

function renderTrims(ctx, design, geo) {
  const { p, c1, c3 } = ctx;
  const tr = design.trims || {};
  const accent = c3;
  let back = '', front = '';
  const waist = geo.bodice.waist || (design.bodice === 'corset' ? 'M162,230 L200,242 L238,230' : 'M162,226 L238,226');
  const waistY = design.bodice === 'empire' ? 174 : 226;
  
  if (tr.seams) {
    const lines = geo.seams;
    for (const d of lines) {
      if (tr.seams === 'rhinestones') { back += rhinestones(d, p, 6); continue; }
      const pts = sample(d, 8);
      if (tr.seams === 'crystals') back += crystals(pts.filter((_, i) => i % 2 === 0), 3);
      else back += beads(pts, p, tr.seams === 'jet' ? 'jet' : 'pearl', 2.1);
    }
  }
  if (tr.hem) {
    const d = geo.hem;
    const pts = sample(d, 9);
    if (tr.hem === 'lace') back += lace(pts, 1);
    else if (tr.hem === 'fringe') back += fringe(d, accent, 20);
    else if (tr.hem === 'feathers') back += feathers(d, accent, p, 1);
    else if (tr.hem === 'bows') back += sample(d, 46).slice(1, -1).map((q) => bowMark(q.x, q.y - 6, 0.55, accent)).join('');
    else if (tr.hem === 'rosettes') back += sample(d, 40).slice(1, -1).map((q) => rosette(q.x, q.y - 8, 6, accent)).join('');
    else if (tr.hem === 'sequins') back += `<path d="${d}" fill="none" stroke="${shade(c1, 0.35)}" stroke-width="10" stroke-dasharray="2 2" stroke-opacity=".85" transform="translate(0,-7)"/>` + crystals(sample(d, 30), 2.4).replace(/transform=""/g, '');
    else if (tr.hem === 'embroidery') back += `<path d="${d}" fill="none" stroke="url(#${p}emb)" stroke-width="16" transform="translate(0,-12)"/><path d="${d}" fill="none" stroke="#d9b25a" stroke-width="1.4" transform="translate(0,-3)"/><path d="${d}" fill="none" stroke="#d9b25a" stroke-width="1.4" transform="translate(0,-21)"/>`;
  }
  if (tr.bodice) {
    const b = geo.bodice;
    const clip = `<clipPath id="${p}bclip"><path d="${b.d}"/></clipPath>`;
    let inner = '';
    if (tr.bodice === 'buttons') inner = [0, 1, 2, 3, 4, 5].map((i) => { const y = geo.neckY + 10 + i * ((218 - geo.neckY - 10) / 5); return `<circle cx="200" cy="${y.toFixed(1)}" r="3.3" fill="url(#${p}pearl)" stroke="#8d7c62" stroke-width=".4"/>`; }).join('');
    else if (tr.bodice === 'sequins') inner = scatter(b.d, [146, geo.neckY - 10, 256, 232], 260, 7, (x, y, i, r) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.5" fill="${r() > 0.7 ? '#fff' : shade(c1, r() > 0.5 ? 0.45 : -0.15)}" fill-opacity=".9"/>`) + crystals(scatter(b.d, [150, geo.neckY, 250, 225], 10, 3, (x, y) => `${x},${y};`).split(';').filter(Boolean).map((s) => { const [x, y] = s.split(',').map(Number); return { x, y }; }), 2.6);
    else if (tr.bodice === 'embroidery') inner = `<path d="${b.d}" fill="url(#${p}emb)"/>`;
    else if (tr.bodice === 'rosettes') inner = rosette(176, geo.neckY + 22, 8, accent) + rosette(188, geo.neckY + 34, 6, shade(accent, 0.2)) + rosette(170, geo.neckY + 40, 5, accent);
    else if (tr.bodice === 'smocking') inner = smockRows(144, 258, geo.neckY + 12, Math.max(3, Math.min(6, Math.floor((waistY - 12 - geo.neckY - 12) / 9))), c1, accent);
    else if (tr.bodice === 'crystals') inner = crystals(scatter(b.d, [150, geo.neckY, 250, 225], 26, 11, (x, y) => `${x},${y};`).split(';').filter(Boolean).map((s) => { const [x, y] = s.split(',').map(Number); return { x, y }; }), 3.4);
    
    if (tr.bodice === 'rosettes' || tr.bodice === 'buttons') front += inner;
    else front += `<defs>${clip}</defs><g clip-path="url(#${p}bclip)">${inner}</g>`;
  }
  if (tr.neckline) {
    const pts = sample(geo.neck, 7);
    if (tr.neckline === 'lace') front += lace(pts, -1);
    else if (tr.neckline === 'feathers') front += feathers(geo.neck, accent, p, -1);
    else if (tr.neckline === 'rhinestones') front += rhinestones(geo.neck, p);
    else if (tr.neckline === 'crystals') front += crystals(pts, 3);
    else front += beads(pts, p, tr.neckline === 'jet' ? 'jet' : 'pearl', 2.4);
  }
  if (tr.waist) {
    const t = tr.waist;
    if (t === 'ribbon') front += `<path d="${waist}" fill="none" stroke="${shade(accent, -0.3)}" stroke-width="11"/><path d="${waist}" fill="none" stroke="${accent}" stroke-width="9"/><path d="${waist}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2" transform="translate(0,-2)"/>` + bowMark(200, 226, 0.7, accent);
    else if (t === 'bows') front += bowMark(200, 228, 0.95, accent);
    else if (t === 'pearls') front += beads(sample(waist, 6), p, 'pearl', 2.4);
    else if (t === 'rosettes') front += [174, 200, 226].map((x) => rosette(x, waistY + 1, 7, accent)).join('');
    else if (t === 'fringe') front += fringe(waist, accent, 22);
    else if (t === 'rhinestones') front += `<g transform="translate(0,-3)">${rhinestones(waist, p, 5)}</g><g transform="translate(0,4)">${rhinestones(waist, p, 5)}</g>`;
    else if (t === 'smocking') {
      const band = `M160,${waistY - 12} C185,${waistY - 10} 215,${waistY - 10} 240,${waistY - 12} L240,${waistY + 12} C215,${waistY + 14} 185,${waistY + 14} 160,${waistY + 12} Z`;
      front += paintShape(ctx, band, 1) + smockRows(160, 240, waistY - 8, 3, c1, accent);
    }
  }
  return { back, front };
}

function sleeveTrim(ctx, sl, t) {
  if (!t || !sl) return '';
  const pts = sample(sl.cuff, 7);
  if (t === 'lace') return lace(pts, 1);
  if (t === 'ribbon') return `<path d="${sl.cuff}" fill="none" stroke="${ctx.c3}" stroke-width="7" transform="translate(0,-4)"/>`;
  if (t === 'bows') { const q = pts[Math.floor(pts.length / 2)]; return bowMark(q.x, q.y - 4, 0.6, ctx.c3, -15); }
  if (t === 'fringe') return fringe(sl.cuff, ctx.c3, 14);
  if (t === 'feathers') return feathers(sl.cuff, ctx.c3, ctx.p, 1);
  return '';
}


function formBack(ctx) {
  const sk = ctx.mode === 'sketch';
  const fill = sk ? '#f7f0e4' : `url(#${ctx.p}form)`, st = sk ? '#b9a58c' : '#a88b67';
  return `<g>` +
    `<path d="M196,300 L196,590 L204,590 L204,300 Z" fill="${sk ? '#e2d5c2' : '#6b4a2f'}" stroke="${st}" stroke-width=".8"/>` +
    `<path d="M200,586 L146,612 M200,586 L254,612 M200,586 L200,614" stroke="${sk ? '#c8b69c' : '#5a3c24'}" stroke-width="6" stroke-linecap="round"/>` +
    `<path d="M186,56 L186,88 C170,96 146,100 136,112 C130,122 134,150 148,170 C156,190 164,210 168,226 C160,250 156,280 160,302 L240,302 C244,280 240,250 232,226 C236,210 244,190 252,170 C266,150 270,122 264,112 C254,100 230,96 214,88 L214,56 Z" fill="${fill}" stroke="${st}" stroke-width="1"/>` +
    (sk ? '' : `<path d="M200,95 L200,300" stroke="#b39676" stroke-width=".8" stroke-dasharray="3 3"/><path d="M168,226 C185,230 215,230 232,226" stroke="#b39676" stroke-width=".8" fill="none"/>`) +
    `<ellipse cx="200" cy="56" rx="17" ry="5.5" fill="${sk ? '#e8dccb' : '#8a5a36'}" stroke="${st}"/>` +
    `<path d="M196,52 L196,36 L204,36 L204,52 Z" fill="${sk ? '#e8dccb' : '#7a4e2e'}"/><circle cx="200" cy="32" r="8" fill="${sk ? '#e8dccb' : '#8e5c38'}" stroke="${st}"/>` +
    (sk ? '' : `<circle cx="197" cy="29" r="2.5" fill="#fff" fill-opacity=".3"/>`) + `</g>`;
}


export function dressSVG(design, opts = {}) {
  const mode = opts.mode || 'final';
  const p = `k${++uid}_`;
  const f1 = fabric(design.fab1) || fabric('cotton'), f2 = fabric(design.fab2) || f1;
  const c1 = dye(design.dye1)?.hex || '#ddd', c2 = dye(design.dye2)?.hex || c1, c3 = dye(design.dye3)?.hex || c2;
  const q = opts.quality ?? 1;
  const ctx = { p, mode, f1, f2, c1, c2, c3, tex: {} };
  if (opts.formOnly) return `<svg xmlns="${NS}" viewBox="0 0 400 620" class="dress-svg"><defs>${commonDefs(p)}</defs>${formBack(ctx)}</svg>`;
  let defs = mode === 'final' ? commonDefs(p) : '';
  if (mode === 'final') {
    const t1 = texturePattern(`${p}tx1`, f1.tex, c1), t2 = texturePattern(`${p}tx2`, f2.tex, c2);
    if (t1) { defs += t1; ctx.tex[1] = true; }
    if (t2) { defs += t2; ctx.tex[2] = true; }
  }
  const bod = BODICE[design.bodice] || BODICE.square;
  const neckY = NECK_Y[design.bodice] || 150;
  const layers = skirtLayers(design.skirt, q);
  const sl = SLEEVE[design.sleeve];
  let body = '';
  
  if (design.collar === 'medici') body += mediciCollar(ctx);
  if (opts.form !== false) body += formBack(ctx);

  
  const geo = { bodice: bod, neck: bod.neck, neckY, hem: '', seams: [] };
  layers.forEach((L, i) => {
    const c = L.slot === 2 ? c2 : c1;
    const clipId = `${p}sk${i}`;
    defs += `<clipPath id="${clipId}"><path d="${L.d}"/></clipPath>`;
    body += `<g${mode === 'final' && i === 0 ? ` filter="url(#${p}drop)"` : ''}>${paintShape(ctx, L.d, L.slot, { top: true, ball: L.ball })}${L.dark ? `<path d="${L.d}" fill="#000" fill-opacity="${mode === 'sketch' ? 0.08 : 0.3}"/>` : ''}${folds(ctx, L, c, clipId)}</g>`;
    if (L.tuck) body += `<path d="${L.hem}" fill="none" stroke="${mode === 'sketch' ? INK : shade(c, -0.4)}" stroke-width="${mode === 'sketch' ? 1.2 : 12}" stroke-opacity="${mode === 'sketch' ? 0.6 : 0.5}" transform="translate(0,-5)"/>` +
      (mode === 'sketch' ? '' : `<path d="${L.hem}" fill="none" stroke="${shade(c, 0.25)}" stroke-width="3" stroke-opacity=".5" transform="translate(0,-9)"/>`);
    if (L.ruffle) {
      const rc = shade(c1, 0.12);
      body += `<path d="${L.hem}" fill="none" stroke="${shade(rc, -0.3)}" stroke-width="15" transform="translate(0,-2)"/><path d="${L.hem}" fill="none" stroke="${rc}" stroke-width="13" transform="translate(0,-2)"/>` +
        `<path d="${L.hem}" fill="none" stroke="${c3}" stroke-width="3" stroke-dasharray="6 3" transform="translate(0,4)"/>` +
        `<g clip-path="url(#${clipId})"><path d="${L.hem}" fill="none" stroke="${shade(rc, -0.3)}" stroke-width="13" transform="translate(0,-40)"/><path d="${L.hem}" fill="none" stroke="${rc}" stroke-width="11" transform="translate(0,-40)"/><path d="${L.hem}" fill="none" stroke="${c3}" stroke-width="2.5" stroke-dasharray="5 3" transform="translate(0,-34)"/></g>`;
    }
    if (L.band) body += `<path d="${L.band}" fill="none" stroke="${shade(c3, -0.2)}" stroke-width="7" transform="translate(0,-4)"/><path d="${L.band}" fill="none" stroke="${c3}" stroke-width="4" stroke-dasharray="3 2" transform="translate(0,-4)"/>`;
  });
  const outer = layers[layers.length - 1];
  const main = layers.find((L) => L.main);
  geo.hem = (main || layers[0]).hem;
  geo.seams = (main ? main.folds : design.skirt === 'odette' ? layers[0].folds : outer.folds).filter((_, i) => i % 2 === 1);

  const trims = typeof document !== 'undefined' ? renderTrims(ctx, design, geo) : { back: '', front: '' };
  body += trims.back;

  
  const sleeveMarkup = (() => {
    if (!sl) return '';
    const inner = sl.inner ? (mode === 'sketch' ? `<path d="${sl.inner}" fill="${mix(c2, INK, 0.25)}" stroke="${INK}" stroke-width="1"/>` : `<path d="${sl.inner}" fill="${shade(c2, -0.45)}"/><path d="${sl.inner}" fill="url(#${p}top)"/>`) : '';
    let one = paintShape(ctx, sl.d, 2, { ball: sl.ball }) + inner +
      (sl.puff ? paintShape(ctx, sl.puff, 2, { ball: true }) : '') +
      (sl.cuffBand ? paintShape(ctx, sl.cuffBand, 2, { color: c3 }) : '') +
      details(ctx, sl.details, c2) + (typeof document !== 'undefined' ? sleeveTrim(ctx, sl, (design.trims || {}).sleeves) : '');
    if (bod.sleeveShift) one = `<g transform="translate(${bod.sleeveShift.join(',')})">${one}</g>`;
    return `<g>${one}</g><g transform="translate(400,0) scale(-1,1)">${one}</g>`;
  })();
  body += sleeveMarkup;

  
  body += paintShape(ctx, bod.d, 1) + details(ctx, bod.details, c1);
  if (bod.hole) body += `<path d="${bod.hole}" fill="${mode === 'sketch' ? '#f7f0e4' : `url(#${p}form)`}" stroke="${mode === 'sketch' ? INK : shade(c1, -0.45)}" stroke-width="${mode === 'sketch' ? 2 : 1.1}"/>`;
  if (bod.band) {
    const bc = bod.bandColor === 3 ? c3 : c1;
    body += paintShape(ctx, bod.band, 1, { color: bod.bandColor === 3 ? c3 : undefined, top: true }) + details(ctx, bod.bandDetails, bc);
    if (bod.bandColor === 3 && mode === 'final') body += `<path d="${bod.waist}" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="2" transform="translate(0,-4)"/>`;
  }
  if (bod.buttons && !(design.trims || {}).bodice) body += [0, 1, 2, 3, 4, 5, 6].map((i) => `<circle cx="200" cy="${96 + i * 18}" r="2.6" fill="${shade(c1, -0.2)}" stroke="${mode === 'sketch' ? INK : shade(c1, -0.5)}" stroke-width=".8"/>`).join('');
  if (bod.lacing) {
    let l = '';
    for (let y = 154; y < 232; y += 11) l += `<path d="M194,${y} L206,${y + 11} M206,${y} L194,${y + 11}" stroke="${mode === 'sketch' ? INK : shade(c3, -0.1)}" stroke-width="1.6"/><circle cx="194" cy="${y}" r="1.4" fill="#d9c08a"/><circle cx="206" cy="${y}" r="1.4" fill="#d9c08a"/>`;
    body += l;
  }
  
  body += collarMarkup(ctx, design.collar, neckY);
  body += trims.front;
  if (mode === 'final' && typeof document !== 'undefined') body += threadMarks(design, q, geo, c1);
  const w = opts.width ? ` width="${opts.width}"` : '', h = opts.height ? ` height="${opts.height}"` : '';
  return `<svg xmlns="${NS}" viewBox="0 0 400 620"${w}${h} class="dress-svg"><defs>${defs}</defs>${body}</svg>`;
}



function threadMarks(design, q, geo, c1) {
  const list = looseThreads(q, designSeed(design));
  if (!list.length) return '';
  const col = lum(c1) > 0.5 ? '#4a3428' : '#efe3cc';
  const hem = sample(geo.hem, 4);
  const seams = geo.seams.map((d) => sample(d, 4)).filter((s) => s.length > 4);
  let s = '', k = 0;
  for (const th of list) {
    const onSeam = th.where === 'seam' && seams.length;
    const pts = onSeam ? seams[k++ % seams.length] : hem;
    if (!pts.length) continue;
    const pt = pts[Math.floor((onSeam ? 0.35 + th.t * 0.55 : th.t) * (pts.length - 1))];
    const L = th.len, c = th.curl;
    const d = onSeam
      ? `M${pt.x.toFixed(1)},${pt.y.toFixed(1)} c${(c * L * 0.4).toFixed(1)},${(L * 0.1).toFixed(1)} ${(c * L * 0.5).toFixed(1)},${(L * 0.5).toFixed(1)} ${(c * L * 0.8).toFixed(1)},${(L * 0.55).toFixed(1)}`
      : `M${pt.x.toFixed(1)},${(pt.y - 1).toFixed(1)} c${(c * 5).toFixed(1)},${(L * 0.35).toFixed(1)} ${(-c * 5).toFixed(1)},${(L * 0.6).toFixed(1)} ${(c * 3).toFixed(1)},${L.toFixed(1)}`;
    s += `<path d="${d}" fill="none" stroke="${col}" stroke-width="1.1" stroke-linecap="round" stroke-opacity=".9"/><circle cx="${pt.x.toFixed(1)}" cy="${(pt.y - (onSeam ? 0 : 1)).toFixed(1)}" r="1.3" fill="${col}"/>`;
  }
  return `<g class="loose-threads">${s}</g>`;
}

function collarMarkup(ctx, id, neckY) {
  const { c2, c3, mode } = ctx;
  if (id === 'peterpan') {
    const d = 'M200,90 C192,88 180,86 172,90 C164,98 170,114 184,114 C194,114 200,104 200,90 Z';
    const one = paintShape(ctx, d, 2) + (mode === 'final' ? `<path d="M176,110 C184,112 194,108 197,98" fill="none" stroke="${shade(c2, -0.4)}" stroke-dasharray="2 2" stroke-width=".8"/>` : '');
    return `<g>${one}</g><g transform="translate(400,0) scale(-1,1)">${one}</g>`;
  }
  if (id === 'bertha') {
    const d = 'M140,112 C160,108 180,112 200,120 C220,112 240,108 260,112 C268,126 266,140 258,150 C238,152 218,160 200,172 C182,160 162,152 142,150 C134,140 132,126 140,112 Z';
    let s = paintShape(ctx, d, 2);
    if (typeof document !== 'undefined') s += lace(sample('M142,150 C162,152 182,160 200,172 C218,160 238,152 258,150', 7), 1);
    s += details(ctx, ['M150,124 C168,128 186,136 200,146 C214,136 232,128 250,124'], c2);
    return s;
  }
  if (id === 'ruffle') {
    let d = 'M170,100';
    for (let x = 170; x < 230; x += 7.5) d += ` Q${x + 3.75},72 ${x + 7.5},100`;
    d += ' Z';
    return paintShape(ctx, d, 2) + details(ctx, [...Array(8)].map((_, i) => `M${174 + i * 7.5},98 L${174 + i * 7.5},80`), c2);
  }
  if (id === 'bow') {
    return bowMark(200, neckY - 2, 1.2, mode === 'sketch' ? mix(c3, '#fbf6ee', 0.12) : c3);
  }
  
  if (id === 'sailor') {
    const stripe = mode === 'sketch' ? INK : c3;
    const one = paintShape(ctx, SAILOR_FLAP, 2) +
      `<path d="M140,113 L147,143 C166,151 184,161 196,172" fill="none" stroke="${stripe}" stroke-width="${mode === 'sketch' ? 1 : 2.4}"/>` +
      `<path d="M145,110 L151,139 C169,147 185,156 195,164" fill="none" stroke="${stripe}" stroke-width="${mode === 'sketch' ? 1 : 1.4}"/>` +
      details(ctx, ['M178,96 C166,110 158,124 155,134'], c2);
    const tc = mode === 'sketch' ? mix(c3, '#fbf6ee', 0.12) : c3, tk = mode === 'sketch' ? INK : shade(c3, -0.4);
    const tie = `<path d="M196,184 L184,218 L192,214 L196,220 Z M204,184 L216,218 L208,214 L204,220 Z" fill="${tc}" stroke="${tk}" stroke-width="1"/>` +
      `<path d="M192,174 C196,171 204,171 208,174 L206,186 C202,188 198,188 194,186 Z" fill="${tc}" stroke="${tk}" stroke-width="1"/>` +
      (mode === 'sketch' ? '' : `<path d="M195,176 C198,174 202,174 205,176" stroke="#fff" stroke-opacity=".4" stroke-width="1.2" fill="none"/>`);
    return `<g>${one}</g><g transform="translate(400,0) scale(-1,1)">${one}</g>${tie}`;
  }
  if (id === 'jabot') {
    let s = '';
    for (let i = 3; i >= 0; i--) {
      const top = 94 + i * 17, hw = 12 + i * 4.5, bot = top + 30;
      const x0 = 200 - hw, x1 = 200 + hw;
      let d = `M${200 - hw * 0.45},${top} L${200 + hw * 0.45},${top} C${x1 - 2},${top + 10} ${x1 + 2},${bot - 12} ${x1},${bot}`;
      let edge = `M${x1},${bot}`;
      for (let k = 0; k < 5; k++) {
        const xa = x1 - (k * (x1 - x0)) / 5, xb = x1 - ((k + 1) * (x1 - x0)) / 5;
        const seg = ` Q${((xa + xb) / 2).toFixed(1)},${bot + 7} ${xb.toFixed(1)},${bot}`;
        d += seg; edge += seg;
      }
      d += ` C${x0 - 2},${bot - 12} ${x0 + 2},${top + 10} ${200 - hw * 0.45},${top} Z`;
      s += paintShape(ctx, d, 2, { top: true }) +
        details(ctx, [-0.6, -0.2, 0.2, 0.6].map((t) => `M${(200 + t * hw * 0.45).toFixed(1)},${top + 2} Q${(200 + t * hw * 0.8).toFixed(1)},${top + 16} ${(200 + t * hw).toFixed(1)},${bot + 3}`), c2);
      if (mode === 'final' && typeof document !== 'undefined') s += lace(sample(edge, 5), 1).replace(/r="4.4"/g, 'r="3"').replace(/r="1.3"/g, 'r=".9"');
    }
    s += paintShape(ctx, 'M180,84 C190,90 210,90 220,84 L220,94 C210,99 190,99 180,94 Z', 2);
    s += mode === 'sketch' ? `<circle cx="200" cy="95" r="4.5" fill="#fbf6ee" stroke="${INK}"/>` : `<circle cx="200" cy="95" r="5" fill="${shade(c3, -0.3)}"/><circle cx="200" cy="95" r="3.8" fill="url(#${ctx.p}pearl)"/>`;
    return s;
  }
  return '';
}


const MEDICI = (() => {
  const cx = 200, cy = 128, rx = 84, ry = 104, n = 14;
  const at = (t, k = 1) => [cx + rx * k * Math.cos(t), cy - ry * k * Math.sin(t)];
  const t0 = (160 * Math.PI) / 180, t1 = (20 * Math.PI) / 180;
  const pts = []; for (let i = 0; i <= n; i++) pts.push(t0 + ((t1 - t0) * i) / n);
  const [sx, sy] = at(t0);
  let outer = `M${sx.toFixed(1)},${sy.toFixed(1)}`;
  for (let i = 1; i <= n; i++) {
    const tm = (pts[i - 1] + pts[i]) / 2;
    const [qx, qy] = at(tm, 1.1), [ex, ey] = at(pts[i]);
    outer += ` Q${qx.toFixed(1)},${qy.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}`;
  }
  const [ex, ey] = at(t1);
  const d = `${outer} L256,112 C240,101 220,96 200,96 C180,96 160,101 144,112 Z`;
  const ribs = pts.map((t) => { const [ax, ay] = at(t, 0.42), [bx, by] = at(t, 0.97); return `M${ax.toFixed(1)},${ay.toFixed(1)} L${bx.toFixed(1)},${by.toFixed(1)}`; });
  const rings = [0.6, 0.78].flatMap((k) => pts.slice(0, -1).map((t, i) => at((t + pts[i + 1]) / 2, k)));
  return { d, outer, ribs, rings, end: [ex, ey] };
})();
function mediciCollar(ctx) {
  const { mode, c2 } = ctx;
  let s = paintShape(ctx, MEDICI.d, 2, { top: true });
  if (mode === 'sketch') return s + details(ctx, MEDICI.ribs, c2);
  s += MEDICI.ribs.map((d) => `<path d="${d}" stroke="#fbf6ea" stroke-opacity=".75" stroke-width="1.6"/>`).join('');
  s += MEDICI.rings.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.6" fill="none" stroke="#fbf6ea" stroke-opacity=".8" stroke-width="1.1"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.1" fill="#fbf6ea" fill-opacity=".8"/>`).join('');
  if (typeof document !== 'undefined') s += lace(sample(MEDICI.outer, 6), -1);
  s += `<path d="${MEDICI.outer}" fill="none" stroke="#d9c08a" stroke-width="1.2"/>`;
  return `<g filter="url(#${ctx.p}drop)">${s}</g>`;
}
const SAILOR_FLAP = 'M184,84 C168,90 150,98 135,108 L143,148 C164,156 186,166 200,180 C196,150 190,118 184,84 Z';


const COLLAR_PIECE = {
  peterpan: 'M200,90 C192,88 180,86 172,90 C164,98 170,114 184,114 C194,114 200,104 200,90 Z',
  bertha: 'M140,112 C160,108 180,112 200,120 C220,112 240,108 260,112 C268,126 266,140 258,150 C238,152 218,160 200,172 C182,160 162,152 142,150 C134,140 132,126 140,112 Z',
  ruffle: 'M168,100 C180,70 220,70 232,100 Z',
  sailor: SAILOR_FLAP,
  jabot: 'M186,92 L214,92 C226,120 232,150 232,178 Q224,186 216,180 Q208,190 200,182 Q192,190 184,180 Q176,186 168,178 C168,150 174,120 186,92 Z',
  medici: MEDICI.d,
};
export function pieceOutlines(design) {
  const out = [{ name: 'Bodice', d: (BODICE[design.bodice] || BODICE.square).d, slot: 1, part: ['bodice', design.bodice] }];
  const layers = skirtLayers(design.skirt, 1);
  if (layers.length) out.push({ name: 'Skirt', d: (layers.find((L) => L.main) || layers[layers.length - 1]).d, slot: 1, part: ['skirt', design.skirt] });
  if (SLEEVE[design.sleeve]) out.push({ name: 'Sleeve', d: SLEEVE[design.sleeve].d, slot: 2, part: ['sleeve', design.sleeve] });
  if (COLLAR_PIECE[design.collar]) out.push({ name: 'Collar', d: COLLAR_PIECE[design.collar], slot: 2, part: ['collar', design.collar] });
  return out;
}


export function fabricSheet(fabId, dyeId, w, h) {
  const f = fabric(fabId), c = dye(dyeId)?.hex || '#ccc';
  const p = `f${++uid}_`;
  const tex = texturePattern(`${p}t`, f.tex, c);
  const sheen = shiny(f.tex);
  return `<svg xmlns="${NS}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${tex}` +
    `<linearGradient id="${p}g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="${sheen ? 0.3 : 0.1}"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".15"/></linearGradient></defs>` +
    `<rect width="${w}" height="${h}" fill="${c}"/>${tex ? `<rect width="${w}" height="${h}" fill="url(#${p}t)"/>` : ''}<rect width="${w}" height="${h}" fill="url(#${p}g)"/></svg>`;
}

export function svgImage(svg) {
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  return img;
}


export function pinkedPath(w, h, t = 5) {
  let d = `M0,${t}`;
  for (let x = 0; x < w; x += t * 2) d += ` L${x + t},0 L${Math.min(w, x + 2 * t)},${t}`;
  for (let y = t; y < h - t; y += t * 2) d += ` L${w - t},${y + t} L${w},${Math.min(h - t, y + 2 * t)}`;
  for (let x = w; x > 0; x -= t * 2) d += ` L${x - t},${h} L${Math.max(0, x - 2 * t)},${h - t}`;
  for (let y = h - t; y > t; y -= t * 2) d += ` L${t},${y - t} L0,${Math.max(t, y - 2 * t)}`;
  return d + ' Z';
}

export function swatchSVG(fabId, dyeId, w = 90, h = 70) {
  const f = fabric(fabId), c = dye(dyeId)?.hex || '#ccc';
  const p = `s${++uid}_`;
  const tex = texturePattern(`${p}t`, f.tex, c);
  const kind = shadeKind(f.tex);
  const d = pinkedPath(w, h);
  const grad = kind === 'metal' ? `<linearGradient id="${p}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".2"/><stop offset=".3" stop-color="#fff" stop-opacity=".6"/><stop offset=".45" stop-color="#000" stop-opacity=".15"/><stop offset=".65" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>`
    : kind === 'sheen' ? `<linearGradient id="${p}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff" stop-opacity=".45"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient>`
    : kind === 'velvet' ? `<radialGradient id="${p}g"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient>`
      : `<linearGradient id="${p}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity=".15"/></linearGradient>`;
  return `<svg xmlns="${NS}" viewBox="-2 -2 ${w + 4} ${h + 6}" class="swatch-svg"><defs>${tex}${grad}</defs>` +
    `<path d="${d}" transform="translate(1.5,2.5)" fill="#000" fill-opacity=".18"/>` +
    `<path d="${d}" fill="${c}"/>${tex ? `<path d="${d}" fill="url(#${p}t)"/>` : ''}<path d="${d}" fill="url(#${p}g)"/></svg>`;
}


const LOOKS = [
  { hair: '#c8743a', skin: '#f3d3bc', style: 'bun' },
  { hair: '#e8d08a', skin: '#f6dcc8', style: 'long' },
  { hair: '#1c1a20', skin: '#e8c4aa', style: 'bob' },
  { hair: '#6b3f26', skin: '#c99576', style: 'long' },
  { hair: '#d65f7a', skin: '#f5d8c4', style: 'bun' },
  { hair: '#3b2a22', skin: '#8f5f45', style: 'bob' },
];
export function portraitSVG(look, dyeHex = '#b9a4d8', mood = 'neutral') {
  const L = LOOKS[look % LOOKS.length];
  const mouth = mood === 'happy' ? 'M-7,14 Q0,21 7,14' : mood === 'sad' ? 'M-6,17 Q0,12 6,17' : 'M-5,15 Q0,17 5,15';
  const hairBack = L.style === 'long' ? `<path d="M-30,-6 C-34,30 -30,56 -22,62 L22,62 C30,56 34,30 30,-6 Z" fill="${L.hair}"/>` : L.style === 'bun' ? `<circle cx="0" cy="-34" r="13" fill="${L.hair}"/>` : '';
  return `<svg xmlns="${NS}" viewBox="-50 -52 100 110" class="portrait"><circle cx="0" cy="3" r="50" fill="#efe3cf"/>` + hairBack +
    `<path d="M-40,58 C-36,36 -18,30 0,30 C18,30 36,36 40,58 Z" fill="${dyeHex}"/><path d="M-10,30 L0,40 L10,30" fill="none" stroke="${shade(dyeHex, -0.35)}" stroke-width="1.5"/>` +
    `<rect x="-7" y="18" width="14" height="14" fill="${shade(L.skin, -0.08)}"/><ellipse cx="0" cy="2" rx="22" ry="25" fill="${L.skin}"/>` +
    `<path d="M-23,0 C-26,-26 -8,-32 0,-30 C12,-32 28,-24 23,0 C20,-14 10,-18 0,-16 C-10,-18 -20,-12 -23,0 Z" fill="${L.hair}"/>` +
    (L.style === 'bob' ? `<path d="M-23,0 C-26,14 -22,20 -16,22 L-18,2 Z M23,0 C26,14 22,20 16,22 L18,2 Z" fill="${L.hair}"/>` : '') +
    `<ellipse cx="-8" cy="3" rx="2.4" ry="3" fill="#2d2320"/><ellipse cx="8" cy="3" rx="2.4" ry="3" fill="#2d2320"/><circle cx="-7.2" cy="2" r=".8" fill="#fff"/><circle cx="8.8" cy="2" r=".8" fill="#fff"/>` +
    `<ellipse cx="-13" cy="11" rx="4" ry="2.4" fill="#e88" fill-opacity=".35"/><ellipse cx="13" cy="11" rx="4" ry="2.4" fill="#e88" fill-opacity=".35"/>` +
    `<path d="${mouth}" fill="none" stroke="#9a4a4a" stroke-width="1.8" stroke-linecap="round"/></svg>`;
}


export function roomSVG(inner = '') {
  const p = `r${++uid}_`;
  return `<svg xmlns="${NS}" viewBox="0 0 800 600" class="room-svg" preserveAspectRatio="xMidYMid slice"><defs>` +
    `<pattern id="${p}dam" width="60" height="80" patternUnits="userSpaceOnUse"><rect width="60" height="80" fill="#3f4d3d"/>` +
    `<g fill="#56674f" fill-opacity=".7"><path d="M30,8 C38,20 44,26 30,40 C16,26 22,20 30,8 Z"/><path d="M30,40 C36,46 42,58 30,70 C18,58 24,46 30,40 Z" fill-opacity=".5"/>` +
    `<circle cx="30" cy="40" r="3"/><path d="M0,40 C6,34 8,28 0,22 M60,40 C54,34 52,28 60,22" fill="none" stroke="#56674f" stroke-width="1.4"/></g></pattern>` +
    `<linearGradient id="${p}win" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6d8" stop-opacity=".35"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></linearGradient>` +
    `<radialGradient id="${p}spot" cx=".5" cy=".55" r=".5"><stop offset="0" stop-color="#fff4d6" stop-opacity=".35"/><stop offset="1" stop-color="#fff4d6" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="${p}wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a5031"/><stop offset="1" stop-color="#5b3a22"/></linearGradient>` +
    `<linearGradient id="${p}gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1d58a"/><stop offset=".5" stop-color="#b98d3a"/><stop offset="1" stop-color="#8a6420"/></linearGradient>` +
    `</defs><rect width="800" height="600" fill="url(#${p}dam)"/>` +
    
    `<rect x="610" y="60" width="130" height="200" rx="4" fill="#cfe0e6"/><path d="M675,60 V260 M610,160 H740" stroke="#6b4a2f" stroke-width="6"/><rect x="610" y="60" width="130" height="200" rx="4" fill="none" stroke="#6b4a2f" stroke-width="10"/>` +
    `<path d="M610,60 L740,60 L560,600 L330,600 Z" fill="url(#${p}win)"/>` +
    
    `<rect y="330" width="800" height="200" fill="url(#${p}wood)"/><rect y="324" width="800" height="12" fill="#8c603c"/><rect y="336" width="800" height="3" fill="#3e2716" fill-opacity=".5"/>` +
    [0, 1, 2, 3, 4, 5].map((i) => `<rect x="${20 + i * 132}" y="356" width="110" height="150" rx="3" fill="#6a4429" stroke="#8e6443" stroke-width="3"/><rect x="${30 + i * 132}" y="366" width="90" height="130" fill="none" stroke="#4a2f1b" stroke-width="2"/>`).join('') +
    
    `<rect y="520" width="800" height="80" fill="#4e321e"/>` + [0, 1, 2, 3].map((i) => `<path d="M0,${535 + i * 18} H800" stroke="#3a2415" stroke-width="2"/>`).join('') +
    [...Array(9)].map((_, i) => `<path d="M${i * 97 + (i % 2) * 40},${520 + (i % 4) * 18} v18" stroke="#3a2415" stroke-width="2"/>`).join('') +
    
    `<ellipse cx="90" cy="190" rx="54" ry="78" fill="url(#${p}gold)"/><ellipse cx="90" cy="190" rx="44" ry="67" fill="#9fb3b6"/><path d="M62,150 C70,130 84,124 96,124" stroke="#fff" stroke-opacity=".5" stroke-width="5" fill="none"/>` +
    
    `<g transform="translate(700,470)"><path d="M-40,0 L40,0 L30,56 L-30,56 Z" fill="url(#${p}gold)"/><rect x="-44" y="-6" width="88" height="10" rx="3" fill="#c79d45"/>` +
    [[-60, -120, -30], [-20, -150, -8], [30, -140, 20], [70, -100, 40], [-80, -60, -50], [50, -60, 60]].map(([x, y, r]) => `<path d="M0,-4 Q${x / 2},${y / 2} ${x},${y}" stroke="#3d5a2f" stroke-width="3" fill="none"/><ellipse cx="${x}" cy="${y}" rx="30" ry="12" transform="rotate(${r} ${x} ${y})" fill="#4d7a3b"/><path d="M${x - 24},${y} L${x + 24},${y}" transform="rotate(${r} ${x} ${y})" stroke="#2f4d24" stroke-width="1.2"/>`).join('') + `</g>` +
    `<ellipse cx="400" cy="330" rx="260" ry="300" fill="url(#${p}spot)"/>` +
    inner + `</svg>`;
}

export { lum };
