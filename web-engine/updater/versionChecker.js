





















const DEFAULTS = {
  versionUrl: '/version.json',
  intervalMs: 60_000,      
  label: 'A new version is available.',
  buttonLabel: 'Refresh',
};

export function startVersionChecker(opts = {}) {
  const cfg = { ...DEFAULTS, ...opts };
  let currentBuildId = null;
  let banner = null;

  const check = async () => {
    try {
      const res = await fetch(`${cfg.versionUrl}?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      const id = data && data.buildId;
      if (!id) return;
      if (currentBuildId === null) {
        
        currentBuildId = id;
        return;
      }
      if (id !== currentBuildId) showBanner(cfg);
    } catch {
      
    }
  };

  function showBanner() {
    if (banner) return;
    injectStyles();
    banner = document.createElement('div');
    banner.className = 'vc-banner';
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-live', 'polite');
    banner.innerHTML = `
      <span class="vc-text">${escapeHtml(cfg.label)}</span>
      <button type="button" class="vc-btn">${escapeHtml(cfg.buttonLabel)}</button>
    `;
    banner.querySelector('.vc-btn').addEventListener('click', () => {
      
      location.reload();
    });
    document.body.appendChild(banner);
  }

  const onVisible = () => {
    if (document.visibilityState === 'visible') check();
  };

  
  check();
  const id = setInterval(check, cfg.intervalMs);
  window.addEventListener('focus', check);
  document.addEventListener('visibilitychange', onVisible);

  return () => {
    clearInterval(id);
    window.removeEventListener('focus', check);
    document.removeEventListener('visibilitychange', onVisible);
  };
}

function injectStyles() {
  if (document.getElementById('vc-styles')) return;
  const s = document.createElement('style');
  s.id = 'vc-styles';
  s.textContent = `
    .vc-banner {
      position: fixed; z-index: 100000;
      left: 50%; transform: translateX(-50%);
      bottom: max(16px, env(safe-area-inset-bottom));
      display: flex; align-items: center; gap: 12px;
      padding: 10px 14px;
      background: #1c1a17; color: #f6f1e6;
      font: 14px/1.4 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      border: 1px solid #f4c95d;
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.35);
      max-width: 92vw;
    }
    .vc-text { flex: 1 1 auto; }
    .vc-btn {
      appearance: none; border: 0; cursor: pointer;
      background: #f4c95d; color: #1c1a17;
      font: 600 13px inherit; padding: 6px 12px;
      border-radius: 6px;
    }
    .vc-btn:hover { background: #ffd670; }
  `;
  document.head.appendChild(s);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
