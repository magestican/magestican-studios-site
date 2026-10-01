




















import { WORKERS_BY_DEFAULT, createVillagerSource, createWorkerPool, poolSize } from 'moon/play/meshSource.mjs';
import { openMeshCache } from '../play/meshCache.js';

let shared = null;






function param(name) {
  try {
    return new URLSearchParams(globalThis.location ? location.search : '').get(name);
  } catch {
    return null;
  }
}

export function villagerSource() {
  if (!shared) {
    
    
    
    const asked = param('meshworkers');
    
    
    
    
    const size = asked === null ? (WORKERS_BY_DEFAULT ? poolSize(globalThis.navigator?.hardwareConcurrency) : 0) : Number(asked);
    shared = createVillagerSource({
      cache: param('meshcache') === '0' ? null : openMeshCache(),
      
      
      
      pool: size >= 1
        ? createWorkerPool({ url: new URL('../play/villagerWorker.js', import.meta.url), size })
        : null,
    });
  }
  return shared;
}


export function setVillagerSource(source) {
  shared = source;
}
