




export const LOADING_CAP_MS = 12000;





export function createLoadingCard(el, { assets, cap = LOADING_CAP_MS, setTimer = setTimeout }) {
  const bar = el?.querySelector('[data-el="bar"]');
  const total = assets.length;
  let done = 0;
  let ready = total === 0;
  let gone = !el;
  const settled = assets.map(() => false);
  const show = () => {
    if (bar) bar.style.width = `${Math.round((total ? done / total : 1) * 100)}%`;
  };
  show();
  for (const [i, a] of assets.entries())
    Promise.resolve(a)
      .catch(() => {})
      .then(() => {
        settled[i] = true;
        done++;
        show();
        if (done >= total) ready = true;
      });
  setTimer(() => (ready = true), cap);
  return {
    get up() {
      return !gone;
    },
    
    get settled() {
      return settled.slice();
    },
    
    shift(text) {
      const s = el?.querySelector('[data-el="shift"]');
      if (s) s.textContent = text;
    },
    
    rendered() {
      if (gone || !ready) return false;
      gone = true;
      el.classList.add('is-gone');
      el.setAttribute('aria-hidden', 'true');
      setTimer(() => el.remove(), 400);
      return true;
    },
  };
}
