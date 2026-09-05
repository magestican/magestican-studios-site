








































export function wireMusicButton({ music, announce = () => {}, sound = () => {} } = {}) {
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
    sound('press');
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
