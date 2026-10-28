



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















export function devicePlan({ coarse, ua, model, memory, cores, power }) {
  const phone = coarse || PHONE_UA.test(ua);
  const weak = phone && ((memory != null && memory <= 3) || (cores != null && cores <= 4));
  const lowPower = power === 'low' || (power !== 'normal' && weak);
  const landmark = model === 'lite' || model === 'full' ? model : phone || lowPower ? 'lite' : 'full';
  return {
    phone,
    lowPower,
    landmark,
    camera: lowPower
      ? LOW_CAMERA
      : phone
        ? { width: { ideal: 640 }, height: { ideal: 480 } }
        : { width: { ideal: 960 }, height: { ideal: 720 } },
     start: lowPower ? 'low' : phone ? 'medium' : 'high',
    cpuFallback: !phone && !lowPower,
    
    maxPixelRatio: lowPower ? 1 : phone ? 1.5 : 2,
    stickerPx: lowPower ? 192 : phone ? 256 : 384,
    maxParticles: lowPower ? LOW_PARTICLES : 420,
    allow3d: !lowPower,
  };
}

export const LOW_CAMERA = { width: { ideal: 480 }, height: { ideal: 360 } };
export const LOW_PARTICLES = 140;
const POWER_S = 6;



export function initialPower() {
  return { low: false, secs: 0 };
}






export function stepPower(p, q, dtS) {
  if (p.low || !(dtS > 0) || dtS > 2) return p;
  const secs = q.level === 'low' && q.fps < DOWN_FPS ? p.secs + dtS : 0;
  return secs >= POWER_S ? { low: true, secs: 0 } : { low: false, secs };
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
