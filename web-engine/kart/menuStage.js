



















const TAU = Math.PI * 2;















export const STAGE = Object.freeze({
  fovDeg: 38,
  eyeY: 1.72,
  








  radius: 7.2,
  
  swing: 0.085,
  
  driftSeconds: 46,
  
  plinthY: 0.55,
  











  subjectX: 0.72,
  
  narrowAspect: 0.85,
});






export function subjectXFor(w, h, stage = STAGE) {
  const aspect = h > 0 ? w / h : 1;
  if (aspect <= stage.narrowAspect) return 0.5;
  
  
  
  const t = Math.min(1, (aspect - stage.narrowAspect) / 1.0);
  return 0.5 + (stage.subjectX - 0.5) * t;
}














export function stageCamera(t, stage = STAGE) {
  const phase = Math.sin((t / stage.driftSeconds) * TAU);
  const angle = phase * stage.swing;
  return {
    position: {
      x: Math.sin(angle) * stage.radius,
      y: stage.eyeY + phase * 0.06,
      z: Math.cos(angle) * stage.radius,
    },
    target: { x: 0, y: stage.plinthY + 0.42, z: 0 },
    fovDeg: stage.fovDeg,
  };
}














export function subjectShiftMetres(w, h, stage = STAGE) {
  const frac = subjectXFor(w, h, stage);
  const aspect = h > 0 ? w / h : 1;
  const halfWidthM = stage.radius * Math.tan((stage.fovDeg * Math.PI) / 180 / 2) * aspect;
  
  
  
  
  
  
  
  
  return (frac - 0.5) * 2 * halfWidthM;
}












export function yardPlacements() {
  const at = (bearingDeg, dist, kind, scale = 1) => ({
    bearing: (bearingDeg * Math.PI) / 180,
    dist,
    kind,
    scale,
    x: Math.sin((bearingDeg * Math.PI) / 180) * dist,
    z: Math.cos((bearingDeg * Math.PI) / 180) * dist,
  });
  
  
  
  
  
  
  return [
    
    
    
    at(156, 21, 'barn', 1.0),
    at(-152, 26, 'silo', 1.0),
    
    
    at(0, 9.5, 'fence', 1),
    
    
    
    at(-84, 13.0, 'bale', 0.85),
    at(118, 12.0, 'bale', 0.92),
    at(-56, 11.5, 'bale', 1.0),
    at(134, 17.5, 'tree', 1.0),
    at(100, 15.0, 'tree', 0.9),
    at(-128, 16.0, 'tree', 1.15),
    
    
    at(-170, 10.0, 'tree', 1.2),
  ];
}
