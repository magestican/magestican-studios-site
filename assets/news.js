
















import { NEWS } from './news-feed.mjs';

const SEEN_KEY = 'magestican.news.seen.v1';



const LABELS = {
  en: ["What's new", 'Close'],
  es: ['Novedades', 'Cerrar'],
  pt: ['Novidades', 'Fechar'],
  de: ['Neuigkeiten', 'Schließen'],
  id: ['Yang baru', 'Tutup'],
  tl: ['Ano ang bago', 'Isara'],
  vi: ['Có gì mới', 'Đóng'],
  ja: ['新着情報', '閉じる'],
  ko: ['새 소식', '닫기'],
  'zh-hans': ['最新动态', '关闭'],
  'zh-hant': ['最新動態', '關閉'],
};

export function labelsFor(lang) {
  const l = String(lang || 'en').toLowerCase();
  if (l.startsWith('zh')) return LABELS[/hant|tw|hk|mo/.test(l) ? 'zh-hant' : 'zh-hans'];
  return LABELS[l.split('-')[0]] || LABELS.en;
}


export function feedStamp(news = NEWS) {
  return news.length ? `${news[0].at}|${news[0].title}` : '';
}




const CSS = `
.mg-news-btn{position:fixed;right:max(16px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));
  z-index:45;display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:10px 16px;border-radius:999px;
  border:1px solid var(--line,#d9d2c1);background:var(--ink,#1c1a17);color:var(--paper-lit,#fffdf6);
  font:600 15px/1.2 var(--sans,system-ui,sans-serif);cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.22)}
.mg-news-btn:hover{background:#2e2a24}
.mg-news-btn:focus-visible{outline:3px solid var(--gold,#f4c95d);outline-offset:2px}
.mg-news-dot{width:9px;height:9px;border-radius:50%;background:var(--gold,#f4c95d);flex:none}
.mg-news-dot[hidden]{display:none}
.mg-news-panel{position:fixed;right:max(16px,env(safe-area-inset-right));bottom:calc(max(16px,env(safe-area-inset-bottom)) + 56px);
  z-index:90001;width:min(380px,calc(100vw - 32px));max-height:min(560px,calc(100vh - 120px));overflow:auto;
  box-sizing:border-box;padding:16px 16px 8px;border-radius:14px;border:1px solid var(--line,#d9d2c1);
  background:var(--paper-lit,#fffdf6);color:var(--ink,#1c1a17);box-shadow:0 12px 32px rgba(0,0,0,.25)}
.mg-news-panel[hidden]{display:none}
body .device-qr-card,body .device-qr-summon{bottom:calc(max(16px,env(safe-area-inset-bottom)) + 60px)}
.mg-news-panel:focus{outline:none}
.mg-news-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 8px}
.mg-news-head h2{margin:0;font:700 19px/1.2 var(--serif,Georgia,serif)}
.mg-news-close{min-height:36px;padding:6px 12px;border-radius:999px;border:1px solid var(--line,#d9d2c1);
  background:transparent;color:inherit;font:600 14px/1 var(--sans,system-ui,sans-serif);cursor:pointer}
.mg-news-close:focus-visible{outline:3px solid var(--gold-deep,#d9a92f);outline-offset:2px}
.mg-news-list{list-style:none;margin:0;padding:0}
.mg-news-list li{margin:0;padding:12px 0;border-top:1px solid var(--line,#d9d2c1);font-size:15px;line-height:1.45}
.mg-news-list time{display:block;margin:0 0 4px;font:600 12px/1.2 var(--sans,system-ui,sans-serif);
  color:var(--ink-faint,#4f4a41);letter-spacing:.02em}
.mg-news-list a,.mg-news-list span{font:400 15px/1.45 var(--sans,system-ui,sans-serif);color:inherit}
.mg-news-list a{text-decoration:underline;text-decoration-color:var(--gold-deep,#d9a92f);text-underline-offset:3px}
.mg-news-spacer{height:76px}
`;

function day(at) {
  
  const [y, m, d] = at.split('-').map(Number);
  const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1];
  return `${d} ${mon} ${y}`;
}

function el(tag, attrs = {}, text) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text !== undefined) e.textContent = text;
  return e;
}

export function mountNews(doc = document, news = NEWS) {
  if (!news.length || doc.querySelector('.mg-news-btn')) return null;
  const [open, close] = labelsFor(doc.documentElement.lang);
  const stamp = feedStamp(news);
  let seen = '';
  try { seen = localStorage.getItem(SEEN_KEY) || ''; } catch (_) {  }

  doc.head.appendChild(el('style', { 'data-mg-news': '' }, CSS));

  const btn = el('button', { type: 'button', class: 'mg-news-btn', 'aria-expanded': 'false', 'aria-controls': 'mg-news-panel' });
  const dot = el('span', { class: 'mg-news-dot', 'aria-hidden': 'true' });
  dot.hidden = seen === stamp;
  btn.append(dot, el('span', {}, open));

  const panel = el('section', { id: 'mg-news-panel', class: 'mg-news-panel', 'aria-label': open, lang: 'en', tabindex: '-1' });
  panel.hidden = true;
  const head = el('div', { class: 'mg-news-head' });
  const h = el('h2', {}, open);
  h.setAttribute('lang', doc.documentElement.lang || 'en');
  const x = el('button', { type: 'button', class: 'mg-news-close' }, close);
  x.setAttribute('lang', doc.documentElement.lang || 'en');
  head.append(h, x);
  const list = el('ul', { class: 'mg-news-list' });
  for (const n of news) {
    const li = el('li');
    li.append(el('time', { datetime: n.at }, day(n.at)));
    li.append(n.page ? el('a', { href: `/${n.page}` }, n.title) : el('span', {}, n.title));
    list.append(li);
  }
  panel.append(head, list);

  const spacer = el('div', { class: 'mg-news-spacer', 'aria-hidden': 'true' });
  const footer = doc.querySelector('footer');
  if (footer) {
    try { spacer.style.background = getComputedStyle(footer).backgroundColor; } catch (_) {  }
  }

  const setOpen = (on) => {
    panel.hidden = !on;
    btn.setAttribute('aria-expanded', String(on));
    if (on) {
      dot.hidden = true;
      try { localStorage.setItem(SEEN_KEY, stamp); } catch (_) {  }
      
      
      panel.focus({ preventScroll: true });
    }
  };
  btn.addEventListener('click', () => setOpen(panel.hidden));
  x.addEventListener('click', () => { setOpen(false); btn.focus(); });
  doc.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) { setOpen(false); btn.focus(); }
  });
  doc.addEventListener('click', (e) => {
    if (!panel.hidden && !panel.contains(e.target) && !btn.contains(e.target)) setOpen(false);
  });

  doc.body.append(spacer, panel, btn);
  return { btn, panel, setOpen };
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mountNews());
  else mountNews();
}
