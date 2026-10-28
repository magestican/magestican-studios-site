




import { fromDetector, onlyInFrame } from './pose.js';

const base = new URL('../../models/pose/', import.meta.url);
export const MODEL_URLS = {
  detector: new URL('blazepose_detector/model.json', base).href,
  full: new URL('blazepose_landmark_full/model.json', base).href,
  lite: new URL('blazepose_landmark_lite/model.json', base).href,
};

const GPU_FAILURE = /link vertex and fragment shaders|compile (vertex|fragment) shader|webgl|context lost|CONTEXT_LOST/i;






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
  let detector = await create();
  let failures = 0;
  let lastError = '';
  
  let failed = false; 
  const stats = { landmark, runs: 0, ms: 0, msAvg: 0, gpuFailures: 0, cpuFallback: false };
  return {
    backend: () => tf.getBackend(),
    lastError: () => lastError,
    failed: () => failed,
    stats: () => ({ ...stats, numTensors: tf.memory().numTensors, numBytes: tf.memory().numBytes }),
    async estimate(video, tS) {
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (!width || !height) return null;
      
      
      
      if (video.width !== width || video.height !== height) {
        video.width = width;
        video.height = height;
      }
      const t0 = performance.now();
      try {
        const poses = await detector.estimatePoses(video, { flipHorizontal: false }, tS * 1000);
        stats.ms = performance.now() - t0;
        stats.msAvg = stats.runs ? stats.msAvg + (stats.ms - stats.msAvg) * 0.1 : stats.ms;
        stats.runs++;
        failures = 0;
        lastError = '';
        const p = poses[0];
        if (!p) return null;
        return { pose: onlyInFrame(fromDetector(p.keypoints), width, height), width, height, t: tS };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        lastError = msg;
        if (!GPU_FAILURE.test(msg)) return null;
        stats.gpuFailures++;
        if (++failures < 3) return null;
        if (!cpuFallback) failed = true;
        else if (tf.getBackend() !== 'cpu') {
          console.warn('Magic Mirror Moves: WebGL kept failing; switching to the CPU backend.');
          detector.dispose();
          await tf.setBackend('cpu');
          stats.cpuFallback = true;
          detector = await create();
          failures = 0;
        }
        return null;
      }
    },
    dispose() {
      detector.dispose();
    },
  };
}
