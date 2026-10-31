














export function castKind(ua, touchPoints) {
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && touchPoints > 1)) return 'apple';
  if (/Android/.test(ua)) return 'android';
  if (/Chrome\/|Chromium\/|Edg\//.test(ua)) return 'chrome';
  if (/Macintosh/.test(ua)) return 'apple';
  return 'other';
}


export function castSteps(kind, api = false) {
  const how = api
    ? 'Tap Pick your TV and choose your TV.'
    : {
        apple: 'Open Control Center, choose Screen Mirroring and pick your TV.',
        android: 'Swipe down, tap Screen cast or Smart View, pick your TV.',
        chrome: 'Open the browser menu, choose Cast and pick your TV.',
        other: 'Mirror this screen to your TV.',
      }[kind];
  const sideways =
    kind === 'chrome' ? 'Stand back so the camera sees you.' : 'Turn the phone sideways and stand back so the camera sees you.';
  
  
  const receiver = !api && kind === 'apple' ? ['Get the free AirScreen app if your TV is not listed.'] : [];
  return [how, ...receiver, sideways, 'The camera stays on this device', 'The TV only shows this screen'];
}


export function castFrame(frame, fw, fh) {
  if (!frame?.pose || !frame.width || !frame.height) return null;
  const s = Math.max(fw / frame.width, fh / frame.height);
  const pose = {};
  for (const [k, j] of Object.entries(frame.pose))
    if (j) pose[k] = { ...j, x: (j.x - frame.width / 2) * s + fw / 2, y: (j.y - frame.height / 2) * s + fh / 2 };
  return { pose, width: fw, height: fh, t: frame.t ?? 0 };
}


export function castMessage(state) {
  const slim = (fr) => {
    if (!fr) return null;
    const pose = {};
    for (const [k, j] of Object.entries(fr.pose))
      if (j) pose[k] = { x: Math.round(j.x * 10) / 10, y: Math.round(j.y * 10) / 10, score: Math.round((j.score ?? 1) * 100) / 100 };
    return { pose, width: fr.width, height: fr.height };
  };
  return JSON.stringify({ f: slim(state.frame), f2: slim(state.frame2), c: state.costume, c2: state.costume2, p: state.players });
}


export function castSender(win = window) {
  const supported = typeof win.PresentationRequest === 'function' && !!win.navigator.presentation;
  
  let conn = null;
  let sentAt = 0;
  if (!supported) return { supported, start: async () => {}, send: (_s) => {}, live: () => false };
  const url = new URL(win.location.href);
  url.search = '?receiver=1&tv=1';
  const request = new win.PresentationRequest([url.href]);
  const take = (c) => {
    conn = c;
    const drop = () => {
      if (conn === c) conn = null;
    };
    c.addEventListener('terminate', drop);
    c.addEventListener('close', drop);
  };
  request.addEventListener('connectionavailable', (e) => take( (e).connection));
  
  try {
    win.navigator.presentation.defaultRequest = request;
  } catch {}
  return {
    supported,
    start: async () => take(await request.start()),
    live: () => conn?.state === 'connected',
    send: (state) => {
      const now = win.performance.now();
      if (conn?.state !== 'connected' || now - sentAt < 66) return;
      sentAt = now;
      conn.send(castMessage(state));
    },
  };
}


export function castReceiver(onMessage, win = window) {
  const receiver =  (win.navigator).presentation?.receiver;
  if (!receiver) return false;
  const add = (c) =>
    c.addEventListener('message', (e) => {
      try {
        onMessage(JSON.parse(e.data));
      } catch {}
    });
  receiver.connectionList.then((list) => {
    for (const c of list.connections) add(c);
    list.addEventListener('connectionavailable', (e) => add(e.connection));
  });
  return true;
}






export function initCast(ui) {
  const set = ( on) => {
    document.body.classList.toggle('tv', on);
    ui.layout.textContent = on ? 'Make it small' : 'Make it big';
    ui.layout.setAttribute('aria-pressed', String(on));
    ui.changed();
  };
  set(ui.on);
  ui.pick.hidden = !ui.sender.supported;
  ui.steps.replaceChildren(
    ...castSteps(castKind(navigator.userAgent, navigator.maxTouchPoints || 0), ui.sender.supported).map((s) => {
      const li = document.createElement('li');
      li.textContent = s;
      return li;
    }),
  );
  for (const b of ui.buttons) b.addEventListener('click', () => ui.dialog.showModal());
  ui.layout.addEventListener('click', () => set(!document.body.classList.contains('tv')));
  ui.close.addEventListener('click', () => ui.dialog.close());
  ui.pick.addEventListener('click', async () => {
    try {
      await ui.sender.start();
      ui.dialog.close();
      ui.flash('Now on your TV!');
    } catch (e) {
      
      if ( (e)?.name === 'NotFoundError') ui.flash('No TV found. Try the steps.');
    }
  });
}
