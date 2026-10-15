






















import { playFile, preloadFiles } from '../../../web-engine/brand/uiSound.js';





export function createGameSfx(baseUrl, names) {
  const urls = Object.freeze(Object.fromEntries(names.map((n) => [n, new URL(`${n}.wav`, baseUrl).href])));
  preloadFiles(Object.values(urls));
  return {
    names: Object.freeze([...names]),
    urls,
    
    play(name) {
      return Object.prototype.hasOwnProperty.call(urls, name) ? playFile(urls[name]) : false;
    },
  };
}
