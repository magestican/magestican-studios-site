

























export function ceremonyFraming(aspect) {
  
  const t = Math.max(0, Math.min(1, (aspect - 0.7) / (1.6 - 0.7)));
  return {
    
    dist: 5.2 + t * 2.3,
    
    side: t * -1.2,
    
    lookBias: t * 5.5,
  };
}
