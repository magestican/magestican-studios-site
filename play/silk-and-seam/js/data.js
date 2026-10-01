


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
    
    { id: 'halter', name: 'Keyhole Halter', lvl: 2, m: { p: 1.0, s: 0 }, diff: 1, tags: { Glamour: 2, Risqué: 1, Eveningwear: 1, Playful: 1 } },
    { id: 'empire', name: 'Empire Waist Bodice', lvl: 4, m: { p: 1.1, s: 0 }, diff: 1, tags: { Romantic: 2, Elegant: 1, Daywear: 1, Whimsical: 1 } },
    
    
    { id: 'choli', name: 'Choli Blouse', lvl: 3, m: { p: 0.8, s: 0 }, diff: 2, tags: { Elegant: 1, Romantic: 1, Glamour: 1, Risqué: 1 } },
    { id: 'sabai', name: 'Thai Sabai Drape', lvl: 3, m: { p: 1.4, s: 0 }, diff: 2, tags: { Elegant: 2, Formal: 1, Romantic: 1 } },
    { id: 'offshoulder', name: 'Off-Shoulder Bodice', lvl: 7, m: { p: 1.3, s: 0 }, diff: 2, tags: { Eveningwear: 2, Romantic: 1, Risqué: 1, Glamour: 1, Elegant: 1 } },
    
    
    
    { id: 'qipao', name: 'Qipao Bodice', lvl: 2, m: { p: 1.3, s: 0 }, diff: 3, tags: { Elegant: 2, Formal: 1, Glamour: 1, Professional: 1 } },
    { id: 'jeogori', name: 'Hanbok Jeogori', lvl: 2, m: { p: 0.9, s: 0 }, diff: 2, tags: { Cute: 1, Elegant: 1, Formal: 1, Romantic: 1 } },
    { id: 'kebaya', name: 'Kebaya Blouse', lvl: 2, m: { p: 1.2, s: 0 }, diff: 2, tags: { Elegant: 2, Romantic: 1, Formal: 1, Elaborate: 1 } },
  ],
  collar: [
    { id: 'none', name: 'No Collar', lvl: 1, m: { p: 0, s: 0 }, diff: 0, tags: { Simple: 1 } },
    { id: 'peterpan', name: 'Peter Pan Collar', lvl: 1, m: { p: 0, s: 0.3 }, diff: 1, tags: { Cute: 2, Playful: 2, Whimsical: 1 } },
    { id: 'bow', name: 'Neck Bow', lvl: 2, m: { p: 0, s: 0.3 }, diff: 1, tags: { Cute: 2, Playful: 1, Romantic: 1 } },
    { id: 'bertha', name: 'Lace Bertha', lvl: 2, m: { p: 0, s: 0.6 }, diff: 2, tags: { Romantic: 2, Elegant: 1, Elaborate: 1, Formal: 1 } },
    { id: 'ruffle', name: 'Ruffled Collar', lvl: 3, m: { p: 0, s: 0.5 }, diff: 2, tags: { Whimsical: 2, Elaborate: 1, Gothic: 1, Playful: 1 } },
    
    { id: 'sailor', name: 'Sailor Collar', lvl: 3, m: { p: 0, s: 0.5 }, diff: 2, tags: { Playful: 2, Cute: 1, Casual: 1, Daywear: 1 } },
    { id: 'jabot', name: 'Lace Jabot', lvl: 5, m: { p: 0, s: 0.4 }, diff: 2, tags: { Elaborate: 1, Formal: 1, Professional: 1, Romantic: 1 } },
    { id: 'medici', name: 'Medici Lace Collar', lvl: 9, m: { p: 0, s: 0.7 }, diff: 3, tags: { Elaborate: 2, Gothic: 1, Formal: 1, Glamour: 1 } },
  ],
  sleeve: [
    { id: 'none', name: 'Sleeveless', lvl: 1, m: { p: 0, s: 0 }, diff: 0, tags: { Simple: 1, Casual: 1 } },
    { id: 'cap', name: 'Cap Sleeve', lvl: 1, m: { p: 0, s: 0.4 }, diff: 1, tags: { Daywear: 1, Cute: 1, Professional: 1 } },
    { id: 'puff', name: 'Puff Sleeve', lvl: 1, m: { p: 0, s: 0.8 }, diff: 1, tags: { Cute: 2, Playful: 1, Romantic: 1 } },
    { id: 'bishop', name: 'Bishop Sleeve', lvl: 1, m: { p: 0, s: 1.4 }, diff: 2, tags: { Daywear: 1, Professional: 1, Elegant: 1, Formal: 1 } },
    { id: 'angel', name: 'Angel Sleeve', lvl: 2, m: { p: 0, s: 1.6 }, diff: 2, tags: { Romantic: 3, Elaborate: 1, Eveningwear: 1, Whimsical: 1 } },
    
    { id: 'flutter', name: 'Flutter Sleeve', lvl: 2, m: { p: 0, s: 0.5 }, diff: 1, tags: { Cute: 1, Playful: 1, Romantic: 1, Daywear: 1 } },
    { id: 'juliet', name: 'Juliet Sleeve', lvl: 4, m: { p: 0, s: 1.3 }, diff: 3, tags: { Romantic: 2, Formal: 1, Elaborate: 1, Elegant: 1 } },
    { id: 'bell', name: 'Bell Sleeve', lvl: 6, m: { p: 0, s: 1.2 }, diff: 2, tags: { Whimsical: 1, Romantic: 1, Eclectic: 1, Elegant: 1 } },
    
    { id: 'terno', name: 'Terno Butterfly Sleeve', lvl: 3, m: { p: 0, s: 0.7 }, diff: 3, tags: { Formal: 2, Elegant: 1, Elaborate: 1, Romantic: 1 } },
  ],
  skirt: [
    { id: 'aline', name: 'A-Line Skirt', lvl: 1, m: { p: 2.5, s: 0 }, diff: 1, tags: { Daywear: 2, Casual: 2, Simple: 1, Professional: 1 } },
    { id: 'flounce', name: 'Flounced Skirt', lvl: 1, m: { p: 2.5, s: 1.0 }, diff: 2, tags: { Cute: 1, Romantic: 1, Daywear: 1, Playful: 1 } },
    { id: 'ballgown', name: 'Ball Gown Skirt', lvl: 2, m: { p: 6.0, s: 0 }, diff: 2, tags: { Formal: 2, Eveningwear: 2, Elegant: 2, Glamour: 1 } },
    { id: 'odette', name: 'Odette Skirt', lvl: 3, m: { p: 5.0, s: 3.0 }, diff: 3, tags: { Romantic: 2, Elaborate: 3, Eveningwear: 2, Formal: 1, Whimsical: 1 } },
    { id: 'mermaid', name: 'Mermaid Skirt', lvl: 4, m: { p: 4.0, s: 0 }, diff: 3, tags: { Glamour: 3, Risqué: 2, Eveningwear: 2 } },
    
    { id: 'tea', name: 'Tea-Length Circle Skirt', lvl: 3, m: { p: 3.5, s: 0.8 }, diff: 1, tags: { Daywear: 2, Cute: 1, Romantic: 1, Casual: 1 } },
    { id: 'highlow', name: 'High-Low Skirt', lvl: 5, m: { p: 3.5, s: 0 }, diff: 2, tags: { Eclectic: 1, Glamour: 1, Playful: 1, Risqué: 1, Eveningwear: 1 } },
    { id: 'bubble', name: 'Bubble Skirt', lvl: 6, m: { p: 3.0, s: 0 }, diff: 2, tags: { Playful: 2, Cute: 2, Whimsical: 1, Eclectic: 1 } },
    
    
    { id: 'saree', name: 'Saree Drape', lvl: 3, m: { p: 5.5, s: 0.8 }, diff: 2, tags: { Elegant: 2, Formal: 1, Romantic: 1, Elaborate: 1 } },
    { id: 'phasin', name: 'Pha Sin Wrap', lvl: 2, m: { p: 2.0, s: 0.4 }, diff: 1, tags: { Daywear: 1, Elegant: 1, Patterned: 1, Formal: 1 } },
    { id: 'bustle', name: 'Bustle Skirt', lvl: 8, m: { p: 4.5, s: 1.5 }, diff: 3, tags: { Elaborate: 2, Formal: 2, Gothic: 1, Romantic: 1 } },
    
    
    
    
    { id: 'chima', name: 'Hanbok Chima', lvl: 2, m: { p: 5.0, s: 0.3 }, diff: 2, tags: { Romantic: 2, Elegant: 1, Formal: 1, Whimsical: 1 } },
    { id: 'aodai', name: 'Ao Dai Panels', lvl: 2, m: { p: 3.0, s: 2.2 }, diff: 2, tags: { Elegant: 3, Daywear: 1, Formal: 1 } },
    { id: 'sarong', name: 'Batik Sarong (Kain)', lvl: 1, m: { p: 2.2, s: 0 }, diff: 1, tags: { Daywear: 1, Elegant: 1, Patterned: 1, Casual: 1 } },
    { id: 'lehenga', name: 'Lehenga & Dupatta', lvl: 3, m: { p: 6.0, s: 2.0 }, diff: 3, tags: { Elaborate: 3, Glamour: 2, Romantic: 1, Formal: 1, Shimmering: 1 } },
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
  
  { id: 'chiffon', name: 'Silk Chiffon', price: 9, lvl: 2, tex: 'chiffon', tags: { Romantic: 2, Whimsical: 1, Elegant: 1 } },
  { id: 'organza', name: 'Crystal Organza', price: 10, lvl: 4, tex: 'organza', tags: { Whimsical: 1, Elegant: 1, Romantic: 1, Shimmering: 1 } },
  { id: 'tartan', name: 'Wool Tartan', price: 7, lvl: 6, tex: 'tartan', tags: { Patterned: 3, Casual: 1, Professional: 1, Eclectic: 1 } },
  { id: 'damask', name: 'Silk Damask', price: 18, lvl: 7, tex: 'damask', tags: { Patterned: 2, Formal: 2, Elegant: 1, Gothic: 1 } },
  { id: 'lame', name: 'Gold Lamé', price: 26, lvl: 9, tex: 'lame', tags: { Shimmering: 3, Glamour: 3, Eveningwear: 1 } },
  
  { id: 'couture', name: 'Maison Couture Lace', price: 42, lvl: 10, tex: 'guipure', tags: { Elegant: 3, Elaborate: 2, Romantic: 2, Formal: 1, Glamour: 1 } },
  
  
  { id: 'ankara', name: 'Ankara Wax Print', price: 7, lvl: 2, tex: 'wax', tags: { Patterned: 3, Playful: 1, Eclectic: 1, Daywear: 1 } },
  { id: 'banarasi', name: 'Banarasi Silk', price: 22, lvl: 3, tex: 'zari', tags: { Elaborate: 2, Shimmering: 2, Formal: 1, Elegant: 1 } },
  { id: 'thaisilk', name: 'Thai Shot Silk', price: 16, lvl: 3, tex: 'shot', tags: { Elegant: 2, Shimmering: 1, Formal: 1 } },
  
  
  
  { id: 'batik', name: 'Javanese Batik', price: 8, lvl: 1, tex: 'batik', tags: { Patterned: 3, Elegant: 1, Daywear: 1 } },
  { id: 'songket', name: 'Songket', price: 26, lvl: 4, tex: 'songket', tags: { Elaborate: 2, Shimmering: 2, Formal: 2 } },
  { id: 'cloudsilk', name: 'Cloud Brocade Silk', price: 18, lvl: 2, tex: 'clouds', tags: { Elegant: 2, Patterned: 1, Formal: 1, Shimmering: 1 } },
];



