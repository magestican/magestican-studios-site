




export const HINTS = {
  touch: 'Step back to aim with your hands',
  camera: 'Touch the screen to use touch aim',
  nocamera: 'Camera off: touch to aim',
};

const NO_TOUCH_S = 2;
const BODY_S = 1;
const EPS = 1e-6;


export function createModeSwitch({ cameraAvailable }) {
  let camera = cameraAvailable;
  let lastTouch = 0;
  let lastT = 0;
  
  let bodySince = null;
  const sw = {
    
    mode: 'touch',
    hint: camera ? HINTS.touch : HINTS.nocamera,
    
    update(tS, { touched, body }) {
      if (body) bodySince ??= lastT;
      else bodySince = null;
      lastT = tS;
      if (touched) {
        lastTouch = tS;
        sw.mode = 'touch';
      } else if (
        camera &&
        sw.mode === 'touch' &&
        tS - lastTouch >= NO_TOUCH_S - EPS &&
        bodySince !== null &&
        tS - bodySince >= BODY_S - EPS
      ) {
        sw.mode = 'camera';
      }
      sw.hint = !camera ? HINTS.nocamera : sw.mode === 'camera' ? HINTS.camera : HINTS.touch;
    },
    
    setCamera(available) {
      camera = available;
      if (!camera) sw.mode = 'touch';
      sw.hint = !camera ? HINTS.nocamera : sw.mode === 'camera' ? HINTS.camera : HINTS.touch;
    },
  };
  return sw;
}
