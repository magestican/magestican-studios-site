














const STYLE_ID = 'mg-setup-fold-style';
export const WIDE = '(min-width: 900px)';

const CSS = `
.mg-setup { width: 100%; max-width: 760px; }
.mg-setup > summary { list-style: none; cursor: pointer; display: flex; align-items: center; gap: 8px;
  max-width: 100%; margin: 0 auto; width: fit-content; padding: 8px 14px; border: 2px solid currentColor;
  border-radius: 12px; font: inherit; font-size: 15px; font-weight: 600; }
.mg-setup > summary::-webkit-details-marker { display: none; }
.mg-setup > summary .mg-setup-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mg-setup > summary::after { content: '\\25BE'; font-size: 13px; }
.mg-setup[open] > summary::after { content: '\\25B4'; }
.mg-setup-body { display: flex; flex-direction: column; align-items: center; gap: 8px; padding-top: 8px; }
.mg-setup[open] > summary { margin-bottom: 2px; }
@media (min-width: 900px) { .mg-setup > summary { display: none; } }
@media (max-width: 560px) {
  main > h1[data-game-name] { font-size: 22px; margin: 2px 0 0; line-height: 1.15; }
  .studio-back { font-size: 0; flex: 0 0 auto; width: 34px; height: 34px; padding: 0; border: 2px solid currentColor;
    border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-left: auto; }
  .studio-back::before { content: '?'; font-size: 18px; font-weight: 700; }
  .studio-track { max-width: 112px; overflow: hidden; text-overflow: ellipsis; height: 34px; }
  .mg-setup-body button, .mg-setup-body select { padding: 5px 10px; font-size: 15px; min-height: 38px; }
  .mg-setup-body [class$="-gap"] { display: none; }
}
`;

function injectStyle(doc) {
  if (doc.getElementById(STYLE_ID)) return;
  const s = doc.createElement('style');
  s.id = STYLE_ID;
  s.textContent = CSS;
  doc.head.appendChild(s);
}

const shown = (el) => !el.closest('[hidden]');


export function summaryOf(body) {
  const parts = [];
  for (const el of body.querySelectorAll('[aria-pressed="true"], select, input[type="checkbox"]:checked')) {
    if (!shown(el)) continue;
    let text = '';
    if (el.tagName === 'SELECT') text = el.selectedOptions?.[0]?.textContent ?? '';
    else if (el.tagName === 'INPUT') text = el.closest('label')?.textContent ?? '';
    else text = el.textContent;
    text = String(text).replace(/\s+/g, ' ').trim();
    if (text && !parts.includes(text)) parts.push(text);
  }
  return parts.join(' · ');
}







export function foldSetup({ stopAt = '#room', doc = globalThis.document } = {}) {
  const h1 = doc?.querySelector('main > h1[data-game-name]');
  const stop = doc?.querySelector(stopAt);
  if (!h1 || !stop || stop.parentElement !== h1.parentElement) return null;
  const rows = [];
  for (let el = h1.nextElementSibling; el && el !== stop; el = el.nextElementSibling) rows.push(el);
  if (!rows.length) return null;
  injectStyle(doc);

  const details = doc.createElement('details');
  details.className = 'mg-setup';
  const summary = doc.createElement('summary');
  const gear = doc.createElement('span');
  gear.setAttribute('aria-hidden', 'true');
  gear.textContent = '⚙';
  const text = doc.createElement('span');
  text.className = 'mg-setup-text';
  summary.append(gear, text);
  const body = doc.createElement('div');
  body.className = 'mg-setup-body';
  h1.after(details);
  details.append(summary, body);
  for (const r of rows) body.appendChild(r);

  let queued = false;
  const refresh = () => {
    queued = false;
    const t = summaryOf(body);
    if (text.textContent !== t) text.textContent = t;
  };
  const later = () => {
    if (queued) return;
    queued = true;
    (globalThis.requestAnimationFrame ?? setTimeout)(refresh);
  };
  refresh();
  
  try {
    new MutationObserver(later).observe(body, { subtree: true, attributes: true, childList: true, characterData: true,
      attributeFilter: ['aria-pressed', 'hidden', 'checked'] });
  } catch {  }
  body.addEventListener('change', later);
  body.addEventListener('click', later);

  const wide = globalThis.matchMedia?.(WIDE);
  details.open = !!wide?.matches;
  wide?.addEventListener?.('change', (e) => { details.open = e.matches; });
  return details;
}
