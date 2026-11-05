

import { useLanguage } from '../../../web-engine/i18n/tr.js';
import { JA_FAMILY } from '../../../web-engine/i18n/jaFamily.js';
import { translateStudioBar } from '../../../web-engine/i18n/studioBar.js';
import { JA } from './ja.js';

useLanguage({ ja: { ...JA_FAMILY, ...JA } });
translateStudioBar();
