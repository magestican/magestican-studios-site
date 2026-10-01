



























import { showBanner, hideBanner } from './banner.js';


const BANNER_ID = 'vc-banner';

const DEFAULTS = {
  versionUrl: '/version.json',
  intervalMs: 60_000,      
  label: 'A new version is available.',
  buttonLabel: 'Refresh',
};

export function startVersionChecker(opts = {}) {
  const cfg = { ...DEFAULTS, ...opts };
  let currentBuildId = null;
  let raised = false;

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
      if (id !== currentBuildId) raiseBanner();
    } catch {
      
    }
  };

  function raiseBanner() {
    if (raised) return;
    raised = true;
    showBanner({
      id: BANNER_ID,
      text: cfg.label,
      actionLabel: cfg.buttonLabel,
      
      onAction: () => location.reload(),
    });
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
    
    
    if (raised) { hideBanner(BANNER_ID); raised = false; }
  };
}
