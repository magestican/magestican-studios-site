









import { SPECIES, EXTRA, BOSSES } from '../../data/species.js';

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
export function parseCheat(search) {
  const raw = new URLSearchParams(search).get('cheat');
  if (!raw) return null;
  const c = { chapter: null, at: null, party: [], boss: null, items: null, errors: [] };
  for (const part of raw.split(';').map((s) => s.trim()).filter(Boolean)) {
    const i = part.indexOf(':'), key = (i < 0 ? part : part.slice(0, i)).toLowerCase(), val = i < 0 ? '' : part.slice(i + 1);
    if (key === 'chapter') c.chapter = Math.max(1, Math.min(8, Number(val) || 1));
    else if (key === 'at') { const [region, section] = val.split(':'); c.at = { region, section: section || null }; }
    else if (key === 'party') for (const m of val.split(',')) {
      const [name, lvl] = m.split('@'), s = findSpecies(name);
      if (s) c.party.push({ sp: s.id, lvl: Math.max(1, Math.min(99, Number(lvl) || 5)) }); else c.errors.push('no dachi "' + name + '"');
    }
    else if (key === 'boss') { if (BOSSES.some((b) => b.id === val)) c.boss = val; else c.errors.push('no boss "' + val + '"'); }
    else if (key === 'items') c.items = Math.max(0, Number(val) || 0);
    else c.errors.push('unknown "' + key + '"');
  }
  return c;
}



export async function applyCheat(c, d) {
  const { G, S } = d, wait = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let i = 0; i < 120 && !S.W; i++) await wait(250);
  G.flags.cheat = true; 
  Object.assign(G.flags, chapterFlags(c.chapter || (c.boss ? ORDER.indexOf(c.boss) + 1 : 1)));
  for (const id of ['title', 'attract']) { const el = document.getElementById(id); if (el) el.classList.add('hidden'); }
  const hud = document.getElementById('hud'); if (hud) hud.classList.remove('hidden');
  G.mode = 'world';
  if (c.party.length) { G.party.length = 0; G.box.length = 0; for (const p of c.party) d.addDachi(d.makeDachi(p.sp, p.lvl)); }
  else if (!G.party.length) d.addDachi(d.makeDachi(202, 12));
  if (c.items !== null) for (const k of Object.keys(G.items)) G.items[k] = c.items;
  d.healParty();
  if (c.at && d.regionById(c.at.region)) {
    await d.loadRegion(c.at.region);
    const s = c.at.section && d.sectionById(c.at.section);
    if (s) { const [x, y] = d.fromUV((s.rect.u[0] + s.rect.u[1]) / 2, (s.rect.v[0] + s.rect.v[1]) / 2); G.player.x = x; G.player.y = y; G.follower.x = x + 0.8; G.follower.y = y; }
  } else if (c.at) c.errors.push('no region "' + c.at.region + '"');
  for (let i = 0; i < 80 && S.cover && S.cover.hold; i++) await wait(100);
  G.safeTimer = 3;
  
  for (let i = 0; i < 15 && !S.dialog.active; i++) await wait(100);
  while (S.dialog.active) { S.dialog.hide(); await wait(150); }
  if (c.boss) d.startBossBattle(c.boss, { x: G.player.x + 2, y: G.player.y + 2 });
  d.toast('CHEAT' + (c.errors.length ? ': ' + c.errors.join(', ') : ' on - this run is not saved'), 3200);
}
