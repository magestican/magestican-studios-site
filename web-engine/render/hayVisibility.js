// Standalone (no THREE dep) hay-visibility state machine.
// Rule: inside a hay bale => hay is effectively invisible for the local
// player (so they get a clear view outside); otherwise, translucent yellow.
// See docs/features/hay-hiding.md.

export function hayOpacityFor(insideHay) {
  return insideHay ? 0.04 : 0.72;
}
