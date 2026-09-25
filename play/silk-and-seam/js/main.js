import { register, go, fitStage, applyMotion, checkAchievements } from './ui.js';
import { unlockAudio } from './audio.js';
import { installSkin } from './skin.js';
import hub from './screens/hub.js';
import orders from './screens/orders.js';
import sketch from './screens/sketch.js';
import cut from './screens/cut.js';
import sew from './screens/sew.js';
import embellish from './screens/embellish.js';
import reveal from './screens/reveal.js';
import market from './screens/market.js';
import gallery from './screens/gallery.js';
import town from './screens/town.js';

Object.entries({ hub, orders, sketch, cut, sew, embellish, reveal, market, gallery, town }).forEach(([k, v]) => register(k, v));
window.addEventListener('resize', fitStage);
window.addEventListener('pointerdown', unlockAudio, { once: false });
window.addEventListener('keydown', unlockAudio);
installSkin();
applyMotion();





const stop = (e) => { if (e.cancelable) e.preventDefault(); };
['gesturestart', 'gesturechange', 'gestureend'].forEach((t) => document.addEventListener(t, stop, { passive: false }));
document.addEventListener('touchmove', (e) => { if (e.touches.length > 1) stop(e); }, { passive: false });
document.addEventListener('dblclick', stop, { passive: false });
window.addEventListener('wheel', (e) => { if (e.ctrlKey) stop(e); }, { passive: false });
window.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '0'].includes(e.key)) stop(e); });
document.addEventListener('contextmenu', (e) => { if (!e.target.closest('input')) stop(e); });

fitStage();
go('hub');
checkAchievements();
