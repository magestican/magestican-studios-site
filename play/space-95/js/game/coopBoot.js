



import { createCoopSession } from '../net/coopSession.js';
import { channelTransport, hostCode, netUrls, newHostCode, openTransport, parseCode, shareLink } from '../net/peer.js';
import { showLobby } from '../ui/coopLobby.js';
import { coopStep } from './coop.js';


function storage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}


export function coopTitle(levelId) {
  return {
    onHost: () => {
      location.search = `?level=${levelId}&host=${hostCode(storage())}`;
    },
    onJoin: ( code) => {
      location.search = `?level=${levelId}&join=${code}`;
    },
    parse: parseCode,
  };
}







export function startCoop({ seat, level, variant, view, titleRoot, onStart, onSeated }) {
  const { role, code } = seat;
  const link = shareLink(location, code, level.id);
  let started = false;
  const lobby = showLobby(titleRoot, {
    role,
    code,
    link,
    onNewCode: () => {
      location.search = `?level=${level.id}&host=${newHostCode(storage())}`;
    },
    onGo: () => {
      if (role === 'guest') {
        location.search = `?level=${level.id}`;
        return;
      }
      start();
    },
  });
  const start = () => {
    if (started) return;
    started = true;
    lobby.close();
    onStart();
  };
  
  let net = null;
  let close = () => {};
  let nextHello = 0;
  const urls = netUrls(location);
  const opened = urls ? openTransport({ role, code, urls, onLeft: () => {} }) : Promise.resolve(channelTransport(code));
  opened
    .then((t) => {
      close = t.close;
      net = createCoopSession({ role, transport: t.transport, level: level.id, variant: role === 'host' ? variant : 'bolt' });
      view.setCoop(role);
      window.addEventListener('pagehide', () => {
        net.leave();
        close();
      });
    })
    .catch(() => lobby.set('error'));

  return {
    get active() {
      return !!net;
    },
    
    get partnerVariant() {
      return net?.state.partnerVariant ?? (role === 'host' ? 'bolt' : 'woman');
    },
    
    lobbyFrame(now) {
      if (!net || started) return;
      if (role === 'guest' && now >= nextHello) {
        net.hello(); 
        nextHello = now + 1000;
      }
      for (const e of net.drain()) {
        if (e.type === 'joined') lobby.set('joined');
        if (e.type === 'seated') {
          if (e.level !== level.id) {
            location.search = `?level=${e.level}&join=${code}`;
            return;
          }
          onSeated(e);
          start();
        }
      }
    },
    
    step(session, now) {
      return net && started ? coopStep(session, net, now) : [];
    },
    
    frame(session, now, anim) {
      if (net && started) net.tick({ ...session.player, alive: session.dead === 0 }, anim, now);
    },
  };
}

