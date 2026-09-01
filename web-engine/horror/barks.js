























































export const XANDER_LINES = Object.freeze([
  
  { id: 'rusty', trigger: 'firstShot', once: 1, text: 'Oh god. I am rusty.' },
  { id: 'notagun', trigger: 'firstShot', once: 1, text: 'This is for fence posts. I want that noted.' },

  
  { id: 'see1', trigger: 'firstSight', once: 1, text: 'No. No, that is not a chicken.' },
  { id: 'see2', trigger: 'sight', text: 'Another one. Marvellous.' },
  { id: 'see3', trigger: 'sight', text: 'Stay there. Stay - no, of course not.' },
  { id: 'see4', trigger: 'sight', text: 'I fed you. I actually fed you.' },
  { id: 'see5', trigger: 'sight', text: 'Somebody else should be here.' },
  { id: 'see6', trigger: 'sight', text: 'Twelve years of night shifts for this.' },

  
  { id: 'kill1', trigger: 'kill', text: 'Sorry. Not sorry.' },
  { id: 'kill2', trigger: 'kill', text: 'That is coming out of my wages somehow.' },
  { id: 'kill3', trigger: 'kill', text: 'Livestock loss. Form nine.' },
  { id: 'kill4', trigger: 'kill', text: 'Do not make me do that again.' },
  { id: 'kill5', trigger: 'kill', weight: 0.5, text: 'I liked this job. Past tense.' },

  
  { id: 'hurt1', trigger: 'hurt', text: 'Get OFF -' },
  { id: 'hurt2', trigger: 'hurt', text: 'That is going to need a tetanus.' },
  { id: 'hurt3', trigger: 'hurt', text: 'Nobody is coming. I checked.' },
  { id: 'low1', trigger: 'lowHealth', text: 'Right. Right. I am fine. I am fine.' },
  { id: 'low2', trigger: 'lowHealth', text: 'I am not paid enough to bleed.' },

  
  { id: 'ammo1', trigger: 'lowAmmo', text: 'Running dry. Of course I am.' },
  { id: 'ammo2', trigger: 'lowAmmo', text: 'Who signs off on one crate?' },
  { id: 'empty1', trigger: 'empty', text: 'Empty. Brilliant. Thank you.' },

  
  { id: 'safe1', trigger: 'safe', once: 1, text: 'A door that shuts. I could cry.' },
  { id: 'safe2', trigger: 'safe', text: 'Two minutes. Just two minutes.' },
  { id: 'safe3', trigger: 'safe', text: 'Nobody knows I am down here.' },

  
  { id: 'lift1', trigger: 'lift', once: 1, text: 'Down. It only ever goes down.' },
  { id: 'lift2', trigger: 'lift', text: 'Seven seconds of nothing trying to eat me.' },
  { id: 'lift3', trigger: 'lift', text: 'They fixed the music. Not the doors. The music.' },

  
  
  
  
  
  { id: 'idle1', trigger: 'idle', text: 'Why is it me. Why is it always me.' },
  { id: 'idle2', trigger: 'idle', text: 'Doyle had the pass card. Doyle went home.' },
  { id: 'idle3', trigger: 'idle', text: 'The training video was eleven minutes long.' },
  { id: 'idle4', trigger: 'idle', text: 'I am a farmhand. That is the whole of it.' },
  { id: 'idle5', trigger: 'idle', text: 'Somebody in an office decided this was fine.' },
  { id: 'idle6', trigger: 'idle', text: 'They cut the safety budget. Twice.' },
  { id: 'idle7', trigger: 'idle', text: 'I have a flat. I would like to see it again.' },
  { id: 'idle8', trigger: 'idle', text: 'Not a hero. Just the last one holding a key.' },
  { id: 'idle9', trigger: 'idle', text: 'Everyone who could have stopped this got a bonus.' },
  { id: 'idle10', trigger: 'idle', text: 'If anything down here is listening: I resign.' },
  { id: 'idle11', trigger: 'idle', text: 'It smells like the feed store. It should not.' },
  { id: 'idle12', trigger: 'idle', text: 'Whatever this is, it is above my pay grade.' },
]);















