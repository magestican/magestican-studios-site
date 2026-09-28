















export const WARM_WAIT_MS = 5000;


export function programSettled(p) {
  if (!p || p.program === undefined || p.program === null) return true;
  try {
    return p.isReady() !== false;
  } catch {
    return true;
  }
}





export function waitForPrograms(programs, {
  timeoutMs = WARM_WAIT_MS, pollMs = 10,
  now = () => performance.now(), wait = (ms) => new Promise((r) => setTimeout(r, ms)),
} = {}) {
  const t0 = now();
  return (async () => {
    for (;;) {
      if (programs.every(programSettled)) return { timedOut: false, ms: now() - t0 };
      if (now() - t0 >= timeoutMs) return { timedOut: true, ms: now() - t0 };
      await wait(pollMs);
    }
  })();
}






export function within(promise, ms, fallback = null, wait = (t) => new Promise((r) => setTimeout(r, t))) {
  return Promise.race([Promise.resolve(promise).catch(() => fallback), wait(ms).then(() => fallback)]);
}
