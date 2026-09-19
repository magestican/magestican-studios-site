



























const BUSES = Object.freeze([
  ['music', 'Music'],
  ['sfx', 'Effects'],
  ['ambience', 'Ambience'],
  ['voice', 'Voices'],
]);

export function createSoundCard({ el, button, audio, onMute = () => {}, onTouch = () => {} }) {
  const node = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };
  const sliders = new Map();
  let open = false, muteButton = null, whyLine = null;
  const stats = { open: false, moves: 0 };

  
  
  el.addEventListener('pointerdown', (e) => e.stopPropagation());

  function tapButton(cls, act, text, fn) {
    const b = node('button', cls, text);
    b.type = 'button';
    if (act) b.dataset.act = act;
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); fn(); });
    return b;
  }

  function build() {
    const head = node('div', 'head');
    head.append(node('b', '', 'Sound'), tapButton('close', 'close', 'x', hide));

    const rows = BUSES.map(([bus, label]) => {
      const row = node('label', 'row');
      row.dataset.bus = bus;
      const range = document.createElement('input');
      range.type = 'range';
      range.min = '0';
      range.max = '100';
      range.step = '5';
      range.setAttribute('aria-label', label);
      range.addEventListener('input', () => {
        stats.moves += 1;
        audio.setLevel(bus, Number(range.value) / 100);
        onTouch(bus);
      });
      range.addEventListener('pointerdown', (e) => e.stopPropagation());
      sliders.set(bus, range);
      row.append(node('span', 'name', label), range);
      return row;
    });

    muteButton = tapButton('mute', 'mute', 'Sound on', () => { onMute(); paint(); });
    whyLine = node('p', 'why');
    whyLine.dataset.why = '';
    el.replaceChildren(head, ...rows, muteButton, whyLine);
  }

  
  function paint() {
    const levels = audio.levels;
    for (const [bus, range] of sliders) range.value = String(Math.round((levels[bus] ?? 0) * 100));
    if (muteButton) {
      muteButton.classList.toggle('off', audio.muted);
      muteButton.textContent = audio.muted ? 'Sound off' : 'Sound on';
    }
    
    
    if (whyLine) {
      const why = audio.silence || { silent: false, reason: null, line: '' };
      whyLine.textContent = why.line || '';
      whyLine.dataset.why = why.silent ? String(why.reason || 'muted') : 'ok';
      whyLine.hidden = !why.line;
    }
  }

  function show() {
    if (!sliders.size) build();
    open = true;
    stats.open = true;
    el.hidden = false;
    el.dataset.open = '1';
    if (button) button.classList.add('open');
    paint();
  }

  function hide() {
    open = false;
    stats.open = false;
    el.hidden = true;
    delete el.dataset.open;
    if (button) button.classList.remove('open');
  }

  return {
    show,
    hide,
    paint,
    toggle() { if (open) hide(); else show(); },
    get isOpen() { return open; },
    stats,
  };
}
