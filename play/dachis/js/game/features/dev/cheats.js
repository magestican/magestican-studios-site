












import { SPECIES, EXTRA, BOSSES } from '../../data/species.js';
import { earned, unlock } from '../achievements/achievements.js';

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
export function findSpecies(key) {
  
  const all = [...SPECIES, ...EXTRA.filter((s) => !s.storyOnly)];
  if (/^\d+$/.test(String(key))) return all.find((s) => s.id === Number(key)) || null;
  const k = norm(key);
  return all.find((s) => norm(s.name) === k) || null;
}
const ORDER = ['ashlo', 'leviathrum', 'bramble', 'kingshade', 'quartz', 'glacius', 'pyrecrown', 'oblivar'];

export function chapterFlags(n) {
  const f = { started: true, starter: true, initiated: true, kumabo: true };
  for (let i = 0; i < Math.min(ORDER.length, n - 1); i++) f['boss_' + ORDER[i]] = true;
  return f;
}


export function silenceEarned(flags) {
  const ids = earned(flags);
  for (const id of ids) unlock(flags, id, 1);
  return ids;
}
export function parseCheat(search) {
  const raw = new URLSearchParams(search).get('cheat');
  if (!raw) return null;
  const c = { chapter: null, at: null, party: [], boss: null, items: null, watch: null, errors: [] };
  for (const part of raw.split(';').map((s) => s.trim()).filter(Boolean)) {
    const i = part.indexOf(':'), key = (i < 0 ? part : part.slice(0, i)).toLowerCase(), val = i < 0 ? '' : part.slice(i + 1);
    if (key === 'chapter') c.chapter = Math.max(1, Math.min(8, Number(val) || 1));
    else if (key === 'at') { const [where, xy] = val.split('@'), [region, section] = where.split(':'); c.at = { region, section: section || null, xy: xy ? xy.split(',').map(Number) : null }; }
    else if (key === 'party') for (const m of val.split(',')) {
      const [who, coat] = m.split('*'), [name, lvl] = who.split('@'), s = findSpecies(name); 
      if (s) c.party.push({ sp: s.id, lvl: Math.max(1, Math.min(99, Number(lvl) || 5)), ...(coat === 'gold' || coat === 'white' ? { shiny: coat } : {}) }); else c.errors.push('no dachi "' + name + '"');
    }
    else if (key === 'boss') { if (BOSSES.some((b) => b.id === val)) c.boss = val; else c.errors.push('no boss "' + val + '"'); }
    else if (key === 'items') c.items = Math.max(0, Number(val) || 0);
    else if (key === 'watch') { if (BOSSES.some((b) => b.id === val)) c.watch = val; else c.errors.push('no boss "' + val + '"'); }
    else c.errors.push('unknown "' + key + '"');
  }
  return c;
}



export async function applyCheat(c, d) {
  const { G, S } = d, wait = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let i = 0; i < 120 && !S.W; i++) await wait(250);
  G.flags.cheat = true; 
  Object.assign(G.flags, chapterFlags(c.chapter || (c.boss ? ORDER.indexOf(c.boss) + 1 : 1)));
  silenceEarned(G.flags);
  for (const id of ['title', 'attract']) { const el = document.getElementById(id); if (el) el.classList.add('hidden'); }
  const hud = document.getElementById('hud'); if (hud) hud.classList.remove('hidden');
  G.mode = 'world';
  if (c.party.length) { G.party.length = 0; G.box.length = 0; for (const p of c.party) { const x = d.makeDachi(p.sp, p.lvl); if (p.shiny) { x.shiny = p.shiny; x.hp = d.statsOf ? d.statsOf(x).maxHp : x.hp; } d.addDachi(x); } }
  else if (!G.party.length) d.addDachi(d.makeDachi(202, 12));
  if (c.items !== null) for (const k of Object.keys(G.items)) G.items[k] = c.items;
  d.healParty();
  if (c.at && d.regionById(c.at.region)) {
    await d.loadRegion(c.at.region);
    const s = c.at.section && d.sectionById(c.at.section);
    if (s || c.at.xy) {
      let [x, y] = c.at.xy || d.fromUV((s.rect.u[0] + s.rect.u[1]) / 2, (s.rect.v[0] + s.rect.v[1]) / 2);
      
      const W = S.W, ok = (px, py) => W.walkable(px, py, 0.3) && W.reach[W.idx(Math.floor(px), Math.floor(py))];
      if (!ok(x, y)) search: for (let r = 0.5; r < 14; r += 0.5) for (let k = 0; k < 24; k++) { const px = x + Math.sin(k / 24 * 6.283) * r, py = y + Math.cos(k / 24 * 6.283) * r; if (ok(px, py)) { x = px; y = py; break search; } }
      G.player.x = x; G.player.y = y; G.follower.x = x + 0.8; G.follower.y = y;
    }
  } else if (c.at) c.errors.push('no region "' + c.at.region + '"');
  for (let i = 0; i < 80 && S.cover && S.cover.hold; i++) await wait(100);
  G.safeTimer = 3;
  
  for (let i = 0; i < 15 && !S.dialog.active; i++) await wait(100);
  while (S.dialog.active) { S.dialog.hide(); await wait(150); }
  if (c.watch && d.startWatcher) d.startWatcher(c.watch, () => {}, { force: true });
  if (c.boss) d.startBossBattle(c.boss, { x: G.player.x + 2, y: G.player.y + 2 });
  d.toast('CHEAT' + (c.errors.length ? ': ' + c.errors.join(', ') : ' on - this run is not saved'), 3200);
}
