// Storage layer for offline-downloaded tracks. Audio (and cover) files are
// fetched once and stored as real Blobs in IndexedDB, so playback later
// reads straight from local disk via a blob: URL — no network involved at
// all. This is deliberately NOT built on the Cache API / service worker
// fetch interception, because iOS Safari has a long history of not routing
// <audio>/<video> range requests through a service worker's fetch handler,
// which would make offline playback unreliable on iPhone specifically.
// Blob URLs sidestep that entirely and work the same way on every platform.

const DB_NAME = 'music-world-offline';
const DB_VERSION = 1;
const STORE = 'tracks';

// Ask the browser not to auto-evict this site's storage under disk pressure.
// Without this, mobile browsers (Chrome on Android especially) can silently
// clear IndexedDB data for sites that aren't "persisted" — which is exactly
// what makes a downloaded track vanish after the app is closed and reopened.
// Best-effort only: Safari/iOS does not expose navigator.storage.persist(),
// so this cannot fully guarantee persistence there, but it does help on
// Android/Chrome and is harmless everywhere else.
let persistenceRequested = false;
async function ensurePersistentStorage() {
  if (persistenceRequested) return;
  persistenceRequested = true;
  try {
    if (navigator.storage && navigator.storage.persist) {
      const already = (await navigator.storage.persisted?.()) ?? false;
      if (!already) await navigator.storage.persist();
    }
  } catch {
    // Best effort — not supported everywhere.
  }
}

export type OfflineTrackRecord = {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  coverUrl: string | null;
  audioBlob: Blob;
  coverBlob: Blob | null;
  savedAt: number;
};

export type OfflineTrackMeta = Omit<OfflineTrackRecord, 'audioBlob' | 'coverBlob'>;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveOfflineTrack(input: {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  coverUrl: string | null;
  audioUrl: string;
}): Promise<void> {
  await ensurePersistentStorage();
  const audioRes = await fetch(input.audioUrl);
  if (!audioRes.ok) throw new Error('Failed to fetch audio for offline download');
  const audioBlob = await audioRes.blob();

  let coverBlob: Blob | null = null;
  if (input.coverUrl) {
    try {
      const coverRes = await fetch(input.coverUrl);
      if (coverRes.ok) coverBlob = await coverRes.blob();
    } catch {
      // Cover art is a nice-to-have offline — skip silently if it fails.
    }
  }

  const record: OfflineTrackRecord = {
    id: input.id,
    title: input.title,
    artist: input.artist,
    artistId: input.artistId,
    coverUrl: input.coverUrl,
    audioBlob,
    coverBlob,
    savedAt: Date.now(),
  };

  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function removeOfflineTrack(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  revokeObjectUrls(id);
}

export async function isTrackOffline(id: string): Promise<boolean> {
  try {
    const db = await openDb();
    const result = await new Promise<boolean>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getKey(id);
      req.onsuccess = () => resolve(req.result !== undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return result;
  } catch {
    return false;
  }
}

export async function getAllOfflineTracks(): Promise<OfflineTrackMeta[]> {
  try {
    const db = await openDb();
    const records = await new Promise<OfflineTrackRecord[]>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result as OfflineTrackRecord[]);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return records
      .sort((a, b) => b.savedAt - a.savedAt)
      .map(({ audioBlob, coverBlob, ...meta }) => {
        void audioBlob;
        void coverBlob;
        return meta;
      });
  } catch {
    return [];
  }
}

// Object URLs are created once per track id and reused, so we don't leak
// memory by minting a fresh blob URL every time a track is looked up.
const objectUrlCache = new Map<string, string>();

function revokeObjectUrls(id: string) {
  const audioUrl = objectUrlCache.get(id);
  if (audioUrl) {
    URL.revokeObjectURL(audioUrl);
    objectUrlCache.delete(id);
  }
  const coverKey = `${id}:cover`;
  const coverUrl = objectUrlCache.get(coverKey);
  if (coverUrl) {
    URL.revokeObjectURL(coverUrl);
    objectUrlCache.delete(coverKey);
  }
}

export async function getOfflineAudioUrl(id: string): Promise<string | null> {
  const cached = objectUrlCache.get(id);
  if (cached) return cached;

  try {
    const db = await openDb();
    const record = await new Promise<OfflineTrackRecord | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result as OfflineTrackRecord | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (!record) return null;

    const url = URL.createObjectURL(record.audioBlob);
    objectUrlCache.set(id, url);
    return url;
  } catch {
    return null;
  }
}

export async function getOfflineCoverUrl(id: string): Promise<string | null> {
  const cacheKey = `${id}:cover`;
  const cached = objectUrlCache.get(cacheKey);
  if (cached) return cached;

  try {
    const db = await openDb();
    const record = await new Promise<OfflineTrackRecord | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result as OfflineTrackRecord | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (!record || !record.coverBlob) return null;

    const url = URL.createObjectURL(record.coverBlob);
    objectUrlCache.set(cacheKey, url);
    return url;
  } catch {
    return null;
  }
}
