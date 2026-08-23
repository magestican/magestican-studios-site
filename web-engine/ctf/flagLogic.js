






export const PICKUP_RADIUS      = 2.0;   
                                         
                                         
                                         
                                         
                                         
export const CAPTURE_RADIUS     = 3.5;   












export function computeFlagAction({ playerPos, playerTeam, hasEnemyFlag, flagState, flagPos }) {
  const enemyColor = playerTeam === 'red' ? 'blue' : 'red';
  const myColor    = playerTeam;

  
  
  if (!hasEnemyFlag && flagState[enemyColor] !== 'carried') {
    const fp = flagPos[enemyColor];
    const d = Math.hypot(playerPos.x - fp.x - 0.5, playerPos.z - fp.z - 0.5);
    if (d < PICKUP_RADIUS) return 'pickup';
  }

  
  
  if (hasEnemyFlag && flagState[myColor] === 'home') {
    const mp = flagPos[myColor];
    const d = Math.hypot(playerPos.x - mp.x - 0.5, playerPos.z - mp.z - 0.5);
    if (d < CAPTURE_RADIUS) return 'capture';
  }

  return 'none';
}
