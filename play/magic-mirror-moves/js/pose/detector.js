



import { fromDetector, onlyInFrame } from './pose.js';

const base = new URL('../../models/pose/', import.meta.url);
export const MODEL_URLS = {
  detector: new URL('blazepose_detector/model.json', base).href,
  landmark: new URL('blazepose_landmark_full/model.json', base).href,
};

const GPU_FAILURE = /link vertex and fragment shaders|compile (vertex|fragment) shader|webgl|context lost|CONTEXT_LOST/i;





export async function createPoseEstimator() {
  const { tf, poseDetection } = await import('../vendor/pose-vendor.js');
  await tf.ready();
  if (tf.getBackend() !== 'webgl' && !(await tf.setBackend('webgl'))) await tf.setBackend('cpu');
  const create = () =>
    poseDetection.createDetector(poseDetection.SupportedModels.BlazePose, {
      runtime: 'tfjs',
      modelType: 'full',
      
      enableSmoothing: false,
      enableSegmentation: false,
      detectorModelUrl: MODEL_URLS.detector,
      landmarkModelUrl: MODEL_URLS.landmark,
    });
  let detector = await create();
  let failures = 0;
  return {
    backend: () => tf.getBackend(),
    async estimate(video, tS) {
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (!width || !height) return null;
      try {
        const poses = await detector.estimatePoses(video, { flipHorizontal: false }, tS * 1000);
        failures = 0;
        const p = poses[0];
        if (!p) return null;
        return { pose: onlyInFrame(fromDetector(p.keypoints), width, height), width, height, t: tS };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (GPU_FAILURE.test(msg) && ++failures >= 3 && tf.getBackend() !== 'cpu') {
          console.warn('Magic Mirror Moves: WebGL kept failing; switching to the CPU backend.');
          detector.dispose();
          await tf.setBackend('cpu');
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
