














































const hex = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16),
  parseInt(c.slice(5, 7), 16)];
const toHex = (c) => `#${c.map((v) => Math.round(Math.max(0, Math.min(255, v)))
  .toString(16).padStart(2, '0')).join('')}`;
export function wash(colour, sky, t) {
  const a = hex(colour);
  const b = hex(sky);
  return toHex(a.map((v, i) => v + (b[i] - v) * t));
}




const FAR = 0.66;
const RAIL = 0.44;
const MID = 0.20;



function ridge(rng, G, W, top, spread, step = 46) {
  const pts = [[-260, G + 40]];
  let y = top + rng.rangeI(0, spread);
  for (let x = -260; x <= W + 260; x += step) {
    y = Math.max(top - spread, Math.min(top + spread, y + rng.rangeI(-13, 13)));
    pts.push([x, y]);
  }
  pts.push([W + 260, G + 40]);
  return pts;
}





function pineAt(x, base, h, fill) {
  const w = h * 0.44;
  const out = [];
  for (let k = 0; k < 3; k += 1) {
    const t = k / 3;
    out.push({
      t: 'poly',
      fill,
      pts: [[x, base - h + h * t * 0.52],
        [x - w * (1 - t * 0.42), base - h * 0.2 + h * t * 0.5],
        [x + w * (1 - t * 0.42), base - h * 0.2 + h * t * 0.5]],
    });
  }
  out.push({ t: 'rect', fill, x: x - 1.5, y: base - h * 0.2, w: 3, h: h * 0.2 });
  return out;
}




export const FEUDAL = Object.freeze({
  id: 'feudal',
  label: 'feudal Japan',
  sky: { high: '#F2A96A', mid: '#E4707E', low: '#9C4370', glow: '#FF8A6A' },
  
  
  washTo: '#9C4370',
  
  
  sun: { x: 0.63, y: 0.30, r: 46, fill: '#FF6A5A', halo: 0.34 },
  shaftAlpha: 0.13,
  train: false,
  weather: { particle: 'petal', petal: '#F2C8CE', petalDeep: '#D48A9C' },
  build(rng, planes, { W, G }) {
    const S = this.washTo;
    
    
    
    
    
    
    
    
    
    
    
    for (const [plane, d, top, spread, tone] of [
      ['far', FAR, 96, 20, '#C0637A'],
      ['rail', RAIL, 122, 17, '#6A3159'],
      ['mid', MID, 148, 14, '#4E2143'],
    ]) {
      planes[plane].push({
        t: 'poly', fill: wash(tone, S, d), pts: ridge(rng, G, W, top, spread),
      });
    }
    
    
    
    const tx = 250;
    const th = 96;
    const tw = 86;
    const ink = wash('#2B0E24', S, MID);
    planes.mid.push(
      { t: 'rect', fill: ink, x: tx, y: G - th, w: 10, h: th },
      { t: 'rect', fill: ink, x: tx + tw, y: G - th, w: 10, h: th },
      {
        t: 'poly',
        fill: ink,
        pts: [[tx - 20, G - th], [tx + tw + 30, G - th],
          [tx + tw + 24, G - th + 13], [tx - 14, G - th + 13]],
      },
      { t: 'rect', fill: ink, x: tx - 6, y: G - th + 26, w: tw + 22, h: 8 },
    );
    
    
    
    
    
    
    
    
    for (let x = -40; x < W + 40; x += rng.rangeI(70, 190)) {
      planes.mid.push(...pineAt(x, G, rng.rangeI(34, 62), wash('#33132C', S, MID)));
    }
    planes.ground.push({ t: 'rect', fill: '#2A0C22', x: -300, y: G, w: W + 600, h: 120 });
    
    
    
    
    
    
    
    for (let x = -80; x < W + 80; x += rng.rangeI(210, 430)) {
      planes.near.push(...pineAt(x, G + 96, rng.rangeI(126, 186), '#1B0718'));
    }
  },
});




export const NEON = Object.freeze({
  id: 'neon',
  label: 'neon future',
  sky: { high: '#241243', mid: '#3A1250', low: '#1B0B33', glow: '#5A1A55' },
  
  
  
  
  
  
  
  
  washTo: '#3A1250',
  sun: null,
  shaftAlpha: 0.05,
  train: true,          
  weather: { particle: 'rain', petal: '#9AC8FF', petalDeep: '#FF7FB8' },
  build(rng, planes, { W, G }) {
    const S = this.washTo;
    
    
    
    
    
    for (const [plane, d, lo, hi, tone, lit] of [
      ['far', FAR, 44, 96, '#2A1152', '#8A6ACC'],
      ['rail', RAIL, 58, 124, '#1D0C3E', '#FF3D8A'],
      ['mid', MID, 40, 104, '#140828', '#2DE2FF'],
    ]) {
      let x = -80;
      while (x < W + 80) {
        const w = rng.rangeI(26, 62);
        const h = rng.rangeI(lo, hi);
        planes[plane].push({ t: 'rect', fill: wash(tone, S, d), x, y: G - h, w, h });
        for (let gy = G - h + 8; gy < G - 8; gy += 11) {
          for (let gx = x + 5; gx < x + w - 4; gx += 9) {
            
            if (rng.rangeI(0, 100) < 34) {
              planes[plane].push({
                t: 'rect', fill: wash(lit, S, d * 0.5), x: gx, y: gy, w: 3, h: 5,
              });
            }
          }
        }
        x += w + rng.rangeI(4, 16);
      }
    }
    
    
    
    
    
    
    planes.ground.push({ t: 'rect', fill: '#0B0518', x: -300, y: G, w: W + 600, h: 120 });

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const signs = ['#FF2F7D', '#2DE2FF', '#FFE03D', '#7CFF6A'];
    
    
    const SIGN_FLOOR = G - 100;
    const lamps = [];
    for (let x = -20; x < W + 20; x += rng.rangeI(150, 340)) {
      const c = rng.pick(signs);
      const w = rng.rangeI(7, 12);
      lamps.push({ x, w, c });
      
      
      
      
      
      
      
      const h = rng.rangeI(38, 76);
      planes.ground.push({ t: 'rect', fill: c, x, w, y: SIGN_FLOOR - h, h });
    }

    
    
    
    
    
    
    
    
    
    
    
    for (const l of lamps) {
      planes.ground.push({
        t: 'rect',
        fill: wash(l.c, '#0B0518', 0.34),
        x: l.x, w: l.w,
        y: G + 2, h: rng.rangeI(30, 54),
      });
      
      
      planes.ground.push({
        t: 'rect',
        fill: wash(l.c, '#0B0518', 0.70),
        x: l.x - 3, w: l.w + 6,
        y: G + 30, h: rng.rangeI(24, 44),
      });
    }
    
    planes.ground.push({ t: 'rect', fill: '#160A2E', x: -300, y: G, w: W + 600, h: 4 });
  },
});




