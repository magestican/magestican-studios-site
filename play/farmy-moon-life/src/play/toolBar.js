



















import { TOOLS, TOOL_NAMES } from 'moon/play/tools.mjs';
import { glyphTool } from 'moon/play/corners.mjs';


const CHIP_TEXT = Object.freeze({ shovel: 'Shovel', axe: 'Axe', pickaxe: 'Pickaxe', wateringCan: 'Can' });
const ICON_PX = 80; 
const GLYPH_PX = 64; 

export function createToolBar({ el, onChoose, onToggle = () => {}, iconFor = null }) {
  const stats = { active: null, chosen: null, glyph: null, taps: 0, icons: 0, visible: false, open: false, opens: 0 };

  
  
  
  
  
  const glyph = document.createElement('button');
  glyph.type = 'button';
  glyph.id = 'toolglyph';
  glyph.className = 'glyph';
  glyph.setAttribute('aria-haspopup', 'true');
  glyph.setAttribute('aria-expanded', 'false');
  const glyphText = document.createElement('span');
  glyphText.className = 'name';
  glyph.append(glyphText);
  const glyphIcons = new Map();
  if (iconFor) {
    for (const tool of TOOLS) {
      const c = document.createElement('canvas');
      c.width = c.height = GLYPH_PX;
      c.className = 'icon';
      c.hidden = true;
      glyph.append(c);
      glyphIcons.set(tool, c);
      Promise.resolve(iconFor(tool, { size: GLYPH_PX })).then((src) => {
        c.getContext('2d').drawImage(src, 0, 0, GLYPH_PX, GLYPH_PX);
        c.dataset.drawn = '1';
        stats.icons += 1;
        if (stats.glyph === tool) showGlyph(tool);
      }).catch(() => {}); 
    }
  }
  
  
  
  glyph.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle();
  });

  
  const tray = document.createElement('div');
  tray.className = 'tray';
  tray.id = 'tooltray';
  tray.hidden = true;
  tray.addEventListener('pointerdown', (e) => e.stopPropagation());
  tray.addEventListener('pointerup', (e) => e.stopPropagation());

  const buttons = new Map();
  for (const tool of TOOLS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tool';
    b.dataset.tool = tool;
    b.setAttribute('aria-label', TOOL_NAMES[tool]);
    b.setAttribute('aria-pressed', 'false');
    b.title = TOOL_NAMES[tool];
    const name = document.createElement('span');
    name.textContent = CHIP_TEXT[tool];
    b.append(name);
    if (iconFor) {
      Promise.resolve(iconFor(tool, { size: ICON_PX })).then((src) => {
        const c = document.createElement('canvas');
        c.width = c.height = ICON_PX;
        c.className = 'icon';
        c.getContext('2d').drawImage(src, 0, 0, ICON_PX, ICON_PX);
        name.replaceWith(c);
        stats.icons += 1;
      }).catch(() => {}); 
    }
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      stats.taps += 1;
      onChoose(tool);
    });
    buttons.set(tool, b);
  }
  tray.replaceChildren(...buttons.values());
  el.replaceChildren(glyph, tray);
  
  
  
  
  
  el.hidden = true;

  let sig = null, last = null;

  function showGlyph(tool) {
    for (const [t, c] of glyphIcons) c.hidden = t !== tool || c.dataset.drawn !== '1';
    const drawn = glyphIcons.get(tool);
    glyphText.hidden = Boolean(drawn && drawn.dataset.drawn === '1');
    glyphText.textContent = CHIP_TEXT[tool] || '';
    glyph.dataset.tool = tool || '';
    glyph.setAttribute('aria-label', tool ? `Tools - ${TOOL_NAMES[tool]}` : 'Tools');
    glyph.title = glyph.getAttribute('aria-label');
  }

  
  function update(active, chosen) {
    const s = `${active}|${chosen}`;
    if (s === sig) return;
    sig = s;
    for (const [tool, b] of buttons) {
      b.classList.toggle('on', tool === active);
      b.classList.toggle('chosen', tool === chosen);
      b.setAttribute('aria-pressed', String(tool === active));
    }
    const worn = glyphTool(TOOLS, { active, chosen, last });
    if (active || chosen) last = chosen || active;
    stats.active = active;
    stats.chosen = chosen;
    if (worn !== stats.glyph) { stats.glyph = worn; showGlyph(worn); }
  }

  
  function setVisible(visible) {
    const want = !visible;
    if (el.hidden !== want) el.hidden = want;
    stats.visible = Boolean(visible);
  }

  
  function setOpen(open) {
    const next = Boolean(open);
    if (next === stats.open) return;
    if (next) stats.opens += 1;
    stats.open = next;
    tray.hidden = !next;
    glyph.classList.toggle('on', next);
    glyph.setAttribute('aria-expanded', String(next));
  }

  update(null, null);
  return { update, setVisible, setOpen, get isOpen() { return stats.open; }, stats };
}
