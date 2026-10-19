



export function createPause(root, { onResume, onRestartBeacon, onRestartShift, onVariant, onSound, getState }) {
  root.hidden = true;
  const render = () => {
    const st = getState();
    root.innerHTML = `
      <div class="sheet pause-card" role="dialog" aria-label="Paused">
        <p class="sheet-k">Space 95 Survey Co. - Break room</p>
        <h2>Paused</h2>
        <div class="pause-actions">
          <button type="button" data-act="resume" class="is-primary">Back to work</button>
          <button type="button" data-act="beacon">Restart from beacon</button>
          <button type="button" data-act="shift">Restart shift</button>
          <button type="button" data-act="variant">Explorer: Jo (${st.variant})</button>
          <button type="button" data-act="sound">Sound: ${st.muted ? 'off' : 'on'}</button>
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
