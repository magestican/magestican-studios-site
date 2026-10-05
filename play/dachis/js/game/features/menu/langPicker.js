


import { LANGS, getLang, setLang, onLangChange } from '../../i18n/i18n.js';

export function mountLangPicker(host, { className = '' } = {}) {
  host.innerHTML = '';
  const row = document.createElement('div'); row.className = 'langPick ' + className;
  const label = document.createElement('span'); label.className = 'langLabel'; label.textContent = 'Language';
  const btns = document.createElement('div'); btns.className = 'langBtns'; btns.dataset.noi18n = '';
  const paint = () => { for (const b of btns.children) { const on = b.dataset.lang === getLang(); b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); } };
  for (const L of LANGS) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'langBtn tappable'; b.dataset.lang = L.id;
    b.lang = L.html; b.textContent = L.name;
    b.onclick = (e) => { e.stopPropagation(); if (L.id !== getLang()) setLang(L.id); };
    btns.appendChild(b);
  }
  row.append(label, btns); host.appendChild(row);
  paint();
  const off = onLangChange(paint);
  return () => off();
}
