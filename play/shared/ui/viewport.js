








































export function watchViewport(onResize) {
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  try { globalThis.history.scrollRestoration = 'manual'; } catch {  }

  const home = () => {
    try {
      const el = globalThis.document?.scrollingElement;
      if (el && (el.scrollTop || el.scrollLeft)) el.scrollTo(0, 0);
    } catch {  }
  };

  const fire = () => {
    home();
    try { onResize(); } catch {  }
  };

  
  
  const fireTwice = () => {
    fire();
    try { globalThis.requestAnimationFrame(fire); } catch {  }
  };

  const off = [];
  const on = (target, type, handler) => {
    if (!target?.addEventListener) return;
    target.addEventListener(type, handler);
    off.push(() => target.removeEventListener(type, handler));
  };

  on(globalThis, 'resize', fire);
  on(globalThis, 'orientationchange', fireTwice);
  
  
  on(globalThis, 'pageshow', fireTwice);
  on(globalThis.visualViewport, 'resize', fire);
  
  
  on(globalThis.document, 'visibilitychange', () => {
    if (globalThis.document?.visibilityState === 'visible') fireTwice();
  });

  return () => { for (const remove of off) remove(); off.length = 0; };
}
