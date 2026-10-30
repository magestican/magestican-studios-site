




import { subtitle } from './lines.js';

const el = (tag, cls, parent) => {
  const n = document.createElement(tag);
  n.className = cls;
  parent.appendChild(n);
  return n;
};

const BANNER = {
  continue: () => 'CONTINUE!',
  checkpoint: () => 'CHECKPOINT',
  objective: (ev) => (ev.won ? 'MEDAL!' : 'OBJECTIVE MISSED'),
  cover: () => 'TAKE COVER! LOWER YOUR HANDS TO DUCK',
  rescued: () => 'HOSTAGE SAVED!',
  hostage_lost: () => 'HOSTAGE LOST',
  stagger: () => 'STAGGERED!',
  boss: () => 'IRON-JAW!',
  boss_phase: (ev) => (ev.phase === 2 ? 'ARMOUR DOWN! SHOOT THE JAW' : 'IRON-JAW IS DOWN! GET VARGA'),
  boss_down: () => 'VARGA DEFEATED!',
  vehicle: (ev) => ({ on_foot: 'RUN!', heli: 'HOLD ON!', tank: 'TANK!', jeep: 'GO!' })[ev.to] ?? '',
};












export function createHud(root, actions) {
  const top = el('div', 'hud-top', root);
  const hearts = el('div', 'hud-hearts', top);
  const topRight = el('div', 'hud-top-right', top);
  const score = el('div', 'hud-score', topRight);
  
  const mute = el('button', 'hud-mute', topRight);
  mute.type = 'button';
  const showMute = () => {
    const off = actions.sound.muted();
    mute.textContent = off ? '\u{1F507}' : '\u{1F50A}';
    mute.setAttribute('aria-label', off ? 'Sound off - tap to turn on' : 'Sound on - tap to mute');
    mute.setAttribute('aria-pressed', String(off));
  };
  const toggleMute = () => {
    actions.sound.setMuted(!actions.sound.muted());
    showMute();
  };
  mute.addEventListener('pointerdown', (e) => e.stopPropagation());
  mute.addEventListener('click', toggleMute);
  addEventListener('keydown', (e) => {
    if (e.key === 'm' || e.key === 'M') toggleMute();
  });
  showMute();
  const boss = el('div', 'hud-boss', root);
  const bossName = el('div', 'hud-boss-name', boss);
  const bossBar = el('div', 'hud-boss-bar', el('div', 'hud-boss-track', boss));
  boss.hidden = true;
  const bottom = el('div', 'hud-bottom', root);
  const ammo = { left: el('div', 'hud-ammo left', bottom), right: el('div', 'hud-ammo right', bottom) };
  const hint = el('div', 'hud-hint', root);
  const duck = el('div', 'hud-duck', root);
  duck.textContent = 'DUCKING';
  const reload = el('button', 'hud-reload', root);
  reload.type = 'button';
  reload.textContent = 'RELOAD';
  let reloadHeld = false;
  reload.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    reloadHeld = true;
  });
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) reload.addEventListener(ev, () => (reloadHeld = false));
  const skip = el('button', 'hud-skip', root);
  skip.type = 'button';
  skip.textContent = 'SKIP';
  skip.hidden = true;
  skip.addEventListener('click', () => actions.onSkip());
  const cross = { left: el('div', 'hud-cross', root), right: el('div', 'hud-cross', root) };
  const flash = el('div', 'hud-hurt', root);
  const banner = el('div', 'hud-banner', root);
  
  const say = el('div', 'hud-say', root);
  let sayLeft = 0;
  const end = el('div', 'hud-end', root);
  end.hidden = true;
  const board = el('div', 'hud-board', root);
  board.hidden = true;
  const confetti = Array.from({ length: 6 }, () => el('div', 'hud-confetti', root));
  
  let lastRoom = null;
  let bannerLeft = 0;
  let hurtLeft = 0;

  return {
    reloadHeld: () => reloadHeld,
    






    update(game, input, aim, events, dt, room = null) {
      const cutscene = game.stage.cutscene;
      for (const ev of events) {
        if (ev.type === 'hurt') hurtLeft = 0.35;
        const text = !cutscene && BANNER[ev.type]?.(ev);
        if (text) show(text);
        const line = subtitle(ev);
        if (line) {
          say.textContent = line;
          sayLeft = 2.6;
        }
      }
      top.hidden = cutscene;
      bottom.hidden = cutscene;
      skip.hidden = !cutscene;
      hearts.textContent = `${'♥'.repeat(game.life.hearts)}${'♡'.repeat(Math.max(0, game.d.hearts - game.life.hearts))}`;
      score.textContent = `${game.score.points.toLocaleString('en')}${game.score.combo > 1 ? `  x${game.score.combo}` : ''}`;
      for (const side of  (['left', 'right'])) {
        const g = game.guns[side];
        const held = !!(aim[side].ndc || aim[side].up);
        ammo[side].hidden = !held && side === 'left';
        ammo[side].textContent = g.reloading > 0 ? `RELOAD ${Math.round(g.reloading * 100)}%` : g.ammo ? '|'.repeat(g.ammo) : 'EMPTY';
        ammo[side].classList.toggle('empty', g.ammo === 0);
        const c = aim[side].ndc;
        cross[side].hidden = !c;
        if (c) {
          cross[side].style.left = `${((c.x + 1) / 2) * 100}%`;
          cross[side].style.top = `${((1 - c.y) / 2) * 100}%`;
        }
      }
      duck.hidden = !game.crouched;
      const b = game.boss;
      boss.hidden = !b || b.done;
      if (b) {
        const parts = b.phase === 1 ? b.parts.plates : b.phase === 2 ? [b.parts.jaw] : [b.parts.varga];
        const hp = parts.reduce((s, p) => s + (p && !p.dead ? p.hp : 0), 0);
        const max = parts.reduce((s, p) => s + (p ? p.maxHp : 0), 0) || 1;
        bossName.textContent = b.phase < 3 ? `IRON-JAW - PHASE ${b.phase}` : 'BOSS VARGA';
        bossBar.style.width = `${Math.round((100 * hp) / max)}%`;
      }
      hint.textContent = cutscene ? '' : input.hint;
      reload.hidden = cutscene || input.mode !== 'touch' || game.guns.right.autoReload;
      hurtLeft = Math.max(0, hurtLeft - dt);
      flash.style.opacity = String(hurtLeft * 2);
      bannerLeft = Math.max(0, bannerLeft - dt);
      banner.style.opacity = String(Math.min(1, bannerLeft * 2));
      sayLeft = Math.max(0, sayLeft - dt);
      say.style.opacity = String(Math.min(1, sayLeft * 3));
      drawRoom(room, cutscene || game.ended, !boss.hidden);
      if (game.ended && !cutscene && end.hidden) showRank(game);
    },
  };

  function showRank(game) {
    end.hidden = false;
    end.innerHTML = '';
    el('div', 'hud-end-title', end).textContent = `${game.stage.name.toUpperCase()} CLEAR`;
    el('div', 'hud-end-rank', end).textContent = String(game.rank);
    el('div', 'hud-end-line', end).textContent =
      `${game.score.points.toLocaleString('en')} points - ${game.score.kills}/${game.spawned} enemies - ${game.medals.length} medals`;
    if (lastRoom) fillBoard(el('div', 'hud-end-table', end), lastRoom.board);
    const row = el('div', 'hud-end-buttons', end);
    const again = el('button', 'hud-again', row);
    again.type = 'button';
    again.textContent = 'PLAY AGAIN';
    again.addEventListener('click', () => location.reload());
    if (actions.onNext) {
      const next = el('button', 'hud-again hud-next', row);
      next.type = 'button';
      next.textContent = 'NEXT STAGE';
      next.addEventListener('click', () => actions.onNext?.());
    }
  }

  
  function drawRoom(room, off, low) {
    lastRoom = room ?? lastRoom;
    board.hidden = !room || off;
    board.classList.toggle('low', low);
    if (room && !off) {
      board.innerHTML = '';
      fillBoard(board, room.board);
    }
    const labels = room && !off ? room.labels : [];
    for (const [i, n] of confetti.entries()) {
      const l = labels[i];
      n.hidden = !l;
      if (!l) continue;
      n.textContent = l.text;
      n.classList.toggle('own', l.own);
      n.style.left = `${l.x * 100}%`;
      n.style.top = `${l.y * 100}%`;
      n.style.opacity = String(l.fade);
    }
  }

  
  function fillBoard(list, b) {
    const row = (r, rank, me) => {
      el('div', `hud-board-row${me ? ' me' : ''}`, list).textContent = `${rank}. ${r.name}  ${r.score.toLocaleString('en')}`;
    };
    for (const [i, r] of b.top.entries()) row(r, i + 1, i + 1 === b.myRank);
    if (b.me) row(b.me, b.myRank, true);
  }

  function show(text) {
    banner.textContent = text;
    bannerLeft = 1.6;
  }
}
