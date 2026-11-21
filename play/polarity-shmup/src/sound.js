





























export const BOSS_VOICE = Object.freeze(['furnace', 'loom', 'anvil', 'twin', 'crown']);
export const BOSS_ROLES = Object.freeze(['Tell', 'Volley', 'Burst', 'Fall']);
export const BOSS_TAKES = 2;

export const bossCue = (kind, role) => (BOSS_VOICE[kind] && BOSS_ROLES.includes(role) ? BOSS_VOICE[kind] + role : null);

export const SFX_TAKES = Object.freeze({
  shot: 4, absorb: 5, flipEmber: 3, flipIris: 3, release: 2, full: 2, pop: 4, crash: 3, bossDown: 2, bomb: 2,
  hurt: 3, link: 2, hit1: 4, hit2: 4, hit3: 4, hit4: 4, hit5: 4,
  
  
  pickWing: 2, pickPrism: 2, pickHalo: 2, powerEnd: 2,
  ...Object.fromEntries(BOSS_VOICE.flatMap((v) => BOSS_ROLES.map((r) => [v + r, BOSS_TAKES]))),
});











export function createBossVoice(minLeft = 6) {
  let target = null, key = null;
  return {
    step(kind, phase, fa, charge) {
      const out = [];
      const k = `${kind}:${phase}`;
      if (k !== key) { key = k; target = null; }
      if (target !== null && fa > target) { out.push(bossCue(kind, 'Volley')); target = null; }
      if (charge && charge.left > 0) {
        const t = fa + charge.left; 
        if (target === null && charge.left >= minLeft) out.push(bossCue(kind, 'Tell'));
        if (target === null || t !== target) target = t;
      }
      return out.filter(Boolean);
    },
    reset() { target = null; key = null; },
  };
}






export const HIT_LEVEL = 0.85;
export const SFX_GAIN = Object.freeze({
  shot: 0.8, hit1: HIT_LEVEL, hit2: HIT_LEVEL, hit3: HIT_LEVEL, hit4: HIT_LEVEL, hit5: HIT_LEVEL,
});


const HEAVY = new Set([2, 4, 5]);


export function killCue(kind, boss = false) {
  if (boss) return 'bossDown';
  return HEAVY.has(kind) ? 'crash' : 'pop';
}

export const HIT_RUNGS = 5;






export function hitTickCue(hp, hp0) {
  if (!(hp0 > 0)) return 'hit1';
  const done = Math.min(1, Math.max(0, 1 - hp / hp0));
  return `hit${Math.min(HIT_RUNGS, 1 + Math.floor(done * HIT_RUNGS))}`;
}






export function createHitGate(minMs = 60) {
  let pending = null, last = -Infinity;
  const rung = (c) => Number(c.slice(3));
  return {
    offer(cue) { if (!pending || rung(cue) > rung(pending)) pending = cue; },
    take(now) {
      if (!pending || now - last < minMs) return null;
      const c = pending; pending = null; last = now;
      return c;
    },
  };
}












export const HIT_GAP_MS = 110, HIT_TARGET_MS = 160, HIT_RECOVER_MS = 320;
export const HIT_DUCK_STEP = 0.14, HIT_DUCK_FLOOR = 0.4, HIT_JITTER = 0.08;
export function createHitStream(random = Math.random) {
  let pending = null, pendingTarget = null, last = -Infinity, streak = 0;
  const heard = new Map();
  const rung = (c) => Number(c.slice(3));
  return {
    offer(cue, target = null, now = 0) {
      if (target !== null && now - (heard.get(target) ?? -Infinity) < HIT_TARGET_MS) return;
      if (!pending || rung(cue) > rung(pending)) { pending = cue; pendingTarget = target; }
    },
    take(now) {
      if (!pending || now - last < HIT_GAP_MS) return null;
      streak = now - last < HIT_RECOVER_MS ? streak + 1 : 0;
      const cue = pending;
      if (pendingTarget !== null) heard.set(pendingTarget, now);
      if (heard.size > 256) for (const [t, at] of heard) if (now - at > HIT_TARGET_MS) heard.delete(t);
      pending = null; pendingTarget = null; last = now;
      const duck = Math.max(HIT_DUCK_FLOOR, 1 - HIT_DUCK_STEP * streak);
      const gain = duck * (1 + HIT_JITTER * (2 * random() - 1));
      return { cue, gain };
    },
  };
}


export const MENU_CUES = Object.freeze(['tap', 'back', 'toggleOn', 'toggleOff', 'open']);


export const MUSIC_TRACKS = Object.freeze(['main']);


export function flipCue(pol) {
  if (pol === 'ember') return 'flipEmber';
  if (pol === 'iris') return 'flipIris';
  return null;
}


export function soundToggleCue(soundOn) {
  return soundOn ? 'toggleOn' : 'toggleOff';
}






export function createFlipWatch(initial = null) {
  let last = initial;
  return (pol) => {
    if (pol === last) return null;
    const first = last === null;
    last = pol;
    return first ? null : flipCue(pol);
  };
}


export function followSound(music, soundOn) {
  if (!music) return false;
  if (music.isOn() !== !!soundOn) music.setOn(!!soundOn);
  return music.isOn();
}
