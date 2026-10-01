














export function createGestureWheel({ parent = document.body, onPick = () => {} } = {}) {
  const el = document.createElement('div');
  el.id = 'gestures';
  el.hidden = true;
  el.setAttribute('role', 'menu');
  parent.appendChild(el);
  let open = false;

  function close() {
    open = false;
    el.hidden = true;
    el.replaceChildren();
  }

  function show(items) {
    el.replaceChildren(...items.map((it, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'gesture';
      b.dataset.gesture = it.id;
      b.setAttribute('role', 'menuitem');
      b.textContent = it.label;
      
      const a = (Math.PI / 2) * (items.length === 1 ? 0.5 : i / (items.length - 1));
      b.style.setProperty('--gx', `${(-Math.cos(a) * 118).toFixed(1)}px`);
      b.style.setProperty('--gy', `${(-Math.sin(a) * 118).toFixed(1)}px`);
      b.addEventListener('click', (e) => { e.stopPropagation(); close(); onPick(it.id); });
      return b;
    }));
    open = true;
    el.hidden = false;
  }

  return {
    toggle(items) { if (open) close(); else show(items); },
    close,
    get isOpen() { return open; },
  };
}
