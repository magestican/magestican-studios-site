















































import { HERD } from '../../../web-engine/rts/roster.js';
















const HERD_SKIN = {
  id: 'herd',
  
  panels: { forces: 'us', map: 'the ground', status: 'this one' },
  
  quick: { colours: 'our colours', sound: 'what we hear', automation: 'what we do on our own', done: 'back to it' },
  






  rows: { train: 'animals', build: 'places' },
  




  buttons: { attack: 'ATTACK', capture: 'CAPTURE', build: 'BUILD', menu: '≡' },
  












  coach: {
    'capture-first': 'This ground is nobody\'s. Press {btnCapture}.',
    'capture-more': 'Take more grey ground. Every second of it pays us.',
    'build-first': 'Press {btnBuild}, then touch our own green.',
    water: 'The water pays double. Take it.',
    'enemy-seen': 'Red ground is theirs. {btnAttack} to push, {btnCapture} to take.',
    hold: 'Hold more ground than them. That is all of it.',
  },
  
  chips: {
    all: 'all', army: 'fighters', gather: 'hands', view: 'here',
  },
  
  res: { feed: 'feed', water: 'water' },
  
  doing: {
    idle: 'standing', moving: 'moving', attacking: 'fighting',
    gathering: 'working', loading: 'carrying', dead: 'gone',
    
    taking: 'taking this ground',
  },
  
  capture: { losing: 'they are taking this ground' },
  





  nums: { hp: 'strong', dmg: 'bite', pack: 'we are' },
  
  empty: { name: 'none of us', hint: 'there are more of us to come' },
  
  share: (pct, pts) => `${pct}% is ours · ${pts}`,
  



  ticker: {
    captured: 'This ground is ours.',
    lost: 'We are losing ground.',
    faded: 'Ground has gone quiet. It needs a Haven.',
    made: (name) => `${name} is standing.`,
    stockLost: 'They have taken one of us away.',
    stockTaken: 'We have one of them.',
    waterPolluted: 'The water is turning.',
    waterCleaned: 'The water is clearing.',
    won: 'We held the most ground.',
    lostMatch: 'They held more ground.',
  },
};


















const YIELD_SKIN = {
  id: 'yield',
  
  
  
  
  panels: { forces: 'FORCES', map: 'SECTOR MAP', status: 'UNIT STATUS' },
  
  quick: { colours: 'LIVERY', sound: 'AUDIO', automation: 'AUTOMATION', done: 'CLOSE' },
  rows: { train: 'CREW', build: 'BUILDINGS' },
  buttons: { attack: 'ATTACK', capture: 'CAPTURE', build: 'BUILD', menu: '≡' },
  coach: {
    'capture-first': 'Unclaimed block underfoot. Press {btnCapture}.',
    'capture-more': 'Secure more grey blocks. Each one pays per second.',
    'build-first': 'Press {btnBuild}, then tap inside your own green.',
    water: 'A catchment pays double. Secure one.',
    'enemy-seen': 'Red blocks are theirs. {btnAttack} to move them off, {btnCapture} to take.',
    hold: 'Hold more ground than they do. That is the job.',
  },
  chips: {
    all: 'ALL', army: 'CREWS', gather: 'WORKERS', view: 'IN VIEW',
  },
  res: { feed: 'FEED', water: 'WATER' },
  doing: {
    idle: 'STANDING BY', moving: 'EN ROUTE', attacking: 'ENGAGED',
    gathering: 'WORKING', loading: 'LOADING', dead: 'OFF ROSTER',
    taking: 'SECURING SECTOR',
  },
  capture: { losing: 'LOSING SECTOR' },
  nums: { hp: 'HP', dmg: 'DMG', pack: 'HEAD' },
  empty: { name: 'NO CREWS', hint: 'CREW UP TO BEGIN' },
  share: (pct, pts) => `${pct}% SECURED · ${pts}`,
  ticker: {
    captured: 'Sector secured.',
    lost: 'We are losing a sector.',
    faded: 'Sector has gone quiet. Post it again.',
    made: (name) => `${name} is up.`,
    stockLost: 'Stock lost from the roster.',
    stockTaken: 'Stock recovered.',
    waterPolluted: 'Catchment is off spec.',
    waterCleaned: 'Catchment is clear.',
    won: 'You secured the most ground.',
    lostMatch: 'They held more ground.',
  },
};

export const SKINS = Object.freeze({ herd: HERD_SKIN, yield: YIELD_SKIN });










export function skinFor(faction) {
  return faction === HERD ? HERD_SKIN : YIELD_SKIN;
}














export function everyPhrase(skin, skip = []) {
  const out = [];
  const walk = (v) => {
    if (typeof v === 'string') out.push(v);
    
    
    
    else if (v && typeof v === 'object') for (const k of Object.keys(v)) if (k !== 'id') walk(v[k]);
  };
  
  
  
  for (const k of Object.keys(skin)) {
    if (k === 'id' || skip.includes(k)) continue;
    walk(skin[k]);
  }
  return out;
}























export const SHARED_CAPTION_GROUPS = Object.freeze(['buttons']);










export const CAPTION_GROUPS = Object.freeze([
  'panels', 'rows', 'buttons', 'chips', 'res', 'doing', 'nums', 'empty', 'capture',
  
  
  
  'quick',
]);


export function everyCaption(skin, skip = []) {
  return CAPTION_GROUPS.filter((g) => !skip.includes(g))
    .flatMap((g) => Object.values(skin[g]));
}








export function coachLine(skin, id) {
  const raw = skin.coach[id];
  if (!raw) return '';
  return raw
    .replace(/\{btnAttack\}/g, skin.buttons.attack)
    .replace(/\{btnCapture\}/g, skin.buttons.capture)
    .replace(/\{btnBuild\}/g, skin.buttons.build);
}








export function expandedPhrases(skin, skip = []) {
  return [
    ...everyPhrase(skin, skip),
    skin.share(42, '1:23'),
    skin.ticker.made('Haven'),
  ];
}
