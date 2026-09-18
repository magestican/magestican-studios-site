


















import { accountView } from 'moon/play/cloudSave.mjs';

const el = (tag, className, text) => {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text !== undefined) n.textContent = text;
  return n;
};

function button(className, act, label, fn, { aria = null, disabled = false } = {}) {
  const b = el('button', className, label);
  b.type = 'button';
  if (act) b.dataset.act = act;
  if (aria) b.setAttribute('aria-label', aria);
  b.disabled = disabled;
  b.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!b.disabled) fn();
  });
  return b;
}







export function createAccountCard({ el: root, button: opener, cloud, onOpened = () => {} }) {
  let open = false;
  let typed = '';
  
  let drawn = null;
  const stats = { opens: 0, renders: 0, taps: 0 };

  root.addEventListener('pointerdown', (e) => e.stopPropagation());
  root.addEventListener('pointerup', (e) => e.stopPropagation());

  
  
  
  
  
  
  
  
  let preview = null;

  
  const view = () => accountView({ ...cloud.state, ...(preview || {}), now: Date.now() });

  const card = {
    get isOpen() { return open; },
    stats,
    
    get lines() { return view().lines; },
    show() {
      if (open) return;
      open = true;
      stats.opens += 1;
      root.hidden = false;
      root.dataset.open = '1';
      onOpened();
      card.render();
    },
    hide() {
      open = false;
      drawn = null;
      root.hidden = true;
      delete root.dataset.open;
    },
    toggle() { if (open) card.hide(); else card.show(); },
    
    preview(state) {
      preview = state && typeof state === 'object' ? { ...state } : null;
      card.render();
      return view();
    },

    render() {
      const v = view();
      
      
      
      opener.hidden = false;
      opener.textContent = v.label;
      if (!open) return;
      
      
      
      
      
      const sig = JSON.stringify([v.title, v.lines, v.can, v.tone, Boolean(cloud.state.newer)]);
      if (sig === drawn) return;
      drawn = sig;
      stats.renders += 1;

      const head = el('div', 'head');
      const title = el('div', 'title');
      title.append(el('b', undefined, v.title));
      head.append(title, button('close', 'close', '×', () => card.hide(), { aria: 'Close' }));

      const said = el('div', 'says');
      for (const line of v.lines) said.append(el('p', 'say', line));

      const acts = el('div', 'acts');
      acts.dataset.tone = v.tone;
      if (v.can.google) {
        acts.append(button('go', 'google', 'Continue with Google', () => {
          stats.taps += 1;
          cloud.signInWithGoogle().then(() => card.render(), () => card.render());
        }));
      }
      if (v.can.link) {
        const field = document.createElement('input');
        field.type = 'email';
        field.className = 'email';
        field.placeholder = 'you@example.com';
        field.setAttribute('aria-label', 'Your email address');
        field.value = typed;
        field.addEventListener('input', () => { typed = field.value; });
        field.addEventListener('pointerdown', (e) => e.stopPropagation());
        
        field.addEventListener('keydown', (e) => e.stopPropagation());
        acts.append(field, button('go', 'link', 'Email me a link', () => {
          stats.taps += 1;
          cloud.sendLink(typed).then(() => card.render(), () => card.render());
        }));
      }
      if (cloud.state.newer) {
        
        
        acts.append(button('go', 'use', 'Load the newer moon from the cloud', () => {
          stats.taps += 1;
          cloud.useNewer();
        }));
      }
      if (v.can.signOut) {
        acts.append(button('out', 'signout', 'Sign out', () => {
          stats.taps += 1;
          cloud.signOutNow().then(() => card.render(), () => card.render());
        }));
      }

      root.replaceChildren(head, said, acts);
    },
  };

  opener.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); card.toggle(); });
  card.hide();
  return card;
}