export const BODY_SHAPES = [
  { id: 'classic', name: 'Classic', sh: 1, bu: 1, wa: 1, hi: 1 },
  { id: 'slender', name: 'Slender', sh: 0.95, bu: 0.9, wa: 0.9, hi: 0.9 },
  { id: 'curvy', name: 'Hourglass', sh: 1.04, bu: 1.17, wa: 1.0, hi: 1.18 },
  { id: 'pear', name: 'Pear', sh: 0.96, bu: 0.98, wa: 1.05, hi: 1.26 },
  { id: 'full', name: 'Full figure', sh: 1.1, bu: 1.27, wa: 1.36, hi: 1.3 },
  { id: 'plus', name: 'Plus size', sh: 1.2, bu: 1.5, wa: 1.72, hi: 1.6 },
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
  
  { id: 'fringe', name: 'Silk Fringe', price: 4, lvl: 3, zones: ['waist', 'hem', 'sleeves'], tags: { Playful: 1, Eclectic: 1, Glamour: 1 } },
  { id: 'smocking', name: 'Smocking', price: 5, lvl: 5, zones: ['bodice', 'waist'], tags: { Cute: 1, Daywear: 1, Elaborate: 1 } },
  { id: 'feathers', name: 'Ostrich Feathers', price: 9, lvl: 7, zones: ['neckline', 'hem', 'sleeves'], tags: { Glamour: 2, Whimsical: 2 } },
  { id: 'rhinestones', name: 'Rhinestone Chain', price: 12, lvl: 8, zones: ['neckline', 'waist', 'seams'], tags: { Shimmering: 2, Glamour: 2, Formal: 1 } },
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
  
  { id: 'vermilion', name: 'Wedding Red', hex: '#c42a2f', lvl: 2, tags: { Romantic: 1, Formal: 1, Glamour: 1 } },
  { id: 'jade', name: 'Jade', hex: '#3f9a7e', lvl: 2, tags: { Elegant: 1, Daywear: 1 } },
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
  
  { name: 'Miss Daisy Fenwick', occasion: 'the Spring Garden party', wants: ['Flowers', 'Daywear', 'Romantic'], avoid: ['Gothic'], look: 1, season: 'spring' },
  { name: 'Lady Primrose Ashby', occasion: 'the Easter bonnet parade', wants: ['Cute', 'Playful', 'Flowers'], avoid: ['Eveningwear'], look: 4, season: 'spring' },
  { name: 'Coral Bellweather', occasion: 'the seaside regatta', wants: ['Casual', 'Playful', 'Daywear'], avoid: ['Formal'], look: 5, season: 'summer' },
  { name: 'Mrs Sunniva Grey', occasion: 'a midsummer ball on the lawn', wants: ['Whimsical', 'Romantic', 'Eveningwear'], avoid: ['Professional'], look: 3, season: 'summer' },
  { name: 'Hazel Thornbury', occasion: 'the harvest dance in the tithe barn', wants: ['Casual', 'Patterned', 'Cute'], avoid: ['Glamour'], look: 0, season: 'autumn' },
  { name: 'Mistress Rowan Vesper', occasion: 'the Hallowe\'en masque', wants: ['Gothic', 'Whimsical', 'Elaborate'], avoid: ['Cute'], look: 2, season: 'autumn' },
  { name: 'Countess Ivy Frost', occasion: 'the Winter Masquerade', wants: ['Eveningwear', 'Elaborate', 'Glamour'], avoid: ['Casual'], look: 1, season: 'winter' },
  { name: 'Miss Holly Winterbourne', occasion: 'the Christmas Eve carol concert', wants: ['Elegant', 'Formal', 'Romantic'], avoid: ['Risqué'], look: 3, season: 'winter' },
  
  { name: 'The Duchess of Albury', occasion: 'a state banquet at the palace', wants: ['Formal', 'Elegant', 'Elaborate'], avoid: ['Casual'], look: 1, premium: true, minRep: 20 },
  { name: 'Signora Valentina Rossi', occasion: 'the premiere of her new film', wants: ['Glamour', 'Eveningwear', 'Romantic'], avoid: ['Simple'], look: 2, premium: true, minRep: 20 },
  { name: 'Lady Seraphina Blythe', occasion: 'her engagement portrait', wants: ['Romantic', 'Elegant', 'Flowers'], avoid: ['Gothic'], look: 3, premium: true, minRep: 45 },
  { name: 'Madame Celeste Lorraine', occasion: 'the Paris couture week', wants: ['Elaborate', 'Glamour', 'Formal'], avoid: ['Casual'], look: 5, premium: true, minRep: 80 },
  
  
  { name: 'Mrs Adaeze Okafor', occasion: "her daughter's naming ceremony", wants: ['Patterned', 'Elegant', 'Formal'], avoid: ['Risqué'], look: 6, body: 'full' },
  { name: 'Dr Imani Brooks', occasion: 'her graduation as a surgeon', wants: ['Professional', 'Elegant'], avoid: ['Playful'], look: 8, body: 'slender' },
  { name: 'Miss Zawadi Mensah', occasion: 'a jazz night at the Blue Lantern', wants: ['Glamour', 'Eveningwear', 'Shimmering'], avoid: ['Simple'], look: 7, body: 'curvy', minLvl: 3 },
  { name: 'Chioma Adeyemi', occasion: 'the summer carnival parade', wants: ['Playful', 'Patterned', 'Eclectic'], avoid: ['Gothic'], look: 7, body: 'pear', season: 'summer' },
  { name: 'Miss Ananya Iyer', occasion: "her cousin's sangeet night", wants: ['Romantic', 'Playful', 'Shimmering'], avoid: ['Professional'], look: 13, body: 'slender', minLvl: 3, garment: { slot: 'skirt', id: 'saree' } },
  { name: 'Mrs Priya Raman', occasion: 'Diwali with the whole family', wants: ['Elegant', 'Shimmering'], avoid: ['Gothic'], look: 9, body: 'curvy', minLvl: 3, season: 'autumn', garment: { slot: 'skirt', id: 'saree' } },
  { name: 'Mrs Kavita Sharma', occasion: 'a wedding reception in Jaipur', wants: ['Formal', 'Elaborate', 'Glamour'], avoid: ['Casual'], look: 10, body: 'full', minLvl: 5, garment: { slot: 'skirt', id: 'saree' } },
  { name: 'Khun Malai Srisuk', occasion: 'Songkran with her grandmother', wants: ['Daywear', 'Patterned'], avoid: ['Eveningwear'], look: 11, body: 'slender', minLvl: 2, season: 'spring', garment: { slot: 'skirt', id: 'phasin' } },
  { name: 'Khun Ploy Chaiyaporn', occasion: 'a temple wedding in Chiang Mai', wants: ['Elegant', 'Formal', 'Romantic'], avoid: ['Risqué'], look: 12, body: 'classic', minLvl: 3, garment: { slot: 'bodice', id: 'sabai' } },
  { name: 'Khun Dao Rattanakul', occasion: 'Loy Krathong night by the river', wants: ['Romantic', 'Shimmering', 'Eveningwear'], avoid: ['Casual'], look: 11, body: 'curvy', minLvl: 2, season: 'autumn', garment: { slot: 'skirt', id: 'phasin' } },
  { name: 'Ms Keisha Monroe', occasion: 'the city arts awards, where she is nominated', wants: ['Glamour', 'Elegant', 'Eveningwear'], avoid: ['Casual'], look: 8, body: 'full', premium: true, minRep: 20 },
  
  
  { name: 'Miss Lin Yue', occasion: 'the Lunar New Year banquet', wants: ['Elegant', 'Shimmering', 'Formal'], avoid: ['Casual'], look: 12, body: 'slender', minLvl: 2, season: 'winter', garment: { slot: 'bodice', id: 'qipao' } },
  { name: 'Mrs Nguyen Thu Ha', occasion: 'Tet at her mother\'s house', wants: ['Elegant', 'Formal', 'Romantic'], avoid: ['Risqué'], look: 2, body: 'classic', minLvl: 2, garment: { slot: 'skirt', id: 'aodai' } },
  { name: 'Miss Pham Lan', occasion: 'her first day teaching at the girls\' school', wants: ['Elegant', 'Professional', 'Daywear'], avoid: ['Glamour'], look: 34, body: 'slender', minLvl: 2, garment: { slot: 'skirt', id: 'aodai' } },
  { name: 'Miss Kim Seo-yeon', occasion: 'Chuseok with her grandparents', wants: ['Cute', 'Elegant', 'Romantic'], avoid: ['Risqué'], look: 34, body: 'slender', minLvl: 2, season: 'autumn', garment: { slot: 'bodice', id: 'jeogori' } },
  { name: 'Mrs Park Ji-woo', occasion: 'her son\'s first birthday, the doljanchi', wants: ['Romantic', 'Elegant', 'Formal'], avoid: ['Gothic'], look: 12, body: 'pear', minLvl: 2, garment: { slot: 'skirt', id: 'chima' } },
  { name: 'Puan Siti Aminah', occasion: 'her Hari Raya open house', wants: ['Elegant', 'Patterned', 'Formal'], avoid: ['Risqué'], look: 33, body: 'curvy', minLvl: 2, garment: { slot: 'bodice', id: 'kebaya' } },
  { name: 'Ibu Ratna Wulandari', occasion: 'Kartini Day at the Indonesian society', wants: ['Patterned', 'Daywear', 'Elegant'], avoid: ['Glamour'], look: 11, body: 'full', garment: { slot: 'skirt', id: 'sarong' } },
  { name: 'Miss Harleen Sandhu', occasion: 'her sister\'s mehndi night', wants: ['Shimmering', 'Playful', 'Elaborate'], avoid: ['Professional'], look: 9, body: 'curvy', minLvl: 3, garment: { slot: 'skirt', id: 'lehenga' } },
  { name: 'Mrs Maricel Reyes', occasion: 'the Philippine Independence Day ball', wants: ['Formal', 'Elegant', 'Elaborate'], avoid: ['Casual'], look: 11, body: 'classic', minLvl: 3, garment: { slot: 'sleeve', id: 'terno' } },
  { name: 'Khun Rin Suwannarat', occasion: 'her cousin\'s engagement in Bangkok', wants: ['Elegant', 'Shimmering', 'Formal'], avoid: ['Casual'], look: 12, body: 'slender', minLvl: 3, garment: { slot: 'bodice', id: 'sabai' } },
  { name: 'Madame Wu Yifan', occasion: 'the premiere of her Shanghai picture', wants: ['Glamour', 'Elegant', 'Shimmering'], avoid: ['Casual'], look: 2, body: 'curvy', minLvl: 2, premium: true, minRep: 20, garment: { slot: 'bodice', id: 'qipao' } },
  { name: 'Datin Nurul Aisyah', occasion: 'a royal Malay wedding reception', wants: ['Elaborate', 'Formal', 'Shimmering'], avoid: ['Risqué'], look: 33, body: 'full', minLvl: 2, premium: true, minRep: 45, garment: { slot: 'bodice', id: 'kebaya' } },
];



