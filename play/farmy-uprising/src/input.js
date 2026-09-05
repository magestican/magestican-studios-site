






















import { CMD } from '../../../web-engine/rts/sim/commands.js';


const TAP_SLOP_PX = 12;
const TAP_MS = 350;

export function createInput(canvas, view, emit, opts = {}) {
  const state = {
    
    pendingBuild: null,
    boxing: null,
  };

  
  const pointers = new Map();
  let pinchDist = 0;
  let downAt = 0;
  let moved = 0;

  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY });
    downAt = performance.now();
    moved = 0;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
    }
    
    
    if (e.button === 2) state.boxing = { x0: e.clientX, y0: e.clientY, x1: e.clientX, y1: e.clientY };
  });

  canvas.addEventListener('pointermove', (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);

    if (state.boxing) { state.boxing.x1 = e.clientX; state.boxing.y1 = e.clientY; return; }

    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDist > 0 && d > 0) view.zoomBy(pinchDist / d);
      pinchDist = d;
      return;
    }
    if (pointers.size === 1) view.panBy(dx, dy);
  });

  const release = (e) => {
    const p = pointers.get(e.pointerId);
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchDist = 0;
    if (!p) return;

    if (state.boxing) {
      const b = state.boxing;
      state.boxing = null;
      const a = view.pick(Math.min(b.x0, b.x1), Math.min(b.y0, b.y1));
      const c = view.pick(Math.max(b.x0, b.x1), Math.max(b.y0, b.y1));
      if (a && c && Math.abs(b.x1 - b.x0) > TAP_SLOP_PX) {
        emit.select({
          kind: 'box',
          x0: Math.min(a.x, c.x), x1: Math.max(a.x, c.x),
          y0: Math.min(a.y, c.y), y1: Math.max(a.y, c.y),
        });
      }
      return;
    }

    const quick = performance.now() - downAt < TAP_MS;
    if (!quick || moved > TAP_SLOP_PX) return;

    const world = view.pick(e.clientX, e.clientY);
    if (!world) return;

    
    
    
    
    if (state.pendingBuild) {
      emit.command({ c: CMD.BUILD, building: state.pendingBuild, at: world });
      state.pendingBuild = null;
      emit.buildArmed(null);
      return;
    }
    emit.command({ c: CMD.MOVE, x: world.x, y: world.y });
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    view.zoomBy(e.deltaY > 0 ? 1.12 : 1 / 1.12);
  }, { passive: false });

  
  const held = new Set();
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    held.add(e.code);
    switch (e.code) {
      case 'KeyA': if (e.ctrlKey) { e.preventDefault(); emit.select({ kind: 'all' }); } break;
      case 'KeyV': if (e.ctrlKey) { e.preventDefault(); emit.select({ kind: 'view' }); } break;
      case 'KeyE': emit.command({ c: CMD.ATTACK, sector: -1 }); break;
      case 'KeyR': emit.command({ c: CMD.CAPTURE, sector: -1 }); break;
      case 'KeyQ': view.rotate(-1); break;
      case 'KeyT': view.rotate(1); break;
      case 'Space': e.preventDefault(); emit.jumpToAction(); break;
      case 'Tab': e.preventDefault(); emit.cycleGroup(1); break;
      default: break;
    }
  });
  window.addEventListener('keyup', (e) => held.delete(e.code));

  
  function keyboardPan(dtMs) {
    const speed = dtMs * 0.9;
    let dx = 0;
    let dy = 0;
    if (held.has('KeyW') || held.has('ArrowUp')) dy += speed;
    if (held.has('KeyS') || held.has('ArrowDown')) dy -= speed;
    if (held.has('KeyA') && !held.has('ControlLeft')) dx += speed;
    if (held.has('KeyD') || held.has('ArrowRight')) dx -= speed;
    if (held.has('ArrowLeft')) dx += speed;
    if (dx || dy) view.panBy(dx, dy);
  }

  
  
  
  
  
  
  
  
  const pad = {
    cursorX: 0.5, cursorY: 0.5, painting: false, paintR: 0, prev: [],
  };

  function pollGamepad(dtMs) {
    const gps = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = [...gps].find((g) => g && g.connected);
    if (!gp) return;

    const dead = (v) => (Math.abs(v) < 0.18 ? 0 : v);
    
    const lx = dead(gp.axes[0] || 0);
    const ly = dead(gp.axes[1] || 0);
    if (lx || ly) view.panBy(-lx * dtMs * 0.9, -ly * dtMs * 0.9);

    
    const rx = dead(gp.axes[2] || 0);
    const ry = dead(gp.axes[3] || 0);
    if (rx || ry) {
      pad.cursorX = Math.min(1, Math.max(0, pad.cursorX + rx * dtMs * 0.0012));
      pad.cursorY = Math.min(1, Math.max(0, pad.cursorY + ry * dtMs * 0.0012));
      emit.cursor(pad.cursorX, pad.cursorY);
    }

    const btn = (i) => !!(gp.buttons[i] && gp.buttons[i].pressed);
    const pressed = (i) => btn(i) && !pad.prev[i];

    
    if (btn(6)) view.zoomBy(1 + dtMs * 0.0012);
    if (btn(7)) view.zoomBy(1 - dtMs * 0.0012);

    
    if (btn(0)) {
      pad.painting = true;
      pad.paintR += dtMs * 0.06;
      emit.paint(pad.cursorX, pad.cursorY, pad.paintR);
    } else if (pad.painting) {
      pad.painting = false;
      emit.paintDone(pad.cursorX, pad.cursorY, pad.paintR);
      pad.paintR = 0;
    }

    if (pressed(1)) emit.command({ c: CMD.ATTACK, sector: -1 });      
    if (pressed(2)) emit.command({ c: CMD.CAPTURE, sector: -1 });     
    if (pressed(3)) emit.toggleQuick();                                
    if (pressed(4)) emit.select({ kind: 'army' });                     
    if (pressed(5)) emit.select({ kind: 'gather' });                   
    if (pressed(9)) emit.select({ kind: 'all' });                      
    if (pressed(11)) emit.select({ kind: 'view' });                    
    if (pressed(14)) view.rotate(-1);                                  
    if (pressed(15)) view.rotate(1);                                   

    pad.prev = gp.buttons.map((b) => b.pressed);
  }

  return {
    state,
    
    tick(dtMs) { keyboardPan(dtMs); pollGamepad(dtMs); },
    armBuild(id) { state.pendingBuild = id; emit.buildArmed(id); },
    get box() { return state.boxing; },
  };
}
