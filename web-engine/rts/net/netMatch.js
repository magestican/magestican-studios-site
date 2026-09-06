



























import { createLockstep, INPUT_DELAY_TICKS } from './lockstep.js';
import { stepMatch, schedule } from '../sim/match.js';
import { applyCommand } from '../sim/commands.js';









const REANNOUNCE_EVERY_MS = 250;

import { checksum } from '../sim/world.js';
import { saveMatch, restoreMatch } from '../sim/save.js';
import { handOverToBot } from '../sim/match.js';





























export function createNetMatch({
  match, transport, peers, localSeat, onDrop, onDesync, onStall, onResync,
  botForDroppedSeat, onTick,
}) {
  const ls = createLockstep({ peers, localSeat });
  let stalledSeats = [];
  let resyncs = 0;
  let sentIdleTo = -1;
  let lastReannounceMs = -1e9;
  









  let nextSeq = 0;

  transport.onMessage((msg) => {
    if (!msg || typeof msg !== 'object') return;
    if (msg.k === 'cmd') ls.receive(msg);
    else if (msg.k === 'idle') ls.confirmEmpty(msg.p, msg.t);
    else if (msg.k === 'sum') {
      const d = ls.noteChecksum(msg.p, msg.t, msg.v);
      if (d) {
        if (onDesync) onDesync(d);
        
        
        
        
        if (d.resyncFrom === localSeat && d.odd.length > 0) {
          transport.broadcast({ k: 'sync', p: localSeat, t: d.tick, blob: saveMatch(match) });
        }
      }
    } else if (msg.k === 'sync') {
      
      
      
      
      const d = ls.lastDesync;
      if (!d || !d.odd.includes(localSeat) || msg.p !== d.resyncFrom) return;
      try {
        const back = restoreMatch(msg.blob);
        Object.assign(match, back);
        resyncs += 1;
        if (onResync) onResync(d);
      } catch {
        
        
      }
    }
  });

  return {
    get lockstep() { return ls; },
    get resyncs() { return resyncs; },
    get stalledSeats() { return [...stalledSeats]; },

    
    issue(command) {
      const seq = typeof command.seq === 'number' ? command.seq : nextSeq;
      nextSeq = Math.max(nextSeq, seq) + 1;
      const packet = ls.issue({ ...command, seq, k: 'cmd' }, match.w.tick);
      transport.broadcast(packet);
      return packet;
    },

    







    step(maxTicks, nowMs) {
      let ran = 0;
      while (ran < maxTicks && !match.over) {
        const tick = match.w.tick;

        
        
        
        if (sentIdleTo < tick + INPUT_DELAY_TICKS) {
          sentIdleTo = tick + INPUT_DELAY_TICKS;
          ls.confirmEmpty(localSeat, sentIdleTo);
          transport.broadcast({ k: 'idle', p: localSeat, t: sentIdleTo });
        }

        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        const stall = ls.stallStatus(tick, nowMs);
        if (stall.stalled) {
          stalledSeats = stall.nameThem ? stall.seats : [];
          if (stall.nameThem && onStall) onStall(stall.seats);
          for (const seat of stall.drop) {
            ls.drop(seat);
            
            
            
            
            
            const bot = botForDroppedSeat ? botForDroppedSeat(seat) : null;
            if (bot) handOverToBot(match, seat, bot);
            if (onDrop) onDrop(seat);
          }

          
          
          
          
          
          
          
          
          
          
          
          
          
          if (nowMs - lastReannounceMs >= REANNOUNCE_EVERY_MS) {
            lastReannounceMs = nowMs;
            transport.broadcast({ k: 'idle', p: localSeat, t: sentIdleTo });
          }
          break;
        }
        stalledSeats = [];

        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        const queued = ls.commandsFor(tick);
        for (const c of queued) schedule(match, tick, c);
        const events = stepMatch(match, applyCommand);
        if (onTick) onTick(events, tick);
        ls.retire(tick);
        ran += 1;

        if (ls.shouldChecksum(match.w.tick)) {
          const v = checksum(match.w);
          const t = match.w.tick;
          ls.noteChecksum(localSeat, t, v);
          transport.broadcast({ k: 'sum', p: localSeat, t, v });
        }
      }
      return ran;
    },
  };
}











export function createLoopback() {
  const nodes = [];
  const queue = [];
  
  const muted = new Set();
  return {
    
    endpoint(id) {
      const handlers = [];
      const node = {
        id,
        handlers,
        broadcast(msg) {
          
          
          
          if (muted.has(id)) return;
          for (const other of nodes) {
            if (other.id === id) continue;
            
            
            
            queue.push({ from: id, to: other.id, msg: JSON.parse(JSON.stringify(msg)) });
          }
        },
        onMessage(fn) { handlers.push(fn); },
      };
      nodes.push(node);
      return node;
    },
    
    deliver() {
      let n = 0;
      while (queue.length) {
        const { to, msg } = queue.shift();
        const node = nodes.find((x) => x.id === to);
        if (node) for (const h of node.handlers) h(msg);
        n += 1;
      }
      return n;
    },
    








    silence(id) {
      muted.add(id);
      
      for (let i = queue.length - 1; i >= 0; i -= 1) {
        if (queue[i].from === id) queue.splice(i, 1);
      }
    },
    unsilence(id) { muted.delete(id); },
    get pending() { return queue.length; },
  };
}
