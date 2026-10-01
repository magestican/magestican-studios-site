




















import { currentProfile, currentRecords } from '../account/account.js';
import { mountProfilePanel } from '../account/accountUi.js';
import { statsFor } from '../account/achievements.js';
import { localDayNumber } from '../account/dayKey.js';
import { snapshotOf, SNAPSHOT_KEY } from './snapshot.js';
import { trophyRows } from './trophies.js';
import { trophySvg } from './trophyArt.js';
import { PROFILE_GAME_IDS } from './gameIds.js';
import { youModel } from './youModel.js';
import { CHIP_SEEN_KEY } from './levelChip.js';
import { shareInvite } from '../share/shareInvite.js';

const STYLE_ID = 'mg-you-style';

function el(doc, tag, cls, text) {
  const e = doc.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined && text !== null) e.textContent = String(text);
  return e;
}

function injectStyle(doc) {
  if (doc.getElementById(STYLE_ID)) return;
  const st = doc.createElement('style');
  st.id = STYLE_ID;
  st.textContent = `
.you-hero{display:grid;grid-template-columns:auto 1fr;gap:18px 22px;align-items:center;background:#fffbf2;
  border:1px solid #d9d0bd;border-radius:20px;padding:22px;margin:0 0 28px}
.you-level{width:104px;height:104px;border-radius:50%;display:grid;place-items:center;background:#1c1a17;color:#fffbf2;
  font:700 44px/1 Georgia,serif;box-shadow:inset 0 0 0 5px #ffb03a}
.you-level small{display:block;font:600 11px/1 system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;opacity:.75;text-align:center;margin-bottom:-14px}
.you-title{font:700 26px/1.15 Georgia,serif;margin:0 0 6px}
.you-bar{height:10px;border-radius:5px;background:#e9e1cf;overflow:hidden;margin:6px 0}
.you-bar>span{display:block;height:100%;background:#ffb03a;border-radius:5px}
.you-meta{margin:2px 0;color:#5a544b;font-size:15px}
.you-actions{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.you-btn{font:600 15px/1 system-ui,sans-serif;padding:11px 18px;border-radius:999px;border:1px solid #1c1a17;background:#1c1a17;color:#fffbf2;cursor:pointer}
.you-btn.alt{background:transparent;color:#1c1a17}
.you-share-out{font-size:14px;color:#5a544b;user-select:all}
.you-trophies{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:12px;margin:0 0 28px !important;padding:0 !important;list-style:none}
.you-trophy{border:1px solid #d9d0bd;border-radius:14px;padding:14px 10px;text-align:center;background:#fffbf2}
.you-trophy .cup{font-size:30px;line-height:1;color:#c98a1b}
.you-trophy.locked{opacity:.62}
.you-trophy.locked .cup{color:#9aa4b5}
.you-trophy b{display:block;font-size:14px;margin:6px 0 2px}
.you-trophy span{font-size:12px;color:#5a544b}
.you-games{width:100%;border-collapse:collapse;margin:0 0 28px;font-size:15px}
.you-games th,.you-games td{text-align:left;padding:9px 8px;border-bottom:1px solid #d9d0bd;vertical-align:top}
.you-games th{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#5a544b}
.you-games small{display:block;color:#5a544b;font-size:12px}
.you-panel-card{background:#141821;border-radius:20px;padding:18px;margin:0 0 28px}
.you-empty{background:#fffbf2;border:1px dashed #d9d0bd;border-radius:14px;padding:16px;margin:0 0 28px}
@media (max-width:560px){.you-hero{grid-template-columns:1fr;text-align:center}.you-level{margin:0 auto}
  .you-actions{justify-content:center}.you-games .opt{display:none}}
`;
  (doc.head ?? doc.documentElement).appendChild(st);
}


export function readYou(nowMs = Date.now()) {
  const profile = currentProfile();
  const kartRecords = currentRecords();
  let seen = {};
  try { seen = JSON.parse(globalThis.localStorage?.getItem(CHIP_SEEN_KEY) || '{}') ?? {}; } catch { seen = {}; }
  const snapshot = snapshotOf(profile, nowMs, { seen, kartRecords });
  try { globalThis.localStorage?.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot)); } catch {  }
  let rows = [];
  try {
    const stats = statsFor(profile, { today: localDayNumber(nowMs), kartRecords });
    rows = trophyRows(stats, { appGameIds: PROFILE_GAME_IDS, seen: profile?.feats?.trophyAt });
  } catch { rows = []; }
  return { snapshot, trophyRows: rows };
}

function share(doc, model, out) {
  const { text, url } = model.share;
  const say = (msg) => { out.textContent = msg; };
  
  
  
  
  try {
    shareInvite({ url, title: 'Magestican Studios', text }).then((res) => {
      if (res?.via === 'clipboard') say('Copied - paste it anywhere.');
      else if (res?.via === 'manual') say(`${text} ${url}`);
    }, () => say(`${text} ${url}`));
  } catch { say(`${text} ${url}`); }
}

