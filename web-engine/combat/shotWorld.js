











































export function shotSolid(grid) {
  if (!grid) return () => false;
  return (x, y, z) => grid.inBounds(x | 0, y | 0, z | 0) && grid.isSolid(x, y, z);
}


export function isSolidToShot(grid, x, y, z) {
  return !!grid && grid.inBounds(x | 0, y | 0, z | 0) && grid.isSolid(x, y, z);
}
