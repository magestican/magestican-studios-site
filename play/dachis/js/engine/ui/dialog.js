


const $ = id => document.getElementById(id);



export function createDialog({ paintPortrait, paintChoiceIcon, onBlip = () => {}, format = s => s, kindOf = () => 'say', textOf = l => l.text, onAdvance = () => {}, onType = () => {} }) {
  const D = {
    queue: [], cur: null, shown: 0, onDone: null, active: false, choosing: false,
    say(lines, onDone) {
      D.queue = lines.slice(); D.onDone = onDone || null; D.active = true;
      $('dialog').classList.remove('hidden');
      D.next();
    },
    
    insert(lines) { D.queue.unshift(...lines); },
    clear() { D.queue = []; D.onDone = null; D.hide(); },
    hide() { D.active = false; D.cur = null; $('dialog').classList.add('hidden'); $('choices').innerHTML = ''; D.choosing = false; },
    advance() {
      if (!D.active || D.choosing) return;
      onAdvance();
      
      
      if (D.cur && D.shown < D.cur.text.length) { D.shown = D.cur.text.length; $('dlgText').textContent = D.cur.text; return; }
      D.next();
    },
    next() {
      if (!D.queue.length) { const f = D.onDone; D.onDone = null; D.hide(); if (f) f(); return; }
      const l = D.queue.shift();
      D.cur = Object.assign({}, l, { text: format(textOf(l)), kind: kindOf(l) });
      D.shown = 0;
      $('dialog').dataset.kind = D.cur.kind;
      $('dlgName').textContent = D.cur.who || '';
      $('dlgName').style.display = D.cur.who ? '' : 'none';
      const pc = $('dlgPortrait');
      if (D.cur.portrait !== undefined) { pc.style.display = ''; paintPortrait(pc, D.cur.portrait); } else pc.style.display = 'none';
      $('dlgText').textContent = '';
      $('choices').innerHTML = ''; D.choosing = false;
      if (l.onShow) l.onShow();
      if (l.choices) {
        D.choosing = true; D.shown = D.cur.text.length; $('dlgText').textContent = D.cur.text;
        l.choices.forEach((c, i) => {
          const b = document.createElement('button'); b.className = 'choice tappable'; b.dataset.key = String(i + 1);
          if (c.sprite !== undefined) { const cv = document.createElement('canvas'); cv.width = cv.height = 64; paintChoiceIcon(cv, c.sprite); b.appendChild(cv); }
          const s = document.createElement('span'); s.innerHTML = c.html || c.label; b.appendChild(s);
          b.onclick = () => D.choose(i);
          $('choices').appendChild(b);
        });
        D.choices = l.choices;
      }
      onBlip();
    },
    choose(i) {
      if (!D.choosing || !D.choices[i]) return;
      D.choosing = false; $('choices').innerHTML = '';
      D.choices[i].fn();
    },
    update(dt) {
      if (!D.active || !D.cur) return;
      $('dlgNext').classList.toggle('hidden', D.choosing || D.shown < D.cur.text.length);
      $('dialog').classList.toggle('typing', D.shown < D.cur.text.length);
      if (D.shown >= D.cur.text.length) return;
      const was = Math.floor(D.shown / 4);
      D.shown = Math.min(D.cur.text.length, D.shown + dt * 55);
      if (Math.floor(D.shown / 4) !== was) onType(D.cur); 
      $('dlgText').textContent = D.cur.text.slice(0, Math.floor(D.shown));
    },
  };
  return D;
}

export function toast(text, ms = 2200) {
  const el = document.createElement('div'); el.className = 'toast'; el.textContent = text;
  $('toasts').appendChild(el); setTimeout(() => el.remove(), ms);
}
