
























const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]', '']);

export function isLocalHostname(hostname) {
  const h = String(hostname == null ? '' : hostname).toLowerCase();
  if (LOCAL_HOSTS.has(h)) return true;
  if (h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal')) return true;
  if (/^127\./.test(h)) return true;                 
  if (/^10\./.test(h)) return true;                  
  if (/^192\.168\./.test(h)) return true;            
  if (/^169\.254\./.test(h)) return true;            
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;  
  return false;
}







export function shouldStartAnalytics({ hostname, protocol, force = false } = {}) {
  if (force) return true;
  const p = String(protocol == null ? '' : protocol).toLowerCase();
  if (p === 'file:') return false;
  return !isLocalHostname(hostname);
}
