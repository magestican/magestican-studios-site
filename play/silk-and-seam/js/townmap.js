







export const MAP_W = 1600, MAP_H = 830;


export const LAYOUT = {
  silks: { x: 118, y: 405, w: 150, h: 175, wall: '#c2553a', trim: '#f2c14e', roof: 'flat', awning: ['#e0902a', '#f6d27a'], display: 'silks', floors: 3, garland: true },
  chophouse: { x: 303, y: 405, w: 165, h: 150, wall: '#e2a04a', trim: '#2f6b3a', roof: 'shed', awning: ['#2f8a4a', '#f4e6c0'], display: 'pot', floors: 2, chimney: true, garland: true },
  bakery: { x: 610, y: 525, w: 150, h: 175, wall: '#e9c9a0', trim: '#b8423a', roof: 'gable', awning: ['#b8423a', '#f7ecd8'], display: 'bread', floors: 2, chimney: true },
  herald: { x: 965, y: 525, w: 150, h: 200, wall: '#8a9aa8', trim: '#2b2f38', roof: 'mansard', awning: null, display: 'papers', floors: 3 },
  teahouse: { x: 1125, y: 575, w: 150, h: 160, wall: '#8c2f36', trim: '#e8b84a', roof: 'pagoda', awning: null, display: 'tea', floors: 2, lanterns: true },
  orchid: { x: 1295, y: 575, w: 145, h: 150, wall: '#e8d6a0', trim: '#7a3e8a', roof: 'thai', awning: ['#7a3e8a', '#f0d8f4'], display: 'orchid', floors: 2, lanterns: true },
  bluelantern: { x: 1470, y: 575, w: 160, h: 185, wall: '#2c3e6a', trim: '#6ab0e8', roof: 'flat', awning: null, display: 'stage', floors: 2, lanterns: true, neon: true },
  haberdashery: { x: 1170, y: 795, w: 160, h: 150, wall: '#6b4a6e', trim: '#e8d7a8', roof: 'gable', awning: ['#3a4a6e', '#e8d7a8'], display: 'buttons', floors: 2 },
  fishmarket: { x: 345, y: 690, w: 190, h: 95, wall: '#6d8a96', trim: '#ffffff', roof: 'stall', awning: ['#2d6a8a', '#f4f4ee'], display: 'fish', floors: 1 },
  washhouse: { x: 585, y: 800, w: 190, h: 120, wall: '#b8b0a0', trim: '#5d6f78', roof: 'gable', awning: null, display: 'laundry', floors: 1, chimney: true, steam: true },
  opera: { x: 1180, y: 300, w: 270, h: 185, wall: '#efe4d0', trim: '#b28a35', roof: 'opera', awning: null, display: 'opera', floors: 2 },
  ashcombe: { x: 1400, y: 290, w: 150, h: 175, wall: '#e8dfcf', trim: '#3a4a3a', roof: 'mansard', awning: null, display: 'crest', floors: 3, grand: true },
  ninecrescent: { x: 1545, y: 295, w: 115, h: 170, wall: '#e4dac6', trim: '#1f6b7a', roof: 'mansard', awning: null, display: 'peacock', floors: 3, grand: true, door: '#1f7a8a' },
  atelier: { x: 850, y: 795, w: 175, h: 160, wall: '#3f4d3d', trim: '#e2c06b', roof: 'gable', awning: ['#d25a6e', '#f7e3e6'], display: 'dress', floors: 2, chimney: true },
  
  
  stanne: { x: 488, y: 395, w: 112, h: 150, wall: '#d8cfc0', trim: '#6b5a4a', roof: 'church', awning: null, display: 'church', floors: 1 },
  lotus: { x: 1385, y: 800, w: 160, h: 150, wall: '#b8242c', trim: '#f2c14e', roof: 'pagoda', awning: ['#f2c14e', '#b8242c'], display: 'wedding', floors: 2, lanterns: true },
};



export const LAMPS = [[700, 598], [872, 604], [590, 505], [1010, 640], [1215, 612], [1390, 618], [440, 700], [300, 468], [1030, 420], [960, 770], [1100, 330]];

