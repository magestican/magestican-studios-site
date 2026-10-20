






export function launch(p, vy, { cut }) {
  p.vy = vy;
  p.grounded = false;
  p.jumpedThisAir = true;
  p.rising = true;
  p.jumpTime = 0;
  p.cut = cut;
  p.climbing = false;
}
