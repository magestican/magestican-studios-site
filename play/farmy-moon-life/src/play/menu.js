
































export function createMenu({ el, button, onOpen = () => {}, onTouch = () => {} }) {
  let open = false, live = false;
  const stats = { opens: 0, picks: 0 };

  
  
  
  el.addEventListener('pointerdown', (e) => e.stopPropagation());
  el.addEventListener('pointerup', (e) => e.stopPropagation());

  el.addEventListener('pointerdown', (e) => {
    const pressed = e.target && e.target.closest ? e.target.closest('button') : null;
    if (!pressed) return;
    stats.picks += 1;
    hide();
  }, true);

  function show() {
    if (open) return;
    open = true;
    stats.opens += 1;
    el.hidden = false;
    el.dataset.open = '1';
    button.classList.add('on');
    onOpen();
  }

  function hide() {
    if (!open) return;
    open = false;
    el.hidden = true;
    delete el.dataset.open;
    button.classList.remove('on');
  }

  button.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    onTouch();
    if (open) hide(); else show();
  });

  return {
    show,
    hide,
    toggle() { if (open) hide(); else show(); },
    get isOpen() { return open; },
    
    setLive(on) {
      const next = Boolean(on);
      if (next === live) return;
      live = next;
      button.classList.toggle('live', live);
    },
    get live() { return live; },
    stats,
  };
}