const shade = (hex, amt) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt))));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => ch(v).toString(16).padStart(2, '0')).join('')}`;
};
const f = (n) => Math.round(n * 10) / 10;


function display(kind, x, y, w, h) {
  const cx = x + w / 2, by = y + h;
  switch (kind) {
    case 'bread': return [0, 1, 2].map((i) => `<ellipse cx="${f(x + 16 + i * (w - 32) / 2)}" cy="${f(by - 12)}" rx="14" ry="9" fill="#c98a3e"/><path d="M${f(x + 8 + i * (w - 32) / 2)},${f(by - 14)} l6,-4 M${f(x + 14 + i * (w - 32) / 2)},${f(by - 13)} l6,-4 M${f(x + 20 + i * (w - 32) / 2)},${f(by - 12)} l6,-4" stroke="#f3d9a4" stroke-width="1.5"/>`).join('') +
      `<path d="M${f(cx - 12)},${f(y + 16)} c-10,-10 10,-18 12,-4 c2,-14 22,-6 12,4 c-4,6 -20,6 -24,0 Z" fill="none" stroke="#b8742e" stroke-width="4"/><rect x="${f(x + 6)}" y="${f(by - 30)}" width="${f(w - 12)}" height="3" fill="#8a6a4a"/>`;
    case 'papers': return [0, 1, 2].map((i) => `<rect x="${f(x + 8 + i * 4)}" y="${f(y + 8 + i * 5)}" width="${f(w - 30)}" height="${f(h - 20)}" fill="#f4efe2" stroke="#9a9488" transform="rotate(${-4 + i * 4} ${cx} ${y + h / 2})"/>`).join('') +
      `<text x="${f(cx - 4)}" y="${f(y + 26)}" font-family="Georgia,serif" font-size="11" font-weight="bold" text-anchor="middle" fill="#222">HERALD</text>` + [0, 1, 2, 3].map((i) => `<path d="M${f(x + 18)},${f(y + 34 + i * 6)} h${f(w - 50)}" stroke="#8a857a" stroke-width="1.6"/>`).join('');
    case 'silks': return ['#d8322f', '#f29a1f', '#2f8a6a', '#7a3e8a', '#e8b84a'].map((c, i) => { const sx = x + 6 + i * (w - 12) / 5, sw = (w - 12) / 5 - 2; return `<path d="M${f(sx)},${f(y + 4)} h${f(sw)} v${f(h - 10)} q${f(-sw / 2)},6 ${f(-sw)},0 Z" fill="${c}"/><path d="M${f(sx)},${f(by - 16)} h${f(sw)}" stroke="#f2d060" stroke-width="3"/>`; }).join('');
    case 'pot': return `<ellipse cx="${f(cx)}" cy="${f(by - 8)}" rx="${f(w * 0.28)}" ry="6" fill="#2a2420"/><path d="M${f(cx - w * 0.28)},${f(by - 30)} h${f(w * 0.56)} v18 a${f(w * 0.28)},8 0 0 1 ${f(-w * 0.56)},0 Z" fill="#3b332e"/><ellipse cx="${f(cx)}" cy="${f(by - 30)}" rx="${f(w * 0.28)}" ry="6" fill="#d8551f"/>` +
      `<path class="tm-steam" d="M${f(cx - 10)},${f(by - 36)} q-8,-10 0,-18 q8,-8 0,-16 M${f(cx + 8)},${f(by - 36)} q-8,-10 0,-18" stroke="#fff" stroke-opacity=".7" stroke-width="3" fill="none"/>` +
      [0, 1].map((i) => `<ellipse cx="${f(x + 14 + i * (w - 28))}" cy="${f(by - 6)}" rx="10" ry="4" fill="#f4efe2"/><ellipse cx="${f(x + 14 + i * (w - 28))}" cy="${f(by - 7)}" rx="6" ry="2.4" fill="#e0902a"/>`).join('');
    case 'tea': return `<path d="M${f(cx - 22)},${f(by - 8)} q0,-26 22,-26 q22,0 22,26 Z" fill="#3a3a3a"/><path d="M${f(cx + 22)},${f(by - 22)} q14,-4 16,-16" stroke="#3a3a3a" stroke-width="4" fill="none"/><path d="M${f(cx - 20)},${f(by - 26)} q-12,4 -10,16" stroke="#3a3a3a" stroke-width="4" fill="none"/><ellipse cx="${f(cx)}" cy="${f(by - 34)}" rx="6" ry="3" fill="#555"/>` +
      [0, 1].map((i) => `<path d="M${f(x + 8 + i * (w - 26))},${f(by - 14)} h14 l-2,10 h-10 Z" fill="#f4efe2" stroke="#2f6b5a"/>`).join('') + `<path class="tm-steam" d="M${f(cx + 36)},${f(by - 42)} q-6,-8 0,-14" stroke="#fff" stroke-opacity=".7" stroke-width="2.5" fill="none"/>`;
    case 'orchid': return [0, 1, 2].map((i) => { const ox = x + 14 + i * (w - 28) / 2, oy = y + 14 + (i % 2) * 8; return `<path d="M${f(ox)},${f(by - 6)} q-4,-20 0,${f(oy - by + 16)}" stroke="#4a7a3a" stroke-width="2" fill="none"/>` + [0, 72, 144, 216, 288].map((r) => `<ellipse cx="${f(ox)}" cy="${f(oy - 6)}" rx="4" ry="7" fill="${i === 1 ? '#f0d8f4' : '#c565d9'}" transform="rotate(${r} ${f(ox)} ${f(oy)})"/>`).join('') + `<circle cx="${f(ox)}" cy="${f(oy)}" r="2.5" fill="#f2c14e"/>`; }).join('') +
      `<ellipse cx="${f(cx)}" cy="${f(by - 6)}" rx="16" ry="6" fill="#f4efe2"/><ellipse cx="${f(cx)}" cy="${f(by - 8)}" rx="11" ry="3" fill="#6a9a3a"/>`;
    case 'stage': return `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="#2a0f18"/><path d="M${f(x)},${f(y)} h${f(w)} v10 q${f(-w / 4)},12 ${f(-w / 2)},0 q${f(-w / 4)},12 ${f(-w / 2)},0 Z" fill="#b02030"/>` +
      `<path d="M${f(cx)},${f(y + 6)} L${f(cx - 26)},${f(by)} L${f(cx + 26)},${f(by)} Z" fill="#ff5a4a" fill-opacity=".35"/><path d="M${f(cx)},${f(y + 20)} q-4,6 0,12 q-10,10 -14,${f(h - 38)} l28,0 q-4,${f(-(h - 50))} -14,${f(-(h - 50))} Z" fill="#d8322f"/><circle cx="${f(cx)}" cy="${f(y + 16)}" r="5" fill="#1a1010"/>`;
    case 'buttons': return [0, 1, 2].map((i) => `<rect x="${f(x + 6 + i * (w - 12) / 3)}" y="${f(y + 6)}" width="${f((w - 12) / 3 - 4)}" height="26" fill="#f4efe2" stroke="#9a8a6a"/>` + [0, 1].map((k) => `<circle cx="${f(x + 14 + i * (w - 12) / 3 + k * 12)}" cy="${f(y + 19)}" r="4.5" fill="${['#d25a6e', '#3a4a6e', '#e2c06b'][i]}"/>`).join('')).join('') +
      ['#d25a6e', '#6aa0c8', '#7fb069', '#e8c46a', '#3a3a3a'].map((c, i) => `<rect x="${f(x + 8 + i * (w - 16) / 5)}" y="${f(by - 22)}" width="${f((w - 16) / 5 - 4)}" height="18" rx="2" fill="${c}"/><rect x="${f(x + 8 + i * (w - 16) / 5)}" y="${f(by - 24)}" width="${f((w - 16) / 5 - 4)}" height="3" fill="#c9a86a"/><rect x="${f(x + 8 + i * (w - 16) / 5)}" y="${f(by - 5)}" width="${f((w - 16) / 5 - 4)}" height="3" fill="#c9a86a"/>`).join('');
    case 'fish': return `<rect x="${f(x)}" y="${f(by - 16)}" width="${f(w)}" height="16" fill="#e8f2f4"/>` + [...Array(6)].map((_, i) => { const fx = x + 16 + i * (w - 24) / 6, fy = by - 12 - (i % 2) * 5; return `<path d="M${f(fx - 12)},${f(fy)} q12,-8 22,0 l8,-5 v10 l-8,-5 q-10,8 -22,0 Z" fill="${i % 2 ? '#8aa0a8' : '#b8c4c8'}"/><circle cx="${f(fx - 7)}" cy="${f(fy - 1)}" r="1.2" fill="#222"/>`; }).join('');
    case 'laundry': return '';
    case 'opera': return '';
    case 'crest': return `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="#f6e8c8"/><path d="M${f(x)},${f(y)} q${f(w * 0.2)},${f(h * 0.5)} 0,${f(h)} Z M${f(x + w)},${f(y)} q${f(-w * 0.2)},${f(h * 0.5)} 0,${f(h)} Z" fill="#8a2f3a"/><path d="M${f(cx - 8)},${f(by - 4)} q-4,-18 8,-26 q12,8 8,26 Z" fill="#3a6a8a"/><path d="M${f(cx)},${f(by - 30)} q-8,-12 0,-16 q8,4 0,16" fill="#d25a6e"/>`;
    case 'peacock': return `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="#f4ecd8"/>` + [-40, -20, 0, 20, 40].map((r) => `<g transform="rotate(${r} ${f(cx)} ${f(by - 4)})"><path d="M${f(cx)},${f(by - 4)} V${f(y + 12)}" stroke="#6a8a3a" stroke-width="1.2"/><ellipse cx="${f(cx)}" cy="${f(y + 12)}" rx="6" ry="8" fill="#1f7a6a"/><ellipse cx="${f(cx)}" cy="${f(y + 13)}" rx="3.2" ry="4.4" fill="#2a4aa8"/><circle cx="${f(cx)}" cy="${f(y + 14)}" r="1.6" fill="#e8b84a"/></g>`).join('');
    
    case 'wedding': {
      const a = x + w * 0.28, b = x + w * 0.72;
      return `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="#fbe9d2"/>` +
        [...Array(12)].map((_, i) => `<circle cx="${f(x + 4 + i * (w - 8) / 11)}" cy="${f(y + 4 + Math.sin(i / 11 * Math.PI) * 5)}" r="2.6" fill="${i % 2 ? '#f29a1f' : '#f5c43a'}"/>`).join('') +
        `<path d="M${f(a)},${f(y + 10)} v4" stroke="#6b4a2f" stroke-width="2"/><path d="M${f(a - 6)},${f(y + 15)} q6,-3 12,0 l1,12 h-14 Z" fill="#c42a2f"/><path d="M${f(a - 7)},${f(y + 27)} h14 l2,${f(h - 30)} h-18 Z" fill="#c42a2f"/><path d="M${f(a - 3)},${f(y + 27)} v${f(h - 30)}" stroke="#f2d060" stroke-width="1.2"/><path d="M${f(a - 11)},${f(by - 3)} l2,-14 M${f(a + 11)},${f(by - 3)} l-2,-14" stroke="#f4efe2" stroke-width="3"/>` +
        `<path d="M${f(b)},${f(y + 10)} v4" stroke="#6b4a2f" stroke-width="2"/><path d="M${f(b - 6)},${f(y + 15)} q6,-3 12,0 l1,10 h-14 Z" fill="#d9a93e"/><path d="M${f(b - 7)},${f(y + 25)} h14 l${f(w * 0.12)},${f(h - 28)} h${f(-w * 0.24 - 14)} Z" fill="#b8242c"/><path d="M${f(b - 7 - w * 0.11)},${f(by - 8)} h${f(w * 0.22 + 14)}" stroke="#f2c14e" stroke-width="4"/>`;
    }
    case 'dress': return `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="#f7e6d0" fill-opacity=".6"/><path d="M${f(cx)},${f(y + 4)} v4" stroke="#6b4a2f" stroke-width="2"/><path d="M${f(cx - 8)},${f(y + 10)} q8,-4 16,0 l2,14 q-10,2 -20,0 Z" fill="#d25a6e"/><path d="M${f(cx - 10)},${f(y + 24)} q10,3 20,0 l${f(w * 0.22)},${f(h - 30)} q${f(-w * 0.22 - 10)},6 ${f(-w * 0.44 - 20)},0 Z" fill="#e37a8c"/><path d="M${f(cx - 10)},${f(y + 24)} q10,3 20,0" stroke="#f7e3b5" stroke-width="2" fill="none"/>`;
    default: return '';
  }
}


function roofOf(L, x0, top) {
  const { w } = L, c = shade(L.wall, -0.45), t = L.trim;
  switch (L.roof) {
    case 'gable': return `<path d="M${x0 - 10},${top + 2} L${x0 + w / 2},${top - 58} L${x0 + w + 10},${top + 2} Z" fill="${c}"/><path d="M${x0 - 10},${top + 2} L${x0 + w / 2},${top - 58} L${x0 + w + 10},${top + 2}" stroke="${shade(c, -0.3)}" stroke-width="4" fill="none"/>` +
      [1, 2, 3].map((i) => `<path d="M${f(x0 + (w / 2) * (i / 4) - 4)},${f(top - 58 * (i / 4) + 2)} H${f(x0 + w - (w / 2) * (i / 4) + 4)}" stroke="${shade(c, 0.12)}" stroke-width="2" stroke-opacity=".6"/>`).join('') +
      `<circle cx="${x0 + w / 2}" cy="${top - 26}" r="9" fill="${shade(L.wall, 0.4)}" stroke="${t}" stroke-width="3"/>`;
    case 'mansard': return `<path d="M${x0 - 6},${top} L${x0 + 12},${top - 44} H${x0 + w - 12} L${x0 + w + 6},${top} Z" fill="#4a5462"/><rect x="${x0 - 8}" y="${top - 4}" width="${w + 16}" height="8" fill="${shade(L.wall, 0.3)}"/>` +
      [0.3, 0.7].map((k) => `<rect x="${f(x0 + w * k - 11)}" y="${top - 38}" width="22" height="26" rx="11" fill="#f7e2a6" fill-opacity=".8" stroke="${shade(L.wall, 0.2)}" stroke-width="3"/>`).join('');
    case 'flat': return `<rect x="${x0 - 8}" y="${top - 14}" width="${w + 16}" height="16" fill="${shade(L.wall, 0.25)}"/><path d="M${x0 - 8},${top - 14} h${w + 16}" stroke="${t}" stroke-width="3"/>` +
      (L.garland ? '' : `<rect x="${x0 + w / 2 - 30}" y="${top - 34}" width="60" height="20" fill="${shade(L.wall, 0.25)}"/>`);
    case 'shed': return `<path d="M${x0 - 10},${top + 2} L${x0 - 4},${top - 34} L${x0 + w + 6},${top - 16} L${x0 + w + 10},${top + 2} Z" fill="${c}"/>`;
    case 'pagoda': return `<path d="M${x0 - 22},${top + 4} Q${x0 + w / 2},${top - 16} ${x0 + w + 22},${top + 4} L${x0 + w - 6},${top - 30} Q${x0 + w / 2},${top - 44} ${x0 + 6},${top - 30} Z" fill="#2f5a4a"/>` +
      `<path d="M${x0 - 22},${top + 4} q-6,-6 -2,-12 M${x0 + w + 22},${top + 4} q6,-6 2,-12" stroke="#2f5a4a" stroke-width="4" fill="none"/><path d="M${x0 + 20},${top - 34} Q${x0 + w / 2},${top - 62} ${x0 + w - 20},${top - 34} Z" fill="#2f5a4a"/><circle cx="${x0 + w / 2}" cy="${top - 52}" r="5" fill="${t}"/>`;
    case 'thai': return `<path d="M${x0 - 12},${top + 2} L${x0 + w / 2},${top - 64} L${x0 + w + 12},${top + 2} Z" fill="#b8423a"/><path d="M${x0 + 12},${top - 18} L${x0 + w / 2},${top - 64} L${x0 + w - 12},${top - 18}" stroke="#e8b84a" stroke-width="4" fill="none"/>` +
      `<path d="M${x0 + w / 2},${top - 64} q6,-10 14,-12 M${x0 - 12},${top + 2} q-8,-4 -6,-14 M${x0 + w + 12},${top + 2} q8,-4 6,-14" stroke="#e8b84a" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    case 'stall': return `<path d="M${x0 - 14},${top} L${x0 + 6},${top - 40} H${x0 + w - 6} L${x0 + w + 14},${top} Z" fill="${L.awning[0]}"/>` +
      [...Array(8)].map((_, i) => `<path d="M${f(x0 + 6 + i * (w - 12) / 8)},${top - 40} L${f(x0 - 14 + i * (w + 28) / 8)},${top} L${f(x0 - 14 + (i + 0.5) * (w + 28) / 8)},${top} L${f(x0 + 6 + (i + 0.5) * (w - 12) / 8)},${top - 40} Z" fill="${L.awning[1]}"/>`).join('') +
      [...Array(9)].map((_, i) => `<path d="M${f(x0 - 14 + i * (w + 28) / 9)},${top} q${f((w + 28) / 18)},10 ${f((w + 28) / 9)},0" fill="${i % 2 ? L.awning[1] : L.awning[0]}"/>`).join('');
    default: return '';
  }
}



