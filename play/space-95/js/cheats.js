











export function readCheats(search) {
  const q = new URLSearchParams(search);
  const num = (k, d) => {
    const v = Number(q.get(k));
    return q.has(k) && Number.isFinite(v) ? v : d;
  };
  const variant = q.get('variant') === 'man' ? 'man' : 'woman';
  const lv = q.get('level');
  return {
    level: lv && /^\d+$/.test(lv) ? Number(lv) : 'gym',
    checkpoint: Math.max(0, Math.floor(num('checkpoint', 0))),
    variant,
    slow: Math.min(1, Math.max(0.05, num('slow', 1))),
    hud: q.get('hud') !== '0',
    god: q.get('god') === '1',
    abilities: q.get('abilities') ?? '',
  };
}
