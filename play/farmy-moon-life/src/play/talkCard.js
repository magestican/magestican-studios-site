






















const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);

export function createTalkCard({ el, voice, onChoose, onClose }) {
  const node = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };
  const stack = node('div', 'stack');
  const choicesEl = node('div', 'choices');
  const box = node('div', 'box');
  const plate = node('div', 'plate');
  const text = node('p', 'text');
  const shownEl = node('span', 'shown');
  const restEl = node('span', 'rest');
  const nextEl = node('div', 'next', '▼');
  text.append(shownEl, restEl);
  box.append(plate, text, nextEl);
  stack.append(choicesEl, box);
  el.replaceChildren(stack);

  let open = false, current = null, lineIndex = 0, shownN = -1, choiceSig = '', highlighted = 0, live = null;

  const lines = () => (current ? current.lines : []);
  const onLastLine = () => current && lineIndex >= current.lines.length - 1;
  const choicesShown = () => Boolean(open && live && onLastLine() && live.choices.length);

  function sayLine() {
    const line = lines()[lineIndex] || '';
    voice.say(line, current.voice);
    shownN = -1;
    text.dataset.full = line;
    el.dataset.line = String(lineIndex);
  }

  function drawChoices() {
    const list = choicesShown() ? live.choices : [];
    const sig = JSON.stringify([list.map((c) => [c.key, c.label, Boolean(c.why)]), highlighted]);
    if (sig === choiceSig) return;
    choiceSig = sig;
    if (highlighted >= list.length) highlighted = 0;
    choicesEl.replaceChildren(...list.map((c, i) => {
      const b = node('button', `choice${i === highlighted ? ' on' : ''}${c.why ? ' cannot' : ''}`, c.label);
      b.type = 'button';
      b.dataset.choice = c.key;
      if (c.why) b.title = c.why;
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        pick(c.key);
      });
      return b;
    }));
    el.dataset.choices = String(list.length);
  }

  function pick(key) {
    if (!live) return;
    const c = live.choices.find((x) => x.key === key);
    if (!c) return;
    voice.finish();
    onChoose(c);
  }

  function advance(source = 'key') {
    if (!open || !current) return;
    if (voice.typing) { voice.finish(); return; }
    if (!onLastLine()) { lineIndex += 1; sayLine(); return; }
    if (choicesShown()) {
      if (source === 'key') pick(live.choices[Math.min(highlighted, live.choices.length - 1)].key);
      return;
    }
    if (current.end || !live.choices.length) onClose();
  }

  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    advance('tap');
  });
  window.addEventListener('keydown', (e) => {
    if (!open || e.repeat) return;
    if (e.code === 'Escape') { e.preventDefault(); onClose(); return; }
    if (!choicesShown()) return;
    const n = live.choices.length;
    if (UP.has(e.code)) { highlighted = (highlighted + n - 1) % n; choiceSig = ''; }
    else if (DOWN.has(e.code)) { highlighted = (highlighted + 1) % n; choiceSig = ''; }
  });

  function update(nextNode) {
    if (!open || !nextNode) return;
    live = nextNode;
    if (!current || current.key !== nextNode.key) {
      
      current = { key: nextNode.key, id: nextNode.id, lines: nextNode.lines.slice(), voice: nextNode.voice, end: nextNode.end };
      lineIndex = 0;
      highlighted = 0;
      choiceSig = '';
      plate.textContent = nextNode.speaker;
      el.dataset.node = nextNode.id;
      sayLine();
    }
    voice.update();
    const line = lines()[lineIndex] || '';
    const n = voice.revealed();
    if (n !== shownN) {
      shownN = n;
      shownEl.textContent = line.slice(0, n);
      restEl.textContent = line.slice(n);
    }
    const typing = voice.typing;
    el.dataset.typing = typing ? '1' : '0';
    nextEl.hidden = typing || choicesShown();
    drawChoices();
  }

  return {
    open() {
      if (open) return;
      open = true;
      current = null;
      live = null;
      el.hidden = false;
      document.body.classList.add('talking');
    },
    update,
    advance,
    close() {
      if (!open) return;
      open = false;
      voice.stop();
      current = null;
      live = null;
      choiceSig = '';
      choicesEl.replaceChildren();
      el.hidden = true;
      delete el.dataset.node;
      document.body.classList.remove('talking');
    },
    get isOpen() { return open; },
    get state() {
      return {
        open,
        node: current ? current.id : null,
        key: current ? current.key : null,
        line: lineIndex,
        lines: current ? current.lines.length : 0,
        text: lines()[lineIndex] || '',
        shown: shownN < 0 ? 0 : shownN,
        typing: voice.typing,
        choices: choicesShown() ? live.choices.map((c) => ({ key: c.key, label: c.label, why: c.why || null })) : [],
        highlighted,
      };
    },
  };
}
