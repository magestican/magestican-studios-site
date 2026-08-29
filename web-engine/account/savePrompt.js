

























import { promptModel } from './signupMoment.js';
import { conflictModel } from './saveConflict.js';

const PROMPT_STYLE_ID = 'arbelo-save-prompt-style';

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};












export function mountSavePrompt(host, opts = {}, handlers = {}) {
  if (!host || typeof document === 'undefined') return null;
  const m = promptModel(opts);
  injectPromptStyles();
  host.textContent = '';
  host.className = `${host.className || ''} save-prompt`.trim();
  host.setAttribute('role', 'region');
  host.setAttribute('aria-label', 'Keep your progress');

  host.appendChild(el('div', 'sp-head', m.headline));
  host.appendChild(el('div', 'sp-body', m.body));

  const list = el('ul', 'sp-offers');
  for (const o of m.offers) {
    const li = el('li', 'sp-offer');
    li.appendChild(el('span', 'sp-icon', o.icon));
    const txt = el('div', 'sp-offer-text');
    txt.appendChild(el('div', 'sp-offer-title', o.title));
    txt.appendChild(el('div', 'sp-offer-body', o.text));
    li.appendChild(txt);
    list.appendChild(li);
  }
  host.appendChild(list);

  const row = el('div', 'sp-actions');
  const yes = el('button', 'sp-btn sp-btn-primary', m.cta);
  yes.type = 'button';
  
  yes.addEventListener('click', () => handlers.onAccept?.());
  row.appendChild(yes);

  const no = el('button', 'sp-btn', m.dismiss);
  no.type = 'button';
  no.addEventListener('click', () => handlers.onDismiss?.());
  row.appendChild(no);

  const never = el('button', 'sp-btn sp-btn-quiet', m.never);
  never.type = 'button';
  never.addEventListener('click', () => handlers.onNever?.());
  row.appendChild(never);
  host.appendChild(row);

  host.appendChild(el('div', 'sp-foot', m.footnote));
  return host;
}











export function mountConflictDialog(host, sides = {}, handlers = {}) {
  if (!host || typeof document === 'undefined') return null;
  const m = conflictModel(sides.local, sides.cloud, {
    localRecords: sides.localRecords, cloudRecords: sides.cloudRecords,
  });
  injectPromptStyles();
  host.textContent = '';
  host.className = `${host.className || ''} save-conflict`.trim();
  host.setAttribute('role', 'dialog');
  host.setAttribute('aria-modal', 'true');
  host.setAttribute('aria-label', m.title);

  host.appendChild(el('h2', 'sc-title', m.title));
  host.appendChild(el('p', 'sc-body', m.body));

  const cols = el('div', 'sc-cols');
  for (const side of [m.device, m.cloud]) {
    const c = el('div', 'sc-col');
    c.appendChild(el('div', 'sc-col-head', side.heading));
    if (side.name) c.appendChild(el('div', 'sc-col-name', side.name));
    c.appendChild(el('div', 'sc-col-line', side.line));
    const ul = el('ul', 'sc-col-games');
    for (const g of side.games) {
      ul.appendChild(el('li', null, `${g.name}: ${g.plays}`));
    }
    if (side.hasRecords) ul.appendChild(el('li', 'sc-col-rec', 'Farmy Kart lap records'));
    c.appendChild(ul);
    cols.appendChild(c);
  }
  host.appendChild(cols);

  const actions = el('div', 'sc-actions');
  for (const o of m.options) {
    const b = el('button', o.id === m.recommended ? 'sp-btn sp-btn-primary' : 'sp-btn');
    b.type = 'button';
    b.appendChild(el('span', 'sc-opt-label', o.label));
    b.appendChild(el('span', 'sc-opt-hint', o.hint));
    b.addEventListener('click', () => handlers.onChoose?.(o.id));
    actions.appendChild(b);
  }
  host.appendChild(actions);
  return host;
}

function injectPromptStyles() {
  if (typeof document === 'undefined' || document.getElementById(PROMPT_STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = PROMPT_STYLE_ID;
  s.textContent = `
    .save-prompt { font: 13px/1.5 system-ui, sans-serif; color: #cbd3e1;
      background: #151a23; border: 1px solid #2a3240; border-radius: 10px;
      padding: 14px 16px; max-width: 460px; }
    .sp-head { font: 700 17px/1.25 system-ui, sans-serif; color: #f2f5fa; }
    .sp-body { color: #9aa4b5; margin: 4px 0 12px; font-size: 12px; }
    .sp-offers { list-style: none; margin: 0 0 14px; padding: 0; display: grid; gap: 9px; }
    .sp-offer { display: flex; gap: 10px; align-items: flex-start; }
    .sp-icon { flex: 0 0 22px; width: 22px; height: 22px; border-radius: 6px;
      background: #232935; color: #8fb8ff; display: inline-flex; align-items: center;
      justify-content: center; font-size: 12px; }
    .sp-offer-title { font-weight: 700; color: #e6ebf3; font-size: 12px; }
    .sp-offer-body { color: #7f8798; font-size: 11px; }
    .sp-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .sp-btn { font: 600 12px/1.2 system-ui, sans-serif; color: #cbd3e1; background: #232935;
      border: 1px solid #333b4a; border-radius: 6px; padding: 9px 13px; cursor: pointer; }
    .sp-btn:hover { background: #2b3341; }
    .sp-btn-primary { background: #2f6fd0; border-color: #3c81e8; color: #fff; }
    .sp-btn-quiet { background: transparent; border-color: transparent; color: #6c7484; }
    .sp-foot { margin-top: 10px; font-size: 10px; color: #626a79; }
    .save-conflict { font: 13px/1.5 system-ui, sans-serif; color: #cbd3e1;
      background: #151a23; border: 1px solid #2a3240; border-radius: 10px;
      padding: 18px; max-width: 540px; }
    .sc-title { font: 700 19px/1.2 system-ui, sans-serif; color: #f2f5fa; margin: 0 0 6px; }
    .sc-body { color: #9aa4b5; font-size: 12px; margin: 0 0 14px; }
    .sc-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
    .sc-col { background: #171c25; border: 1px solid #2a3240; border-radius: 8px; padding: 10px; }
    .sc-col-head { font: 700 10px/1 system-ui, sans-serif; letter-spacing: .12em;
      text-transform: uppercase; color: #7f8798; margin-bottom: 6px; }
    .sc-col-name { font-weight: 700; color: #f2f5fa; }
    .sc-col-line { color: #9aa4b5; font-size: 12px; margin-bottom: 6px; }
    .sc-col-games { list-style: none; margin: 0; padding: 0; font-size: 11px; color: #7f8798; }
    .sc-col-rec { color: #ffd45e; }
    .sc-actions { display: grid; gap: 8px; }
    .sc-actions .sp-btn { display: flex; flex-direction: column; align-items: flex-start;
      gap: 3px; text-align: left; }
    .sc-opt-label { font-weight: 700; font-size: 13px; }
    .sc-opt-hint { font-weight: 400; font-size: 11px; opacity: .8; }
  `;
  document.head.appendChild(s);
}
