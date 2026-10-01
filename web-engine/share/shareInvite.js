













export async function shareInvite({ url, title, text }, nav = globalThis.navigator) {
  const data = { url, title, text };
  if (nav && typeof nav.share === 'function' && (!nav.canShare || nav.canShare(data))) {
    try {
      await nav.share(data);
      return { via: 'share' };
    } catch (e) {
      if (e && e.name === 'AbortError') return { via: 'cancelled' };
      
      
    }
  }
  if (nav?.clipboard?.writeText) {
    try {
      await nav.clipboard.writeText(`${text ? `${text} ` : ''}${url}`);
      return { via: 'clipboard' };
    } catch {  }
  }
  return { via: 'manual', url };
}

export function inviteText({ gameName, code, level }) {
  const lv = level ? ` (I'm level ${level})` : '';
  return code
    ? `Join my ${gameName} game${lv} - room ${code}. Opens in your browser, no download:`
    : `Play ${gameName} with me${lv} - opens in your browser, no download:`;
}

export const PUBLIC_ORIGIN = 'https://magesticanstudios.com';







export function publicUrlFor(locationHref) {
  let u;
  try { u = new URL(String(locationHref)); } catch { return String(locationHref ?? ''); }
  u.searchParams.delete('app');
  u.searchParams.delete('appv');
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(u.hostname);
  if (local && /^https?:$/.test(u.protocol)) {
    return `${PUBLIC_ORIGIN}${u.pathname}${u.search}${u.hash}`;
  }
  return u.toString();
}


export function myLevel(storage = globalThis.localStorage) {
  try {
    const s = JSON.parse(storage?.getItem('magestican.progress.snapshot.v1') || 'null');
    return Number.isInteger(s?.level) && s.level >= 1 ? s.level : null;
  } catch {
    return null;
  }
}






export function announceShare(result, { button = null, field = null, doc = globalThis.document, idle = null, ms = 2200 } = {}) {
  try {
    const via = result?.via;
    if (via === 'clipboard' && button) {
      const before = idle ?? button.textContent;
      button.textContent = 'Link copied';
      setTimeout(() => { button.textContent = before; }, ms);
    } else if (via === 'manual') {
      let input = field;
      if (!input && doc?.createElement && button?.parentNode) {
        input = button.parentNode.querySelector?.('.mg-share-manual') ?? null;
        if (!input) {
          input = doc.createElement('input');
          input.className = 'mg-share-manual';
          input.readOnly = true;
          input.setAttribute('aria-label', 'Invite link - select and copy');
          input.style.cssText = 'display:block;width:100%;max-width:360px;box-sizing:border-box;margin-top:6px;font:13px system-ui,sans-serif';
          button.parentNode.insertBefore(input, button.nextSibling);
        }
      }
      if (input) {
        input.value = result.url;
        try { input.focus(); input.select(); } catch {  }
      }
    }
  } catch {  }
  return result;
}





export async function shareLink({ link, gameName, code = null, button = null, field = null, title = null }) {
  const url = publicUrlFor(link);
  const res = await shareInvite({
    url,
    title: title ?? gameName,
    text: inviteText({ gameName, code, level: myLevel() }),
  });
  return announceShare(res, { button, field });
}
