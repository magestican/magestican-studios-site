











export function createIndoorCurve(uniform) {
  let saved = null;
  return {
    enter() {
      if (saved === null) saved = uniform.value;
      uniform.value = 0;
    },
    leave() {
      if (saved === null) return;
      uniform.value = saved;
      saved = null;
    },
    get indoors() { return saved !== null; },
  };
}
