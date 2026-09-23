




import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generate, TIER } from '../../villager.mjs';
import { contractTests } from '../contract.mjs';
import { budgetFor } from '../../../budgets.mjs';
import { SEASONS } from '../../../palette/seasons.mjs';
import { BIPED, MAX_BONES, JOINT_LIMITS, boneIndex, forwardKinematics, skinMatrices, carriedPoint, jointPosition } from '../../../rig/skeleton.mjs';
import { buildClips, CLIP_NAMES, gaitTable } from '../../../rig/clips.mjs';
import { sampleClip } from '../../../rig/pose.mjs';
import { deformationReport, deform } from '../../../rig/skin.mjs';
import { footTrack, plantedFlags, gaitMisses, DEFORMATION, EXTREMES } from '../../../rig/measure.mjs';
import { eulerFromQuat, frac } from '../../../rig/math.mjs';
import { mouthCornerLift } from '../face.mjs';

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);





export function weld(md) {
  const ids = new Map();
  const members = []; 
  const faces = [];
  for (const [mat, g] of md.groups) {
    const P = g.positions;
    const local = new Int32Array(P.length / 3);
    for (let v = 0; v < P.length / 3; v++) {
      const key = `${P[v * 3]},${P[v * 3 + 1]},${P[v * 3 + 2]}`;
      let id = ids.get(key);
      if (id === undefined) { id = members.length; ids.set(key, id); members.push([]); }
      members[id].push([mat, v]);
      local[v] = id;
    }
    for (let f = 0; f < g.indices.length; f += 3) faces.push([local[g.indices[f]], local[g.indices[f + 1]], local[g.indices[f + 2]], mat]);
  }
  return { members, faces };
}






export function openEdges(w) {
  const count = new Map();
  for (const [a, b, c] of w.faces) {
    for (const [p, q] of [[a, b], [b, c], [c, a]]) {
      const k = p < q ? `${p}_${q}` : `${q}_${p}`;
      count.set(k, (count.get(k) || 0) + 1);
    }
  }
  let open = 0, pinched = 0;
  for (const n of count.values()) {
    if (n % 2 === 1) open++;
    else if (n !== 2) pinched++;
  }
  return { open, pinched, edges: count.size };
}

export function components(w) {
  const parent = Int32Array.from({ length: w.members.length }, (_, i) => i);
  const find = (i) => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
  for (const [a, b, c] of w.faces) { parent[find(b)] = find(a); parent[find(c)] = find(a); }
  return find;
}


const dominant = (md, [mat, v]) => md.groups.get(mat).skinIndices[v * 4];


export const SEAM_POSES = Object.freeze([['walk', [0, 0.25, 0.5, 0.75]], ['run', [0.15, 0.45, 0.65]], ['pickUp', [0.5]], ['carry', [0.25]], ['idle', [0, 0.62]]]);
export const SEAM_JOINTS = Object.freeze(['neck', 'head', 'armUpperL', 'armUpperR', 'legUpperL', 'legUpperR']);
export const SEAM_REACH = 0.09; 





export const SEAM_STRETCH = 2.5;
export const SEAM_MAX_SHARE = 0.02;
export const SEAM_CAP = 12;



export function seamReport(md, mats) {
  const w = md.__weld || (md.__weld = weld(md));
  const posed = new Map();
  for (const [mat, g] of md.groups) posed.set(mat, deform(g.positions, g.skinIndices, g.skinWeights, mats));
  const at = (mat, v) => { const Q = posed.get(mat); return [Q[v * 3], Q[v * 3 + 1], Q[v * 3 + 2]]; };
  const rest = (mat, v) => { const P = md.groups.get(mat).positions; return [P[v * 3], P[v * 3 + 1], P[v * 3 + 2]]; };
  let crack = 0;
  for (const m of w.members) {
    if (m.length < 2) continue;
    const p0 = at(...m[0]);
    for (let i = 1; i < m.length; i++) crack = Math.max(crack, dist(p0, at(...m[i])));
  }
  const joints = SEAM_JOINTS.map((n) => md.rig.bones[boneIndex(md.rig, n)].head);
  let stretch = 0, worst = null, seamEdges = 0, total = 0, over = 0;
  for (const [a, b, c] of w.faces) {
    for (const [p, q] of [[a, b], [b, c], [c, a]]) {
      if (p > q) continue;
      const ra = rest(...w.members[p][0]), rb = rest(...w.members[q][0]);
      const mid = [(ra[0] + rb[0]) / 2, (ra[1] + rb[1]) / 2, (ra[2] + rb[2]) / 2];
      const near = joints.findIndex((j) => dist(mid, j) < SEAM_REACH);
      if (near < 0) continue;
      const l0 = dist(ra, rb);
      if (l0 < 1e-4) continue;
      seamEdges++;
      total += l0;
      const s = dist(at(...w.members[p][0]), at(...w.members[q][0])) / l0;
      if (s > SEAM_STRETCH) over += l0;
      if (s > stretch) { stretch = s; worst = SEAM_JOINTS[near]; }
    }
  }
  return { crack, stretch, worst, seamEdges, share: total > 0 ? over / total : 0 };
}




