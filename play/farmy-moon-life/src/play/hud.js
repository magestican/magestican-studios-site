


















import { TREES } from 'moon/economy/tables.mjs';
import { REFUSAL_S, verbStep } from 'moon/play/actButton.mjs';

const SVG_NS = 'http://www.w3.org/2000/svg';

export function createHud({
  prompt: promptEl, pockets: pocketsEl, seeds: seedsEl, today: todayEl, button, iconFor, onChooseSeed,
  
  
  
  
  
  
  
  
  onVerbChange = () => {},
}) {
  const icons = new Map();
  const icon = (good, size) => {
    const key = `${good}|${size}`;
    if (!icons.has(key)) icons.set(key, iconFor(good, { size }));
    return icons.get(key);
  };
  const iconEl = (good, size) => {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    c.className = 'icon';
    icon(good, size).then((src) => c.getContext('2d').drawImage(src, 0, 0, size, size));
    return c;
  };
  let sigPockets = null, sigPrompt = null, sigSeeds = null, sigCannot = null, lastHold = -1, flash = null;
  
  
  
  
  
  
  let said = null;

  function pockets(counts) {
    const entries = Object.entries(counts).filter(([, n]) => n > 0);
    const sig = JSON.stringify(entries);
    if (sig === sigPockets) return;
    sigPockets = sig;
    pocketsEl.hidden = entries.length === 0;
    pocketsEl.replaceChildren(...entries.map(([good, n]) => {
      const chip = document.createElement('div');
      chip.className = 'chip';
      chip.dataset.good = good;
      chip.title = good;
      const count = document.createElement('b');
      count.textContent = String(n);
      chip.append(iconEl(good, 56), count);
      return chip;
    }));
  }

  function seeds(kinds, chosen) {
    const sig = kinds.length > 1 ? `${kinds.join(',')}|${chosen}` : '';
    if (sig === sigSeeds) return;
    sigSeeds = sig;
    seedsEl.hidden = !sig;
    
    
    
    document.body.classList.toggle('seeding', Boolean(sig));
    seedsEl.replaceChildren(...(sig ? kinds.map((kind) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = kind === chosen ? 'seed on' : 'seed';
      b.dataset.kind = kind;
      b.setAttribute('aria-label', `Plant ${kind} seeds`);
      b.append(iconEl(TREES[kind].seed, 64));
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); onChooseSeed(kind); });
      return b;
    }) : []));
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  let sigToday = null, todayParts = null;

  function buildToday() {
    const top = document.createElement('div');
    top.className = 'top';
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 26 14');
    svg.setAttribute('class', 'arc');
    svg.setAttribute('aria-hidden', 'true');
    const rail = document.createElementNS(SVG_NS, 'path');
    rail.setAttribute('class', 'rail');
    
    rail.setAttribute('d', 'M2 13 A11 11 0 0 1 24 13');
    const body = document.createElementNS(SVG_NS, 'circle');
    body.setAttribute('class', 'body');
    body.setAttribute('r', '3');
    svg.append(rail, body);
    const day = document.createElement('b');
    top.append(svg, day);
    const when = document.createElement('div');
    when.className = 'when';
    const glyph = document.createElement('i');
    glyph.className = 'glyph';
    glyph.setAttribute('aria-hidden', 'true');
    const words = document.createElement('span');
    when.append(glyph, words);
    todayEl.replaceChildren(top, when);
    return { body, day, glyph, words };
  }

  






  function today(view) {
    if (!todayEl || !view) return;
    const sig = `${view.text}|${view.arc.up}|${Math.round(view.arc.x * 100)}`;
    if (sig === sigToday) return;
    sigToday = sig;
    if (!todayParts) todayParts = buildToday();
    const { body, day, glyph, words } = todayParts;
    body.setAttribute('cx', (2 + view.arc.x * 22).toFixed(2));
    body.setAttribute('cy', (13 - view.arc.y * 11).toFixed(2));
    day.textContent = `Day ${view.day}`;
    glyph.textContent = view.glyph;
    words.textContent = `${view.part} - ${view.label}`;
    
    
    todayEl.classList.toggle('night', !view.arc.up);
    todayEl.setAttribute('aria-label', view.text);
    todayEl.hidden = false;
  }

  
  function say(text, nowS, forS = REFUSAL_S) {
    flash = { text, until: nowS + forS };
    said = { text, atS: nowS, forS };
  }

  







  function nope(why = null, nowS = 0) {
    if (why) say(why, nowS);
    promptEl.classList.remove('nope');
    void promptEl.offsetWidth;
    promptEl.classList.add('nope');
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  let parts = null, verbState = null, sigWord = null, sigIcon = null, bumping = false;
  
  
  
  
  
  
  
  let lastChange = null;

  function buildButton() {
    const box = document.createElement('span');
    box.className = 'icons';
    const glyph = document.createElement('i');
    glyph.className = 'glyph';
    glyph.setAttribute('aria-hidden', 'true');
    
    
    const ghost = document.createElement('i');
    ghost.className = 'ghost';
    ghost.setAttribute('aria-hidden', 'true');
    box.append(glyph, ghost);
    const word = document.createElement('span');
    word.className = 'word';
    button.replaceChildren(box, word);
    return { glyph, ghost, word };
  }

  





  function bump() {
    button.classList.remove('verbchange');
    void button.offsetWidth;
    button.classList.add('verbchange');
    bumping = true;
  }

  function update(p, holdProgress, nowS) {
    if (flash && nowS > flash.until) flash = null;
    
    
    
    
    
    const shown = flash ? { why: flash.text } : null;
    const sig = JSON.stringify(shown);
    if (sig !== sigPrompt) {
      sigPrompt = sig;
      promptEl.hidden = !shown;
      promptEl.replaceChildren();
      if (shown) {
        for (const [cls, text] of [['label', shown.label], ['why', shown.why], ['hold', shown.hold]]) {
          if (!text) continue;
          const s = document.createElement('span');
          s.className = cls;
          s.textContent = text;
          promptEl.append(s);
        }
      }
    }
    
    
    
    
    
    
    
    
    
    
    const next = verbStep(verbState, p, nowS);
    if (next !== verbState) {
      const was = verbState;
      verbState = next;
      if (!parts) parts = buildButton();
      if (was && next.changes !== was.changes) {
        
        
        parts.ghost.textContent = next.fromIcon || '';
        bump();
        
        
        
        
        
        
        
        lastChange = {
          from: next.from,
          to: next.verb,
          word: next.word,
          icon: next.icon,
          leaving: next.fromIcon,
          label: next.label,
          atS: nowS,
          changes: next.changes,
          bumped: button.classList.contains('verbchange'),
        };
        onVerbChange({ from: next.from, to: next.verb, word: next.word, icon: next.icon, nowS });
      }
      if (next.label !== sigWord) {
        sigWord = next.label;
        parts.word.textContent = next.label;
        button.setAttribute('aria-label', next.label);
      }
      if (next.icon !== sigIcon) {
        sigIcon = next.icon;
        parts.glyph.textContent = next.icon;
      }
      if (next.cannot !== sigCannot) {
        sigCannot = next.cannot;
        button.classList.toggle('cannot', next.cannot);
      }
      
      
      
      if (bumping && !next.flash) {
        bumping = false;
        button.classList.remove('verbchange');
      }
    }
    const hp = Math.round(holdProgress * 50) / 50;
    if (hp !== lastHold) {
      lastHold = hp;
      button.style.setProperty('--hold', String(hp));
    }
  }

  
  
  
  
  
  return { pockets, seeds, today, say, nope, update,
    get said() { return said; },
    






    get act() { return parts ? parts.word.textContent : button.textContent; },
    





    get verb() {
      return {
        verb: verbState ? verbState.verb : null,
        word: verbState ? verbState.word : null,
        icon: verbState ? verbState.icon : null,
        sentence: verbState ? verbState.sentence : null,
        label: verbState ? verbState.label : null,
        cannot: Boolean(verbState && verbState.cannot),
        flash: Boolean(verbState && verbState.flash),
        changes: verbState ? verbState.changes : 0,
        from: verbState ? verbState.from : null,
        lastChange,
        shownWord: parts ? parts.word.textContent : null,
        shownIcon: parts ? parts.glyph.textContent : null,
        leavingIcon: parts ? parts.ghost.textContent : null,
        bumping: button.classList.contains('verbchange'),
      };
    },
  };
}