function hero(doc, m) {
  const box = el(doc, 'section', 'you-hero');
  box.setAttribute('aria-label', 'Your level');
  const lv = el(doc, 'div', 'you-level');
  lv.append(el(doc, 'small', null, 'Level'), doc.createTextNode(String(m.hero.level)));
  const info = el(doc, 'div');
  info.append(el(doc, 'p', 'you-title', m.hero.title));
  const bar = el(doc, 'div', 'you-bar');
  bar.setAttribute('role', 'progressbar');
  bar.setAttribute('aria-label', m.hero.xpLine);
  bar.setAttribute('aria-valuemin', '0');
  bar.setAttribute('aria-valuemax', '100');
  bar.setAttribute('aria-valuenow', String(Math.round(m.hero.fraction * 100)));
  const fill = el(doc, 'span');
  fill.style.width = `${(m.hero.fraction * 100).toFixed(1)}%`;
  bar.append(fill);
  info.append(bar, el(doc, 'p', 'you-meta', m.hero.xpLine), el(doc, 'p', 'you-meta', m.streakLine),
    el(doc, 'p', 'you-meta', `${m.badgeLine} · ${m.trophyCount}`));
  if (m.hero.nextTrophy) info.append(el(doc, 'p', 'you-meta', `Next trophy: ${m.hero.nextTrophy.name} (${m.hero.nextTrophy.percent}%)`));
  const actions = el(doc, 'div', 'you-actions');
  const out = el(doc, 'span', 'you-share-out');
  out.setAttribute('aria-live', 'polite');
  if (!m.empty) {
    const btn = el(doc, 'button', 'you-btn', 'Share my level');
    btn.type = 'button';
    btn.addEventListener('click', () => share(doc, m, out));
    actions.append(btn);
  }
  const play = el(doc, 'a', 'you-btn alt', m.empty ? 'Pick a game' : 'Play something');
  play.href = '/#games';
  actions.append(play, out);
  box.append(lv, info, actions);
  return box;
}

function cabinet(doc, m) {
  const ul = el(doc, 'ul', 'you-trophies');
  for (const t of m.trophies) {
    const li = el(doc, 'li', t.unlocked ? 'you-trophy' : 'you-trophy locked');
    
    
    
    const art = el(doc, 'div', 'cup');
    art.innerHTML = trophySvg({ id: t.id, unlocked: t.unlocked }, { size: 56 });
    li.append(art, el(doc, 'b', null, t.name),
      el(doc, 'span', null, t.unlocked ? 'Earned' : `${t.percent}% there`));
    li.setAttribute('aria-label', `${t.name}: ${t.unlocked ? 'earned' : `locked, ${t.percent}% there`}`);
    ul.append(li);
  }
  return ul;
}

function gamesTable(doc, m) {
  const table = el(doc, 'table', 'you-games');
  const head = el(doc, 'tr');
  for (const [h, opt] of [['Game'], ['Played'], ['Won'], ['Time', 1], ['Mastery', 1], ['Rating']]) {
    const th = el(doc, 'th', opt ? 'opt' : null, h);
    th.scope = 'col';
    head.append(th);
  }
  const thead = el(doc, 'thead'); thead.append(head);
  const tbody = el(doc, 'tbody');
  for (const g of m.games) {
    const tr = el(doc, 'tr');
    const rating = el(doc, 'td', null, g.rating ?? '-');
    if (g.ratingLine) rating.append(el(doc, 'small', null, g.ratingLine));
    tr.append(el(doc, 'td', null, g.name), el(doc, 'td', null, g.plays), el(doc, 'td', null, g.wins ?? '-'),
      el(doc, 'td', 'opt', g.timeLine ?? '-'), el(doc, 'td', 'opt', `${g.mastery} / 10`), rating);
    tbody.append(tr);
  }
  table.append(thead, tbody);
  return table;
}


export function mountYouPage(root, { nowMs = Date.now() } = {}) {
  const doc = root?.ownerDocument ?? globalThis.document;
  if (!root || !doc) return null;
  try {
    injectStyle(doc);
    const m = youModel(readYou(nowMs));
    const parts = [hero(doc, m)];
    if (m.empty) {
      const e = el(doc, 'p', 'you-empty', 'Nothing here yet. Every game on this site counts towards one level: finish a match of anything and come back.');
      parts.push(e);
    }
    parts.push(el(doc, 'h2', null, 'Trophy cabinet'), cabinet(doc, m));
    if (m.games.length) parts.push(el(doc, 'h2', null, 'Your games'), gamesTable(doc, m));
    parts.push(el(doc, 'h2', null, 'Badges, sign-in and sync'));
    const card = el(doc, 'div', 'you-panel-card');
    parts.push(card);
    root.replaceChildren(...parts);
    mountProfilePanel(card);
    return m;
  } catch {
    root.textContent = 'Your progress could not be read on this device.';
    return null;
  }
}
