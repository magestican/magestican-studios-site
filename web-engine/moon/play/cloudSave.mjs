


























































import { SAVE_FORMAT, checkSave, readSave } from '../economy/save.mjs';








export const CLOUD_ROOT = 'saves';
export const CLOUD_MOONS = 'moons';


export function cloudPath(uid, id) {
  return [CLOUD_ROOT, String(uid), CLOUD_MOONS, String(id)];
}











export function moonId(slot) {
  const clean = String(slot ?? '').toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 40);
  return clean.replace(/^-+|-+$/g, '') || 'moon';
}







export const CLOUD_MAX_BYTES = 900000;


export const FUTURE_MS = 24 * 60 * 60 * 1000;






export function cloudDoc(save) {
  const why = checkSave(save);
  if (why) return { ok: false, doc: null, reason: `not a save: ${why}` };
  let json;
  try {
    json = JSON.stringify(save);
  } catch (e) {
    return { ok: false, doc: null, reason: `the save will not serialise: ${e.message}` };
  }
  const bytes = json.length;
  if (bytes > CLOUD_MAX_BYTES) {
    return { ok: false, doc: null, reason: `this moon is ${bytes} characters, over the ${CLOUD_MAX_BYTES} a cloud save may hold` };
  }
  return {
    ok: true,
    reason: null,
    doc: {
      format: SAVE_FORMAT,
      version: save.version,
      savedAt: save.savedAt,
      bytes,
      json,
    },
  };
}


const isStamp = (v) => Number.isInteger(v) && v >= 0;






export function readCloudDoc(raw) {
  const none = (reason) => ({ ok: false, doc: null, savedAt: null, steps: [], reason });
  if (!raw || typeof raw !== 'object') return none('no cloud document');
  if (raw.format !== SAVE_FORMAT) return none(`not a ${SAVE_FORMAT} document`);
  if (typeof raw.json !== 'string' || !raw.json) return none('the cloud document holds no save');
  if (raw.json.length > CLOUD_MAX_BYTES) return none('the cloud document is too big to be one of ours');
  const read = readSave(raw.json);
  if (!read.ok) return none(read.reason);
  return { ok: true, doc: read.doc, savedAt: read.doc.savedAt, steps: read.steps, reason: null };
}









export function stampOf(copy, now) {
  if (!copy || copy.ok === false) return null;
  const at = copy.savedAt;
  if (!isStamp(at)) return null;
  if (Number.isFinite(now) && at > now + FUTURE_MS) return null;
  return at;
}








export function newestWins(local, remote, { now = Date.now() } = {}) {
  const l = stampOf(local, now);
  const r = stampOf(remote, now);
  if (r === null) return 'local';
  if (l === null) return 'remote';
  if (r > l) return 'remote';
  if (l > r) return 'local';
  return 'same';
}

const listOf = (v) => (Array.isArray(v) ? v : Object.entries(v || {}).map(([id, c]) => ({ id, ...(c || {}) })));
const byId = (v) => new Map(listOf(v).filter((c) => c && c.id !== undefined).map((c) => [String(c.id), c]));















export function mergePlan({ local = [], remote = [], now = Date.now() } = {}) {
  const l = byId(local);
  const r = byId(remote);
  const plan = { push: [], pull: [], same: [], winner: {}, reasons: {} };
  const ids = [...new Set([...l.keys(), ...r.keys()])].sort();
  for (const id of ids) {
    const mine = l.get(id);
    const theirs = r.get(id);
    if (mine && !theirs) {
      plan.winner[id] = 'local';
      plan.push.push(id);
      plan.reasons[id] = 'this moon is only on this device';
      continue;
    }
    if (!mine && theirs) {
      
      
      if (stampOf(theirs, now) === null) {
        plan.winner[id] = 'local';
        plan.reasons[id] = 'the cloud copy cannot be read';
        continue;
      }
      plan.winner[id] = 'remote';
      plan.pull.push(id);
      plan.reasons[id] = 'this moon is only in the cloud';
      continue;
    }
    const who = newestWins(mine, theirs, { now });
    plan.winner[id] = who === 'same' ? 'local' : who;
    if (who === 'remote') {
      plan.pull.push(id);
      plan.reasons[id] = 'the cloud copy is newer';
    } else if (who === 'local') {
      plan.push.push(id);
      plan.reasons[id] = stampOf(theirs, now) === null
        ? 'the cloud copy cannot be trusted'
        : 'this device has the newer copy';
    } else {
      plan.same.push(id);
      plan.reasons[id] = 'both copies are the same';
    }
  }
  return plan;
}


















