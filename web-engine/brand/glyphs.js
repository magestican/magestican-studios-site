

























export const GLYPHS = Object.freeze({
  
  'team-bonding': 'M19 12a7 7 0 1 1-14 0a7 7 0 1 1 14 0M12 2v5M12 17v5M2 12h5M17 12h5M12 12h.01',
  
  'farmy-uprising': 'M12 22V9M7 3v4a5 5 0 0 0 10 0V3M12 3v6',
  
  'farmy-evil-hills': 'M12 2v2M9 4h6M8 7h8v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2zM12 11v4M10 22h4',
  
  farmykart: 'M20 12a8 8 0 1 1-16 0a8 8 0 1 1 16 0M14 12a2 2 0 1 1-4 0a2 2 0 1 1 4 0M12 4v6M12 14v6M4 12h6M14 12h6',
  
  'farmy-scrabble': 'M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM8.5 17L12 7l3.5 10M9.7 13.5h4.6',
  
  'farmy-crosswords': 'M4 4h16v16H4zM4 9.33h16M4 14.67h16M9.33 4v16M14.67 4v16',
  
  'farmy-chess': 'M6 21h12M8 21c0-3 1-5 3.5-7l-3.5 1-2.5-2.5 4.5-6c2-2 5.5-1.5 7 1 1.2 2 1.5 5 1.5 8v5.5M12.5 8.5h.01',
  
  'farmy-checkers': 'M19 9a7 3 0 1 1-14 0a7 3 0 1 1 14 0M5 9v4M19 9v4M5 13a7 3 0 0 0 14 0M5 13v4M19 13v4M5 17a7 3 0 0 0 14 0',
  
  'farmy-ludo': 'M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01',
  
  '2d-fighter-ex': 'M13 2L5 13h6l-1 9 8-11h-6z',
  
  'farmy-moon-life': 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  
  'silk-and-seam': 'M4 20L15.5 8.5M19.5 4.5a1.8 1.8 0 1 1-2.5 2.5a1.8 1.8 0 1 1 2.5-2.5M19 6c3 3-5 5-3 9s5 3 3 7',
  
  dachis: 'M12 5l6 2.5v4.5c0 4.5-3 7-6 8.5-3-1.5-6-4-6-8.5V7.5zM12 2v17M9 14h6',
  
  'farmy-five': 'M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM14.5 7.5h-5l-.5 4.5c1.5-1 5-1 5 2.25S10.5 18 9 16.5',
  
  'farmy-hive': 'M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9zM12 8.5l3 1.75v3.5L12 15.5l-3-1.75v-3.5z',
  
  'farmy-herds': 'M6.5 16a3 3 0 0 1-.5-6 3.2 3.2 0 0 1 5-2.5 3.2 3.2 0 0 1 5 1.5 3 3 0 0 1 0 7zM9 16v4M14 16v4M16.5 9l3.5-1 1 3-2.5 1.5M20 9.5h.01',
  
  'farmy-furrows': 'M3 8c3-2 6 2 9 0s6-2 9 0M3 13c3-2 6 2 9 0s6-2 9 0M3 18c3-2 6 2 9 0s6-2 9 0',
  
  zelakas: 'M7 4h10l4 6-9 11-9-11zM3 10h18M9.5 4L12 10l2.5-6M12 10v11',
  
  level: 'M5 13l7-6 7 6M5 19l7-6 7 6M12 3h.01',
  
  badge: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5l-5.4 3 1.2-6L3.3 9.3l6.1-.7z',
});


export const hasGlyph = (name) => typeof name === 'string'
  && Object.prototype.hasOwnProperty.call(GLYPHS, name);







export function glyphNameFor(row) {
  const r = row && typeof row === 'object' ? row : {};
  if (r.game && r.game !== 'all' && hasGlyph(r.game)) return r.game;
  if (r.stat === 'xp' || r.stat === 'level') return 'level';
  return 'badge';
}





export function glyphGroup(name, { cx = 12, cy = 12, box = 24, ink = 'currentColor', opacity = null } = {}) {
  if (!hasGlyph(name)) return '';
  const k = Number(box) / 24;
  const op = opacity === null ? '' : ` opacity="${opacity}"`;
  return `<g data-glyph="${name}" transform="translate(${cx} ${cy}) scale(${k.toFixed(3)}) translate(-12 -12)" `
    + `fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${op}>`
    + `<path d="${GLYPHS[name]}"/></g>`;
}
