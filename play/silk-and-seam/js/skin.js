







const svg = (w, h, body, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>`;
const grad = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</linearGradient>`;
const rivet = (x, y, r = 2.6) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#6b4a1c"/><circle cx="${x - 0.5}" cy="${y - 0.6}" r="${r * 0.7}" fill="#e9c877"/><circle cx="${x - 0.9}" cy="${y - 1}" r="${r * 0.28}" fill="#fff8dc"/>`;
const grain = (w, ys, c = '#2a1608', a = 0.22) => ys.map((y, i) => `<path d="M4,${y} C${w * 0.3},${y - 2 + (i % 2) * 4} ${w * 0.6},${y + 3 - (i % 2) * 5} ${w - 4},${y - 1}" fill="none" stroke="${c}" stroke-opacity="${a}" stroke-width="${i % 2 ? 0.8 : 1.3}"/>`).join('');

export const SKIN = {
  
  btn: svg(120, 60,
    `<rect x="1" y="4" width="118" height="55" rx="11" fill="#1e1209"/>` +
    `<rect x="1" y="1" width="118" height="54" rx="11" fill="url(#w)" stroke="#2e1c0f" stroke-width="2"/>` +
    grain(120, [14, 22, 31, 40, 47]) +
    `<rect x="6" y="6" width="108" height="44" rx="7" fill="none" stroke="#d9b35a" stroke-width="1.6" stroke-opacity=".85"/>` +
    `<path d="M10,4.5 H110" stroke="#fff" stroke-opacity=".28" stroke-width="1.5"/>` +
    rivet(12, 12) + rivet(108, 12) + rivet(12, 44) + rivet(108, 44),
    grad('w', [[0, '#a2714a'], [0.45, '#7c5033'], [1, '#553420']])),
  
  gold: svg(120, 60,
    `<rect x="1" y="4" width="118" height="55" rx="9" fill="#4a3210"/>` +
    `<rect x="1" y="1" width="118" height="54" rx="9" fill="url(#b)" stroke="#6b4a14" stroke-width="2"/>` +
    `<rect x="6" y="6" width="108" height="44" rx="6" fill="none" stroke="#7a5518" stroke-width="1.3"/>` +
    `<rect x="7.5" y="7.5" width="105" height="41" rx="5" fill="none" stroke="#fff4c8" stroke-opacity=".55" stroke-width=".8"/>` +
    `<path d="M8,3.5 H112" stroke="#fffbe6" stroke-opacity=".7" stroke-width="1.6"/>` +
    rivet(12, 12, 2.2) + rivet(108, 12, 2.2) + rivet(12, 44, 2.2) + rivet(108, 44, 2.2),
    grad('b', [[0, '#fbe7a4'], [0.35, '#e0bd62'], [0.7, '#c29a42'], [1, '#9a7428']])),
  
  linen: svg(80, 44,
    `<rect x="1" y="2" width="78" height="41" rx="6" fill="#7a5c40" fill-opacity=".35"/>` +
    `<rect x="1" y="1" width="78" height="40" rx="6" fill="url(#l)" stroke="#a68a64" stroke-width="1.4"/>` +
    `<rect x="5" y="5" width="70" height="32" rx="3" fill="none" stroke="#7a5c48" stroke-width="1.1" stroke-dasharray="4 3"/>`,
    grad('l', [[0, '#fbf3e2'], [1, '#e9dbbf']]) +
    `<pattern id="t" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0,4 L4,0" stroke="#b9a07e" stroke-opacity=".25" stroke-width=".6"/></pattern>`)
    .replace('</svg>', '<rect x="2" y="2" width="76" height="38" rx="5" fill="url(#t)"/></svg>'),
  
  chip: svg(64, 30,
    `<rect x="1" y="2" width="62" height="27" rx="13" fill="#6b4a33" fill-opacity=".25"/>` +
    `<rect x="1" y="1" width="62" height="27" rx="13" fill="#fbf4e4" stroke="#bfa47e" stroke-width="1.2"/>` +
    `<rect x="4" y="4" width="56" height="21" rx="10" fill="none" stroke="#a88b67" stroke-width=".9" stroke-dasharray="3 2.5"/>`),
  chipOn: svg(64, 30,
    `<rect x="1" y="2" width="62" height="27" rx="13" fill="#2a0c10" fill-opacity=".5"/>` +
    `<rect x="1" y="1" width="62" height="27" rx="13" fill="url(#r)" stroke="#4a1418" stroke-width="1.2"/>` +
    `<rect x="4" y="4" width="56" height="21" rx="10" fill="none" stroke="#f0c96a" stroke-width="1" stroke-dasharray="3 2.5"/>` +
    `<path d="M10,4.5 H54" stroke="#fff" stroke-opacity=".35" stroke-width="1.2"/>`,
    grad('r', [[0, '#a33a48'], [0.5, '#7a2632'], [1, '#5a1a24']])),
  
  chipDone: svg(64, 30,
    `<rect x="1" y="1" width="62" height="27" rx="13" fill="url(#g)" stroke="#23502f" stroke-width="1.2"/>` +
    `<rect x="4" y="4" width="56" height="21" rx="10" fill="none" stroke="#dff5d0" stroke-opacity=".8" stroke-width=".9" stroke-dasharray="3 2.5"/>`,
    grad('g', [[0, '#7cc08e'], [1, '#3c7a4e']])),
  chipNow: svg(64, 30,
    `<rect x="1" y="1" width="62" height="27" rx="13" fill="url(#n)" stroke="#7a5518" stroke-width="1.2"/>` +
    `<rect x="4" y="4" width="56" height="21" rx="10" fill="none" stroke="#fff4c8" stroke-width=".9" stroke-dasharray="3 2.5"/>`,
    grad('n', [[0, '#fbe7a4'], [1, '#d2a84c']])),
  
  plaque: svg(300, 110,
    `<rect x="2" y="6" width="296" height="103" rx="10" fill="#140b05" fill-opacity=".6"/>` +
    `<rect x="2" y="2" width="296" height="102" rx="10" fill="url(#pb)" stroke="#6b4a14" stroke-width="3"/>` +
    `<rect x="9" y="9" width="282" height="88" rx="6" fill="url(#pw)"/>` +
    grain(300, [22, 34, 48, 60, 74, 86], '#1a0c04', 0.25) +
    `<rect x="9" y="9" width="282" height="88" rx="6" fill="none" stroke="#2a1608" stroke-width="2"/>` +
    `<path d="M14,13 H286" stroke="#fff" stroke-opacity=".18" stroke-width="2"/>` +
    rivet(20, 20, 3.4) + rivet(280, 20, 3.4),
    grad('pb', [[0, '#f3d98c'], [0.5, '#c9a24a'], [1, '#8a6420']], 1, 1) + grad('pw', [[0, '#8e5e3a'], [0.5, '#6e4428'], [1, '#4f2f1a']])),
  
  frame: svg(160, 160,
    `<rect x="0" y="0" width="160" height="160" rx="6" fill="url(#fg)"/>` +
    `<rect x="7" y="7" width="146" height="146" rx="3" fill="none" stroke="#6b4a14" stroke-width="2"/>` +
    `<rect x="11" y="11" width="138" height="138" fill="none" stroke="#fff4c8" stroke-opacity=".6" stroke-width="1"/>` +
    [[20, 20, 0], [140, 20, 90], [140, 140, 180], [20, 140, 270]].map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-6,6 C-6,-2 -2,-6 6,-6 M-2,10 C-2,2 2,-2 10,-2" fill="none" stroke="#7a5518" stroke-width="1.6"/><circle cx="-6" cy="-6" r="2.4" fill="#fff4c8" fill-opacity=".8"/></g>`).join('') +
    `<rect x="26" y="26" width="108" height="108" fill="url(#pa)"/>` +
    `<rect x="26" y="26" width="108" height="108" fill="none" stroke="#8a6420" stroke-width="1.5"/>`,
    grad('fg', [[0, '#f6de94'], [0.3, '#c9a24a'], [0.55, '#e8c872'], [1, '#8a6420']], 1, 1) + grad('pa', [[0, '#f8efdc'], [1, '#efe1c6']])),
  
  card: svg(100, 100,
    `<rect x="1" y="3" width="98" height="96" rx="5" fill="#2a1a10" fill-opacity=".35"/>` +
    `<rect x="1" y="1" width="98" height="96" rx="5" fill="url(#c)" stroke="#b99c78" stroke-width="1.2"/>` +
    `<rect x="7" y="7" width="86" height="84" rx="2" fill="none" stroke="#b99c78" stroke-width="1" stroke-dasharray="5 3"/>` +
    [[9, 9], [91, 9], [9, 89], [91, 89]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#a88b67"/>`).join(''),
    grad('c', [[0, '#fbf5ea'], [1, '#f1e4cb']])),
  
  beam: svg(200, 56,
    `<rect width="200" height="56" fill="url(#hb)"/>` + grain(200, [10, 18, 27, 36, 44], '#1a0c04', 0.3) +
    `<rect y="50" width="200" height="6" fill="url(#hr)"/><path d="M0,50.5 H200" stroke="#fff4c8" stroke-opacity=".6"/>` +
    rivet(100, 53, 1.8),
    grad('hb', [[0, '#6e4a30'], [1, '#3f2a1c']]) + grad('hr', [[0, '#f3d98c'], [1, '#8a6420']])),
  
  tape: svg(40, 12,
    `<rect width="40" height="12" fill="#f0d980"/><rect width="40" height="1" fill="#fff6c4"/><rect y="11" width="40" height="1" fill="#a88a2c"/>` +
    [0, 4, 8, 12, 16, 20, 24, 28, 32, 36].map((x, i) => `<path d="M${x + 0.5},0 V${i % 5 === 0 ? 7 : 3.5}" stroke="#3a2a10" stroke-width="${i % 5 === 0 ? 0.9 : 0.6}"/>`).join('')),
  
  ribbon: svg(160, 44,
    `<path d="M0,6 H160 L148,22 L160,38 H0 L12,22 Z" fill="#3a0e14" fill-opacity=".4" transform="translate(0 3)"/>` +
    `<path d="M0,4 H160 L148,21 L160,38 H0 L12,21 Z" fill="url(#rb)" stroke="#4a1418" stroke-width="1.2"/>` +
    `<path d="M16,9 H144 M16,33 H144" stroke="#f0c96a" stroke-width="1" stroke-dasharray="4 3"/>`,
    grad('rb', [[0, '#b04656'], [0.5, '#7a2632'], [1, '#5a1a24']])),
  ribbonGood: svg(160, 44,
    `<path d="M0,4 H160 L148,21 L160,38 H0 L12,21 Z" fill="url(#rg)" stroke="#1d3d24" stroke-width="1.2"/>` +
    `<path d="M16,9 H144 M16,33 H144" stroke="#f0c96a" stroke-width="1" stroke-dasharray="4 3"/>`,
    grad('rg', [[0, '#5a9a6a'], [1, '#25502f']])),
  
  tag: svg(120, 44,
    `<path d="M18,1 H117 Q119,1 119,3 V41 Q119,43 117,43 H18 L2,26 V18 Z" fill="#a8906a" fill-opacity=".35" transform="translate(0 1.5)"/>` +
    `<path d="M18,1 H117 Q119,1 119,3 V41 Q119,43 117,43 H18 L2,26 V18 Z" fill="url(#tg)" stroke="#b99c78" stroke-width="1.3"/>` +
    `<circle cx="13" cy="22" r="4.2" fill="#6b4a33"/><circle cx="13" cy="22" r="5.4" fill="none" stroke="#c9a24a" stroke-width="1.6"/>`,
    grad('tg', [[0, '#fffaf0'], [1, '#f1e4cb']])),
  
  arrowL: svg(34, 34, `<path d="M26,4 L6,17 L26,30 L21,17 Z" fill="url(#a)" stroke="#6b4a14" stroke-width="1.5" stroke-linejoin="round"/><path d="M24,7 L10,17" stroke="#fff8dc" stroke-opacity=".7" stroke-width="1.2"/>`, grad('a', [[0, '#fbe7a4'], [1, '#a47a2c']])),
  arrowR: svg(34, 34, `<path d="M8,4 L28,17 L8,30 L13,17 Z" fill="url(#a)" stroke="#6b4a14" stroke-width="1.5" stroke-linejoin="round"/><path d="M10,7 L24,17" stroke="#fff8dc" stroke-opacity=".7" stroke-width="1.2"/>`, grad('a', [[0, '#fbe7a4'], [1, '#a47a2c']])),
  
  tab: svg(90, 44, `<path d="M1,43 V10 Q1,1 10,1 H80 Q89,1 89,10 V43" fill="url(#tb)" stroke="#6b4a33" stroke-width="1.6"/><path d="M6,43 V11 Q6,6 11,6 H79 Q84,6 84,11 V43" fill="none" stroke="#8a6a50" stroke-width="1" stroke-dasharray="4 3"/>`, grad('tb', [[0, '#e2cfa6'], [1, '#cdb58b']])),
  tabOn: svg(90, 44, `<path d="M1,44 V10 Q1,1 10,1 H80 Q89,1 89,10 V44" fill="url(#to)" stroke="#6b4a33" stroke-width="1.6"/><path d="M6,44 V11 Q6,6 11,6 H79 Q84,6 84,11 V44" fill="none" stroke="#c9a24a" stroke-width="1.1" stroke-dasharray="4 3"/>`, grad('to', [[0, '#fbf5ea'], [1, '#f4ead9']])),
  
  thimble: svg(26, 30, `<path d="M4,28 V12 Q4,2 13,2 Q22,2 22,12 V28 Z" fill="url(#th)" stroke="#5a5a62" stroke-width="1.2"/>` +
    [8, 12, 16, 20].map((y) => [7, 11, 15, 19].map((x) => `<circle cx="${x + (y % 8 ? 2 : 0)}" cy="${y}" r=".9" fill="#6a6a74"/>`).join('')).join('') +
    `<rect x="3" y="24" width="20" height="5" rx="1.5" fill="#c9a24a" stroke="#7a5518" stroke-width=".8"/><path d="M7,5 Q9,3 12,3" stroke="#fff" stroke-opacity=".8" stroke-width="1.4" fill="none"/>`,
    grad('th', [[0, '#f4f4f8'], [0.5, '#c8c8d2'], [1, '#8a8a96']], 1, 0)),
  
  track: svg(40, 10, `<rect y="1" width="40" height="8" fill="url(#st)"/><path d="M0,5 H40" stroke="#f0c96a" stroke-width=".8" stroke-dasharray="3 2"/>`, grad('st', [[0, '#8a3a44'], [1, '#5a1a24']])),
};


export const skinUrl = (s) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
export function installSkin(root = document.documentElement) {
  for (const [k, v] of Object.entries(SKIN)) root.style.setProperty(`--sk-${k}`, skinUrl(v));
  root.classList.add('skinned');
}
