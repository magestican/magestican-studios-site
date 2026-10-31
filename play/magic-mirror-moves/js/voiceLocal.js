






import { heardCommand, VOCABULARY } from './voice.js';

const MODEL_URL = new URL('../models/voice/en-small.tar.gz', import.meta.url).href;


export function localVoiceSupported(win) {
  return (
    typeof win.WebAssembly === 'object' &&
    typeof win.Worker === 'function' &&
    typeof (win.AudioContext ?? win.webkitAudioContext) === 'function' &&
    typeof win.navigator?.mediaDevices?.getUserMedia === 'function'
  );
}

let modelLoad = null; 
function loadModel() {
  
  globalThis.__mmmVoskWorkerUrl = new URL('./vendor/vosk-worker.js', import.meta.url).href;
  modelLoad ??= import('./vendor/vosk-vendor.js')
    .then(({ createModel }) => createModel(MODEL_URL, -1))
    .catch((err) => {
      modelLoad = null;
      throw err;
    });
  return modelLoad;
}






export async function startLocalVoice(win, onCommand) {
  const ctx = new (win.AudioContext ?? win.webkitAudioContext)();
  let stream = null;
  let recognizer = null;
  const parts = [];
  let stopped = false;
  const stop = () => {
    
    
    stopped = true;
    for (const p of parts) p.disconnect();
    for (const tr of stream?.getTracks() ?? []) tr.stop();
    recognizer?.remove();
    ctx.close().catch(() => {});
  };
  try {
    stream = await win.navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      video: false,
    });
    const model = await loadModel();
    await ctx.resume();
    recognizer = new model.KaldiRecognizer(ctx.sampleRate, JSON.stringify([...VOCABULARY, '[unk]']));
    let lastText = '';
    const heard = (text) => {
      if (!text || text === lastText) return;
      lastText = text;
      const cmd = heardCommand(text);
      if (cmd) onCommand(cmd);
    };
    recognizer.on('partialresult', (m) => heard(m.result?.partial));
    recognizer.on('result', (m) => {
      heard(m.result?.text);
      lastText = ''; 
    });
    const source = ctx.createMediaStreamSource(stream);
    const tap = ctx.createScriptProcessor(4096, 1, 1);
    tap.onaudioprocess = (e) => {
      if (!stopped) recognizer.acceptWaveform(e.inputBuffer);
    };
    
    const mute = ctx.createGain();
    mute.gain.value = 0;
    source.connect(tap);
    tap.connect(mute);
    mute.connect(ctx.destination);
    parts.push(source, tap, mute);
  } catch (err) {
    stop();
    throw err;
  }
  return stop;
}
