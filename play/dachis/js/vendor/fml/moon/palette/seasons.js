










export const SEASONS = Object.freeze(['spring', 'summer', 'autumn', 'winter']);

export const PALETTE = Object.freeze({
  common: {
    bark: ['#b3845a', '#86593a', '#5b3a24'],
    stone: ['#c9c2b8', '#a39a90', '#7c736c'],
    ink: '#1d1b2e',
    cream: '#fff8ec',
  },
  spring: {
    leaf: ['#b4e07a', '#7cc257', '#4a9449'],
    blossom: ['#ffe0ea', '#f9b3cb', '#e886a9'],
    fruit: '#f6c453',
    grass: ['#c2e585', '#8fcb65', '#62a956'],
    soil: '#b0825a',
    path: '#e3c79c',
    groundCover: 'clover',
  },
  summer: {
    leaf: ['#9ad65e', '#5fae4a', '#357f45'],
    blossom: ['#fff4d6', '#ffe7a8', '#f5cf73'],
    fruit: '#e44b3c',
    grass: ['#b4df6c', '#7fc25a', '#58a352'],
    soil: '#a8784e',
    path: '#e0c08e',
    groundCover: 'flowers',
  },
  autumn: {
    leaf: ['#f8c056', '#e5812f', '#b24e2e'],
    blossom: ['#f7d6a0', '#e9a864', '#c9773f'],
    fruit: '#c9402f',
    grass: ['#cdbd62', '#99a04f', '#71803f'],
    soil: '#9c6a44',
    path: '#d5b07c',
    groundCover: 'fallen-leaves',
  },
  winter: {
    leaf: ['#7aa983', '#548569', '#325f50'],
    blossom: ['#ffffff', '#e8f0fb', '#c9d6ea'],
    fruit: '#d8473a',
    grass: ['#eef3fa', '#d3deec', '#b3c2d8'],
    soil: '#8d7b6e',
    path: '#c9c0bd',
    snow: ['#fbfdff', '#e2eaf6', '#bccbe0'],
    groundCover: 'snow',
  },
});

export function seasonPalette(season) {
  if (!SEASONS.includes(season)) throw new Error(`unknown season '${season}'`);
  return { ...PALETTE.common, ...PALETTE[season] };
}


export function linear(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
}


export function mixLinear(hexA, hexB, t) {
  const a = linear(hexA), b = linear(hexB);
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
