























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



export function mountSupportLink(parent, { compact = false, username = KOFI_USERNAME } = {}) {
  const url = supportUrl(username);
  if (!url || !parent) return null;
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  
  
  a.rel = 'noopener noreferrer';
  a.className = 'support-link';
  a.textContent = compact ? '☕ Support' : '☕ Support Magestican Studios on Ko-fi';
  a.setAttribute('aria-label', 'Support Magestican Studios on Ko-fi (opens in a new tab)');
  parent.appendChild(a);
  return a;
}