export const PA_LINES = Object.freeze([
  { id: 'pa1', text: 'ATTENTION. All personnel report to muster. Thank you.' },
  { id: 'pa2', text: 'ATTENTION. Livestock deck sealed pending inspection.' },
  { id: 'pa3', text: 'Reminder: hand contact with stock is not permitted.' },
  { id: 'pa4', text: 'ATTENTION. Air handling is operating normally.' },
  { id: 'pa5', text: 'Please report any unusual behaviour to your supervisor.' },
  { id: 'pa6', text: 'ATTENTION. The medical bay is unstaffed this rotation.' },
  { id: 'pa7', text: 'Your safety is our second priority.' },
  { id: 'pa8', text: 'ATTENTION. Feed cycle complete. Feed cycle complete.' },
  { id: 'pa9', text: '- and we thank you for another productive season.' },
  { id: 'pa10', text: 'ATTENTION. Do not approach the pens without a partner.' },
]);

export const BARKS = Object.freeze({
  
  
  hold: 3.4,
  
  
  gap: 2.2,
  
  
  perLine: 150,
  
  
  idleEvery: [42, 88],
  
  
  combatEvery: 11,
});


export function createBarks(seed = 1) {
  let s = seed >>> 0;
  const rnd = () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    rnd,
    said: new Map(),      
    fired: new Set(),     
    t: 0,
    quietUntil: 0,
    combatUntil: 0,
    idleAt: BARKS.idleEvery[0],
    current: null,        
  };
}








export function say(b, trigger, { who = 'xander', force = false } = {}) {
  if (!force && b.t < b.quietUntil) return null;
  const pool = (who === 'pa' ? PA_LINES : XANDER_LINES)
    .filter((l) => (who === 'pa' ? true : l.trigger === trigger))
    .filter((l) => !(l.once && b.fired.has(l.id)))
    .filter((l) => (b.t - (b.said.get(l.id) ?? -1e9)) > BARKS.perLine);
  if (!pool.length) return null;

  
  
  
  const onces = pool.filter((l) => l.once);
  
  
  
  
  
  
  const fresh = pool.filter((l) => !b.said.has(l.id));
  let from;
  if (onces.length) from = onces;
  else if (fresh.length) from = fresh;
  else {
    const oldest = Math.min(...pool.map((l) => b.said.get(l.id)));
    from = pool.filter((l) => b.said.get(l.id) === oldest);
  }
  const total = from.reduce((a, l) => a + (l.weight ?? 1), 0);
  let r = b.rnd() * total;
  let pick = from[from.length - 1];
  for (const l of from) { r -= (l.weight ?? 1); if (r <= 0) { pick = l; break; } }

  b.said.set(pick.id, b.t);
  if (pick.once) b.fired.add(pick.id);
  b.quietUntil = b.t + BARKS.hold + BARKS.gap;
  b.current = { text: pick.text, until: b.t + BARKS.hold, who };
  return pick;
}







export function stepBarks(b, dt, { busy = false } = {}) {
  b.t += Math.max(0, dt);
  if (b.current && b.t > b.current.until) b.current = null;
  if (busy) {
    
    
    b.idleAt = Math.max(b.idleAt, b.t + 12);
    return null;
  }
  if (b.t < b.idleAt) return null;
  const [lo, hi] = BARKS.idleEvery;
  b.idleAt = b.t + lo + b.rnd() * (hi - lo);
  return say(b, 'idle');
}


export function combatSay(b, trigger) {
  if (b.t < b.combatUntil) return null;
  const line = say(b, trigger);
  if (line) b.combatUntil = b.t + BARKS.combatEvery;
  return line;
}


export function currentBark(b) {
  return b.current && b.t <= b.current.until ? b.current : null;
}