function windowSpots(L) {
  const x0 = L.x - L.w / 2, top = L.y - L.h, n = L.w > 160 ? 3 : 2, out = [];
  for (let r = 0; r < L.floors - 1; r++) for (let k = 0; k < n; k++) {
    out.push({ r, k, x: x0 + (L.w / n) * (k + 0.5) - 14, y: top + 18 + r * 58, lit: (r + k + L.x) % 3 === 0, night: (r * 7 + k * 3 + L.x) % 5 !== 0 });
  }
  return out;
}
function windowsOf(L) {
  const out = [];
  for (const { r, k, x: wx, y: wy, lit } of windowSpots(L)) {
    out.push(`<rect x="${f(wx)}" y="${f(wy)}" width="28" height="36" rx="${L.roof === 'pagoda' || L.lanterns ? 14 : 2}" fill="${lit ? '#fbe6a8' : '#a9c3cc'}" stroke="${shade(L.wall, -0.4)}" stroke-width="3"/>` +
      `<path d="M${f(wx + 14)},${f(wy)} v36 M${f(wx)},${f(wy + 18)} h28" stroke="${shade(L.wall, -0.4)}" stroke-width="2"/><rect x="${f(wx - 3)}" y="${f(wy + 36)}" width="34" height="4" fill="${shade(L.wall, 0.3)}"/>` +
      (L.grand ? '' : `<rect x="${f(wx - 10)}" y="${f(wy)}" width="8" height="36" fill="${L.trim}" fill-opacity=".85"/><rect x="${f(wx + 30)}" y="${f(wy)}" width="8" height="36" fill="${L.trim}" fill-opacity=".85"/>`) +
      (!lit && (r + k) % 2 ? `<path d="M${f(wx + 4)},${f(wy + 30)} q10,-6 20,0" stroke="#d25a6e" stroke-width="5" fill="none"/>` : ''));
  }
  return out.join('');
}

