


































export class Rng {
  





  constructor(seed) {
    this.state = (seed | 0) === 0 ? 0x9e3779b9 : (seed | 0);
  }

  
  next() {
    let x = this.state | 0;
    x ^= x << 13; x |= 0;
    x ^= x >>> 17;
    x ^= x << 5; x |= 0;
    this.state = x;
    return x >>> 0;
  }

  








  below(n) {
    const bound = Math.floor(n);
    if (bound <= 1) return 0;
    const limit = 0x100000000 - (0x100000000 % bound);
    let v = this.next();
    while (v >= limit) v = this.next();
    return v % bound;
  }

  
  range(lo, hi) {
    const a = Math.floor(lo);
    const b = Math.floor(hi);
    if (b <= a) return a;
    return a + this.below(b - a + 1);
  }

  




  chance(percent) {
    return this.below(100) < percent;
  }

  






  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = this.below(i + 1);
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  
  fork(salt) {
    return new Rng((this.state ^ ((salt | 0) * 0x85ebca6b)) | 0);
  }

  
  save() { return this.state | 0; }

  
  static restore(state) {
    const r = new Rng(1);
    r.state = (state | 0) === 0 ? 0x9e3779b9 : (state | 0);
    return r;
  }
}










export function seedFromString(str) {
  let h = 0x811c9dc5;
  const s = String(str ?? '');
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    
    
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) | 0;
  }
  return h | 0;
}