export const WASTE = Object.freeze({
  id: 'waste',
  label: 'wasteland',
  sky: { high: '#E8A85C', mid: '#D08748', low: '#A55C30', glow: '#C97840' },
  washTo: '#A55C30',
  sun: { x: 0.16, y: 0.26, r: 40, fill: '#FFD98A', halo: 0.22 },
  shaftAlpha: 0.16,     
  train: false,
  weather: { particle: 'snow', petal: '#D9A574', petalDeep: '#A8703F' },
  build(rng, planes, { W, G }) {
    const S = this.washTo;
    planes.far.push({
      t: 'poly', fill: wash('#A85C34', S, FAR), pts: ridge(rng, G, W, 110, 22, 60),
    });
    planes.rail.push({
      t: 'poly', fill: wash('#8A4A26', S, RAIL), pts: ridge(rng, G, W, 142, 16, 52),
    });
    
    
    
    
    
    
    
    
    
    
    
    for (let x = -60; x < W + 60; x += rng.rangeI(90, 260)) {
      const h = rng.rangeI(44, 104);
      const w = rng.rangeI(24, 62);
      const lean = 6 + rng.rangeI(0, 12);
      planes.mid.push({
        t: 'poly',
        fill: wash('#2E170E', S, MID * 0.5),
        pts: [[x, G], [x + w, G + lean * 0.3],
          [x + w - lean, G - h + lean * 0.5], [x + lean * 0.4, G - h]],
      });
    }
    
    
    
    
    
    for (let x = -40; x < W + 40; x += rng.rangeI(90, 320)) {
      const h = rng.rangeI(14, 62);
      const fall = rng.rangeI(2, 26) * 0.1;   
      planes.mid.push({
        t: 'poly',
        fill: wash('#241109', S, MID * 0.5),
        pts: [[x, G], [x + 4, G],
          [x + 4 + h * fall, G - h], [x + h * fall, G - h]],
      });
    }

    
    
    
    planes.ground.push({ t: 'rect', fill: '#8A4726', x: -300, y: G, w: W + 600, h: 120 });
    planes.ground.push({ t: 'rect', fill: '#6E351C', x: -300, y: G + 26, w: W + 600, h: 120 });
    
    
    
    
    
    for (let x = -60; x < W + 60; x += rng.rangeI(70, 260)) {
      const w = rng.rangeI(30, 130);
      const y = G + rng.rangeI(6, 22);
      const d = rng.rangeI(4, 13);
      planes.ground.push({
        t: 'poly',
        fill: '#63301A',
        pts: [[x + rng.rangeI(0, 9), y + rng.rangeI(-3, 3)],
          [x + w, y + rng.rangeI(-4, 2)],
          [x + w - rng.rangeI(6, 22), y + d + rng.rangeI(-2, 4)],
          [x + rng.rangeI(2, 14), y + d + rng.rangeI(-2, 3)]],
      });
    }

    
    
    
    
    
    
    const rubble = [[-300, G + 120]];
    let ry = G + 44;
    for (let x = -300; x <= W + 300; x += rng.rangeI(14, 44)) {
      ry += rng.rangeI(-9, 9);
      if (rng.rangeI(0, 100) < 12) ry -= rng.rangeI(10, 26);   
      ry = Math.max(G + 24, Math.min(G + 64, ry));
      rubble.push([x, ry]);
    }
    rubble.push([W + 300, G + 120]);
    planes.near.push({ t: 'poly', fill: '#2E140C', pts: rubble });
  },
});

export const WORLDS = Object.freeze({ feudal: FEUDAL, neon: NEON, waste: WASTE });
export const WORLD_IDS = Object.freeze(Object.keys(WORLDS));









export function worldOf(name) {
  return Object.prototype.hasOwnProperty.call(WORLDS, name) ? WORLDS[name] : null;
}


export function worldColours() {
  return Object.values(WORLDS).flatMap((w) => [
    ...Object.values(w.sky),
    ...(w.sun ? [w.sun.fill] : []),
    w.weather.petal, w.weather.petalDeep,
  ]);
}