export function buildingSVG(b, badge = '') {
  const L = LAYOUT[b.id];
  if (!L) return '';
  if (b.id === 'opera') return operaSVG(b, L, badge);
  if (L.roof === 'church') return churchSVG(b, L, badge);
  const x0 = L.x - L.w / 2, top = L.y - L.h;
  const wall = `<rect x="${x0}" y="${top}" width="${L.w}" height="${L.h}" fill="${L.wall}"/><rect x="${x0}" y="${top}" width="${L.w}" height="${L.h}" fill="url(#tm-wallshade)"/>` +
    (L.roof !== 'stall' ? `<rect x="${x0}" y="${top}" width="${L.w}" height="${L.h}" fill="url(#tm-brick)" opacity=".25"/>` : '');
  const chimney = L.chimney ? `<rect x="${x0 + L.w * 0.72}" y="${top - 70}" width="18" height="40" fill="${shade(L.wall, -0.3)}"/><rect x="${x0 + L.w * 0.72 - 3}" y="${top - 74}" width="24" height="7" fill="${shade(L.wall, -0.45)}"/>` +
    `<g class="tm-smoke"><circle cx="${x0 + L.w * 0.72 + 9}" cy="${top - 86}" r="9" fill="#f4f0e8" fill-opacity=".7"/><circle cx="${x0 + L.w * 0.72 + 18}" cy="${top - 104}" r="12" fill="#f4f0e8" fill-opacity=".5"/><circle cx="${x0 + L.w * 0.72 + 30}" cy="${top - 126}" r="15" fill="#f4f0e8" fill-opacity=".3"/></g>` : '';
  let ground;
  if (L.roof === 'stall') {
    ground = `<rect x="${x0}" y="${L.y - 50}" width="${L.w}" height="50" fill="#8a6a4a"/><rect x="${x0}" y="${L.y - 54}" width="${L.w}" height="6" fill="#6b4a2f"/>${display('fish', x0 + 8, L.y - 80, L.w - 16, 32)}` +
      `<path d="M${x0 + 4},${L.y - 50} V${top}" stroke="#6b4a2f" stroke-width="5"/><path d="M${x0 + L.w - 4},${L.y - 50} V${top}" stroke="#6b4a2f" stroke-width="5"/>` +
      [0, 1, 2].map((i) => `<rect x="${x0 + 14 + i * 56}" y="${L.y - 30}" width="42" height="24" fill="#a07a4a" stroke="#6b4a2f" stroke-width="2"/>`).join('');
  } else {
    const sw = L.w * 0.56, sx = x0 + 12, sy = L.y - 74;
    const doorC = L.door || shade(L.wall, -0.5);
    ground = `<rect x="${sx - 4}" y="${sy - 4}" width="${sw + 8}" height="66" fill="${shade(L.wall, -0.35)}"/><rect x="${sx}" y="${sy}" width="${sw}" height="58" fill="#fff3d6"/>` +
      (L.display === 'laundry' ? `<rect x="${sx}" y="${sy}" width="${sw}" height="58" fill="#6a7a80"/><g class="tm-steam"><circle cx="${sx + 20}" cy="${sy + 20}" r="12" fill="#fff" fill-opacity=".5"/><circle cx="${sx + 44}" cy="${sy + 14}" r="14" fill="#fff" fill-opacity=".4"/><circle cx="${sx + 70}" cy="${sy + 24}" r="12" fill="#fff" fill-opacity=".45"/></g>` : display(L.display, sx + 3, sy + 3, sw - 6, 52)) +
      `<rect x="${sx}" y="${sy}" width="${sw}" height="58" fill="url(#tm-glass)"/>` +
      `<rect x="${x0 + L.w - 46}" y="${L.y - 74}" width="34" height="74" rx="${L.grand ? 17 : 3}" fill="${doorC}"/><circle cx="${x0 + L.w - 20}" cy="${L.y - 36}" r="2.6" fill="#e2c06b"/>` +
      (L.grand ? `<rect x="${x0 + L.w - 56}" y="${L.y - 80}" width="6" height="80" fill="#f4efe2"/><rect x="${x0 + L.w - 8}" y="${L.y - 80}" width="6" height="80" fill="#f4efe2"/><path d="M${x0 - 6},${L.y - 4} h${L.w + 12}" stroke="#2a2a2a" stroke-width="3"/>` + [...Array(9)].map((_, i) => `<path d="M${f(x0 - 4 + i * (L.w + 8) / 8)},${L.y} v-14" stroke="#2a2a2a" stroke-width="2"/>`).join('') : '') +
      (L.awning ? `<path d="M${sx - 8},${sy - 6} L${sx},${sy - 26} H${sx + sw} L${sx + sw + 8},${sy - 6} Z" fill="${L.awning[0]}"/>` +
        [...Array(6)].map((_, i) => `<path d="M${f(sx + i * sw / 6 + sw / 24)},${sy - 26} h${f(sw / 12)} L${f(sx - 8 + (i + 0.6) * (sw + 16) / 6)},${sy - 6} h${f(-(sw + 16) / 12)} Z" fill="${L.awning[1]}"/>`).join('') +
        [...Array(6)].map((_, i) => `<path d="M${f(sx - 8 + i * (sw + 16) / 6)},${sy - 6} q${f((sw + 16) / 12)},9 ${f((sw + 16) / 6)},0" fill="${L.awning[i % 2]}"/>`).join('') : '');
  }
  
  const signY = L.roof === 'stall' ? top - 62 : L.y - 106;
  const sign = `<rect x="${f(L.x - Math.min(L.w * 0.46, 76))}" y="${signY}" width="${f(Math.min(L.w * 0.92, 152))}" height="22" rx="3" fill="${L.neon ? '#141a30' : '#3a2612'}" stroke="${L.trim}" stroke-width="2"/>` +
    `<text x="${L.x}" y="${signY + 15.5}" font-family="Georgia,serif" font-style="italic" font-size="${b.sign.length > 16 ? 10 : 13}" text-anchor="middle" fill="${L.neon ? '#8fd8ff' : '#f7e3b5'}"${L.neon ? ' class="tm-neon"' : ''}>${b.sign.replace(/&/g, '&amp;')}</text>`;
  const laundry = L.display === 'laundry' ? `<path d="M${x0 - 60},${top + 10} Q${x0 - 30},${top + 24} ${x0},${top + 10}" stroke="#6b5a4a" stroke-width="1.5" fill="none"/>` + ['#f4f4ee', '#cfe0ea', '#f4d8d8'].map((c, i) => `<rect class="tm-flap" x="${x0 - 56 + i * 18}" y="${top + 14 + (i === 1 ? 4 : 0)}" width="14" height="20" fill="${c}"/>`).join('') : '';
  const shadow = `<ellipse cx="${L.x}" cy="${L.y + 2}" rx="${L.w * 0.62}" ry="10" fill="#000" fill-opacity=".18"/>`;
  return `<g class="tm-b${b.home ? ' home' : ''}" data-b="${b.id}" tabindex="0" role="button" aria-label="${b.name.replace(/"/g, '')}">${shadow}${chimney}${wall}${roofOf(L, x0, top)}${windowsOf(L)}${ground}${sign}${laundry}` +
    `<rect x="${x0 - 14}" y="${top - 70}" width="${L.w + 28}" height="${L.h + 76}" fill="transparent"/>${badge}</g>`;
}

function operaSVG(b, L, badge) {
  const x0 = L.x - L.w / 2, top = L.y - L.h;
  const cols = [...Array(6)].map((_, i) => `<rect x="${f(x0 + 22 + i * (L.w - 44) / 5 - 7)}" y="${top + 58}" width="14" height="${L.h - 70}" fill="#f7efe0"/><rect x="${f(x0 + 22 + i * (L.w - 44) / 5 - 10)}" y="${top + 54}" width="20" height="6" fill="#e2d4bc"/>`).join('');
  const posters = [['TOSCA', '#8a2f3a'], ['MAGIC FLUTE', '#2c3e6a']].map(([t, c], i) => `<rect x="${f(x0 + 44 + i * (L.w - 118))}" y="${L.y - 86}" width="30" height="42" fill="${c}"/><text x="${f(x0 + 59 + i * (L.w - 118))}" y="${L.y - 62}" font-size="6" font-family="Georgia,serif" text-anchor="middle" fill="#f7e3b5">${t}</text>`).join('');
  return `<g class="tm-b" data-b="${b.id}" tabindex="0" role="button" aria-label="${b.name}"><ellipse cx="${L.x}" cy="${L.y + 2}" rx="${L.w * 0.6}" ry="11" fill="#000" fill-opacity=".18"/>` +
    `<path d="M${L.x - 56},${top - 20} Q${L.x},${top - 110} ${L.x + 56},${top - 20} Z" fill="#6a8a7a"/><path d="M${L.x - 56},${top - 20} Q${L.x},${top - 110} ${L.x + 56},${top - 20}" stroke="#4a6a5a" stroke-width="3" fill="none"/><circle cx="${L.x}" cy="${top - 70}" r="7" fill="${L.trim}"/>` +
    `<rect x="${L.x - 60}" y="${top - 24}" width="120" height="24" fill="#e9dcc6"/>` +
    `<rect x="${x0}" y="${top + 50}" width="${L.w}" height="${L.h - 50}" fill="${L.wall}"/><rect x="${x0}" y="${top + 50}" width="${L.w}" height="${L.h - 50}" fill="url(#tm-wallshade)"/>` +
    `<path d="M${x0 - 12},${top + 54} L${L.x},${top} L${x0 + L.w + 12},${top + 54} Z" fill="#e9dcc6" stroke="#cdbb9a" stroke-width="3"/><path d="M${L.x - 40},${top + 44} L${L.x},${top + 18} L${L.x + 40},${top + 44} Z" fill="#d9c7a4"/><circle cx="${L.x}" cy="${top + 36}" r="7" fill="${L.trim}"/>` +
    `<rect x="${x0 + 10}" y="${L.y - 96}" width="${L.w - 20}" height="96" fill="#5a2a2a" fill-opacity=".35"/>${cols}${posters}` +
    [0, 1, 2].map((i) => `<rect x="${f(L.x - 50 + i * 36)}" y="${L.y - 70}" width="28" height="70" rx="14" fill="#6a1f28"/><rect x="${f(L.x - 50 + i * 36)}" y="${L.y - 70}" width="28" height="70" rx="14" fill="#ffd98a" fill-opacity=".25"/>`).join('') +
    `<rect x="${x0 - 10}" y="${L.y - 6}" width="${L.w + 20}" height="8" fill="#d9ccb4"/><rect x="${x0 - 20}" y="${L.y}" width="${L.w + 40}" height="8" fill="#cdbfa6"/>` +
    `<rect x="${L.x - 70}" y="${top + 64}" width="140" height="18" fill="#3a2612" stroke="${L.trim}" stroke-width="2"/><text x="${L.x}" y="${top + 77}" font-family="Georgia,serif" font-size="12" letter-spacing="4" text-anchor="middle" fill="#f7e3b5">OPERA</text>` +
    `<rect x="${x0 - 14}" y="${top - 110}" width="${L.w + 28}" height="${L.h + 116}" fill="transparent"/>${badge}</g>`;
}



