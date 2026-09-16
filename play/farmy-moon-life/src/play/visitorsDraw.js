















import { createRemote, remoteStep, visitorLabel } from 'moon/play/visitors.mjs';

export function createVisitorsDraw({ scene, createCharacter, seed = 1, season = 'summer', groundAt, lift = 0 }) {
  
  const drawn = new Map();
  const stats = { built: 0, removed: 0, bodies: 0, waiting: 0, jumps: 0, failed: 0, problem: null };

  function build(entry) {
    entry.loading = true;
    
    
    Promise.resolve(createCharacter({ seed, season, lod: 0, species: 'human', build: entry.person.build || 'female' }))
      .then((pc) => {
        
        
        if (!drawn.has(entry.person.id)) { scene.remove(pc.object); return; }
        entry.character = pc;
        pc.object.rotation.order = 'YXZ';
        scene.add(pc.object);
        stats.built += 1;
      })
      .catch((e) => {
        
        
        
        
        
        
        entry.failed = true;
        stats.failed += 1;
        stats.problem = String(e && e.message ? e.message : e).slice(0, 200);
      });
  }

  return {
    stats,

    



    update(people, dt) {
      const here = new Set();
      stats.waiting = 0;
      for (const person of people || []) {
        here.add(person.id);
        let entry = drawn.get(person.id);
        if (!entry) {
          entry = { person, remote: createRemote(person.body), character: null, loading: false, failed: false };
          drawn.set(person.id, entry);
        }
        entry.person = person;
        if (!entry.character && !entry.loading && !entry.failed) build(entry);
        const before = entry.remote.jumps;
        remoteStep(entry.remote, person.body, dt);
        if (entry.remote.jumps !== before) stats.jumps += 1;
        if (!entry.character) { stats.waiting += 1; continue; }
        const r = entry.remote;
        const y = groundAt ? groundAt(r.x, r.z) : 0;
        entry.character.object.position.set(r.x, y + lift, r.z);
        entry.character.object.rotation.y = r.heading;
        entry.character.update(dt, { speed: r.speed, carrying: false });
      }
      
      
      
      for (const [id, entry] of [...drawn]) {
        if (here.has(id)) continue;
        if (entry.character) { scene.remove(entry.character.object); stats.removed += 1; }
        drawn.delete(id);
      }
      stats.bodies = drawn.size;
    },

    
    view() {
      return [...drawn.values()].map((e) => ({
        id: e.person.id,
        name: visitorLabel(e.person),
        build: e.person.build || null,
        x: Math.round(e.remote.x * 1000) / 1000,
        z: Math.round(e.remote.z * 1000) / 1000,
        heading: Math.round(e.remote.heading * 1000) / 1000,
        speed: e.remote.speed,
        drawn: Boolean(e.character),
      }));
    },

    
    clear() {
      for (const entry of drawn.values()) {
        if (entry.character) { scene.remove(entry.character.object); stats.removed += 1; }
      }
      drawn.clear();
      stats.bodies = 0;
    },
  };
}
