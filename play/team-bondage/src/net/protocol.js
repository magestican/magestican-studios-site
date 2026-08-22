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
  MATCH_STATE:  'matchState', // {t, state:'lobby'|'countdown'|'playing'|'ended', endsAt?:number}
  TEAM_ASSIGN:  'teamAssign', // {t, assignments:{[peerId]:'red'|'blue'}} - host authority
  HAZARD_SPAWN: 'hazard',     // {t, items:[{kind,x,z,spawnAt,landAt}, ...]} - host authority
  CHICKEN_PICK: 'chickPick',  // {t, by:<peerId>, respawnAt:number} - host-only
  CHICKEN_SHOT: 'chickShot',  // {t, origin:[x,y,z], dir:[x,y,z], by:<peerId>}
  FLAG_RETURN:  'flagRet',    // {t, by:<peerId>, color} - flag home-return (on death carrying it)
  BOT_LEAVE:    'botLeave',   // {t, id} - a bot gave up its seat to a human (host authority)
  CHAT:         'chat',       // {t, from, name, team, text, kind:'say'|'taunt'}
  STEAK_BREAK:  'steakBreak', // {t, at:'N'|'S'|'E'|'W', by:<peerId>} - one of 4 edge steaks was shot
  STEAK_STATE:  'steakState', // {t, statuses:{[side]:{alive, respawnAt}}} - host broadcast on join
  STEAK_THROW:  'steakThrow', // {t, origin:[x,y,z], dir:[x,y,z], by:<peerId>}
  STEAK_ATTACH: 'steakAtt',   // {t, victim:<peerId>, by:<peerId>} - poison starts
  STEAK_TICK:   'steakTick',  // {t, victim:<peerId>, dmg:number} - poison DOT tick
  STEAK_DEATH:  'steakDeath', // {t, victim, killer} - "STEAK ANIHILATION"
});
