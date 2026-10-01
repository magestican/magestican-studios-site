





















































export const CARD_STATE_KEY = 'fmlCard';











export const SETTLE_FRAMES = 4;

export function createCardBack({ history, panels = [] }) {
  let armed = false;
  let closing = 0;
  
  
  let order = [];
  const stats = { pushes: 0, closes: 0, unwinds: 0, ignored: 0, stranded: 0, last: null, open: [] };

  const openNow = () => panels.filter((p) => Boolean(p.isOpen()));

  
  function sync() {
    const open = openNow();
    for (const p of open) if (!order.includes(p.name)) order.push(p.name);
    order = order.filter((n) => open.some((p) => p.name === n));
    stats.open = order.slice();
    if (closing > 0) {
      closing -= 1;
      if (closing === 0) stats.stranded += 1;
      return;
    }
    if (open.length && !armed) {
      armed = true;
      stats.pushes += 1;
      history.pushState({ [CARD_STATE_KEY]: true }, '');
    } else if (!open.length && armed) {
      armed = false;
      closing = SETTLE_FRAMES;
      stats.unwinds += 1;
      history.back();
    }
  }

  



  function popped() {
    if (closing > 0) { closing = 0; return 'unwound'; }
    if (!armed) { stats.ignored += 1; return null; }
    armed = false;
    const name = order[order.length - 1];
    const panel = panels.find((p) => p.name === name && p.isOpen());
    if (!panel) return null;
    panel.hide();
    order = order.filter((n) => n !== name);
    stats.closes += 1;
    stats.last = name;
    
    
    stats.open = order.slice();
    return name;
  }

  return {
    sync,
    popped,
    stats,
    get armed() { return armed; },
    get open() { return order.slice(); },
  };
}
