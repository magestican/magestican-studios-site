
























import { createShakeDetector } from '../../../web-engine/board/shake.js';

const KEY = 'magestican:v1:shake-to-roll';


export function supported() {
  return typeof globalThis.DeviceMotionEvent !== 'undefined';
}


const needsPermission = () => typeof globalThis.DeviceMotionEvent?.requestPermission === 'function';

const remembered = () => {
  try { return globalThis.localStorage?.getItem(KEY) === 'on'; } catch { return false; }
};
const remember = (on) => {
  try { globalThis.localStorage?.setItem(KEY, on ? 'on' : 'off'); } catch {  }
};












export function createShakeToRoll({ onShake, enabled = () => true, now = () => Date.now() } = {}) {
  const detector = createShakeDetector();
  let on = false;
  let listening = false;

  const handler = (event) => {
    
    
    
    const a = event.accelerationIncludingGravity ?? event.acceleration;
    if (!a) return;
    if (!detector.feed(a, now())) return;
    if (!enabled()) { return; }
    try { onShake?.(); } catch {  }
  };

  function listen() {
    if (listening) return;
    globalThis.addEventListener('devicemotion', handler);
    listening = true;
  }
  function stop() {
    if (!listening) return;
    globalThis.removeEventListener('devicemotion', handler);
    listening = false;
    detector.reset();
  }

  return {
    isOn: () => on,
    wasOn: remembered,
    supported,

    






    async setOn(want) {
      if (!want) { on = false; remember(false); stop(); return false; }
      if (!supported()) { on = false; remember(false); return false; }
      if (needsPermission()) {
        try {
          const answer = await globalThis.DeviceMotionEvent.requestPermission();
          if (answer !== 'granted') { on = false; remember(false); return false; }
        } catch {
          
          
          on = false;
          remember(false);
          return false;
        }
      }
      on = true;
      remember(true);
      detector.reset();
      listen();
      return true;
    },

    
    reset: () => detector.reset(),

    destroy: stop,
  };
}