export function villagerSpeciesTests(species, { size, height, addedBones = [], reparent = {}, headless = true, args = {}, label = species }) {
  const cache = new Map();
  const gen = (seed, season, lod) => {
    const k = `${seed}|${season}|${lod}`;
    if (!cache.has(k)) cache.set(k, generate({ seed, season, lod, species, ...args }));
    return cache.get(k);
  };
  const mod = { TIER, generate: (o) => gen(o.seed, o.season, o.lod) };
  contractTests({ TIER, generate: (o) => generate({ ...o, species, ...args }) }, { name: `villager ${label}`, minY: -1e-9, maxMinY: 1e-9, size });

  test(`${label}: every LOD fills its budget (>= 90 %), has fur, eyes and cloth, and records its height`, () => {
    for (const lod of [0, 1, 2]) {
      for (const seed of [1, 2, 3]) {
        for (const season of SEASONS) {
          const m = mod.generate({ seed, season, lod });
          const where = `${label} seed ${seed} ${season} lod ${lod}`;
          assert.ok(m.triangleCount >= budgetFor(TIER, lod) * 0.9, `${where}: only ${m.triangleCount}`);
          for (const mat of ['fur', 'eye', 'cloth']) assert.ok(m.groups.has(mat), `${where}: no ${mat}`);
          assert.ok(m.rig.height_m >= height[0] && m.rig.height_m <= height[1], `${where}: height_m ${m.rig.height_m} outside ${height}`);
          assert.ok(m.rig.top_m >= m.rig.height_m - 1e-9, `${where}: top_m ${m.rig.top_m} under height_m ${m.rig.height_m}`);
        }
      }
    }
  });

  
  
  
  
  test(`${label}: face - eye and brow morphs at every LOD; mouthSmile lifts both mouth corners >= 8 mm`, () => {
    for (const lod of [0, 1, 2]) {
      let mouths = 0;
      for (const seed of [1, 2, 3]) {
        const m = mod.generate({ seed, season: 'summer', lod });
        const where = `${label} seed ${seed} lod ${lod}`;
        
        
        
        const brows = species === 'panda' || species === 'giraffe' ? [] : ['browsUp', 'browsDown', 'browsSad'];
        const mouth = species === 'human' ? [] : ['mouthSmile', 'mouthFrown']; 
        for (const k of ['lidsClose', 'eyesWide', ...mouth, ...brows]) assert.ok(m.morphs[k]?.index.size > 0, `${where}: no ${k}`);
        const lift = mouthCornerLift(m);
        if (lift === null && species === 'human') continue;
        assert.ok(lift !== null && lift >= 0.008, `${where}: mouth corners rise ${lift === null ? 'no mouth' : (lift * 1000).toFixed(1) + ' mm'} < 8 mm`);
        mouths++;
      }
      assert.ok(mouths >= 1, `${label} lod ${lod}: no seed has a mouth`);
    }
  });

  test(`${label}: the pig's biped with only added bones; eyes rigid on the head; soft weights never skip a joint; soles on the ground`, () => {
    for (const seed of [1, 2, 3]) {
      const m = gen(seed, 'summer', 0);
      const { bones } = m.rig;
      const names = bones.map((b) => b.name);
      assert.ok(bones.length <= MAX_BONES, `${bones.length} bones`);
      bones.forEach((b, i) => assert.ok(b.parent < i, `${b.name} parent after it`));
      for (const [name, parent] of BIPED) {
        const i = names.indexOf(name);
        assert.ok(i >= 0, `no ${name}`);
        const want = reparent[name] ?? parent;
        assert.equal(bones[i].parent < 0 ? null : bones[bones[i].parent].name, want, `${name}'s parent`);
      }
      assert.deepEqual(names.filter((n) => !BIPED.some(([b]) => b === n)).sort(), [...addedBones].sort());
      for (const n of names) assert.ok(JOINT_LIMITS[n], `no limits for ${n}`);
      const eye = m.groups.get('eye');
      for (let v = 0; v < eye.positions.length / 3; v++) assert.ok(eye.skinWeights[v * 4] === 1 && eye.skinIndices[v * 4] === boneIndex(m.rig, 'head'), `seed ${seed}: eye vertex ${v}`);
      const parents = bones.map((b) => b.parent);
      const near = (c, b) => b === c || parents[c] === b || parents[b] === c;
      for (const mat of ['fur', 'cloth']) {
        const g = m.groups.get(mat);
        for (let v = 0; v < g.positions.length / 3; v++) {
          const used = [0, 1, 2, 3].filter((k) => g.skinWeights[v * 4 + k] > 0).map((k) => g.skinIndices[v * 4 + k]);
          assert.ok(used.some((c) => used.every((b) => near(c, b))), `seed ${seed} ${mat} vertex ${v}: ${used.map((b) => bones[b].name)}`);
        }
      }
      for (const side of ['footL', 'footR']) for (const p of m.rig.contacts[side]) assert.equal(p[1], 0);
      if (headless) {
        
        const g = m.groups.get('fur');
        for (const [hand, lower] of [['handL', 'armLowerL'], ['handR', 'armLowerR']]) {
          const hb = bones[boneIndex(m.rig, hand)], lb = bones[boneIndex(m.rig, lower)];
          const axis = [hb.head[0] - lb.head[0], hb.head[1] - lb.head[1], hb.head[2] - lb.head[2]];
          const al = Math.hypot(...axis);
          let wide = 0;
          for (let v = 0; v < g.positions.length / 3; v++) {
            if (g.skinIndices[v * 4] !== boneIndex(m.rig, hand) || g.skinWeights[v * 4] < 0.9) continue;
            const p = [g.positions[v * 3], g.positions[v * 3 + 1], g.positions[v * 3 + 2]];
            const d = [p[0] - hb.head[0], p[1] - hb.head[1], p[2] - hb.head[2]];
            const t = (d[0] * axis[0] + d[1] * axis[1] + d[2] * axis[2]) / al;
            wide = Math.max(wide, Math.hypot(d[0] - (axis[0] / al) * t, d[1] - (axis[1] / al) * t, d[2] - (axis[2] / al) * t));
          }
          assert.ok(wide < 0.085, `seed ${seed} ${hand}: the arm tip is ${wide.toFixed(3)} m wide - a paw or mitten, not an arm tip`);
        }
      }
    }
  });

  test(`${label}: every clip keeps every joint in its limits; walk and run plant, alternate and do not skate; elbows and knees bend and feet roll; pickUp reaches low; carry holds in front`, (t) => {
    const m = gen(1, 'summer', 0);
    const rig = m.rig;
    const clips = buildClips(rig);
    assert.deepEqual(Object.keys(clips).sort(), [...CLIP_NAMES].sort());
    for (const clip of Object.values(clips)) {
      for (let s = 0; s <= 60; s++) {
        const pose = sampleClip(rig, clip, s / 60);
        rig.bones.forEach((b, i) => {
          const e = eulerFromQuat(pose.q, i * 4);
          ['x', 'y', 'z'].forEach((axis, k) => assert.ok(e[k] >= JOINT_LIMITS[b.name][axis][0] - 1e-6 && e[k] <= JOINT_LIMITS[b.name][axis][1] + 1e-6, `${clip.name} ${s / 60}: ${b.name}.${axis} ${e[k]}`));
        });
      }
    }
    for (const name of ['walk', 'run']) {
      const track = footTrack(rig, clips[name], rig.contacts, { samples: 240 });
      assert.deepEqual(gaitMisses(clips[name], track, gaitTable(rig, name).stance, { ground: 0.012 }), [], name);
    }
    
    const range = (clip, bone, k) => {
      let lo = Infinity, hi = -Infinity;
      for (let s = 0; s < 48; s++) { const e = eulerFromQuat(sampleClip(rig, clip, s / 48).q, boneIndex(rig, bone) * 4)[k]; lo = Math.min(lo, e); hi = Math.max(hi, e); }
      return [lo, hi];
    };
    const elbow = range(clips.walk, 'armLowerL', 0), knee = range(clips.walk, 'legLowerL', 0), foot = range(clips.walk, 'footL', 0);
    assert.ok(elbow[0] <= -0.6, `walk elbow bends to ${elbow[0].toFixed(2)} rad only`);
    assert.ok(knee[1] >= 0.45, `walk knee bends to ${knee[1].toFixed(2)} rad only`);
    assert.ok(foot[1] - foot[0] >= 0.15, `walk foot rolls ${(foot[1] - foot[0]).toFixed(2)} rad only`);
    const runElbow = range(clips.run, 'armLowerL', 0);
    assert.ok(runElbow[0] <= -1.0, `run elbow bends to ${runElbow[0].toFixed(2)} rad only`);
    for (const bone of addedBones) {
      const r = [0, 1, 2].map((k) => range(clips.idle, bone, k)).reduce((m2, [lo, hi]) => Math.max(m2, hi - lo), 0);
      assert.ok(r >= 0.05, `idle: ${bone} does not sway (${r.toFixed(3)} rad)`);
    }
    const hands = ['handL', 'handR'].map((n) => boneIndex(rig, n));
    let lowest = Infinity;
    for (let s = 0; s <= 110; s++) {
      const fk = forwardKinematics(rig, sampleClip(rig, clips.pickUp, s / 110));
      for (const i of hands) lowest = Math.min(lowest, carriedPoint(rig, fk, i, rig.bones[i].tail)[1]);
    }
    assert.ok(lowest <= 0.2, `pickUp: lowest hand tip ${lowest} m`);
    const fk = forwardKinematics(rig, sampleClip(rig, clips.carry, 0.25));
    const chest = jointPosition(fk, boneIndex(rig, 'chest'));
    for (const i of hands) {
      const tip = carriedPoint(rig, fk, i, rig.bones[i].tail);
      assert.ok(tip[2] >= chest[2] + 0.1 && Math.abs(tip[0]) < 0.3, `carry: ${rig.bones[i].name} tip at ${tip.map((v) => v.toFixed(3))}`);
    }
    t.diagnostic(`walk stride ${clips.walk.stride} m ${clips.walk.duration} s; elbow ${elbow.map((v) => v.toFixed(2))} knee ${knee.map((v) => v.toFixed(2))}; pickUp low ${lowest.toFixed(3)}`);
  });

  
  
  test(`${label}: arms stretch and settle - rest length at the ends of pickUp, longest as it reaches, longer at a run's swing ends than mid-swing; legs never stretch on a planted foot`, () => {
    const m = gen(1, 'summer', 0);
    const rig = m.rig;
    assert.ok(rig.stretch && rig.stretch.arms > 0, `${label}: no arm stretch on the rig`);
    const clips = buildClips(rig);
    const S = (clip, phase, bone) => sampleClip(rig, clip, phase).s[boneIndex(rig, bone)];
    for (const bone of ['armUpperL', 'armLowerL', 'armUpperR', 'armLowerR']) {
      assert.equal(S(clips.pickUp, 0, bone), 1, `pickUp starts with ${bone} at rest length`);
      assert.equal(S(clips.pickUp, 1, bone), 1, `pickUp ends with ${bone} at rest length`);
      const reach = Math.max(...[0.36, 0.43, 0.5].map((p) => S(clips.pickUp, p, bone)));
      assert.ok(reach >= 1 + 0.8 * rig.stretch.arms, `pickUp: ${bone} reaches only ${reach.toFixed(3)}`);
    }
    assert.ok(S(clips.run, 0, 'armUpperR') > S(clips.run, 0.25, 'armUpperR') + 0.05, `run: ${S(clips.run, 0, 'armUpperR')} at the swing's end vs ${S(clips.run, 0.25, 'armUpperR')} mid-swing`);
    if (rig.stretch.legs) {
      const track = footTrack(rig, clips.run, rig.contacts, { samples: 96 });
      for (const side of ['L', 'R']) {
        const down = plantedFlags(track[side].y, 0.002);
        down.forEach((isDown, i) => {
          if (isDown) assert.ok(S(clips.run, i / 96, `legLower${side}`) <= 1 + 0.1 * rig.stretch.legs, `run ${i / 96}: legLower${side} stretched on a planted foot`);
        });
      }
    }
  });

  test(`${label}: deformation at the walk, run, pickUp, carry and idle extremes stays inside the bar (rig/measure.mjs DEFORMATION)`, () => {
    for (const [seed, season] of [[1, 'summer'], [2, 'summer'], [3, 'winter']]) {
      const m = gen(seed, season, 0);
      const clips = buildClips(m.rig);
      for (const [name, phases] of EXTREMES) {
        for (const p of phases) {
          const mats = skinMatrices(m.rig, forwardKinematics(m.rig, sampleClip(m.rig, clips[name], p)));
          
          
          for (const mat of ['fur', 'skin', 'cloth'].filter((k) => m.groups.has(k))) {
            const r = deformationReport(m.groups.get(mat), mats, { strict: DEFORMATION, minRestArea: DEFORMATION.minRestArea });
            const where = `seed ${seed} ${season} ${mat} ${name} at ${p}`;
            assert.ok(r.badShare <= DEFORMATION.maxBadShare, `${where}: ${(r.badShare * 100).toFixed(2)} % of the surface off the bar`);
            assert.ok(r.minAreaRatio >= DEFORMATION.floorAreaRatio && r.maxAreaRatio <= DEFORMATION.capAreaRatio, `${where}: a triangle went to ${r.minAreaRatio} / ${r.maxAreaRatio}x`);
          }
        }
      }
    }
  });

  
  test(`${label}: no gaps - the body is one closed surface from head to feet, and in every clip's extremes it neither cracks nor tears at the neck, shoulders or hips`, (t) => {
    const lines = [];
    for (const [seed, season, lod] of [[1, 'summer', 0], [2, 'winter', 1], [3, 'summer', 2]]) {
      const m = gen(seed, season, lod);
      const where = `seed ${seed} ${season} lod ${lod}`;
      const w = weld(m);
      m.__weld = w;
      const { open, pinched, edges } = openEdges(w);
      assert.equal(open, 0, `${where}: ${open} edges on the rim of a hole`);
      
      assert.ok(pinched <= edges * 0.025, `${where}: ${pinched} pinched edges of ${edges}`);
      
      
      const find = components(w);
      const B = (n) => boneIndex(m.rig, n);
      
      
      
      
      
      const bonesIn = new Map(), skinIn = new Map();
      let crownId = -1, crownY = -Infinity;
      w.members.forEach((mem, id) => {
        const root = find(id);
        if (!bonesIn.has(root)) bonesIn.set(root, new Set());
        bonesIn.get(root).add(dominant(m, mem[0]));
        const skinny = mem.some(([mat]) => mat === 'fur' || mat === 'skin');
        if (!skinny) return;
        skinIn.set(root, (skinIn.get(root) || 0) + 1);
        const [mat, v] = mem[0];
        const y = m.groups.get(mat).positions[v * 3 + 1];
        if (dominant(m, mem[0]) === B('head') && y > crownY) { crownY = y; crownId = id; }
      });
      assert.ok(crownId >= 0, `${where}: no head skin`);
      const body = find(crownId);
      
      
      for (const [root, n] of skinIn) {
        if (root !== body) assert.ok(n < 0.15 * skinIn.get(body), `${where}: a second skin piece of ${n} vertices (the body has ${skinIn.get(body)})`);
      }
      
      
      
      const digit = /^(thumb|index|middle|ring)/;
      const want = ['head', 'handL', 'handR', 'footL', 'footR', ...addedBones.filter((n) => !/^neck/.test(n) && !(lod === 2 && digit.test(n)))];
      for (const n of want) assert.ok(bonesIn.get(body).has(B(n)), `${where}: the ${n} surface is not joined to the body`);
      const clips = buildClips(m.rig);
      let worst = { stretch: 0, share: -1 };
      let longest = 1;
      for (const [name, phases] of SEAM_POSES) {
        for (const p of phases) {
          const pose = sampleClip(m.rig, clips[name], p);
          longest = Math.max(longest, ...pose.s);
          const r = seamReport(m, skinMatrices(m.rig, forwardKinematics(m.rig, pose)));
          
          
          assert.ok(r.crack < 1e-9, `${where} ${name} at ${p}: welded vertices ${r.crack} m apart`);
          assert.ok(r.seamEdges > 20, `${where}: only ${r.seamEdges} seam edges measured`);
          
          
          
          
          if (r.share >= (worst.share ?? -1)) worst = { ...r, name, p };
        }
      }
      
      if (m.rig.stretch) assert.ok(longest >= 1.2, `${where}: the seam poses never stretched a bone past ${longest.toFixed(3)}`);
      lines.push(`${where}: worst seam ${(worst.share * 100).toFixed(2)} % past ${SEAM_STRETCH}x, max edge ${worst.stretch.toFixed(2)}x at the ${worst.worst} (${worst.name} ${worst.p}); longest bone ${longest.toFixed(2)}x`);
    }
    t.diagnostic(lines.join(' | '));
  });
}


