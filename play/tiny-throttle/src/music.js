










export const MUSIC = Object.freeze({
  house: Object.freeze({ title: 'Hot Plate', src: './assets/music/hot-plate.webm', volume: 0.78 }),
  yard: Object.freeze({ title: 'Counter Rush', src: './assets/music/counter-rush.m4a', volume: 0.45 }),
});

export function musicFor(world) {
  return MUSIC[world] ?? MUSIC.house;
}
