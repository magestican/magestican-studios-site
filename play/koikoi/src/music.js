









export const MUSIC_TRACKS = Object.freeze(['menu', 'match']);





export function trackFor({ title = false, menu = false, playing = false } = {}) {
  return playing && !title && !menu ? 'match' : 'menu';
}





export const musicWanted = (saved) => saved !== 'off';


export function followScreen(music, id) {
  if (!music || music.track() === id) return false;
  music.setTrack(id);
  return true;
}






export function startOnFirstGesture(music, { events = globalThis, wanted = () => true, ignore = () => false, after = () => {} } = {}) {
  const types = ['touchend', 'click', 'keydown'];
  const go = (e) => {
    off();
    if (ignore(e)) return;
    if (wanted() && !music.isOn()) { music.setOn(true); after(); }
  };
  const off = () => { for (const t of types) events?.removeEventListener?.(t, go, true); };
  for (const t of types) events?.addEventListener?.(t, go, true);
  return off;
}
