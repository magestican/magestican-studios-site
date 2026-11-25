



const SETTINGS_KEY = 's95.settings.v1';
const NIGHT_KEY = 'space95.night'; 


export function readSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') ?? {};
    const night = Number.parseFloat(localStorage.getItem(NIGHT_KEY) ?? '1');
    return { ...s, brightness: Math.round((night > 3 ? night / 100 : night) * 100) };
  } catch {
    return {};
  }
}


export function saveSettings(settings) {
  try {
    const { brightness, ...rest } = settings;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(rest));
    if (brightness) localStorage.setItem(NIGHT_KEY, String(brightness / 100));
  } catch {
    
  }
}
