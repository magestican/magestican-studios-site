



















































export const ESC_PRECEDENCE = Object.freeze([
  'anagram',      
  'chat',         
  'settings',     
  'career',       
  'scoreboard',   
]);





export function escIntent({
  source = 'key',
  anagramOpen = false,
  chatOpen = false,
  settingsOpen = false,
  careerOpen = false,
  scoreboardOpen = false,
  inMatch = true,
} = {}) {
  
  
  if (anagramOpen) return 'none';

  if (source === 'lock') {
    
    
    
    return scoreboardOpen ? 'close-scoreboard' : 'none';
  }

  if (source === 'unlock') {
    
    if (chatOpen || settingsOpen || careerOpen || scoreboardOpen) return 'none';
    return inMatch ? 'open-scoreboard' : 'none';
  }

  
  if (chatOpen) return 'close-chat';
  if (settingsOpen) return 'close-settings';
  if (careerOpen) return 'close-career';
  
  
  
  
  if (scoreboardOpen) return 'close-scoreboard';
  return inMatch ? 'open-scoreboard' : 'none';
}






export function mountEscRouter({
  target = (typeof window !== 'undefined' ? window : null),
  doc = (typeof document !== 'undefined' ? document : null),
  isAnagramOpen = () => false,
  isChatOpen = () => false,
  isSettingsOpen = () => false,
  isCareerOpen = () => false,
  isScoreboardOpen = () => false,
  isInMatch = () => true,
  closeChat = () => {},
  closeSettings = () => {},
  closeCareer = () => {},
  setScoreboard = () => {},
} = {}) {
  if (!target) return () => {};

  const state = (source) => ({
    source,
    anagramOpen: !!isAnagramOpen(),
    chatOpen: !!isChatOpen(),
    settingsOpen: !!isSettingsOpen(),
    careerOpen: !!isCareerOpen(),
    scoreboardOpen: !!isScoreboardOpen(),
    inMatch: !!isInMatch(),
  });

  const apply = (intent) => {
    switch (intent) {
      case 'close-chat': closeChat(); break;
      case 'close-settings': closeSettings(); break;
      case 'close-career': closeCareer(); break;
      case 'close-scoreboard': setScoreboard(false); break;
      case 'open-scoreboard': setScoreboard(true); break;
      default: break;
    }
    return intent;
  };

  const onKey = (e) => {
    if (e.key !== 'Escape') return;
    
    
    
    const tag = doc?.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      
      
      
      if (!isChatOpen()) return;
    }
    apply(escIntent(state('key')));
  };

  const onLockChange = () => {
    const locked = !!doc?.pointerLockElement;
    apply(escIntent(state(locked ? 'lock' : 'unlock')));
  };

  target.addEventListener('keydown', onKey);
  doc?.addEventListener?.('pointerlockchange', onLockChange);

  return () => {
    target.removeEventListener('keydown', onKey);
    doc?.removeEventListener?.('pointerlockchange', onLockChange);
  };
}
