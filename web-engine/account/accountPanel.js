










































import {
  evaluate, statsFor, tally, showcase, nextUp, TIER_LABEL, TIER_COLOUR,
  RARITY_DISCLAIMER, PROOF, PROOF_LABEL, PROOF_BLURB,
} from './achievements.js';
import { badgeSvg, progressArcSvg, verifiedTickSvg } from './badgeArt.js';
import { standingOffer, proofLine } from './signupMoment.js';
import { saveCoverage, SAVE_SYNC_ENABLED } from './gameSave.js';
import { backupLines } from './saveConflict.js';
import { GAME_NAMES } from './dailyChallenge.js';
import { streakLineFromStatus } from './streak.js';








export function panelModel({
  summary = null, profile = null, today = null, kartRecords = null,
  rows = null, backups = [], syncEnabled = false, saveSync = SAVE_SYNC_ENABLED,
  rulesLanded = [], seen = {}, filter = 'all',
} = {}) {
  const stats = statsFor(profile, { today, kartRecords });
  const all = rows ?? evaluate(stats, {
    synced: !!summary?.linked, saveSync, rulesLanded, seen,
  });
  const t = tally(all);
  const rank = summary?.rank ?? { name: 'Farmhand', xp: 0, nextName: null, toNext: 0, fraction: 0 };

  const shown = filter === 'unlocked' ? all.filter((r) => r.unlocked)
    : filter === 'locked' ? all.filter((r) => !r.unlocked)
      : all;

  return {
    name: summary?.name ?? '',
    linked: !!summary?.linked,
    rank: {
      name: rank.name,
      xp: rank.xp ?? 0,
      
      nextLine: rank.nextName ? `${rank.toNext} XP to ${rank.nextName}` : 'Top rank',
      fraction: Math.max(0, Math.min(1, rank.fraction ?? 0)),
    },
    streakLine: streakLineFromStatus(summary?.streak ?? {}),
    today: todaySection(summary),
    tourLine: tourLineOf(summary?.tour),
    
    
    shelf: shown,
    counts: t,
    showcase: showcase(all, 6),
    nextUp: nextUp(all, stats),
    proofLine: proofLine(all),
    rarityNote: RARITY_DISCLAIMER,
    
    offer: standingOffer(summary, { syncEnabled }),
    coverage: saveCoverage({ saveSync }).map((c) => ({ ...c, name: GAME_NAMES[c.id] ?? c.id })),
    backups: backupLines(backups),
    forget: {
      label: 'Erase my progress',
      
      
      
      confirm: 'This erases your progress on this device, and in your account if you have one. '
        + 'It cannot be undone. Erase it?',
    },
    filter,
  };
}















function todaySection(summary) {
  const board = summary?.tasks ?? null;
  if (!board?.tasks?.length) return null;
  const season = summary?.season ?? null;
  const weekly = summary?.weekly ?? null;
  const weeklyDone = (weekly?.goals ?? []).filter((g) => g.progress?.done ?? g.done).length;
  return {
    tasks: board.tasks.map((entry) => ({
      text: entry.task?.text ?? '',
      xp: entry.task?.xp ?? 0,
      done: !!entry.progress?.done,
      
      
      fraction: Math.max(0, Math.min(1, Number(entry.progress?.fraction) || 0)),
      have: entry.progress?.have ?? 0,
      need: entry.progress?.target ?? 0,
    })),
    countLine: board.complete
      ? `Day complete - ${board.doneCount} of ${board.tasks.length}`
      : `${board.doneCount} of ${board.tasks.length} done today`,
    complete: !!board.complete,
    weeklyLine: weekly?.goals?.length
      ? `${weeklyDone} of ${weekly.goals.length} weekly goals`
      : null,
    seasonLine: season && Number(season.tiers) > 0
      ? `${season.name ?? 'Season'} - tier ${season.tier ?? 0} of ${season.tiers}`
      : null,
  };
}

function tourLineOf(tour) {
  if (!tour) return null;
  if (tour.complete) return `Barn Tour complete · ${tour.stamps} ${tour.stamps === 1 ? 'stamp' : 'stamps'}`;
  const missing = tour.missing ?? [];
  if (!missing.length || missing.length > 2) return null;
  return `Barn Tour: ${missing.map((id) => GAME_NAMES[id] ?? id).join(' and ')} left this week`;
}


