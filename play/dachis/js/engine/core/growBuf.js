






export class GrowBuf {
  constructor(T, cap = 4096) { this.T = T; this.a = new T(cap); this.n = 0; }
  
  need(k) {
    if (this.n + k > this.a.length) {
      let len = this.a.length * 2;
      while (len < this.n + k) len *= 2;
      const b = new this.T(len); b.set(this.a.subarray(0, this.n)); this.a = b;
    }
    return this.a;
  }
  push3(x, y, z) { const a = this.need(3), n = this.n; a[n] = x; a[n + 1] = y; a[n + 2] = z; this.n = n + 3; }
  push1(x) { this.need(1)[this.n++] = x; }
  
  copy() { return this.a.slice(0, this.n); }
}




const pools = new Map(); 
export function takeBuf(T, key = '') {
  const idle = pools.get(key);
  const b = idle && idle.length ? idle.pop() : new GrowBuf(T);
  b.key = key; b.n = 0;
  return b;
}
export function giveBuf(b) {
  b.n = 0;
  let idle = pools.get(b.key || '');
  if (!idle) pools.set(b.key || '', idle = []);
  idle.push(b);
}

export function poolBytes() {
  let n = 0;
  for (const idle of pools.values()) for (const b of idle) n += b.a.byteLength;
  return n;
}


export function clearPool() { pools.clear(); }
