









































const MUSIC_SRC = '/play/shared/audio/lofi.js';
const MUSIC_BTN_SRC = '/play/shared/ui/musicButton.js';
const LIVE_SRC = '/play/shared/ui/liveBadge.js';

const CSS = `
.site-header .studio-tools {
  display: flex; align-items: center; gap: 6px;
  margin-left: auto; flex: 0 0 auto;
}
.site-header .studio-music {
  display: inline-flex; align-items: center; justify-content: center;
  width: 48px; height: 44px; padding: 0;
  background: transparent; border: 0; border-radius: 8px;
  color: currentColor; cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.site-header .studio-music:hover { background: rgba(127,127,127,0.16); }
.site-header .studio-music:focus-visible { outline: 3px solid currentColor; outline-offset: 2px; }
.site-header .studio-music .mg-slash { display: none; }
.site-header .studio-music[aria-pressed="false"] .mg-slash { display: block; }
.site-header .studio-music[aria-pressed="false"] .mg-note { opacity: 0.45; }
.site-header .studio-music[aria-pressed="false"] { opacity: 0.75; }
@media (max-width: 700px) {
  .site-header .studio-music { width: 44px; height: 40px; }
}
`;

const NOTE_SVG = `
<svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true" focusable="false">
  <path class="mg-note" d="M18 6.5 L27 4.5 V17.2" fill="none" stroke="currentColor"
        stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle class="mg-note" cx="15.4" cy="18.6" r="3.4" fill="currentColor"/>
  <circle class="mg-note" cx="24.4" cy="16.6" r="3.4" fill="currentColor"/>
  <path d="M3 12.5 H6.5 L11 8.5 V23.5 L6.5 19.5 H3 Z" fill="currentColor"/>
  <path class="mg-slash" d="M4 27 L28 5" fill="none" stroke="currentColor"
        stroke-width="2.8" stroke-linecap="round"/>
</svg>`;









export async function mountStudioBanner(doc = globalThis.document) {
  const header = doc?.querySelector?.('.site-header');
  if (!header) return null;
  if (header.querySelector('.studio-tools')) return null;   

  const style = doc.createElement('style');
  style.id = 'studio-banner-css';
  style.textContent = CSS;
  doc.head.appendChild(style);

  const tools = doc.createElement('div');
  tools.className = 'studio-tools';
  
  
  
  header.appendChild(tools);

  
  
  
  
  try {
    const [music, { wireMusicButton }] = await Promise.all([
      import(MUSIC_SRC),
      import(MUSIC_BTN_SRC),
    ]);
    const btn = doc.createElement('button');
    btn.id = 'music-btn';
    btn.className = 'studio-music';
    btn.type = 'button';
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', 'Play music');
    btn.title = 'Play music';
    btn.innerHTML = NOTE_SVG;
    tools.appendChild(btn);
    wireMusicButton({ music, announce: () => {} });
  } catch {  }

  
  
  try {
    const { mountLiveBadge } = await import(LIVE_SRC);
    mountLiveBadge({ host: tools });
  } catch {  }

  return tools;
}



if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { mountStudioBanner(); });
  } else {
    mountStudioBanner();
  }
}
