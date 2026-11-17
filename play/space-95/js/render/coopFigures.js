




export const BOLT_HOVER = 0.45;







export function coopFigures(role, me, partner) {
  const mine = { x: me.x, y: me.y, facing: me.facing, mine: true };
  if (role !== 'guest') {
    if (!partner) return { jo: mine, bolt: 'follow' };
    return { jo: mine, bolt: partner.alive ? { x: partner.x, y: partner.y + BOLT_HOVER, facing: partner.facing, mine: false } : null };
  }
  return {
    bolt: { ...mine, y: me.y + BOLT_HOVER },
    jo: partner?.alive ? { x: partner.x, y: partner.y, facing: partner.facing, mine: false, body: partner } : null,
  };
}
