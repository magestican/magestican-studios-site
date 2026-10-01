








const KIND_OF_MODULE = Object.freeze({ tree: 'apple', peachTree: 'peach' });

export function startFromPlacements(placements) {
  const wildTrees = [];
  let rocks = 0;
  placements.forEach((p, index) => {
    if (p.role === 'tree') {
      const kind = KIND_OF_MODULE[p.module];
      if (!kind) throw new Error(`no tree kind for layout module '${p.module}'`);
      wildTrees.push({ kind, stage: p.stage || 'fruiting', spot: index });
    } else if (p.role === 'rock') {
      rocks += 1;
    }
  });
  return { wildTrees, rocks };
}
