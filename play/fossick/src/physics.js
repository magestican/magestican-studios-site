






export const GRAVITY = 30; 
const CUBE_HALF = 0.47;     
const CHUNK_SPLIT_FORCE = 900;
const CONTACT_THRESHOLD = 180;

export class LooseBodies {
  constructor(RAPIER, { floorY, maxBodies = 500 }) {
    this.R = RAPIER;
    this.floorY = floorY;
    this.maxBodies = maxBodies;
    this.world = new RAPIER.World({ x: 0, y: -GRAVITY, z: 0 });
    this.world.timestep = 1 / 60;
    this.queue = new RAPIER.EventQueue(true);
    this.chunks = new Map();   
    this.colliderCube = new Map(); 
    this.colliderOf = new Map();   
    this.colliderChunk = new Map(); 
    this.order = [];
    
    const bench = RAPIER.ColliderDesc.cuboid(80, 2, 80).setTranslation(0, floorY - 2, 0).setFriction(1.1).setRestitution(0.08);
    this.floor = this.world.createCollider(bench);
    this.structure = this.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased());
    this.seq = 0;
  }

  setPose(q) { this.structure.setNextKinematicRotation({ x: q[0], y: q[1], z: q[2], w: q[3] }); }

  
  syncStructure(block) {
    for (let i = 0; i < block.n; i++) {
      const want = block.kind[i] !== 0 && block.exposed(i);
      const has = this.colliderOf.get(i);
      if (want && !has) {
        const [x, y, z] = block.pos(i);
        const desc = this.R.ColliderDesc.cuboid(CUBE_HALF, CUBE_HALF, CUBE_HALF)
          .setTranslation(x, y, z).setFriction(0.8).setRestitution(0.1);
        const c = this.world.createCollider(desc, this.structure);
        this.colliderOf.set(i, c);
        this.colliderCube.set(c.handle, i);
      } else if (!want && has) {
        this.colliderCube.delete(has.handle);
        this.colliderOf.delete(i);
        this.world.removeCollider(has, false);
      }
    }
  }

  
  addChunk(cells, q, linvel, angvel) {
    const n = cells.length;
    let mx = 0, my = 0, mz = 0;
    for (const c of cells) { mx += c.x; my += c.y; mz += c.z; }
    mx /= n; my /= n; mz /= n;
    const desc = this.R.RigidBodyDesc.dynamic().setTranslation(mx, my, mz)
      .setRotation({ x: q[0], y: q[1], z: q[2], w: q[3] })
      .setLinvel(linvel[0], linvel[1], linvel[2]).setAngvel({ x: angvel[0], y: angvel[1], z: angvel[2] })
      .setLinearDamping(0.02).setAngularDamping(0.25).setCcdEnabled(false);
    const body = this.world.createRigidBody(desc);
    const chunk = { body, cells: [], seq: this.seq++, bornAt: performance.now?.() ?? 0, q };
    const qi = [-q[0], -q[1], -q[2], q[3]];
    for (const c of cells) {
      
      const off = rotate(qi, [c.x - mx, c.y - my, c.z - mz]);
      const cd = this.R.ColliderDesc.cuboid(CUBE_HALF, CUBE_HALF, CUBE_HALF).setTranslation(off[0], off[1], off[2])
        .setFriction(0.75).setRestitution(0.12)
        .setActiveEvents(this.R.ActiveEvents.CONTACT_FORCE_EVENTS).setContactForceEventThreshold(CONTACT_THRESHOLD);
      const collider = this.world.createCollider(cd, body);
      this.colliderChunk.set(collider.handle, chunk);
      chunk.cells.push({ i: c.i, off, collider });
    }
    this.chunks.set(body.handle, chunk);
    this.order.push(chunk);
    return chunk;
  }

  
  split(chunk) {
    if (!this.chunks.has(chunk.body.handle) || chunk.cells.length < 2) return [];
    const t = chunk.body.translation(), r = chunk.body.rotation();
    const q = [r.x, r.y, r.z, r.w];
    const lv = chunk.body.linvel(), av = chunk.body.angvel();
    const made = [];
    const cells = chunk.cells.map((c) => {
      const w = rotate(q, c.off);
      return { i: c.i, x: t.x + w[0], y: t.y + w[1], z: t.z + w[2] };
    });
    this.removeChunk(chunk);
    for (const c of cells) {
      const off = [c.x - t.x, c.y - t.y, c.z - t.z];
      const v = [lv.x + av.y * off[2] - av.z * off[1] + off[0] * 1.5, lv.y + av.z * off[0] - av.x * off[2] + Math.abs(off[1]) * 0.8, lv.z + av.x * off[1] - av.y * off[0] + off[2] * 1.5];
      made.push(this.addChunk([c], q, v, [av.x + (Math.random() - 0.5) * 3, av.y + (Math.random() - 0.5) * 3, av.z + (Math.random() - 0.5) * 3]));
    }
    return made;
  }

  removeChunk(chunk) {
    for (const c of chunk.cells) this.colliderChunk.delete(c.collider.handle);
    this.chunks.delete(chunk.body.handle);
    const at = this.order.indexOf(chunk);
    if (at >= 0) this.order.splice(at, 1);
    this.world.removeRigidBody(chunk.body);
  }

  
  trim() {
    const gone = [];
    while (this.order.length > this.maxBodies) {
      const old = this.order.find((c) => c.body.isSleeping()) || this.order[0];
      for (const c of old.cells) gone.push(c.i);
      this.removeChunk(old);
    }
    return gone;
  }

  
  step() {
    this.world.step(this.queue);
    const blows = [];
    this.queue.drainContactForceEvents((e) => {
      const a = e.collider1(), b = e.collider2();
      const chunk = this.colliderChunk.get(a) || this.colliderChunk.get(b);
      if (!chunk) return;
      const other = this.colliderChunk.has(a) ? b : a;
      const cube = this.colliderCube.has(other) ? this.colliderCube.get(other) : -1;
      const t = chunk.body.translation();
      blows.push({ chunk, cube, force: e.totalForceMagnitude(), onFloor: other === this.floor.handle, x: t.x, y: t.y, z: t.z });
    });
    this.queue.drainCollisionEvents(() => {});
    return blows;
  }

  shouldSplit(blow) { return blow.force > CHUNK_SPLIT_FORCE * Math.sqrt(blow.chunk.cells.length) && blow.chunk.cells.length > 1; }

  
  eachLoose(visit) {
    for (const chunk of this.order) {
      const t = chunk.body.translation(), r = chunk.body.rotation();
      const q = [r.x, r.y, r.z, r.w];
      for (const c of chunk.cells) {
        const w = rotate(q, c.off);
        visit(c.i, t.x + w[0], t.y + w[1], t.z + w[2], r.x, r.y, r.z, r.w);
      }
    }
  }

  free() { this.world.free(); this.queue.free(); }
}

export function rotate(q, v) {
  const [qx, qy, qz, qw] = q, [x, y, z] = v;
  const tx = 2 * (qy * z - qz * y), ty = 2 * (qz * x - qx * z), tz = 2 * (qx * y - qy * x);
  return [x + qw * tx + qy * tz - qz * ty, y + qw * ty + qz * tx - qx * tz, z + qw * tz + qx * ty - qy * tx];
}
