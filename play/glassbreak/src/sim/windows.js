




















export const COLS = 12;
export const MAX_ROWS = 14;

const W = (o) => Object.freeze({ slide: [], spawns: [], boss: null, echo: false, dusk: 4, refire: null, surge: null, ...o });

export const ACTS = Object.freeze([
  { id: 'lantern-row', name: 'Lantern Row', tint: 0 },
  { id: 'bell-quarter', name: 'Bell Quarter', tint: 1 },
  { id: 'mirror-nave', name: 'Mirror Nave', tint: 2 },
  { id: 'kiln-works', name: 'Kiln Works', tint: 0 },
  { id: 'sun-spire', name: 'Sun Spire', tint: 1 },
]);

export const WINDOWS = Object.freeze([
  
  W({ act: 0, name: 'First Light', dusk: 0, rows: [
    '............',
    '..rrrrrrrr..',
    '..r......r..',
    '..r.rrrr.r..',
    '..r......r..',
    '..rrrrrrrr..',
  ] }),
  W({ act: 0, name: 'Three Colours', dusk: 0, rows: [
    'rrrrrrrrrrrr',
    'gggggggggggg',
    'bbbbbbbbbbbb',
    'rrrr.gg.bbbb',
    '....*..*....',
  ] }),
  W({ act: 0, name: 'The Dusk Comes', dusk: 3, rows: [
    '.r.g.b.r.g.b',
    'rgbrgbrgbrgb',
    'bgrbgrbgrbgr',
    '.b.r.g.b.r.g',
    'gg..rr..bb..',
    '....S..S....',
  ] }),
  
  
  W({ act: 0, name: 'Solderers', dusk: 3, spawns: [['leadling', 4, 12, 2]], rows: [
    '..LRRRRRRL..',
    '..GrrggbbG..',
    '..GrrggbbG..',
    '..LBB**BBL..',
    'rr........bb',
    'gg........gg',
  ] }),
  W({ act: 0, name: 'Bead Market', dusk: 4, rows: [
    '*.*.*..*.*.*',
    'RRRRRRRRRRRR',
    'g.g.g.g.g.g.',
    '.b.b.b.b.b.b',
    'GGGGGGGGGGGG',
    '..r*r..r*r..',
  ] }),
  W({ act: 0, name: 'Swaying Lamps', dusk: 4, slide: [[1, 24], [3, -20], [5, 28]], rows: [
    '....rrrr....',
    '...gggggg...',
    '....bbbb....',
    '..rrrrrrr...',
    '....gggg....',
    '..bb*bb*bb..',
  ] }),
  W({ act: 0, name: 'Moth Hour', dusk: 4, spawns: [['moth', 5, 9, 3], ['leadling', 14, 16, 1]], rows: [
    'b..........b',
    'bb..rrrr..bb',
    'bbb.rSSr.bbb',
    'bb..rrrr..bb',
    'b..gggggg..b',
    '...g*..*g...',
  ] }),
  W({ act: 0, name: 'Lamplit Street', dusk: 4, slide: [[0, 18]], spawns: [['leadling', 6, 14, 1], ['moth', 9, 11, 2]], rows: [
    '...RRRRRR...',
    'XX.r.g.b.rXX',
    'rr.r.g.b.r.g',
    'GGGGGGGGGGGG',
    'b.b.b**b.b.b',
    'rrrr....gggg',
    '....bbbb....',
  ] }),
  W({ act: 0, name: 'The Rose Warden', dusk: 3, boss: 'rose', spawns: [['leadling', 12, 18, 2]], rows: [
    'XX........XX',
    'r..........b',
    '............',
    '............',
    '............',
    '..g......g..',
  ] }),

  
  W({ act: 1, name: 'Belfry Steps', dusk: 4, spawns: [['bell', 3, 30, 1]], rows: [
    'GGGGGGGGGGGG',
    'g.g.g.g.g.g.',
    'RRRRRR......',
    '......BBBBBB',
    'r.r.r*b.b.b.',
    'bbbbbbrrrrrr',
  ] }),
  W({ act: 1, name: 'Falling Shards', dusk: 4, spawns: [['shardling', 4, 14, 2]], rows: [
    '.LLLLLLLLLL.',
    '.L*gggggg*L.',
    '.LbbbbbbbbL.',
    '.LLLL..LLLL.',
    'rr.rr..rr.rr',
    'GG.GG..GG.GG',
  ] }),
  W({ act: 1, name: 'Ring the Hour', dusk: 5, slide: [[2, 30], [4, -30]], spawns: [['bell', 6, 24, 2]], rows: [
    'RRRRRRRRRRRR',
    'b.b.b.b.b.b.',
    '...gggggg...',
    'S..........S',
    '...rrrrrr...',
    'GGG*GGGG*GGG',
  ] }),
  W({ act: 1, name: 'Copper Roofs', dusk: 5, spawns: [['shardling', 3, 12, 2], ['leadling', 8, 14, 2]], rows: [
    '.....RR.....',
    '....RRRR....',
    '...RRbbRR...',
    '..RRbbbbRR..',
    '.RRgg**ggRR.',
    'RRgggggggggR',
    'L..L..L..L..',
  ] }),
  W({ act: 1, name: 'Bellrope Bridge', dusk: 5, slide: [[0, 20], [1, -20], [2, 20], [3, -20]], spawns: [['moth', 6, 10, 2]], rows: [
    '..bbbbbbbb..',
    '..gggggggg..',
    '..rrrrrrrr..',
    '..bbbb*bbb..',
    'XX........XX',
    '..GGGGGGGG..',
  ] }),
  W({ act: 1, name: 'The Bell Choir', dusk: 4, spawns: [['bell', 2, 20, 3], ['shardling', 10, 15, 1]], rows: [
    'r.g.b.r.g.b.',
    'BBBBBBBBBBBB',
    '.r.g.b.r.g.b',
    'GGGGG**GGGGG',
    'rgbrgbrgbrgb',
  ] }),
  W({ act: 1, name: 'Shard Storm', dusk: 6, spawns: [['shardling', 2, 8, 3], ['leadling', 5, 12, 2]], rows: [
    'b.b.b..b.b.b',
    '.R.R.SS.R.R.',
    'g.g.g..g.g.g',
    '.B.B.**.B.B.',
    'r.r.r..r.r.r',
    '.G.G....G.G.',
  ] }),
  W({ act: 1, name: 'Midnight Peal', dusk: 5, slide: [[3, 26]], spawns: [['bell', 4, 22, 1], ['shardling', 6, 11, 2], ['moth', 12, 12, 2]], rows: [
    'LLLLLLLLLLLL',
    'RRRRRRRRRRRR',
    'GGGGGGGGGGGG',
    '...bb**bb...',
    'BBBBBBBBBBBB',
    'r..r..r..r..',
  ] }),
  W({ act: 1, name: 'The Bellwright', dusk: 3, boss: 'bell', spawns: [['shardling', 10, 16, 2]], rows: [
    '............',
    'G..........G',
    '............',
    '............',
    '.r........b.',
  ] }),

  
  W({ act: 2, name: 'The Other Side', dusk: 3, echo: true, rows: [
    'MMMM....MMMM',
    'bbbbbbbbbbbb',
    'gg..gggg..gg',
    'rrrrrr*rrrrr',
    '............',
  ] }),
  W({ act: 2, name: 'Wardens of Glass', dusk: 4, spawns: [['warden', 3, 14, 2]], rows: [
    'MM.MM..MM.MM',
    'RRRRRRRRRRRR',
    'b.b.b**b.b.b',
    'GGGGGGGGGGGG',
    'r..r..r..r..',
  ] }),
  W({ act: 2, name: 'Hall of Echoes', dusk: 4, echo: true, slide: [[2, 22], [4, -22]], spawns: [['moth', 7, 12, 2]], rows: [
    'M.M.M..M.M.M',
    'BBBBBBBBBBBB',
    '...gggggg...',
    'SS........SS',
    '...rrrrrr...',
    '*..........*',
  ] }),
  W({ act: 2, name: 'Silver Maze', dusk: 4, spawns: [['warden', 4, 16, 1], ['leadling', 6, 12, 2]], rows: [
    'XMMMMMMMMMMX',
    'X..r.g.b...X',
    'XMMMM..MMMMX',
    'X.b.g.r.g..X',
    'XMMM.**.MMMX',
    '..rrrrrrrr..',
  ] }),
  W({ act: 2, name: 'Reflections', dusk: 5, echo: true, spawns: [['shardling', 6, 14, 1]], rows: [
    'rgbrgbrgbrgb',
    'MMMMMMMMMMMM',
    'GGGG*GG*GGGG',
    'b.b.b..b.b.b',
    'RRRRRRRRRRRR',
  ] }),
  W({ act: 2, name: 'Vesper\'s Gallery', dusk: 5, slide: [[0, 30], [2, -30], [4, 30]], spawns: [['warden', 5, 15, 2], ['moth', 8, 10, 2]], rows: [
    '...MMMMMM...',
    '..rrrrrrrr..',
    '...MMMMMM...',
    '..gggg*ggg..',
    '...MMMMMM...',
    '..bbbbbbbb..',
  ] }),
  W({ act: 2, name: 'Glass Twins', dusk: 5, echo: true, spawns: [['warden', 4, 18, 1], ['leadling', 9, 14, 2]], rows: [
    'RRRRR..BBBBB',
    'R...R..B...B',
    'R.S.R..B.S.B',
    'R...R..B...B',
    'RRRRR**BBBBB',
  ] }),
  W({ act: 2, name: 'The Long Nave', dusk: 6, spawns: [['warden', 2, 12, 2], ['shardling', 6, 12, 2], ['moth', 10, 10, 2]], rows: [
    'M..........M',
    'MbbbbbbbbbbM',
    'MggggggggggM',
    'MrrrrrrrrrrM',
    'MBBBB**BBBBM',
    'MGGGGGGGGGGM',
    'M..........M',
  ] }),
  W({ act: 2, name: 'The Abbess\'s Echo', dusk: 3, boss: 'echo', echo: true, spawns: [['warden', 12, 18, 1]], rows: [
    '............',
    'M..........M',
    '............',
    '............',
    '..b......r..',
  ] }),

  
  W({ act: 3, name: 'Hot Glass', dusk: 6, spawns: [['moth', 3, 6, 4]], rows: [
    'rrrrrrrrrrrr',
    'RRRRRRRRRRRR',
    'r.r.r**r.r.r',
    'LLLL....LLLL',
    'gggggggggggg',
  ] }),
  W({ act: 3, name: 'Furnace Row', dusk: 7, slide: [[1, 34], [3, -34]], spawns: [['moth', 4, 7, 3], ['leadling', 6, 12, 2]], rows: [
    'LLLLLLLLLLLL',
    '...rrrrrr...',
    'GGGGGGGGGGGG',
    '...bb**bb...',
    'RRRRRRRRRRRR',
  ] }),
  W({ act: 3, name: 'Bellows', dusk: 6, spawns: [['bell', 3, 18, 2], ['moth', 6, 8, 3]], rows: [
    'X.X.X.X.X.X.',
    'rrrrrrrrrrrr',
    '.g.g.g.g.g.g',
    'BBBBB**BBBBB',
    'S..........S',
    'rrrrrrrrrrrr',
  ] }),
  W({ act: 3, name: 'Slag Fall', dusk: 5, spawns: [['shardling', 2, 9, 3], ['moth', 8, 9, 2]], rows: [
    'LL..LLLL..LL',
    'Lr..rRRr..rL',
    'Lg..gGGg..gL',
    'Lb..b**b..bL',
    'LL..LLLL..LL',
  ] }),
  W({ act: 3, name: 'Kiln Doors', dusk: 5, refire: [14, 20], slide: [[0, 26], [1, -26], [2, 26]], spawns: [['warden', 4, 14, 2], ['moth', 6, 8, 3]], rows: [
    '..RRRRRRRR..',
    '..GGGGGGGG..',
    '..BBBBBBBB..',
    'XX..*..*..XX',
    'rrrggggbbbrr',
  ] }),
  W({ act: 3, name: 'Ember Swarm', dusk: 5, spawns: [['moth', 2, 4, 6], ['leadling', 9, 12, 2]], rows: [
    'g.r.b.g.r.b.',
    '.b.g.r.b.g.r',
    'RRRRRSSRRRRR',
    '.r.b.g.r.b.g',
    'BBBBB**BBBBB',
  ] }),
  W({ act: 3, name: 'Molten Lead', dusk: 5, refire: [8, 14], spawns: [['leadling', 3, 9, 2], ['shardling', 6, 12, 2]], rows: [
    'LLLLLLLLLLLL',
    'L.rr.gg.bb.L',
    '.LL.L**L.LL.',
    'L.bb.rr.gg.L',
    '.LLLLLLLLLL.',
  ] }),
  W({ act: 3, name: 'Last Shift', dusk: 5, refire: [10, 18], slide: [[2, 30]], spawns: [['moth', 3, 7, 3], ['warden', 9, 16, 1], ['shardling', 12, 12, 2]], rows: [
    'RRRRRRRRRRRR',
    'GGGGGGGGGGGG',
    '..bbb**bbb..',
    'BBBBBBBBBBBB',
    'r.g.b.r.g.b.',
    'LLL......LLL',
  ] }),
  W({ act: 3, name: 'The Kiln Mother', dusk: 4, boss: 'kiln', spawns: [['moth', 6, 7, 4]], rows: [
    '............',
    'L..........L',
    '............',
    '............',
    '..r..g..b...',
  ] }),

  
  W({ act: 4, name: 'Spire Gate', dusk: 6, spawns: [['leadling', 2, 9, 3], ['warden', 6, 15, 1]], rows: [
    'XXXXX..XXXXX',
    'RRRRRSSRRRRR',
    'GGGGG**GGGGG',
    'BBBBBBBBBBBB',
    'r.g.b..b.g.r',
  ] }),
  W({ act: 4, name: 'Stair of Panes', dusk: 7, slide: [[0, 20], [1, -24], [2, 28], [3, -32]], spawns: [['moth', 4, 7, 3], ['shardling', 8, 12, 2]], rows: [
    'rr..........',
    'ggggg.......',
    'bbbbbbbb....',
    'RRRRRRRRRRR.',
    '*..........*',
  ] }),
  W({ act: 4, name: 'Choir Loft', dusk: 7, echo: true, spawns: [['bell', 3, 20, 2], ['moth', 7, 9, 2]], rows: [
    'MMMMMMMMMMMM',
    'r.g.b.r.g.b.',
    'GGGGG**GGGGG',
    '.b.r.g.b.r.g',
    'RRRRRRRRRRRR',
  ] }),
  W({ act: 4, name: 'Stolen Noon', dusk: 8, surge: [8, 16, 1], spawns: [['leadling', 2, 8, 3], ['shardling', 5, 10, 2], ['warden', 9, 14, 1]], rows: [
    '....SSSS....',
    '..SrrrrrrS..',
    '.SggggggggS.',
    '.SbbbbbbbbS.',
    '..SRR**RRS..',
    '....SSSS....',
  ] }),
  W({ act: 4, name: 'The Long Climb', dusk: 6, surge: [9, 18, 1], slide: [[1, 30], [3, -30], [5, 30]], spawns: [['moth', 2, 5, 5], ['bell', 8, 22, 1]], rows: [
    'LLLLLLLLLLLL',
    '..rrrrrrrr..',
    'GGGGGGGGGGGG',
    '..bbbbbbbb..',
    'RRRRR**RRRRR',
    '..gggggggg..',
  ] }),
  W({ act: 4, name: 'Mirror Crown', dusk: 8, echo: true, spawns: [['warden', 3, 12, 2], ['shardling', 6, 10, 2]], rows: [
    'M.M.M.M.M.M.',
    'BBBBBBBBBBBB',
    '.M.M.**.M.M.',
    'GGGGGGGGGGGG',
    'rrrrrrrrrrrr',
  ] }),
  W({ act: 4, name: 'Everything Burns', dusk: 5, spawns: [['moth', 3, 6, 3], ['leadling', 6, 12, 1], ['shardling', 6, 10, 2], ['bell', 10, 24, 1]], rows: [
    'RRRRRRRRRRRR',
    'GGGGGGGGGGGG',
    'BBBBBBBBBBBB',
    'r*g*b*r*g*b*',
    'LLLL....LLLL',
  ] }),
  W({ act: 4, name: 'The Last Window', dusk: 7, surge: [10, 18, 2], slide: [[2, 36]], spawns: [['warden', 2, 12, 2], ['moth', 4, 6, 4], ['leadling', 6, 10, 3]], rows: [
    'XXXX.SS.XXXX',
    'RRRRRRRRRRRR',
    '...gg**gg...',
    'BBBBBBBBBBBB',
    'rrrrrrrrrrrr',
    'GGGGGGGGGGGG',
  ] }),
  W({ act: 4, name: 'Vesper, the Glass Abbess', dusk: 4, boss: 'vesper', spawns: [['leadling', 10, 14, 2], ['moth', 14, 10, 3]], rows: [
    'S..........S',
    '............',
    '............',
    '............',
    '.r..g..b..r.',
  ] }),
]);


export const actStart = (act) => WINDOWS.findIndex((w) => w.act === act);
