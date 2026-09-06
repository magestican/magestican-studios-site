



























const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');




function markCurrentNavLink() {
  const here = location.pathname.replace(/index\.html$/, '');
  for (const a of document.querySelectorAll('.site-header nav a')) {
    const href = a.getAttribute('href') || '';
    if (href.startsWith('http') || href.includes('#')) continue;
    const path = new URL(href, location.href).pathname.replace(/index\.html$/, '');
    if (path === here) a.setAttribute('aria-current', 'page');
  }
}




function stickyHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return () => {};
  let stuck = false;
  return () => {
    const should = window.scrollY > 6;
    if (should !== stuck) {
      stuck = should;
      header.classList.toggle('is-stuck', stuck);
    }
  };
}
















function collectTargets() {
  const items = [];

  for (const band of document.querySelectorAll('.hero-band')) {
    for (const layer of band.querySelectorAll('span[data-par]')) {
      items.push({
        el: layer,
        host: band,
        kind: 'band',
        speed: parseFloat(layer.dataset.par) || 0,
        base: '',
        near: true,
      });
    }
  }

  for (const frame of document.querySelectorAll('.game-art')) {
    const img = frame.querySelector('img[data-par]');
    if (!img) continue;
    items.push({
      el: img,
      host: frame,
      kind: 'frame',
      speed: parseFloat(img.dataset.par) || 0,
      base: '-50%',
      near: false,
    });
  }

  return items;
}

function startParallax(items, onFrame) {
  let queued = false;

  const request = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(draw);
  };

  function draw() {
    queued = false;
    onFrame();

    const vh = window.innerHeight || 1;
    const scrollY = window.scrollY;

    
    
    const pending = [];
    for (const it of items) {
      if (!it.near || !it.speed) continue;
      const rect = it.host.getBoundingClientRect();
      let y;
      if (it.kind === 'band') {
        const top = rect.top + scrollY;
        y = Math.max(0, scrollY - top) * it.speed;
      } else {
        const centre = rect.top + rect.height / 2;
        const t = (centre - vh / 2) / (vh / 2 + rect.height / 2);
        y = Math.max(-1, Math.min(1, t)) * it.speed;
      }
      pending.push([it, Math.round(y * 100) / 100]);
    }

    
    for (const [it, y] of pending) {
      it.el.style.transform = it.base
        ? 'translate3d(0, calc(' + it.base + ' + ' + y + 'px), 0)'
        : 'translate3d(0, ' + y + 'px, 0)';
    }
  }

  if ('IntersectionObserver' in window) {
    
    
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        for (const item of items) {
          if (item.host === entry.target) item.near = entry.isIntersecting;
        }
      }
      request();
    }, { rootMargin: '25% 0px 25% 0px' });
    for (const it of items) io.observe(it.host);
  } else {
    for (const it of items) it.near = true;
  }

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request, { passive: true });
  request();

  return () => {
    window.removeEventListener('scroll', request);
    window.removeEventListener('resize', request);
    for (const it of items) it.el.style.transform = '';
  };
}





function startReveal() {
  const targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;
  if (!('IntersectionObserver' in window)) {
    for (const el of targets) el.classList.add('is-in');
    return;
  }
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  for (const el of targets) io.observe(el);
}





let teardown = null;

function enable() {
  if (teardown) return;
  document.documentElement.classList.add('js');
  startReveal();
  const items = collectTargets();
  teardown = startParallax(items, stickyHeader());
}

function disable() {
  document.documentElement.classList.remove('js');
  for (const el of document.querySelectorAll('.reveal')) el.classList.add('is-in');
  if (teardown) {
    teardown();
    teardown = null;
  }
}



function headerOnly() {
  const tick = stickyHeader();
  window.addEventListener('scroll', tick, { passive: true });
  tick();
}

if (reduceMotion.matches) headerOnly();
else enable();



const onPreferenceChange = () => {
  if (reduceMotion.matches) disable();
  else enable();
};
if (typeof reduceMotion.addEventListener === 'function') reduceMotion.addEventListener('change', onPreferenceChange);
else if (typeof reduceMotion.addListener === 'function') reduceMotion.addListener(onPreferenceChange);

markCurrentNavLink();













import('./studioBanner.js').catch(() => {
  
});
