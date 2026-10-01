




import { generate as generateTree, TIER, STAGES } from './tree.mjs';

export { TIER, STAGES };

export function generate(opts = {}) {
  return generateTree({ ...opts, kind: 'peach' });
}
