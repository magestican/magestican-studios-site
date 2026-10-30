













const form = document.getElementById('contact-form');
if (form) {
  const captchaEl = form.querySelector('.contact-captcha');
  const status = form.querySelector('.contact-status');
  const button = form.querySelector('button[type="submit"]');
  const msg = (k) => form.querySelector(`[data-msg="${k}"]`)?.textContent || k;
  const say = (text) => {
    status.textContent = text;
  };
  let widgetId = null;
  let loading = null;

  const loadCaptcha = () => {
    if (loading) return loading;
    loading = new Promise((resolve) => {
      window.__msCaptchaReady = () => {
        widgetId = window.grecaptcha.enterprise.render(captchaEl, { sitekey: captchaEl.dataset.sitekey });
        resolve();
      };
      const s = document.createElement('script');
      s.src = 'https://www.google.com/recaptcha/enterprise.js?render=explicit&onload=__msCaptchaReady';
      s.async = true;
      document.head.append(s);
    });
    return loading;
  };

  form.addEventListener('focusin', loadCaptcha, { once: true });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          loadCaptcha();
        }
      },
      { rootMargin: '400px 0px' },
    );
    io.observe(form);
  } else loadCaptcha();

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (!data.name?.trim() || !data.email?.trim() || !data.message?.trim()) return say(msg('missing'));
    const token = widgetId == null ? '' : window.grecaptcha.enterprise.getResponse(widgetId);
    if (!token) return say(msg('captcha'));
    button.disabled = true;
    say(msg('sending'));
    try {
      const res = await fetch(form.dataset.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, token }),
      });
      if (res.ok) {
        form.reset();
        say(msg('sent'));
      } else {
        const body = await res.json().catch(() => ({}));
        say(body.error || msg('failed'));
      }
    } catch {
      say(msg('failed'));
    } finally {
      if (widgetId != null) window.grecaptcha.enterprise.reset(widgetId);
      button.disabled = false;
    }
  });
}
