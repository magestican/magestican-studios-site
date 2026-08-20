// Pure helper: is this world-space position inside a hay voxel?
// Split out so we can unit-test it without dragging in THREE or rapier.

const HAY = 10;   // matches VOX.HAY in web-engine/voxel/voxelGrid.js

export function isInsideHay(grid, x, y, z) {
  // Check the cell the position is CURRENTLY in AND the cell one below
  // (so a player standing on top of a hay bale doesn't count as inside).
  // We want "torso inside hay" - roughly y-0.5 (mid-torso) through y+0.5.
  const cell = grid.get(x | 0, y | 0, z | 0);
  return cell === HAY;
}
