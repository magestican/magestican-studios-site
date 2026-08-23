












import { planTick, intervalFor } from './tickPolicy.js';

const WORKER_SRC = `
  // A metronome. It owns no state and makes no decisions; it exists because a
  // worker's setInterval keeps running when the page is hidden.
  let id = null;
  self.onmessage = (e) => {
    const ms = e.data && e.data.intervalMs;
    if (id !== null) { clearInterval(id); id = null; }
    if (ms > 0) id = setInterval(() => self.postMessage(1), ms);
  };
`;

export class TickSource {
  
  
  
  constructor({ onTick, now = () => performance.now(),
                doc = typeof document !== 'undefined' ? document : null } = {}) {
    this.onTick = onTick;
    this._now = now;
    this._doc = doc;
    this._last = now();
    this._raf = null;
    this._worker = null;
    this._stopped = false;
    this._onVisibility = () => this._retune();
    if (this._doc) this._doc.addEventListener('visibilitychange', this._onVisibility);
  }

  get hidden() { return !!(this._doc && this._doc.hidden); }

  start() {
    this._stopped = false;
    this._last = this._now();
    this._retune();
  }

  stop() {
    this._stopped = true;
    if (this._raf !== null) { cancelAnimationFrame(this._raf); this._raf = null; }
    this._killWorker();
    this._doc?.removeEventListener('visibilitychange', this._onVisibility);
  }

  
  
  _retune() {
    if (this._stopped) return;
    const ms = intervalFor(this.hidden);
    if (ms === null) {
      this._killWorker();
      
      
      this._last = this._now();
      if (this._raf === null) this._pumpRaf();
    } else {
      if (this._raf !== null) { cancelAnimationFrame(this._raf); this._raf = null; }
      this._startWorker(ms);
    }
  }

  _pumpRaf() {
    const step = () => {
      if (this._stopped || this.hidden) { this._raf = null; return; }
      this._raf = requestAnimationFrame(step);
      this._fire();
    };
    this._raf = requestAnimationFrame(step);
  }

  _startWorker(intervalMs) {
    try {
      if (!this._worker) {
        const blob = new Blob([WORKER_SRC], { type: 'application/javascript' });
        this._url = URL.createObjectURL(blob);
        this._worker = new Worker(this._url);
        this._worker.onmessage = () => { if (!this._stopped && this.hidden) this._fire(); };
      }
      this._worker.postMessage({ intervalMs });
    } catch (err) {
      
      
      
      
      console.warn('[loop] worker metronome unavailable, using setInterval:', err?.message || err);
      clearInterval(this._fallback);
      this._fallback = setInterval(() => {
        if (!this._stopped && this.hidden) this._fire();
      }, intervalMs);
    }
  }

  _killWorker() {
    if (this._worker) { this._worker.terminate(); this._worker = null; }
    if (this._url) { URL.revokeObjectURL(this._url); this._url = null; }
    if (this._fallback) { clearInterval(this._fallback); this._fallback = null; }
  }

  _fire() {
    const now = this._now();
    const elapsed = (now - this._last) / 1000;
    this._last = now;
    const { steps, render } = planTick(elapsed, { hidden: this.hidden });
    for (let i = 0; i < steps.length; i++) {
      
      this.onTick(steps[i], { render: render && i === steps.length - 1 });
    }
  }
}
