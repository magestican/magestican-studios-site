




















import { createLobbyMusic } from '../../../../web-engine/audio/lobbyMusic.js';

export const MENU_TRACK_ID = 'kartzoom-menu';
export const RACE_TRACK_ID = 'kartzoom-race';



export const RACE_GAIN = 0.28;




export const MUSIC_MANIFEST = new URL('../../assets/music/music.json', import.meta.url);






export function raceBed(audio, make = createLobbyMusic) {
  if (!audio?.ctx || !audio.master) return null;
  if (!audio.raceBed) {
    audio.raceBed = make({
      ctx: audio.ctx,
      
      destination: audio.master,
      manifestUrl: MUSIC_MANIFEST,
      trackId: RACE_TRACK_ID,
      gain: RACE_GAIN,
    });
  }
  audio.raceBed.setMuted?.(!!audio.muted);
  return audio.raceBed;
}


export function startRaceBed(audio, make) {
  const bed = raceBed(audio, make);
  if (!bed) return null;
  Promise.resolve(bed.play()).catch(() => {});
  return bed;
}


export function stopRaceBed(audio) {
  audio?.raceBed?.stop?.();
}
