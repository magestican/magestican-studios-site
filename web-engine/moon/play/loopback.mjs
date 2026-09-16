

























export function createLoopback({ latencyMs = 0, jitterMs = 0, random = Math.random } = {}) {
  
  const nodes = new Map();
  const queue = [];
  const dropped = new Set();     
  let now = 0;
  let seq = 0;

  function enqueue(from, to, msg) {
    if (dropped.has(from) || dropped.has(to)) return;
    queue.push({
      from,
      to,
      at: now + latencyMs + (jitterMs ? random() * jitterMs : 0),
      
      
      
      seq: (seq += 1),
      msg: JSON.parse(JSON.stringify(msg)),
    });
  }

  










  const MAX_DELIVERIES = 10_000;

  function deliverDue() {
    queue.sort((a, b) => a.at - b.at || a.seq - b.seq);
    let delivered = 0;
    while (queue.length && queue[0].at <= now) {
      if (delivered >= MAX_DELIVERIES) {
        throw new Error(`the loopback delivered ${MAX_DELIVERIES} messages in one instant without going quiet - two peers are answering each other`);
      }
      const item = queue.shift();
      const node = nodes.get(item.to);
      if (!node || dropped.has(item.to)) continue;
      for (const fn of [...node.handlers]) fn(item.msg, item.from);
      delivered += 1;
    }
    return delivered;
  }

  return {
    
    get now() { return now; },
    
    get inFlight() { return queue.length; },

    endpoint(id) {
      const node = nodes.get(id) || { id, handlers: [] };
      nodes.set(id, node);
      return {
        id,
        broadcast(msg) {
          for (const other of nodes.keys()) if (other !== id) enqueue(id, other, msg);
        },
        send(to, msg) { enqueue(id, to, msg); },
        onMessage(fn) { node.handlers.push(fn); },
      };
    },

    
    flush() {
      
      
      
      
      for (let i = 0; i < 1000; i += 1) {
        if (!deliverDue()) return;
      }
      throw new Error('the loopback delivered 1000 rounds without going quiet - two peers are answering each other');
    },

    
    advance(ms) {
      now += ms;
      this.flush();
      return now;
    },

    













    settle({ maxMs = 600_000 } = {}) {
      const until = now + maxMs;
      while (queue.length) {
        queue.sort((a, b) => a.at - b.at || a.seq - b.seq);
        const next = Math.max(now, queue[0].at);
        if (next > until) throw new Error(`the loopback still had traffic after ${maxMs} ms`);
        now = next;
        this.flush();
      }
      return now;
    },

    
    drop(id) { dropped.add(id); },
    restore(id) { dropped.delete(id); },
  };
}