function churchSVG(b, L, badge) {
  const x0 = L.x - L.w / 2, top = L.y - L.h, tx = x0 - 16, tw = 44, tt = top - 50;
  const glass = ['#c0392b', '#2c5aa0', '#e8b84a', '#3a8a5a'];
  const lancet = (x, y, h) => `<path d="M${x - 9},${y + h} V${y + 9} a9,9 0 0 1 18,0 V${y + h} Z" fill="#2a2a3a" stroke="#8a7a6a" stroke-width="3"/>` +
    [0, 1, 2].map((i) => `<rect x="${x - 7}" y="${y + 6 + i * (h - 6) / 3}" width="14" height="${f((h - 8) / 3)}" fill="${glass[(i + x) % 4]}" fill-opacity=".8"/>`).join('') + `<path d="M${x},${y + 2} V${y + h}" stroke="#8a7a6a" stroke-width="1.5"/>`;
  return `<g class="tm-b" data-b="${b.id}" tabindex="0" role="button" aria-label="${b.name.replace(/"/g, '')}"><ellipse cx="${L.x - 8}" cy="${L.y + 2}" rx="${L.w * 0.72}" ry="10" fill="#000" fill-opacity=".18"/>` +
    
    `<rect x="${tx}" y="${tt}" width="${tw}" height="${L.y - tt}" fill="${shade(L.wall, -0.06)}"/><rect x="${tx}" y="${tt}" width="${tw}" height="${L.y - tt}" fill="url(#tm-brick)" opacity=".2"/>` +
    `<path d="M${tx - 4},${tt} L${tx + tw / 2},${tt - 96} L${tx + tw + 4},${tt} Z" fill="#4a5462"/><path d="M${tx + tw / 2},${tt - 96} v-16 M${tx + tw / 2 - 6},${tt - 106} h12" stroke="${L.trim}" stroke-width="3"/>` +
    `<path d="M${tx + 12},${tt + 38} v-12 a10,10 0 0 1 20,0 v12 Z" fill="#3a3040"/><path d="M${tx + 16},${tt + 36} q6,-8 12,0" stroke="#c9a86a" stroke-width="2.5" fill="none"/><circle cx="${tx + tw / 2}" cy="${tt + 58}" r="9" fill="#f6ecd4" stroke="#6b5a4a" stroke-width="2.5"/><path d="M${tx + tw / 2},${tt + 58} v-6 M${tx + tw / 2},${tt + 58} l4,2" stroke="#3a2a22" stroke-width="1.6"/>` +
    
    `<rect x="${x0}" y="${top}" width="${L.w}" height="${L.h}" fill="${L.wall}"/><rect x="${x0}" y="${top}" width="${L.w}" height="${L.h}" fill="url(#tm-wallshade)"/><rect x="${x0}" y="${top}" width="${L.w}" height="${L.h}" fill="url(#tm-brick)" opacity=".2"/>` +
    `<path d="M${x0 - 8},${top + 4} L${L.x},${top - 62} L${x0 + L.w + 8},${top + 4} Z" fill="${L.wall}" stroke="#4a5462" stroke-width="7" stroke-linejoin="round"/>` +
    `<circle class="tm-rose" cx="${L.x}" cy="${top - 14}" r="17" fill="#2a2a3a" stroke="#8a7a6a" stroke-width="3"/>` + [0, 45, 90, 135, 180, 225, 270, 315].map((r, i) => `<path d="M${L.x},${top - 14} L${L.x},${top - 29}" stroke="${glass[i % 4]}" stroke-width="6" stroke-opacity=".85" transform="rotate(${r} ${L.x} ${top - 14})"/>`).join('') + `<circle cx="${L.x}" cy="${top - 14}" r="4" fill="#e8b84a"/>` +
    lancet(x0 + 24, top + 24, 60) + lancet(x0 + L.w - 24, top + 24, 60) +
    `<path d="M${L.x - 20},${L.y} V${L.y - 46} a20,20 0 0 1 40,0 V${L.y} Z" fill="#5a3a2a" stroke="#8a7a6a" stroke-width="4"/><path d="M${L.x},${L.y - 64} V${L.y}" stroke="#3a2618" stroke-width="2"/><circle cx="${L.x - 5}" cy="${L.y - 26}" r="2" fill="#e2c06b"/><circle cx="${L.x + 5}" cy="${L.y - 26}" r="2" fill="#e2c06b"/>` +
    [-1, 1].map((s) => `<g transform="translate(${L.x + s * 36},${L.y - 4})"><path d="M-8,0 h16 l-3,-14 h-10 Z" fill="#8a6a4a"/>${[-5, 0, 5].map((dx, i) => `<path d="M${dx},-14 q${dx * 0.4},-10 ${dx * 0.8},-18" stroke="#4a7a3a" stroke-width="1.6" fill="none"/><ellipse cx="${f(dx * 1.8)}" cy="${-33 - (i % 2) * 4}" rx="4" ry="6" fill="#fbf6ea"/>`).join('')}</g>`).join('') +
    `<rect x="${L.x - 48}" y="${top + 90}" width="96" height="20" rx="3" fill="#3a2612" stroke="${L.trim}" stroke-width="2"/><text x="${L.x}" y="${top + 104}" font-family="Georgia,serif" font-style="italic" font-size="13" text-anchor="middle" fill="#f7e3b5">${b.sign.replace(/&/g, '&amp;')}</text>` +
    `<rect x="${tx - 8}" y="${tt - 112}" width="${x0 + L.w - tx + 20}" height="${L.y - tt + 118}" fill="transparent"/>${badge}</g>`;
}


export function badgeSVG(b, st) {
  const L = LAYOUT[b.id];
  if (!L || !st) return '';
  
  
  const roofH = { gable: 58, pagoda: 62, thai: 66, mansard: 44, flat: 34, shed: 34, stall: 44, church: 80 }[L.roof] || 40;
  const y = b.id === 'opera' ? 70 : L.y - L.h - roofH + 4, x = L.roof === 'church' ? L.x + 18 : L.x;
  
  return `<g transform="translate(${x},${y})"><g class="tm-badge ${st}">${BADGE_ICONS[st] || ''}</g></g>`;
}



export function legendIcon(st) {
  const vb = LEGEND_BOX[st];
  return BADGE_ICONS[st] ? `<svg class="lg-ic" viewBox="${vb}" style="width:${(18 * +vb.split(' ')[2] / +vb.split(' ')[3]).toFixed(1)}px" aria-hidden="true">${BADGE_ICONS[st]}</svg>` : '';
}

