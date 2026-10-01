

















































































import { actFor } from './acts.js';











export const XANDER_LINES = Object.freeze([
  
  { id: 'rusty', trigger: 'firstShot', once: 1, text: 'Oh god. I am rusty.' },
  { id: 'notagun', trigger: 'firstShot', once: 1, text: 'This is for fence posts. I want that noted.' },
  { id: 'nocatch', trigger: 'firstShot', once: 1, text: 'Safety catch. There is no safety catch.' },

  
  { id: 'see1', trigger: 'firstSight', once: 1, text: 'No. No, that is not a chicken.' },
  { id: 'see2', trigger: 'sight', text: 'Another one. Marvellous.' },
  { id: 'see3', trigger: 'sight', text: 'Stay there. Stay - no, of course not.' },
  { id: 'see4', trigger: 'sight', text: 'I fed you. I actually fed you.' },
  { id: 'see5', trigger: 'sight', text: 'Somebody else should be here.' },
  { id: 'see6', trigger: 'sight', text: 'Twelve years of night shifts for this.' },
  { id: 'see7', trigger: 'sight', text: 'That one has a tag. Pen four. I know that one.' },
  { id: 'see8', trigger: 'sight', text: 'It is looking at the gun. It knows what the gun is.' },
  { id: 'see9', trigger: 'sight', text: 'Keep coming. Save me the walk.' },
  { id: 'see10', trigger: 'sight', text: 'That is not how legs bend.' },
  { id: 'see11', trigger: 'sight', text: 'Right. Right then.' },
  { id: 'see12', trigger: 'sight', text: 'Bigger than the last one. They keep being bigger.' },
  { id: 'see13', trigger: 'sight', text: 'I signed for that animal. Personally.' },
  { id: 'see14', trigger: 'sight', text: 'Do not run at me. Do not - fine.' },

  
  { id: 'kill1', trigger: 'kill', text: 'Sorry. Not sorry.' },
  { id: 'kill2', trigger: 'kill', text: 'That is coming out of my wages somehow.' },
  { id: 'kill3', trigger: 'kill', text: 'Livestock loss. Form nine.' },
  { id: 'kill4', trigger: 'kill', text: 'Do not make me do that again.' },
  { id: 'kill5', trigger: 'kill', weight: 0.5, text: 'I liked this job. Past tense.' },
  { id: 'kill6', trigger: 'kill', text: 'Stay down. Just stay down.' },
  { id: 'kill7', trigger: 'kill', text: 'One more for the incinerator.' },
  { id: 'kill8', trigger: 'kill', text: 'Head office can count them. I am done counting.' },
  { id: 'kill9', trigger: 'kill', text: 'That was a good bird, once.' },
  { id: 'kill10', trigger: 'kill', text: 'Down. Good. Down is good.' },
  { id: 'kill11', trigger: 'kill', text: 'Add it to the list. There is a list now.' },
  { id: 'kill12', trigger: 'kill', weight: 0.6, text: 'I used to name them. I have stopped.' },

  
  { id: 'hurt1', trigger: 'hurt', text: 'Get OFF -' },
  { id: 'hurt2', trigger: 'hurt', text: 'That is going to need a tetanus.' },
  { id: 'hurt3', trigger: 'hurt', text: 'Nobody is coming. I checked.' },
  { id: 'hurt4', trigger: 'hurt', text: 'Through the shirt. Through the actual shirt.' },
  { id: 'hurt5', trigger: 'hurt', text: 'Not the leg. I need the leg.' },
  { id: 'hurt6', trigger: 'hurt', text: 'Get off me. Get off, get -' },
  { id: 'hurt7', trigger: 'hurt', text: 'Right. That one I felt.' },
  { id: 'hurt8', trigger: 'hurt', text: 'Teeth. It has teeth now.' },
  { id: 'low1', trigger: 'lowHealth', text: 'Right. Right. I am fine. I am fine.' },
  { id: 'low2', trigger: 'lowHealth', text: 'I am not paid enough to bleed.' },
  { id: 'low3', trigger: 'lowHealth', text: 'Medical bay is unstaffed. Of course it is.' },
  { id: 'low4', trigger: 'lowHealth', text: 'That is a lot of me on the floor.' },
  { id: 'low5', trigger: 'lowHealth', text: 'Keep walking. Walking is free.' },
  { id: 'low6', trigger: 'lowHealth', text: 'If I sit down I will not get up.' },

  
  { id: 'ammo1', trigger: 'lowAmmo', text: 'Running dry. Of course I am.' },
  { id: 'ammo2', trigger: 'lowAmmo', text: 'Who signs off on one crate?' },
  { id: 'ammo3', trigger: 'lowAmmo', text: 'Count them. Count them again. Same number.' },
  { id: 'ammo4', trigger: 'lowAmmo', text: 'Requisition form. Two weeks. Marvellous.' },
  { id: 'ammo5', trigger: 'lowAmmo', text: 'Doyle had the spare crate. Doyle went home.' },
  { id: 'empty1', trigger: 'empty', text: 'Empty. Brilliant. Thank you.' },
  { id: 'empty2', trigger: 'empty', text: 'Click. That is the whole noise now. Click.' },
  { id: 'empty3', trigger: 'empty', text: 'Nothing. It makes a nothing noise.' },

  
  { id: 'safe1', trigger: 'safe', once: 1, text: 'A door that shuts. I could cry.' },
  { id: 'safe2', trigger: 'safe', text: 'Two minutes. Just two minutes.' },
  { id: 'safe3', trigger: 'safe', text: 'Nobody knows I am down here.' },
  { id: 'safe4', trigger: 'safe', text: 'A chair. There is a chair. I am having the chair.' },
  { id: 'safe5', trigger: 'safe', text: 'The kettle works. The kettle. Not the doors.' },
  { id: 'safe6', trigger: 'safe', text: 'Somebody left their lunch. Tuesday, by the smell.' },
  { id: 'safe7', trigger: 'safe', text: 'Do not fall asleep. Do not - do not fall asleep.' },
  { id: 'safe8', trigger: 'safe', text: 'There is a poster about lifting with the knees.' },

  
  { id: 'lift1', trigger: 'lift', once: 1, text: 'Down. It only ever goes down.' },
  { id: 'lift2', trigger: 'lift', text: 'Seven seconds of nothing trying to eat me.' },
  { id: 'lift3', trigger: 'lift', text: 'They fixed the music. Not the doors. The music.' },
  { id: 'lift4', trigger: 'lift', text: 'Inspection tag says March. Which March.' },
  { id: 'lift5', trigger: 'lift', text: 'If this stops between decks I am staying in it.' },
  { id: 'lift6', trigger: 'lift', text: 'Rated for eight persons. Persons.' },
  { id: 'lift7', trigger: 'lift', text: 'Deeper. Right. Deeper is where the answer is.' },
  { id: 'lift8', trigger: 'lift', text: 'Nobody serviced this. Nobody serviced anything.' },

  
  
  
  
  
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
  { id: 'idle13', trigger: 'idle', text: 'The contract said light maintenance. Light.' },
  { id: 'idle14', trigger: 'idle', text: 'Forty minutes on hold to report a leak. Forty.' },
  { id: 'idle15', trigger: 'idle', text: 'Somebody laminated the evacuation plan. Had the time.' },
  { id: 'idle16', trigger: 'idle', text: 'Head office is eleven weeks away by post.' },
  { id: 'idle17', trigger: 'idle', text: 'I had a plan for Tuesday. It involved a chair.' },
  { id: 'idle18', trigger: 'idle', text: 'The union rep left on the first shuttle.' },
  { id: 'idle19', trigger: 'idle', text: 'They stopped restocking the biscuits in June.' },
  { id: 'idle20', trigger: 'idle', text: 'Every door down here needs a card. One card. Doyle.' },
  { id: 'idle21', trigger: 'idle', text: 'The feed order was doubled in spring. Nobody asked why.' },
  { id: 'idle22', trigger: 'idle', text: 'Hazard pay is a line on a form. It is not pay.' },
  { id: 'idle23', trigger: 'idle', text: 'There was a memo about the lights. I did not read it.' },
  { id: 'idle24', trigger: 'idle', text: 'Six months accident free, the sign says. Six months.' },
  { id: 'idle25', trigger: 'idle', text: 'My boots are the only thing on this deck I trust.' },
  { id: 'idle26', trigger: 'idle', text: 'Whoever built this put the shed at the far end.' },
  { id: 'idle27', trigger: 'idle', text: 'Half the doors here open the wrong way. Half.' },
  { id: 'idle28', trigger: 'idle', text: 'Nobody in the training video had a limp. I noticed.' },

  
  
  
  { id: 'cough1', trigger: 'cough', text: 'Kh - that is not air. That is not air.' },
  { id: 'cough2', trigger: 'cough', text: 'Gas. Of course there is gas.' },
  { id: 'cough3', trigger: 'cough', text: 'Eyes. My eyes. Keep moving.' },
  { id: 'cough4', trigger: 'cough', text: 'There is a valve. There is always a valve.' },
]);






























