














export const BARN_PALETTE = Object.freeze({
  red:        '#b73a2a',   
  blue:       '#336bbf',   
  bareWood:   '#9a7d5c',   
  bareShadow: '#6b5540',   
  rime:       '#dbeaf6',   
  damp:       '#43302a',   
  nail:       '#6d7076',   
});





export const BARN_PAINT = Object.freeze({
  red: Object.freeze({
    team: 'red',
    paint: BARN_PALETTE.red,
    boards: 4,               
    boardValueSpread: 0.26,  
    peels: 7,                
    peelCoverage: 0.10,      
    rimeRows: 2,             
    dampRows: 9,             
    grainStreaks: 14,
    seed: 91,
  }),
  blue: Object.freeze({
    team: 'blue',
    paint: BARN_PALETTE.blue,
    boards: 6,               
    boardValueSpread: 0.12,  
    peels: 2,                
    peelCoverage: 0.03,
    rimeRows: 8,             
    dampRows: 4,
    grainStreaks: 7,
    seed: 137,
  }),
});



export const WEATHERING_FIELDS = Object.freeze([
  'boards', 'boardValueSpread', 'peels', 'rimeRows', 'dampRows',
]);