export function badgeCaption(row) {
  if (!row) return '';
  if (!row.unlocked) return `${TIER_LABEL[row.tier] ?? ''} · locked`;
  return `${TIER_LABEL[row.tier] ?? ''} · ${PROOF_LABEL[row.proof] ?? ''}`;
}





const STYLE_ID = 'arbelo-account-panel-style';










export function mountAccountPanel(host, model, handlers = {}) {
  if (!host || typeof document === 'undefined' || !model) return null;
  injectStyles();
  host.textContent = '';
  host.className = `${host.className || ''} account-panel`.trim();

  host.appendChild(headerEl(model));
  host.appendChild(rankEl(model));
  const today = todayEl(model);
  if (today) host.appendChild(today);
  const offer = offerEl(model, handlers);
  if (offer) host.appendChild(offer);
  host.appendChild(shelfEl(model));
  const restore = restoreEl(model, handlers);
  if (restore) host.appendChild(restore);
  host.appendChild(footerEl(model, handlers));
  return host;
}

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};




const svgInto = (node, svg) => { node.innerHTML = svg; return node; };

function headerEl(m) {
  const box = el('div', 'ap-head');
  box.appendChild(el('div', 'ap-name', m.name || 'Player'));
  const lines = el('div', 'ap-lines');
  if (m.streakLine) lines.appendChild(el('div', 'ap-line', m.streakLine));
  if (m.tourLine) lines.appendChild(el('div', 'ap-line', m.tourLine));
  box.appendChild(lines);
  return box;
}

function rankEl(m) {
  const box = el('div', 'ap-rank');
  const row = el('div', 'ap-rank-row');
  row.appendChild(el('span', 'ap-rank-name', m.rank.name));
  row.appendChild(el('span', 'ap-rank-next', m.rank.nextLine));
  box.appendChild(row);
  const bar = el('div', 'ap-bar');
  const fill = el('div', 'ap-bar-fill');
  fill.style.width = `${Math.round(m.rank.fraction * 100)}%`;
  bar.appendChild(fill);
  box.appendChild(bar);
  return box;
}

function todayEl(m) {
  const t = m.today;
  if (!t) return null;
  const box = el('div', 'ap-today');
  const head = el('div', 'ap-today-head');
  head.appendChild(el('span', 'ap-today-title', 'Today'));
  head.appendChild(el('span', t.complete ? 'ap-today-count ap-today-done' : 'ap-today-count', t.countLine));
  box.appendChild(head);

  const list = el('ul', 'ap-tasks');
  for (const task of t.tasks) {
    const li = el('li', task.done ? 'ap-task ap-task-done' : 'ap-task');
    const row = el('div', 'ap-task-row');
    row.appendChild(el('span', 'ap-task-text', task.text));
    
    
    row.appendChild(el('span', 'ap-task-have', task.done ? 'Done' : `${task.have} of ${task.need}`));
    li.appendChild(row);
    const bar = el('div', 'ap-bar');
    const fill = el('div', 'ap-bar-fill');
    fill.style.width = `${Math.round(task.fraction * 100)}%`;
    bar.appendChild(fill);
    li.appendChild(bar);
    list.appendChild(li);
  }
  box.appendChild(list);

  const lines = el('div', 'ap-lines');
  if (t.weeklyLine) lines.appendChild(el('div', 'ap-line', t.weeklyLine));
  if (t.seasonLine) lines.appendChild(el('div', 'ap-line', t.seasonLine));
  if (lines.childNodes.length) box.appendChild(lines);
  return box;
}

function offerEl(m, handlers) {
  if (!m.offer?.show) {
    if (m.linked) {
      const ok = el('div', 'ap-offer ap-offer-done');
      ok.appendChild(svgInto(el('span', 'ap-tick'), verifiedTickSvg({ size: 13 })));
      ok.appendChild(el('span', 'ap-offer-text', 'Your progress is saved to your account.'));
      return ok;
    }
    return null;
  }
  const box = el('div', 'ap-offer');
  box.appendChild(el('div', 'ap-offer-text', m.offer.text));
  const btn = el('button', 'ap-btn ap-btn-primary', m.offer.cta);
  btn.type = 'button';
  btn.addEventListener('click', () => handlers.onLink?.());
  box.appendChild(btn);
  const cov = el('ul', 'ap-coverage');
  for (const c of m.coverage) {
    const li = el('li', c.covered ? 'ap-cov ap-cov-on' : 'ap-cov ap-cov-off');
    li.appendChild(el('span', 'ap-cov-name', c.name));
    li.appendChild(el('span', 'ap-cov-what', c.what));
    cov.appendChild(li);
  }
  box.appendChild(cov);
  return box;
}

