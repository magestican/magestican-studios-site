





export const EDGE_PAD = 64;








export function edgeMarker(ndc, delta, w, h) {
  let nx = ndc.x;
  let ny = ndc.y;
  if (ndc.behind) {
    
    nx = -nx * 1e3 || -Math.sign(delta.x) * 1e3;
    ny = -ny * 1e3;
  } else if (Math.abs(nx) <= 1 && Math.abs(ny) <= 1) return null;
  const pad = Math.min(EDGE_PAD, w / 2, h / 2);
  const cx = w / 2;
  const cy = h / 2;
  const dx = (nx * w) / 2;
  const dy = (-ny * h) / 2 + 0; 
  const t = Math.min(dx ? (cx - pad) / Math.abs(dx) : Infinity, dy ? (cy - pad) / Math.abs(dy) : Infinity);
  const x = Math.round(cx + dx * t);
  const y = Math.round(cy + dy * t);
  return { x, y, angle: Math.atan2(dy, dx), metres: Math.round(Math.hypot(delta.x, delta.y)) };
}







export function createEdgeMarker(root, role, drawJo) {
  const el = document.createElement('div');
  el.className = 'edge-marker';
  el.hidden = true;
  el.setAttribute('aria-hidden', 'true');
  const face = document.createElement('div');
  face.className = `edge-face ${role === 'host' ? 'is-bolt' : 'is-jo'}`;
  if (role === 'guest') drawJo?.(face);
  const arrow = document.createElement('div');
  arrow.className = 'edge-arrow';
  const dist = document.createElement('div');
  dist.className = 'edge-dist';
  el.append(arrow, face, dist);
  root.append(el);
  let lastText = '';
  return {
    
    set(m) {
      el.hidden = !m;
      if (!m) return;
      el.style.transform = `translate(${m.x}px, ${m.y}px)`;
      arrow.style.transform = `rotate(${m.angle}rad)`;
      const text = `${m.metres} m`;
      if (text !== lastText) dist.textContent = lastText = text;
    },
  };
}

