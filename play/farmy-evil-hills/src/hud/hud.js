





import { promptFor } from '../../../../web-engine/horror/struggle.js';
import { tape } from '../audio/music.js';

export const $ = (id) => document.getElementById(id);




const TEACH_FRAMES = 3000;
let taught = 0;

export const hud = {
  fatal(text) { const b = $('boot'); if (b) { b.style.display = 'flex'; b.innerHTML = `<div style="max-width:46ch">${text}</div>`; } },
  lift(toLevel) {
    const el = $('msg');
    el.textContent = toLevel ? `LIFT — DECK ${toLevel}` : '';
  },
  
  
  
  msg(text) { $('msg').textContent = text || ''; },
  
  
  
  lore(ch) {
    const el = $('lore');
    if (!el) return;
    if (!ch) { el.style.display = 'none'; return; }
    $('loreTag').textContent = 'STATION ARCHIVE - RECOVERED DOCUMENT';
    $('loreTitle').textContent = ch.title;
    $('loreBody').textContent = ch.text;
    el.style.display = 'block';
  },
  dead() {
    $('overTitle').textContent = 'THE LIVESTOCK HAD OPINIONS';
    $('overBody').textContent = 'Xander does not report back.';
    $('over').style.display = 'flex';
  },
  won() {
    $('overTitle').textContent = 'HESPER-4 IS QUIET AGAIN';
    $('overBody').textContent = 'The Agency will want the paperwork before the survivors.';
    
    
    const b = $('again');
    if (b) b.textContent = 'Again, from the top';
    $('over').style.display = 'flex';
  },
  paint(s) {
    const pct = (v, m) => `${Math.max(0, Math.min(100, (v / m) * 100))}%`;
    $('hpFill').style.width = pct(s.health, s.maxHealth);
    $('hpVal').textContent = Math.max(0, Math.round(s.health));
    $('spFill').style.width = pct(s.stamina, 100);
    $('spVal').textContent = Math.max(0, Math.round(s.stamina));
    
    
    
    $('epFill').style.width = pct(s.ep ?? 100, 100);
    $('epVal').textContent = Math.round(s.ep ?? 100);

    
    
    
    
    
    
    
    {
      const frac = s.maxHealth > 0 ? s.health / s.maxHealth : 1;
      const b = document.body;
      b.classList.toggle('lowHp', frac <= 0.34 && s.health > 0);
      b.classList.toggle('dangerHp', frac <= 0.17 && s.health > 0);
    }

    
    
    $('wpAmmo').textContent = s.ammo == null ? '--' : s.ammo;
    $('wpRange').textContent = s.range == null ? '--' : `${s.range} M`;
    $('wpScreen')?.classList.toggle('empty', s.ammo === 0);

    
    
    
    
    
    
    $('count').textContent = s.remaining
      ? `DECK ${s.deckNo} \u00b7 ${s.remaining} HUNTING`
      : `DECK ${s.deckNo} \u00b7 CLEAR`;
    $('flash').style.opacity = s.flash ? '0.30' : '0';

    
    
    
    
    
    
    
    
    
    document.body.classList.toggle('struggling', !!s.struggle);
    if (s.struggle) {
      $('qte').style.display = 'block';
      $('qteFill').style.width = `${Math.min(100, s.struggle.progress * 100)}%`;
      
      
      
      
      
      
      
      
      const how = promptFor(s.struggle.verb ?? 'mash', s.lastInput ?? 'key');
      $('qteHow').textContent = how.text;
      $('qte').dataset.icon = how.icon;
      
      
      
      
      
      $('qteBtn').textContent = how.icon === 'mash' ? 'MASH'
        : (how.icon === 'dial' ? 'CIRCLE' : 'SLASH');
    } else {
      $('qte').style.display = 'none';
    }
    $('tapeMini').classList.toggle('on', tape.audible);

    
    
    
    
    
    
    
    
    
    if (taught < TEACH_FRAMES) {
      taught += 1;
      if (taught === TEACH_FRAMES) document.body.classList.add('taught');
    }

    
    
    
    
    const vox = document.getElementById('vox');
    if (vox) {
      if (s.bark) {
        const pa = s.bark.who === 'pa';
        
        
        vox.textContent = pa ? `[ PA ] ${s.bark.text}` : s.bark.text;
        vox.classList.toggle('pa', pa);
        vox.style.display = 'block';
      } else if (vox.textContent) {
        vox.textContent = '';
        vox.style.display = 'none';
      }
    }
  },
};
