


















export const CAR_RADIUS = 1.55 / 12; 
const CAR_MASS = 1;
const CAR_TALL = 0.15; 
const GRAVITY = 9.81;
const REST = 0.03; 
const HIT_SOUND = 0.15; 
const HIT_COOL = 0.4; 
const TIP_SPEED = 0.5; 





export const KINDS = Object.freeze({
  can: Object.freeze({ radius: 0.033, height: 0.122, mass: 0.06, restitution: 0.5, roll: 0.55, damp: 0.25, tips: true }),
  marble: Object.freeze({ radius: 0.008, height: 0.016, mass: 0.006, restitution: 0.7, roll: 0.3, damp: 0.2, tips: false }),
  block: Object.freeze({ radius: 0.02, height: 0.048, mass: 0.03, restitution: 0.3, roll: 3.0, damp: 1.0, tips: false }),
});

const KIND_OF = Object.freeze({
  soda_can_red: 'can', soda_can_green: 'can', soda_can_blue: 'can', marble: 'marble', toy_block: 'block',
});

export const kindOf = (model) => {
  const k = KIND_OF[model];
  if (!k) throw new Error(`props: "${model}" is not a loose prop (known: ${Object.keys(KIND_OF).join(', ')})`);
  return k;
};

export const LOOSE_MODELS = Object.freeze(Object.keys(KIND_OF));


export function createLooseProps(list) {
  return list.map((p, i) => {
    const kind = kindOf(p.model);
    return {
      i, model: p.model, kind, x: p.x, z: p.z, y: p.y ?? 0,
      vx: 0, vz: 0, vy: 0,
      down: false, 
      heading: 0, 
      roll: 0, 
      cool: 0,
      settled: false, 
      hint: null, 
    };
  });
}





export function stepProps(props, cars, dt, groundAt) {
  const hits = [];
  const carDeltas = new Map();
  for (const p of props) p.cool = Math.max(0, p.cool - dt);

  
  for (const c of cars) {
    for (const p of props) {
      const K = KINDS[p.kind];
      if (Math.abs((c.y ?? 0) - p.y) > CAR_TALL) continue;
      const dx = p.x - c.x; const dz = p.z - c.z;
      const d = Math.hypot(dx, dz);
      const R = CAR_RADIUS + K.radius;
      if (d >= R || d < 1e-9) continue;
      const nx = dx / d; const nz = dz / d;
      
      p.x += nx * (R - d); p.z += nz * (R - d);
      p.settled = false;
      const closing = (p.vx - c.vx) * nx + (p.vz - c.vz) * nz;
      if (closing >= 0) continue;
      const j = (-(1 + K.restitution) * closing) / (1 / K.mass + 1 / CAR_MASS);
      p.vx += (j / K.mass) * nx; p.vz += (j / K.mass) * nz;
      const cd = carDeltas.get(c.id) ?? { dvx: 0, dvz: 0 };
      cd.dvx -= (j / CAR_MASS) * nx; cd.dvz -= (j / CAR_MASS) * nz;
      carDeltas.set(c.id, cd);
      if (K.tips && -closing > TIP_SPEED) p.down = true;
      if (-closing > HIT_SOUND && p.cool <= 0) {
        p.cool = HIT_COOL;
        hits.push({ i: p.i, kind: p.kind, model: p.model, carId: c.id, speed: -closing });
      }
    }
  }

  
  for (let a = 0; a < props.length; a += 1) {
    for (let b = a + 1; b < props.length; b += 1) {
      const A = props[a]; const B = props[b];
      if (Math.abs(A.y - B.y) > 0.05) continue;
      const KA = KINDS[A.kind]; const KB = KINDS[B.kind];
      const dx = B.x - A.x; const dz = B.z - A.z;
      const d = Math.hypot(dx, dz);
      const R = KA.radius + KB.radius;
      if (d >= R || d < 1e-9) continue;
      const nx = dx / d; const nz = dz / d;
      const over = R - d; const tot = KA.mass + KB.mass;
      A.settled = false; B.settled = false;
      A.x -= nx * over * (KB.mass / tot); A.z -= nz * over * (KB.mass / tot);
      B.x += nx * over * (KA.mass / tot); B.z += nz * over * (KA.mass / tot);
      const closing = (B.vx - A.vx) * nx + (B.vz - A.vz) * nz;
      if (closing >= 0) continue;
      const e = Math.min(KA.restitution, KB.restitution);
      const j = (-(1 + e) * closing) / (1 / KA.mass + 1 / KB.mass);
      A.vx -= (j / KA.mass) * nx; A.vz -= (j / KA.mass) * nz;
      B.vx += (j / KB.mass) * nx; B.vz += (j / KB.mass) * nz;
      for (const P of [A, B]) if (KINDS[P.kind].tips && -closing > TIP_SPEED) P.down = true;
      if (-closing > HIT_SOUND * 2 && A.cool <= 0 && B.cool <= 0) {
        A.cool = HIT_COOL; B.cool = HIT_COOL;
        hits.push({ i: B.i, kind: B.kind, model: B.model, carId: null, speed: -closing });
      }
    }
  }

  
  for (const p of props) {
    if (p.settled) continue;
    const K = KINDS[p.kind];
    const g0 = groundAt(p.x, p.z, p);
    const airborne = p.y > g0 + 1e-4 || p.vy > 0;
    let speed = Math.hypot(p.vx, p.vz);
    if (!airborne && speed > 0) {
      
      const decel = (K.tips && !p.down ? KINDS.block.roll : K.roll) + K.damp * speed;
      const ns = Math.max(0, speed - decel * dt);
      if (ns < REST) { p.vx = 0; p.vz = 0; speed = 0; } else { p.vx *= ns / speed; p.vz *= ns / speed; speed = ns; }
    }
    if (speed > 0) {
      const nx = p.x + p.vx * dt; const nz = p.z + p.vz * dt;
      const g = groundAt(nx, nz, p);
      const step = speed * dt;
      if (g > p.y + Math.max(0.012, step * 0.5)) {
        
        p.vx *= -K.restitution; p.vz *= -K.restitution;
      } else {
        p.x = nx; p.z = nz;
        p.heading = Math.atan2(p.vx, p.vz);
        if (K.tips ? p.down : K.roll < 1) p.roll += (step / K.radius);
        if (!airborne && g >= p.y - 0.012) p.y = g; 
      }
    }
    
    const g = groundAt(p.x, p.z, p);
    if (p.y > g + 1e-4 || p.vy > 0) {
      p.vy -= GRAVITY * dt;
      p.y += p.vy * dt;
      if (p.y <= g) { p.y = g; p.vy = 0; if (K.tips) p.down = true; }
    } else if (p.y < g) {
      p.y = g;
    }
    if (p.vx === 0 && p.vz === 0 && p.vy === 0 && p.y === g) p.settled = true;
  }
  return { hits, carDeltas };
}
