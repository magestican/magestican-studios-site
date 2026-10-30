


const el = (tag, cls, parent, text = '') => {
  const n = document.createElement(tag);
  n.className = cls;
  if (text) n.textContent = text;
  parent.appendChild(n);
  return n;
};


export function createLobby(root) {
  const box = el('div', 'lobby', root);
  el('h1', 'lobby-title', box, 'Play with friends');
  const form = el('div', 'lobby-form', box);
  const nameIn =  (el('input', 'lobby-input', form));
  Object.assign(nameIn, { placeholder: 'Your name', maxLength: 12, autocomplete: 'nickname', name: 'name' });
  const make = el('button', 'lobby-btn', form, 'Make room');
  const or = el('div', 'lobby-or', form, 'or join a room');
  const codeIn =  (el('input', 'lobby-input lobby-code-in', form));
  Object.assign(codeIn, { placeholder: 'CODE', maxLength: 5, autocapitalize: 'characters', name: 'code' });
  const join = el('button', 'lobby-btn', form, 'Join');
  or.setAttribute('role', 'separator');

  const inRoom = el('div', 'lobby-room', box);
  inRoom.hidden = true;
  el('div', 'lobby-label', inRoom, 'Room code');
  const codeOut = el('div', 'lobby-code', inRoom);
  const list = el('ul', 'lobby-players', inRoom);
  const start = el('button', 'lobby-btn', inRoom, 'Start');
  const wait = el('div', 'lobby-wait', inRoom, 'Waiting for the host to start');

  const msg = el('div', 'lobby-msg', box);
  el('p', 'lobby-privacy', box, 'Only your name, score and hits are sent. The camera picture never leaves this phone.');

  const on = (b, fn) => b.addEventListener('click', () => fn());
  return {
    setCode: (c) => {
      codeIn.value = c;
    },
    onMake: (fn) => on(make, fn),
    onJoin: (fn) => on(join, fn),
    onStart: (fn) =>
      on(start, () => {
         (start).disabled = true;
        fn();
      }),
    name: () => nameIn.value,
    code: () => codeIn.value,
    busy: (b) => {
      for (const x of [make, join])  (x).disabled = b;
    },
    error: (t) => {
      msg.textContent = t;
    },
    showRoom: ({ code, names, host }) => {
      form.hidden = true;
      inRoom.hidden = false;
      msg.textContent = '';
      codeOut.textContent = code;
      list.replaceChildren(...names.map((n) => Object.assign(document.createElement('li'), { textContent: n })));
      start.hidden = !host;
      wait.hidden = host;
    },
    status: (t) => {
      form.hidden = true;
      inRoom.hidden = true;
      msg.textContent = t;
    },
    hide: () => box.remove(),
  };
}
