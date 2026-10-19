




export function showTitle(root, variant, onStart) {
  let pick = variant;
  root.innerHTML = `
    <div class="title-card" role="dialog" aria-label="Space 95">
      <p class="title-k">Space 95 Survey Co. presents</p>
      <h1 class="title-logo">SPACE <span>95</span></h1>
      <p class="title-tag">Two friends. One 9-to-5 job. A planet called Galaxa Z where everything is gigantic.</p>
      <p class="title-q">Choose your explorer</p>
      <div class="title-picks" role="radiogroup" aria-label="Explorer">
        <button type="button" role="radio" data-v="woman"><span class="title-av title-av-woman"></span><strong>Jo</strong><span>woman</span></button>
        <button type="button" role="radio" data-v="man"><span class="title-av title-av-man"></span><strong>Jo</strong><span>man</span></button>
      </div>
      <button type="button" class="title-go" data-act="go">Clock in</button>
      <p class="title-hint">Bolt, your android buddy, is already on shift.</p>
    </div>`;
  root.hidden = false;
  const picks = [...root.querySelectorAll('[data-v]')];
  const sync = () => {
    for (const b of picks) b.setAttribute('aria-checked', String(b.dataset.v === pick));
  };
  sync();
  for (const b of picks) {
    b.addEventListener('click', () => {
      pick =  (b.dataset.v);
      sync();
    });
  }
  const go = () => {
    root.hidden = true;
    window.removeEventListener('keydown', onKey, true);
    onStart(pick);
  };
  const onKey = (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') pick = 'woman';
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') pick = 'man';
    else if (e.code === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      go();
      return;
    } else return;
    e.stopPropagation();
    sync();
  };
  window.addEventListener('keydown', onKey, true);
  root.querySelector('[data-act="go"]')?.addEventListener('click', go);
  root.querySelector('[data-act="go"]')?.focus();
}
