










export function kitMaterial(doc = globalThis.document) {
  const m = doc?.documentElement?.getAttribute?.('data-kit');
  return m && /^(stone|wood|parchment|lacquer)$/.test(m) ? m : null;
}


export function kitClass(component, icon, doc = globalThis.document) {
  const m = kitMaterial(doc);
  if (!m) return '';
  return `skin-${m}-${component}${icon ? ` mg-i mg-i-${icon}` : ''}`;
}


export function skin(el, component, icon) {
  const cls = kitClass(component, icon, el?.ownerDocument ?? globalThis.document);
  if (cls) el.classList.add(...cls.split(' '));
  return el;
}
