
















export const HOWTO_KEY = 'tb.howto';

export function createHowtoGate({ overlay, close, storage }) {
  let pending = null;
  const seen = () => {
    try { return !!storage.getItem(HOWTO_KEY); } catch { return false; }
  };
  const show = () => { overlay.style.display = 'flex'; };

  close.addEventListener('click', () => {
    try { storage.setItem(HOWTO_KEY, '1'); } catch {  }
    overlay.style.display = 'none';
    const next = pending;
    pending = null;
    if (next) next();
  });

  return {
    seen,
    show,
    
    before(action) {
      if (seen()) return action();
      pending = action;
      show();
      return undefined;
    },
  };
}
