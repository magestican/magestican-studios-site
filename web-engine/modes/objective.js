















































export function flagKeysFor(mode) {
  switch (mode?.flags) {
    case 'both':    return ['red', 'blue'];
    case 'neutral': return ['red'];
    default:        return [];
  }
}



export function hasFlags(mode) {
  return flagKeysFor(mode).length > 0;
}








export function neutralFlagHome(hillSpawn) {
  if (!hillSpawn) return null;
  return { x: hillSpawn.x - 0.5, y: Math.floor(hillSpawn.y), z: hillSpawn.z - 0.5 };
}


export function flagHome(mode, color, world) {
  if (mode?.flags === 'neutral') return neutralFlagHome(world?.hillSpawn);
  return world?.flags?.[color] ?? null;
}


















export function objectiveMarkers(mode, world = {}) {
  const { flagPos, hillSpawn } = world;
  switch (mode?.flags) {
    case 'both':
      if (!flagPos) return [];
      return [
        { id: 'red',  kind: 'flag', pos: flagPos.red,  emoji: '🚩', label: 'red flag' },
        { id: 'blue', kind: 'flag', pos: flagPos.blue, emoji: '🚩', label: 'blue flag' },
      ].filter((m) => m.pos);
    case 'neutral':
      
      
      
      if (!flagPos?.red) return [];
      return [{ id: 'neutral', kind: 'flag', pos: flagPos.red,
                emoji: '🏴', label: 'the flag' }];
    default:
      
      
      if (mode?.scoring === 'hold' && hillSpawn) {
        return [{ id: 'hill', kind: 'hill', pos: hillSpawn,
                  emoji: '👑', label: 'the hill' }];
      }
      return [];
  }
}



export const OBJECTIVE_IDS = Object.freeze(['red', 'blue', 'neutral', 'hill']);
