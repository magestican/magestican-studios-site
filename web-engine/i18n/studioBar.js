





import { activeLanguage, t } from './tr.js';
import { localGameName } from './gameNames.js';

export function translateStudioBar(doc = globalThis.document) {
  if (!doc?.querySelector || activeLanguage() === 'en') return;
  doc.querySelector('.studio-home')?.setAttribute('aria-label', t('Magestican Studios home'));
  const back = doc.querySelector('.studio-back');
  const id = /\/play\/([^/]+)\//.exec(back?.getAttribute('href') ?? '')?.[1];
  const name = id && localGameName(id, activeLanguage());
  if (!name) return;
  back.textContent = `← ${name}`;
  
  
  back.style.fontSize = 'min(17px, 3.6vw)';
}
