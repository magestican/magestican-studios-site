// Deterministic splittable RNG. JS twin of
// addons/arbelo_engine/rng/seeded_rng.gd.
//
// Same seed => same stream. child(tag) forks a sub-stream so each subsystem
// (map layout, spawn placement, weapon spread) can advance freely without
// perturbing the others.

// Mulberry32 - fast, tiny, well-distributed for game seeds.
// Not a cryptographic PRNG; do NOT use for anything security-adjacent.
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

// Stable 32-bit hash of a string (DJB2-xor). Non-crypto, deterministic across
// runs and browsers so peers deriving child seeds from the same tag agree.
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

  // Derive a deterministic child stream by hashing (this.seed, tag).
  child(tag) {
    const combined = `${this.seed}::${tag}`;
    return new SeededRng(hashString(combined) || 1);
  }

  // -------- typed draws --------

  // Uniform in [0, 1).
  next() { return this._next(); }

  // Integer in [min, max] inclusive.
  rangeI(min, max) {
    return Math.floor(this._next() * (max - min + 1)) + min;
  }

  // Float in [min, max).
  rangeF(min, max) {
    return this._next() * (max - min) + min;
  }

  chance(p) { return this._next() < p; }

  pick(arr) {
    if (!arr.length) throw new Error('pick() needs a non-empty array');
    return arr[Math.floor(this._next() * arr.length)];
  }

  // In-place Fisher-Yates shuffle. Returns the array for chaining.
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this._next() * (i + 1));
      const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }
}

// Convenience: derive a short human-shareable code from a seed (5 chars,
// base36). Not a hash — just a formatting; the seed itself is authoritative.
export function seedToCode(seed) {
  return (seed >>> 0).toString(36).padStart(5, '0').slice(0, 5).toUpperCase();
}
export function codeToSeed(code) {
  return parseInt(String(code).toLowerCase(), 36) >>> 0;
}
