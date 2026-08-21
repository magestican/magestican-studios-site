// Barn siding paint — PURE DATA (no THREE, no canvas) so the art rules in
// art/knowledge/ can be asserted by tests instead of only written down.
// Same pattern as entities/viewmodelSpec.js.
//
// Why this exists: the two barns are the biggest man-made surfaces in the
// game and until now they were FLAT UNTEXTURED COLOUR — a single hex per
// team, no pattern at all. GRAPHICS_QUALITY_LOOP's Minecraft-tier bar is
// "every surface has a texture pattern that reads at 10 m", and the barn
// queue item asks specifically for "weathering variation between the red
// and blue barns". Both barns now get board-and-batten siding, and the two
// weather DIFFERENTLY — that difference is the data below.

// Every hex is drawn from the canonical game palette in
// art/knowledge/craft/color.md, or is a warm-dark / cool-light neighbour of
// one. Never pure black, never pure white (hand-drawn.md).
export const BARN_PALETTE = Object.freeze({
  red:        '#b73a2a',   // game palette "barn red"
  blue:       '#336bbf',   // game palette team blue
  bareWood:   '#9a7d5c',   // sun-bleached board, exposed where paint peeled
  bareShadow: '#6b5540',   // the lip of paint around a peel
  rime:       '#dbeaf6',   // frost crust — pale BLUE snow, not white
  damp:       '#43302a',   // meltwater rot band — warm dark, not grey
  nail:       '#6d7076',   // matches VOX_COLOR STONE
});

// One entry per team. The fields are deliberately the *weathering story*,
// not generic knobs: red barn = old south-facing paint cooked by sun and
// standing in meltwater; blue barn = newer paint that spends the day in
// shadow and ices over.
export const BARN_PAINT = Object.freeze({
  red: Object.freeze({
    team: 'red',
    paint: BARN_PALETTE.red,
    boards: 4,               // vertical boards across a 1 m face (wide, old-cut)
    boardValueSpread: 0.26,  // each board faded by a different amount
    peels: 7,                // patches of paint gone, bare wood showing
    peelCoverage: 0.10,      // <= 10 % — the 60-30-10 rule (color.md)
    rimeRows: 2,             // sun side: frost barely holds
    dampRows: 9,             // sits in meltwater: tall rot band
    grainStreaks: 14,
    seed: 91,
  }),
  blue: Object.freeze({
    team: 'blue',
    paint: BARN_PALETTE.blue,
    boards: 6,               // narrower, newer boards
    boardValueSpread: 0.12,  // paint still even
    peels: 2,                // barely peeled
    peelCoverage: 0.03,
    rimeRows: 8,             // shade side: thick frost crust + drips
    dampRows: 4,
    grainStreaks: 7,
    seed: 137,
  }),
});

// The rule that keeps "weathering variation" honest: if a future pass makes
// the two barns weather the same way, this is what fails.
export const WEATHERING_FIELDS = Object.freeze([
  'boards', 'boardValueSpread', 'peels', 'rimeRows', 'dampRows',
]);
