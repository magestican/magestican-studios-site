



export const QUALITY = {
  high: { pixelRatioCap: 2, detectEvery: 1 },
  medium: { pixelRatioCap: 1, detectEvery: 1 },
  low: { pixelRatioCap: 0.75, detectEvery: 2 },
};

const ORDER = ['high', 'medium', 'low'];
export const DOWN_FPS = 15;
export const UP_FPS = 26;
const DOWN_S = 2;
const UP_S = 5;




export function initialQuality(level = 'high') {
  return { level, fps: 30, below: 0, above: 0 };
}

const PHONE_UA = /Android|iPhone|iPad|iPod|Mobile/i;








export function devicePlan({ coarse, ua, model }) {
  const phone = coarse || PHONE_UA.test(ua);
  const landmark = model === 'lite' || model === 'full' ? model : phone ? 'lite' : 'full';
  return {
    phone,
    landmark,
    camera: phone ? { width: { ideal: 640 }, height: { ideal: 480 } } : { width: { ideal: 960 }, height: { ideal: 720 } },
     start: phone ? 'medium' : 'high',
    cpuFallback: !phone,
    
    maxPixelRatio: phone ? 1.5 : 2,
  };
}


export function stepQuality(s, dtS) {
  if (!(dtS > 0) || dtS > 2) return s; 
  const fps = s.fps + (1 / dtS - s.fps) * Math.min(1, dtS * 2);
  let below = fps < DOWN_FPS ? s.below + dtS : 0;
  let above = fps > UP_FPS ? s.above + dtS : 0;
  let level = s.level;
  const i = ORDER.indexOf(level);
  if (below >= DOWN_S && i < ORDER.length - 1) {
    level =  (ORDER[i + 1]);
    below = 0;
  } else if (above >= UP_S && i > 0) {
    level =  (ORDER[i - 1]);
    above = 0;
  }
  return { level, fps, below, above };
}
