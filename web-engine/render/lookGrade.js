







































export const EXPOSURE = 1.55;
















export const GROUND_SURFACES = ['road', 'ground', 'verge', 'guardBank', 'shortcut', 'fascia'];


















export const NORMAL_SCALE = {
  road: 1.15, ground: 0.75, verge: 0.85, guardBank: 0.65, shortcut: 1.0, fascia: 0,
};










export function surfacePolicy(name) {
  if (!GROUND_SURFACES.includes(name)) {
    return { rim: true, groundDetail: false, normalMap: false, normalScale: 0 };
  }
  const scale = NORMAL_SCALE[name] ?? 0;
  return {
    rim: false,
    groundDetail: name !== 'fascia',
    normalMap: scale > 0,
    normalScale: scale,
  };
}


export const luma = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;








export function lumaSpread(values) {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const at = (p) => s[Math.floor(p * (s.length - 1))];
  return at(0.95) - at(0.05);
}
