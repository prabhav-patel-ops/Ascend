import {
  DEFAULT_PROGRESSION, DEFAULT_TEMPLATES, MISSION,
  SEED_GATES, SEED_SHADOWS, SEED_SESSIONS, SEEDS_VERSION,
  DEFAULT_REMINDERS, FOCUS_TARGETS,
} from "./data.js";
import { STATS, DEFAULT_SCHEDULE } from "./engine.js";
import { readSave, writeSave } from "./profile.js";

/* Templates are GENERATED per person and are their data, not ours. There is
   deliberately no "replace saved templates from the defaults" migration here:
   the version of that rule in the original app would silently overwrite a
   board somebody answered questions to build. */
export const STATE_VERSION = 1;

const DIFFICULTY_KEYS = ["normal", "hard", "monarch"];
const FX_KEYS = ["full", "lite", "off"];

export function emptyState() {
  const statXp = {};
  STATS.forEach((s) => (statXp[s] = 0));
  return {
    version: STATE_VERSION,
    seedsVersion: SEEDS_VERSION,

    /* Set by onboarding. Until then there is no board and the app shows the
       wizard instead of an empty one. */
    onboarded: false,
    answers: null,
    ratchetRules: [],
    hunter: { name: MISSION.hunter, createdAt: null },
    totalXp: 0,
    statXp,
    seenLevel: 1,
    progression: { ...DEFAULT_PROGRESSION },
    templates: JSON.parse(JSON.stringify(DEFAULT_TEMPLATES)),
    days: {},
    streak: { current: 0, best: 0 },
    cfHistory: [],
    lastRatchet: null,
    gates: SEED_GATES.map((g) => ({ ...g })),
    splits: {},
    seasons: [],
    shadows: SEED_SHADOWS.map((s) => ({ ...s })),
    body: {
      weights: [],
      waist: [],
      meals: {},
      water: {},
      sleep: {},
      training: {},
      exNames: {},
      focus: {},
      journal: {},
      photos: [],
    },

    /* The Creed screen's own memory. Which speeches were played through,
       and which lines were kept. Deliberately outside `body` — it is not
       a measurement of anything, and nothing in engine.js reads it. The
       clips themselves are Blobs in IndexedDB (see lib/media.js), so what
       is here is small enough to sit in the backup. */
    creed: { watched: {}, pinned: [] },

    settings: {
      targets: { ...MISSION.targets },
      ratchetStreak: 8,
      soundOn: true,
      difficulty: "normal",
      notifyOn: false,

      /* "full" | "lite" | "off". `prefers-reduced-motion` overrides it in
         fx.js regardless of what is stored here. */
      fx: "full",
      hapticsOn: true,
      reminders: DEFAULT_REMINDERS.map((r) => ({ ...r })),
      schedule: JSON.parse(JSON.stringify(DEFAULT_SCHEDULE)),
      focusCaps: FOCUS_TARGETS.map((f) => ({ ...f })),
    },
  };
}

/**
 * Merge a saved blob over a fresh state. Nested sections are merged one level
 * deeper so a backup written by an older version cannot leave a hole that
 * crashes a screen.
 */
export function hydrate(parsed) {
  const base = emptyState();
  if (!parsed || typeof parsed !== "object") return base;
  const merged = { ...base, ...parsed };
  ["hunter", "progression", "body", "settings", "statXp"].forEach((k) => {
    merged[k] = { ...base[k], ...(parsed[k] || {}) };
  });
  merged.settings.targets = { ...base.settings.targets, ...(parsed.settings?.targets || {}) };
  ["days", "gates", "shadows", "cfHistory"].forEach((k) => {
    if (merged[k] == null) merged[k] = base[k];
  });
  merged.streak = { ...base.streak, ...(parsed.streak || {}) };

  /* Every training entry carries both shapes: `done` for the legacy checklist
     days and `sets` for the days that log real loads. */
  Object.keys(merged.body.training || {}).forEach((dk) => {
    const e = merged.body.training[dk] || {};
    merged.body.training[dk] = {
      ...e,
      done: Array.isArray(e.done) ? e.done : [],
      sets: e.sets && typeof e.sets === "object" ? e.sets : {},
    };
  });

  /* Sections that arrived after the first release. A save written before them
     has no key at all, so each needs a floor rather than a shallow merge. */
  if (!Array.isArray(merged.seasons)) merged.seasons = [];

  /* Days written before side quests existed have no extras array, and every
     screen that reads one maps over it. */
  Object.values(merged.days || {}).forEach((day) => {
    if (!Array.isArray(day.extras)) day.extras = [];
  });
  if (!merged.body.focus || typeof merged.body.focus !== "object") merged.body.focus = {};
  if (!merged.body.journal || typeof merged.body.journal !== "object") merged.body.journal = {};
  if (!merged.body.exNames || typeof merged.body.exNames !== "object") merged.body.exNames = {};
  if (!DIFFICULTY_KEYS.includes(merged.settings.difficulty)) merged.settings.difficulty = "normal";
  if (!FX_KEYS.includes(merged.settings.fx)) merged.settings.fx = "full";
  if (typeof merged.settings.hapticsOn !== "boolean") merged.settings.hapticsOn = true;

  /* Creed arrived after the first release, so a save from before it has no
     key at all. Both halves are floored independently: a backup hand-edited
     down to `{"creed": {}}` must still render the screen. */
  const creed = merged.creed && typeof merged.creed === "object" ? merged.creed : {};
  merged.creed = {
    watched: creed.watched && typeof creed.watched === "object" ? creed.watched : {},
    pinned: Array.isArray(creed.pinned) ? creed.pinned.filter((s) => typeof s === "string") : [],
  };

  merged.settings.schedule = {
    ...base.settings.schedule,
    ...(parsed.settings?.schedule || {}),
    fixed: Array.isArray(parsed.settings?.schedule?.fixed)
      ? parsed.settings.schedule.fixed
      : base.settings.schedule.fixed,
  };

  /* Reminders merge by id so a new default reminder added in a later release
     appears for existing users, while their edited times and toggles survive. */
  const saved = new Map((parsed.settings?.reminders || []).map((r) => [r.id, r]));
  merged.settings.reminders = DEFAULT_REMINDERS.map((d) => ({ ...d, ...(saved.get(d.id) || {}) }));
  (parsed.settings?.reminders || []).forEach((r) => {
    if (!DEFAULT_REMINDERS.some((d) => d.id === r.id)) merged.settings.reminders.push({ ...r });
  });

  const caps = new Map((parsed.settings?.focusCaps || []).map((c) => [c.id, c]));
  merged.settings.focusCaps = FOCUS_TARGETS.map((f) => ({ ...f, ...(caps.get(f.id) || {}) }));

  if (!Array.isArray(merged.ratchetRules)) merged.ratchetRules = [];
  if (!merged.splits || typeof merged.splits !== "object") merged.splits = {};
  if (typeof merged.onboarded !== "boolean") merged.onboarded = false;

  return merged;
}

export function load(profileId) {
  try {
    const raw = readSave(profileId);
    if (!raw) return emptyState();
    return hydrate(raw);
  } catch (err) {
    console.warn("Could not read saved data, starting fresh.", err);
    return emptyState();
  }
}

export function save(profileId, state) {
  return writeSave(profileId, state);
}

export function exportJson(state) {
  return JSON.stringify(state, null, 2);
}

export function importJson(text) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== "object" || !("statXp" in parsed)) {
    throw new Error("That file is not a ASCEND backup.");
  }
  return hydrate(parsed);
}
