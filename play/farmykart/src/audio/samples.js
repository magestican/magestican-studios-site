





















export const SFX_FILES = Object.freeze({
  airshipGrab: ['airshipGrab.wav'],
  bump: ['bump.wav', 'bump_2.wav', 'bump_3.wav', 'bump_4.wav'],
  countdown: ['countdown.wav'],
  emoteBoast: ['emoteBoast.wav'],
  emoteHappy: ['emoteHappy.wav', 'emoteHappy_2.wav'],
  emoteRude: ['emoteRude.wav', 'emoteRude_2.wav'],
  emoteSulk: ['emoteSulk.wav'],
  finish: ['finish.wav'],
  go: ['go.wav'],
  hit: ['hit.wav', 'hit_2.wav', 'hit_3.wav'],
  itemGet: ['itemGet.wav', 'itemGet_2.wav'],
  itemUse: ['itemUse.wav', 'itemUse_2.wav'],
  jump: ['jump.wav', 'jump_2.wav'],
  land: ['land.wav', 'land_2.wav', 'land_3.wav'],
  lap: ['lap.wav'],
  milkRamp: ['milkRamp.wav', 'milkRamp_2.wav'],
  miniTurbo: ['miniTurbo.wav', 'miniTurbo_2.wav'],
  railJump: ['railJump.wav'],
  railOff: ['railOff.wav', 'railOff_2.wav'],
  railOn: ['railOn.wav', 'railOn_2.wav'],
  shieldBlock: ['shieldBlock.wav', 'shieldBlock_2.wav'],
  splash: ['splash.wav', 'splash_2.wav', 'splash_3.wav'],
  thunder: ['thunder.wav'],
});


export const SFX_TAKES = Object.freeze(Object.fromEntries(Object.entries(SFX_FILES).map(([n, f]) => [n, f.length])));


export const UI_FILES = Object.freeze({
  tap: 'tap.wav', back: 'back.wav', toggleOn: 'toggleOn.wav', toggleOff: 'toggleOff.wav', open: 'open.wav',
});
export const UI_SOUNDS = Object.freeze(Object.keys(UI_FILES));


export const EMOTE_SOUND = Object.freeze({
  happy: 'emoteHappy', boast: 'emoteBoast', rude: 'emoteRude', sulk: 'emoteSulk',
});


export function takeFiles(name, count) {
  return Array.from({ length: count }, (_, i) => (i === 0 ? `${name}.wav` : `${name}_${i + 1}.wav`));
}


export function bankFiles() {
  const out = [];
  for (const [name, files] of Object.entries(SFX_FILES)) {
    for (const f of files) out.push([name, `sfx/${f}`]);
  }
  for (const [name, f] of Object.entries(UI_FILES)) out.push([`ui:${name}`, `ui/${f}`]);
  return out;
}





export function pickTake(count, last = -1, rand = Math.random) {
  if (count <= 1) return 0;
  let i = Math.floor(rand() * count);
  if (i === last) i = (i + 1) % count;
  return i;
}





export function countdownRate(beat) {
  return beat === 3 ? 1 : beat === 2 ? 9 / 8 : 5 / 4;
}


export function turboRate(tier) {
  const t = Math.max(1, Math.min(3, tier | 0 || 1));
  return [1, 1.12, 1.26][t - 1];
}









export function loadSampleBank(audio, base = new URL('../../assets/', import.meta.url)) {
  if (!audio?.ctx || audio.samples) return;
  const bank = { buffers: new Map(), last: new Map() };
  audio.samples = bank;
  for (const [key, rel] of bankFiles()) {
    fetch(new URL(rel, base))
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then((ab) => new Promise((res, rej) => audio.ctx.decodeAudioData(ab, res, rej)))
      .then((buf) => {
        if (!bank.buffers.has(key)) bank.buffers.set(key, []);
        const list = bank.buffers.get(key);
        
        const idx = takeIndex(rel);
        list[idx] = buf;
      })
      .catch(() => {  });
  }
}

function takeIndex(rel) {
  const m = /_(\d+)\.wav$/.exec(rel);
  return m ? Number(m[1]) - 1 : 0;
}





export function playSample(audio, key, { gain = 1, rate = 1, delay = 0 } = {}) {
  const bank = audio?.samples;
  if (!audio?.ctx || audio.muted || !bank) return false;
  const list = (bank.buffers.get(key) || []).filter(Boolean);
  if (!list.length) return false;
  const i = pickTake(list.length, bank.last.get(key) ?? -1);
  bank.last.set(key, i);
  try {
    const ctx = audio.ctx;
    const src = ctx.createBufferSource();
    src.buffer = list[i];
    src.playbackRate.value = rate;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(g).connect(audio.master);
    src.start(ctx.currentTime + delay);
    return true;
  } catch {
    return false;
  }
}


export function playUiSound(audio, name) {
  return playSample(audio, `ui:${name}`, { gain: 0.8 });
}
