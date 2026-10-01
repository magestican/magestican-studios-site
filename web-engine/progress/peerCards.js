




















import { myRating } from './report.js';

export const CARD_T = 'mg-card';
const R_MIN = 100;
const R_MAX = 4000;


export function cardOf(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const r = Number(raw.r);
  const n = Number(raw.n);
  const c = {
    human: raw.human === true,
    r: Number.isFinite(r) && r >= R_MIN && r <= R_MAX ? Math.round(r) : null,
    n: Number.isInteger(n) && n >= 0 ? n : 0,
  };
  if (typeof raw.dev === 'string' && /^[a-z0-9]{8,32}$/.test(raw.dev)) c.dev = raw.dev;
  return c;
}

export const DEVICE_KEY = 'magestican.device.v1';








export function deviceId(storage) {
  try {
    const s = storage !== undefined ? storage : globalThis.localStorage;
    if (!s) return '';
    let id = s.getItem(DEVICE_KEY);
    if (!id || !/^[a-z0-9]{8,32}$/.test(id)) {
      id = Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 12);
      id = id.replace(/[^a-z0-9]/g, '').slice(0, 20).padEnd(8, '0');
      s.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return '';
  }
}


export function myCard(game, opts) {
  const mine = myRating(game, opts);
  const dev = deviceId(opts && Object.hasOwn(opts, 'storage') ? opts.storage : undefined);
  const card = mine ? { human: true, r: mine.r, n: mine.n } : { human: false, r: null, n: 0 };
  return dev ? { ...card, dev } : card;
}


export function opponentFrom(card, place) {
  const c = cardOf(card);
  const o = { human: c?.human === true, place };
  if (c?.human && c.r !== null) o.rating = c.r;
  return o;
}


export function createCardBook() {
  const cards = new Map();
  return {
    set(id, raw) { const c = cardOf(raw); if (typeof id === 'string' && id && c) cards.set(id, c); },
    get(id) { return cards.get(id) ?? null; },
    get size() { return cards.size; },
  };
}


export const CARDS = createCardBook();





export function exchangeCards(mesh, game, { book = CARDS, card = () => myCard(game), delayMs = 600 } = {}) {
  try {
    if (!mesh || typeof mesh.addEventListener !== 'function') return false;
    const send = () => { try { mesh.broadcast({ t: CARD_T, game, card: card() }); } catch {  } };
    mesh.addEventListener('open', () => { setTimeout(send, delayMs); });
    mesh.addEventListener('peer-joined', send);
    mesh.addEventListener('message', (e) => {
      const { from, message } = e?.detail ?? {};
      if (!message || message.t !== CARD_T || message.game !== game) return;
      book.set(from, message.card);
    });
    return true;
  } catch {
    return false;
  }
}
