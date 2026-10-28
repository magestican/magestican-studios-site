




const MANNEQUIN = 'mannequin.glb'; 

export const COSTUMES_3D = {
  wizard: {
    mannequin: MANNEQUIN,
    pieces: [
      { slot: 'wizard-robe', file: 'wizard-robe.glb', replaces: ['wizard_robe'] },
      { slot: 'wizard-hat', file: 'wizard-hat.glb', replaces: ['wizard_hat'] },
    ],
    
    colours: { primary: '#3d2a8f', secondary: '#e3b23c', accent: '#efe6ff' },
  },
  princess: {
    mannequin: MANNEQUIN,
    pieces: [
      { slot: 'princess-gown', file: 'princess-gown.glb', replaces: ['gown'] },
      {
        slot: 'crown',
        file: 'crown.glb',
        replaces: ['crown'],
        colours: { primary: '#f2c14e', secondary: '#d99a2b', accent: '#e8457a' },
      },
    ],
    
    colours: { primary: '#e86fa8', secondary: '#f2c14e', accent: '#fff3fa' },
  },
  ghost: {
    mannequin: MANNEQUIN,
    pieces: [
      { slot: 'ghost-sheet', file: 'ghost-sheet.glb', replaces: ['ghost_sheet'] },
      { slot: 'ghost-hood', file: 'ghost-hood.glb', replaces: ['ghost_hood'] },
    ],
    
    colours: { primary: '#f4f6ff', secondary: '#b9c3e6', accent: '#7a86c2' },
  },
  fairy: {
    mannequin: MANNEQUIN,
    pieces: [
      { slot: 'fairy-wings', file: 'fairy-wings.glb', replaces: ['fairy_wings'] },
      {
        slot: 'flower-crown',
        file: 'flower-crown.glb',
        replaces: ['flower_crown'],
        colours: { primary: '#ff9ccf', secondary: '#5cb85c', accent: '#ffd84d' },
      },
    ],
    
    colours: { primary: '#9fe3d8', secondary: '#c7a6ff', accent: '#ffd84d' },
  },
  dragon: {
    mannequin: MANNEQUIN,
    pieces: [
      { slot: 'dragon-wings', file: 'dragon-wings.glb', replaces: ['dragon_wings'] },
      { slot: 'dragon-tail', file: 'dragon-tail.glb', replaces: ['dragon_tail'] },
      { slot: 'dragon-horns', file: 'dragon-horns.glb', replaces: ['dragon_horns'] },
    ],
    
    colours: { primary: '#2f9e5b', secondary: '#f2a93b', accent: '#ffd84d' },
  },
  ice_queen: {
    mannequin: MANNEQUIN,
    pieces: [
      { slot: 'frost-cape', file: 'frost-cape.glb', replaces: ['frost_cape'] },
      { slot: 'ice-crown', file: 'ice-crown.glb', replaces: ['ice_crown'] },
    ],
    
    colours: { primary: '#8fd3ff', secondary: '#ffffff', accent: '#5aa9e6' },
  },
  astronaut: {
    mannequin: MANNEQUIN,
    pieces: [
      { slot: 'jetpack', file: 'jetpack.glb', replaces: ['jetpack'] },
      { slot: 'space-helmet', file: 'space-helmet.glb', replaces: ['space_helmet'] },
    ],
    
    colours: { primary: '#f1f3f6', secondary: '#e85d3a', accent: '#4a90d9' },
  },
  robot: {
    mannequin: MANNEQUIN,
    pieces: [
      { slot: 'robot-chest', file: 'robot-chest.glb', replaces: ['robot_chest'] },
      { slot: 'robot-arms', file: 'robot-arms.glb', replaces: ['robot_upper_arm', 'robot_forearm'] },
      { slot: 'robot-legs', file: 'robot-legs.glb', replaces: ['robot_thigh', 'robot_shin'] },
      { slot: 'robot-head', file: 'robot-head.glb', replaces: ['robot_head'] },
    ],
    
    colours: { primary: '#9aa7b8', secondary: '#3d4a5c', accent: '#3ef0ff' },
  },
};
