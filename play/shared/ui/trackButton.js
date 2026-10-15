










const pick = (name, lang) => {
  if (typeof name === 'string') return name;
  const base = String(lang || '').toLowerCase().split('-')[0];
  return name?.[base] ?? name?.default ?? '';
};








export function wireTrackButton({ music, names, lang = globalThis.document?.documentElement?.lang ?? 'en' } = {}) {
  const doc = globalThis.document;
  const musicBtn = doc?.getElementById('music-btn');
  if (!musicBtn || !music?.setTrack || !names) return null;
  
  try { if (globalThis.self !== globalThis.top) return null; } catch {  }

  const btn = doc.createElement('button');
  btn.type = 'button';
  btn.id = 'track-btn';
  btn.className = 'studio-track';
  const show = () => {
    const cur = music.track();
    const other = cur === 'main' ? 'local' : 'main';
    const here = pick(names[cur], lang);
    const next = pick(names[other], lang);
    btn.textContent = `♪ ${here}`;
    btn.dataset.track = cur;
    btn.title = `${here} ⇄ ${next}`;
    btn.setAttribute('aria-label', `${here} ⇄ ${next}`);
  };
  btn.addEventListener('click', () => {
    music.nextTrack();
    show();
    if (!music.isOn()) musicBtn.click();
  });
  musicBtn.insertAdjacentElement('afterend', btn);
  show();
  return btn;
}
