



































export const DEBRIS = Object.freeze({
  flesh: Object.freeze({
    color: 0xb0100e,
    count: 14,
    
    up: [1.5, 4.5],        
    spread: 4,             
    away: 2,               
    lifetime: 1.0,         
    size: 0.08,            
    
    matureOnly: true,
  }),
  world: Object.freeze({
    color: 0x57514c,
    
    
    
    
    count: 9,
    up: [1.0, 3.0],
    spread: 2.6,
    away: 1.6,
    
    
    
    
    lifetime: 0.7,
    size: 0.06,
    
    
    matureOnly: false,
  }),
});








export const IMPACT_KINDS = Object.freeze(['flesh', 'world']);








export function debrisFor(kind) {
  return DEBRIS[kind] ?? DEBRIS.world;
}


export function shouldSpatter(kind, mature) {
  const spec = debrisFor(kind);
  return spec.matureOnly ? !!mature : true;
}





export function kindForHit(hitKind) {
  return hitKind === 'player' ? 'flesh' : 'world';
}
