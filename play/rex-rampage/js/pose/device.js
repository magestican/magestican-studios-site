



const PHONE_UA = /Android|iPhone|iPad|iPod|Mobile/i;
const LOW_CAMERA = { width: { ideal: 480 }, height: { ideal: 360 } };





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
    cpuFallback: !phone && !lowPower,
    maxPixelRatio: lowPower ? 1 : phone ? 1.5 : 2,
  };
}




export const PIXEL_BUDGET = 550_000;


export function pixelRatioFor(w, h, dpr, maxPixelRatio) {
  const want = Math.min(dpr || 1, maxPixelRatio);
  return Math.min(want, Math.sqrt(PIXEL_BUDGET / Math.max(1, w * h)));
}
