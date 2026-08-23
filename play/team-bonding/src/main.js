





import { installPointerLockPromise } from 'arbelo/pointer-lock-compat';

import { Game } from './game.js';
import { MAPS, MAP_IDS, DEFAULT_MAP } from 'arbelo/mapspec';
import { MODES, MODE_IDS, DEFAULT_MODE } from 'arbelo/modes';
import { PeerMesh } from 'arbelo/net';
import { startVersionChecker } from 'arbelo/updater';
import { mountDeviceQr }       from 'arbelo/qr';
import { initAnalytics, trackEvent } from 'arbelo/analytics';
import { gameStartParams, watchMatchEnd } from 'arbelo/game-events';
import { mountLeaderboard } from 'arbelo/leaderboard-ui';
import { mountEscRouter } from 'arbelo/esc-router';
import { loadCareer, saveCareer, rememberCharacters } from 'arbelo/career';



























installPointerLockPromise(window);







window.__tbBooted = true;



startVersionChecker({ label: 'A new version of Team Bonding is available.' });




mountDeviceQr({ label: 'Play on your phone', sublabel: 'Scan this to open Team Bonding (and any join code) on your phone.' });





initAnalytics({ page: 'team-bonding-game' });

const $ = (id) => document.getElementById(id);














const leaderboardUi = mountLeaderboard({
  place: 'game',
  showChip: true,          
  
  
  
  
  mountInto: '#menu .menu-card',
  myName: localStorage.getItem('tb.name') || '',
});




$('loading').classList.add('done');


window.addEventListener('error', (e) => {
  const msg = `Uncaught: ${e.message} @ ${e.filename}:${e.lineno}`;
  console.error(msg);
  document.title = `TB ERROR: ${e.message}`;
});
window.addEventListener('unhandledrejection', (e) => {
  const msg = `Promise: ${e.reason?.message || e.reason}`;
  console.error(msg);
  document.title = `TB PROMISE ERROR: ${e.reason?.message || e.reason}`;
});





const state = {
  character: 'cow',
  team: null,             
  name: '',
  mode: null,             
  initialBots: 0,         
  
  
  
  mapId: localStorage.getItem('tb.map') || DEFAULT_MAP,
  gameMode: localStorage.getItem('tb.mode') || DEFAULT_MODE,
};


function selectFrom(rowId, dataAttr, value, target) {
  const row = $(rowId);
  for (const btn of row.querySelectorAll('button')) btn.classList.remove('selected');
  if (target) target.classList.add('selected');
  else {
    for (const btn of row.querySelectorAll('button')) {
      if (btn.dataset[dataAttr] === value) btn.classList.add('selected');
    }
  }
}





function buildPicker(rowId, blurbId, entries, dataAttr, initial, onPick) {
  const row = document.getElementById(rowId);
  const blurb = document.getElementById(blurbId);
  if (!row) return;
  for (const e of entries) {
    const btn = document.createElement('button');
    btn.dataset[dataAttr] = e.id;
    btn.innerHTML = `<span class="emoji">${e.emoji}</span><span class="lbl">${e.short || e.name}</span>`;
    btn.title = e.blurb;
    btn.addEventListener('click', () => {
      onPick(e.id);
      for (const b of row.querySelectorAll('button')) b.classList.remove('selected');
      btn.classList.add('selected');
      if (blurb) blurb.textContent = e.blurb;
    });
    row.appendChild(btn);
  }
  const chosen = entries.find((e) => e.id === initial) || entries[0];
  onPick(chosen.id);
  const btn = row.querySelector(`button[data-${dataAttr.toLowerCase()}="${chosen.id}"]`);
  if (btn) btn.classList.add('selected');
  if (blurb) blurb.textContent = chosen.blurb;
}

buildPicker('mapRow', 'mapBlurb', MAP_IDS.map((id) => MAPS[id]), 'map', state.mapId,
  (id) => { state.mapId = id; localStorage.setItem('tb.map', id); });
buildPicker('modeRow', 'modeBlurb', MODE_IDS.map((id) => MODES[id]), 'gmode', state.gameMode,
  (id) => { state.gameMode = id; localStorage.setItem('tb.mode', id); });


