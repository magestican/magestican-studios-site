






















import { installSteps, offlineLine } from 'moon/play/install.mjs';

const el = (tag, className, text) => {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text !== undefined) n.textContent = text;
  return n;
};

function button(className, act, label, fn, { aria = null } = {}) {
  const b = el('button', className, label);
  b.type = 'button';
  if (act) b.dataset.act = act;
  if (aria) b.setAttribute('aria-label', aria);
  b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); fn(); });
  return b;
}








export function createInstallCard({ el: root, button: opener, read, onInstall = () => {} }) {
  let open = false;
  const stats = { opens: 0, renders: 0, installs: 0 };

  root.addEventListener('pointerdown', (e) => e.stopPropagation());
  root.addEventListener('pointerup', (e) => e.stopPropagation());

  const card = {
    get isOpen() { return open; },
    stats,
    
    get lines() {
      return [...root.querySelectorAll('.step')].map((n) => n.textContent);
    },
    show() {
      if (open) return;
      open = true;
      stats.opens += 1;
      root.hidden = false;
      card.render();
    },
    hide() { open = false; root.hidden = true; },
    toggle() { if (open) card.hide(); else card.show(); },

    render() {
      
      
      
      
      opener.hidden = false;
      if (!open) return;
      stats.renders += 1;
      const state = read() || {};
      const words = installSteps(state.platform);

      const parts = [];
      const head = el('div', 'head');
      const title = el('div', 'title');
      title.append(el('b', undefined, words.title));
      head.append(title, button('close', 'close', 'x', () => card.hide(), { aria: 'Close' }));
      parts.push(head);

      
      
      const line = el('p', 'state', offlineLine({
        supported: state.supported,
        controlling: state.controlling || state.registered,
        files: state.files,
      }));
      line.dataset.ready = state.files > 0 ? '1' : '0';
      parts.push(line);

      parts.push(el('p', 'lead', words.lead));

      
      
      if (state.canPrompt) {
        parts.push(button('go', 'install', 'Install', () => {
          stats.installs += 1;
          Promise.resolve(onInstall()).then(() => card.render(), () => card.render());
        }, { aria: 'Install Farmy Moon' }));
      }

      if (words.steps.length) {
        const list = el('ol', 'steps');
        for (const s of words.steps) list.append(el('li', 'step', s));
        parts.push(list);
      }
      if (words.note) parts.push(el('p', 'note', words.note));

      root.replaceChildren(...parts);
    },
  };

  opener.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); card.toggle(); });
  card.hide();
  return card;
}
