





















export function readCheats(search) {
  const q = new URLSearchParams(search);
  const num = (k, d) => {
    const v = Number(q.get(k));
    return q.has(k) && Number.isFinite(v) ? v : d;
  };
  const variant = q.get('variant') === 'man' ? 'man' : 'woman';
  const lv = q.get('level');
  return {
    level:
      lv === 'gym' || lv === 'gym-train' || lv === 'gym-webs' || lv === 'gym-drill' || lv === 'gym-plane'
        ? lv
        : lv && /^\d+$/.test(lv)
          ? Number(lv)
          : 1,
    checkpoint: Math.max(0, Math.floor(num('checkpoint', 0))),
    variant,
    slow: Math.min(1, Math.max(0.05, num('slow', 1))),
    hud: q.get('hud') !== '0',
    god: q.get('god') === '1',
    abilities: q.get('abilities') ?? '',
    bossPhase: q.has('boss_phase') ? Math.max(0, Math.floor(num('boss_phase', 0))) : null,
    x: q.has('x') ? num('x', 0) : null,
    y: q.has('y') ? num('y', 0) : null,
    heading: num('heading', 0),
    rail: q.get('rail') ?? null,
    s: q.has('s') ? num('s', 0) : null,
    points: q.has('points')
      ? Object.fromEntries(
          (q.get('points') ?? '')
            .split(',')
            .map((kv) => kv.split(':'))
            .filter(([k, v]) => k && (v === 'a' || v === 'b')),
        )
      : null,
  };
}
