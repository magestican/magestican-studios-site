









export const MUSIC = {
  'atelier-day': { loop: true },
  'atelier-night': { loop: true },
  'town-day': { loop: true },
  'town-night': { loop: true },
  market: { loop: true },
  work: { loop: true },
  reveal: { loop: false },
  letter: { loop: false },
};
export const STINGERS = Object.keys(MUSIC).filter((c) => !MUSIC[c].loop);


const PLACE = { cut: 'work', sew: 'work', market: 'market', town: 'town' };
const BY_TIME = new Set(['atelier', 'town']);
export function cueFor(screen, night) {
  const place = PLACE[screen] || 'atelier';
  return BY_TIME.has(place) ? `${place}-${night ? 'night' : 'day'}` : place;
}




export const FX = ['click', 'pin', 'shelf', 'bobbinOut', 'wind', 'lampOn', 'error', 'coin', 'sparkle', 'dust',
  'toDay', 'toNight', 'fanfare', 'levelup'];


export function pickFormat(canPlay) {
  try {
    if (canPlay('audio/webm; codecs="opus"')) return 'webm';
    if (canPlay('audio/ogg; codecs="vorbis"')) return 'ogg';
  } catch (e) {  }
  return null;
}



export function audioUrl(kind, name, fmt, build) {
  const q = build && build !== 'dev' ? `?v=${encodeURIComponent(build)}` : '';
  return `audio/${kind}/${name}.${fmt}${q}`;
}


export const MIX = {
  fade: 0.8,        
  file: 0.55,       
  fx: 0.6,          
  duck: 0.25,       
  keep: 2,          
};


export function evictions(order, playing, keep = MIX.keep) {
  const loops = order.filter((c) => MUSIC[c] && MUSIC[c].loop);
  const drop = [];
  let n = loops.length;
  for (const c of loops) {
    if (n <= keep) break;
    if (c === playing) continue;
    drop.push(c); n--;
  }
  return drop;
}
