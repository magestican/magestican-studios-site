














































































import { loadCareer, leaderboard } from '../stats/careerStats.js';
import { fetchTopPlayers, isGlobalEnabled } from '../stats/firebaseLeaderboard.js';




export const BOARD_LIMIT = 20;




export const CHARACTER_EMOJI = Object.freeze({
  cow: '\u{1F404}', chicken: '\u{1F413}', pig: '\u{1F416}', sheep: '\u{1F411}',
});
export const CHARACTER_NAME = Object.freeze({
  cow: 'Cow', chicken: 'Chicken', pig: 'Pig', sheep: 'Sheep',
});



export const UNKNOWN_CHARACTER_GLYPH = '–';


export const FLAG_GLYPH = '\u{1F6A9}';






export const GLOBAL_CLAIM_PATTERN =
  /\b(worldwide|global|globally|internet|everyone|everybody|planet|all\s+players|the\s+world|across\s+the\s+web)\b/i;






export function scopeCopy(scope) {
  if (scope === 'global') {
    return Object.freeze({
      badge: 'WORLDWIDE',
      matchesLabel: 'matches played worldwide',
      topLabel: 'top player worldwide',
      boardNote: 'Everyone who has ever played Team Bonding, worldwide.',
    });
  }
  return Object.freeze({
    badge: 'THIS DEVICE',
    matchesLabel: 'matches played in this browser',
    topLabel: 'your best player so far',
    
    
    
    
    boardNote: 'Counted in this browser only. Nobody else’s games are in these '
      + 'numbers, and none of them have left your device. A shared online board '
      + 'is not switched on yet.',
  });
}





const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function tile(key, { value, label, scope, glyph = null, sub = null }) {
  return { key, value: String(value), label, scope, glyph, sub };
}









const own = (map, key) =>
  (typeof key === 'string' && Object.prototype.hasOwnProperty.call(map, key)) ? map[key] : null;

export function boardRow(row, index, { myName = '' } = {}) {
  const character = own(CHARACTER_EMOJI, row?.character) ? row.character : null;
  const kills = Number(row?.kills) || 0;
  const deaths = Number(row?.deaths) || 0;
  return {
    rank: index + 1,
    name: String(row?.name ?? ''),
    character,
    glyph: own(CHARACTER_EMOJI, character) ?? UNKNOWN_CHARACTER_GLYPH,
    
    
    characterName: own(CHARACTER_NAME, character) ?? 'unknown',
    kills, deaths,
    wins: Number(row?.wins) || 0,
    ratio: (kills / Math.max(1, deaths)).toFixed(2),
    isMe: !!myName && String(row?.name ?? '').toLowerCase() === String(myName).toLowerCase(),
  };
}








export function summaryModel({
  career = null, globalRows = null, globalMatches = null, globalEnabled = false,
} = {}) {
  const matches = Number(career?.matches) || 0;
  const localTop = leaderboard(career ?? {}, { limit: 1 })[0] ?? null;

  
  
  
  
  const topIsGlobal = !!(globalEnabled && Array.isArray(globalRows) && globalRows.length);
  const matchesIsGlobal = !!(globalEnabled && Number.isFinite(globalMatches));

  const top = topIsGlobal ? boardRow(globalRows[0], 0) : (localTop ? boardRow(localTop, 0) : null);
  const matchesScope = matchesIsGlobal ? 'global' : 'device';
  const topScope = topIsGlobal ? 'global' : 'device';

  return {
    matchesScope,
    topScope,
    
    
    badge: scopeCopy(topScope === 'global' || matchesScope === 'global' ? 'global' : 'device').badge,
    matches: tile('matches', {
      value: matchesIsGlobal ? globalMatches : matches,
      label: scopeCopy(matchesScope).matchesLabel,
      scope: matchesScope,
    }),
    top: tile('top', {
      value: top ? top.name : UNKNOWN_CHARACTER_GLYPH,
      label: scopeCopy(topScope).topLabel,
      scope: topScope,
      glyph: top ? top.glyph : null,
      sub: top ? `${plural(top.kills, 'kill')} · ${plural(top.wins, 'win')}`
               : 'no finished matches yet',
    }),
    empty: !top && matches === 0,
    hint: 'Tap for the full board',
  };
}


