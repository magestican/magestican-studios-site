




export function lobbyWords(role, state) {
  if (role === 'host')
    return state === 'joined'
      ? { status: 'Bolt is here. Clock in together!', go: 'Start shift' }
      : state === 'error'
        ? { status: 'The room could not open. Check your connection, then try again.', go: 'Play alone' }
        : { status: 'Waiting for your friend to join...', go: 'Start shift' };
  return state === 'error'
    ? { status: 'No room with that code is open. Ask your friend for the code again.', go: 'Back to title' }
    : { status: 'Joining the room...', go: null };
}






export function showLobby(root, { role, code, link, onGo, onNewCode }) {
  root.innerHTML = `
    <div class="title-card coop-card" role="dialog" aria-label="Co-op room">
      <p class="title-k">Space 95 Survey Co. - two-person shift</p>
      <h2 class="coop-h">${role === 'host' ? 'You are Jo' : 'You are Bolt'}</h2>
      <p class="coop-code" aria-label="Room code">s95-<strong>${code}</strong></p>
      ${
        role === 'host'
          ? `<p class="coop-tip">Send your friend this link, or read them the code.</p>
      <span class="title-coop-row"><input class="coop-link" readonly value="${link}" aria-label="Share link" />
      <button type="button" data-act="copy">Copy</button></span>
      <button type="button" class="coop-new" data-act="newcode">New code</button>`
          : ''
      }
      <p class="coop-status" role="status"></p>
      <button type="button" class="title-go" data-act="go" hidden></button>
    </div>`;
  root.hidden = false;
  const status =  (root.querySelector('.coop-status'));
  const go =  (root.querySelector('[data-act="go"]'));
  go.addEventListener('click', onGo);
  root.querySelector('[data-act="copy"]')?.addEventListener('click', (e) => {
    navigator.clipboard?.writeText(link).catch(() => {});
     (e.currentTarget).textContent = 'Copied';
  });
  root.querySelector('[data-act="newcode"]')?.addEventListener('click', () => onNewCode?.());
  const set = (state) => {
    const w = lobbyWords(role, state);
    status.textContent = w.status;
    go.hidden = !w.go;
    go.textContent = w.go ?? '';
  };
  set('waiting');
  return {
    set,
    close() {
      root.hidden = true;
    },
  };
}
