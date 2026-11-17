






export const STACK_BOOST = 1.35;

const UP = 0.5;


function partnerFloorAt(partner, b, x = b.x) {
  if (!partner || !partner.alive) return null;
  if (x + b.w / 2 <= partner.x - partner.w / 2 || x - b.w / 2 >= partner.x + partner.w / 2) return null;
  const top = partner.y + partner.h;
  if (top > b.y + UP) return null;
  return { y: top, vs: 0, vx: partner.vx ?? 0, partner: true, up: UP, noWall: true };
}


export function attachPartner(world) {
  const inner = world.floorAt;
  world.partner = world.partner ?? null;
  world.floorAt = (b, x = b.x) => {
    const f = partnerFloorAt(world.partner, b, x);
    const g = inner ? inner(b, x) : null;
    if (!f) return g;
    if (!g) return f;
    return f.y >= g.y ? f : g;
  };
  return world;
}
