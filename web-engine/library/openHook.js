












import { resolveGameId, gameIdForPlayDir } from './libraryIds.js';
import { recordOpen, recordTime } from './libraryModel.js';
import { updateLibrary, defaultStorage } from './libraryStore.js';
import { localDayNumber } from '../account/dayKey.js';
import { isFleet } from '../progress/fleet.js';

export function startOpenHook({
  base, loc = globalThis.location, doc = globalThis.document, win = globalThis,
  storage = defaultStorage(), clock = () => Date.now(), perf = () => performance.now(), session,
} = {}) {
  try {
    if (isFleet(loc, session)) return null;
    const id = resolveGameId(base, loc?.search ?? '');
    if (!id || !storage) return null;
    updateLibrary(storage, (l) => recordOpen(l, id, localDayNumber(clock())));
    let since = doc?.visibilityState === 'hidden' ? null : perf();
    const flush = () => {
      if (since == null) return;
      const ms = perf() - since;
      since = null;
      if (ms > 0) updateLibrary(storage, (l) => recordTime(l, id, ms));
    };
    doc?.addEventListener?.('visibilitychange', () => {
      if (doc.visibilityState === 'hidden') flush();
      else if (since == null) since = perf();
    });
    win?.addEventListener?.('pagehide', flush);
    return { id, flush };
  } catch {
    return null; 
  }
}



try {
  const base = gameIdForPlayDir(new URL(import.meta.url).searchParams.get('play'));
  if (base && globalThis.document) startOpenHook({ base });
} catch {  }
