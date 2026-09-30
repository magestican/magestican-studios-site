


















export const FLEET_PARAM = 'fleet';
export const FLEET_SESSION_KEY = 'magestican.fleet';

function sessionOf(explicit) {
  if (explicit !== undefined) return explicit;
  try { return globalThis.sessionStorage ?? null; } catch { return null; }
}

function locationOf(explicit) {
  if (explicit !== undefined) return explicit;
  try { return globalThis.location ?? null; } catch { return null; }
}





export function isFleet(loc, session) {
  const store = sessionOf(session);
  let fromUrl = false;
  try {
    const l = locationOf(loc);
    const search = l && typeof l.search === 'string' ? l.search : '';
    fromUrl = new URLSearchParams(search).get(FLEET_PARAM) === '1';
  } catch { fromUrl = false; }
  if (fromUrl) {
    try { store?.setItem(FLEET_SESSION_KEY, '1'); } catch {  }
    return true;
  }
  try { return store?.getItem(FLEET_SESSION_KEY) === '1'; } catch { return false; }
}
