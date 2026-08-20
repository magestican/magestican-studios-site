// Message-type constants for the P2P wire.
//
// Convention: every message has { t: <type>, ...fields }. We keep the field
// names 1-2 chars to shave bytes off the 20Hz position broadcast.

export const MSG = Object.freeze({
  HELLO:      'hello',       // {t, name, character, team}
  WELCOME:    'welcome',     // {t, seed, scores, playersMeta} - host only
  STATE:      'state',       // {t, p:[x,y,z], y:yaw, x:pitch, h:hp, c:char, tm:team, hf: hasEnemyFlag}
  SHOT:       'shot',        // {t, s:<serialized WeaponSystem shot>}
  HIT:        'hit',         // {t, target:<peerId>, dmg, by, weapon}
  DEATH:      'death',       // {t, victim, killer, weapon}
  FLAG_PICK:  'flagPick',    // {t, by:<peerId>, color:'red'|'blue'}
  FLAG_DROP:  'flagDrop',    // {t, by, color, at:[x,y,z]}
  FLAG_CAP:   'flagCap',     // {t, by, color} - the flag being captured (enemy team's colour)
  SCORE:      'score',       // {t, scores:{red:N, blue:N}} - host-authoritative
  ANAGRAM_START: 'anaStart', // {t, word, scrambled, losingTeam, endsAt}
  ANAGRAM_WIN:   'anaWin',   // {t, winner:'red'|'blue', by:<peerId>}
  CHAT:       'chat',        // {t, from, text}
});