export const PA_LINES = Object.freeze([
  
  { id: 'pa1', speaker: 'host', act: 1, text: 'ATTENTION. All personnel report to muster. Thank you.' },
  { id: 'pa2', speaker: 'host', act: 1, text: 'ATTENTION. Livestock deck sealed pending inspection.' },
  { id: 'pa3', speaker: 'host', act: 1, text: 'Reminder: hand contact with stock is not permitted.' },
  { id: 'pa4', speaker: 'host', act: 1, text: 'ATTENTION. Air handling is operating normally.' },
  { id: 'pa5', speaker: 'host', act: 1, text: 'Please report any unusual behaviour to your supervisor.' },
  { id: 'pa6', speaker: 'host', act: 1, text: 'ATTENTION. The medical bay is unstaffed this rotation.' },
  { id: 'pa7', speaker: 'host', act: 1, text: 'Your safety is our second priority.' },
  { id: 'pa8', speaker: 'host', act: 1, text: 'ATTENTION. Feed cycle complete. Feed cycle complete.' },
  { id: 'pa9', speaker: 'host', act: 1, text: '- and we thank you for another productive season.' },
  { id: 'pa10', speaker: 'host', act: 1, text: 'ATTENTION. Do not approach the pens without a partner.' },
  { id: 'pa11', speaker: 'host', act: 1, text: 'Good morning, Hesper-4. Shift change is in effect.' },
  { id: 'pa12', speaker: 'host', act: 1, text: 'Reminder: the canteen closes at nineteen hundred.' },
  { id: 'pa13', speaker: 'host', act: 1, text: 'ATTENTION. Lift maintenance is scheduled. Thank you.' },
  { id: 'pa14', speaker: 'host', act: 1, text: 'Please keep the corridors clear of personal effects.' },
  { id: 'pa15', speaker: 'host', act: 1, text: 'Hesper-4 has been accident free for six months.' },
  { id: 'pa16', speaker: 'host', act: 1, text: 'ATTENTION. Deck lighting is in economy mode. Thank you.' },
  { id: 'pa17', speaker: 'host', act: 1, text: 'Reminder: hearing protection is available at the desk.' },
  { id: 'pa18', speaker: 'host', act: 1, text: 'A pleasant and productive shift to all of you.' },
  { id: 'pa19', speaker: 'host', act: 1, text: 'ATTENTION. Please log all pen counts before you leave.' },
  { id: 'pa20', speaker: 'host', act: 1, text: 'The company values every single one of you.' },
  { id: 'pa73', speaker: 'host', act: 1, text: 'ATTENTION. Visitors must be accompanied at all times.' },
  { id: 'pa74', speaker: 'host', act: 1, text: 'Reminder: the suggestion box is beside the lift.' },
  { id: 'pa75', speaker: 'host', act: 1, text: 'ATTENTION. Deck four is closed for cleaning. Thank you.' },

  
  { id: 'pa21', speaker: 'host', act: 2, text: 'ATTENTION. Overtime is mandatory this rotation.' },
  { id: 'pa22', speaker: 'host', act: 2, text: 'Reminder: absence without a note is deducted.' },
  { id: 'pa23', speaker: 'host', act: 2, text: 'ATTENTION. Processing quota unmet. Processing quota unmet.' },
  { id: 'pa24', speaker: 'host', act: 2, text: 'The intercom is for operational use only. Thank you.' },
  { id: 'pa25', speaker: 'host', act: 2, text: 'Reminder: incident reports are due by end of shift.' },
  { id: 'pa26', speaker: 'host', act: 2, text: 'ATTENTION. Rest breaks are suspended until further notice.' },
  { id: 'pa27', speaker: 'host', act: 2, text: 'Personal calls will be logged and charged.' },
  { id: 'pa28', speaker: 'host', act: 2, text: 'ATTENTION. Do not feed the stock by hand. It is noted.' },

  
  { id: 'pa29', speaker: 'host', act: 3, text: 'ATTENTION. Deck. Deck. Deck.' },
  { id: 'pa30', speaker: 'host', act: 3, text: 'Reminder: the time is. The time is.' },
  { id: 'pa31', speaker: 'host', act: 3, text: 'All personnel report to. Thank you.' },
  { id: 'pa32', speaker: 'host', act: 3, text: 'ATTENTION. Feed cycle complete. Feed cycle. Feed.' },
  { id: 'pa33', speaker: 'host', act: 3, text: 'Your safety is our. Priority.' },
  { id: 'pa34', speaker: 'host', act: 3, text: 'Hand contact with stock is permitted. Is not permitted.' },
  { id: 'pa35', speaker: 'host', act: 3, text: 'ATTENTION. Muster point is where you are standing.' },
  { id: 'pa36', speaker: 'host', act: 3, text: 'Please remain where you are. Please remain.' },
  { id: 'pa37', speaker: 'host', act: 3, text: 'This has been a recorded announcement. This has been.' },
  { id: 'pa38', speaker: 'host', act: 3, text: 'Good morning, Hesper-4. Good morning. Good morning.' },

  
  { id: 'pa39', speaker: 'emergency', act: 1, text: 'Pressure seal fault, deck two. Clear the corridor.' },
  { id: 'pa40', speaker: 'emergency', act: 1, text: 'Coolant leak, sub-level. Clear the corridor.' },
  { id: 'pa41', speaker: 'emergency', act: 1, text: 'Stand clear of the pens. Stand clear.' },
  { id: 'pa42', speaker: 'emergency', act: 1, text: 'Fire team to processing. Fire team to processing.' },
  { id: 'pa43', speaker: 'emergency', act: 1, text: 'Lockdown, section four. Lockdown.' },
  { id: 'pa44', speaker: 'emergency', act: 2, text: 'Containment fault, processing. This is not a drill.' },
  { id: 'pa45', speaker: 'emergency', act: 2, text: 'Seal the deck. Seal the deck.' },
  { id: 'pa46', speaker: 'emergency', act: 2, text: 'Do not use the lifts. Do not use the lifts.' },
  { id: 'pa47', speaker: 'emergency', act: 2, text: 'Muster is cancelled. Return to your stations.' },
  { id: 'pa48', speaker: 'emergency', act: 3, text: 'All decks. All decks. Lockdown.' },
  { id: 'pa49', speaker: 'emergency', act: 3, text: 'Do not open the cold store.' },
  { id: 'pa50', speaker: 'emergency', act: 3, text: 'Power to deck lighting has been withdrawn.' },
  { id: 'pa51', speaker: 'emergency', act: 3, fx: 'cut', text: 'This is not a drill. This is not a drill. This is not' },

  
  { id: 'pa52', speaker: 'survivor', act: 2, once: 1, text: 'Hello? Is this thing - hello? Is anyone on this channel?' },
  { id: 'pa53', speaker: 'survivor', act: 2, text: "We're in the cold store. Deck six. Please. Somebody." },
  { id: 'pa54', speaker: 'survivor', act: 2, fx: 'bang', text: "Don't open it. Don't open it. DON'T -" },
  { id: 'pa55', speaker: 'survivor', act: 2, text: "It's in the vent. It's in the vent, Marcus, it's -" },
  { id: 'pa56', speaker: 'survivor', act: 2, fx: 'bang', text: 'Get the door. GET THE DOOR!' },
  { id: 'pa57', speaker: 'survivor', act: 2, text: 'Is this going anywhere? Is anybody - okay. Okay.' },
  { id: 'pa58', speaker: 'survivor', act: 2, text: 'Tell Marion I - tell her I tried the lift.' },
  { id: 'pa59', speaker: 'survivor', act: 2, text: 'Stop banging. Stop banging, they can hear it.' },
  { id: 'pa60', speaker: 'survivor', act: 2, text: 'We counted eleven. We counted eleven and then we stopped.' },
  { id: 'pa61', speaker: 'survivor', act: 2, text: "Please. Please. I've got a kid on Luna." },
  { id: 'pa62', speaker: 'survivor', act: 2, fx: 'bang', text: "Doyle. Doyle, if that's you, open the hatch!" },
  { id: 'pa63', speaker: 'survivor', act: 2, text: "Whoever's got the pass card. Whoever's got it. Please." },
  { id: 'pa64', speaker: 'survivor', act: 2, text: "They're quiet now. Why are they quiet now." },
  { id: 'pa65', speaker: 'survivor', act: 2, text: "The lights keep - something's chewing the cable." },
  { id: 'pa66', speaker: 'survivor', act: 3, fx: 'cut', text: 'Hello? Hello? Hello? Hel-' },
  { id: 'pa67', speaker: 'survivor', act: 3, text: "Just static. It's just static now." },
  { id: 'pa68', speaker: 'survivor', act: 3, text: "If you can hear this, don't come down. Don't come down." },
  { id: 'pa69', speaker: 'survivor', act: 3, text: "I can see the lift. I can see it. I can't -" },
  { id: 'pa70', speaker: 'survivor', act: 3, text: 'Marcus? Marcus. Say something.' },
  { id: 'pa71', speaker: 'survivor', act: 3, text: 'Three of us. Two. Two of us.' },
  { id: 'pa72', speaker: 'survivor', act: 3, fx: 'bang', text: 'OPEN UP! Open up, open up, open -' },
]);


