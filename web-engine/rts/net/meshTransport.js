























const GAME_KINDS = new Set(['cmd', 'idle', 'sum', 'sync']);



























export const EARLY_QUEUE_MAX = 2048;








export function createMeshTransport(mesh) {
  const handlers = [];
  
  const early = [];
  let droppedEarly = 0;
  const listener = (ev) => {
    const msg = ev?.detail?.message;
    
    
    
    
    
    if (!msg || typeof msg !== 'object' || !GAME_KINDS.has(msg.k)) return;
    if (handlers.length === 0) {
      early.push(msg);
      while (early.length > EARLY_QUEUE_MAX) { early.shift(); droppedEarly += 1; }
      return;
    }
    for (const fn of handlers) fn(msg);
  };
  mesh.addEventListener('message', listener);

  return {
    broadcast(msg) { mesh.broadcast(msg); },
    onMessage(fn) {
      handlers.push(fn);
      
      
      
      if (handlers.length === 1 && early.length) {
        const pending = early.splice(0, early.length);
        for (const m of pending) fn(m);
      }
    },
    
    get droppedEarly() { return droppedEarly; },
    get queued() { return early.length; },
    close() { mesh.removeEventListener('message', listener); handlers.length = 0; },
  };
}












export function assignSeats(peerIds, myId) {
  
  
  
  const order = [...new Set(peerIds)].sort();
  const seats = Object.create(null);
  order.forEach((id, i) => { seats[id] = i; });
  return { seats, order, localSeat: seats[myId] ?? -1 };
}








export function playingSeats(order, observerIds = []) {
  const watching = new Set(observerIds);
  return order.map((id, i) => (watching.has(id) ? -1 : i)).filter((s) => s >= 0);
}
