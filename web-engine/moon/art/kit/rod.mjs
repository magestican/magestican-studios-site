











import { sweep, roundedRectProfile, circleProfile } from '../../mesh/bevel.mjs';

export function rod({ path, w, h = null, detail = 0, up = [0, 1, 0], caps = 'round', capSegments = 0, capLength = null, scales = 1, sides = null, corner = null }) {
  const round = h === null;
  const profile = round
    ? circleProfile(w / 2, sides ?? (detail === 0 ? 6 : detail === 1 ? 5 : 4), Math.PI / 4)
    : roundedRectProfile(w, h, Math.min(w, h) * 0.32, corner ?? (detail === 0 ? 1 : 0));
  return sweep({ profile, path, up, caps, capSegments, capLength: capLength ?? Math.min(w, h ?? w) * 0.45, scales });
}
