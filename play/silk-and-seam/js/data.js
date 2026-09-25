


export const TAGS = [
  'Casual', 'Cute', 'Daywear', 'Eclectic', 'Elaborate', 'Elegant', 'Eveningwear',
  'Flowers', 'Formal', 'Glamour', 'Gothic', 'Patterned', 'Playful', 'Professional',
  'Risqué', 'Romantic', 'Shimmering', 'Simple', 'Unwearable', 'Whimsical',
];



export const PARTS = {
  bodice: [
    { id: 'bustier', name: 'Bustier Bodice', lvl: 1, m: { p: 1.2, s: 0 }, diff: 2, tags: { Elegant: 2, Eveningwear: 2, Romantic: 1, Risqué: 1, Glamour: 1 } },
    { id: 'square', name: 'Square-Neck Bodice', lvl: 1, m: { p: 1.3, s: 0 }, diff: 1, tags: { Daywear: 2, Cute: 1, Romantic: 1, Casual: 1 } },
    { id: 'highneck', name: 'Buttoned High Neck', lvl: 1, m: { p: 1.5, s: 0 }, diff: 2, tags: { Professional: 2, Formal: 1, Daywear: 1, Elegant: 1 } },
    { id: 'vneck', name: 'V-Neck Bodice', lvl: 2, m: { p: 1.3, s: 0 }, diff: 1, tags: { Elegant: 1, Risqué: 2, Eveningwear: 1, Glamour: 1 } },
    { id: 'corset', name: 'Laced Corset', lvl: 3, m: { p: 1.4, s: 0 }, diff: 3, tags: { Gothic: 2, Risqué: 2, Elaborate: 2, Glamour: 1 } },
  ],
  collar: [
    { id: 'none', name: 'No Collar', lvl: 1, m: { p: 0, s: 0 }, diff: 0, tags: { Simple: 1 } },
    { id: 'peterpan', name: 'Peter Pan Collar', lvl: 1, m: { p: 0, s: 0.3 }, diff: 1, tags: { Cute: 2, Playful: 2, Whimsical: 1 } },
    { id: 'bow', name: 'Neck Bow', lvl: 2, m: { p: 0, s: 0.3 }, diff: 1, tags: { Cute: 2, Playful: 1, Romantic: 1 } },
    { id: 'bertha', name: 'Lace Bertha', lvl: 2, m: { p: 0, s: 0.6 }, diff: 2, tags: { Romantic: 2, Elegant: 1, Elaborate: 1, Formal: 1 } },
    { id: 'ruffle', name: 'Ruffled Collar', lvl: 3, m: { p: 0, s: 0.5 }, diff: 2, tags: { Whimsical: 2, Elaborate: 1, Gothic: 1, Playful: 1 } },
  ],
  sleeve: [
    { id: 'none', name: 'Sleeveless', lvl: 1, m: { p: 0, s: 0 }, diff: 0, tags: { Simple: 1, Casual: 1 } },
    { id: 'cap', name: 'Cap Sleeve', lvl: 1, m: { p: 0, s: 0.4 }, diff: 1, tags: { Daywear: 1, Cute: 1, Professional: 1 } },
    { id: 'puff', name: 'Puff Sleeve', lvl: 1, m: { p: 0, s: 0.8 }, diff: 1, tags: { Cute: 2, Playful: 1, Romantic: 1 } },
    { id: 'bishop', name: 'Bishop Sleeve', lvl: 1, m: { p: 0, s: 1.4 }, diff: 2, tags: { Daywear: 1, Professional: 1, Elegant: 1, Formal: 1 } },
    { id: 'angel', name: 'Angel Sleeve', lvl: 2, m: { p: 0, s: 1.6 }, diff: 2, tags: { Romantic: 3, Elaborate: 1, Eveningwear: 1, Whimsical: 1 } },
  ],
  skirt: [
    { id: 'aline', name: 'A-Line Skirt', lvl: 1, m: { p: 2.5, s: 0 }, diff: 1, tags: { Daywear: 2, Casual: 2, Simple: 1, Professional: 1 } },
    { id: 'flounce', name: 'Flounced Skirt', lvl: 1, m: { p: 2.5, s: 1.0 }, diff: 2, tags: { Cute: 1, Romantic: 1, Daywear: 1, Playful: 1 } },
    { id: 'ballgown', name: 'Ball Gown Skirt', lvl: 2, m: { p: 6.0, s: 0 }, diff: 2, tags: { Formal: 2, Eveningwear: 2, Elegant: 2, Glamour: 1 } },
    { id: 'odette', name: 'Odette Skirt', lvl: 3, m: { p: 5.0, s: 3.0 }, diff: 3, tags: { Romantic: 2, Elaborate: 3, Eveningwear: 2, Formal: 1, Whimsical: 1 } },
    { id: 'mermaid', name: 'Mermaid Skirt', lvl: 4, m: { p: 4.0, s: 0 }, diff: 3, tags: { Glamour: 3, Risqué: 2, Eveningwear: 2 } },
  ],
};

