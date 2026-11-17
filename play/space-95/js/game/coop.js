



import { BODY_H, BODY_W } from '../sim/constants.js';
import { attachPartner } from '../sim/partner.js';

const attached = new WeakSet();






export function coopStep(session, net, nowMs) {
  const me = net.state.role;
  session.player.thruster = me === 'guest'; 
  
  for (const e of session.events) {
    if (e.partner) continue;
    if (e.type === 'secret') net.claimIntel(String(e.id));
    else if (e.type === 'checkpoint') net.reachCheckpoint(e.id);
    else if (e.type === 'clear') net.clockOut();
  }
  
  const out = [];
  for (const v of net.drain()) {
    if (v.type === 'intel' && v.by !== me && !session.found.has(String(v.id))) {
      session.found.add(String(v.id));
      const ent = session.entities.find((x) => String(x.id) === String(v.id));
      if (ent) ent.alive = false;
      out.push({ type: 'secret', secret: ent?.secret ?? (ent?.specimen ? 'specimen' : 'cache'), id: v.id, partner: true });
    } else if (v.type === 'checkpoint' && v.i > session.checkpoint) {
      const cp = session.level.checkpoints.find((c) => c.id === v.i);
      if (!cp) continue;
      session.checkpoint = v.i;
      session.respawnAt = { x: cp.x, y: cp.y };
      out.push({ type: 'checkpoint', id: v.i, partner: true });
    } else if (v.type === 'clear' && !session.cleared) {
      session.cleared = true;
      session.clearTime = session.time;
      out.push({ type: 'clear', time: session.time, partner: true });
    } else if (v.type === 'joined' || v.type === 'seated' || v.type === 'left') out.push({ type: `coop-${v.type}`, partner: true });
  }
  
  if (!attached.has(session.world)) {
    attachPartner(session.world);
    attached.add(session.world);
  }
  const b = net.partnerAt(nowMs);
  session.world.partner = b ? { ...b, w: BODY_W, h: BODY_H } : null;
  if (session.dead > 0 && !session.beamTo) session.beamTo = net.beamTarget(nowMs);
  return out;
}
