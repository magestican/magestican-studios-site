





export function escapeGoesHome({ mode, screen }) {
  return Boolean(mode) || (screen != null && screen !== 'hub');
}




export function pickFocus(buttons) {
  const list = [...buttons].filter((b) => b && !b.hidden && !b.disabled);
  const isHome = (b) => b.hasAttribute?.('data-home') || b.id === 'home';
  return list.find((b) => b.classList?.contains('aj-next') && !isHome(b))
    || list.find((b) => !isHome(b))
    || null;
}
