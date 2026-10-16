






import { normaliseLibrary } from './libraryModel.js';

export const LIBRARY_BLOB_MAX = 12000;

export function toLibraryDto(lib) {
  const blob = JSON.stringify(normaliseLibrary(lib));
  return blob.length <= LIBRARY_BLOB_MAX ? { v: 1, blob } : null;
}

export function fromLibraryDto(data) {
  if (!data || data.v !== 1 || typeof data.blob !== 'string' || data.blob.length > LIBRARY_BLOB_MAX) return null;
  try { return normaliseLibrary(JSON.parse(data.blob)); } catch { return null; }
}
