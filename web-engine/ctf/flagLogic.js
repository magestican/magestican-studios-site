// Pure CTF flag logic — decoupled from three.js + the network layer so
// we can unit-test the pickup + capture rules without spinning up a
// whole game. Bryan 2026-08-20: flag pickup regressed; asked for more/
// better tests to catch it next time.
//
// Every function is a pure computation — no side effects, no globals.

export const PICKUP_RADIUS      = 2.0;   // was 1.2 — flag stand voxel
                                         // pushes the player out to ~0.82m
                                         // so 1.2 was too tight; 2.0 gives
                                         // a comfortable arm's-length grab
                                         // radius without letting you pick
                                         // up from across the room.
export const CAPTURE_RADIUS     = 3.5;   // matches game.js FLAG_HOME_RADIUS

// Returns 'pickup' | 'capture' | 'none' based on player state + geometry.
//
//   playerPos  : {x, z}
//   playerTeam : 'red' | 'blue'
//   hasEnemyFlag: bool
//   flagState  : { red: 'home'|'carried'|'dropped', blue: 'home'|'carried'|'dropped' }
//   flagPos    : { red: {x, z}, blue: {x, z} }   -- BASE-CORNER coords
//                                                 (add 0.5 for voxel centre)
//
// Same 0.5 offset convention as the game grid (a voxel at integer (x,z)
// occupies the square [x, x+1) × [z, z+1); its centre is (x+0.5, z+0.5)).
export function computeFlagAction({ playerPos, playerTeam, hasEnemyFlag, flagState, flagPos }) {
  const enemyColor = playerTeam === 'red' ? 'blue' : 'red';
  const myColor    = playerTeam;

  // PICKUP: not currently carrying + enemy flag not already carried +
  // within PICKUP_RADIUS of the enemy flag stand.
  if (!hasEnemyFlag && flagState[enemyColor] !== 'carried') {
    const fp = flagPos[enemyColor];
    const d = Math.hypot(playerPos.x - fp.x - 0.5, playerPos.z - fp.z - 0.5);
    if (d < PICKUP_RADIUS) return 'pickup';
  }

  // CAPTURE: carrying the enemy flag + my own flag is at home + within
  // CAPTURE_RADIUS of my own flag stand.
  if (hasEnemyFlag && flagState[myColor] === 'home') {
    const mp = flagPos[myColor];
    const d = Math.hypot(playerPos.x - mp.x - 0.5, playerPos.z - mp.z - 0.5);
    if (d < CAPTURE_RADIUS) return 'capture';
  }

  return 'none';
}
