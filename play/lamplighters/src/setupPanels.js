




export function setupPanels({ inRoom, panel }) {
  if (inRoom) return { launch: false, options: true, rival: false, friend: false, roomLive: true };
  const options = panel === 'options';
  return { launch: true, options, rival: options, friend: panel === 'friend', roomLive: false };
}


export const togglePanel = (panel, which) => (panel === which ? null : which);
