



const NAMES = {
  wizard: 'Wizard',
  princess: 'Princess',
  ghost: 'Ghost',
  fairy: 'Fairy',
  dragon: 'Dragon',
  ice_queen: 'Ice Queen',
  astronaut: 'Astronaut',
  robot: 'Robot',
  pirate: 'Pirate',
  mermaid: 'Mermaid',
  superhero: 'Superhero',
};
const ICON = {
  wizard: 'wizard_hat',
  princess: 'crown',
  ghost: 'ghost_hood',
  fairy: 'flower_crown',
  dragon: 'dragon_horns',
  ice_queen: 'ice_crown',
  astronaut: 'space_helmet',
  robot: 'robot_head',
  pirate: 'pirate_hat',
  mermaid: 'shell_tiara',
  superhero: 'hero_mask',
};


export const costumeName = (id) => NAMES[id];

export const costumeIcon = (id) => ICON[id];