export const REP_GAIN = { 1: -3, 2: 0, 3: 1, 4: 3, 5: 5 };
export const REP_TIERS = [
  { at: 0, name: 'Unknown atelier' },
  { at: 10, name: 'Local favourite' },
  { at: 20, name: 'Talk of the town' },
  { at: 45, name: 'Society darling' },
  { at: 80, name: 'Couture house' },
];
export const PREMIUM_FEE = 1.5;

export const CHARITY_REP = 3;



export const NATURAL_DYES = ['ivory'];
export const DYE_PRICE = 2, RARE_DYE_PRICE = 4, RARE_DYE_LVL = 4;


export const WINDOW_WAIT = 2;


export const SALE_EVERY = 3;


export const UPGRADES = [
  { id: 'pinking', name: 'Pinking Shears', price: 35, lvl: 1, fx: { cutSlack: 2 }, blurb: 'Zig-zag blades forgive a wobble: +2 px of slack on every cut.' },
  { id: 'service', name: 'Machine Service', price: 50, lvl: 1, fx: { sewSlack: 3 }, blurb: 'Oiled, re-timed and tensioned: the seam forgives 3 px more drift.' },
  { id: 'mat', name: 'Big Cutting Mat', price: 90, lvl: 2, fx: { cutTol: 4 }, blurb: 'Room to turn the cloth: the scissors keep cutting 4 px further off the chalk.' },
  { id: 'lamp', name: 'Daylight Lamp', price: 70, lvl: 3, fx: { sewSpan: 6 }, blurb: 'You can see the chalk: stitches off the line lose accuracy more slowly.' },
  { id: 'deluxe', name: 'Electric Deluxe Machine', price: 240, lvl: 5, needs: 'service', fx: { sewSlack: 4, sewSpan: 6 }, blurb: 'A modern motor and a wide presser foot: the widest sewing tolerance.' },
];


