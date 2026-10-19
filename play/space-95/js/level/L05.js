












import { levelBuilder } from './dsl.js';

const MOTIF = 'breath-launch';
const m = (use, opts = {}) => ({ motif: MOTIF, use, ...opts });

export function buildL05() {
  const L = levelBuilder({ id: 5, name: "Stripecat's Back", pitCost: 'none', height: 32 });

  
  L.put('ability', 1, { grant: 'double', name: 'Thruster coil' });
  L.put('ability', 1.6, { grant: 'pound', name: 'Pound plates' });

  
  L.landmark('crew lift', 2, 'bg');
  L.run(16);
  L.landmark('tail tip', -2);
  
  L.step(1, 6).step(1, 6).step(1, 6).step(1, 6).run(8);
  
  L.run(12);
  L.put('ability', -6, { grant: 'dash', name: 'Dash spring' });
  
  L.run(3).step(-1, 3).step(1, 4).step(-1, 4).step(1, 4).step(-1, 4.5).step(1, 5.5);
  L.ceiling(-25, 23, 8.5);
  L.landmark('undercoat', -14);
  
  L.run(4 + S.haunch).heave(28, 1.5, PH.hump, { taper: [4, 4] });
  L.landmark('haunch', -14);
  L.run(4);
  
  L.heave(14, 3, PH.m1, m('M1', { taper: [3, 0] }));
  L.fold(6.5, 3, PH.m1f, m('M1'));
  L.run(10);
  
  L.run(28).ceiling(-20, 16, 8);
  L.put('snailknight', -8.5, { facing: -1 });
  
  L.run(8).beacon(-3);
  
  L.run(6 + S.bandit).step(1.5, 24);
  L.put('bandit', -6.5, { facing: -1 });
  
  L.heave(12, 3, PH.m2a, m('M2', { taper: [3, 0] }));
  L.fold(6.5, 3, PH.m2af, m('M2'));
  L.heave(10, 3, PH.m2b, m('M2', { taper: [0, 0] }));
  L.fold(6.5, 3, PH.m2bf, m('M2'));
  L.run(10 + S.surf);
  
  
  L.run(3).step(-2, 4.5).step(2, 5).step(-2, 5).step(2, 8).step(-2, 5).step(2, 8);
  L.ceiling(-37.5, 35.5, 10);
  L.put('snailknight', -16, { facing: -1 });
  L.landmark('the parting', -20);
  
  
  L.step(2, 8).heave(20, 2, PH.stripe, { taper: [3, 3] });
  L.landmark('great stripe', -10);
  const st = L.x; 
  L.run(30);
  L.carve(st + 2, st + 26, 5, 9); 
  L.carve(st + 8, st + 10, 9, 9.5).soil(st + 8, st + 10, 9, 9.5); 
  L.carve(st + 20, st + 24, 9, 9.5); 
  L.heaveAt(st + 20, st + 24, 5, 4.5, PH.elevator, { taper: [0, 0] }); 
  L.putAt('snailknight', st + 15, 5, {
    specimen: true,
    dozing: true,
    name: 'Pearl Snailknight',
    signals: ['visual:pearl-glow', 'audio:snore-whistle'],
    seenFrom: `the Stripe canopy top above the hollow (x ${st + 12}-${st + 20})`,
    facing: -1,
  });
  L.step(-2.5, 8).beacon(-4);
  const ck2 = L.x - 4;
  
  L.run(4).heave(48, 0.75, PH.valley, { taper: [4, 4] });
  L.landmark('shoulder valley', -24);
  L.platform(-42, 9.5, 1.5, 'one-way')
    .platform(-37, 11.5, 1.5, 'one-way')
    .platform(-32.5, 13.5, 1.5, 'one-way')
    .platform(-24, 13.5, 1.5, 'one-way')
    .platform(-15.5, 13.5, 1.5, 'one-way')
    .platform(-7, 13.5, 3, 'one-way');
  L.secret(
    'deed',
    -5.5,
    {
      name: "A giant's lost button",
      signals: ['visual:gold-glint', 'audio:glint-chime'],
      seenFrom: `the CK2 overlook (x ${ck2 - 4}-${ck2}) and the valley floor`,
    },
    13.5,
  );
  L.run(8 + S.valley);
  
  L.heave(14, 3, PH.m3, m('M3', { taper: [3, 0] }));
  L.fold(6.5, 3, PH.m3f, m('M3'));
  L.put('bandit', -3, { dozing: true, facing: -1 }, 4);
  L.run(14);
  L.put('bandit', -4.5, { facing: -1 });
  L.step(1.5, 6);
  
  L.run(2 + S.rolling)
    .heave(12, 2, PH.roll1, { taper: [3, 3] })
    .heave(12, 2, PH.roll2, { taper: [3, 3] })
    .heave(12, 2, PH.roll3, { taper: [3, 3] })
    .run(2);
  L.put('bandit', -10.5, { facing: -1 });
  
  L.run(6).platform(0, 11, 24).pillar(0, 1, 2.5);
  const collar = L.x; 
  L.run(24);
  L.secret(
    'cache',
    -12.5,
    {
      name: "A Vast child's drawing of Ruuma",
      signals: ['visual:amber-glint', 'audio:hollow-knock'],
      seenFrom: `the collar top over the buckle (x ${collar + 9.5}-${collar + 13.5})`,
    },
    8.5,
  );
  L.put('snailknight', -6.5, { facing: -1 }, 11);
  L.landmark('collar', -12);
  L.run(4);
  
  L.heave(8, 2, PH.m4a, m('M4', { period: 2, taper: [2, 0] }));
  L.fold(6.5, 2, PH.m4af, m('M4', { period: 2 }));
  L.heave(6, 2, PH.m4b, m('M4', { period: 2, taper: [0, 0] }));
  L.fold(6.5, 2, PH.m4bf, m('M4', { period: 2 }));
  L.heave(6, 2, PH.m4c, m('M4', { period: 2, taper: [0, 0] }));
  L.fold(6.5, 2, PH.m4cf, m('M4', { period: 2 }));
  L.run(8).beacon(-4);
  
  
  L.run(6).run(16).ceiling(-13, 12, 10.5);
  L.put('snailknight', -5, { facing: -1 });
  L.landmark('scruff', 0);
  L.heave(30, 1.5, PH.lane, { taper: [3, 3] });
  L.put('bandit', -20, { facing: -1 });
  L.put('bandit', -12, { facing: -1 });
  L.put('bandit', -4, { facing: -1 });
  L.step(2, 8).run(4);
  
  
  const sigh = { group: 'sigh', trigger: L.x + 2, sink: 2, top: 16.5 };
  L.heave(16, 6, 0, m('M5', { ...sigh, taper: [5, 0] }));
  L.landmark('nape', -8);
  L.fold(6.5, 6, 0, m('M5', sigh));
  L.step(6, 22);
  L.landmark('brow', -10);
  
  L.run(10)
    .step(-1, 12)
    .run(26 + S.forehead);
  L.landmark('forehead stripes', -20);
  L.step(1.5, 30);
  L.put('finish', -8.5);
  L.landmark('ear', -20);
  return L.build();
}




const S = { haunch: 32, bandit: 24, surf: 24, valley: 16, rolling: 0, forehead: 56 };


const PH = {
  hump: 0,
  m1: 3.12,
  m1f: 2.12,
  m2a: 0.18,
  m2af: 3.18,
  m2b: 2.07,
  m2bf: 1.07,
  stripe: 0,
  elevator: 0,
  valley: 0,
  m3: 1.2,
  m3f: 0.2,
  roll1: 0,
  roll2: 2.5,
  roll3: 1.0,
  m4a: 0.83,
  m4af: 0.33,
  m4b: 1.23,
  m4bf: 0.73,
  m4c: 1.63,
  m4cf: 1.13,
  lane: 0,
};
