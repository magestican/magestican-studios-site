






















export const REUSE_TRIES = 4;
export const REUSE_RETRY_MS = 1500;
const KEY_PREFIX = 'magestican.roomCode.';
const SAFE = /^[A-Za-z0-9_-]{3,48}$/;

function defaultStorage() {
  try { return globalThis.localStorage ?? null; } catch { return null; } 
}






export function stickyRoomCode(game, { storage = defaultStorage(), valid = () => true } = {}) {
  if (!game) throw new Error('stickyRoomCode needs a game key');
  const key = KEY_PREFIX + game;
  const read = () => {
    try {
      const v = storage?.getItem(key) ?? null;
      return v && SAFE.test(v) && valid(v) ? v : null;
    } catch { return null; }
  };
  const write = (code) => { try { storage?.setItem(key, code); } catch {  } };
  
  let reusing = false;
  
  let timer = null;
  const cancel = () => { if (timer !== null) { clearTimeout(timer); timer = null; } };

  return {
    
    saved: read,

    





    hint(attempt, make, tries = 5) {
      if (attempt === 0) { cancel(); reusing = !!read(); }
      if (reusing && attempt < REUSE_TRIES) return read();
      const fresh = attempt - (reusing ? REUSE_TRIES : 0);
      if (fresh >= tries) return null;
      const code = make();
      if (code && SAFE.test(code)) write(code);
      return code;
    },

    
    retryDelay(attempt) {
      return reusing && attempt + 1 < REUSE_TRIES ? REUSE_RETRY_MS : 0;
    },

    
    retry(attempt, next) {
      cancel();
      const ms = this.retryDelay(attempt);
      if (ms <= 0) { next(); return; }
      timer = setTimeout(() => { timer = null; next(); }, ms);
    },

    
    cancel,

    
    keep(code) { if (code && SAFE.test(code) && valid(code)) write(code); },

    
    forget() { try { storage?.removeItem(key); } catch {  } },
  };
}



export const NEW_CODE_WORDS = Object.freeze({
  en: { label: 'New code', title: 'Make a new room code. The old code and link stop working.' },
  es: { label: 'Código nuevo', title: 'Crea un código de sala nuevo. El código y el enlace anteriores dejan de funcionar.' },
  pt: { label: 'Novo código', title: 'Cria um novo código de sala. O código e o link antigos deixam de funcionar.' },
  fr: { label: 'Nouveau code', title: 'Crée un nouveau code de salle. L’ancien code et le lien ne marchent plus.' },
  de: { label: 'Neuer Code', title: 'Erstellt einen neuen Raumcode. Alter Code und Link funktionieren nicht mehr.' },
  it: { label: 'Nuovo codice', title: 'Crea un nuovo codice stanza. Il vecchio codice e il link smettono di funzionare.' },
  tl: { label: 'Bagong code', title: 'Gumawa ng bagong room code. Hindi na gagana ang lumang code at link.' },
  ja: { label: '新しいコード', title: '新しい部屋コードを作ります。前のコードとリンクは使えなくなります。' },
  ko: { label: '새 코드', title: '새 방 코드를 만듭니다. 이전 코드와 링크는 더 이상 쓸 수 없습니다.' },
  id: { label: 'Kode baru', title: 'Buat kode ruang baru. Kode dan tautan lama tidak berlaku lagi.' },
  vi: { label: 'Mã mới', title: 'Tạo mã phòng mới. Mã và liên kết cũ sẽ không dùng được nữa.' },
  'zh-Hant': { label: '新代碼', title: '建立新的房間代碼。舊代碼和連結將失效。' },
  'zh-Hans': { label: '新代码', title: '创建新的房间代码。旧代码和链接将失效。' },
});


export function newCodeWords(lang = 'en') {
  const l = String(lang || 'en');
  if (NEW_CODE_WORDS[l]) return NEW_CODE_WORDS[l];
  if (/^zh-(TW|HK|MO|Hant)/i.test(l)) return NEW_CODE_WORDS['zh-Hant'];
  if (/^zh/i.test(l)) return NEW_CODE_WORDS['zh-Hans'];
  return NEW_CODE_WORDS[l.split('-')[0]] ?? NEW_CODE_WORDS.en;
}








export function newCodeButton(anchor, { lang = 'en', onReset, id = 'new-room-code' }) {
  const doc = anchor?.ownerDocument ?? globalThis.document;
  if (!anchor || !doc) return { button: null, show() {} };
  const words = newCodeWords(lang);
  const b = doc.getElementById(id) ?? doc.createElement('button');
  b.type = 'button';
  b.id = id;
  
  
  
  const look = String(anchor.className || '').split(/\s+/).filter((c) => c && !/^mg-i-/.test(c));
  if (look.includes('mg-i')) look.push('mg-i-new_game');
  b.className = look.join(' ');
  b.textContent = words.label;
  b.title = words.title;
  b.setAttribute('aria-label', words.title);
  b.dataset.newRoomCode = '1';
  b.hidden = true;
  if (!b.isConnected) anchor.insertAdjacentElement('afterend', b);
  if (!b.dataset.wired) {
    b.dataset.wired = '1';
    b.addEventListener('click', () => onReset());
  }
  return { button: b, show(on) { b.hidden = !on; } };
}
