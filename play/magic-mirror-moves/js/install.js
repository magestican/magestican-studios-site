








export function installSteps(kind) {
  const first = {
    apple: 'Tap the Share button, the square with an arrow.',
    android: 'Tap the three dots in the top corner.',
    chrome: 'Open the browser menu, the three dots.',
    other: 'Open the browser menu.',
  }[kind];
  const second = kind === 'apple' ? 'Choose Add to Home Screen, then tap Add.' : 'Choose Install app or Add to Home screen.';
  return [first, second, 'Open the game from its new icon, full screen.'];
}


export function installed(win = window) {
  return win.matchMedia?.('(display-mode: standalone)').matches === true ||  (win.navigator).standalone === true;
}
