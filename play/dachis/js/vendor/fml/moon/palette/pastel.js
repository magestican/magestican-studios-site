

























export const PASTEL = Object.freeze({
  V_GAMMA: 0.7,
  S_KNEE: 0.25,
  S_MAX: 0.5,
});

const DISPLAY_GAMMA = 2.2;


export function pastelGrade([r, g, b], p = PASTEL) {
  const e = [r, g, b].map((c) => Math.max(c, 0) ** (1 / DISPLAY_GAMMA));
  const M = Math.max(e[0], e[1], e[2]);
  const m = Math.min(e[0], e[1], e[2]);
  if (M <= 0) return [0, 0, 0];
  const S = (M - m) / M;
  const V = Math.min(M, 1) ** p.V_GAMMA;
  const x = Math.max(S - p.S_KNEE, 0);
  const S2 = Math.min(S, p.S_KNEE) + x / (1 + x / (p.S_MAX - p.S_KNEE));
  return e.map((c) => {
    const h = M > m ? (c - m) / (M - m) : 1;
    return (V * (1 - S2 * (1 - h))) ** DISPLAY_GAMMA;
  });
}

const f = (x) => (Number.isInteger(x) ? x.toFixed(1) : String(x));

export const PASTEL_GLSL =  `
vec3 fmlPastel( vec3 c ) {
  vec3 e = pow( max( c, vec3( 0.0 ) ), vec3( ${f(1 / DISPLAY_GAMMA)} ) );
  float M = max( e.r, max( e.g, e.b ) );
  float m = min( e.r, min( e.g, e.b ) );
  if ( M <= 0.0 ) return vec3( 0.0 );
  float S = ( M - m ) / M;
  float V = pow( min( M, 1.0 ), ${f(PASTEL.V_GAMMA)} );
  float x = max( S - ${f(PASTEL.S_KNEE)}, 0.0 );
  float S2 = min( S, ${f(PASTEL.S_KNEE)} ) + x / ( 1.0 + x / ${f(PASTEL.S_MAX - PASTEL.S_KNEE)} );
  vec3 h = M > m ? ( e - m ) / ( M - m ) : vec3( 1.0 );
  return pow( V * ( 1.0 - S2 * ( 1.0 - h ) ), vec3( ${f(DISPLAY_GAMMA)} ) );
}
`;