const LEGEND_BOX = { work: '-16 -42 32 34', talk: '-25 -45 50 38', done: '-15 -45 30 30', closed: '-13 -47 26 33', home: '-17 -47 34 34', mend: '-18 -48 36 36', sleep: '-16 -60 40 48' };
const BADGE_ICONS = {
    work: `<path d="M-14,-40 h28 v22 l-14,8 l-14,-8 Z" fill="#b28a35" stroke="#f7e3b5" stroke-width="2"/><text y="-22" font-size="18" font-weight="bold" font-family="Georgia,serif" text-anchor="middle" fill="#fff8e6">!</text>`,
    talk: `<path d="M-18,-44 h36 a6,6 0 0 1 6,6 v16 a6,6 0 0 1 -6,6 h-20 l-10,8 v-8 h-6 a6,6 0 0 1 -6,-6 v-16 a6,6 0 0 1 6,-6 Z" fill="#fffaf0" stroke="#6b4a2f" stroke-width="2"/><circle cx="-9" cy="-30" r="2.6" fill="#6b4a2f"/><circle cx="0" cy="-30" r="2.6" fill="#6b4a2f"/><circle cx="9" cy="-30" r="2.6" fill="#6b4a2f"/>`,
    done: `<circle cy="-30" r="13" fill="#e8e0d0" stroke="#8a7a6a" stroke-width="2"/><path d="M-6,-30 l4,5 l8,-10" stroke="#6a7a5a" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    closed: `<rect x="-11" y="-34" width="22" height="18" rx="3" fill="#8a7a6a"/><path d="M-6,-34 v-6 a6,6 0 0 1 12,0 v6" stroke="#8a7a6a" stroke-width="3.5" fill="none"/><circle cy="-25" r="2.6" fill="#e8e0d0"/>`,
    home: `<circle cy="-30" r="15" fill="#d25a6e" stroke="#f7e3e6" stroke-width="2"/><path d="M-7,-26 v-6 l7,-6 l7,6 v6 Z" fill="#fff"/>`,
    
    mend: `<circle cy="-30" r="16" fill="#3a6aa8" stroke="#f7e3b5" stroke-width="2"/><path d="M-9,-28 q5,-8 12,-6 l6,-5 l-1,6 q2,5 -4,8 q-7,3 -13,-3 Z" fill="#fff"/><circle cx="4" cy="-33" r="1.2" fill="#3a6aa8"/>`,
    
    sleep: `<text x="-14" y="-16" font-family="Georgia,serif" font-weight="bold" font-size="30" fill="#e8e0f8" stroke="#2a2440" stroke-width="1.2">z</text><text x="6" y="-38" font-family="Georgia,serif" font-weight="bold" font-size="22" fill="#e8e0f8" stroke="#2a2440" stroke-width=".6">Z</text>`,
};


export function townMapSVG(buildings, statusOf = () => '', { night = false } = {}) {
  const water = `<path d="M0,560 C120,590 210,640 250,700 C290,760 380,800 470,830 H0 Z" fill="#4f8aa0"/><path d="M0,560 C120,590 210,640 250,700 C290,760 380,800 470,830" stroke="#e8dcc0" stroke-width="10" fill="none"/>` +
    [...Array(9)].map((_, i) => `<path class="tm-wave" d="M${20 + (i % 3) * 70},${620 + i * 22} q14,-6 28,0 t28,0" stroke="#d9ecf0" stroke-opacity=".7" stroke-width="2.5" fill="none" style="animation-delay:${(i * 0.37).toFixed(2)}s"/>`).join('') +
    [[90, 690], [190, 780]].map(([x, y], i) => `<g class="tm-boat" style="animation-delay:${i * 1.3}s"><path d="M${x - 44},${y} h88 l-14,18 h-60 Z" fill="${i ? '#8a3a2a' : '#5a4a3a'}"/><path d="M${x},${y} V${y - 82}" stroke="#4a3322" stroke-width="4"/><path d="M${x + 3},${y - 78} L${x + 42},${y - 8} H${x + 3} Z" fill="#f4ead8"/><path d="M${x - 3},${y - 70} L${x - 30},${y - 10} H${x - 3} Z" fill="#e8dcc0"/></g>`).join('') +
    [[300, 560], [120, 520], [420, 600]].map(([x, y], i) => `<path class="tm-gull" style="animation-delay:${i * 0.9}s" d="M${x - 10},${y} q5,-6 10,0 q5,-6 10,0" stroke="#fff" stroke-width="2.2" fill="none"/>`).join('');
  const hill = `<path d="M960,330 C1040,290 1080,300 1120,305 L1600,300 V420 H940 Z" fill="#8fae6a"/><path d="M1000,318 C1100,300 1300,298 1600,300" stroke="#e8dcc0" stroke-width="16" fill="none"/>` +
    [1030, 1060, 1320, 1470].map((x, i) => tree(x, 322 + (i % 2) * 4, 0.8)).join('');
  const roads = `<g fill="none" stroke-linecap="round">` +
    ['M850,830 C850,720 800,640 785,560', 'M785,560 C640,540 480,470 260,430', 'M700,580 C600,640 470,660 360,700', 'M785,560 C920,570 1100,590 1560,600', 'M1000,590 C1040,520 960,440 1010,380 C1050,340 1100,330 1180,318', 'M960,640 C1040,700 1120,760 1170,810', 'M500,660 C540,720 570,760 590,810']
      .map((d) => `<path d="${d}" stroke="#bfae8c" stroke-width="44"/><path d="${d}" stroke="#d9c9a6" stroke-width="36"/><path d="${d}" stroke="#cbb994" stroke-width="36" stroke-dasharray="3 14" stroke-opacity=".7"/>`).join('') + `</g>`;
  const square = `<ellipse cx="785" cy="560" rx="170" ry="48" fill="#d9c9a6" stroke="#bfae8c" stroke-width="4"/>` +
    `<ellipse cx="785" cy="566" rx="30" ry="10" fill="#8aa6b0" stroke="#b8a888" stroke-width="4"/><path class="tm-fount" d="M785,562 q-10,-26 -20,-6 M785,562 q10,-26 20,-6 M785,562 v-28" stroke="#d9ecf0" stroke-width="2.5" fill="none"/>`;
  const clock = `<g class="tm-clock"><rect x="765" y="330" width="40" height="190" fill="#b8926a"/><rect x="765" y="330" width="40" height="190" fill="url(#tm-wallshade)"/><path d="M759,332 L785,286 L811,332 Z" fill="#6b4a3a"/><circle cx="785" cy="362" r="15" fill="#f6ecd4" stroke="#6b4a2f" stroke-width="4"/>` +
    `<path d="M785,362 v-10 M785,362 l7,4" stroke="#3a2a22" stroke-width="2.5"/><rect x="775" y="470" width="20" height="50" rx="10" fill="#5a3a2a"/></g>`;
  const bunting = (x1, y1, x2, y2, colors, sag = 26) => {
    const pts = [...Array(13)].map((_, i) => { const t = i / 12; return [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t + Math.sin(t * Math.PI) * sag]; });
    return `<path d="M${x1},${y1} Q${(x1 + x2) / 2},${(y1 + y2) / 2 + sag * 2} ${x2},${y2}" stroke="#5a4030" stroke-width="1.4" fill="none"/>` + pts.slice(1, -1).map(([x, y], i) => `<path class="tm-flag" style="animation-delay:${(i * 0.2).toFixed(1)}s" d="M${f(x - 6)},${f(y)} l6,13 l6,-13 Z" fill="${colors[i % colors.length]}"/>`).join('');
  };
  const lanterns = (x1, y1, x2, y2) => {
    let s = `<path d="M${x1},${y1} Q${(x1 + x2) / 2},${(y1 + y2) / 2 + 40} ${x2},${y2}" stroke="#3a2a22" stroke-width="1.4" fill="none"/>`;
    for (let i = 1; i < 8; i++) { const t = i / 8, x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t + Math.sin(t * Math.PI) * 20; s += `<g class="tm-lantern" style="animation-delay:${(i * 0.3).toFixed(1)}s;transform-origin:${f(x)}px ${f(y)}px"><path d="M${f(x)},${f(y)} v4" stroke="#3a2a22"/><ellipse cx="${f(x)}" cy="${f(y + 13)}" rx="8" ry="10" fill="#e0322f"/><ellipse cx="${f(x)}" cy="${f(y + 13)}" rx="4" ry="9" fill="#ff7a4a" fill-opacity=".5"/><rect x="${f(x - 4)}" y="${f(y + 3)}" width="8" height="2.5" fill="#e8b84a"/></g>`; }
    return s;
  };
  const marigolds = (x1, y1, x2, y2) => [...Array(22)].map((_, i) => { const t = i / 21, x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t + Math.sin(t * Math.PI) * 24; return `<circle cx="${f(x)}" cy="${f(y)}" r="4.5" fill="${i % 2 ? '#f29a1f' : '#f5c43a'}"/>`; }).join('');
  const trees = [[40, 470], [385, 520], [700, 700], [990, 700], [1560, 690], [1545, 812], [500, 500], [1000, 800], [30, 800]].map(([x, y], i) => tree(x, y, 0.8 + (i % 3) * 0.15)).join('');
  const labels = [['Spice Row', 250, 452], ['Market Square', 785, 625], ['Lantern Street', 1300, 632], ['The Harbour', 150, 590], ['The Crescent', 1420, 340], ['Thimble Lane', 1010, 790]]
    .map(([t, x, y]) => `<g class="tm-label" transform="translate(${x},${y})"><rect x="${-t.length * 4.6 - 10}" y="-14" width="${t.length * 9.2 + 20}" height="24" rx="4" fill="#fff4dc" fill-opacity=".92" stroke="#6b4a2f" stroke-width="1.5"/><text y="4" font-family="Georgia,serif" font-style="italic" font-size="15" text-anchor="middle" fill="#3a2612">${t}</text></g>`).join('');
  const order = [...buildings].sort((a, b) => (LAYOUT[a.id]?.y || 0) - (LAYOUT[b.id]?.y || 0));
  
  const lamps = LAMPS.map(([x, y]) => `<g><path d="M${x},${y} v-44" stroke="#2f2a28" stroke-width="3.5"/><path d="M${x - 5},${y} h10" stroke="#2f2a28" stroke-width="4"/><path d="M${x - 7},${y - 44} h14 l-3,-12 h-8 Z" fill="#3a3430"/><path d="M${x - 4},${y - 46} h8 l-2,-8 h-4 Z" fill="#cfd8d0" class="tm-lampglass"/></g>`).join('');
  
  
  const badges = order.map((b) => badgeSVG(b, statusOf(b))).join('');
  return `<svg class="townmap${night ? ' night' : ''}" viewBox="0 0 ${MAP_W} ${MAP_H}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><defs>` +
    `<linearGradient id="tm-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fcbe0"/><stop offset=".7" stop-color="#f4dcae"/></linearGradient>` +
    `<linearGradient id="tm-nsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1230"/><stop offset=".6" stop-color="#2a2f5e"/><stop offset="1" stop-color="#5a4a6e"/></linearGradient>` +
    `<radialGradient id="tm-glow"><stop offset="0" stop-color="#ffd98a" stop-opacity=".75"/><stop offset=".4" stop-color="#ffc760" stop-opacity=".28"/><stop offset="1" stop-color="#ffc760" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="tm-redglow"><stop offset="0" stop-color="#ff7a4a" stop-opacity=".7"/><stop offset="1" stop-color="#ff4a2a" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="tm-blueglow"><stop offset="0" stop-color="#8fd8ff" stop-opacity=".6"/><stop offset="1" stop-color="#6ab0e8" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="tm-moonglow"><stop offset=".3" stop-color="#fff6d8" stop-opacity=".5"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="tm-wallshade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>` +
    `<linearGradient id="tm-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".12"/></linearGradient>` +
    `<pattern id="tm-brick" width="24" height="12" patternUnits="userSpaceOnUse"><path d="M0,12 H24 M0,6 H24 M12,0 V6 M0,6 V12 M24,6 V12" stroke="#000" stroke-width=".8"/></pattern>` +
    `</defs><rect width="${MAP_W}" height="${MAP_H}" fill="url(#tm-sky)"/><rect class="tm-nightsky" width="${MAP_W}" height="420" fill="url(#tm-nsky)"/>` +
    `<g class="tm-clouds"><path d="M120,90 q20,-30 50,-14 q20,-24 50,-4 q30,-4 30,20 q0,18 -30,18 h-90 q-26,0 -10,-20 Z" fill="#fff" fill-opacity=".85"/><path d="M760,60 q18,-24 44,-10 q22,-18 44,2 q26,0 24,18 h-110 q-18,-4 -2,-10 Z" fill="#fff" fill-opacity=".75"/><path d="M1260,120 q20,-24 44,-12 q22,-20 46,0 q24,2 22,20 h-112 q-16,-2 0,-8 Z" fill="#fff" fill-opacity=".8"/></g>` +
    `<path d="M0,300 C200,220 380,260 560,240 C760,215 900,260 1100,230 C1300,200 1450,240 1600,220 V420 H0 Z" fill="#b7c99a"/><path d="M0,340 C240,300 420,330 620,310 C820,290 980,330 1600,300 V830 H0 Z" fill="#a7bf86"/>` +
    `<rect y="380" width="1600" height="450" fill="#b9c58e"/>${hill}${roads}${square}${water}${trees}` +
    bunting(535, 420, 700, 440, ['#d25a6e', '#e8c46a', '#6aa0c8', '#7fb069']) + bunting(870, 440, 1040, 420, ['#7fb069', '#d25a6e', '#e8c46a', '#6aa0c8']) +
    marigolds(70, 300, 430, 290) + lanterns(1050, 470, 1390, 455) + lanterns(1220, 480, 1550, 470) + lamps +
    order.filter((b) => LAYOUT[b.id]?.y < 530).map((b) => buildingSVG(b)).join('') + clock +
    order.filter((b) => LAYOUT[b.id]?.y >= 530).map((b) => buildingSVG(b)).join('') +
    `<rect class="tm-nightveil" width="${MAP_W}" height="${MAP_H}" fill="#3a4480"/>${nightLights(order)}${labels}<g class="tm-badges">${badges}</g></svg>`;
}