export function boardModel({
  career = null, globalRows = null, globalEnabled = false, myName = '', limit = BOARD_LIMIT,
} = {}) {
  const useGlobal = !!(globalEnabled && Array.isArray(globalRows) && globalRows.length);
  const source = useGlobal ? globalRows : leaderboard(career ?? {}, { limit });
  const scope = useGlobal ? 'global' : 'device';
  const copy = scopeCopy(scope);
  return {
    scope,
    badge: copy.badge,
    note: copy.boardNote,
    title: 'ALL-TIME LEADERBOARD',
    matchesLine: `${Number(career?.matches) || 0} ${scopeCopy('device').matchesLabel}`,
    rows: source.slice(0, limit).map((r, i) => boardRow(r, i, { myName })),
    
    
    
    limitNote: `Top ${limit} players`,
    emptyText: 'No finished matches yet — play a round and you will be on here.',
  };
}





const node = (tag, cls, extra = {}) => ({ tag, cls, ...extra });

export function buildSummaryTree(model) {
  return node('div', 'tblb-chip', {
    attrs: { role: 'button', tabindex: '0', 'aria-label': 'Open the all-time leaderboard' },
    children: [
      node('div', 'tblb-chip-head', {
        children: [
          node('span', 'tblb-chip-title', { text: 'ALL-TIME' }),
          node('span', 'tblb-badge', { text: model.badge }),
        ],
      }),
      node('div', 'tblb-chip-stats', {
        children: [
          node('div', 'tblb-stat', {
            children: [
              node('div', 'tblb-stat-value', { text: model.matches.value }),
              node('div', 'tblb-stat-label', { text: model.matches.label }),
            ],
          }),
          node('div', 'tblb-stat tblb-stat-top', {
            children: [
              node('div', 'tblb-stat-value', {
                children: [
                  node('span', 'tblb-glyph', {
                    text: model.top.glyph ?? UNKNOWN_CHARACTER_GLYPH,
                    attrs: { 'aria-hidden': 'true' },
                  }),
                  
                  
                  node('span', 'tblb-stat-name', { text: model.top.value }),
                ],
              }),
              node('div', 'tblb-stat-sub', { text: model.top.sub }),
              node('div', 'tblb-stat-label', { text: model.top.label }),
            ],
          }),
        ],
      }),
      node('div', 'tblb-chip-hint', { text: model.hint }),
    ],
  });
}

export function buildPanelTree(model) {
  const header = node('div', 'tblb-head', {
    children: [
      node('div', 'tblb-head-text', {
        children: [
          node('span', 'tblb-title', { text: model.title }),
          node('span', 'tblb-badge', { text: model.badge }),
        ],
      }),
      node('button', 'tblb-close', {
        text: '×',
        attrs: { type: 'button', 'aria-label': 'Close the leaderboard' },
      }),
    ],
  });

  const labels = node('tr', 'tblb-labels', {
    children: [
      node('th', 'tblb-rank', { text: '#' }),
      node('th', 'tblb-char', { text: '' }),
      node('th', 'tblb-name', { text: 'PLAYER' }),
      node('th', 'tblb-num', { text: 'K' }),
      node('th', 'tblb-num', { text: 'D' }),
      node('th', 'tblb-num', { text: 'W' }),
      node('th', 'tblb-num', { text: 'K/D' }),
    ],
  });

  const body = model.rows.length
    ? model.rows.map((r) => node('tr', r.isMe ? 'tblb-row tblb-me' : 'tblb-row', {
      children: [
        node('td', 'tblb-rank', { text: String(r.rank) }),
        node('td', 'tblb-char', {
          text: r.glyph,
          attrs: { title: r.characterName, 'aria-label': r.characterName },
        }),
        node('td', 'tblb-name', { text: r.name }),
        node('td', 'tblb-num', { text: String(r.kills) }),
        node('td', 'tblb-num', { text: String(r.deaths) }),
        node('td', 'tblb-num', { text: String(r.wins) }),
        node('td', 'tblb-num', { text: r.ratio }),
      ],
    }))
    : [node('tr', 'tblb-row', {
      children: [node('td', 'tblb-empty', {
        text: model.emptyText, attrs: { colspan: '7' },
      })],
    })];

  return node('div', 'tblb-card', {
    attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'All-time leaderboard' },
    children: [
      header,
      
      
      
      
      node('div', 'tblb-scroll', {
        children: [node('table', 'tblb-table', {
          children: [node('tbody', null, { children: [labels, ...body] })],
        })],
      }),
      node('div', 'tblb-foot', {
        children: [
          node('p', 'tblb-limit', { text: `${model.limitNote} · ${model.matchesLine}` }),
          node('p', 'tblb-note', { text: model.note }),
        ],
      }),
    ],
  });
}



