




import { cropsFor, mergePeople, shiftPose } from './players.js';
import { fromDetector, onlyInFrame } from './pose.js';

const base = new URL('../../models/pose/', import.meta.url);
export const MODEL_URLS = {
  detector: new URL('blazepose_detector/model.json', base).href,
  full: new URL('blazepose_landmark_full/model.json', base).href,
  lite: new URL('blazepose_landmark_lite/model.json', base).href,
};

const GPU_FAILURE = /link vertex and fragment shaders|compile (vertex|fragment) shader|webgl|context lost|CONTEXT_LOST/i;












async function compileAhead(tf, detector) {
  const ua = globalThis.navigator?.userAgent ?? '';
  if (!/AppleWebKit/.test(ua) || /Chrome\/|Chromium\/|Edg\//.test(ua)) return false;
  const backend = tf.backend();
  if (!backend?.gpgpu?.parallelCompilationExtension) return false;
  const models = [detector.detectorModel, detector.landmarkModel].filter(Boolean);
  tf.env().set('ENGINE_COMPILE_ONLY', true);
  try {
    for (const m of models) {
      const shape = m.inputs[0].shape.map((n) => (n > 0 ? n : 1));
      tf.tidy(() => m.execute(tf.zeros(shape)));
    }
  } finally {
    tf.env().set('ENGINE_COMPILE_ONLY', false);
  }
  await backend.checkCompileCompletionAsync();
  backend.getUniformLocations();
  return true;
}






export async function createPoseEstimator({ landmark, cpuFallback }) {
  const { tf, poseDetection } = await import('../vendor/pose-vendor.js');
  await tf.ready();
  if (tf.getBackend() !== 'webgl' && !(await tf.setBackend('webgl'))) {
    if (!cpuFallback) throw new Error('WebGL is not available');
    await tf.setBackend('cpu');
  }
  const create = () =>
    poseDetection.createDetector(poseDetection.SupportedModels.BlazePose, {
      runtime: 'tfjs',
      modelType: landmark,
      
      enableSmoothing: false,
      enableSegmentation: false,
      detectorModelUrl: MODEL_URLS.detector,
      landmarkModelUrl: MODEL_URLS[landmark],
    });
  
  
  let detectors = [await create()];
  await compileAhead(tf, detectors[0]);
  let failures = 0;
  let lastError = '';
  
  let failed = false; 
  const stats = { landmark, runs: 0, ms: 0, msAvg: 0, gpuFailures: 0, cpuFallback: false };
  return {
    backend: () => tf.getBackend(),
    lastError: () => lastError,
    failed: () => failed,
    stats: () => ({ ...stats, numTensors: tf.memory().numTensors, numBytes: tf.memory().numBytes }),
    




    async estimate(video, tS, players = 1) {
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (!width || !height) return players === 1 ? [null] : [null, null];
      
      
      
      if (video.width !== width || video.height !== height) {
        video.width = width;
        video.height = height;
      }
      const none = players === 1 ? [null] : [null, null];
      const t0 = performance.now();
      try {
        
        let people;
        if (players === 1) {
          const p = (await detectors[0].estimatePoses(video, { flipHorizontal: false }, tS * 1000))[0];
          people = [p ? onlyInFrame(fromDetector(p.keypoints), width, height) : null];
        } else {
          while (detectors.length < 2) detectors.push(await create());
          const crops = cropsFor(width, 2);
          const pic = tf.browser.fromPixels(video);
          people = [];
          try {
            for (let i = 0; i < 2; i++) {
              const c = crops[i];
              const strip = tf.slice(pic, [0, c.x, 0], [height, c.w, 3]);
              try {
                const p = (await detectors[i].estimatePoses(strip, { flipHorizontal: false }, tS * 1000))[0];
                
                people.push(p ? shiftPose(onlyInFrame(fromDetector(p.keypoints), c.w, height), c.x) : null);
              } finally {
                strip.dispose();
              }
            }
          } finally {
            pic.dispose();
          }
          people = mergePeople(people, crops, width, height);
        }
        stats.ms = performance.now() - t0;
        stats.msAvg = stats.runs ? stats.msAvg + (stats.ms - stats.msAvg) * 0.1 : stats.ms;
        stats.runs++;
        failures = 0;
        lastError = '';
        return people.map((pose) => (pose ? { pose, width, height, t: tS } : null));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        lastError = msg;
        if (!GPU_FAILURE.test(msg)) return none;
        stats.gpuFailures++;
        if (++failures < 3) return none;
        if (!cpuFallback) failed = true;
        else if (tf.getBackend() !== 'cpu') {
          console.warn('Magic Mirror Moves: WebGL kept failing; switching to the CPU backend.');
          for (const d of detectors) d.dispose();
          await tf.setBackend('cpu');
          stats.cpuFallback = true;
          detectors = [await create()];
          failures = 0;
        }
        return none;
      }
    },
    




    async scout(video, tS, crop) {
      const height = video.videoHeight;
      if (!height || video.width !== video.videoWidth) return null; 
      try {
        while (detectors.length < 2) detectors.push(await create());
        const pic = tf.browser.fromPixels(video);
        try {
          const strip = tf.slice(pic, [0, crop.x, 0], [height, crop.w, 3]);
          try {
            const p = (await detectors[1].estimatePoses(strip, { flipHorizontal: false }, tS * 1000))[0];
            return p ? shiftPose(onlyInFrame(fromDetector(p.keypoints), crop.w, height), crop.x) : null;
          } finally {
            strip.dispose();
          }
        } finally {
          pic.dispose();
        }
      } catch {
        return null; 
      }
    },
    dispose() {
      for (const d of detectors) d.dispose();
    },
  };
}
