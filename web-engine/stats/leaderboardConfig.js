



































export const LEADERBOARD_CONFIG = Object.freeze({
  
  
  
  
  apiKey: 'AIzaSyCdRSfrAw5haWnVIKyXPGwPdMQFGMBa4Lw',
  authDomain: 'magestican-leaderboard.firebaseapp.com',
  projectId: 'magestican-leaderboard',
  appId: '1:280796746354:web:8958e688d58906883a68eb',
  
  
  
  
  appCheckSiteKey: '6LftAJQtAAAAAPNGpVkH8JqvG7goGhu_RkENTGmH',
});



export const LEADERBOARD_COLLECTION = 'leaderboard';




export const LEADERBOARD_LIMIT = 25;



export function isConfigured(cfg = LEADERBOARD_CONFIG) {
  return !!cfg
    && ['apiKey', 'authDomain', 'projectId', 'appId', 'appCheckSiteKey']
      .every((k) => typeof cfg[k] === 'string' && cfg[k].length > 0
                    && !cfg[k].startsWith('REPLACE_ME'));
}
