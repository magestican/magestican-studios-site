

export const CONFIRM_BELOW_PX = 30;







export function needsConfirm(cellPx, pointerType) {
  return pointerType === 'touch' && cellPx < CONFIRM_BELOW_PX;
}