selectFrom('characterRow', 'char', 'cow');

for (const btn of $('characterRow').querySelectorAll('button')) {
  btn.addEventListener('click', () => {
    state.character = btn.dataset.char;
    selectFrom('characterRow', 'char', state.character, btn);
    rememberLocalCharacter();
  });
}
for (const btn of $('teamRow').querySelectorAll('button')) {
  btn.addEventListener('click', () => {
    state.team = btn.dataset.team;
    selectFrom('teamRow', 'team', state.team, btn);
  });
}





const botSlider = document.getElementById('botSlider');
const botCount  = document.getElementById('botCount');
if (botSlider && botCount) {
  const applyBots = () => {
    state.initialBots = parseInt(botSlider.value, 10);
    botCount.textContent = botSlider.value;
    localStorage.setItem('tb.bots', botSlider.value);
  };
  const saved = parseInt(localStorage.getItem('tb.bots') ?? '5', 10);
  botSlider.value = String(Number.isFinite(saved) ? Math.min(15, Math.max(0, saved)) : 5);
  applyBots();
  botSlider.addEventListener('input', applyBots);
}



const ADJ = ['Fierce','Swift','Cunning','Salty','Wooly','Cranky','Feral','Nimble','Bumpy','Rowdy','Sleepy','Grumpy','Merry','Quiet','Rustic','Muddy','Fuzzy','Crimson','Cobalt','Stormy'];
const NOUN = ['Cow','Chicken','Pig','Sheep','Bandit','Ranger','Farmer','Scout','Sniper','Buccaneer','Cadet','Marshal','Wanderer'];
function randomName() {
  const a = ADJ[Math.floor(Math.random() * ADJ.length)];
  const n = NOUN[Math.floor(Math.random() * NOUN.length)];
  const num = Math.floor(Math.random() * 90 + 10);
  return `${a}${n}${num}`;
}
$('nameInput').value = localStorage.getItem('tb.name') || randomName();
state.name = $('nameInput').value.trim();
$('nameInput').addEventListener('input', (e) => {
  state.name = e.target.value.trim();
  localStorage.setItem('tb.name', state.name);
});








function rememberLocalCharacter() {
  const name = ($('nameInput').value || '').trim();
  if (!name) return;
  const before = loadCareer(localStorage);
  const after = rememberCharacters(before, [{ name, character: state.character }]);
  
  
  if (after !== before) { saveCareer(localStorage, after); leaderboardUi?.refresh(); }
}










(function howtoOnboarding() {
  const overlay = document.getElementById('howto-overlay');
  const close = document.getElementById('howto-close');
  if (!overlay || !close) return;
  if (!localStorage.getItem('tb.howto')) {
    overlay.style.display = 'flex';
  }
  close.addEventListener('click', () => {
    localStorage.setItem('tb.howto', '1');
    overlay.style.display = 'none';
  });
})();




const initialTeam = Math.random() < 0.5 ? 'red' : 'blue';
state.team = initialTeam;
selectFrom('teamRow', 'team', initialTeam);





const url = new URL(location.href);
const joinFromUrl = url.searchParams.get('join');
if (joinFromUrl) {
  $('joinIdInput').value = joinFromUrl;
}





$('hostBtn').addEventListener('click', async () => {
  if (!validate()) return;
  state.mode = 'host';
  await startGame(null);
});

$('joinBtn').addEventListener('click', async () => {
  if (!validate()) return;
  const hostId = $('joinIdInput').value.trim();
  if (!hostId) { alert('Enter the room code your host sent you.'); return; }
  state.mode = 'join';
  await startGame(hostId);
});

function validate() {
  const name = $('nameInput').value.trim() || randomName();
  state.name = name;
  $('nameInput').value = name;
  localStorage.setItem('tb.name', name);
  if (!state.team) {
    state.team = Math.random() < 0.5 ? 'red' : 'blue';
    selectFrom('teamRow', 'team', state.team);
  }
  return true;
}