function shelfEl(m) {
  const box = el('section', 'ap-shelf');
  const head = el('div', 'ap-shelf-head');
  head.appendChild(el('h3', 'ap-h3', 'Badges'));
  head.appendChild(el('div', 'ap-proof', m.proofLine));
  box.appendChild(head);

  if (m.nextUp) {
    box.appendChild(el('div', 'ap-next',
      `Closest: ${m.nextUp.name} - ${m.nextUp.have} of ${m.nextUp.target}`));
  }

  const grid = el('div', 'ap-grid');
  for (const row of m.shelf) {
    const cell = el('div', row.unlocked ? 'ap-cell ap-cell-on' : 'ap-cell');
    const art = el('div', 'ap-art');
    svgInto(art, badgeSvg(row, { size: 44 }));
    if (!row.unlocked && row.progress > 0) {
      const arc = el('div', 'ap-arc');
      svgInto(arc, progressArcSvg(row.progress, { size: 44 }));
      art.appendChild(arc);
    }
    cell.appendChild(art);
    const meta = el('div', 'ap-meta');
    const nameRow = el('div', 'ap-badge-name');
    nameRow.appendChild(document.createTextNode(row.name));
    if (row.proof === PROOF.VERIFIED && row.unlocked) {
      const tick = el('span', 'ap-tick');
      svgInto(tick, verifiedTickSvg({ size: 12 }));
      nameRow.appendChild(tick);
    }
    meta.appendChild(nameRow);
    meta.appendChild(el('div', 'ap-badge-desc', row.desc));
    const cap = el('div', 'ap-badge-cap', badgeCaption(row));
    cap.style.color = row.unlocked ? (TIER_COLOUR[row.tier] ?? '#9aa4b5') : '#6c7484';
    
    
    if (row.unlocked) cap.title = PROOF_BLURB[row.proof] ?? '';
    meta.appendChild(cap);
    cell.appendChild(meta);
    grid.appendChild(cell);
  }
  box.appendChild(grid);
  box.appendChild(el('p', 'ap-note', m.rarityNote));
  return box;
}

function restoreEl(m, handlers) {
  if (!m.backups?.length) return null;
  const box = el('section', 'ap-restore');
  box.appendChild(el('h3', 'ap-h3', 'Kept aside'));
  box.appendChild(el('p', 'ap-note',
    'Progress that was replaced. Putting it back only ever adds to what you have now.'));
  for (const b of m.backups) {
    const row = el('div', 'ap-restore-row');
    row.appendChild(el('span', 'ap-restore-text', b.text));
    const btn = el('button', 'ap-btn', 'Put it back');
    btn.type = 'button';
    btn.addEventListener('click', () => handlers.onRestore?.(b.index));
    row.appendChild(btn);
    box.appendChild(row);
  }
  return box;
}

function footerEl(m, handlers) {
  const box = el('div', 'ap-foot');
  const btn = el('button', 'ap-btn ap-btn-quiet', m.forget.label);
  btn.type = 'button';
  btn.addEventListener('click', () => {
    
    if (typeof globalThis.confirm === 'function' && !globalThis.confirm(m.forget.confirm)) return;
    handlers.onForget?.();
  });
  box.appendChild(btn);
  return box;
}

