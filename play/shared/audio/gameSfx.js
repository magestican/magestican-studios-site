




























import { playFile, preloadFiles } from '../../../web-engine/brand/uiSound.js';


export function takeFiles(name, count = 1) {
  return Array.from({ length: Math.max(1, count) }, (_, i) => (i ? `${name}_${i + 1}.wav` : `${name}.wav`));
}







export function createGameSfx(baseUrl, names, takes = {}, random = Math.random) {
  const urls = Object.freeze(Object.fromEntries(names.map((n) => [n,
    Object.freeze(takeFiles(n, takes[n]).map((f) => new URL(f, baseUrl).href))])));
  preloadFiles(Object.values(urls).flat());
  const last = {};
  return {
    names: Object.freeze([...names]),
    urls,
    
    play(name) {
      if (!Object.prototype.hasOwnProperty.call(urls, name)) return false;
      const list = urls[name];
      let i = Math.floor(random() * list.length) % list.length;
      if (list.length > 1 && i === last[name]) i = (i + 1) % list.length;
      last[name] = i;
      return playFile(list[i]);
    },
    
    lastTake(name) {
      return last[name];
    },
  };
}
