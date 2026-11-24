





import { stickFrom } from './input.js';



const capture = (el, e) => { try { el.setPointerCapture(e.pointerId); } catch {  } };





export function wirePad(els) {
  const held = { fire: false, boost: false, ability: false };
  let stick = { mx: 0, my: 0 }; let aim = null;

  
  const { zone, knob } = els; let sid = null; let ox = 0; let oy = 0;
  const R = () => Math.max(40, Math.min(80, zone.clientWidth * 0.22));
  zone.addEventListener('pointerdown', (e) => {
    if (sid !== null) return; sid = e.pointerId;
    const r = zone.getBoundingClientRect(); ox = e.clientX - r.left; oy = e.clientY - r.top;
    capture(zone, e);
    knob.hidden = false; knob.style.left = `${ox}px`; knob.style.top = `${oy}px`; e.preventDefault();
  });
  zone.addEventListener('pointermove', (e) => {
    if (e.pointerId !== sid) return;
    const r = zone.getBoundingClientRect();
    stick = stickFrom(ox, oy, e.clientX - r.left, e.clientY - r.top, R());
    knob.style.transform = `translate(calc(-50% + ${stick.mx * R()}px), calc(-50% + ${stick.my * R()}px))`;
  });
  const endStick = (e) => { if (e && e.pointerId !== sid) return; sid = null; stick = { mx: 0, my: 0 }; knob.hidden = true; knob.style.transform = ''; };
  zone.addEventListener('pointerup', endStick); zone.addEventListener('pointercancel', endStick);

  
  const ups = [];
  for (const key of ['fire', 'boost', 'ability']) {
    const b = els[key]; let fx = 0; let fy = 0;
    b.addEventListener('pointerdown', (e) => {
      held[key] = true; b.classList.add('down'); fx = e.clientX; fy = e.clientY; capture(b, e); e.preventDefault();
    });
    if (key === 'fire') {
      b.addEventListener('pointermove', (e) => {
        if (!held.fire) return;
        const a = stickFrom(fx, fy, e.clientX, e.clientY, 60);
        aim = Math.hypot(a.mx, a.my) > 0.4 ? { ax: a.mx, ay: a.my } : null;
      });
    }
    const up = () => { held[key] = false; b.classList.remove('down'); if (key === 'fire') aim = null; };
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); ups.push(up);
  }

  return {
    read: () => ({ ...stick, ...held, ...(aim || {}) }),
    
    release: () => { sid = null; endStick(); for (const up of ups) up(); },
  };
}
