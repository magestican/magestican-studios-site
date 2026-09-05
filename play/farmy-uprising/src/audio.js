





















import { HERD } from '../../../web-engine/rts/roster.js';
import { sharePct } from '../../../web-engine/rts/territory.js';


const ROOT = 146.83;                       
const PROGRESSION = [
  [0, 7, 12, 16],      
  [-3, 4, 9, 12],      
  [-5, 2, 7, 11],      
  [-7, 0, 5, 9],       
];
const BAR_SECONDS = 3.2;

const semis = (n) => ROOT * (2 ** (n / 12));

export function createAudio() {
  let ctx = null;
  let master = null;
  let pastoral = null;
  let industrial = null;
  let musicOn = true;
  let sfxOn = true;
  let bar = 0;
  let nextNoteAt = 0;
  let timer = null;
  let blend = 0.5;          
  let target = 0.5;

  function ensure() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      pastoral = ctx.createGain();
      industrial = ctx.createGain();
      pastoral.gain.value = 0.5;
      industrial.gain.value = 0.5;
      pastoral.connect(master);
      industrial.connect(master);
      return true;
    } catch {
      
      
      return false;
    }
  }

  
  function pluck(freq, at, dur, gain) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    o.type = 'triangle';
    o.frequency.value = freq;
    o.detune.value = (bar % 2 === 0 ? 4 : -4);
    f.type = 'lowpass';
    f.frequency.value = 2200;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain, at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(f); f.connect(g); g.connect(pastoral);
    o.start(at); o.stop(at + dur + 0.05);
  }

  
  function grind(freq, at, dur, gain) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    o.type = 'sawtooth';
    o.frequency.value = freq;
    f.type = 'lowpass';
    f.frequency.setValueAtTime(700, at);
    f.frequency.linearRampToValueAtTime(1500, at + dur * 0.4);
    f.Q.value = 6;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.linearRampToValueAtTime(gain, at + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(f); f.connect(g); g.connect(industrial);
    o.start(at); o.stop(at + dur + 0.05);
  }

  
  function tick(at, gain, freq, dest, dur = 0.09) {
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
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(f); f.connect(g); g.connect(dest || master);
    src.start(at);
  }

  







  function scheduleBar() {
    if (!ctx || !musicOn) return;
    const chord = PROGRESSION[bar % PROGRESSION.length];
    const at = nextNoteAt;
    const beat = BAR_SECONDS / 4;

    
    for (let i = 0; i < 4; i += 1) {
      pluck(semis(chord[i % chord.length]) * 2, at + i * beat, beat * 0.9, 0.075);
      if (i % 2 === 0) pluck(semis(chord[0]), at + i * beat, beat * 1.6, 0.05);
      tick(at + i * beat, 0.03, 5200, pastoral, 0.05);
    }
    
    grind(semis(chord[0]) / 2, at, BAR_SECONDS * 0.95, 0.05);
    grind(semis(chord[2]), at, BAR_SECONDS * 0.95, 0.028);
    for (let i = 0; i < 8; i += 1) {
      tick(at + i * (beat / 2), i % 2 === 0 ? 0.055 : 0.02, 180, industrial, 0.07);
    }

    nextNoteAt += BAR_SECONDS;
    bar += 1;
  }

  function pump() {
    if (!ctx) return;
    
    
    
    while (nextNoteAt < ctx.currentTime + 2) scheduleBar();
    
    
    blend += (target - blend) * 0.08;
    if (pastoral) pastoral.gain.value = (1 - blend) * 0.85;
    if (industrial) industrial.gain.value = blend * 0.85;
  }

  return {
    
    begin() {
      if (!ensure()) return;
      if (ctx.state === 'suspended') ctx.resume();
      bar = 0;
      nextNoteAt = ctx.currentTime + 0.1;
      blend = 0.5;
      target = 0.5;
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

    events(evs, match) {
      if (!ctx || !sfxOn) return;
      const now = ctx.currentTime;
      for (const ev of evs) {
        
        
        if (ev.type === 'captured') tick(now, 0.16, 900, master, 0.14);
        else if (ev.type === 'lost' || ev.type === 'faded') tick(now, 0.14, 320, master, 0.22);
        else if (ev.type === 'buildingDone') { pluck(semis(12), now, 0.5, 0.12); }
        else if (ev.type === 'unitLost') tick(now, 0.09, 240, master, 0.1);
        else if (ev.type === 'waterPolluted') grind(semis(-12), now, 0.6, 0.06);
      }
    },

    ui(kind) {
      if (!ctx || !sfxOn) return;
      const now = ctx.currentTime;
      if (kind === 'order') tick(now, 0.13, 1400, master, 0.07);
      else tick(now, 0.08, 2600, master, 0.04);
    },

    matchOver(won) {
      if (!ctx) return;
      const now = ctx.currentTime;
      const chord = won ? [0, 7, 12, 16] : [0, 3, 7, 10];
      chord.forEach((n, i) => pluck(semis(n), now + i * 0.11, 1.6, 0.11));
      target = won ? target : 1 - target;
    },

    setMusic(on) { musicOn = !!on; if (master) master.gain.value = on ? 0.5 : 0.5; },
    setSfx(on) { sfxOn = !!on; },
    mute(on) { if (master) master.gain.value = on ? 0 : 0.5; },
    
    get state() { return ctx ? ctx.state : 'none'; },
  };
}
