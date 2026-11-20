















export function createRadio(io) {
  const setTimer = io.setTimer || ((fn, ms) => setTimeout(fn, ms));
  const clearTimer = io.clearTimer || ((t) => clearTimeout(t));
  let steps = [];
  let at = -1;
  let timer = null;
  let up = false;

  const clear = () => { if (timer !== null) clearTimer(timer); timer = null; };
  const takeDown = () => { if (up) { io.hide(); up = false; } };

  function showStep(i) {
    clear();
    at = i;
    if (i >= steps.length) { takeDown(); steps = []; return; }
    io.show(steps[i]);
    up = true;
    timer = setTimer(() => {
      takeDown();
      timer = setTimer(() => showStep(i + 1), steps[i].gap ?? 600);
    }, steps[i].ms);
  }

  return {
    
    play(list, after = 0) {
      this.stop();
      steps = list.slice();
      if (!steps.length) return;
      at = -1;
      timer = setTimer(() => showStep(0), Math.max(0, after));
    },
    
    next() {
      if (!steps.length) return;
      io.hush();
      showStep(at + 1);
    },
    
    skipAll() {
      if (!steps.length) return;
      io.hush();
      this.stop();
    },
    
    stop() {
      clear();
      takeDown();
      steps = [];
      at = -1;
    },
    
    get active() { return steps.length > 0; },
    
    get index() { return at; },
  };
}
