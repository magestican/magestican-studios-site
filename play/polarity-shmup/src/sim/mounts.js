






















export const P_SHUTTLE = 6, P_RAMPART = 8, P_PAIR = 10;

export const GUNS = Object.freeze([
   { all: [{ r: 14, ox: 0, aim: 'player' }] },
   { all: [{ r: 22, ox: 0, aim: 'player' }] },
   { all: [{ r: 40, ox: 0, aim: 'player' }, { r: 0, ox: 0, aim: 'core' }] },
   { all: [] }, 
   { all: [{ r: 20, ox: 0, aim: 'fixed' }] },
   {
    [P_SHUTTLE]: [{ r: 20, ox: -40, aim: 'fixed' }, { r: 20, ox: 40, aim: 'fixed' }],
    [P_RAMPART]: [{ r: 30, ox: 0, aim: 'player' }, { r: 20, ox: 0, aim: 'core' }],
    [P_PAIR]: [{ r: 26, ox: 0, aim: 'player' }],
  },
   { all: [{ r: 0, ox: 0, aim: 'core' }] }, 
]);


export const gunsOf = (kind, path) => GUNS[kind]?.[path] || GUNS[kind]?.all || GUNS[kind]?.[P_SHUTTLE] || [];


export function muzzleR(kind, path, aim) {
  for (const g of gunsOf(kind, path)) if (g.aim === aim) return g.r;
  return 0;
}
