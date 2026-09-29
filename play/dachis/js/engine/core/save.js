
export function createSaveSlot(key, version, migrate = s => s) {
  return {
    exists: () => { try { return !!localStorage.getItem(key); } catch (e) { return false; } },
    load() {
      try {
        const s = JSON.parse(localStorage.getItem(key));
        if (!s) return null;
        return s.v === version ? s : migrate(s);
      } catch (e) { console.warn('[save] unreadable', e); return null; }
    },
    save(data) {
      try { localStorage.setItem(key, JSON.stringify({ ...data, v: version })); return true; }
      catch (e) { console.warn('[save] failed', e); return false; }
    },
    clear() { try { localStorage.removeItem(key); } catch (e) {  } },
  };
}
