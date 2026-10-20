























































import { levelBuilder } from './dsl.js';


const HARPS = 2; 
const O6 = 1; 
const SLANTS = 2; 
const STACK = 2; 
const A5 = 1; 

const Y = (y) => y + (y >= 100 ? 8.5 * STACK : 0) + (y >= 164 ? 10 * SLANTS : 0) + (y >= 262 ? 9.5 * HARPS : 0) + (y >= 300 ? 8.5 * O6 : 0);
const TOP = Y(324);


const R6 = Y(200) + 3;

export function buildL15() {
  const L = levelBuilder({ id: 15, name: 'Silk Span', pitCost: 'heart', fallReturn: 24, sky: 'nightToDawn', height: TOP + 16 });
  const ids = {};
  const tag = (name, e) => {
    ids[name] = e.id;
    e.tag = name;
    return e;
  };
  
  L.wall(0, 4, 0, Y(318)).wall(60, 64, 0, Y(318)).wall(4, 60, 0, 8);
  L.wall(0, 26, Y(318), TOP).wall(38, 64, Y(318), TOP);
  
  
  
  L.slick(0, 4, 0, Y(108)).slick(0, 4, Y(142), Y(318));
  L.slick(60, 64, 0, 25)
    .slick(60, 64, 50, R6 + 2)
    .slick(60, 64, Y(236), Y(318));
  L.slick(54, 60, 76, Y(106));

  
  const kit = [
    ['double', 'Thruster coil'],
    ['pound', 'Pound plates'],
    ['dash', 'Dash spring'],
    ['glide', 'Broad leaf'],
    ['wall', 'Wax grips'],
    ['tether', 'Paperclip hook'],
    ['lantern', 'Firefly Lantern'],
  ];
  kit.forEach(([grant, name], i) => {
    L.putAt('ability', 5.5 + 0.5 * i, 36, { grant, name });
  });

  
  L.wall(4, 14, 32, 36).spawnAt(5, 36);
  L.web(6, 14, 58, 14, { id: 'W1', net: true });
  L.putAt('bandit', 21, 14, { sleeping: true, motif: 'sling', use: 'M1' });
  L.putAt('bandit', 23.5, 14, { sleeping: true, motif: 'sling', use: 'M1' });
  L.ledge(4, 9, 11.5).carve(1, 4, 8, 11).ivy(3.5, 4, 8, 11, { skin: 'silk' });
  L.putAt('intel', 2.5, 8, {
    secret: 'cache',
    name: 'A Vast wristwatch, still ticking',
    signals: ['visual:gold-glint', 'audio:watch-tick'],
    seenFrom: 'the net W1, looking down through the silk',
  });
  L.landmarkAt('Moonflower', 8, 36, 'back');
  L.landmarkAt('Catch net', 32, 14, 'back');

  
  L.ledge(52, 60, 22.5);

  
  L.wall(56.5, 57.5, 25, 50).ledge(44, 60, 50);
  L.web(8, 50, 44, 50, { id: 'W2' });
  L.ledge(4, 8, 50).ledge(4, 9, 54.5).ledge(10, 15, 59).ledge(4, 9, 63.5).ledge(4, 26, 68);
  L.landmarkAt('Root chimney', 58, 38, 'back');
  L.landmarkAt('First bridge', 26, 50, 'back');

  
  L.web(14, 62, 54, 62, { id: 'W3' });
  for (const x of [30.5, 32.5, 34.5]) L.putAt('bandit', x, 62, { awake: true, wake: 6, facing: -1, motif: 'sling', use: 'M2' });
  L.wall(54, 60, 76, Y(106)).ledge(52, 60, 70.5);
  L.beaconAt(56, 70.5);
  L.landmarkAt('Overhang cave', 57, 73, 'back');

  
  L.web(34, 72, 46, 72, { id: 'W4' });
  L.web(22, 80.5, 36, 80.5, { id: 'W5' });
  L.web(34, 89, 46, 89, { id: 'W6' });
  L.web(22, 97.5, 36, 97.5, { id: 'W7' });
  for (const w of extraStack()) L.web(w.x0, w.y, w.x0 + (w.x0 === 34 ? 12 : 14), w.y, { id: w.id });

  
  L.web(8, Y(106), 56, Y(106), { id: 'SPAN' });
  tag('A1', L.putAt('aunt', 20, Y(122), { drop: { to: Y(107.5), trigger: 16 }, demo: true }));
  L.landmarkAt('The Silk Span', 32, Y(106), 'back');

  
  L.putAt('bandit', 13, Y(106), { sleeping: true, motif: 'sling', use: 'M3' });
  L.putAt('bandit', 15.5, Y(106), { sleeping: true, motif: 'sling', use: 'M3' });
  tag('A2', L.putAt('aunt', 11, Y(124), { hang: Y(112), motif: 'sling', use: 'M3' }));
  L.ledge(4, 8, Y(106)).wall(6.5, 7.5, Y(108), Y(142)).ledge(4, 20, Y(142));
  L.beaconAt(8, Y(142));
  L.landmarkAt('The larder', 10, Y(116), 'back');

  
  L.ledge(4, 40, Y(142));
  tag('A3', L.putAt('aunt', 21, Y(160), { drop: { to: Y(143.5), trigger: 16 } }));
  if (A5) tag('A5', L.putAt('aunt', 29.5, Y(160), { drop: { to: Y(143.5), trigger: 16 } }));
  tag('A4', L.putAt('aunt', 38, Y(160), { drop: { to: Y(143.5), trigger: 16 } }));
  L.landmarkAt('Root gallery', 22, Y(142), 'back');

  
  L.ledge(40, 48, Y(138));
  L.web(40, Y(139.5), 48, Y(143.5), { id: 'SL1', slant: true });
  L.ledge(24, 36, Y(148));
  L.web(10, Y(153), 18, Y(149), { id: 'SL2', slant: true });
  L.web(22, Y(153), 30, Y(157), { id: 'SL3', slant: true });
  L.web(12, Y(162), 20, Y(158), { id: 'SL4', slant: true });
  for (const [e, w] of slantPairs()) {
    L.web(22, e.b, 30, e.b + 4, { id: e.id, slant: true });
    L.web(12, w.b + 4, 20, w.b, { id: w.id, slant: true });
  }
  L.ledge(28, 48, Y(166));
  L.landmarkAt('The slants', 30, Y(152), 'back');

  
  L.web(10, Y(166), 28, Y(166), { id: 'W10' });
  for (const x of [17, 19, 21.5, 23.5])
    L.putAt('bandit', x, Y(166), { awake: true, wake: 4, wakeY: 2, wakeGrounded: true, facing: 1, motif: 'sling', use: 'M4' });
  L.putAt('aunt', 17.5, Y(166), { sitting: true, motif: 'sling', use: 'M4' });
  L.putAt('aunt', 20, Y(166), { sitting: true, motif: 'sling', use: 'M4' });
  L.ledge(4, 20, Y(176));
  L.beaconAt(8, Y(176));

  
  L.ledge(4, 9, Y(180.5)).ledge(10, 15, Y(185)).ledge(4, 9, Y(189.5)).ledge(10, 15, Y(194));
  L.ledge(4, 16, Y(198.5)).ledge(24, 30, Y(198.5));
  L.web(16, Y(197), 24, Y(197), { id: 'WS' });
  L.web(14, Y(204), 22, Y(204), { id: 'WD' });
  L.ledge(16, 20, Y(216));
  L.putAt('intel', 18, Y(216), {
    secret: 'deed',
    name: 'A Vast paper plane',
    signals: ['visual:gold-glint', 'audio:glint-chime'],
    seenFrom: 'the K1 swing up-arc',
  });
  L.landmarkAt('Dawn shelf', 16, Y(198.5), 'back');

  
  tag('K1', L.putAt('hook', 36, Y(207.5), { name: 'a Vast keyring', required: true }));
  tag('K2', L.putAt('hook', 47, Y(208), { name: 'a cat collar bell', required: true }));
  L.web(38, Y(211), 46, Y(211), { id: 'WG' });
  L.putAt('goldAunt', 42, Y(211), {
    specimen: true,
    name: 'Golden Silk Aunt',
    signals: ['visual:golden-shimmer', 'audio:harp-twang'],
    seenFrom: 'the K1 swing, 3 u above its top',
    signalRange: 12,
  });
  L.ledge(56, 60, R6)
    .wall(56.5, 57.5, R6 + 2, Y(236))
    .ledge(44, 60, Y(236));
  L.beaconAt(56, Y(236));
  L.landmarkAt('Keyring and bell', 41, Y(208), 'back');

  
  L.harp({ id: 'HARP', aunt: [8, Y(262)], every: 1.6, amp: 1.0 });
  L.web(28, Y(240), 42, Y(240), { id: 'H1', harp: 'HARP' });
  L.web(14, Y(249.5), 28, Y(249.5), { id: 'H2', harp: 'HARP', phase: 0.53 });
  L.web(28, Y(259), 42, Y(259), { id: 'H3', harp: 'HARP', phase: 1.07 });
  for (const h of extraStrands()) L.web(h.x0, h.y, h.x0 + 14, h.y, { id: h.id, harp: 'HARP', phase: h.phase });
  tag('A6', L.putAt('aunt', 8, Y(262), { plucks: 'HARP' }));

  
  const ORB = ['O1', 'O2L', 'O2R', 'O3', 'O4', ...(O6 ? ['O6'] : []), 'O5', 'HUB'];
  L.hub({ id: 'ORB', webs: ORB });
  L.web(14, Y(268.5), 50, Y(268.5), { id: 'O1', orb: 'ORB' });
  L.web(16, Y(281), 30, Y(277), { id: 'O2L', orb: 'ORB', slant: true }); 
  L.web(34, Y(277), 48, Y(281), { id: 'O2R', orb: 'ORB', slant: true });
  L.web(20, Y(285.5), 44, Y(285.5), { id: 'O3', orb: 'ORB' });
  L.web(22, Y(294), 42, Y(294), { id: 'O4', orb: 'ORB' });
  if (O6) L.web(24, Y(294) + 8.5, 40, Y(294) + 8.5, { id: 'O6', orb: 'ORB' });
  L.web(26, Y(302.5), 38, Y(302.5), { id: 'O5', orb: 'ORB' });
  tag('A7', L.putAt('aunt', 38, Y(318), { drop: { to: Y(283), trigger: 9 } })); 
  tag('A8', L.putAt('aunt', 34, Y(318), { drop: { to: Y(291), trigger: 9 } }));
  if (O6) tag('A10', L.putAt('aunt', 30, Y(318), { drop: { to: Y(294) + 6.5, trigger: 9 } }));
  tag('A9', L.putAt('aunt', 28, Y(318), { drop: { to: Y(300), trigger: 9 } }));
  L.landmarkAt('The great orb', 32, Y(290), 'back');

  
  L.web(28, Y(311), 36, Y(311), { id: 'HUB', orb: 'ORB', hub: true });
  for (const x of [28.5, 30.5, 33.5, 35.5]) L.putAt('aunt', x, Y(311), { sitting: true, family: true, motif: 'sling', use: 'M5' });
  L.putAt('finish', 44, TOP, { axis: 'y', name: 'The orchard rim' });
  L.landmarkAt('Orchard rim', 48, TOP, 'back');

  const level = L.build();
  level.waypoints = route(ids);
  level.slingTags = ids;
  
  
  
  const B = (name, from, goal, extra = {}) => ({ name, from, goal, ...extra });
  level.webBeats = [
    B('W1 -> R1 (the pump taught)', { x: 46, y: 14 }, { x0: 52, y: 22.5, dir: 1 }, { corner: true }),
    B('W3 -> R2', { x: 46, y: 62 }, { x0: 52, y: 70.5, dir: 1 }),
    B('W4 -> W5', { x: 40, y: 72 }, { x0: 36, y: 80.5, dir: -1 }),
    B('W5 -> W6', { x: 30, y: 80.5 }, { x0: 34, y: 89, dir: 1 }),
    B('W6 -> W7', { x: 40, y: 89 }, { x0: 36, y: 97.5, dir: -1 }),
    ...stackChain().map(([from, to]) =>
      B(`${from.id} -> ${to.id}`, { x: from.tx, y: from.y }, { x0: to.x0 === 34 ? 34 : 36, y: to.y, dir: to.x0 === 34 ? 1 : -1 }),
    ),
    B(`${topStack().id} -> the Span`, { x: topStack().tx, y: topStack().y }, { x0: 40, y: Y(106), dir: -1 }),
    B('W10 -> L6 (M4)', { x: 22, y: Y(166) }, { x0: 20, y: Y(176), dir: -1 }),
    B('H1 -> H2', { x: 35, y: Y(240) }, { x0: 28, y: Y(249.5), dir: -1 }),
    B('H2 -> H3', { x: 21, y: Y(249.5) }, { x0: 28, y: Y(259), dir: 1 }),
    ...extraStrands().map((h, k, all) => {
      const from = k ? all[k - 1] : { id: 'H3', tx: 35, y: Y(259) };
      return B(`${from.id} -> ${h.id}`, { x: from.tx, y: from.y }, { x0: h.x0 === 14 ? 28 : 28, y: h.y, dir: h.x0 === 14 ? -1 : 1 });
    }),
    B(`${lastStrand().id} -> O1`, { x: lastStrand().tx, y: lastStrand().y }, { x0: 21, y: Y(268.5), dir: lastStrand().tx < 28 ? 1 : -1 }),
    B('O1 -> O2L', { x: 28, y: Y(268.5) }, { x0: 30, y: Y(277), dir: -1 }),
    B('O3 -> O4', { x: 32, y: Y(285.5) }, { x0: 32, y: Y(294), dir: 1 }),
    ...(O6 ? [B('O4 -> O6', { x: 32, y: Y(294) }, { x0: 32, y: Y(294) + 8.5, dir: 1 })] : []),
    B(O6 ? 'O6 -> O5' : 'O4 -> O5', { x: 32, y: O6 ? Y(294) + 8.5 : Y(294) }, { x0: 32, y: Y(302.5), dir: 1 }),
    B('O5 -> the hub', { x: 32, y: Y(302.5) }, { x0: 32, y: Y(311), dir: 1 }),
    B('the hub -> the rim', { x: 33, y: Y(311) }, { x0: 38, y: TOP, dir: 1 }, { corner: true }),
  ];
  
  level.harpBeats = [
    { name: 'H1 -> H2', web: 'H1', from: { x: 35 }, to: { web: 'H2', x: 21 } },
    { name: 'H2 -> H3', web: 'H2', from: { x: 21 }, to: { web: 'H3', x: 35 } },
  ];
  return level;
}