export const ACCESSORIES = [
  { id: 'scrunchie', name: 'Scrunchie', need: 0.2, base: 3 },
  { id: 'bow', name: 'Hair Bow', need: 0.3, base: 4 },
  { id: 'pouch', name: 'Drawstring Pouch', need: 0.6, base: 7 },
  { id: 'cushion', name: 'Cushion Cover', need: 1.0, base: 11 },
];


export const ACHIEVEMENTS = [
  { id: 'first', name: 'First Stitches', desc: 'Finish your first commission.' },
  { id: 'five_star', name: 'Five Stars', desc: 'Earn a five-star verdict.' },
  { id: 'five_fives', name: 'Darling of the Season', desc: 'Earn five five-star verdicts.' },
  { id: 'ten', name: 'Busy Atelier', desc: 'Finish ten commissions.' },
  { id: 'year', name: 'All Four Seasons', desc: 'Sew through a whole year (20 commissions).' },
  { id: 'bodices', name: 'Pattern Collector', desc: 'Make a dress with every bodice.' },
  { id: 'level5', name: 'Journeywoman', desc: 'Reach level 5.' },
  { id: 'level10', name: 'Maison', desc: 'Reach level 10.' },
  { id: 'rich', name: 'Well-Heeled', desc: 'Hold £1,000 at once.' },
  { id: 'window', name: 'Window Shopper', desc: 'Sell a dress from the shop window.' },
  { id: 'scraps', name: 'Waste Not', desc: 'Sell three accessories made from scraps.' },
  { id: 'upgrade', name: 'Tools of the Trade', desc: 'Buy a workshop upgrade.' },
  { id: 'equipped', name: 'Fully Equipped', desc: 'Own every workshop upgrade.' },
  { id: 'darling', name: 'Society Darling', desc: 'Reach 45 reputation.' },
  { id: 'loyal', name: 'Old Friends', desc: 'Dress the same client three times.' },
  { id: 'kind', name: 'A Kind Needle', desc: 'Make a dress for free for someone who cannot pay.' },
  { id: 'gossip', name: 'Ear to the Ground', desc: 'Hear fifteen pieces of town gossip.' },
  { id: 'bravo', name: 'Bravo!', desc: 'Dress a singer for the opera.' },
  { id: 'noble', name: 'By Appointment', desc: "Finish a noblewoman's gown." },
  { id: 'bride', name: 'Here Comes the Bride', desc: 'Make a bride\'s gown for a church wedding.' },
  { id: 'double', name: 'Double Happiness', desc: 'Dress a bride for an Asian wedding.' },
];



