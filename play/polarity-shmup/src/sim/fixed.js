













export const FP = 256;

export const ANG = 4096;

export const ONE = 65536;


const PI = 3.141592653589793;
function taylorSin(x) {
  const x2 = x * x;
  return x * (1 - x2 / 6 * (1 - x2 / 20 * (1 - x2 / 42 * (1 - x2 / 72 * (1 - x2 / 110)))));
}
function taylorCos(x) {
  const x2 = x * x;
  return 1 - x2 / 2 * (1 - x2 / 12 * (1 - x2 / 30 * (1 - x2 / 56 * (1 - x2 / 90))));
}


const SIN = new Int32Array(ANG);
{
  const q = ANG / 4, o = ANG / 8;
  for (let a = 0; a <= o; a++) {
    const x = (2 * PI * a) / ANG;
    SIN[a] = Math.round(taylorSin(x) * ONE);
    SIN[q - a] = Math.round(taylorCos(x) * ONE);
  }
  for (let a = 0; a < q; a++) {
    SIN[q + a] = SIN[q - a];
    SIN[2 * q + a] = -SIN[a];
    SIN[3 * q + a] = -SIN[q - a];
  }
}

export const angWrap = (a) => ((a % ANG) + ANG) % ANG;
export const isin = (a) => SIN[angWrap(a)];
export const icos = (a) => SIN[angWrap(a + ANG / 4)];


export const muldiv = (a, b, c) => Math.trunc((a * b) / c);


export function polar(a, speed) {
  return { vx: muldiv(isin(a), speed, ONE), vy: muldiv(icos(a), speed, ONE) };
}





export function iatan2(dx, dy) {
  if (dx === 0 && dy === 0) return 0;
  
  const ax = Math.abs(dx), ay = Math.abs(dy);
  const swap = ax > ay;
  const num = swap ? ay : ax, den = swap ? ax : ay;
  let lo = 0, hi = ANG / 8;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    
    if (SIN[mid] * den <= SIN[ANG / 4 - mid] * num) lo = mid; else hi = mid - 1;
  }
  let a = swap ? ANG / 4 - lo : lo; 
  if (dy < 0) a = ANG / 2 - a;
  if (dx < 0) a = ANG - a;
  return angWrap(a);
}
