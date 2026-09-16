









import { TOOLS, TOOL_NAMES } from 'moon/play/tools.mjs';


const CHIP_TEXT = Object.freeze({ shovel: 'Shovel', axe: 'Axe', pickaxe: 'Pickaxe', wateringCan: 'Can' });
const ICON_PX = 80; 

export function createToolBar({ el, onChoose, iconFor = null }) {
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
  el.replaceChildren(...buttons.values());
  
  
  
  el.hidden = true;

  const stats = { active: null, chosen: null, taps: 0, icons: 0, visible: false };
  let sig = null;

  
  function update(active, chosen) {
    const s = `${active}|${chosen}`;
    if (s === sig) return;
    sig = s;
    for (const [tool, b] of buttons) {
      b.classList.toggle('on', tool === active);
      b.classList.toggle('chosen', tool === chosen);
      b.setAttribute('aria-pressed', String(tool === active));
    }
    stats.active = active;
    stats.chosen = chosen;
  }

  
  function setVisible(visible) {
    const want = !visible;
    if (el.hidden !== want) el.hidden = want;
    stats.visible = Boolean(visible);
  }

  return { update, setVisible, stats };
}
