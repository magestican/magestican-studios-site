









import { shareInvite, inviteText, publicUrlFor, myLevel } from './shareInvite.js';

const STYLE_ID = 'mg-share-game-style';
const ICON = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" '
  + 'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3M7 8l5-5 5 5"/>'
  + '<path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';

const CHECK = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" '
  + 'stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>';


export function gameLinkFor(href) {
  try {
    const u = new URL(publicUrlFor(href));
    u.searchParams.delete('join');
    u.searchParams.delete('fleet');
    u.hash = '';
    return u.toString();
  } catch {
    return String(href ?? '');
  }
}

export function mountShareGame(host, gameName, { before = null } = {}) {
  try {
    const doc = host?.ownerDocument ?? globalThis.document;
    if (!host || !doc || !gameName) return null;
    if (host.querySelector?.('.mg-share-game')) return host.querySelector('.mg-share-game');
    if (!doc.getElementById(STYLE_ID)) {
      const st = doc.createElement('style');
      st.id = STYLE_ID;
      st.textContent = '.mg-share-game{display:inline-grid;place-items:center;flex:0 0 auto;width:30px;height:30px;'
        + 'padding:0;margin:0;border-radius:50%;border:1px solid rgba(28,26,23,.25);background:#fffbf2;color:#1c1a17;'
        + 'cursor:pointer;vertical-align:middle}.mg-share-game:hover,.mg-share-game:focus-visible{background:#fdf0c9;outline:none}';
      (doc.head ?? doc.documentElement).appendChild(st);
    }
    const btn = doc.createElement('button');
    btn.type = 'button';
    btn.className = 'mg-share-game';
    btn.setAttribute('aria-label', `Share ${gameName}`);
    btn.title = `Share ${gameName}`;
    btn.innerHTML = ICON;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const url = gameLinkFor(globalThis.location?.href ?? '');
      shareInvite({ url, title: gameName, text: inviteText({ gameName, level: myLevel() }) })
        .then((res) => {
          
          
          if (res?.via === 'clipboard') {
            btn.innerHTML = CHECK;
            btn.title = 'Link copied';
            btn.setAttribute('aria-label', 'Link copied');
          }
          
          
          
          if (res?.via === 'manual') {
            try { globalThis.prompt?.('Copy this link:', res.url); } catch {  }
          }
          setTimeout(() => {
            btn.innerHTML = ICON;
            btn.title = `Share ${gameName}`;
            btn.setAttribute('aria-label', `Share ${gameName}`);
          }, 2200);
        }, () => {});
    });
    if (before && before.parentNode === host) host.insertBefore(btn, before);
    else host.appendChild(btn);
    return btn;
  } catch {
    return null;
  }
}
