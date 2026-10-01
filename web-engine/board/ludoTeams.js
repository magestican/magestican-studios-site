




































export const TEAMS = Object.freeze([
  Object.freeze({
    id: 'sheep',
    name: 'Sheep',
    one: 'a sheep',
    colour: 'green',
    state: 'band1',
    mark: '●',
    shape: 'circle',
    corner: 'bottom left',
  }),
  Object.freeze({
    id: 'geese',
    name: 'Geese',
    one: 'a goose',
    colour: 'gold',
    state: 'band2',
    mark: '▲',
    shape: 'triangle',
    corner: 'top left',
  }),
  Object.freeze({
    id: 'pigs',
    name: 'Pigs',
    one: 'a pig',
    colour: 'blue',
    state: 'band3',
    mark: '■',
    shape: 'square',
    corner: 'top right',
  }),
  Object.freeze({
    id: 'cows',
    name: 'Cows',
    one: 'a cow',
    colour: 'red',
    state: 'band4',
    mark: '◆',
    shape: 'diamond',
    corner: 'bottom right',
  }),
]);

export const teamAt = (i) => TEAMS[((i % TEAMS.length) + TEAMS.length) % TEAMS.length];


export const teamName = (i) => teamAt(i).name;








export const teamLabel = (i) => `${teamAt(i).shape} ${teamAt(i).colour} ${teamAt(i).name}`;
