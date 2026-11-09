










export function plateWindow({ camX, worldW, playW, aspect, plateAspect, zoom, parallax, cropL = 0, cropR = 0 }) {
  
  const fitX = aspect / plateAspect;
  const cover = Math.max(1, fitX);
  const repeatX = fitX / cover / zoom;
  const repeatY = 1 / cover / zoom;
  const free = Math.max(0, 1 - cropL - cropR - repeatX);
  
  const travel = Math.min(free, ((worldW * parallax) / Math.max(1, playW)) * repeatX);
  const t = Math.min(1, Math.max(0, camX / Math.max(1, worldW)));
  return { repeatX, repeatY, offsetX: cropL + free / 2 + (t - 0.5) * travel, offsetY: (1 - repeatY) / 2 };
}
