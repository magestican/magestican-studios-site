



const NIGHT_STEPS = [100, 130, 160];
const nightPct = () => {
  try {
    const v = Number.parseFloat(localStorage.getItem('space95.night') ?? '1');
    const pct = Math.round((v > 3 ? v / 100 : v) * 100);
    return NIGHT_STEPS.includes(pct) ? pct : 100;
  } catch {
    return 100;
  }
};


export function pauseRows(st, night) {
  const rows = [
    { act: 'resume', label: 'Back to work', primary: true },
    { act: 'beacon', label: 'Restart from beacon' },
    { act: 'shift', label: 'Restart shift' },
    { act: 'variant', label: `Explorer: Jo (${st.variant})` },
    { act: 'sound', label: `Sound: ${st.muted ? 'off' : 'on'}` },
  ];
  if (st.dark) rows.push({ act: 'night', label: `Night brightness: ${night} %` });
  return rows;
}


export function createPause(root, { onResume, onRestartBeacon, onRestartShift, onVariant, onSound, getState }) {
  root.hidden = true;
  const render = () => {
    const st = getState();
    root.innerHTML = `
      <div class="sheet pause-card" role="dialog" aria-label="Paused">
        <div class="s95-clip" aria-hidden="true"></div>
        <p class="sheet-k">Space 95 Survey Co. - Break room</p>
        <h2>Paused</h2>
        <div class="pause-actions">
          ${pauseRows(st, nightPct())
            .map((r) => `<button type="button" data-act="${r.act}"${r.primary ? ' class="is-primary"' : ''}>${r.label}</button>`)
            .join('\n          ')}
        </div>
      </div>`;
    const on = (act, fn) => root.querySelector(`[data-act="${act}"]`)?.addEventListener('click', fn);
    on('resume', () => api.close());
    on('beacon', () => {
      api.close();
      onRestartBeacon();
    });
    on('shift', () => {
      api.close();
      onRestartShift();
    });
    on('variant', () => {
      onVariant(st.variant === 'woman' ? 'man' : 'woman');
      render();
    });
    on('sound', () => {
      onSound();
      render();
    });
    on('night', () => {
      const next = NIGHT_STEPS[(NIGHT_STEPS.indexOf(nightPct()) + 1) % NIGHT_STEPS.length];
      try {
        localStorage.setItem('space95.night', String(next / 100));
      } catch {
        
      }
      render();
    });
    root.querySelector('[data-act="resume"]')?.focus();
  };
  const api = {
    get open() {
      return !root.hidden;
    },
    show() {
      render();
      root.hidden = false;
    },
    close() {
      root.hidden = true;
      onResume();
    },
    toggle() {
      if (root.hidden) api.show();
      else api.close();
    },
  };
  return api;
}
