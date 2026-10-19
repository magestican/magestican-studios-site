


const svg = (body) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;


export const LEVER_ICON = svg(
  '<path d="M4 21h16"/><path d="M12 21v-4"/><path d="M12 17l5-11"/><circle cx="17.5" cy="5" r="2"/><path d="M5 17l7-3 7 3"/>',
);


export const KEY_ICON = svg('<circle cx="7" cy="12" r="4"/><path d="M11 12h10"/><path d="M17 12v3"/><path d="M20 12v4"/>');


export const SHELL_ICON = svg('<path d="M4 15a8 8 0 0 1 16 0z"/><path d="M8 15c0-3 1.8-6 4-6s4 3 4 6"/><path d="M12 9v6"/>');


export const SPARK_ICON = svg('<circle cx="10" cy="14" r="6"/><circle cx="10" cy="14" r="1.5"/><path d="M17 3l-2 4h4l-2 4"/>');
