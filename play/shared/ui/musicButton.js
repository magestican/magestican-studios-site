













































import { isGamePage } from '../../../web-engine/brand/uiSoundPref.js';

function playToggle(name) {
  try {
    if (!isGamePage(globalThis.location?.pathname)) return;
    import('../../../web-engine/brand/uiSound.js').then((m) => { try { m.playUi(name); } catch {  } }, () => {});
  } catch {  }
}







export function wireMusicButton({ music, announce = () => {}, sound = null } = {}) {
  
  
  
  
  
  
  
  
  
  
  
  let framed = false;
  try { framed = globalThis.self !== globalThis.top; } catch { framed = false; }
  if (framed) return () => {};

  const btn = globalThis.document?.getElementById('music-btn');
  if (!btn || !music) return () => {};

  const show = () => {
    const on = music.isOn();
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    
    
    
    btn.setAttribute('aria-label', on ? 'Stop the music' : 'Play music');
    btn.setAttribute('title', on ? 'Stop the music' : 'Play music');
  };

  const onClick = () => {
    const on = music.toggle();
    show();
    announce(on ? 'Music on.' : 'Music off.');
    if (typeof sound === 'function') sound('press');
    else {
      playToggle(on ? 'toggleOn' : 'toggleOff');
    }
  };

  btn.addEventListener('click', onClick);

  
  
  
  let armed = null;
  if (music.wasOn?.() && !music.isOn()) {
    armed = () => {
      disarm();
      if (music.wasOn()) { music.setOn(true); show(); }
    };
    for (const type of ['pointerdown', 'keydown', 'touchstart']) {
      globalThis.addEventListener(type, armed, { once: false, passive: true });
    }
  }
  function disarm() {
    if (!armed) return;
    for (const type of ['pointerdown', 'keydown', 'touchstart']) {
      globalThis.removeEventListener(type, armed);
    }
    armed = null;
  }

  show();
  return () => { btn.removeEventListener('click', onClick); disarm(); };
}