function slantPairs() {
  return Array.from({ length: SLANTS }, (_, i) => {
    const b = Y(163) + 10 * i; 
    return [
      { id: `SL${5 + 2 * i}`, b },
      { id: `SL${6 + 2 * i}`, b: b + 5 },
    ];
  });
}


function extraStack() {
  return Array.from({ length: STACK }, (_, i) => {
    const east = i % 2 === 0;
    return { id: `W${8 + i}`, x0: east ? 34 : 22, tx: east ? 40 : 30, y: 97.5 + 8.5 * (i + 1) };
  });
}
const W7 = { id: 'W7', x0: 22, tx: 30, y: 97.5 };
const topStack = () => extraStack().at(-1) ?? W7;
const stackChain = () => extraStack().map((w, i, all) => [i ? all[i - 1] : W7, w]);


function extraStrands() {
  return Array.from({ length: HARPS }, (_, i) => {
    const k = i + 4; 
    const west = k % 2 === 0;
    return {
      id: `H${k}`,
      x0: west ? 14 : 28,
      tx: west ? 21 : 35,
      y: Y(259) + 9.5 * (i + 1),
      phase: Math.round((((k - 1) * 0.533) % 1.6) * 100) / 100,
    };
  });
}
const lastStrand = () => extraStrands().at(-1) ?? { id: 'H3', tx: 35, y: Y(259) };


