


















const REGISTERED = new Map();


export function cozyShape({ keepNormals = false, patch = null } = {}) {
  return `${keepNormals ? 'keepNormals' : 'faceNormals'}|${patch ? String(patch) : 'no-patch'}`;
}

export function cozyProgramKey(key, options = {}, registry = REGISTERED) {
  const shape = cozyShape(options);
  const had = registry.get(key);
  if (had !== undefined && had !== shape) {
    throw new Error(`cozy material: key '${key}' already names a different shader (keepNormals/patch differ) - give this variant its own key`);
  }
  registry.set(key, shape);
  return `fml-cozy-v3-${key}`;
}
