







































export function tick({ dirty, moving, wasMoving }) {
  return {
    
    
    draw: Boolean(dirty || moving || wasMoving),
    again: Boolean(moving),
    wasMoving: Boolean(moving),
  };
}
