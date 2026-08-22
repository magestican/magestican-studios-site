


const HAY = 10;   

export function isInsideHay(grid, x, y, z) {
  
  
  
  const cell = grid.get(x | 0, y | 0, z | 0);
  return cell === HAY;
}
