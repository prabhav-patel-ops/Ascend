/* ===================================================================
   media.js — where speech clips actually live.

   Videos do not go in localStorage. A profile save is a JSON string in
   localStorage with a hard ceiling around 5MB, and a single two-minute
   clip is twenty times that. Putting one there does not fail loudly —
   it throws on write and takes the whole save with it.

   So clips live in IndexedDB as Blobs, in their own database, keyed by
   an id. That means:

   - A clip survives a reload and works with the network off. It is a
     real file on the device, not a URL that needs the internet.
   - Clips are NOT in the profile JSON, so they are not in the backup
     export either. That is a deliberate trade: an export stays a small
     text file you can email yourself. `state.creed` remembers what you
     watched and when; the file itself you re-add. The screen says so.
   - Nothing here can corrupt a board. The worst case is a clip that
     will not open, and every read resolves to null rather than
     throwing into a render.

   Files dropped into `public/speeches/` and listed in its manifest.json
   are the other source, and they need none of this — they ship with
   the build and are fetched by URL.
   =================================================================== */

const DB_NAME = "ascend-media";
const STORE = "clips";
const VERSION = 1;

const hasIdb = typeof indexedDB !== "undefined";

let dbPromise = null;

function open() {
  if (!hasIdb) return Promise.resolve(null);
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    let req;
    try {
      req = indexedDB.open(DB_NAME, VERSION);
    } catch {
      resolve(null);
      return;
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    /* Private browsing on some builds of Safari refuses to open a
       database at all. A null db means the shelf renders read-only
       rather than the tab breaking. */
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
  });

  return dbPromise;
}

function tx(mode, run) {
  return open().then(
    (db) =>
      new Promise((resolve) => {
        if (!db) { resolve(null); return; }
        let t;
        try {
          t = db.transaction(STORE, mode);
        } catch {
          resolve(null);
          return;
        }
        const store = t.objectStore(STORE);
        let out = null;
        try {
          const req = run(store);
          if (req) req.onsuccess = () => { out = req.result; };
        } catch {
          resolve(null);
          return;
        }
        t.oncomplete = () => resolve(out);
        t.onerror = () => resolve(null);
        t.onabort = () => resolve(null);
      })
  );
}

/** True when this device can keep clips at all. */
export const canStoreClips = hasIdb;

/**
 * Save a picked file. The blob is stored whole — no transcoding, no
 * re-encoding, nothing that could quietly ruin a file the person chose.
 */
export async function putClip(file, meta = {}) {
  if (!hasIdb || !file) return null;
  const clip = {
    id: `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name: (meta.name || file.name || "Untitled").replace(/\.[a-z0-9]{2,4}$/i, "").slice(0, 120),
    speaker: (meta.speaker || "").slice(0, 80),
    type: file.type || "video/mp4",
    size: file.size || 0,
    addedAt: new Date().toISOString(),
    blob: file,
  };
  const ok = await tx("readwrite", (s) => s.put(clip));
  if (ok === null && !(await getClip(clip.id))) return null;
  const { blob: _stored, ...rest } = clip;
  return rest;
}

/** Everything on the shelf, newest first, without the blobs. */
export async function listClips() {
  const all = await tx("readonly", (s) => s.getAll());
  if (!Array.isArray(all)) return [];
  return all
    .map(({ blob: raw, ...rest }) => ({ ...rest, size: rest.size || raw?.size || 0 }))
    .sort((a, b) => (a.addedAt < b.addedAt ? 1 : -1));
}

/** The blob for one clip, or null. Callers wrap it in a URL themselves. */
export async function getClip(id) {
  if (!id) return null;
  const row = await tx("readonly", (s) => s.get(id));
  return row || null;
}

/**
 * An object URL for one clip, plus the revoke to call when the player
 * is done with it. Leaking these pins the whole video in memory.
 */
export async function clipUrl(id) {
  const row = await getClip(id);
  if (!row?.blob || typeof URL === "undefined") return null;
  const url = URL.createObjectURL(row.blob);
  return { url, revoke: () => URL.revokeObjectURL(url) };
}

export async function removeClip(id) {
  if (!id) return false;
  await tx("readwrite", (s) => s.delete(id));
  return true;
}

/** What the browser says is used and available, in bytes. Both optional. */
export async function storageUse() {
  try {
    const est = await navigator.storage?.estimate?.();
    if (!est) return null;
    return { used: est.usage || 0, quota: est.quota || 0 };
  } catch {
    return null;
  }
}

/**
 * Ask the browser not to evict this data under pressure. Chrome grants
 * it silently to installed apps; Safari ignores it. Worth asking once
 * before someone stores half a gigabyte of speeches.
 */
export async function persistStorage() {
  try {
    if (await navigator.storage?.persisted?.()) return true;
    return (await navigator.storage?.persist?.()) || false;
  } catch {
    return false;
  }
}

export function prettyBytes(n) {
  const b = Number(n) || 0;
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