export const SLOTS = ['bodice', 'collar', 'sleeve', 'skirt'];


export const FABRICS = [
  { id: 'cotton', name: 'Cotton Lawn', price: 3, lvl: 1, tex: 'weave', tags: { Casual: 2, Daywear: 2, Simple: 1 } },
  { id: 'linen', name: 'Linen', price: 4, lvl: 1, tex: 'slub', tags: { Casual: 1, Daywear: 2, Professional: 1 } },
  { id: 'gingham', name: 'Gingham', price: 5, lvl: 1, tex: 'check', tags: { Cute: 2, Playful: 2, Patterned: 2, Casual: 1 } },
  { id: 'jacquard', name: 'Floral Jacquard', price: 8, lvl: 2, tex: 'floral', tags: { Patterned: 2, Flowers: 2, Romantic: 1, Elegant: 1 } },
  { id: 'satin', name: 'Duchess Satin', price: 11, lvl: 2, tex: 'sheen', tags: { Elegant: 2, Formal: 2, Glamour: 1 } },
  { id: 'tulle', name: 'Tulle', price: 6, lvl: 3, tex: 'net', tags: { Whimsical: 2, Romantic: 1, Cute: 1 } },
  { id: 'velvet', name: 'Velvet', price: 15, lvl: 3, tex: 'velvet', tags: { Gothic: 2, Eveningwear: 2, Glamour: 1 } },
  { id: 'silk', name: 'Silk Charmeuse', price: 20, lvl: 4, tex: 'silk', tags: { Elegant: 3, Glamour: 2, Eveningwear: 1 } },
  { id: 'sequin', name: 'Sequin Mesh', price: 24, lvl: 5, tex: 'sparkle', tags: { Shimmering: 4, Glamour: 3, Eveningwear: 1 } },
  { id: 'brocade', name: 'Gold Brocade', price: 32, lvl: 6, tex: 'brocade', tags: { Elaborate: 3, Formal: 2, Patterned: 2, Glamour: 1 } },
];

export const ZONES = [
  { id: 'neckline', name: 'Neckline' },
  { id: 'bodice', name: 'Bodice' },
  { id: 'waist', name: 'Waist' },
  { id: 'seams', name: 'Skirt Seams' },
  { id: 'hem', name: 'Hem' },
  { id: 'sleeves', name: 'Sleeves' },
];


export const TRIMS = [
  { id: 'ribbon', name: 'Satin Ribbon', price: 2, lvl: 1, zones: ['waist', 'sleeves'], tags: { Cute: 1, Romantic: 1 } },
  { id: 'buttons', name: 'Pearl Buttons', price: 3, lvl: 1, zones: ['bodice'], tags: { Professional: 1, Elegant: 1 } },
  { id: 'lace', name: 'Lace Edging', price: 4, lvl: 1, zones: ['neckline', 'hem', 'sleeves'], tags: { Romantic: 2, Elegant: 1 } },
  { id: 'bows', name: 'Ribbon Bows', price: 3, lvl: 2, zones: ['waist', 'hem', 'sleeves'], tags: { Cute: 2, Playful: 1 } },
  { id: 'pearls', name: 'Seed Pearls', price: 6, lvl: 2, zones: ['neckline', 'seams', 'waist'], tags: { Elegant: 2, Formal: 1, Elaborate: 1 } },
  { id: 'rosettes', name: 'Silk Rosettes', price: 5, lvl: 3, zones: ['waist', 'hem', 'bodice'], tags: { Flowers: 3, Romantic: 1 } },
  { id: 'jet', name: 'Jet Beads', price: 6, lvl: 3, zones: ['neckline', 'seams'], tags: { Gothic: 2, Eveningwear: 1 } },
  { id: 'sequins', name: 'Sequins', price: 7, lvl: 4, zones: ['bodice', 'hem'], tags: { Shimmering: 3, Glamour: 1 } },
  { id: 'embroidery', name: 'Gold Embroidery', price: 10, lvl: 5, zones: ['bodice', 'hem'], tags: { Elaborate: 2, Formal: 1, Patterned: 1 } },
  { id: 'crystals', name: 'Crystals', price: 14, lvl: 6, zones: ['neckline', 'bodice', 'seams'], tags: { Shimmering: 3, Glamour: 2, Eveningwear: 1 } },
];