export const CLOUD_POLICY = Object.freeze({
  minGapMs: 45000,
  retryMs: 60000,
});






export function cloudDue(state, now, policy = CLOUD_POLICY) {
  const s = state || {};
  if (!s.pending || s.writing) return false;
  if (!s.signedIn) return false;
  
  
  if (s.online === false) return false;
  const last = Number.isFinite(s.lastWriteAt) ? s.lastWriteAt : -Infinity;
  if (now - last < policy.minGapMs) return false;
  const failed = Number.isFinite(s.lastFailAt) ? s.lastFailAt : -Infinity;
  if (now - failed < policy.retryMs) return false;
  return true;
}




export function agoLine(ms) {
  if (!Number.isFinite(ms) || ms < 0) return 'just now';
  const s = Math.round(ms / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return m === 1 ? 'a minute ago' : `${m} minutes ago`;
  const h = Math.round(m / 60);
  if (h < 24) return h === 1 ? 'an hour ago' : `${h} hours ago`;
  const d = Math.round(h / 24);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}














export function accountView(state = {}) {
  const s = {
    configured: true, onOrigin: true, signedIn: false, email: null, busy: false,
    online: true, error: null, pending: false, lastSyncAt: null, sent: null,
    now: Date.now(), ...state,
  };
  const off = { google: false, link: false, signOut: false };
  const view = { title: 'Your moon in the cloud', lines: [], can: { ...off }, tone: 'plain', label: 'Sign in' };

  
  
  const onThisDevice = 'Your moon is always saved on this device.';

  if (!s.configured || !s.onOrigin) {
    view.lines.push(onThisDevice,
      'Signing in only works on the game at magesticanstudios.com, so there is nothing to sign in to here.');
    view.tone = 'off';
    view.label = 'Cloud save';
    return view;
  }

  if (s.signedIn) {
    view.label = 'Signed in';
    view.tone = 'on';
    view.can.signOut = true;
    view.lines.push(s.email ? `Signed in as ${s.email}.` : 'Signed in.');
    if (s.online === false) {
      
      
      view.lines.push('You are offline. Your moon is saved on this device and goes up when you are back.');
      view.tone = 'wait';
    } else if (s.busy) {
      view.lines.push('Saving your moon to the cloud...');
    } else if (s.pending) {
      view.lines.push('Your moon goes up in a moment.');
    } else if (Number.isFinite(s.lastSyncAt)) {
      view.lines.push(`Kept in the cloud ${agoLine(s.now - s.lastSyncAt)}.`);
    } else {
      view.lines.push(onThisDevice);
    }
    if (s.error) view.lines.push(s.error);
    return view;
  }

  view.can.google = !s.busy;
  view.can.link = !s.busy;
  view.lines.push(onThisDevice,
    'Sign in as well and it is kept in the cloud too, so you can carry on from another phone.');
  if (s.sent) {
    view.lines.push(`A link is on its way to ${s.sent}. Open it on this device to finish signing in.`);
    view.tone = 'wait';
  }
  if (s.busy) { view.lines.push('Signing in...'); view.tone = 'wait'; }
  if (s.error) { view.lines.push(s.error); view.tone = 'bad'; }
  return view;
}


export function looksLikeEmail(text) {
  const t = String(text ?? '').trim();
  return t.length >= 5 && t.length <= 254 && /^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(t);
}
