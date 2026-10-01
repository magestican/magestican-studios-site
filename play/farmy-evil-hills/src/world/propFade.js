












import { inTheWay, stepAlpha } from '../../../../web-engine/horror/propFade.js';

function fadedCopy(m) {
  const c = m.clone();
  if (m.uniforms) c.uniforms = { ...m.uniforms, uAlpha: { value: 1 } };
  c.transparent = true;
  c.depthWrite = false;
  c.userData.baseOpacity = m.opacity;
  return c;
}

function setAlpha(c, a) {
  if (c.uniforms && c.uniforms.uAlpha) c.uniforms.uAlpha.value = a;
  else c.opacity = c.userData.baseOpacity * a;
}

function partsOf(prop) {
  if (!prop.fadeParts) {
    prop.fadeParts = [];
    prop.mesh.traverse((o) => {
      if (!o.isMesh || !o.material || Array.isArray(o.material)) return;
      prop.fadeParts.push({ mesh: o, orig: o.material, copy: fadedCopy(o.material) });
    });
  }
  return prop.fadeParts;
}






export function fadeProps(props, eye, him, dt, skip = null) {
  for (const p of props) {
    if (!p.circles) continue;
    const was = p.alpha ?? 1;
    const a = stepAlpha(was, p.mesh !== skip && inTheWay(eye, him, p), dt);
    if (a === was) continue;
    p.alpha = a;
    const parts = partsOf(p);
    if (a >= 1) {
      for (const q of parts) q.mesh.material = q.orig;
    } else {
      for (const q of parts) { q.mesh.material = q.copy; setAlpha(q.copy, a); }
    }
  }
}
