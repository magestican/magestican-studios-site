














































export function resolveTouchMode({
  maxTouchPoints = 0, hasTouchEvents = false, search = '',
} = {}) {
  
  
  
  let flag = null;
  try {
    flag = new URLSearchParams(search || '').get('touch');
  } catch {
    
    flag = null;
  }
  const v = (flag ?? '').toLowerCase();

  if (v === 'force' || v === 'on' || v === '1' || v === 'true') {
    
    
    
    
    return { overlay: true, mouseAsTouch: true, forced: true, reason: 'forced-on' };
  }
  if (v === 'off' || v === '0' || v === 'false') {
    
    
    
    
    return { overlay: false, mouseAsTouch: false, forced: true, reason: 'forced-off' };
  }

  
  
  
  
  
  return {
    overlay: hasTouchEvents || (maxTouchPoints ?? 0) > 0,
    mouseAsTouch: false,
    forced: false,
    reason: 'detected',
  };
}
