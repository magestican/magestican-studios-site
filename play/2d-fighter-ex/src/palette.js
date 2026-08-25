


















export const CEL = Object.freeze({
  ink: '#1a1720',
  skin: '#f2cba4',
  skinShade: '#d08f78',   
  skinDeep: '#b06a5c',    
  cream: '#f2e6cf',
  mustard: '#c9a02c',
  rust: '#b4483a',
  teal: '#3f6d6b',
  navy: '#2c3a5e',
  moss: '#5c6b3a',
  bark: '#6b4a34',
  sky: '#8fb4d8',
  highlight: '#fffaf0',
});

export const LINE = CEL.ink;

export function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (sh) => {
    const x = (pa >> sh) & 255;
    const y = (pb >> sh) & 255;
    return Math.round(x + (y - x) * t);
  };
  return `#${[16, 8, 0].map((sh) => ch(sh).toString(16).padStart(2, '0')).join('')}`;
}


const band = (base, toward = CEL.ink) => Object.freeze({
  lit: mix(base, CEL.highlight, 0.16),
  base,
  shade: mix(base, toward, 0.30),
  deep: mix(base, toward, 0.52),
});

export const SKIN = Object.freeze({
  light: Object.freeze({ lit: mix(CEL.skin, CEL.highlight, 0.2), base: CEL.skin, shade: CEL.skinShade, deep: CEL.skinDeep }),
  dark: Object.freeze({
    lit: mix(mix(CEL.skin, CEL.bark, 0.28), CEL.highlight, 0.18),
    base: mix(CEL.skin, CEL.bark, 0.28),
    shade: mix(CEL.skinShade, CEL.bark, 0.30),
    deep: mix(CEL.skinDeep, CEL.bark, 0.35),
  }),
});



export const KITS = Object.freeze({
  light: Object.freeze({
    skin: SKIN.light,
    hair: band('#c8622c'),                 
    jacket: band(CEL.cream),
    shirt: band(CEL.rust),
    trousers: band(CEL.navy),
    boot: band('#4a3626'),
    trim: band(CEL.mustard),
    iris: band('#2f6ea8'),
  }),
  dark: Object.freeze({
    skin: SKIN.dark,
    hair: band('#2a2836'),
    jacket: band(CEL.teal),
    shirt: band('#1f2733'),
    trousers: band('#3a3f4a'),
    boot: band('#241d1a'),
    trim: band(CEL.rust),
    iris: band('#8a5a2a'),
  }),
});



export const FX = Object.freeze({
  core: CEL.highlight,
  burst: mix(CEL.mustard, CEL.highlight, 0.35),
  rim: CEL.rust,
  ring: mix(CEL.cream, CEL.mustard, 0.4),
  speed: CEL.highlight,
  slash: mix(CEL.rust, CEL.highlight, 0.25),
  impactLine: CEL.ink,
});
