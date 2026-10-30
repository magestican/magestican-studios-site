


export const FIREBASE = {
  projectId: 'demo-rex-rampage',
  apiKey: 'demo-key',
  appId: 'demo-app',
  authDomain: 'demo-rex-rampage.firebaseapp.com',
};


export const LIVE = !FIREBASE.projectId.startsWith('demo-');

export const EMULATOR = { host: '127.0.0.1', firestorePort: 8085, authUrl: 'http://127.0.0.1:9105' };
