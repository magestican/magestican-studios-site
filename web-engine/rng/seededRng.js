








function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}



function hashString(s) {
  let h = 5381 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  }
  return h;
}

export class SeededRng {
  constructor(seed = 0) {
    this.seed = seed === 0 ? (Math.random() * 2 ** 32) >>> 0 : seed >>> 0;
    this._next = mulberry32(this.seed);
  }

  
  child(tag) {
    const combined = `${this.seed}::${tag}`;
    return new SeededRng(hashString(combined) || 1);
  }

  

  
  next() { return this._next(); }

  
  rangeI(min, max) {
    return Math.floor(this._next() * (max - min + 1)) + min;
  }

  
  rangeF(min, max) {
    return this._next() * (max - min) + min;
  }

  chance(p) { return this._next() < p; }

  pick(arr) {
    if (!arr.length) throw new Error('pick() needs a non-empty array');
    return arr[Math.floor(this._next() * arr.length)];
  }

  
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this._next() * (i + 1));
      const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }
}



















