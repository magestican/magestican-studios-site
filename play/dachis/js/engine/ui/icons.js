








const P = {
  sword: '<path d="M13.5 1.5 L14.5 2.5 L6.8 10.2 L5.8 9.2 Z"/><path d="M3.2 9.6 L6.4 12.8 L5.6 13.6 L4.6 12.6 L2.6 14.6 L1.4 13.4 L3.4 11.4 L2.4 10.4 Z"/>',
  guard: '<path d="M8 1 L15 8 L8 15 L1 8 Z"/>',
  away: '<path d="M2 3 L4.5 3 L9.5 8 L4.5 13 L2 13 L7 8 Z"/><path d="M7.5 3 L10 3 L15 8 L10 13 L7.5 13 L12.5 8 Z"/>',
  bolt: '<path d="M9.5 1 L3 9 L7.5 9 L6 15 L13 6.5 L8.5 6.5 Z"/>',
  swap: '<path d="M1 5 L5 1.5 L5 3.8 L14 3.8 L14 6.2 L5 6.2 L5 8.5 Z"/><path d="M15 11 L11 7.5 L11 9.8 L2 9.8 L2 12.2 L11 12.2 L11 14.5 Z"/>',
  heart: '<path d="M8 14.5 C3 10.8 1 8.2 1 5.4 C1 3.1 2.8 1.5 4.8 1.5 C6.2 1.5 7.3 2.3 8 3.4 C8.7 2.3 9.8 1.5 11.2 1.5 C13.2 1.5 15 3.1 15 5.4 C15 8.2 13 10.8 8 14.5 Z"/>',
  heartOutline: '<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M8 13.4 C3.6 10.1 2 7.9 2 5.6 C2 3.8 3.4 2.6 4.9 2.6 C6.2 2.6 7.3 3.4 8 4.7 C8.7 3.4 9.8 2.6 11.1 2.6 C12.6 2.6 14 3.8 14 5.6 C14 7.9 12.4 10.1 8 13.4 Z"/>',
  star: '<path d="M8 1 L10.1 5.6 L15 6.1 L11.3 9.4 L12.4 14.3 L8 11.8 L3.6 14.3 L4.7 9.4 L1 6.1 L5.9 5.6 Z"/>',
  cup: '<path d="M2 5 L12 5 L11 13 C10.8 14.2 10 15 8.8 15 L5.2 15 C4 15 3.2 14.2 3 13 Z"/><path fill="none" stroke="currentColor" stroke-width="1.6" d="M11.6 6.8 C14.6 6.4 15.2 10.4 11.2 10.8"/><path fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" d="M5 3.5 C4.2 2.5 5.8 1.8 5 0.8 M8.5 3.5 C7.7 2.5 9.3 1.8 8.5 0.8"/>',
  close: '<path d="M3.2 1.8 L8 6.6 L12.8 1.8 L14.2 3.2 L9.4 8 L14.2 12.8 L12.8 14.2 L8 9.4 L3.2 14.2 L1.8 12.8 L6.6 8 L1.8 3.2 Z"/>',
  back: '<path d="M1 6 L6 1.5 L6 4.2 L10 4.2 C13 4.2 15 6.4 15 9.3 C15 12.2 13 14.5 10 14.5 L6.5 14.5 L6.5 12 L10 12 C11.6 12 12.6 10.8 12.6 9.3 C12.6 7.8 11.6 6.7 10 6.7 L6 6.7 L6 10.5 Z"/>',
  next: '<path d="M2 4 L14 4 L8 13 Z"/>',
  skip: '<path d="M1 2.5 L8 8 L1 13.5 Z"/><path d="M8 2.5 L15 8 L8 13.5 Z"/>',
  sparkle: '<path d="M8 0.5 L9.6 6.4 L15.5 8 L9.6 9.6 L8 15.5 L6.4 9.6 L0.5 8 L6.4 6.4 Z"/>',
  flower: '<circle cx="8" cy="3.6" r="2.6"/><circle cx="12.2" cy="6.8" r="2.6"/><circle cx="10.6" cy="11.8" r="2.6"/><circle cx="5.4" cy="11.8" r="2.6"/><circle cx="3.8" cy="6.8" r="2.6"/><circle cx="8" cy="8" r="2" fill="#fff6c8"/>',
  egg: '<path d="M8 1 C11.2 1 13.5 6 13.5 9.6 C13.5 12.8 11.1 15 8 15 C4.9 15 2.5 12.8 2.5 9.6 C2.5 6 4.8 1 8 1 Z"/>',
};

export const ICON_NAMES = Object.keys(P);

export function icon(name, cls = '') {
  const body = P[name];
  if (!body) throw new Error('unknown icon ' + name);
  return `<svg class="ic ic-${name}${cls ? ' ' + cls : ''}" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false">${body}</svg>`;
}

export function hydrateIcons(root = document) {
  for (const el of root.querySelectorAll('i[data-icon]')) el.outerHTML = icon(el.dataset.icon);
}
