












import { CHARACTERS } from 'arbelo/kartTuning';
import { LOBBY_PHASE, FIELD_SIZES, LAP_OPTIONS, botCount, canStart } from 'arbelo/kartLobby';
import { hex } from '../palette.js';

const $ = (id) => document.getElementById(id);











export function createLobbyUi({ tracks, difficulties, onClaim, onReady, onSettings, onStart, onLeave }) {
  buildChips($('lobby-track-row'), tracks.map((t) => ({ id: t.id, label: t.name })), (id) => onSettings({ trackId: id }));
  buildChips($('lobby-diff-row'), difficulties.map((d) => ({ id: d.id, label: d.label })), (id) => onSettings({ difficulty: id }));
  buildChips($('lobby-lap-row'), LAP_OPTIONS.map((n) => ({ id: String(n), label: `${n} laps` })), (id) => onSettings({ laps: Number(id) }));
  buildChips($('lobby-field-row'), FIELD_SIZES.map((n) => ({ id: String(n), label: `${n} karts` })), (id) => onSettings({ fieldSize: Number(id) }));

  const chars = $('lobby-chars');
  chars.innerHTML = '';
  for (const c of CHARACTERS) {
    const el = document.createElement('button');
    el.className = 'char-card';
    el.dataset.id = c.id;
    el.innerHTML = `
      <span class="char-swatch" style="background:${hex(c.tint)}"></span>
      <span class="char-name">${c.name}</span>
      <span class="char-species">${c.species}</span>
      <span class="char-holder"></span>`;
    el.addEventListener('click', () => onClaim(c.id));
    chars.appendChild(el);
  }

  $('lobby-start').addEventListener('click', () => onStart());
  $('lobby-ready').addEventListener('click', (e) => onReady(e.currentTarget.dataset.next === '1'));
  $('lobby-leave').addEventListener('click', () => onLeave());

  $('lobby-copy').addEventListener('click', async () => {
    const link = $('lobby-link');
    try {
      await navigator.clipboard.writeText(link.value);
      $('lobby-copy').textContent = 'Copied';
    } catch {
      
      
      link.focus();
      link.select();
      $('lobby-copy').textContent = 'Ctrl+C';
    }
    setTimeout(() => { $('lobby-copy').textContent = 'Copy'; }, 1800);
  });

  return {
    



    render(lobby, view) {
      const me = lobby.players.find((p) => p.peerId === view.myId) ?? null;
      const byCharacter = new Map(lobby.players.map((p) => [p.characterId, p]));

      $('lobby-link').value = view.shareLink ?? '';
      $('lobby-share').style.display = view.isHost ? '' : 'none';
      $('lobby-heading').textContent = view.isHost ? 'your room' : 'joining';

      
      for (const el of chars.children) {
        const holder = byCharacter.get(el.dataset.id) ?? null;
        const isMine = holder && holder.peerId === view.myId;
        el.classList.toggle('on', !!isMine);
        el.classList.toggle('taken', !!holder && !isMine);
        el.querySelector('.char-holder').textContent = holder
          ? (isMine ? 'you' : holder.name)
          : '';
        
        
        el.setAttribute('aria-pressed', String(!!isMine));
      }

      
      const bots = botCount(lobby);
      $('lobby-players').innerHTML = lobby.players.map((p) => {
        const c = CHARACTERS.find((x) => x.id === p.characterId);
        return `<li class="player${p.peerId === view.myId ? ' me' : ''}">
          <span class="dot" style="background:${c ? hex(c.tint) : '#666'}"></span>
          <b>${escapeHtml(p.name)}</b>
          <span class="tag">${p.peerId === lobby.hostId ? 'host' : (p.ready ? 'ready' : 'waiting')}</span>
        </li>`;
      }).join('')
        + (bots > 0
          ? `<li class="player bots"><span class="dot" style="background:#4a463f"></span>
               <b>${bots} bot${bots === 1 ? '' : 's'}</b>
               <span class="tag">filling the grid</span></li>`
          : '');

      
      $('lobby-host-only').style.display = view.isHost ? '' : 'none';
      mark($('lobby-track-row'), lobby.settings.trackId);
      mark($('lobby-diff-row'), lobby.settings.difficulty);
      mark($('lobby-lap-row'), String(lobby.settings.laps));
      mark($('lobby-field-row'), String(lobby.settings.fieldSize));

      
      const gate = canStart(lobby);
      $('lobby-start').style.display = view.isHost ? '' : 'none';
      $('lobby-start').disabled = !gate.ok;
      $('lobby-start').textContent = gate.ok
        ? 'Race'
        : (gate.reason === 'not-ready' ? 'Waiting for everyone' : 'Race');

      const ready = $('lobby-ready');
      ready.style.display = view.isHost ? 'none' : '';
      ready.dataset.next = me?.ready ? '0' : '1';
      ready.textContent = me?.ready ? "I'm not ready" : "I'm ready";
      ready.classList.toggle('alt', !me?.ready);

      $('lobby-status').textContent = view.note ?? statusFor(lobby, view);
    },
  };
}

function statusFor(lobby, view) {
  if (lobby.phase === LOBBY_PHASE.RACING) return 'The race has started.';
  if (view.isHost) {
    const waiting = lobby.players.filter((p) => !p.ready).map((p) => p.name);
    if (waiting.length) return `Waiting for ${waiting.join(', ')}.`;
    return lobby.players.length > 1
      ? 'Everyone is ready.'
      : 'Nobody has joined yet. You can race the bots now, or send the link and wait.';
  }
  return 'Pick a driver, then say you are ready. The host starts the race.';
}

function buildChips(root, options, onPick) {
  root.innerHTML = '';
  for (const o of options) {
    const el = document.createElement('button');
    el.className = 'chip';
    el.dataset.id = o.id;
    el.textContent = o.label;
    el.addEventListener('click', () => onPick(o.id));
    root.appendChild(el);
  }
}

const mark = (root, id) => {
  for (const el of root.children) el.classList.toggle('on', el.dataset.id === String(id));
};



const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));
