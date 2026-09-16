




















const PREV = new Set(['ArrowLeft', 'KeyA', 'ArrowUp', 'KeyW']);
const NEXT = new Set(['ArrowRight', 'KeyD', 'ArrowDown', 'KeyS']);
const GO = new Set(['KeyE', 'Space', 'Enter', 'NumpadEnter']);

export function createPlayerChoice({ el, builds, names, onChoose }) {
  const node = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };
  const sheet = node('div', 'sheet');
  const title = node('h1', 'title', 'Who will you be?');
  const tiles = node('div', 'tiles');
  const play = node('button', 'play');
  play.type = 'button';
  const sub = node('p', 'sub', 'You can change this any time.');
  const tileOf = new Map();
  for (const build of builds) {
    const b = node('button', 'tile');
    b.type = 'button';
    b.dataset.build = build;
    b.setAttribute('aria-label', names[build]);
    const pic = node('div', 'pic');
    b.append(pic, node('span', 'name', names[build]));
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); select(build); });
    tiles.append(b);
    tileOf.set(build, { b, pic });
  }
  play.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); go(); });
  sheet.append(title, tiles, play, sub);
  el.replaceChildren(sheet);
  
  el.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); });

  let open = false, selected = builds[0];
  const previews = new Set();

  function select(build) {
    if (!tileOf.has(build)) return;
    selected = build;
    el.dataset.selected = build;
    for (const [k, { b }] of tileOf) {
      b.classList.toggle('on', k === build);
      b.setAttribute('aria-pressed', String(k === build));
    }
    play.textContent = `Play as ${names[build]}`;
  }
  function go() {
    if (!open) return;
    hide();
    onChoose(selected);
  }
  function show(build = selected) {
    open = true;
    select(build);
    el.hidden = false;
    document.body.classList.add('choosing');
  }
  function hide() {
    open = false;
    el.hidden = true;
    document.body.classList.remove('choosing');
  }

  window.addEventListener('keydown', (e) => {
    if (!open || e.repeat) return;
    const i = builds.indexOf(selected);
    if (PREV.has(e.code)) { e.preventDefault(); select(builds[(i + builds.length - 1) % builds.length]); }
    else if (NEXT.has(e.code)) { e.preventDefault(); select(builds[(i + 1) % builds.length]); }
    else if (GO.has(e.code)) { e.preventDefault(); go(); }
  });

  select(selected);
  return {
    show,
    hide,
    preview(build, canvas) {
      const t = tileOf.get(build);
      if (!t || !canvas) return;
      canvas.className = 'portrait';
      t.pic.replaceChildren(canvas);
      previews.add(build);
    },
    get isOpen() { return open; },
    get state() { return { open, selected, previews: [...previews] }; },
  };
}
