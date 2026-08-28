











































export const EMOTE_TIME = 2.4;












export const EMOTES = Object.freeze([
  Object.freeze({ id: 'happy', label: 'Happy', icon: '★', blurb: 'Bounce on the spot.' }),
  Object.freeze({ id: 'boast', label: 'Boast', icon: '✦', blurb: 'Turn slowly and admire yourself.' }),
  Object.freeze({ id: 'rude', label: 'Rude', icon: '✖', blurb: 'Turn your back on everybody.' }),
  Object.freeze({ id: 'sulk', label: 'Sulk', icon: '▾', blurb: 'For when third is an insult.' }),
]);

export const EMOTE_IDS = Object.freeze(EMOTES.map((e) => e.id));
export const isEmote = (id) => EMOTE_IDS.includes(id);


const REST = Object.freeze({
  bob: 0,        
  sway: 0,       
  turn: 0,       
  tilt: 0,       
  roll: 0,       
  squash: 1,     
  stretch: 1,    
});

const TAU = Math.PI * 2;







function volume(pose) {
  return { ...pose, stretch: 1 / Math.sqrt(pose.squash) };
}









function hop(u, height) {
  const air = Math.sin(Math.PI * Math.min(1, u / 0.82));
  const landing = u > 0.82 ? (u - 0.82) / 0.18 : 0;
  
  const squash = 1 - Math.sin(Math.PI * landing) * 0.22;
  return { bob: air * height, squash };
}











export function idlePose(t, seed = 0) {
  const phase = seed * 0.37;
  const beat = (t * 1.15 + phase) % 1;
  const h = hop(beat, 0.10);
  return volume({
    ...REST,
    bob: h.bob,
    squash: h.squash,
    
    
    sway: Math.sin(t * 0.9 + phase * 3) * 0.03,
    turn: Math.sin(t * 0.63 + phase * 5) * 0.14,
    tilt: Math.sin(t * 1.7 + phase) * 0.05,
    roll: Math.sin(t * 0.8 + phase * 2) * 0.06,
  });
}


const PERFORMANCES = {
  






  happy(u) {
    const hops = 3;
    const which = Math.min(hops - 1, Math.floor(u * hops));
    const local = (u * hops) % 1;
    const h = hop(local, 0.34 * (1 - which * 0.22));
    return volume({
      ...REST,
      bob: h.bob,
      squash: h.squash,
      roll: Math.sin(u * TAU * 3) * 0.14,
      turn: Math.sin(u * TAU * 1.5) * 0.22,
    });
  },

  







  boast(u) {
    const anticipate = Math.min(1, u / 0.18);
    
    
    
    
    
    
    const spin = u < 0.18 ? 0 : Math.min(1, (u - 0.18) / 0.64);
    const eased = spin * spin * (3 - 2 * spin);
    return volume({
      ...REST,
      turn: eased * TAU,
      tilt: -0.20 * anticipate,             
      bob: Math.sin(eased * Math.PI) * 0.06,
      
      
      squash: 1 + 0.06 * anticipate,
    });
  },

  






  rude(u) {
    const away = Math.min(1, u / 0.16);
    const back = u > 0.74 ? (u - 0.74) / 0.26 : 0;
    const facing = away - back * back;
    return volume({
      ...REST,
      turn: facing * Math.PI,
      roll: Math.sin(u * TAU * 5) * 0.11 * (1 - back),
      sway: Math.sin(u * TAU * 5) * 0.05 * (1 - back),
      tilt: 0.10 * facing,
      squash: 1 - 0.05 * facing,
    });
  },

  






  sulk(u) {
    const settle = Math.min(1, u / 0.3);
    const recover = u > 0.8 ? (u - 0.8) / 0.2 : 0;
    const amount = settle * (1 - recover);
    return volume({
      ...REST,
      squash: 1 - 0.16 * amount,
      tilt: 0.30 * amount,                  
      turn: -0.45 * amount,
      bob: -0.05 * amount,
      sway: Math.sin(u * TAU * 0.7) * 0.02,
    });
  },
};
















export function poseAt({ emote, emoteStart = 0, time = 0, seed = 0 }) {
  const idle = idlePose(time, seed);
  const perform = PERFORMANCES[emote];
  if (!perform) return idle;

  const u = (time - emoteStart) / EMOTE_TIME;
  if (u < 0 || u >= 1) return idle;

  const pose = perform(u);
  
  
  
  const FADE = 0.12;
  const blend = Math.min(1, Math.min(u, 1 - u) / FADE);
  const mix = (a, b) => a + (b - a) * blend;
  
  
  
  
  
  return volume({
    bob: mix(idle.bob, pose.bob),
    sway: mix(idle.sway, pose.sway),
    turn: mix(idle.turn, pose.turn),
    tilt: mix(idle.tilt, pose.tilt),
    roll: mix(idle.roll, pose.roll),
    squash: mix(idle.squash, pose.squash),
  });
}


export function emoteActive({ emote, emoteStart = 0, time = 0 }) {
  if (!emote) return false;
  const u = (time - emoteStart) / EMOTE_TIME;
  return u >= 0 && u < 1;
}
