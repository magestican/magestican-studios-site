




import { fromDetector, onlyInFrame } from './pose.js';

const base = new URL('../../models/pose/', import.meta.url);
const MODEL_URLS = {
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
  let failed = false;
  return {
    failed: () => failed,
    async estimate(video, tS) {
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (!width || !height) return null;
      
      
      if (video.width !== width || video.height !== height) {
        video.width = width;
        video.height = height;
      }
      try {
        const p = (await detector.estimatePoses(video, { flipHorizontal: false }, tS * 1000))[0];
        failures = 0;
        return p ? { pose: onlyInFrame(fromDetector(p.keypoints), width, height), width, height, t: tS } : null;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!GPU_FAILURE.test(msg) || ++failures < 3) return null;
        if (!cpuFallback) failed = true;
        else if (tf.getBackend() !== 'cpu') {
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
