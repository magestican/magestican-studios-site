
























import { TREES } from 'moon/economy/tables.mjs';
import { REFUSAL_S, verbStep, actLabel, actRefused } from 'moon/play/actButton.mjs';
import { badgeCount, pocketRows, topGood } from 'moon/play/corners.mjs';

const SVG_NS = 'http://www.w3.org/2000/svg';

export function createHud({
  prompt: promptEl, pockets: pocketsEl, seeds: seedsEl, today: todayEl, quest: questEl = null, button, iconFor, onChooseSeed,
  
  
  
  
  
  
  
  
  onVerbChange = () => {},
  onTogglePockets = () => {},
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

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const badge = document.createElement('button');
  badge.type = 'button';
  badge.id = 'pocketbadge';
  badge.className = 'badge';
  badge.setAttribute('aria-haspopup', 'true');
  badge.setAttribute('aria-expanded', 'false');
  const badgeIcon = document.createElement('span');
  badgeIcon.className = 'pile';
  const badgeCountEl = document.createElement('b');
  badgeCountEl.className = 'n';
  badge.append(badgeIcon, badgeCountEl);
  badge.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); onTogglePockets(); });
  const pocketTray = document.createElement('div');
  pocketTray.id = 'pockettray';
  pocketTray.className = 'tray';
  pocketTray.hidden = true;
  
  
  pocketTray.addEventListener('pointerdown', (e) => e.stopPropagation());
  pocketTray.addEventListener('pointerup', (e) => e.stopPropagation());
  pocketsEl.replaceChildren(badge, pocketTray);
  pocketsEl.hidden = true;
  let badgeGood = null, pocketsOpen = false;

  function pockets(counts) {
    const rows = pocketRows(counts);
    const sig = JSON.stringify(rows);
    if (sig === sigPockets) return;
    sigPockets = sig;
    
    
    pocketsEl.hidden = rows.length === 0;
    const total = badgeCount(counts);
    badgeCountEl.textContent = String(total);
    const good = topGood(counts);
    if (good && good !== badgeGood) {
      badgeGood = good;
      badgeIcon.replaceChildren(iconEl(good, 48));
    }
    badge.setAttribute('aria-label', `Pockets, ${total} item${total === 1 ? '' : 's'}`);
    pocketTray.replaceChildren(...rows.map(({ good: g, n }) => {
      const chip = document.createElement('div');
      chip.className = 'chip';
      chip.dataset.good = g;
      chip.title = g;
      chip.setAttribute('aria-label', `${n} ${g}`);
      const count = document.createElement('b');
      count.textContent = String(n);
      chip.append(iconEl(g, 56), count);
      return chip;
    }));
  }

  
  function setPocketsOpen(open) {
    const next = Boolean(open);
    if (next === pocketsOpen) return;
    pocketsOpen = next;
    pocketTray.hidden = !next;
    badge.classList.toggle('on', next);
    badge.setAttribute('aria-expanded', String(next));
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

  
  
  
  
  
  
  
  let sigQuest = null, questParts = null;

  function buildQuest() {
    const what = document.createElement('span');
    what.className = 'what';
    const bar = document.createElement('span');
    bar.className = 'bar';
    bar.setAttribute('aria-hidden', 'true');
    const fill = document.createElement('i');
    bar.append(fill);
    questEl.replaceChildren(what, bar);
    return { what, fill };
  }

  










  function quest(view) {
    if (!questEl) return;
    const sig = view ? `${view.text}|${view.ready}|${Math.round(view.fraction * 100)}` : '';
    if (sig === sigQuest) return;
    sigQuest = sig;
    if (!view) {
      questEl.hidden = true;
      return;
    }
    if (!questParts) questParts = buildQuest();
    questParts.what.textContent = view.text;
    questParts.fill.style.width = `${Math.round(view.fraction * 100)}%`;
    questEl.classList.toggle('ready', Boolean(view.ready));
    
    
    
    questEl.setAttribute('aria-label', view.ready ? `${view.title} - ready` : `${view.title} - ${view.text}`);
    questEl.hidden = false;
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

  
  
  
  
  
  return { pockets, seeds, today, quest, say, nope, update, setPocketsOpen,
    get pocketsOpen() { return pocketsOpen; },
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
