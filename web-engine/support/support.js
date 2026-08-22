// The "support this" link.
//
// Bryan asked for a Ko-fi link "that somehow pays me on google cloud or on my
// stripe account". Ko-fi is the front end; **Stripe is the payout rail** —
// you connect a Stripe account to Ko-fi once and supporter payments land
// there. Google Cloud has no product that takes a payment from a member of the
// public, so Stripe is the only half of that sentence that can be true.
//
// Two deliberate constraints:
//
// 1. **A PLAIN LINK, never the Ko-fi JS widget.** The widget is a third-party
//    script that sets cookies and phones home. This site's footer says "No
//    trackers" and its whole pitch is that it works on locked-down corporate
//    machines — the same reasoning that got advertising declined
//    (docs/BACKLOG.md). An <a href> costs nothing, loads nothing, and cannot
//    be blocked by an ad filter.
// 2. **Nothing renders until it is configured.** While USERNAME is still the
//    placeholder, mountSupportLink() does nothing at all, so a half-set-up
//    link can never ship pointing at a 404.

// >>> Bryan: put your Ko-fi username here (the bit after ko-fi.com/). <<<
// Set up: create a free account at https://ko-fi.com, then Settings ->
// Payments -> connect Stripe. Ko-fi takes 0% on donations; Stripe's normal
// processing fee applies. Nothing else in this file needs to change.
export const KOFI_USERNAME = 'YOUR_KOFI_NAME';

export const PLACEHOLDER = 'YOUR_KOFI_NAME';

export function isConfigured(username = KOFI_USERNAME) {
  return typeof username === 'string'
    && username.length > 0
    && username !== PLACEHOLDER;
}

export function supportUrl(username = KOFI_USERNAME) {
  return isConfigured(username) ? `https://ko-fi.com/${username}` : null;
}

// Append a support link to `parent`. Returns the element, or null if the
// username is still the placeholder.
export function mountSupportLink(parent, { compact = false, username = KOFI_USERNAME } = {}) {
  const url = supportUrl(username);
  if (!url || !parent) return null;
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  // noopener because target=_blank otherwise hands the new tab a handle back
  // to this window; noreferrer keeps the referrer off the request.
  a.rel = 'noopener noreferrer';
  a.className = 'support-link';
  a.textContent = compact ? '☕ Support' : '☕ Support Magestican Studios on Ko-fi';
  a.setAttribute('aria-label', 'Support Magestican Studios on Ko-fi (opens in a new tab)');
  parent.appendChild(a);
  return a;
}
