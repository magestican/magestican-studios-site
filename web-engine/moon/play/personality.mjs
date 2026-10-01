





















import { seedOf } from '../voice/mumble.mjs';

export const PERSONALITY_NAMES = Object.freeze([
  'cheerful', 'grumpy', 'shy', 'dreamy', 'bossy', 'curious', 'gentle',
]);

export const PERSONALITIES = Object.freeze({
  cheerful: Object.freeze({
    baseline: 'happy', intensity: 0.8, pace: 1.15, pitch: 1.08,
    catchphrase: 'What a lovely day!', laugh: 'giggle',
    favouriteTopic: 'the weather', dislikes: 'grumbling',
  }),
  grumpy: Object.freeze({
    baseline: 'frustration', intensity: 0.6, pace: 0.9, pitch: 0.92,
    catchphrase: 'Back in my day...', laugh: 'huff',
    favouriteTopic: 'how things used to be', dislikes: 'being rushed',
  }),
  shy: Object.freeze({
    baseline: 'concern', intensity: 0.4, pace: 0.85, pitch: 1.03,
    catchphrase: 'Oh - um, hello.', laugh: 'titter',
    favouriteTopic: 'quiet corners', dislikes: 'crowds',
  }),
  dreamy: Object.freeze({
    baseline: 'amazement', intensity: 0.5, pace: 0.8, pitch: 0.97,
    catchphrase: 'Do you ever just... look at the sky?', laugh: 'sigh',
    favouriteTopic: 'the stars', dislikes: 'being interrupted',
  }),
  bossy: Object.freeze({
    baseline: 'concern', intensity: 0.7, pace: 1.1, pitch: 0.95,
    catchphrase: 'Someone has to keep this town in order.', laugh: 'snort',
    favouriteTopic: 'the notice board', dislikes: 'a job left half done',
  }),
  curious: Object.freeze({
    baseline: 'interest', intensity: 0.7, pace: 1.1, pitch: 1.05,
    catchphrase: "Ooh, what's that?", laugh: 'chuckle',
    favouriteTopic: 'whatever you just found', dislikes: 'a story with no ending',
  }),
  gentle: Object.freeze({
    baseline: 'happy', intensity: 0.45, pace: 0.95, pitch: 1.0,
    catchphrase: "Take your time, there's no rush.", laugh: 'warm',
    favouriteTopic: 'how everyone is doing', dislikes: 'raised voices',
  }),
});




export const CAT_PERSONALITY = 'bossy';
export const MOLE_PERSONALITY = 'shy';






export function personalityOf(villager) {
  return PERSONALITY_NAMES[seedOf(`personality|${villager.species}|${villager.id}`) % PERSONALITY_NAMES.length];
}
