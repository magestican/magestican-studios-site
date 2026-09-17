














import { TREES } from 'moon/economy/tables.mjs';
import { REFUSAL_S, actLabel, actRefused } from 'moon/play/actButton.mjs';

export function createHud({ prompt: promptEl, pockets: pocketsEl, seeds: seedsEl, button, iconFor, onChooseSeed }) {
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
  let sigPockets = null, sigPrompt = null, sigSeeds = null, sigButton = null, lastHold = -1, flash = null;
  
  
  
  
  
  
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
    
    
    
    
    const word = actLabel(p);
    const cannot = actRefused(p);
    const bsig = `${word}|${cannot}`;
    if (bsig !== sigButton) {
      sigButton = bsig;
      button.textContent = word;
      button.classList.toggle('cannot', cannot);
      button.setAttribute('aria-label', word);
    }
    const hp = Math.round(holdProgress * 50) / 50;
    if (hp !== lastHold) {
      lastHold = hp;
      button.style.setProperty('--hold', String(hp));
    }
  }

  return { pockets, seeds, say, nope, update, get said() { return said; } };
}
