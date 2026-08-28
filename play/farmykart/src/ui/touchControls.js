










































import { touchOverlayLayout, wheelAngleDeg } from 'arbelo/touchLayout';
import {
  drawDriftIcon, drawItemBoxIcon, drawPedal, drawSteeringWheel,
} from '../render/touchIcons.js';




const MAX_DPR = 2;






export function createTouchOverlay(container) {
  const dead = { update() {}, relayout() {}, dispose() {} };
  if (!container || typeof document === 'undefined') return dead;

  const $ = (id) => container.querySelector('#' + id);
  const els = {
    wheel: $('tc-wheel'),
    spin: $('tc-wheel-spin'),
    wheelA: $('tc-wheel-a'),
    wheelB: $('tc-wheel-b'),
    brake: $('tc-brake'),
    pedal: $('tc-pedal'),
    pedalA: $('tc-pedal-a'),
    pedalB: $('tc-pedal-b'),
    drift: $('tc-drift'),
    driftC: $('tc-drift-c'),
    item: $('tc-item'),
    itemC: $('tc-item-c'),
    hint: $('tc-hint'),
    grip: $('tc-grip'),
    thumb: $('tc-thumb'),
    bar: $('tc-bar'),
  };
  
  
  
  if (!els.wheel || !els.pedal || !els.drift || !els.item) return dead;

  
  
  
  const last = {
    steer: null, throttle: null, drift: null, item: null, brake: null,
    grabbed: null, gx: null, gy: null, tx: null, ty: null, w: 0, h: 0,
  };

  
  const fit = (canvas, w, h) => {
    const dpr = Math.min(MAX_DPR, (window.devicePixelRatio || 1));
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  };

  const place = (el, box) => {
    el.style.left = `${box.x}px`;
    el.style.top = `${box.y}px`;
    el.style.width = `${box.w}px`;
    el.style.height = `${box.h}px`;
  };

  function relayout() {
    
    
    
    
    const rect = container.getBoundingClientRect();
    const w = Math.round(rect.width) || window.innerWidth;
    const h = Math.round(rect.height) || window.innerHeight;
    if (!w || !h) return;
    last.w = w; last.h = h;

    const L = touchOverlayLayout(w, h);

    place(els.wheel, L.wheel);
    drawSteeringWheel(fit(els.wheelA, L.wheel.w, L.wheel.h), L.wheel.w, { lit: false });
    drawSteeringWheel(fit(els.wheelB, L.wheel.w, L.wheel.h), L.wheel.w, { lit: true });

    place(els.pedal, L.pedal);
    drawPedal(fit(els.pedalA, L.pedal.w, L.pedal.h), L.pedal.w, L.pedal.h, { pressed: false });
    drawPedal(fit(els.pedalB, L.pedal.w, L.pedal.h), L.pedal.w, L.pedal.h, { pressed: true });

    place(els.drift, L.drift);
    drawDriftIcon(fit(els.driftC, L.drift.w, L.drift.h), L.drift.w);

    place(els.item, L.item);
    drawItemBoxIcon(fit(els.itemC, L.item.w, L.item.h), L.item.w);

    
    
    
    if (els.hint) {
      const width = Math.min(w - 24, 420);
      els.hint.style.width = `${Math.round(width)}px`;
      els.hint.style.left = `${Math.round((w - width) / 2)}px`;
      
      
      
      
      
      const tall = els.hint.offsetHeight || 34;
      els.hint.style.top = `${Math.max(4, Math.round(Math.min(L.wheel.y, L.pedal.y) - tall - 10))}px`;
    }
  }

  



  function update(v) {
    const steer = Math.max(-1, Math.min(1, v.steer || 0));
    if (steer !== last.steer) {
      last.steer = steer;
      els.spin.style.transform = `rotate(${wheelAngleDeg(steer).toFixed(1)}deg)`;
    }
    const grabbed = !!v.grab;
    if (grabbed !== last.grabbed) {
      last.grabbed = grabbed;
      els.wheel.classList.toggle('on', grabbed);
      if (els.grip) els.grip.style.display = grabbed ? 'block' : 'none';
      if (els.thumb) els.thumb.style.display = grabbed ? 'block' : 'none';
      if (els.bar) els.bar.style.display = grabbed ? 'block' : 'none';
    }
    if (grabbed && els.grip && els.thumb && els.bar) {
      const { startX, startY, x, y } = v.grab;
      if (startX !== last.gx || startY !== last.gy) {
        last.gx = startX; last.gy = startY;
        els.grip.style.transform = `translate(${startX}px, ${startY}px)`;
      }
      if (x !== last.tx || y !== last.ty) {
        last.tx = x; last.ty = y;
        els.thumb.style.transform = `translate(${x}px, ${y}px)`;
        
        
        
        const dx = x - startX;
        const dy = y - startY;
        const len = Math.hypot(dx, dy);
        els.bar.style.transform =
          `translate(${startX}px, ${startY}px) rotate(${Math.atan2(dy, dx)}rad)`;
        els.bar.style.width = `${Math.max(0, len)}px`;
      }
    }

    const go = (v.throttle || 0) > 0.05;
    if (go !== last.throttle) {
      last.throttle = go;
      els.pedal.classList.toggle('on', go);
    }
    const drift = !!v.drift;
    if (drift !== last.drift) {
      last.drift = drift;
      els.drift.classList.toggle('on', drift);
    }
    const item = !!v.item;
    if (item !== last.item) {
      last.item = item;
      els.item.classList.toggle('on', item);
    }
    const brake = !!v.brake;
    if (brake !== last.brake && els.brake) {
      last.brake = brake;
      els.brake.classList.toggle('on', brake);
    }
  }

  const onResize = () => relayout();
  window.addEventListener('resize', onResize);
  
  
  
  
  
  window.addEventListener('orientationchange', onResize);
  let ro = null;
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(onResize);
    ro.observe(container);
  }
  relayout();

  return {
    update,
    relayout,
    dispose() {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      if (ro) ro.disconnect();
      for (const el of [els.wheel, els.pedal, els.drift, els.item]) el.classList.remove('on');
    },
  };
}
