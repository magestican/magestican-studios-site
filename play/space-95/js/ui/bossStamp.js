




export const STAMP_MS = 1800;


export function bossStampText(e) {
  if (e.type !== 'bossCelebrate' || !e.stamp) return null;
  return { text: e.stamp, sub: e.text ?? null };
}







export function showBossStamp(doc, e, later = setTimeout) {
  const t = bossStampText(e);
  if (!t) return null;
  const node = doc.createElement('div');
  node.className = 'boss-stamp';
  node.setAttribute('aria-live', 'polite');
  const main = doc.createElement('p');
  main.className = 'boss-stamp-text';
  main.textContent = t.text;
  node.append(main);
  if (t.sub) {
    const sub = doc.createElement('p');
    sub.className = 'boss-stamp-sub';
    sub.textContent = t.sub;
    node.append(sub);
  }
  doc.body.append(node);
  later(() => node.remove(), STAMP_MS);
  return node;
}
