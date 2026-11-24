







import { useLanguage, activeLanguage, t } from '../../../web-engine/i18n/tr.js';
import { JA, ES } from './translations.js';

useLanguage({ ja: JA, es: ES });

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
