























const GAME_KINDS = new Set(['cmd', 'idle', 'sum', 'sync']);








export function createMeshTransport(mesh) {
  const handlers = [];
  const listener = (ev) => {
    const msg = ev?.detail?.message;
    
    
    
    
    
    if (!msg || typeof msg !== 'object' || !GAME_KINDS.has(msg.k)) return;
    for (const fn of handlers) fn(msg);
  };
  mesh.addEventListener('message', listener);

  return {
    broadcast(msg) { mesh.broadcast(msg); },
    onMessage(fn) { handlers.push(fn); },
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
