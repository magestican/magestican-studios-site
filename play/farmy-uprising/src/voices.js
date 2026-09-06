

















import {
  createBarkState, requestBark, requestAnnouncement, voiceForUnit,
} from '../../../web-engine/rts/barks.js';
import { unitSpec } from '../../../web-engine/rts/sim/world.js';
import { MATCH_TICKS, TICKS_PER_SECOND } from '../../../web-engine/rts/fixed.js';


const SPEAKER_NAME = {
  chicken: 'Flock', duck: 'Ducks', fox: 'Skulk', pig: 'Sounder',
  horse: 'Herd', eagle: 'Wing', lion: 'Pride', elephant: 'Elephant',
  monkey: 'Great Tree', human: 'Farmhand', machine: 'Radio', announcer: '',
};





export function createVoices(audio, hud) {
  let state = createBarkState();
  const announced = new Set();
  let lastLeader = -1;

  
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

  function speak(bark, who) {
    if (!bark) return;
    
    
    
    
    const name = SPEAKER_NAME[who || bark.voice] || '';
    if (hud && hud.say) hud.say(name ? `${name}: ${bark.text}` : bark.text);
    if (audio && audio.say) audio.say(bark.clip);
  }

  return {
    reset() {
      state = createBarkState();
      announced.clear();
      lastLeader = -1;
    },

    
    matchStart(match) {
      speak(requestAnnouncement(state, match.w.tick, 'matchStart'), 'announcer');
    },

    




    events(evs, match, seat) {
      const tick = match.w.tick;
      const rng = match.w.rng;

      
      
      
      
      let mine = null;      
      let theirs = null;    
      for (const ev of evs) {
        if (ev.type === 'captured' && ev.to === seat) mine = mine || { event: 'capture' };
        else if (ev.type === 'buildingDone' && ev.owner === seat) mine = mine || { event: 'build' };
        else if ((ev.type === 'lost' || ev.type === 'faded') && ev.from === seat) {
          theirs = theirs || { event: 'lost' };
        } else if (ev.type === 'unitLost' && ev.owner === seat) {
          theirs = theirs || { event: 'lost' };
        }
      }

      
      
      const pick = theirs || mine;
      if (pick) {
        const voice = myVoice(match, seat, pick.unit);
        if (voice) {
          const bark = requestBark(state, tick, voice, pick.event, rng);
          if (bark) speak(bark, voice);
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
      speak(requestBark(state, match.w.tick, voice, 'select', match.w.rng), voice);
    },

    
    ordered(match, seat, kind) {
      const voice = myVoice(match, seat);
      if (!voice) return;
      const event = kind === 'attack' ? 'attack' : 'move';
      speak(requestBark(state, match.w.tick, voice, event, match.w.rng), voice);
    },

    matchOver(match, won, routed) {
      const tick = match.w.tick;
      
      
      
      const drawn = match.winner < 0;
      const which = drawn ? 'lose' : (routed && !won ? 'rout' : (won ? 'win' : 'lose'));
      
      
      state.lastAnnouncerTick = -9999;
      speak(requestAnnouncement(state, tick, which), 'announcer');
    },

    
    get state() { return state; },
  };
}
