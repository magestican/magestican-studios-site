















































import { HERD } from '../../../web-engine/rts/roster.js';
















const HERD_SKIN = {
  id: 'herd',
  
  panels: { forces: 'us', map: 'the ground', status: 'this one' },
  
  rows: { train: 'more of us', build: 'we grow' },
  




  buttons: { attack: 'Push', capture: 'Wake', build: 'Grow', menu: '≡' },
  
  chips: {
    all: 'all', army: 'fighters', gather: 'hands', view: 'here',
  },
  
  res: { feed: 'feed', water: 'water' },
  
  doing: {
    idle: 'standing', moving: 'moving', attacking: 'fighting',
    gathering: 'working', loading: 'carrying', dead: 'gone',
  },
  





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
  panels: { forces: 'FORCES', map: 'SECTOR MAP', status: 'STOCK STATUS' },
  rows: { train: 'CREW UP', build: 'BUILD' },
  buttons: { attack: 'CONTAIN', capture: 'SECURE', build: 'BUILD', menu: '≡' },
  chips: {
    all: 'ALL', army: 'CREWS', gather: 'WORKERS', view: 'IN VIEW',
  },
  res: { feed: 'FEED', water: 'WATER' },
  doing: {
    idle: 'STANDING BY', moving: 'EN ROUTE', attacking: 'ENGAGED',
    gathering: 'WORKING', loading: 'LOADING', dead: 'OFF ROSTER',
  },
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














export function everyPhrase(skin) {
  const out = [];
  const walk = (v) => {
    if (typeof v === 'string') out.push(v);
    
    
    
    else if (v && typeof v === 'object') for (const k of Object.keys(v)) if (k !== 'id') walk(v[k]);
  };
  walk(skin);
  return out;
}










export const CAPTION_GROUPS = Object.freeze([
  'panels', 'rows', 'buttons', 'chips', 'res', 'doing', 'nums', 'empty',
]);


export function everyCaption(skin) {
  return CAPTION_GROUPS.flatMap((g) => Object.values(skin[g]));
}








export function expandedPhrases(skin) {
  return [
    ...everyPhrase(skin),
    skin.share(42, '1:23'),
    skin.ticker.made('Haven'),
  ];
}