function nightLights(order) {
  let s = `<circle cx="640" cy="92" r="70" fill="url(#tm-moonglow)"/><circle cx="640" cy="92" r="26" fill="#fbf2d4"/><circle cx="650" cy="86" r="23" fill="#fbf2d4"/><circle cx="632" cy="84" r="4" fill="#e8dcb8"/><circle cx="646" cy="102" r="5.5" fill="#e8dcb8"/>`;
  
  const boxes = [[10, 10, 440, 190], [540, 10, 1080, 200], [1270, 8, 1600, 55], [440, 10, 540, 90]];
  let k = 7;
  const rnd = () => ((k = (k * 16807) % 2147483647) / 2147483647);
  for (const [x0, y0, x1, y1] of boxes) {
    const n = Math.round((x1 - x0) * (y1 - y0) / 2600);
    for (let i = 0; i < n; i++) {
      const x = x0 + rnd() * (x1 - x0), y = y0 + rnd() * (y1 - y0), r = 0.8 + rnd() * 1.6;
      if (Math.hypot(x - 640, y - 92) < 60) continue;
      s += `<circle class="tm-star" cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#fff8e0" style="animation-delay:${f(rnd() * 4)}s"/>`;
    }
  }
  for (const b of order) {
    const L = LAYOUT[b.id];
    if (!L) continue;
    
    for (const w of windowSpots(L)) if (w.night && w.y + 36 < L.y - 108) s += `<rect x="${f(w.x)}" y="${f(w.y)}" width="28" height="36" rx="${L.roof === 'pagoda' || L.lanterns ? 14 : 2}" fill="#ffd98a" fill-opacity=".9"/><circle cx="${f(w.x + 14)}" cy="${f(w.y + 18)}" r="34" fill="url(#tm-glow)"/>`;
    if (b.id === 'opera') s += [0, 1, 2].map((i) => `<rect x="${f(L.x - 50 + i * 36)}" y="${L.y - 70}" width="28" height="70" rx="14" fill="#ffd27a" fill-opacity=".55"/>`).join('') + `<ellipse cx="${L.x}" cy="${L.y - 40}" rx="${L.w * 0.6}" ry="60" fill="url(#tm-glow)"/>`;
    else if (L.roof === 'church') s += `<circle cx="${L.x}" cy="${L.y - L.h - 14}" r="36" fill="url(#tm-glow)"/>` + [L.x - L.w / 2 + 24, L.x + L.w / 2 - 24].map((x) => `<ellipse cx="${x}" cy="${L.y - L.h + 54}" rx="16" ry="38" fill="url(#tm-glow)"/>`).join('');
    else if (L.roof !== 'stall') {
      const sw = L.w * 0.56, sx = L.x - L.w / 2 + 12, sy = L.y - 74;
      s += `<rect x="${f(sx)}" y="${sy}" width="${f(sw)}" height="58" fill="#ffcf7a" fill-opacity=".42" style="mix-blend-mode:screen"/><ellipse cx="${f(sx + sw / 2)}" cy="${L.y}" rx="${f(sw * 0.7)}" ry="14" fill="#ffcf7a" fill-opacity=".25"/>`;
    }
    if (L.neon) s += `<ellipse cx="${L.x}" cy="${L.y - 95}" rx="90" ry="30" fill="url(#tm-blueglow)"/>`;
  }
  s += LAMPS.map(([x, y]) => `<ellipse cx="${x}" cy="${y + 2}" rx="34" ry="9" fill="#ffd98a" fill-opacity=".22"/><circle cx="${x}" cy="${y - 50}" r="30" fill="url(#tm-glow)"/><path d="M${x - 4},${y - 46} h8 l-2,-8 h-4 Z" fill="#fff2bf"/>`).join('');
  
  for (const [x1, y1, x2, y2] of [[1050, 470, 1390, 455], [1220, 480, 1550, 470]]) {
    for (let i = 1; i < 8; i++) { const t = i / 8, x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t + Math.sin(t * Math.PI) * 20; s += `<circle cx="${f(x)}" cy="${f(y + 13)}" r="18" fill="url(#tm-redglow)"/><ellipse cx="${f(x)}" cy="${f(y + 13)}" rx="5" ry="8" fill="#ffb07a" fill-opacity=".8"/>`; }
  }
  return `<g class="tm-lights">${s}</g>`;
}

function tree(x, y, s = 1) {
  return `<g transform="translate(${x},${y}) scale(${s})"><ellipse cy="4" rx="26" ry="7" fill="#000" fill-opacity=".15"/><rect x="-4" y="-26" width="8" height="30" fill="#6b4a2f"/>` +
    `<path d="M-30,-30 C-40,-58 -14,-78 0,-72 C16,-86 42,-64 32,-40 C44,-24 22,-8 0,-16 C-20,-6 -42,-14 -30,-30 Z" fill="#5d8a45"/><path d="M-14,-54 C-6,-66 8,-66 14,-56" stroke="#86b064" stroke-width="5" fill="none" stroke-linecap="round"/></g>`;
}