export const DYES = [
  { id: 'ivory', name: 'Ivory', hex: '#f4ecd8', lvl: 1, tags: { Elegant: 1, Formal: 1, Romantic: 1 } },
  { id: 'blush', name: 'Blush', hex: '#f2b0a8', lvl: 1, tags: { Cute: 1, Romantic: 2 } },
  { id: 'coral', name: 'Coral', hex: '#e8796d', lvl: 1, tags: { Playful: 1, Cute: 1 } },
  { id: 'sage', name: 'Sage', hex: '#93b08e', lvl: 1, tags: { Daywear: 1, Casual: 1 } },
  { id: 'sky', name: 'Sky', hex: '#9fc4e2', lvl: 1, tags: { Cute: 1, Casual: 1, Playful: 1 } },
  { id: 'navy', name: 'Navy', hex: '#27385c', lvl: 1, tags: { Professional: 2, Formal: 1 } },
  { id: 'rose', name: 'Rose', hex: '#d25a6e', lvl: 2, tags: { Romantic: 1, Glamour: 1 } },
  { id: 'forest', name: 'Forest', hex: '#3f6048', lvl: 2, tags: { Daywear: 1, Elegant: 1 } },
  { id: 'lavender', name: 'Lavender', hex: '#b9a4d8', lvl: 2, tags: { Whimsical: 2, Cute: 1 } },
  { id: 'mustard', name: 'Mustard', hex: '#d8a83c', lvl: 2, tags: { Playful: 1, Eclectic: 1 } },
  { id: 'charcoal', name: 'Charcoal', hex: '#4a4a52', lvl: 3, tags: { Professional: 2, Gothic: 1 } },
  { id: 'crimson', name: 'Crimson', hex: '#a3202e', lvl: 3, tags: { Risqué: 2, Eveningwear: 1, Glamour: 1 } },
  { id: 'plum', name: 'Plum', hex: '#5e2f5b', lvl: 3, tags: { Gothic: 1, Eveningwear: 1, Romantic: 1 } },
  { id: 'black', name: 'Midnight Black', hex: '#1e1b21', lvl: 4, tags: { Gothic: 3, Eveningwear: 1, Formal: 1 } },
  { id: 'champagne', name: 'Champagne', hex: '#ead6b4', lvl: 4, tags: { Elegant: 2, Glamour: 1 } },
  { id: 'gold', name: 'Antique Gold', hex: '#c7a04a', lvl: 5, tags: { Glamour: 2, Elaborate: 1 } },
];


export const LEVEL_XP = [0, 90, 230, 420, 670, 980, 1360, 1820, 2380, 3050];
export const MAX_LEVEL = LEVEL_XP.length;

export const START = {
  money: 60,
  fabrics: { cotton: 12, linen: 6, gingham: 4 },
  trims: { ribbon: 3, lace: 2, buttons: 2 },
};


export const CLIENTS = [
  { name: 'Miss Clementine Hart', occasion: 'a garden party in the rose maze', wants: ['Cute', 'Daywear', 'Flowers'], avoid: ['Gothic'], look: 0 },
  { name: 'Lady Evangeline Moor', occasion: 'the winter ball at Moor Hall', wants: ['Elegant', 'Eveningwear', 'Formal'], avoid: ['Casual'], look: 1 },
  { name: 'Madame Noir', occasion: 'a midnight masquerade', wants: ['Gothic', 'Eveningwear', 'Risqué'], avoid: ['Cute'], look: 2 },
  { name: 'Rosalind Fairweather', occasion: 'her sister\'s wedding', wants: ['Romantic', 'Elegant'], avoid: ['Risqué'], look: 3 },
  { name: 'Pip Tumbleweed', occasion: 'a mad hatter tea party', wants: ['Playful', 'Whimsical', 'Cute'], avoid: ['Formal'], look: 4 },
  { name: 'Ms Harriet Vale', occasion: 'her first week at the bank', wants: ['Professional', 'Daywear'], avoid: ['Risqué', 'Whimsical'], look: 5 },
  { name: 'Juniper Wren', occasion: 'a picnic by the river', wants: ['Casual', 'Daywear', 'Patterned'], avoid: ['Eveningwear'], look: 0 },
  { name: 'Countess Aurelia', occasion: 'the opera gala', wants: ['Glamour', 'Shimmering', 'Elaborate'], avoid: ['Simple'], look: 1, minLvl: 4 },
  { name: 'Odile Swan', occasion: 'opening night of the ballet', wants: ['Romantic', 'Elaborate', 'Eveningwear'], avoid: ['Casual'], look: 3, minLvl: 3 },
  { name: 'Mrs Beatrice Plum', occasion: 'the village fete', wants: ['Simple', 'Daywear', 'Cute'], avoid: ['Glamour'], look: 4 },
  { name: 'Lenore Ashgrove', occasion: 'a poetry reading by candlelight', wants: ['Gothic', 'Romantic'], avoid: ['Playful'], look: 2, minLvl: 3 },
  { name: 'Miss Poppy Lark', occasion: 'the spring flower show', wants: ['Flowers', 'Patterned', 'Romantic'], avoid: ['Gothic'], look: 0, minLvl: 2 },
];
