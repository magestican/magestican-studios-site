



























import { HERD } from '../../../web-engine/rts/roster.js';
import { MAPS, PLAYABLE_MAP_IDS } from '../../../web-engine/rts/maps/index.js';
import { whoIsIn } from '../../../web-engine/net/presence.js';

const $ = (id) => document.getElementById(id);


export function spoken(code) {
  const s = String(code ?? '');
  return s.length > 6 ? s.slice(-6) : s;
}













export function createLobbyPanel(actions) {
  const el = {
    root: $('lobby'),
    status: $('lob-status'),
    room: $('lob-room'),
    code: $('lob-code'),
    copy: $('lob-copy'),
    forces: $('lob-forces'),
    rows: $('lob-rows'),
    sides: $('lob-sides'),
    ready: $('lob-ready'),
    start: $('lob-start'),
    open: $('lob-open'),
    list: $('lob-list'),
    input: $('lob-input'),
    join: $('lob-join'),
    host: $('lob-host'),
    map: $('lob-map'),
    leave: $('lob-leave'),
    back: $('lob-back'),
  };

  let last = null;
  let pollTimer = null;

  for (const id of PLAYABLE_MAP_IDS) {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = MAPS[id].name;
    el.map.appendChild(opt);
  }

  
  
  
  
  
  
  
  const POLL_MS = 13000;

  async function refreshRooms() {
    let rooms = [];
    try { rooms = await actions.listRooms(); } catch { rooms = []; }
    el.list.innerHTML = '';
    if (!rooms.length) {
      const li = document.createElement('li');
      li.className = 'lob-empty';
      
      
      
      li.textContent = 'Nobody is hosting right now. Open a room and share the code.';
      el.list.appendChild(li);
      return;
    }
    for (const r of rooms) {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'lob-open-row';
      
      
      
      b.innerHTML = `<b>${spoken(r.code)}</b><span>${whoIsIn(r)}</span>`;
      b.addEventListener('click', () => actions.onJoin(r.code));
      li.appendChild(b);
      el.list.appendChild(li);
    }
  }

  

  el.host.addEventListener('click', () => actions.onHost(el.map.value));
  el.join.addEventListener('click', () => actions.onJoin(el.input.value));
  el.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') actions.onJoin(el.input.value);
  });
  el.sides.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-faction]');
    if (b) actions.onFaction(b.dataset.faction);
  });
  el.ready.addEventListener('click', () => {
    const me = last && last.rows.find((r) => r.isMe);
    actions.onReady(!(me && me.ready));
  });
  el.start.addEventListener('click', () => actions.onStart());
  el.leave.addEventListener('click', () => actions.onLeave());
  el.back.addEventListener('click', () => actions.onBack());
  el.map.addEventListener('change', () => actions.onMap(el.map.value));

  el.copy.addEventListener('click', async () => {
    const url = new URL(location.href);
    url.searchParams.set('join', last?.code ?? '');
    url.hash = '';
    try {
      await navigator.clipboard.writeText(url.toString());
      el.copy.textContent = 'COPIED';
    } catch {
      
      
      
      
      el.copy.textContent = 'READ THE CODE OUT';
    }
    setTimeout(() => { el.copy.textContent = 'COPY LINK'; }, 2200);
  });

  return {
    
    open() {
      el.root.classList.add('show');
      refreshRooms();
      if (!pollTimer) pollTimer = setInterval(refreshRooms, POLL_MS);
    },

    
    close() {
      el.root.classList.remove('show');
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    },

    get isOpen() { return el.root.classList.contains('show'); },

    say(text) { el.status.textContent = text; },

    




    room(v) {
      last = v;
      const inRoom = !!v;
      el.room.hidden = !inRoom;
      el.forces.hidden = !inRoom;
      
      
      el.open.hidden = inRoom && v.rows.length > 1;
      if (!inRoom) return;

      el.code.textContent = spoken(v.code);
      el.status.textContent = v.status;
      el.map.value = v.mapId;

      const me = v.rows.find((r) => r.isMe);
      
      
      
      
      el.map.disabled = !(me && me.isHost);
      el.start.hidden = !(me && me.isHost);
      el.start.disabled = !v.canStart;
      el.ready.hidden = !!(me && me.observer);
      el.ready.classList.toggle('on', !!(me && me.ready));
      el.ready.textContent = me && me.ready ? 'READY' : 'NOT READY';
      for (const b of el.sides.querySelectorAll('button[data-faction]')) {
        b.classList.toggle('on', !!me && me.faction === b.dataset.faction);
        b.disabled = !!(me && me.observer);
      }

      el.rows.innerHTML = '';
      for (const r of v.rows) {
        const line = document.createElement('div');
        line.className = 'lob-row';
        if (r.faction) line.classList.add(r.faction === HERD ? 'herd' : 'yield');
        if (r.ready) line.classList.add('ready');
        const who = r.observer ? 'WATCHING' : (r.faction === HERD ? 'WAKING HERD' : 'YIELD GROUP');
        line.innerHTML = `<i></i><b>${r.name}${r.isMe ? ' (you)' : ''}</b>`
          + `<span>${who}</span>`
          + `<em>${r.observer ? '' : (r.ready ? 'READY' : 'WAITING')}</em>`;
        el.rows.appendChild(line);
      }
    },
  };
}
