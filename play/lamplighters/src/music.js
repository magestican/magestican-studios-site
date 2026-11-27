








export const MUSIC_TRACKS = Object.freeze(['menu', 'match']);


export const trackForScreen = (screen) => (screen === 'match' ? 'match' : 'menu');





export const musicWanted = (saved) => saved !== 'off';


export function followScreen(music, screen) {
  const id = trackForScreen(screen);
  if (!music || music.track() === id) return false;
  music.setTrack(id);
  return true;
}





export function startOnFirstGesture(music, { events = globalThis, wanted = () => true } = {}) {
  const types = ['touchend', 'click', 'keydown'];
  const go = () => {
    off();
    if (wanted() && !music.isOn()) music.setOn(true);
  };
  const off = () => { for (const t of types) events?.removeEventListener?.(t, go, true); };
  for (const t of types) events?.addEventListener?.(t, go, true);
  return off;
}