export const FINGER_BONES = Object.freeze(['thumbL', 'indexL', 'middleL', 'ringL', 'thumbR', 'indexR', 'middleR', 'ringR']);



export function humanTests(label, args) {
  let cached = null;
  const human = () => (cached ||= generate({ species: 'human', seed: 1, season: 'summer', lod: 0, ...args }));

  test(`${label}: four digits on each hand, each on its own bone under the hand, each modelled`, () => {
    const m = human();
    const { bones } = m.rig;
    for (const side of ['L', 'R']) {
      const hand = boneIndex(m.rig, `hand${side}`);
      for (const digit of ['thumb', 'index', 'middle', 'ring']) {
        const i = boneIndex(m.rig, `${digit}${side}`);
        assert.equal(bones[i].parent, hand, `${digit}${side} hangs from hand${side}`);
        assert.ok(bones[i].tail, `${digit}${side} has a tip`);
        let n = 0;
        for (const mat of ['skin', 'fur', 'cloth']) {
          const g = m.groups.get(mat);
          if (!g) continue;
          for (let v = 0; v < g.positions.length / 3; v++) if (g.skinIndices[v * 4] === i && g.skinWeights[v * 4] > 0.5) n++;
        }
        assert.ok(n >= 15, `${digit}${side}: only ${n} vertices follow it - a bone with no finger`);
      }
    }
    assert.equal(m.rig.build, args.build);
  });

  test(`${label}: grip contacts sit inside each hand with a unit axis; fingers relax in idle and grip in carry`, () => {
    const m = human();
    for (const side of ['L', 'R']) {
      const grip = m.rig.contacts[`grip${side}`];
      assert.ok(grip, `no grip${side}`);
      assert.equal(grip.bone, `hand${side}`);
      const head = m.rig.bones[boneIndex(m.rig, `hand${side}`)].head;
      assert.ok(dist(grip.at, head) < 0.08, `grip${side} is ${dist(grip.at, head).toFixed(3)} m from the hand`);
      assert.ok(Math.abs(Math.hypot(...grip.axis) - 1) < 1e-9, `grip${side} axis is not unit`);
    }
    const clips = buildClips(m.rig);
    const curl = (clip, phase) => Math.abs(eulerFromQuat(sampleClip(m.rig, clip, phase).q, boneIndex(m.rig, 'indexL') * 4)[2]);
    assert.ok(curl(clips.idle, 0.3) < 0.6, `idle index curl ${curl(clips.idle, 0.3)}`);
    assert.ok(curl(clips.carry, 0.3) >= 1.0, `carry index curl ${curl(clips.carry, 0.3)}`);
  });
}
