







import { useLanguage, activeLanguage, t } from '../../../web-engine/i18n/tr.js';
import { JA, ES, PT, TL, KO, ID, VI } from './translations.js';


export const DICTS = Object.freeze({ ja: JA, es: ES, pt: PT, tl: TL, ko: KO, id: ID, vi: VI });
useLanguage(DICTS);

const STATIC = [
  ['#game@aria-label', t('Glimmercoil game board')],
  ['#title .sub', t('The grid snake, reborn in light. Dive from the shallows to the trench, and circle whole shoals with your body.')],
  ['[data-mode="dive"]', t('Dive')],
  ['[data-mode="daily"]', t('Today\'s dive')],
  ['[data-mode="classic"]', t('Classic board')],
  ['#title .keys', t('Swipe, arrow keys, WASD or a gamepad. P to pause.')],
  ['#pauseBtn@aria-label', t('Pause')],
  ['#overTitle2', t('Paused')],
  ['#resume', t('Resume')],
  ['#quit', t('Quit to menu (ends this run)')],
  ['#again', t('Dive again')],
  ['#menu', t('Menu')],
];

if (activeLanguage() !== 'en' && globalThis.document) {
  for (const [target, words] of STATIC) {
    const [sel, attr] = target.split('@');
    for (const el of document.querySelectorAll(sel)) {
      if (attr) el.setAttribute(attr, words); else el.textContent = words;
    }
  }
}