async function startGame(hostIdToJoin) {
  
  const hostIdHint = state.mode === 'host'
    ? `tb-${Math.random().toString(36).slice(2, 8)}`
    : undefined;

  const mesh = new PeerMesh({ hostIdHint });

  
  const myId = await new Promise((resolve, reject) => {
    mesh.addEventListener('open', (e) => resolve(e.detail.id), { once: true });
    mesh.addEventListener('error', (e) => {
      
      
      if (String(e.detail.message).includes('unavailable-id')) {
        console.warn('room code taken - taking a random one');
      } else {
        reject(new Error(e.detail.message));
      }
    });
  }).catch((err) => {
    alert('Network error opening room: ' + err.message);
    throw err;
  });

  if (state.mode === 'host') {
    mesh.host();
    
    const link = new URL(location.href);
    link.searchParams.set('join', myId);
    $('linkOutWrap').style.display = 'block';
    $('linkOut').textContent = link.toString();
    $('linkOut').addEventListener('click', () => {
      navigator.clipboard.writeText(link.toString());
      $('linkOut').textContent = link.toString() + '  (copied!)';
    });

    
    
    
    
    
    
    
    
    
    
    
    try { history.replaceState({}, '', link.toString()); } catch (_) {}

    const shareWrap = document.getElementById('share-wrap');
    const shareUrl = document.getElementById('share-url');
    const shareCopy = document.getElementById('share-copy');
    if (shareWrap && shareUrl) {
      shareWrap.style.display = 'block';
      shareUrl.value = link.toString();
      shareUrl.addEventListener('focus', () => shareUrl.select());
      shareCopy?.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(link.toString());
          shareCopy.textContent = 'Copied!';
        } catch (_) {
          
          
          shareUrl.select();
          shareCopy.textContent = 'Press Ctrl+C';
        }
        setTimeout(() => { shareCopy.textContent = 'Copy'; }, 1800);
      });
    }
  } else {
    mesh.connectTo(hostIdToJoin);
  }

  
  
  
  const seed = state.mode === 'host'
    ? (Math.random() * 2 ** 32) >>> 0
    : null;   

  
  const goInGame = () => {
    $('menu').style.display = 'none';
    $('hud').style.display = 'block';
    $('loading').classList.add('done');
    
    
    
    
    leaderboardUi?.setChipVisible(false);
    game.pointerLock();
  };

  const game = new Game({
    mesh,
    myId,
    character: state.character,
    team: state.team,
    name: state.name,
    isHost: state.mode === 'host',
    seed,
    
    mapId: state.mapId,
    mode: state.gameMode,
    initialBots: state.mode === 'host' ? state.initialBots : 0,
    canvasParent: $('app'),
    onReady: goInGame,
  });

  window.__tbGame = game;   

  
  
  
  
  
  
  
  
  const observerBox = document.getElementById('observer-box');
  if (observerBox) {
    observerBox.checked = state.team === 'observer';
    observerBox.addEventListener('change', () => {
      game.setObserverMode(observerBox.checked);
    });
  }

  rememberLocalCharacter();

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  mountEscRouter({
    isAnagramOpen:    () => !!$('anagramWrap')?.classList.contains('visible'),
    isChatOpen:       () => !!game.chat?.isComposing?.(),
    isSettingsOpen:   () => !!$('settings-modal')?.classList.contains('visible'),
    isCareerOpen:     () => !!leaderboardUi?.isOpen(),
    isScoreboardOpen: () => !!game._scoreboardOpen,
    
    
    isInMatch:        () => $('menu')?.style.display === 'none',
    closeChat:        () => game.chat?.close?.(),
    closeSettings:    () => $('settings-modal')?.classList.remove('visible'),
    closeCareer:      () => leaderboardUi?.close(),
    setScoreboard:    (on) => game._paintScoreboard(on),
  });

  
  
  
  
  
  
  
  
  
  
  
  setInterval(() => {
    try {
      const roster = [...(game.playerMeta?.values?.() ?? [])];
      if (!roster.length) return;
      const before = loadCareer(localStorage);
      const after = rememberCharacters(before, roster);
      if (after !== before) { saveCareer(localStorage, after); leaderboardUi?.refresh(); }
    } catch (_) {  }
  }, 10000);

  await game.boot();

  
  
  
  
  
  trackEvent('game_start', gameStartParams(game, { role: state.mode }));
  watchMatchEnd(game, { onEnd: (params) => trackEvent('match_end', params) });
}
