










































import {
  autoRequest, fitOffer, lockTarget, textScale,
} from 'moon/play/screenFit.mjs';

export function createScreenFit({
  root = document.documentElement,
  open: openEl = null,
  lock: lockEl = null,
  note: noteEl = null,
  onRoute = () => {},
} = {}) {
  let fit = null;            
  let locked = false;        
  let offer = fitOffer({});
  let presses = 0, locks = 0, routes = 0, refusals = 0;
  let lastRefusal = null;

  const viewport = () => ({ w: window.innerWidth, h: window.innerHeight });

  const has = (name, host) => Boolean(host) && typeof host[name] === 'function';

  
  function env() {
    const nav = window.navigator || {};
    const media = (q) => {
      try { return Boolean(window.matchMedia && window.matchMedia(q).matches); } catch { return false; }
    };
    
    
    
    const iosLike = /iPad|iPhone|iPod/.test(String(nav.platform || ''))
      || /iPhone|iPad|iPod/.test(String(nav.userAgent || ''))
      || Boolean(nav.standalone !== undefined && !has('requestFullscreen', root));
    return {
      hasFullscreen: has('requestFullscreen', root) || has('webkitRequestFullscreen', root),
      isFullscreen: Boolean(document.fullscreenElement || document.webkitFullscreenElement),
      hasOrientationLock: has('lock', window.screen && window.screen.orientation),
      locked,
      standalone: media('(display-mode: standalone)') || media('(display-mode: fullscreen)')
        || Boolean(nav.standalone),
      iosLike,
    };
  }

  
  function scale() {
    const next = textScale(viewport());
    if (next === fit) return fit;
    fit = next;
    root.style.setProperty('--fit', String(next));
    return fit;
  }

  function draw() {
    offer = fitOffer(env());
    const show = offer.kind !== 'none';
    if (openEl) {
      openEl.hidden = !show;
      openEl.textContent = offer.label;
      openEl.setAttribute('aria-label', offer.label);
      openEl.dataset.fit = offer.kind;
    }
    if (noteEl) {
      noteEl.hidden = !show || !offer.note;
      noteEl.textContent = offer.note;
    }
    if (lockEl) {
      lockEl.hidden = !offer.canLock;
      lockEl.textContent = offer.lockLabel;
      lockEl.setAttribute('aria-label', offer.lockLabel);
      lockEl.classList.toggle('on', locked);
      lockEl.setAttribute('aria-pressed', String(locked));
    }
    return offer;
  }

  function apply() {
    scale();
    return draw();
  }

  function refused(what, err) {
    refusals += 1;
    lastRefusal = `${what}: ${err && err.name ? err.name : 'refused'}`;
    draw();
  }

  
  function pressOpen() {
    presses += 1;
    const now = env();
    if (offer.routeTo) { routes += 1; onRoute(offer.routeTo); return; }
    if (now.isFullscreen) {
      try {
        const out = document.exitFullscreen ? document.exitFullscreen() : document.webkitExitFullscreen();
        if (out && out.catch) out.catch((e) => refused('exit', e));
      } catch (e) { refused('exit', e); }
      locked = false;
      return;
    }
    if (!now.hasFullscreen) return;
    try {
      const ask = root.requestFullscreen ? root.requestFullscreen({ navigationUI: 'hide' })
        : root.webkitRequestFullscreen();
      if (ask && ask.catch) ask.catch((e) => refused('fullscreen', e));
    } catch (e) { refused('fullscreen', e); }
  }

  function pressLock() {
    locks += 1;
    const orientation = window.screen && window.screen.orientation;
    if (!has('lock', orientation)) return;
    if (locked) {
      locked = false;
      try { if (has('unlock', orientation)) orientation.unlock(); } catch (e) { refused('unlock', e); }
      draw();
      return;
    }
    const target = lockTarget(viewport());
    if (!target) return;
    locked = true;
    try {
      const ask = orientation.lock(target);
      if (ask && ask.catch) ask.catch((e) => { locked = false; refused('lock', e); });
    } catch (e) { locked = false; refused('lock', e); }
    draw();
  }

  if (openEl) {
    openEl.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      pressOpen();
    });
  }
  if (lockEl) {
    lockEl.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      pressLock();
    });
  }

  
  
  
  
  window.addEventListener('resize', apply);
  window.addEventListener('orientationchange', apply);
  document.addEventListener('fullscreenchange', apply);
  document.addEventListener('webkitfullscreenchange', apply);

  apply();

  return {
    apply,
    pressOpen,
    pressLock,
    get offer() { return offer; },
    







    offerFor(env_) { return fitOffer(env_ || {}); },
    
    get state() {
      const vp = viewport();
      return {
        w: vp.w,
        h: vp.h,
        fit,
        narrow: fit < 1,
        auto: autoRequest(),
        kind: offer.kind,
        label: offer.label,
        note: offer.note,
        canLock: offer.canLock,
        lockLabel: offer.lockLabel,
        lockTarget: lockTarget(vp),
        locked,
        routeTo: offer.routeTo,
        shown: openEl ? !openEl.hidden : false,
        noteShown: noteEl ? !noteEl.hidden : false,
        lockShown: lockEl ? !lockEl.hidden : false,
        presses,
        locks,
        routes,
        refusals,
        lastRefusal,
      };
    },
  };
}
