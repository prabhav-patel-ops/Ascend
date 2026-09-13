/* Profiles.

   Be precise about what this is: a profile on this device, not an account.
   There is no server, so there is nothing to authenticate against and nothing
   that would follow you to another phone. Everything stays in this browser's
   storage, exactly as it did before, and the sign-in screen exists to answer
   "who is using this" and "what did they answer at setup" — not to keep anyone
   out. The UI says so rather than implying a security it does not have.

   The seam is deliberate. Every read and write of a profile's data goes
   through the functions here, so putting a real backend behind them later is
   a change in this file and nowhere else.                                   */

const PROFILES_KEY = "ascend.profiles";
const CURRENT_KEY = "ascend.current";
const SAVE_PREFIX = "ascend.save.";

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn("Could not write", key, err);
    return false;
  }
}

export function listProfiles() {
  const list = read(PROFILES_KEY, []);
  return Array.isArray(list) ? list : [];
}

export function currentProfileId() {
  try {
    return localStorage.getItem(CURRENT_KEY) || null;
  } catch {
    return null;
  }
}

export function currentProfile() {
  const id = currentProfileId();
  return id ? listProfiles().find((p) => p.id === id) || null : null;
}

export function createProfile(name) {
  const clean = String(name || "").trim().slice(0, 40) || "Hunter";
  const profile = {
    id: `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name: clean,
    createdAt: new Date().toISOString().slice(0, 10),
    onboarded: false,
  };
  write(PROFILES_KEY, [...listProfiles(), profile]);
  signIn(profile.id);
  return profile;
}

export function updateProfile(id, patch) {
  const next = listProfiles().map((p) => (p.id === id ? { ...p, ...patch } : p));
  write(PROFILES_KEY, next);
  return next.find((p) => p.id === id) || null;
}

export function signIn(id) {
  try {
    localStorage.setItem(CURRENT_KEY, id);
  } catch { /* a private window can refuse; the caller still has the id */ }
  return id;
}

export function signOut() {
  try {
    localStorage.removeItem(CURRENT_KEY);
  } catch { /* nothing to do */ }
}

/**
 * Remove a profile and everything it logged. Deliberately total: a profile
 * left behind with its data intact is worse than no delete at all.
 */
export function deleteProfile(id) {
  write(PROFILES_KEY, listProfiles().filter((p) => p.id !== id));
  try {
    localStorage.removeItem(SAVE_PREFIX + id);
  } catch { /* already gone */ }
  if (currentProfileId() === id) signOut();
}

/* ---- the save, scoped to one profile ---- */

export function saveKeyFor(id) {
  return SAVE_PREFIX + id;
}

export function readSave(id) {
  if (!id) return null;
  return read(saveKeyFor(id), null);
}

export function writeSave(id, state) {
  if (!id) return false;
  return write(saveKeyFor(id), state);
}
