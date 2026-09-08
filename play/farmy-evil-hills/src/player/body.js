























import { solve, ARCH } from '../../../2d-fighter-ex/src/animeRig.mjs';
import { gaitPose, standPose, gripOf, cycleTravel, STRUGGLE_CYCLE } from '../../../../web-engine/horror/gait.js';









import {
  humanise, XANDER_RIG, XANDER_SEG, XANDER_SPANS, XANDER_DEPTHS, XANDER_FOOT, XANDER_LIMB_PROFILE,
  xanderJoints,
} from '../../../../web-engine/horror/xanderRig.js';
import { segmentsOf, torsoBoxOf, jointsOf, girdleOf } from '../../../../web-engine/ps1/ps1Rig.mjs';
import { buildFighter } from '../../../../web-engine/ps1/ps1Mesh.mjs';
import { hair3d } from '../../../../web-engine/ps1/ps1Head.mjs';
import { paintXanderAtlas } from '../../../../web-engine/horror/tools/xanderAtlas.mjs';
import { atlasUvs, unmappedParts } from '../../../../web-engine/horror/xanderUv.js';
import { XANDER_H } from '../constants.js';
import { XANDER_JAW, narrowAcross } from './face.js';


































export const DEATH_FALL = 0.75;

export const DEATH_LIE = 3.2;

export const WALK_FRAMES = 14;




export const AIM_FRAMES = 10;

export const RAISE_FRAMES = 7;

export const TALK_FRAMES = 7;

export const TALK_TIME = 1.5;

export const FIDGET_TIME = 2.2;



export const TALK_TO = Object.freeze({
  hands: [[0.24, 0.60], [0.07, 0.51]],
  twist: 0.14, lean: 0.02, grip: 'open',
});

export const SPRINT_FRAMES = 12;













export const IDLE_FRAMES = 6;

export const IDLE_TIME = 3.5;

export const FIRE_FRAMES = 6;







export const STRUGGLE_FRAMES = 16;



export const STRUGGLE_TIME = STRUGGLE_CYCLE;





export const DEATH_FRAMES = 10;







export const KICK_FRAMES = 8;



export const REACH_FRAMES = 8;





export const SHUFFLE_FRAMES = 10;


export const FIRE_TIME = 0.42;

export const DEATH_TIME = 0.9;














export const STRIDE = cycleTravel('walk') * XANDER_H;








export const STEP_OFF_FRAMES = 10;

export const SPRINT_STRIDE = cycleTravel('sprint') * XANDER_H;

















export function walkPose(phase, mode = 'walk') {
  const idle = standPose(0);
  const g = gaitPose(phase, mode);
  
  
  return { ...idle, ...g };
}

export function xanderParts(pose) {
  
  
  
  
  
  
  
  
  



const A = { ...ARCH.renji, hair: 'sleek', jaw: ARCH.renji.jaw, brow: ARCH.renji.brow };
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  pose = pose || standPose(0);
  const K = humanise(solve(pose, { flip: false }));
  const o = {
    flip: false, seg: XANDER_SEG, spans: XANDER_SPANS, depths: XANDER_DEPTHS,
  };
  const built = buildFighter(K, {
    segments: segmentsOf(K, o), torso: torsoBoxOf(K, o),
    
    
    
    
    
    
    
    
    profiles: XANDER_LIMB_PROFILE,
    joints: xanderJoints(jointsOf(K, o)), girdle: girdleOf(K, o),
    headR: XANDER_RIG.headR, arch: { build: 1, jaw: A.jaw, brow: A.brow, hair: 'sleek' },
    flip: false, pose, head: false,
    
    
    footScale: XANDER_FOOT,
    
    
    
    hands: gripOf(pose),
  });
  
  
  
  
  
  
  
  
  const hc = [K.head[0], 0, K.head[1]];
  const r = XANDER_RIG.headR;
  return [...built.parts,
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    {
      name: 'hair',
      mesh: narrowAcross(hair3d('sleek', {
        centre: hc, r: r * 1.07, forward: [1, 0, 0], jaw: XANDER_JAW, brow: A.brow,
      })),
    },
  ].filter((p) => p.mesh && p.mesh.indices && p.mesh.indices.length);
}












export const XANDER_ATLAS = paintXanderAtlas({ seed: 7 });









let mappingChecked = false;
export function xanderTexturedParts(pose) {
  const parts = xanderParts(pose);
  if (!mappingChecked) {
    const missing = unmappedParts(parts);
    if (missing.length) throw new Error(`xanderTexturedParts: no atlas mapping for ${missing.join(', ')}`);
    mappingChecked = true;
  }
  return atlasUvs(parts, XANDER_ATLAS.rects);
}
