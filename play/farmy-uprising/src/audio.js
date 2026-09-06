



























import { HERD } from '../../../web-engine/rts/roster.js';
import { sharePct } from '../../../web-engine/rts/territory.js';
import { createSheet, createStems } from './sfxSheet.js';








const ROOT = 146.83;                       
const PROGRESSION = [
  [0, 7, 12, 16],      
  [-3, 4, 9, 12],      
  [-5, 2, 7, 11],      
  [-7, 0, 5, 9],       
];
const BAR_SECONDS = 3.2;

const semis = (n) => ROOT * (2 ** (n / 12));


const EVENT_SFX = {
  captured: 'captureDone',
  lost: 'sectorLost',
  faded: 'sectorLost',
  buildingDone: 'buildDone',
  unitSpawned: 'unitReady',
  unitLost: 'unitDown',
  waterPolluted: 'canisterHiss',
  waterCleaned: 'ducks',
  stockRecovered: 'hydraulics',
};

export function createAudio() {
  let ctx = null;
  let master = null;
  let musicBus = null;
  let sfxBus = null;
  let voiceBus = null;
  
  let synthPastoral = null;
  let synthIndustrial = null;

  let sheet = null;
  let vox = null;
  let stems = null;

  let musicOn = true;
  let sfxOn = true;
  let voiceOn = true;
  let muted = false;
  let bar = 0;
  let nextNoteAt = 0;
  let timer = null;
  let blend = 0.5;          
  let target = 0.5;
  let usingSynthMusic = false;
  let duckUntil = 0;
  let lastSpoken = null;

  const LEVELS = { music: 0.5, sfx: 0.75, voice: 1.0 };

  function ensure() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 1;
      master.connect(ctx.destination);

      musicBus = ctx.createGain();
      sfxBus = ctx.createGain();
      voiceBus = ctx.createGain();
      musicBus.gain.value = LEVELS.music;
      sfxBus.gain.value = LEVELS.sfx;
      voiceBus.gain.value = LEVELS.voice;
      musicBus.connect(master);
      sfxBus.connect(master);
      voiceBus.connect(master);

      synthPastoral = ctx.createGain();
      synthIndustrial = ctx.createGain();
      synthPastoral.gain.value = 0.5;
      synthIndustrial.gain.value = 0.5;
      synthPastoral.connect(musicBus);
      synthIndustrial.connect(musicBus);

      
      
      sheet = createSheet(ctx, './assets/sfx');
      vox = createSheet(ctx, './assets/sfx');
      stems = createStems(ctx, './assets/music', ['pastoral', 'industrial']);
      return true;
    } catch {
      
      
      return false;
    }
  }

  
  
  

  
  function pluck(freq, at, dur, g) {
    const o = ctx.createOscillator();
    const gn = ctx.createGain();
    const f = ctx.createBiquadFilter();
    o.type = 'triangle';
    o.frequency.value = freq;
    o.detune.value = (bar % 2 === 0 ? 4 : -4);
    f.type = 'lowpass';
    f.frequency.value = 2200;
    gn.gain.setValueAtTime(0.0001, at);
    gn.gain.exponentialRampToValueAtTime(g, at + 0.012);
    gn.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(f); f.connect(gn); gn.connect(synthPastoral);
    o.start(at); o.stop(at + dur + 0.05);
  }

  
  function grind(freq, at, dur, g) {
    const o = ctx.createOscillator();
    const gn = ctx.createGain();
    const f = ctx.createBiquadFilter();
    o.type = 'sawtooth';
    o.frequency.value = freq;
    f.type = 'lowpass';
    f.frequency.setValueAtTime(700, at);
    f.frequency.linearRampToValueAtTime(1500, at + dur * 0.4);
    f.Q.value = 6;
    gn.gain.setValueAtTime(0.0001, at);
    gn.gain.linearRampToValueAtTime(g, at + 0.05);
    gn.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(f); f.connect(gn); gn.connect(synthIndustrial);
    o.start(at); o.stop(at + dur + 0.05);
  }

  
  function tickNoise(at, g, freq, dest, dur = 0.09) {
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    
    
    
    for (let i = 0; i < len; i += 1) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = 1.4;
    const gn = ctx.createGain();
    gn.gain.value = g;
    src.connect(f); f.connect(gn); gn.connect(dest || sfxBus);
    src.start(at);
  }

  function scheduleBar() {
    if (!ctx || !musicOn || !usingSynthMusic) return;
    const chord = PROGRESSION[bar % PROGRESSION.length];
    const a = nextNoteAt;
    const beat = BAR_SECONDS / 4;
    for (let i = 0; i < 4; i += 1) {
      pluck(semis(chord[i % chord.length]) * 2, a + i * beat, beat * 0.9, 0.075);
      if (i % 2 === 0) pluck(semis(chord[0]), a + i * beat, beat * 1.6, 0.05);
      tickNoise(a + i * beat, 0.03, 5200, synthPastoral, 0.05);
    }
    grind(semis(chord[0]) / 2, a, BAR_SECONDS * 0.95, 0.05);
    grind(semis(chord[2]), a, BAR_SECONDS * 0.95, 0.028);
    for (let i = 0; i < 8; i += 1) {
      tickNoise(a + i * (beat / 2), i % 2 === 0 ? 0.055 : 0.02, 180, synthIndustrial, 0.07);
    }
    nextNoteAt += BAR_SECONDS;
    bar += 1;
  }

  

  
  function effect(id, g = 1) {
    if (!ctx || !sfxOn) return;
    if (sheet && sheet.play(id, { dest: sfxBus, gain: g })) return;
    const pitch = {
      captureDone: 900, sectorLost: 320, buildDone: 520,
      unitReady: 1400, unitDown: 240, uiTap: 2600, captureTick: 1320,
    }[id] || 700;
    tickNoise(ctx.currentTime, 0.12, pitch, sfxBus, 0.12);
  }

  function pump() {
    if (!ctx) return;
    while (usingSynthMusic && nextNoteAt < ctx.currentTime + 2) scheduleBar();
    
    
    blend += (target - blend) * 0.08;

    
    
    const ducked = ctx.currentTime < duckUntil ? 0.63 : 1;   
    if (stems && stems.status === 'ready') {
      stems.setGain('pastoral', (1 - blend) * 0.9 * ducked, 0.3);
      stems.setGain('industrial', blend * 0.9 * ducked, 0.3);
    } else {
      if (synthPastoral) synthPastoral.gain.value = (1 - blend) * 0.85 * ducked;
      if (synthIndustrial) synthIndustrial.gain.value = blend * 0.85 * ducked;
    }
  }

  return {
    







    begin() {
      if (!ensure()) return;
      if (ctx.state === 'suspended') ctx.resume();
      bar = 0;
      nextNoteAt = ctx.currentTime + 0.1;
      blend = 0.5;
      target = 0.5;
      usingSynthMusic = false;

      
      
      sheet.ready('fu-sfx.json');
      vox.ready('fu-vox.json');
      stems.ready().then((status) => {
        if (status === 'ready') {
          stems.start(musicBus);
        } else {
          
          
          usingSynthMusic = true;
          nextNoteAt = ctx.currentTime + 0.1;
        }
      });

      if (timer) clearInterval(timer);
      timer = setInterval(pump, 250);
    },

    






    update(match, seat) {
      if (!ctx) return;
      const mine = sharePct(match.w.sectors, seat);
      const meHerd = match.factions[seat] === HERD;
      const toward = meHerd ? 0 : 1;
      const away = meHerd ? 1 : 0;
      const t = Math.max(0, Math.min(1, mine / 60));
      target = away + (toward - away) * t;
    },

    events(evs) {
      if (!ctx || !sfxOn) return;
      for (const ev of evs) {
        const id = EVENT_SFX[ev.type];
        if (id) effect(id, ev.type === 'unitSpawned' ? 0.35 : 0.9);
      }
    },

    










    say(clip) {
      if (!ctx || !voiceOn || !vox) return false;
      const src = vox.play(clip, { dest: voiceBus, gain: 1 });
      if (!src) return false;
      lastSpoken = clip;
      duckUntil = ctx.currentTime + vox.durationOf(clip) + 0.15;
      return true;
    },

    ui(kind) {
      if (!ctx || !sfxOn) return;
      effect(kind === 'order' ? 'captureTick' : 'uiTap', kind === 'order' ? 0.8 : 0.6);
    },

    matchOver(won) {
      if (!ctx) return;
      effect(won ? 'captureDone' : 'sectorLost', 1);
      target = won ? target : 1 - target;
    },

    setMusic(on) { musicOn = !!on; if (musicBus) musicBus.gain.value = on ? LEVELS.music : 0; },
    setSfx(on) { sfxOn = !!on; if (sfxBus) sfxBus.gain.value = on ? LEVELS.sfx : 0; },
    setVoice(on) { voiceOn = !!on; if (voiceBus) voiceBus.gain.value = on ? LEVELS.voice : 0; },

    
    setLevel(bus, value) {
      const v = Math.max(0, Math.min(1, Number(value) || 0));
      LEVELS[bus] = v;
      const node = { music: musicBus, sfx: sfxBus, voice: voiceBus }[bus];
      if (node) node.gain.value = v;
    },

    mute(on) { muted = !!on; if (master) master.gain.value = on ? 0 : 1; },
    get muted() { return muted; },
    get state() { return ctx ? ctx.state : 'none'; },

    







    get debug() {
      return {
        sfxSheet: sheet,
        voxSheet: vox,
        stems,
        sfxStatus: sheet ? sheet.status : 'none',
        voxStatus: vox ? vox.status : 'none',
        musicStatus: stems ? stems.status : 'none',
        usingSynthMusic,
        lastSpoken,
        missing: [...(sheet ? sheet.missing : []), ...(vox ? vox.missing : [])],
        levels: { ...LEVELS },
      };
    },
  };
}
