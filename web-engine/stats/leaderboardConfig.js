



































export const LEADERBOARD_CONFIG = Object.freeze({
  apiKey: null,
  authDomain: null,
  projectId: null,
  appId: null,
  
  
  appCheckSiteKey: null,
});



export const LEADERBOARD_COLLECTION = 'leaderboard';




export const LEADERBOARD_LIMIT = 25;



export function isConfigured(cfg = LEADERBOARD_CONFIG) {
  return !!cfg
    && ['apiKey', 'authDomain', 'projectId', 'appId', 'appCheckSiteKey']
      .every((k) => typeof cfg[k] === 'string' && cfg[k].length > 0
                    && !cfg[k].startsWith('REPLACE_ME'));
}
