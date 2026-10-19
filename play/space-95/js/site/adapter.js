













import { intelPercent } from '../sim/intel.js';

export const SITE_PATH = '/play/space-95/';
export const BRIDGE_PATH = '/web-engine/progress/space95.js';

const COUNT_NAMES = ['pebbleKills', 'highFives', 'noHitBoss', 'trainClean', 'aceSolo'];
const SEEN_KINDS = ['specimens', 'miniBosses', 'bigBosses'];


export function bridgeUrl(loc) {
  if (!loc || typeof loc.pathname !== 'string' || typeof loc.origin !== 'string') return null;
  if (!loc.pathname.startsWith(SITE_PATH)) return null;
  return loc.origin + BRIDGE_PATH;
}


export function shiftMessage(end, pending) {
  const save = end.save;
  const levelId = Number.isInteger(end.level) ? end.level : 0;
  return {
    save,
    stats: {
      levelsCleared: save.cleared.filter(Boolean).length,
      intelPct: Math.floor(intelPercent(save)),
      secrets: save.secrets.filter(Boolean).length,
    },
    ids: {
      ...Object.fromEntries(SEEN_KINDS.map((k) => [k, [...pending.seen[k]]])),
      underPar: end.cleared === true && end.underPar === true && levelId > 0 ? [levelId] : [],
    },
    counts: { ...pending.counts },
    shift: { level: levelId, cleared: end.cleared === true, seconds: Number(end.seconds) || 0, coop: end.coop === true },
  };
}





export function createSiteAdapter(opts = {}) {
  const url = bridgeUrl(opts.location ?? globalThis.location);
  const load = opts.load ?? ((u) => import(u));
  let bridge = null;
  const getBridge = () => {
    if (!bridge)
      bridge = Promise.resolve()
        .then(() => load(url))
        .catch(() => null);
    return bridge;
  };
  const empty = () => ({ counts: {}, seen: Object.fromEntries(SEEN_KINDS.map((k) => [k, new Set()])) });
  let pending = empty();

  return {
    onSite: url !== null,
    count(name, n = 1) {
      if (url && COUNT_NAMES.includes(name) && Number.isInteger(n) && n > 0) pending.counts[name] = (pending.counts[name] ?? 0) + n;
    },
    seen(kind, id) {
      if (url && SEEN_KINDS.includes(kind) && (typeof id === 'string' || Number.isInteger(id))) pending.seen[kind].add(String(id));
    },
    
    shiftEnd(end) {
      if (!url || !end || !end.save) return Promise.resolve([]);
      let msg;
      try {
        msg = shiftMessage(end, pending);
      } catch {
        return Promise.resolve([]);
      }
      pending = empty();
      return getBridge()
        .then((b) => (b && typeof b.reportSpace95 === 'function' ? b.reportSpace95(msg) : []))
        .catch(() => []);
    },
    
    savedOnSite() {
      if (!url) return Promise.resolve(null);
      return getBridge()
        .then((b) => (b && typeof b.loadSpace95Save === 'function' ? b.loadSpace95Save() : null))
        .catch(() => null);
    },
  };
}


export const site = createSiteAdapter();
