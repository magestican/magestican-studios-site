

























































export const PROP_CATALOGUE = Object.freeze({
  boulder: { role: 'point', footprint: 1.9, draw: 2.8 },
  cypress: { role: 'point', footprint: 1.9, draw: 2.8 },
  deadGum: { role: 'point', footprint: 2.6, draw: 2.8 },
  fence: { role: 'line', footprint: 4.6, draw: 2 },
  gate: { role: 'line', footprint: 2.4, draw: 2.2 },
  gum: { role: 'point', footprint: 3, draw: 2.8 },
  gumOld: { role: 'point', footprint: 4.4, draw: 2.8 },
  gumYoung: { role: 'point', footprint: 1.7, draw: 2.8 },
  haystack: { role: 'line', footprint: 2.8, draw: 2.4 },
  hedge: { role: 'line', footprint: 4.2, draw: 2 },
  hedgeLow: { role: 'line', footprint: 4, draw: 2 },
  ironbark: { role: 'point', footprint: 3.4, draw: 2.8 },
  logPile: { role: 'line', footprint: 2.4, draw: 2.2 },
  reeds: { role: 'point', footprint: 1.6, draw: 2.8 },
  rockPile: { role: 'point', footprint: 3, draw: 2.8 },
  saltbush: { role: 'point', footprint: 1.5, draw: 2.8 },
  shed: { role: 'line', footprint: 4.6, draw: 2.4 },
  shedRust: { role: 'line', footprint: 3.6, draw: 2.4 },
  silo: { role: 'mark', footprint: 2.4, draw: 3 },
  stump: { role: 'point', footprint: 1.3, draw: 2.8 },
  tank: { role: 'point', footprint: 2.3, draw: 2.4 },
  trough: { role: 'line', footprint: 2.6, draw: 2.2 },
  wattle: { role: 'point', footprint: 1.9, draw: 2.8 },
  windmill: { role: 'mark', footprint: 2.6, draw: 3 },
});


export const PROP_IDS = Object.freeze(Object.keys(PROP_CATALOGUE).sort());

export const LINE_PROPS = Object.freeze(
  PROP_IDS.filter((id) => PROP_CATALOGUE[id].role === 'line'),
);
export const POINT_PROPS = Object.freeze(
  PROP_IDS.filter((id) => PROP_CATALOGUE[id].role === 'point'),
);
export const MARK_PROPS = Object.freeze(
  PROP_IDS.filter((id) => PROP_CATALOGUE[id].role === 'mark'),
);





export const PROP_DRAW_SCALE = 2.8;


export const propDraw = (id) => {
  const p = PROP_CATALOGUE[id];
  return p === undefined ? PROP_DRAW_SCALE : p.draw;
};
