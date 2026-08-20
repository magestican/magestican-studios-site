// Show a "scan on your phone" QR code overlay when the page is opened on a
// desktop (non-touch) browser. Tapping the QR fades it out; a small button
// re-summons it later.
//
// The QR is generated on the fly from `location.href` so it always points at
// the exact page the desktop user is looking at - whether that's the studio
// landing, the Team Bondage lobby with a `?join=` code, or the Zelakas play
// page.
//
// QR encoding via qrcode (loaded on demand from esm.sh so we ship no assets).

const DESKTOP_MIN_WIDTH = 900;   // px; below this we don't bother

export async function mountDeviceQr(opts = {}) {
  const isTouch = ('ontouchstart' in window)
    || (navigator.maxTouchPoints > 0)
    || window.matchMedia?.('(pointer: coarse)').matches;
  if (isTouch) return null;
  if (window.innerWidth < DESKTOP_MIN_WIDTH) return null;

  const url = opts.url || location.href;
  const label = opts.label || 'Play on your phone';
  const sublabel = opts.sublabel || 'Point your camera at this code to open this exact page on your phone.';

  injectStyles();

  const el = document.createElement('div');
  el.className = 'device-qr-card';
  el.innerHTML = `
    <div class="device-qr-head">${escapeHtml(label)}</div>
    <div class="device-qr-code"><div class="device-qr-loading">…</div></div>
    <div class="device-qr-sub">${escapeHtml(sublabel)}</div>
    <button class="device-qr-close" aria-label="Hide QR code">×</button>
  `;
  document.body.appendChild(el);

  // Tap-to-summon button (hidden until user closes the QR card).
  const btn = document.createElement('button');
  btn.className = 'device-qr-summon';
  btn.textContent = '📱 QR';
  btn.title = 'Show phone QR code';
  btn.style.display = 'none';
  document.body.appendChild(btn);

  el.querySelector('.device-qr-close').addEventListener('click', () => {
    el.style.display = 'none';
    btn.style.display = 'block';
  });
  btn.addEventListener('click', () => {
    el.style.display = '';
    btn.style.display = 'none';
  });

  try {
    const QRCode = (await import('https://esm.sh/qrcode@1.5.4')).default;
    const dataUrl = await QRCode.toDataURL(url, {
      margin: 1, width: 220,
      color: { dark: '#0a0d12', light: '#f6f1e6' },
    });
    const img = document.createElement('img');
    img.src = dataUrl;
    img.alt = 'QR code linking to this page';
    img.width = 220; img.height = 220;
    const holder = el.querySelector('.device-qr-code');
    holder.innerHTML = '';
    holder.appendChild(img);
  } catch (err) {
    console.error('QR generation failed', err);
    // Graceful fallback: hide the whole card if the CDN import fails.
    el.style.display = 'none';
  }

  return () => { el.remove(); btn.remove(); };
}

function injectStyles() {
  if (document.getElementById('device-qr-styles')) return;
  const s = document.createElement('style');
  s.id = 'device-qr-styles';
  s.textContent = `
    .device-qr-card {
      position: fixed; z-index: 90000;
      right: 20px; bottom: 20px;
      background: #f6f1e6; color: #1c1a17;
      border: 1px solid #1c1a17;
      border-radius: 12px;
      padding: 14px 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 6px 8px 0 rgba(0,0,0,0.18);
      max-width: 260px;
    }
    .device-qr-head { font-family: Georgia, serif; font-weight: 700; font-size: 15px; margin-bottom: 8px; }
    .device-qr-code {
      background: #f6f1e6; padding: 8px; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      min-height: 220px; min-width: 220px;
    }
    .device-qr-loading { color: #4a463f; font-size: 14px; }
    .device-qr-sub { margin-top: 8px; font-size: 12px; color: #4a463f; line-height: 1.4; }
    .device-qr-close {
      position: absolute; top: 6px; right: 8px;
      border: none; background: transparent; cursor: pointer;
      color: #1c1a17; font-size: 20px; padding: 4px 8px;
      -webkit-tap-highlight-color: transparent;
    }
    .device-qr-close:hover { color: #b73a2a; }
    .device-qr-summon {
      position: fixed; z-index: 90000;
      right: 20px; bottom: 20px;
      background: #1c1a17; color: #f6f1e6;
      border: 1px solid #f4c95d; border-radius: 8px;
      padding: 8px 12px; cursor: pointer;
      font: 600 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 3px 4px 0 rgba(0,0,0,0.15);
      -webkit-tap-highlight-color: transparent;
    }
    .device-qr-summon:hover { background: #26221c; }
  `;
  document.head.appendChild(s);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
