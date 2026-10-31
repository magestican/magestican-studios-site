





const J = (x, y) => ({ x, y, score: 0.95 });


export function demoHands(tS) {
  const w = 1.3;
  const reload = tS >= 10 && tS % 15 >= 0.5 && tS % 15 < 2.5;
  const both = tS % 60 >= 20 && tS % 60 < 30;
  const right = reload
    ? { wrist: J(258, 60), elbow: J(255, 120) }
    : (() => {
        const wx = 358 + 36 * Math.sin(w * tS); 
        const wy = 166 + 24 * Math.sin(2.3 * w * tS); 
        return { wrist: J(wx, wy), elbow: J(wx + 40, wy + 20) };
      })();
  const lx = 400 + 120 * Math.sin(w * tS + 1.7);
  const ly = 150 + 50 * Math.cos(w * tS);
  const left = both ? { wrist: J(lx, ly), elbow: J(lx - 15, ly + 60) } : { wrist: J(405, 350), elbow: J(400, 280) };
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
