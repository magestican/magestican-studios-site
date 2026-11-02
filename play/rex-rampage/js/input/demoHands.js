




import { CENTRE_UP, REACH_X, REACH_Y } from './aim.js';

const J = (x, y) => ({ x, y, score: 0.95 });
const TORSO = 150;
const RIGHT_SHOULDER = { x: 260, y: 200 };
const LEFT_SHOULDER = { x: 380, y: 200 };


function gunAt(shoulder, x, y, forearm) {
  const tip = { x: shoulder.x + x * REACH_X * TORSO, y: shoulder.y - CENTRE_UP * TORSO - y * REACH_Y * TORSO };
  const wx = tip.x - 0.6 * forearm.x;
  const wy = tip.y - 0.6 * forearm.y;
  return { wrist: J(wx, wy), elbow: J(wx - forearm.x, wy - forearm.y) };
}


export function demoHands(tS) {
  const w = 1.3;
  const reload = tS >= 10 && tS % 15 >= 0.5 && tS % 15 < 2.5;
  const both = tS % 60 >= 20 && tS % 60 < 30;
  const right = reload
    ? { wrist: J(258, 60), elbow: J(255, 120) }
    : 
      gunAt(RIGHT_SHOULDER, 0.0625 + 0.1607 * Math.sin(w * tS), -0.2597 - 0.2326 * Math.sin(2.3 * w * tS), { x: -40, y: -20 });
  const left = both
    ? gunAt(LEFT_SHOULDER, 0.3973 + 0.5357 * Math.sin(w * tS + 1.7), 0.1279 - 0.4845 * Math.cos(w * tS), { x: 15, y: -60 })
    : { wrist: J(405, 350), elbow: J(400, 280) };
  return {
    pose: {
      nose: J(320, 130),
      left_shoulder: J(380, 200),
      right_shoulder: J(260, 200),
      left_hip: J(370, 350),
      right_hip: J(270, 350),
      right_elbow: right.elbow,
      right_wrist: right.wrist,
      left_elbow: left.elbow,
      left_wrist: left.wrist,
    },
    width: 640,
    height: 480,
    t: tS,
  };
}
