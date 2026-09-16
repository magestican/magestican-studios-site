

















import { lobbyBadge, moonLine, tidyCode } from 'moon/play/lobby.mjs';
import { whoIsHere } from 'moon/play/session.mjs';

const el = (tag, className, text) => {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text !== undefined) n.textContent = text;
  return n;
};



function button(className, label, fn, { aria = null } = {}) {
  const b = el('button', className, label);
  b.type = 'button';
  if (aria) b.setAttribute('aria-label', aria);
  b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); fn(); });
  return b;
}

export function createVisitCard({
  el: root, button: opener,
  onHost = () => {}, onJoin = () => {}, onLeave = () => {},
  onApprove = () => {}, onRefuse = () => {}, onOpened = () => {},
}) {
  let open = false;
  let typed = '';
  
  
  
  
  
  let codeWhy = '';
  let last = null;
  const stats = { opens: 0, renders: 0, approves: 0, refuses: 0, joins: 0 };

  
  
  
  
  root.addEventListener('pointerdown', (e) => e.stopPropagation());
  root.addEventListener('pointerup', (e) => e.stopPropagation());

  function head(title, sub) {
    const h = el('div', 'head');
    const t = el('div', 'title');
    t.append(el('b', null, title));
    if (sub) t.append(el('span', 'sub', sub));
    h.append(t, button('close', '×', () => card.hide(), { aria: 'Close' }));
    return h;
  }

  
  function codeRow(code) {
    const row = el('div', 'code');
    row.append(el('b', null, String(code).toUpperCase()));
    row.append(el('span', 'hint', 'Read this out to whoever you want to visit.'));
    return row;
  }

  
  const row = (...kids) => {
    const r = el('div', 'row');
    r.append(...kids);
    return r;
  };

  function knockRows(knocks) {
    const out = [];
    for (const k of knocks) {
      const line = el('div', 'knock');
      line.append(el('div', 'asks', `${k.name} would like to visit.`));
      const buttons = el('div', 'answer');
      buttons.append(
        button('let-in', `Let ${k.name} in`, () => { stats.approves += 1; onApprove(k.id); }),
        button('not-now', 'Not now', () => { stats.refuses += 1; onRefuse(k.id); }),
      );
      line.append(buttons);
      out.push(line);
    }
    return out;
  }

  function moonRows(moons, lobby) {
    const out = [];
    if (!moons.length) {
      
      
      out.push(el('div', 'why', lobby
        ? 'No moons are open just now. Type a code instead, if somebody gave you one.'
        : 'The list of open moons is not running yet - type a code instead.'));
      return out;
    }
    out.push(el('div', 'sub', lobbyBadge(moons.length)));
    for (const m of moons) {
      out.push(button('moon', moonLine(m), () => { stats.joins += 1; onJoin(m.code); }));
    }
    return out;
  }

  function joinRow() {
    const line = el('div', 'join');
    const input = el('input', 'code-in');
    input.type = 'text';
    input.placeholder = 'fml-______';
    input.autocapitalize = 'characters';
    input.spellcheck = false;
    input.setAttribute('aria-label', 'A moon code somebody gave you');
    input.value = typed;
    const go = button('go', 'Visit', () => {
      const code = tidyCode(input.value);
      
      
      
      
      if (!code) {
        codeWhy = 'That does not look like a moon code. It is six letters and numbers.';
        why.textContent = codeWhy;
        return;
      }
      codeWhy = '';
      why.textContent = '';
      stats.joins += 1;
      onJoin(code);
    });
    const why = el('div', 'why', codeWhy);
    input.addEventListener('input', () => { typed = input.value; codeWhy = ''; why.textContent = ''; });
    input.addEventListener('pointerdown', (e) => e.stopPropagation());
    input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') go.dispatchEvent(new Event('pointerdown')); });
    line.append(input, go);
    const wrap = el('div', 'joinwrap');
    wrap.append(line, why);
    return wrap;
  }

  const card = {
    get isOpen() { return open; },
    stats,

    show() {
      if (open) return;
      open = true;
      stats.opens += 1;
      root.hidden = false;
      onOpened();
      if (last) card.render(last);
    },

    hide() {
      open = false;
      root.hidden = true;
    },

    toggle() { if (open) card.hide(); else card.show(); },

    









    render(s) {
      last = s;
      
      
      const badge = s.mode === 'visiting' || s.mode === 'hosting' ? '' : lobbyBadge((s.moons || []).length);
      opener.textContent = badge || 'Visit';
      opener.classList.toggle('live', Boolean(badge));
      opener.hidden = false;
      if (!open) return;
      stats.renders += 1;

      const parts = [];
      if (s.mode === 'visiting') {
        parts.push(head('Visiting', null));
        parts.push(el('div', 'who', whoIsHere(s.session)));
        parts.push(el('div', 'why', 'You can pick fruit, forage, dig and water here. Building, planting and spending are for whoever lives on this moon.'));
        parts.push(row(button('leave', 'Go home', () => onLeave())));
      } else if (s.mode === 'joining') {
        parts.push(head('Visiting', null));
        parts.push(el('div', 'who', 'Knocking...'));
        parts.push(el('div', 'why', 'Waiting for them to let you in.'));
        parts.push(row(button('leave', 'Never mind', () => onLeave())));
      } else if (s.mode === 'hosting' || s.mode === 'opening') {
        parts.push(head('Your moon is open', null));
        if (s.code) parts.push(codeRow(s.code));
        const knocks = s.knocks || [];
        
        
        
        
        if (s.mode === 'opening') parts.push(el('div', 'who', 'Opening up...'));
        else if (s.session && s.session.others.length) parts.push(el('div', 'who', whoIsHere(s.session)));
        else if (!knocks.length) parts.push(el('div', 'who', whoIsHere(s.session)));
        parts.push(...knockRows(knocks));
        parts.push(row(button('leave', 'Close my moon', () => onLeave())));
      } else {
        parts.push(head('Visit', null));
        parts.push(el('div', 'why', 'Open your moon so a friend can come and help, or go and see somebody else\'s.'));
        parts.push(row(button('host', 'Open my moon', () => onHost())));
        parts.push(joinRow());
        parts.push(...moonRows(s.moons || [], s.lobby !== false));
      }
      if (s.problem) parts.push(el('div', 'problem', s.problem));
      root.replaceChildren(...parts.filter(Boolean));
    },
  };

  opener.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); card.toggle(); });
  card.hide();
  return card;
}