function route(I) {
  const J = (x, y, via, at) => ({ x, y, move: 'jump', ...(via ? { via } : {}), ...(at !== undefined ? { at } : {}) });
  const P = (x, y, web, via = {}) => ({ x, y, move: 'pump', via: { web, ...via } });
  const harp = { waitMax: 1.6 };
  const orb = { dashCut: [I.A7, I.A8, I.A9, ...(O6 ? [I.A10] : [])] }; 
  return [
    { x: 13.5, y: 36, move: 'walk' }, 
    { x: 19, y: 14, move: 'drop' }, 
    { x: 46, y: 14, move: 'walk' },
    P(54, 22.5, 'W1'), 
    { x: 54, y: 50, move: 'wall', via: { x: 58.75 } }, 
    { x: 6, y: 50, move: 'walk' }, 
    J(6.5, 54.5, { double: true }),
    J(12.5, 59, { double: true }),
    J(6.5, 63.5, { double: true }),
    J(8, 68, { double: true }),
    { x: 25.5, y: 68, move: 'walk' },
    { x: 28.5, y: 62, move: 'drop' }, 
    { x: 46, y: 62, move: 'walk' },
    P(55, 70.5, 'W3'), 
    J(44, 72, { double: true }, 52.6), 
    P(30, 80.5, 'W4'),
    P(40, 89, 'W5'),
    P(30, 97.5, 'W6'),
    ...stackChain().map(([from, to]) => P(to.tx, to.y, from.id)),
    P(38, Y(106), topStack().id), 
    { x: 24, y: Y(106), move: 'walk', via: { dashCut: I.A1 } },
    { x: 18.5, y: Y(106), move: 'hop', via: { dashCut: I.A1 } }, 
    { x: 6, y: Y(106), move: 'walk' }, 
    { x: 5, y: Y(142), move: 'wall', via: { x: 5.25 } }, 
    { x: 39.5, y: Y(142), move: 'walk', via: { dashCut: [I.A3, I.A4, ...(A5 ? [I.A5] : [])] } },
    { x: 44, y: Y(141.5), move: 'hop' }, 
    P(30, Y(148), 'SL1'), 
    { x: 24.5, y: Y(148), move: 'walk' },
    J(16, Y(150), { double: true }, 24.4), 
    P(26, Y(155), 'SL2'),
    P(16, Y(160), 'SL3'),
    ...slantPairs().flatMap(([e, w], i, all) => [P(26, e.b + 2, i ? all[i - 1][1].id : 'SL4'), P(16, w.b + 2, e.id)]),
    P(32, Y(166), slantPairs().at(-1)?.[1].id ?? 'SL4'), 
    { x: 16, y: Y(176), move: 'poundPump', via: { web: 'W10', takeoff: 28.3, land: 24 } }, 
    J(6.5, Y(180.5), { double: true }),
    J(12.5, Y(185), { double: true }),
    J(6.5, Y(189.5), { double: true }),
    J(12.5, Y(194), { double: true }),
    J(12, Y(198.5), { double: true }),
    J(29.5, Y(198.5), undefined, 19.5), 
    {
      x: 0,
      y: 0,
      move: 'tether',
      hook: I.K1,
      at: 30,
      next: I.K2,
      beat: { from: { x: 29.6, y: Y(198.5) }, goal: { x0: 56, y: R6, dir: 1 } },
    },
    { x: 58, y: R6, move: 'tether', hook: I.K2 },
    { x: 54, y: Y(236), move: 'wall', via: { x: 58.75 } }, 
    J(40, Y(240), { double: true }, 44.4), 
    P(21, Y(249.5), 'H1', harp),
    P(35, Y(259), 'H2', harp),
    ...extraStrands().map((h, k, all) => P(h.tx, h.y, k ? all[k - 1].id : 'H3', harp)),
    P(24, Y(268.5), lastStrand().id, harp),
    P(28, Y(277.6), 'O1'),
    P(33, Y(285.5), 'O2L'),
    P(32, Y(294), 'O3', orb),
    ...(O6 ? [P(32, Y(294) + 8.5, 'O4', orb), P(32, Y(302.5), 'O6', orb)] : [P(32, Y(302.5), 'O4', orb)]),
    P(32, Y(311), 'O5', orb), 
    P(44, TOP, 'HUB'), 
  ];
}
