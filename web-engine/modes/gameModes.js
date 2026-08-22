



















export const DEFAULT_MODE = 'ctf';

export const MODES = Object.freeze({

  ctf: {
    id: 'ctf',
    name: 'Capture the Flag',
    short: 'CTF',
    emoji: '🚩',
    blurb: 'Take the enemy flag back to your own stand. First to 5.',
    scoring: 'captures',
    winScore: 5,
    flags: 'both',        
    anagram: true,        
    scoreLabel: 'FLAGS',
    
    hint: 'Grab the enemy flag — bring it home to score',
  },

  tdm: {
    id: 'tdm',
    name: 'Team Deathmatch',
    short: 'TDM',
    emoji: '💥',
    blurb: 'No flags, no objective, no excuses. First team to 30 kills.',
    scoring: 'kills',
    
    
    winScore: 30,
    flags: 'none',
    anagram: true,
    scoreLabel: 'KILLS',
    hint: 'Kill the other team. That is the whole plan',
  },

  koth: {
    id: 'koth',
    name: 'King of the Hill',
    short: 'KOTH',
    emoji: '👑',
    blurb: 'Hold the centre. You only score while your team is up there '
         + 'ALONE — one enemy on the hill stops the clock for everyone.',
    scoring: 'hold',
    winScore: 90,          
    flags: 'none',
    anagram: true,
    scoreLabel: 'SECONDS',
    hint: 'Stand on the centre — and be the only team up there',
    
    
    hillRadius: 6.5,
  },

  oneflag: {
    id: 'oneflag',
    name: 'One Flag',
    short: '1FLAG',
    emoji: '🏴',
    blurb: 'A single neutral flag in the middle. Carry it into the ENEMY '
         + 'base. Everyone wants the same thing, so everyone is in one fight.',
    scoring: 'captures',
    
    
    winScore: 3,
    flags: 'neutral',      
    anagram: true,
    scoreLabel: 'RUNS',
    hint: 'One flag, in the middle. Take it to THEIR base',
  },
});

export const MODE_IDS = Object.freeze(Object.keys(MODES));

export function getMode(id) {
  return MODES[id] ?? MODES[DEFAULT_MODE];
}









export function killScores(mode, killerTeam, victimTeam) {
  if (mode.scoring !== 'kills') return null;
  if (!killerTeam || !victimTeam) return null;
  if (killerTeam === victimTeam) return null;   
  return killerTeam;
}







export function hillOwner(mode, occupants) {
  if (mode.scoring !== 'hold') return null;
  const red = occupants.filter((o) => o === 'red').length;
  const blue = occupants.filter((o) => o === 'blue').length;
  if (red > 0 && blue === 0) return 'red';
  if (blue > 0 && red === 0) return 'blue';
  return null;   
}




export function onHill(mode, pos, centre) {
  if (!pos || !centre) return false;
  const r = mode.hillRadius ?? 6.5;
  return Math.hypot(pos.x - centre.x, pos.z - centre.z) <= r;
}


export function winner(mode, scores) {
  const target = mode.winScore;
  if (scores.red >= target && scores.red > scores.blue) return 'red';
  if (scores.blue >= target && scores.blue > scores.red) return 'blue';
  return null;
}




export function anagramDue(mode, scores) {
  if (!mode.anagram) return false;
  return winner(mode, scores) !== null;
}
