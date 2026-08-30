















































const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));





export const BTN_MIN_PX = 64;
export const BTN_MAX_PX = 96;
export const BTN_WIDTH_FRACTION = 0.09;


export const STEER_ZONE_FRACTION = 0.42;



export const STEER_TRAVEL_MIN_PX = 60;
export const STEER_TRAVEL_FRACTION = 0.16;


export const BRAKE_SLIDE_PX = 70;









export const WHEEL_MAX_DEG = 130;


export function buttonRadius(viewportWidth) {
  return clamp(viewportWidth * BTN_WIDTH_FRACTION, BTN_MIN_PX, BTN_MAX_PX);
}


export function steerTravelPx(viewportWidth) {
  return Math.max(STEER_TRAVEL_MIN_PX, viewportWidth * STEER_TRAVEL_FRACTION);
}


export function steerFromDrag(dx, viewportWidth) {
  return clamp(dx / steerTravelPx(viewportWidth), -1, 1);
}


export function isBrakeSlide(dy) {
  return dy > BRAKE_SLIDE_PX;
}


export function wheelAngleDeg(steer) {
  return clamp(steer, -1, 1) * WHEEL_MAX_DEG;
}

const inside = (r, x, y) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;








































export function touchZoneRects(viewportWidth, viewportHeight) {
  const w = viewportWidth;
  const h = viewportHeight;
  const r = buttonRadius(w);
  const steerRight = w * STEER_ZONE_FRACTION;

  
  
  
  
  
  
  
  
  
  
  const itemLeft = Math.max(steerRight, w - 2.6 * r);
  
  
  
  
  
  
  const itemH = 2.2 * r * Math.min(1, (h * 0.55) / (2.2 * r));
  return {
    steer: { x: 0, y: 0, w: steerRight, h },
    item: { x: itemLeft, y: h - itemH, w: w - itemLeft, h: itemH },
  };
}





export function touchZoneAt(x, y, viewportWidth, viewportHeight) {
  const z = touchZoneRects(viewportWidth, viewportHeight);
  if (inside(z.item, x, y)) return 'item';
  if (inside(z.steer, x, y)) return 'steer';
  return 'throttle';
}














export function touchOverlayLayout(viewportWidth, viewportHeight) {
  const w = viewportWidth;
  const h = viewportHeight;
  const zones = touchZoneRects(w, h);
  const r = buttonRadius(w);
  const margin = clamp(Math.min(w, h) * 0.035, 10, 26);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const WHEEL_FOOT = 58;
  const wheelSize = clamp(
    Math.min(zones.steer.w - margin * 1.5, (h - WHEEL_FOOT) * 0.46), 96, 208,
  );
  const wheel = {
    x: Math.round(margin * 0.75),
    y: Math.max(0, h - margin - WHEEL_FOOT - wheelSize),
    w: wheelSize,
    h: wheelSize,
  };

  
  
  
  
  
  
  
  
  
  
  
  
  const colCx = zones.item.x + zones.item.w / 2;
  const stackTop = zones.item.y;
  
  
  
  
  
  const topGuard = h * 0.34;
  const gap = Math.max(8, margin * 0.5);
  const available = Math.max(0, stackTop - gap - topGuard);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  let pedal;
  if (available >= 96) {
    const ph = Math.min(available, r * 1.85);
    const pw = clamp(ph * 0.66, 76, zones.item.w);
    pedal = { x: colCx - pw / 2, y: stackTop - gap - ph, w: pw, h: ph };
  } else {
    
    
    const floor = zones.item.y;
    const ph = clamp(floor - gap - topGuard, 44, 58);
    const left = zones.steer.w + gap;
    const right = Math.max(left + 120, zones.item.x - gap);
    
    
    
    
    
    
    const span = right - left;
    const pw = Math.max(120, Math.min(span, span * 0.62));
    pedal = {
      x: left + (span - pw) / 2, y: Math.max(0, floor - gap - ph), w: pw, h: ph,
    };
  }

  
  
  
  
  const glyph = (z, fraction) => {
    const s = Math.min(z.w, z.h) * fraction;
    return { x: z.x + (z.w - s) / 2, y: z.y + (z.h - s) / 2, w: s, h: s };
  };

  return {
    wheel,
    pedal,
    item: glyph(zones.item, 0.62),
  };
}