export const SEASON_LENGTH = 5;
export const SEASON_BONUS = 0.15;
export const SEASONS = [
  { id: 'spring', name: 'Spring', event: 'Spring Garden', icon: '&#10047;', line: 'With the Spring Garden season upon us and every hedge in blossom,' },
  { id: 'summer', name: 'Summer', event: 'Midsummer Revels', icon: '&#9728;', line: 'The long summer evenings are here at last, and' },
  { id: 'autumn', name: 'Autumn', event: 'Harvest Balls', icon: '&#10086;', line: 'The leaves are turning and the harvest balls begin, so' },
  { id: 'winter', name: 'Winter', event: 'Winter Masquerade', icon: '&#10052;', line: 'Snow is on the lane and the Winter Masquerade approaches;' },
];



export const AUNT = {
  intro: { title: 'My dearest,', body: 'The shop is yours now: my old machine, a few bolts of cotton and a desk that is never short of letters. Each client writes asking for a dress with a certain <b>feel</b> - cute, elegant, gothic. Choose a letter from <b>Commissions</b>, and I shall leave a note at every step the first time you reach it. Spend what you earn on finer cloth at the <b>Fabric Market</b>.' },
  sketch: { title: 'The sketch book', body: 'Every bodice, collar, sleeve, skirt, fabric and dye carries <b>tags</b> - hover over one to read them. Fill the meters on the left until each <b>&#9829;</b> reaches its gold mark, and keep the <b>&#10005;</b> tags out of the red. Mind the metres of cloth: you cannot draft a pattern you have no fabric for. Arrow keys and <kbd>Enter</kbd> work too.' },
  cut: { title: 'At the cutting table', body: 'Press on the <b style="color:#c0392b">red dot</b> and draw the scissors along the chalk line all the way round. Neat cuts make a neat dress; wander off the line and it will show at the hem. If your hand is tired, the apprentice will cut for you - adequately.' },
  sew: { title: 'The sewing machine', body: 'Press <kbd>W</kbd> to start her (or hold the mouse), <kbd>S</kbd> to slow down. Steer with the mouse or <kbd>A</kbd> <kbd>D</kbd> to keep the chalk seam under the needle - the fabric drags a little, as real cloth does. She will run out of bobbin thread once; click the bobbin (or press <kbd>R</kbd>) to wind a fresh one.',
    touch: 'Hold a finger on the cloth to start her, and drag it left and right to keep the chalk seam under the needle - the fabric drags a little, as real cloth does. She will run out of bobbin thread once; tap the bobbin to wind a fresh one.' },
  embellish: { title: 'Embellishing', body: 'One pack of trim dresses one area. Lace and pearls add romance and poise, but pile on too much and a gown becomes <i>unwearable</i>. Watch the meters, and buy more trim at the market.' },
  reveal: { title: 'The reveal', body: 'Your client decides how well you matched her wishes; your cutting and sewing decide the craft. Loose threads and a wavering hem cost you. A perfect match, finely made, often earns a tip. Collect your payment and a fresh letter will arrive.' },
};
