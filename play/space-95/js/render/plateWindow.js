









export function plateWindow({ camX, worldW, playW, aspect, plateAspect, zoom, parallax }) {
  
  const fitX = aspect / plateAspect;
  const cover = Math.max(1, fitX);
  const repeatX = fitX / cover / zoom;
  const repeatY = 1 / cover / zoom;
  const free = 1 - repeatX;
  
  const travel = Math.min(free, ((worldW * parallax) / Math.max(1, playW)) * repeatX);
  const t = Math.min(1, Math.max(0, camX / Math.max(1, worldW)));
  return { repeatX, repeatY, offsetX: free / 2 + (t - 0.5) * travel, offsetY: (1 - repeatY) / 2 };
}
