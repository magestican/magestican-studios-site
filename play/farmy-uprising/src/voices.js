


























































import {
  createBarkState, requestBark, requestAnnouncement, voiceForUnit,
} from '../../../web-engine/rts/barks.js';
import { UNITS } from '../../../web-engine/rts/roster.js';
import { unitSpec } from '../../../web-engine/rts/sim/world.js';
import { MATCH_TICKS, TICKS_PER_SECOND } from '../../../web-engine/rts/fixed.js';
import { Rng } from '../../../web-engine/rts/rng.js';


const SPEAKER_NAME = {
  chicken: 'Flock', duck: 'Ducks', fox: 'Skulk', pig: 'Sounder',
  horse: 'Herd', eagle: 'Wing', lion: 'Pride', elephant: 'Elephant',
  monkey: 'Great Tree', human: 'Farmhand', machine: 'Radio', announcer: '',
};


const IDENTITY_BUILDINGS = new Set(['sanctuary', 'machineShed']);









const CONTACT_MM = 200000;









const ROUT_NOTICE_TICKS = 5 * TICKS_PER_SECOND;





export function createVoices(audio, hud) {
  let state = createBarkState();
  const announced = new Set();
  let lastLeader = -1;
  






  let bagRng = new Rng(1);

  


















  let boundMatch = null;

  
  function bind(match) {
    if (boundMatch === match) return false;
    
    
    
    bagRng = new Rng((match.w.rng.save() ^ 0x5eed) | 0);
    state = createBarkState();
    announced.clear();
    lastLeader = -1;
    boundMatch = match;
    return true;
  }

  
  function myVoice(match, seat, preferUnit) {
    if (preferUnit) {
      const v = voiceForUnit(preferUnit);
      if (v) return v;
    }
    
    
    
    const w = match.w;
    const counts = Object.create(null);
    for (let i = 0; i < w.u.count; i += 1) {
      if (!w.u.alive[i] || w.u.owner[i] !== seat) continue;
      const id = unitSpec(w, i).id;
      counts[id] = (counts[id] || 0) + 1;
    }
    let best = null;
    let bestN = Infinity;
    for (const [id, n] of Object.entries(counts)) {
      if (!voiceForUnit(id)) continue;
      if (n < bestN) { bestN = n; best = id; }
    }
    return best ? voiceForUnit(best) : null;
  }

  








  function whereIs(match, seat, voice) {
    const w = match.w;
    for (let i = 0; i < w.u.count; i += 1) {
      if (!w.u.alive[i] || w.u.owner[i] !== seat) continue;
      if (voiceForUnit(unitSpec(w, i).id) !== voice) continue;
      return { x: w.u.x[i], y: w.u.y[i] };
    }
    return null;
  }

  
  function sectorAt(match, id) {
    const s = id >= 0 ? match.w.sectors[id] : null;
    return s ? { x: s.cx, y: s.cy } : null;
  }

  function speak(bark, who, at) {
    if (!bark) return false;
    
    
    
    
    const name = SPEAKER_NAME[who || bark.voice] || '';
    if (hud && hud.say) hud.say(name ? `${name}: ${bark.text}` : bark.text);
    if (audio && audio.say) audio.say(bark.clip, at || null);
    return true;
  }

  
  function speakAs(match, seat, voice, event) {
    if (!voice) return false;
    const bark = requestBark(state, match.w.tick, voice, event, bagRng);
    if (!bark) return false;
    return speak(bark, voice, whereIs(match, seat, voice));
  }

  








  function checkContact(match, seat) {
    if (announced.has('contact')) return false;
    const w = match.w;
    if (w.tick % 10 !== 0) return false;
    for (let i = 0; i < w.u.count; i += 1) {
      if (!w.u.alive[i] || w.u.owner[i] !== seat) continue;
      for (let j = 0; j < w.u.count; j += 1) {
        if (!w.u.alive[j] || w.u.owner[j] === seat) continue;
        const dx = w.u.x[i] - w.u.x[j];
        const dy = w.u.y[i] - w.u.y[j];
        if (dx * dx + dy * dy > CONTACT_MM * CONTACT_MM) continue;
        announced.add('contact');
        speak(requestAnnouncement(state, w.tick, 'firstContact'), 'announcer');
        speakAs(match, seat, myVoice(match, seat, unitSpec(w, i).id), 'contact');
        return true;
      }
    }
    return false;
  }

  return {
    reset() {
      boundMatch = null;
      state = createBarkState();
      announced.clear();
      lastLeader = -1;
    },

    
    matchStart(match) {
      bind(match);
      speak(requestAnnouncement(state, match.w.tick, 'matchStart'), 'announcer');
    },

    




    events(evs, match, seat) {
      
      
      
      
      if (bind(match)) {
        speak(requestAnnouncement(state, match.w.tick, 'matchStart'), 'announcer');
      }
      const tick = match.w.tick;
      const rng = bagRng;

      
      
      
      
      
      
      
      let urgent = false;
      for (const ev of evs) {
        if (ev.type === 'buildingDone' && ev.owner === seat
            && IDENTITY_BUILDINGS.has(ev.building) && !announced.has('identity')) {
          announced.add('identity');
          urgent = speakAs(match, seat, myVoice(match, seat), 'identity') || urgent;
        } else if (ev.type === 'unitSpawned' && ev.owner === seat) {
          
          
          
          
          
          const spec = UNITS[ev.unit];
          if (spec && spec.tier === 3 && !announced.has(`arrive.${ev.unit}`)) {
            announced.add(`arrive.${ev.unit}`);
            urgent = speakAs(match, seat, voiceForUnit(ev.unit), 'arrive') || urgent;
          }
        } else if (ev.type === 'waterPolluted' && !announced.has('waterFouled')) {
          announced.add('waterFouled');
          speak(requestAnnouncement(state, tick, 'waterFouled'), 'announcer',
            sectorAt(match, ev.sector));
          urgent = speakAs(match, seat, myVoice(match, seat), 'waterFouled') || urgent;
        } else if (ev.type === 'waterCleaned' && !announced.has('waterClean')) {
          announced.add('waterClean');
          speak(requestAnnouncement(state, tick, 'waterClean'), 'announcer',
            sectorAt(match, ev.sector));
          urgent = speakAs(match, seat, myVoice(match, seat), 'waterClean') || urgent;
        } else if (ev.type === 'stockRecovered') {
          
          
          
          
          
          
          
          
          
          
          if (ev.by === seat) {
            urgent = speakAs(match, seat, myVoice(match, seat), 'attack') || urgent;
          } else if (ev.owner === seat) {
            urgent = speakAs(match, seat, myVoice(match, seat), 'lost') || urgent;
          }
        }
      }

      if (!urgent) checkContact(match, seat);

      
      
      
      
      
      
      let mine = null;      
      let theirs = null;    
      for (const ev of evs) {
        if (ev.type === 'captured' && ev.to === seat) {
          mine = mine || { event: 'capture', sector: ev.sector };
        } else if (ev.type === 'buildingDone' && ev.owner === seat) {
          mine = mine || { event: 'build', sector: ev.sector };
        } else if ((ev.type === 'lost' || ev.type === 'faded') && ev.from === seat) {
          theirs = theirs || { event: 'lost', sector: ev.sector };
        } else if (ev.type === 'unitLost' && ev.owner === seat) {
          theirs = theirs || { event: 'lost' };
        }
      }

      
      
      const pick = theirs || mine;
      if (pick && !urgent) {
        const voice = myVoice(match, seat, pick.unit);
        if (voice) {
          const bark = requestBark(state, tick, voice, pick.event, rng);
          
          
          
          if (bark) {
            speak(bark, voice,
              (pick.sector !== undefined && sectorAt(match, pick.sector))
              || whereIs(match, seat, voice));
          }
        }
      }

      
      
      
      
      
      
      if (match.routTicks && !announced.has('rout')) {
        for (let p = 0; p < match.routTicks.length; p += 1) {
          if (match.routTicks[p] < ROUT_NOTICE_TICKS) continue;
          announced.add('rout');
          if (p === seat) {
            speak(requestAnnouncement(state, tick, 'routing'), 'announcer');
            speakAs(match, seat, myVoice(match, seat), 'rout');
          } else {
            speak(requestAnnouncement(state, tick, 'routed'), 'announcer');
          }
          break;
        }
      }

      
      
      
      const left = MATCH_TICKS - tick;
      if (left <= 60 * TICKS_PER_SECOND && !announced.has('oneMinute')) {
        announced.add('oneMinute');
        speak(requestAnnouncement(state, tick, 'oneMinute'), 'announcer');
      } else if (left <= 300 * TICKS_PER_SECOND && !announced.has('halfway')) {
        announced.add('halfway');
        speak(requestAnnouncement(state, tick, 'halfway'), 'announcer');
      }

      
      
      const leader = match.score[0] >= match.score[1] ? 0 : 1;
      if (lastLeader >= 0 && leader !== lastLeader) {
        speak(requestAnnouncement(state, tick,
          leader === seat ? 'leadTaken' : 'leadLost'), 'announcer');
      }
      lastLeader = leader;
    },

    
    selected(match, seat, unitId) {
      const voice = voiceForUnit(unitId) || myVoice(match, seat);
      if (!voice) return;
      speakAs(match, seat, voice, 'select');
    },

    
    ordered(match, seat, kind) {
      const voice = myVoice(match, seat);
      if (!voice) return;
      speakAs(match, seat, voice, kind === 'attack' ? 'attack' : 'move');
    },

    matchOver(match, won, routed) {
      const tick = match.w.tick;
      
      
      
      
      
      const drawn = match.winner < 0;
      const which = drawn ? 'draw' : (routed && !won ? 'rout' : (won ? 'win' : 'lose'));
      
      
      state.lastAnnouncerTick = -9999;
      speak(requestAnnouncement(state, tick, which), 'announcer');
    },

    
    get state() { return state; },
  };
}
