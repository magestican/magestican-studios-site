





import * as S from '../mesh/sdf.mjs';
import { MeshData } from '../mesh/meshData.mjs';
import { createSkeleton, kneeBetween, boneIndex } from './skeleton.mjs';
import { partWeights, rigidWeights, setSkin } from './skin.mjs';

const mirror = (p) => [-p[0], p[1], p[2]];

export function figure({ cell = 0.018, targetTris = 2400 } = {}) {
  
  
  const hipL = [0.1, 0.215, 0], ankleL = [0.105, 0.052, 0];
  const kneeL = kneeBetween(hipL, ankleL, 0.014);
  
  
  
  
  const shoulderL = [0.17, 0.45, 0], elbowL = [0.228, 0.352, 0.025], wristL = [0.255, 0.268, 0.05];
  const earL = [0.16, 0.88, -0.01];
  const joints = {
    root: [0, 0, 0], hips: [0, 0.235, -0.01], spine: [0, 0.3, 0], chest: [0, 0.4, -0.005], neck: [0, 0.49, 0], head: [0, 0.54, 0.01],
    earL, earR: mirror(earL),
    armUpperL: shoulderL, armLowerL: elbowL, handL: wristL,
    armUpperR: mirror(shoulderL), armLowerR: mirror(elbowL), handR: mirror(wristL),
    legUpperL: hipL, legLowerL: kneeL, footL: ankleL,
    legUpperR: mirror(hipL), legLowerR: mirror(kneeL), footR: mirror(ankleL),
    tail1: [0, 0.25, -0.2], tail2: [0.015, 0.275, -0.235], tail3: [-0.005, 0.3, -0.25],
  };
  const tip = { handL: [0.265, 0.218, 0.065], footL: [0.105, 0.03, 0.1], earL: [0.25, 1.0, 0.04] };
  const tails = {
    handL: tip.handL, handR: mirror(tip.handL), footL: tip.footL, footR: mirror(tip.footL),
    earL: tip.earL, earR: mirror(tip.earL), head: [0, 0.93, 0.02], tail3: [0.01, 0.31, -0.225],
  };
  const skeleton = createSkeleton(joints, tails);
  const J = joints;
  const limb = (s, j) => (s === 'L' ? j : mirror(j));
  const parts = [
    ['hips', S.ellipsoid([0, 0.24, -0.01], [0.18, 0.12, 0.16])],
    ['spine', S.ellipsoid([0, 0.31, 0.03], [0.15, 0.14, 0.18])],
    ['chest', S.ellipsoid([0, 0.41, 0], [0.135, 0.1, 0.13])],
    ['neck', S.capsule([0, 0.47, 0], [0, 0.53, 0.01], 0.085)],
    ['head', S.ellipsoid([0, 0.72, 0.02], [0.24, 0.21, 0.22])],
    ['tail1', S.roundCone(J.tail1, J.tail2, 0.02, 0.017)],
    ['tail2', S.roundCone(J.tail2, J.tail3, 0.017, 0.014)],
    ['tail3', S.roundCone(J.tail3, tails.tail3, 0.014, 0.01)],
  ];
  for (const s of ['L', 'R']) {
    parts.push(
      [`ear${s}`, S.roundCone(J[`ear${s}`], tails[`ear${s}`], 0.05, 0.02)],
      [`armUpper${s}`, S.roundCone(J[`armUpper${s}`], J[`armLower${s}`], 0.05, 0.045)],
      [`armLower${s}`, S.roundCone(J[`armLower${s}`], J[`hand${s}`], 0.045, 0.04)],
      [`hand${s}`, S.ellipsoid(tails[`hand${s}`], [0.045, 0.05, 0.045])],
      [`legUpper${s}`, S.roundCone(J[`legUpper${s}`], J[`legLower${s}`], 0.062, 0.054)],
      [`legLower${s}`, S.roundCone(J[`legLower${s}`], J[`foot${s}`], 0.054, 0.048)],
      [`foot${s}`, S.ellipsoid(limb(s, [0.105, 0.042, 0.03]), [0.052, 0.042, 0.08])],
    );
  }
  
  
  const blendOf = (bone) => (/^leg|^arm/.test(bone) ? 0.045 : /^(ear|tail)/.test(bone) ? 0.015 : 0.03);
  const skinParts = parts.map(([bone, node]) => ({ bone: boneIndex(skeleton, bone), node, blend: blendOf(bone) }));
  
  const limbOf = (p) => (skeleton.bones[p.bone].name.match(/^(arm|hand|leg|foot)\w*([LR])$/) || [])[2];
  const limbs = (kind, s) => S.union(0.02, skinParts.filter((p) => limbOf(p) === s && new RegExp(kind).test(skeleton.bones[p.bone].name)).map((p) => p.node));
  const trunk = S.union(0.03, skinParts.filter((p) => !limbOf(p)).map((p) => p.node));
  const body = S.union(0.018, trunk, limbs('^(arm|hand)', 'L'), limbs('^(arm|hand)', 'R'), limbs('^(leg|foot)', 'L'), limbs('^(leg|foot)', 'R'));
  const md = new MeshData('rig-figure');
  S.sdfPart(md, body, { min: [-0.45, -0.03, -0.36], max: [0.45, 1.06, 0.36], cell, targetTris, material: 'fur', ao: { reach: 0.04 } });
  const skin = md.groups.get('fur');
  setSkin(skin, 0, partWeights(skin.positions, skinParts, { parents: skeleton.bones.map((b) => b.parent) }));
  
  const eye = S.paint(S.sphere([0.09, 0.76, 0.225], 0.03), { material: 'eye' });
  S.sdfPart(md, eye, { min: [0.04, 0.71, 0.17], max: [0.14, 0.81, 0.28], cell: 0.006, targetTris: 60, material: 'eye' });
  const eyes = md.groups.get('eye');
  setSkin(eyes, 0, rigidWeights(eyes.positions.length / 3, boneIndex(skeleton, 'head')));
  const contacts = { footL: [[0.105, 0, -0.04], [0.105, 0, 0.1]], footR: [[-0.105, 0, -0.04], [-0.105, 0, 0.1]] };
  md.rig = { bones: skeleton.bones, contacts };
  return { md, skeleton, parts: skinParts, contacts };
}
