






export const ONE_SHOTS = ['opener', 'bossOpener', 'tellScrape', 'tellPing', 'tellSweet', 'tellFists', 'tellClick', 'lanternCatch', 'xpFill', 'levelUp', 'itemPop', 'mirrorTurn', 'raftPole', 'tellHiss', 'iceCrack', 'thaw', 'knightLaugh',
  
  'cartGo', 'cartStop', 'leverThrow', 'lavaSnap', 'basaltSink', 'valveTurn'];




export const COMBAT = ['hit', 'crit', 'miss', 'parry', 'dash', 'bolt', 'burst', 'heal', 'guard', 'rage', 'beam', 'flurry', 'slam', 'trap', 'drain', 'hex', 'shield'];



export const TAKES = { stepGrass: 4, stepSand: 4, stepDirt: 4, stepStone: 4, stepSoft: 4, voiceKid: 3, voiceAdult: 3, voiceDachi: 3, voiceBoss: 3, thought: 2 };
export const DIALOG = ['slap', 'pencil', 'thinkIn', 'narrateIn', 'bossSting', 'prompt'];

export const INTRO = ['titleSlam', 'spiralOpen', 'grab', 'pullIn', 'windRush', 'screech', 'swoop', 'wingFlap', 'landThud', 'doorsBang'];


export function loadRecorded(sfx, build, baseURI) {
  const q = build && build !== 'dev' ? '?v=' + encodeURIComponent(build) : '';
  const url = (n) => new URL('assets/sfx/' + n + '.mp3' + q, baseURI).href;
  for (const n of [...ONE_SHOTS, ...COMBAT, ...DIALOG, ...INTRO]) sfx.load(n, url(n));
  for (const [n, k] of Object.entries(TAKES)) {
    const list = [];
    for (let i = 1; i <= k; i++) { sfx.load(n + i, url(n + i)); list.push(n + i); }
    sfx.takes(n, list);
  }
}
