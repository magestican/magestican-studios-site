







































































export const FUNNEL_EVENTS = Object.freeze([
  'game_start',
  'first_sale',
  'parcel_bought',
  'visit_hosted',
  'visit_joined',
  'share_click',
  'session_minutes',
]);

const MS_PER_MINUTE = 60000;














export function createFunnel({ send = () => {}, now = () => Date.now() } = {}) {
  const fired = new Set();     
  const seen = new Map();      
  let startedAt = null;

  
  
  
  
  const emit = (name, params) => {
    try {
      send(name, { ...params });
    } catch {
      
    }
    return true;
  };

  
  
  const once = (name, params) => {
    if (fired.has(name)) return false;
    fired.add(name);
    return emit(name, params);
  };

  const oncePer = (name, key, params) => {
    const k = String(key);
    let keys = seen.get(name);
    if (!keys) {
      keys = new Set();
      seen.set(name, keys);
    }
    if (keys.has(k)) return false;
    keys.add(k);
    return emit(name, params);
  };

  return {
    
    gameStart(params = {}) {
      if (startedAt === null) startedAt = now();
      return once('game_start', params);
    },

    
    sale(params = {}) {
      return once('first_sale', params);
    },

    
    parcelBought(parcelKey, params = {}) {
      return oncePer('parcel_bought', parcelKey, params);
    },

    
    visitHosted(visitKey, params = {}) {
      return oncePer('visit_hosted', visitKey, params);
    },

    
    visitJoined(visitKey, params = {}) {
      return oncePer('visit_joined', visitKey, params);
    },

    





    shareClick(params = {}) {
      return emit('share_click', params);
    },

    






    endSession(params = {}) {
      const ms = startedAt === null ? 0 : Math.max(0, now() - startedAt);
      return once('session_minutes', { ...params, minutes: Math.floor(ms / MS_PER_MINUTE) });
    },
  };
}