const INSIDE = {
  atelier: { wall: '#3f4d3d', floor: '#6b4a2f', shelf: 'dress' },
  bakery: { wall: '#f1dfc4', floor: '#b88a5a', shelf: 'bread' },
  herald: { wall: '#c9cfd4', floor: '#7a6a5a', shelf: 'papers' },
  silks: { wall: '#f2c9a0', floor: '#a0522d', shelf: 'silks' },
  chophouse: { wall: '#f4d69a', floor: '#8a5a3a', shelf: 'pot' },
  teahouse: { wall: '#e8cfa0', floor: '#5a2a24', shelf: 'tea' },
  orchid: { wall: '#f0e2c0', floor: '#7a4a3a', shelf: 'orchid' },
  bluelantern: { wall: '#27305a', floor: '#3a2a2a', shelf: 'stage' },
  haberdashery: { wall: '#d9cbb0', floor: '#6b4a3a', shelf: 'buttons' },
  fishmarket: { wall: '#a9c3cc', floor: '#8a7a6a', shelf: 'fish' },
  washhouse: { wall: '#c8c4b8', floor: '#7a7a74', shelf: 'laundry' },
  opera: { wall: '#6a1f28', floor: '#3a1a18', shelf: 'opera' },
  ashcombe: { wall: '#dfe6d8', floor: '#8a6a4a', shelf: 'crest' },
  ninecrescent: { wall: '#d6ebe8', floor: '#8a6a4a', shelf: 'peacock' },
  stanne: { wall: '#e4dccb', floor: '#7a6a5a', shelf: 'church' },
  lotus: { wall: '#f6dcc4', floor: '#7a2a24', shelf: 'wedding' },
};
export function interiorSVG(id) {
  const I = INSIDE[id] || INSIDE.bakery;
  const wall = I.wall;
  let back;
  if (I.shelf === 'opera') {
    back = `<path d="M0,0 H1280 V120 Q640,200 0,120 Z" fill="#8a2030"/>` + [...Array(8)].map((_, i) => `<path d="M${i * 160},0 q40,90 0,500" stroke="#5a1018" stroke-width="6" fill="none" stroke-opacity=".5"/>`).join('') +
      `<rect x="160" y="160" width="960" height="340" fill="#1a0c10"/><ellipse cx="640" cy="480" rx="300" ry="40" fill="#ffd98a" fill-opacity=".25"/>` +
      [...Array(7)].map((_, i) => `<g transform="translate(${260 + i * 125},260)"><path d="M-16,-50 v10 M16,-50 v10" stroke="#8a6a4a" stroke-width="2"/><path d="M-26,-40 h52 v70 h-52 Z" fill="${['#b02030', '#2c3e6a', '#e8c46a', '#3a6a4a'][i % 4]}"/><circle cy="-46" r="10" fill="#e8d6c0"/></g>`).join('');
  } else if (I.shelf === 'church') {
    
    
    const glass = ['#c0392b', '#2c5aa0', '#e8b84a', '#3a8a5a', '#7a3e8a'];
    back = `<rect width="1280" height="520" fill="${wall}"/><rect width="1280" height="520" fill="url(#ti-wallshade)"/>` +
      [340, 640, 940].map((x, w) => `<path d="M${x - 70},470 V120 a70,70 0 0 1 140,0 V470 Z" fill="#2a2a3a" stroke="#9a8a7a" stroke-width="10"/>` +
        [...Array(6)].map((_, r) => [0, 1, 2].map((c) => `<rect x="${x - 62 + c * 42}" y="${126 + r * 57}" width="38" height="52" fill="${glass[(r + c + w) % 5]}" fill-opacity=".75"/>`).join('')).join('') +
        `<path d="M${x},60 V470 M${x - 70},300 H${x + 70}" stroke="#9a8a7a" stroke-width="5"/>`).join('') +
      `<rect x="520" y="430" width="240" height="90" fill="#f4efe2" stroke="#b8a888" stroke-width="4"/><path d="M640,396 v34 M626,408 h28" stroke="#c7a04a" stroke-width="6"/>` +
      [560, 720].map((x) => `<path d="M${x - 16},430 h32 l-6,-40 h-20 Z" fill="#8a6a4a"/>` + [-18, -8, 2, 12, 22].map((dx, i) => `<path d="M${x},392 q${dx * 0.5},-30 ${dx},-${50 + (i % 2) * 14}" stroke="#4a7a3a" stroke-width="3" fill="none"/><ellipse cx="${x + dx}" cy="${338 - (i % 2) * 14}" rx="9" ry="14" fill="#fbf6ea"/>`).join('')).join('');
  } else if (I.shelf === 'laundry') {
    back = [...Array(4)].map((_, r) => `<path d="M0,${90 + r * 70} Q640,${130 + r * 70} 1280,${90 + r * 70}" stroke="#6b5a4a" stroke-width="2" fill="none"/>` + [...Array(12)].map((_, i) => `<rect class="tm-flap" x="${40 + i * 104}" y="${96 + r * 70 + Math.sin(i / 11 * Math.PI) * 30}" width="60" height="44" fill="${['#f4f4ee', '#cfe0ea', '#f4d8d8', '#e8f0d8'][(i + r) % 4]}"/>`).join('')).join('') +
      `<g class="tm-steam">${[200, 520, 900, 1120].map((x) => `<circle cx="${x}" cy="460" r="60" fill="#fff" fill-opacity=".25"/>`).join('')}</g>`;
  } else if (I.shelf === 'fish') {
    back = `<rect width="1280" height="420" fill="#a9c3cc"/><rect y="300" width="1280" height="160" fill="#4f8aa0"/>` + [...Array(10)].map((_, i) => `<path class="tm-wave" d="M${i * 130},${340 + (i % 3) * 30} q20,-8 40,0 t40,0" stroke="#d9ecf0" stroke-width="3" fill="none"/>`).join('') +
      `<path d="M0,0 H1280 V90 L1180,130 L1080,90 L980,130 L880,90 L780,130 L680,90 L580,130 L480,90 L380,130 L280,90 L180,130 L80,90 L0,120 Z" fill="#2d6a8a"/>`;
  } else {
    const shelves = [150, 280].map((y) => `<rect x="80" y="${y + 90}" width="1120" height="12" fill="${shade(wall, -0.5)}"/>` + [...Array(6)].map((_, i) => display(I.shelf, 110 + i * 182, y, 150, 88)).join('')).join('');
    back = `<rect width="1280" height="520" fill="${wall}"/><rect width="1280" height="520" fill="url(#ti-wallshade)"/>${shelves}` +
      `<rect x="1060" y="40" width="160" height="96" rx="6" fill="#bfe0ee" stroke="${shade(wall, -0.45)}" stroke-width="10"/><path d="M1140,40 v96 M1060,88 h160" stroke="${shade(wall, -0.45)}" stroke-width="5"/>`;
  }
  const pews = I.shelf === 'church' ? `<path d="M560,720 L610,520 H670 L720,720 Z" fill="#f4efe2" fill-opacity=".85"/>` +
    [0, 1, 2, 3].map((r) => [-1, 1].map((s) => { const y = 540 + r * 46, x = s < 0 ? 40 : 700 + r * 14; return `<rect x="${s < 0 ? x + r * 14 : x}" y="${y}" width="${540 - r * 14}" height="18" fill="#5a3a2a"/><rect x="${s < 0 ? x + r * 14 : x}" y="${y + 18}" width="${540 - r * 14}" height="10" fill="#3a2618"/>`; }).join('')).join('') : '';
  const counter = I.shelf === 'opera' || I.shelf === 'church' ? pews : `<rect x="0" y="560" width="1280" height="40" fill="${shade(I.floor, 0.15)}"/><rect x="0" y="600" width="1280" height="120" fill="${shade(I.floor, -0.15)}"/><path d="M0,600 H1280" stroke="${shade(I.floor, -0.45)}" stroke-width="4"/>` +
    [...Array(8)].map((_, i) => `<rect x="${20 + i * 160}" y="616" width="130" height="90" rx="4" fill="none" stroke="${shade(I.floor, -0.35)}" stroke-width="3"/>`).join('');
  return `<svg class="interior" viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="ti-wallshade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".15"/><stop offset=".5" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient></defs>` +
    `<rect width="1280" height="720" fill="${I.floor}"/>${back}<rect y="520" width="1280" height="200" fill="${I.floor}"/>` +
    [...Array(6)].map((_, i) => `<path d="M0,${540 + i * 32} H1280" stroke="${shade(I.floor, -0.25)}" stroke-width="2"/>`).join('') + counter + `</svg>`;
}
