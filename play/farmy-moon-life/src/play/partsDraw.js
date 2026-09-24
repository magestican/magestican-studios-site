















import * as THREE from 'three';
import { stepPart, REST } from 'moon/play/parts.mjs';

export function createPartsDraw({ settings } = {}) {
  let live = [];
  let ticked = 0;
  let enabled = !settings || settings.parts !== 0;

  function adopt(root) {
    if (!root) return 0;
    let n = 0;
    root.traverse((o) => {
      const p = o.userData && o.userData.part;
      if (!p || live.some((e) => e.obj === o)) return;
      live.push({ obj: o, root, name: p.name, clip: p.clip, axis: new THREE.Vector3(p.axis[0], p.axis[1], p.axis[2]), state: REST, open: 0, rungAt: null });
      n += 1;
    });
    return n;
  }

  function release(root) {
    live = live.filter((e) => e.root !== root);
  }

  function tick({ t = 0, dt = 0, wind = 1 } = {}) {
    ticked = 0;
    if (!enabled) return 0;
    for (const e of live) {
      if (!e.clip || !e.root.visible) continue;
      const since = e.rungAt === null ? Infinity : t - e.rungAt;
      e.state = stepPart(e.clip, e.state, { t, dt, wind, open: e.open, since });
      e.obj.quaternion.setFromAxisAngle(e.axis, e.state.angle);
      e.obj.scale.setScalar(e.state.scale);
      ticked += 1;
    }
    return ticked;
  }

  
  function open(name, amount) {
    for (const e of live) if (e.name === name) e.open = amount;
  }

  
  function ring(name, t) {
    for (const e of live) if (e.name === name) e.rungAt = t;
  }

  function setSettings(next) {
    enabled = !next || next.parts !== 0;
  }

  function stats() {
    return { live: live.length, ticked, enabled, names: [...new Set(live.map((e) => e.name))] };
  }

  return { adopt, release, tick, open, ring, setSettings, stats };
}
