


























import { CHARACTERS, characterById } from 'arbelo/kartTuning';
import { LOBBY_PHASE, FIELD_SIZES, LAP_OPTIONS, botCount, canStart } from 'arbelo/kartLobby';
import { hex } from '../palette.js';
import { createShowcaseView, freshCanvas } from '../render/showcase.js';
import { pageContexts } from '../../../../web-engine/render/contextBudget.js';
import { driverPanelHtml } from './driverPanel.js';

const $ = (id) => document.getElementById(id);











export function createLobbyUi({ tracks, difficulties, onClaim, onReady, onSettings, onStart, onLeave }) {
  buildChips($('lobby-track-row'), tracks.map((t) => ({ id: t.id, label: t.name })), (id) => onSettings({ trackId: id }));
  buildChips($('lobby-diff-row'), difficulties.map((d) => ({ id: d.id, label: d.label })), (id) => onSettings({ difficulty: id }));
  buildChips($('lobby-lap-row'), LAP_OPTIONS.map((n) => ({ id: String(n), label: `${n} laps` })), (id) => onSettings({ laps: Number(id) }));
  buildChips($('lobby-field-row'), FIELD_SIZES.map((n) => ({ id: String(n), label: `${n} karts` })), (id) => onSettings({ fieldSize: Number(id) }));

  
  const claims = $('lobby-claims');
  claims.innerHTML = '';
  for (const c of CHARACTERS) {
    const el = document.createElement('button');
    el.className = 'claim-chip';
    el.type = 'button';
    el.dataset.id = c.id;
    el.innerHTML = `<span class="claim-dot" style="background:${hex(c.tint)}"></span>
      <span class="claim-name">${c.name}</span>
      <span class="claim-holder"></span>`;
    
    
    
    
    
    
    
    
    
    
    
    
    el.addEventListener('click', () => {
      stage?.select(c.id);
      if (!heldByOther.has(c.id)) onClaim(c.id);
      paintShown();
    });
    claims.appendChild(el);
  }

  
  
  
  
  let stage = null;

  
  
  
  
  let quiet = false;

  
  
  let heldByOther = new Set();

  
  
  
  
  
  
  
  
  
  let room = null;
  let seat = null;

  function paintShown() {
    if (!room) return;
    const byCharacter = new Map(room.players.map((p) => [p.characterId, p]));
    const held = room.players.find((p) => p.peerId === seat) ?? null;
    const showingId = (stage && stage.selected()) ?? held?.characterId ?? null;
    const shown = characterById(showingId) ?? CHARACTERS[0];

    $('lobby-char-info').innerHTML = driverPanelHtml(shown);

    const flag = $('lobby-taken-flag');
    const holder = byCharacter.get(shown.id) ?? null;
    const isShownMine = !!holder && holder.peerId === seat;
    flag.hidden = false;
    flag.className = isShownMine ? 'stage-flag yours' : 'stage-flag';
    flag.textContent = isShownMine
      ? 'Your driver'
      : holder
        ? `${escapeText(holder.name)} has ${shown.name}`
        : `Spin here to take ${shown.name}`;

    for (const el of claims.children) {
      el.classList.toggle('showing', el.dataset.id === shown.id);
    }
  }

  function ensureStage() {
    
    
    
    
    
    
    
    
    if (stage && pageContexts.has('lobby-canvas')) return;
    const old = $('lobby-canvas');
    if (!old) return;
    
    
    
    const canvas = freshCanvas(old);
    
    
    
    
    
    
    
    
    
    
    
    pageContexts.enterExclusive('lobby-canvas');
    stage = createShowcaseView({
      canvas,
      ids: CHARACTERS.map((c) => c.id),
      selected: null,
      onSelect: (id) => {
        if (quiet) return;
        
        
        
        
        if (!heldByOther.has(id)) onClaim(id);
        paintShown();
      },
    });
  }

  
  
  
  
  $('lobby-prev').addEventListener('click', () => stage?.nudge(-1));
  $('lobby-next').addEventListener('click', () => stage?.nudge(+1));

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
      ensureStage();
      const me = lobby.players.find((p) => p.peerId === view.myId) ?? null;
      const byCharacter = new Map(lobby.players.map((p) => [p.characterId, p]));

      $('lobby-link').value = view.shareLink ?? '';
      $('lobby-share').style.display = view.isHost ? '' : 'none';
      $('lobby-heading').textContent = view.isHost ? 'your room' : 'joining';

      heldByOther = new Set(lobby.players
        .filter((p) => p.peerId !== view.myId && p.characterId)
        .map((p) => p.characterId));

      
      
      
      
      
      
      
      if (stage && me?.characterId) {
        const at = stage.selected();
        if (at == null || heldByOther.has(at)) {
          quiet = true;
          stage.select(me.characterId);
          quiet = false;
        }
      }

      
      
      
      room = lobby;
      seat = view.myId;
      paintShown();

      
      for (const el of claims.children) {
        const h = byCharacter.get(el.dataset.id) ?? null;
        const isMine = !!h && h.peerId === view.myId;
        el.classList.toggle('on', isMine);
        el.classList.toggle('taken', !!h && !isMine);
        el.querySelector('.claim-holder').textContent = h ? (isMine ? 'you' : h.name) : '';
        
        
        
        el.setAttribute('aria-pressed', String(isMine));
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

    
    
    
    
    dispose() {
      stage?.dispose();
      stage = null;
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
  return 'Spin to a driver, then say you are ready. The host starts the race.';
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





const escapeText = (s) => {
  const t = String(s ?? '');
  return t.length > 24 ? `${t.slice(0, 23)}\u2026` : t;
};