function injectStyles() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    .account-panel { font: 13px/1.5 system-ui, sans-serif; color: #cbd3e1; }
    .account-panel h3.ap-h3 { font: 700 11px/1 system-ui, sans-serif; letter-spacing: .12em;
      text-transform: uppercase; color: #7f8798; margin: 0 0 8px; }
    .ap-head { margin-bottom: 10px; }
    .ap-name { font: 700 18px/1.2 system-ui, sans-serif; color: #f2f5fa; }
    .ap-line { color: #9aa4b5; font-size: 12px; }
    .ap-line:first-child { color: #ffd45e; font-weight: 700; }
    .ap-rank { margin: 12px 0 16px; }
    .ap-rank-row { display: flex; justify-content: space-between; align-items: baseline; }
    .ap-rank-name { font-weight: 700; color: #f2f5fa; letter-spacing: .04em; }
    .ap-rank-next { font-size: 11px; color: #7f8798; }
    .ap-bar { height: 6px; border-radius: 3px; background: #232935; margin-top: 6px; overflow: hidden; }
    .ap-today { margin-top: 14px; }
    .ap-today-head { display: flex; justify-content: space-between; align-items: baseline; }
    .ap-today-title { font: 700 11px system-ui; letter-spacing: 0.12em; text-transform: uppercase; color: #8e97a8; }
    .ap-today-count { font: 600 11px system-ui; color: #8e97a8; }
    .ap-today-count.ap-today-done { color: #5fd08a; }
    .ap-tasks { list-style: none; margin: 8px 0 0; padding: 0; display: flex; flex-direction: column; gap: 9px; }
    .ap-task-row { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
    .ap-task-text { font: 500 13px system-ui; color: #d7dceb; }
    .ap-task-have { font: 600 11px system-ui; color: #8e97a8; white-space: nowrap; }
    .ap-task.ap-task-done .ap-task-text { color: #8e97a8; }
    .ap-task.ap-task-done .ap-task-have { color: #5fd08a; }
    .ap-task.ap-task-done .ap-bar-fill { background: #5fd08a; }
    .ap-bar-fill { height: 100%; background: linear-gradient(90deg,#59a6ff,#5fd08a); }
    .ap-offer { background: #171c25; border: 1px solid #2a3240; border-radius: 8px;
      padding: 12px; margin-bottom: 16px; }
    .ap-offer-done { display: flex; gap: 6px; align-items: center; color: #5fd08a; }
    .ap-offer-text { color: #cbd3e1; margin-bottom: 8px; display: block; }
    .ap-btn { font: 600 12px/1 system-ui, sans-serif; color: #cbd3e1; background: #232935;
      border: 1px solid #333b4a; border-radius: 6px; padding: 8px 12px; cursor: pointer; }
    .ap-btn:hover { background: #2b3341; }
    .ap-btn-primary { background: #2f6fd0; border-color: #3c81e8; color: #fff; }
    .ap-btn-primary:hover { background: #3a7ee0; }
    .ap-btn-quiet { color: #8d95a5; background: transparent; border-color: #2a3240; }
    .ap-coverage { list-style: none; margin: 10px 0 0; padding: 0; }
    .ap-cov { display: flex; justify-content: space-between; gap: 10px; font-size: 11px;
      padding: 2px 0; color: #7f8798; }
    .ap-cov-on .ap-cov-name { color: #9aa4b5; }
    .ap-cov-off .ap-cov-name { color: #6c7484; }
    .ap-shelf-head { display: flex; justify-content: space-between; align-items: baseline;
      gap: 10px; flex-wrap: wrap; }
    .ap-proof { font-size: 11px; color: #7f8798; }
    .ap-next { font-size: 12px; color: #59a6ff; margin: 2px 0 10px; }
    .ap-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
      gap: 10px; }
    .ap-cell { display: flex; gap: 10px; align-items: flex-start; padding: 8px;
      border-radius: 8px; background: #141821; border: 1px solid #1e2531; }
    .ap-cell-on { background: #171c25; border-color: #2a3240; }
    .ap-art { position: relative; width: 44px; height: 44px; flex: 0 0 44px; }
    .ap-arc { position: absolute; inset: 0; }
    .ap-meta { min-width: 0; }
    .ap-badge-name { font-weight: 700; color: #e6ebf3; display: flex; align-items: center; gap: 5px; }
    .ap-cell:not(.ap-cell-on) .ap-badge-name { color: #8d95a5; }
    .ap-badge-desc { font-size: 11px; color: #7f8798; }
    .ap-badge-cap { font-size: 10px; letter-spacing: .06em; text-transform: uppercase;
      margin-top: 3px; }
    .ap-tick { display: inline-flex; }
    .ap-note { font-size: 10px; color: #626a79; margin: 10px 0 0; }
    .ap-restore { margin-top: 16px; }
    .ap-restore-row { display: flex; justify-content: space-between; align-items: center;
      gap: 10px; padding: 6px 0; }
    .ap-restore-text { font-size: 12px; color: #9aa4b5; }
    .ap-foot { margin-top: 18px; padding-top: 12px; border-top: 1px solid #1e2531; }
  `;
  document.head.appendChild(s);
}