export function collectText(spec, out = []) {
  if (!spec) return out;
  if (Array.isArray(spec)) { for (const s of spec) collectText(s, out); return out; }
  if (typeof spec.text === 'string' && spec.text) out.push(spec.text);
  for (const [k, v] of Object.entries(spec.attrs || {})) {
    
    
    if (k === 'aria-label' || k === 'title') out.push(String(v));
  }
  for (const c of spec.children || []) collectText(c, out);
  return out;
}



export function renderTree(spec, doc) {
  const d = doc ?? (typeof document !== 'undefined' ? document : null);
  if (!d || !spec) return null;
  const el = d.createElement(spec.tag || 'div');
  if (spec.cls) el.setAttribute('class', spec.cls);
  for (const [k, v] of Object.entries(spec.attrs || {})) el.setAttribute(k, String(v));
  if (typeof spec.text === 'string') el.textContent = spec.text;
  for (const child of spec.children || []) {
    const c = renderTree(child, d);
    if (c) el.appendChild(c);
  }
  return el;
}

















export const LEADERBOARD_STYLES = `
.tblb-btn {
  position: fixed; z-index: 12;
  width: 48px; height: 48px; min-width: 48px; min-height: 48px;
  /* padding:0 and flex centring, not a margin nudge: a generic button padding
     rule otherwise pushes the glyph off-centre inside a fixed-size circle. */
  padding: 0; line-height: 1;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.35);
  background: rgba(0,0,0,0.55); color: #fff;
  font-size: 22px; cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  box-shadow: 0 4px 14px rgba(0,0,0,0.45);
}
.tblb-btn:active { background: rgba(244,201,93,0.7); }
.tblb-btn:focus-visible { outline: 2px solid #f4c95d; outline-offset: 2px; }
/* Under the settings button, in the same left-edge column, because every other
   corner is taken on a phone: top-right is the mute/gore/bot stack, top-centre
   is the score-pill ladder, bottom-right is FIRE/JUMP/weapons, and the whole
   left half is the look-and-joystick area that spawns wherever you touch it.
   The gap is settings' own 40px height plus 8. */
.tblb-btn-game {
  left: max(10px, env(safe-area-inset-left));
  top: calc(max(10px, env(safe-area-inset-top)) + 52px);
}
/* The studio site has no HUD to dodge, so the button sits bottom-right where a
   help bubble normally lives and nothing else is anchored. */
.tblb-btn-site {
  right: max(14px, env(safe-area-inset-right));
  bottom: max(14px, env(safe-area-inset-bottom));
}

.tblb-chip {
  position: fixed; z-index: 12;
  right: max(10px, env(safe-area-inset-right));
  width: min(300px, calc(100vw - 20px));
  background: rgba(8,11,17,0.93);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 12px;
  padding: 10px 12px 8px;
  box-shadow: 0 14px 40px rgba(0,0,0,0.6);
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  cursor: pointer; -webkit-tap-highlight-color: transparent;
}
.tblb-chip:focus-visible { outline: 2px solid #f4c95d; outline-offset: 2px; }
/* In the lobby it goes top-right, over the game-creation card, which is where
   it was asked for. On the studio site it goes ABOVE the flag button instead:
   measured at 1280px, a top-right chip lands on top of the page header (which
   ends at x=1092 while the chip starts at x=955) and covers the nav. */
.tblb-chip-game { top: max(10px, env(safe-area-inset-top)); }
.tblb-chip-site { bottom: calc(max(14px, env(safe-area-inset-bottom)) + 60px); }
.tblb-chip-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.tblb-chip-title { font: 800 11px/1 system-ui, sans-serif; letter-spacing: 0.14em; color: #f4c95d; }
.tblb-badge {
  font: 800 9px/1 system-ui, sans-serif; letter-spacing: 0.12em;
  color: #0f1420; background: #9fb2c8; border-radius: 999px; padding: 3px 7px;
  white-space: nowrap;
}
.tblb-chip-stats { display: flex; gap: 10px; margin-top: 8px; }
.tblb-stat { flex: 1 1 0; min-width: 0; }
.tblb-stat-value {
  font: 900 20px/1.1 system-ui, sans-serif; color: #fff;
  font-variant-numeric: tabular-nums;
  display: flex; align-items: center; gap: 5px; min-width: 0;
}
.tblb-stat-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tblb-glyph { font-size: 18px; line-height: 1; flex: 0 0 auto; }
.tblb-stat-sub { font: 700 10px/1.3 system-ui, sans-serif; color: #b9c8da; margin-top: 2px; }
.tblb-stat-label {
  font: 600 10px/1.3 system-ui, sans-serif; color: #8fa2b8; margin-top: 2px;
}
.tblb-chip-hint {
  margin-top: 8px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.10);
  font: 700 10px/1 system-ui, sans-serif; letter-spacing: 0.08em; color: #f4c95d;
}

.tblb-overlay {
  position: fixed; inset: 0; z-index: 88;
  display: none; align-items: center; justify-content: center;
  padding: max(12px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom));
  background: rgba(6,10,16,0.82);
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}
.tblb-overlay.tblb-open { display: flex; }
.tblb-card {
  background: rgba(8,11,17,0.97);
  border: 2px solid rgba(255,255,255,0.18);
  border-radius: 14px;
  box-shadow: 0 18px 60px rgba(0,0,0,0.75);
  width: min(560px, 100%);
  /* A COLUMN with a bounded height, so the header and the footnote stay put
     and only the list moves. min() rather than a flat vh because 78vh of a
     tall desktop window is a 900px-high card nobody asked for. */
  max-height: min(78vh, 620px);
  display: flex; flex-direction: column; min-height: 0;
  color: #dbe6f3;
}
.tblb-head {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.12);
  flex: 0 0 auto;
}
.tblb-head-text { display: flex; align-items: baseline; gap: 8px; min-width: 0; flex-wrap: wrap; }
.tblb-title { font: 800 13px/1.2 system-ui, sans-serif; letter-spacing: 0.12em; color: #f4c95d; }
.tblb-close {
  flex: 0 0 auto;
  width: 44px; height: 44px; min-width: 44px;
  padding: 0; line-height: 1;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%; border: 1px solid rgba(255,255,255,0.25);
  background: rgba(255,255,255,0.06); color: #dbe6f3;
  font: 400 24px/1 system-ui, sans-serif; cursor: pointer;
  -webkit-tap-highlight-color: transparent; touch-action: manipulation;
}
.tblb-close:active { background: rgba(244,201,93,0.6); }
.tblb-close:focus-visible { outline: 2px solid #f4c95d; outline-offset: 2px; }
.tblb-scroll {
  flex: 1 1 auto; min-height: 0;
  overflow-y: auto; overflow-x: hidden;
  -webkit-overflow-scrolling: touch;   /* momentum on iOS Safari */
  overscroll-behavior: contain;        /* never scroll the page behind it */
}
.tblb-scroll::-webkit-scrollbar { width: 8px; }
.tblb-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.22); border-radius: 4px; }
.tblb-table { width: 100%; border-collapse: collapse; }
.tblb-table th, .tblb-table td { padding: 6px 8px; font-size: 13px; }
.tblb-labels th {
  position: sticky; top: 0; background: #121824; z-index: 1;
  color: #8fa2b8; font: 700 10px/1.6 system-ui, sans-serif; letter-spacing: 0.1em;
  text-align: right;
}
.tblb-labels th.tblb-rank, .tblb-labels th.tblb-char, .tblb-labels th.tblb-name { text-align: left; }
.tblb-row + .tblb-row td { border-top: 1px solid rgba(255,255,255,0.05); }
td.tblb-rank { color: #7f8798; width: 1%; white-space: nowrap; font-variant-numeric: tabular-nums; }
td.tblb-char { width: 1%; white-space: nowrap; font-size: 18px; line-height: 1; }
td.tblb-name {
  color: #dbe6f3; font-weight: 700;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 1px; width: 99%;
}
td.tblb-num { text-align: right; color: #b9c8da; font-variant-numeric: tabular-nums; white-space: nowrap; }
.tblb-me td.tblb-name, .tblb-me td.tblb-num { color: #f4c95d; }
.tblb-empty { color: #7f8798; font-style: italic; padding: 14px 10px; text-align: center; }
.tblb-foot { flex: 0 0 auto; border-top: 1px solid rgba(255,255,255,0.10); padding: 8px 12px 10px; }
.tblb-limit { margin: 0 0 3px; font: 700 10px/1.3 system-ui, sans-serif;
  letter-spacing: 0.1em; color: #9fb2c8; }
.tblb-note { margin: 0; font: 400 11px/1.45 system-ui, sans-serif; color: #7f8798; }

@media (max-width: 480px) {
  /* 375px: the chip is a full-width bar rather than a 300px card wedged into
     a 375px screen next to nothing. The panel goes edge to edge and taller,
     because on a phone there is no "behind" worth showing. */
  .tblb-chip { left: max(10px, env(safe-area-inset-left)); width: auto; }
  /* The lobby chip clears the flag button's left-edge column on a phone by
     being a full-width bar under it rather than beside it. */
  .tblb-chip-game { top: calc(max(10px, env(safe-area-inset-top)) + 110px); }
  .tblb-card { max-height: 86vh; width: 100%; }
  .tblb-table th, .tblb-table td { padding: 7px 6px; font-size: 12px; }
  td.tblb-char { font-size: 16px; }
}
@media (prefers-reduced-motion: no-preference) {
  .tblb-overlay.tblb-open .tblb-card { animation: tblbIn 0.14s ease-out; }
  @keyframes tblbIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
}
`;