export const PA_SPEAKERS = Object.freeze(['host', 'emergency', 'survivor']);








export const PA_MIX = Object.freeze({
  1: { host: 1.0, emergency: 0.12, survivor: 0 },
  2: { host: 0.6, emergency: 0.25, survivor: 0.55 },
  3: { host: 0.4, emergency: 0.3, survivor: 0.7 },
});

export const BARKS = Object.freeze({
  
  
  hold: 3.4,
  
  
  gap: 2.2,
  
  
  perLine: 150,
  
  
  idleEvery: [42, 88],
  
  
  combatEvery: 11,
  
  
  
  
  
  
  
  paPerDeck: 20,
  
  
  
  sameSpeakerAgain: 0.35,
});


export function createBarks(seed = 1) {
  const b = {
    seed: seed >>> 0,
    s: seed >>> 0,
    rnd: null,
    said: new Map(),      
    fired: new Set(),     
    t: 0,
    quietUntil: 0,
    combatUntil: 0,
    idleAt: BARKS.idleEvery[0],
    current: null,        
    
    
    level: 1,
    deckSaid: new Set(),  
    lastSpeaker: null,
  };
  b.rnd = () => {
    b.s = (b.s + 0x6D2B79F5) >>> 0;
    let t = b.s;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return b;
}










export function newDeck(b, level) {
  b.level = Math.max(1, level | 0);
  b.deckSaid = new Set();
  b.lastSpeaker = null;
  b.s = (b.seed ^ Math.imul(b.level, 0x9E3779B1)) >>> 0;
  return b;
}


export function paPoolFor(level) {
  const act = actFor(level);
  return PA_LINES.filter((l) => l.act <= act && (l.until == null || act <= l.until));
}


function drawFrom(b, pool) {
  
  
  
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
  return pick;
}





function drawPa(b, speaker = null) {
  const act = actFor(b.level);
  const pool = paPoolFor(b.level)
    .filter((l) => !b.deckSaid.has(l.id))
    .filter((l) => !(l.once && b.fired.has(l.id)))
    .filter((l) => (b.t - (b.said.get(l.id) ?? -1e9)) > BARKS.perLine);
  if (!pool.length) return null;
  if (speaker) {
    const named = pool.filter((l) => l.speaker === speaker);
    if (named.length) return drawFrom(b, named);
  }
  
  
  
  const onces = pool.filter((l) => l.once);
  if (onces.length) return drawFrom(b, onces);
  const mix = PA_MIX[act] || PA_MIX[3];
  const speakers = PA_SPEAKERS
    .map((sp) => ({ sp, w: (mix[sp] || 0) * (sp === b.lastSpeaker ? BARKS.sameSpeakerAgain : 1) }))
    .filter((x) => x.w > 0 && pool.some((l) => l.speaker === x.sp));
  if (!speakers.length) return drawFrom(b, pool);
  const total = speakers.reduce((a, x) => a + x.w, 0);
  let r = b.rnd() * total;
  let sp = speakers[speakers.length - 1].sp;
  for (const x of speakers) { r -= x.w; if (r <= 0) { sp = x.sp; break; } }
  return drawFrom(b, pool.filter((l) => l.speaker === sp));
}








export function say(b, trigger, { who = 'xander', force = false, speaker = null } = {}) {
  if (!force && b.t < b.quietUntil) return null;
  let pick;
  if (who === 'pa') {
    pick = drawPa(b, speaker);
    if (!pick) return null;
    b.deckSaid.add(pick.id);
    b.lastSpeaker = pick.speaker;
  } else {
    const pool = XANDER_LINES
      .filter((l) => l.trigger === trigger)
      .filter((l) => !(l.once && b.fired.has(l.id)))
      .filter((l) => (b.t - (b.said.get(l.id) ?? -1e9)) > BARKS.perLine);
    if (!pool.length) return null;
    pick = drawFrom(b, pool);
  }

  b.said.set(pick.id, b.t);
  if (pick.once) b.fired.add(pick.id);
  b.quietUntil = b.t + BARKS.hold + BARKS.gap;
  b.current = { text: pick.text, until: b.t + BARKS.hold, who, speaker: pick.speaker || 'xander', id: pick.id };
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
