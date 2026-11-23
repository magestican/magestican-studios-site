









export const BACKDROP_ASSET = Object.freeze({
  'lantern-row': 'act_lantern_row',
  'bell-quarter': 'act_bell_quarter',
  'mirror-nave': 'act_mirror_nave',
  'kiln-works': 'act_kiln_works',
  'sun-spire': 'act_sun_spire',
});


export const BACKDROP_DIM = 0.34;


export const BACKDROP_FADE_S = 1.2;


export function backdropPath(actId) {
  const name = BACKDROP_ASSET[actId];
  return name ? `backdrops/${name}/${name}.webp` : null;
}
