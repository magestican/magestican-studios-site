



































import { tidyCode } from './lobby.mjs';
import { worthText } from '../economy/netWorth.mjs';


export const JOIN_PARAM = 'join';


export const SHARE_TITLE = 'Farmy Moon Life';







export function joinCodeOf(search) {
  const raw = String(search ?? '');
  let params;
  try {
    params = new URLSearchParams(raw.startsWith('?') ? raw.slice(1) : raw);
  } catch {
    return null;
  }
  const value = params.get(JOIN_PARAM);
  return value === null ? null : tidyCode(value);
}








export function shareLink(href, code = null) {
  const tidy = code ? tidyCode(code) : null;
  let url;
  try {
    url = new URL(String(href ?? ''));
  } catch {
    
    
    
    return tidy ? `?${JOIN_PARAM}=${tidy}` : '';
  }
  url.search = '';
  url.hash = '';
  if (tidy) url.searchParams.set(JOIN_PARAM, tidy);
  return url.toString();
}














export function shareText({ kind, worth = null, day = null } = {}) {
  if (kind === 'worth' && Number(worth) > 0) {
    const n = worthText(worth);
    const d = Number(day) > 0 ? Math.round(Number(day)) : null;
    return d
      ? `My moon farm is worth ${n} on day ${d}. Come and see it.`
      : `My moon farm is worth ${n}. Come and see it.`;
  }
  if (kind === 'moon') return 'My moon is open - come and visit.';
  return 'Come and farm a little moon with me.';
}








export function sharePayload({ kind = 'game', href = '', code = null, worth = null, day = null } = {}) {
  return {
    title: SHARE_TITLE,
    text: shareText({ kind, worth, day }),
    url: shareLink(href, code),
  };
}


export function shareString({ text = '', url = '' } = {}) {
  return [String(text).trim(), String(url).trim()].filter(Boolean).join(' ');
}








export function shareParams({ kind = 'game', code = null, how = 'share' } = {}) {
  return { where: String(kind), invite: code && tidyCode(code) ? 1 : 0, how: String(how) };
}


export function canShare(nav, payload = null) {
  if (!nav || typeof nav.share !== 'function') return false;
  if (payload && typeof nav.canShare === 'function') {
    try { return Boolean(nav.canShare(payload)); } catch { return false; }
  }
  return true;
}













export async function doShare(payload, { nav = null } = {}) {
  const line = shareString(payload);
  if (canShare(nav, payload)) {
    try {
      await nav.share(payload);
      return 'shared';
    } catch (e) {
      if (e && e.name === 'AbortError') return 'dismissed';
      
    }
  }
  const clip = nav && nav.clipboard;
  if (clip && typeof clip.writeText === 'function' && line) {
    try {
      await clip.writeText(line);
      return 'copied';
    } catch {  }
  }
  return 'failed';
}
