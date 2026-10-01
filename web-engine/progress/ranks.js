












export const RANK_TITLES = Object.freeze([
  Object.freeze({ level: 1, name: 'Apprentice' }),
  Object.freeze({ level: 5, name: 'Journeyman' }),
  Object.freeze({ level: 10, name: 'Artisan' }),
  Object.freeze({ level: 20, name: 'Master' }),
  Object.freeze({ level: 35, name: 'Grandmaster' }),
  Object.freeze({ level: 50, name: 'Magestican Legend' }),
]);


export function rankIndexFor(level) {
  const l = Number(level);
  if (Number.isNaN(l)) return 0;
  let index = 0;
  for (let i = 0; i < RANK_TITLES.length; i++) if (l >= RANK_TITLES[i].level) index = i;
  return index;
}


export function titleFor(level) {
  return RANK_TITLES[rankIndexFor(level)].name;
}