export function injectLeaderboardStyles(doc) {
  const d = doc ?? (typeof document !== 'undefined' ? document : null);
  if (!d || d.getElementById('tblb-styles')) return;
  const s = d.createElement('style');
  s.id = 'tblb-styles';
  
  s.textContent = LEADERBOARD_STYLES;
  (d.head ?? d.body)?.appendChild(s);
}
















export function mountLeaderboard({
  doc = (typeof document !== 'undefined' ? document : null),
  place = 'site',
  showChip = true,
  myName = '',
  storage = (typeof localStorage !== 'undefined' ? localStorage : null),
  globalEnabled = null,
  fetchTop = fetchTopPlayers,
  limit = BOARD_LIMIT,
} = {}) {
  if (!doc || !doc.body) return null;
  injectLeaderboardStyles(doc);

  const useGlobal = globalEnabled === null ? isGlobalEnabled() : !!globalEnabled;
  let globalRows = null;
  let open = false;

  const btn = doc.createElement('button');
  btn.setAttribute('type', 'button');
  btn.setAttribute('class', `tblb-btn tblb-btn-${place === 'game' ? 'game' : 'site'}`);
  btn.setAttribute('aria-label', 'Open the all-time leaderboard');
  btn.setAttribute('title', 'All-time leaderboard');
  btn.textContent = FLAG_GLYPH;
  doc.body.appendChild(btn);

  const chipHost = doc.createElement('div');
  chipHost.setAttribute('class', 'tblb-chip-host');
  const chipPlacement = place === 'game' ? 'tblb-chip-game' : 'tblb-chip-site';
  if (!showChip) chipHost.style.display = 'none';
  doc.body.appendChild(chipHost);

  const overlay = doc.createElement('div');
  overlay.setAttribute('class', 'tblb-overlay');
  doc.body.appendChild(overlay);

  const career = () => loadCareer(storage);

  const paintChip = () => {
    const model = summaryModel({
      career: career(), globalRows, globalMatches: null, globalEnabled: useGlobal,
    });
    chipHost.textContent = '';
    const el = renderTree(buildSummaryTree(model), doc);
    if (el) {
      el.setAttribute('class', `tblb-chip ${chipPlacement}`);
      el.addEventListener('click', () => api.open());
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); api.open(); }
      });
      chipHost.appendChild(el);
    }
  };

  const paintPanel = () => {
    const model = boardModel({
      career: career(), globalRows, globalEnabled: useGlobal, myName, limit,
    });
    overlay.textContent = '';
    const el = renderTree(buildPanelTree(model), doc);
    if (!el) return;
    el.querySelector('.tblb-close')?.addEventListener('click', () => api.close());
    overlay.appendChild(el);
  };

  
  
  
  overlay.addEventListener('click', (e) => { if (e.target === overlay) api.close(); });
  btn.addEventListener('click', () => api.toggle());

  
  
  
  const loadGlobal = async () => {
    if (!useGlobal || globalRows) return;
    try {
      const rows = await fetchTop(limit);
      if (rows && rows.length) { globalRows = rows; paintPanel(); paintChip(); }
    } catch (_) {  }
  };

  const api = {
    isOpen: () => open,
    open() {
      if (open) return;
      open = true;
      paintPanel();
      overlay.classList.add('tblb-open');
      overlay.querySelector('.tblb-close')?.focus?.();
      loadGlobal();
    },
    close() {
      if (!open) return;
      open = false;
      overlay.classList.remove('tblb-open');
    },
    toggle() { open ? api.close() : api.open(); },
    refresh() { paintChip(); if (open) paintPanel(); },
    setChipVisible(v) { chipHost.style.display = v ? '' : 'none'; },
    element: () => overlay,
    button: () => btn,
    destroy() { btn.remove(); chipHost.remove(); overlay.remove(); },
  };

  paintChip();
  return api;
}
