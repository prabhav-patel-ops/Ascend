/* Turning onboarding answers into a working system.

   The one rule that governs everything here: a generated day must be worth
   roughly the same as anyone else's generated day.

   Clearing is a ratio and penalties are denominated in days of work, so if
   someone who picks twelve habits gets a 600 XP day while someone who picks
   five gets 250, they are playing two different games — the first levels twice
   as fast and is punished twice as hard for the same proportional slip. So the
   picked habits keep their RELATIVE weights and the whole day is scaled to a
   common total. What you choose changes the shape of a day, never its price. */

import { ANCHORS, DOMAINS, GROUP_EXERCISES, SPLITS, habitOf } from "./catalog.js";
import { STATS } from "./engine.js";

/** What a weekday is worth, for everyone. */
export const TARGET_DAY_XP = 270;

const WEEKDAYS = [1, 2, 3, 4, 5];
const WEEKEND = [0, 6];

function appliesOn(habit, weekday, trainingDays) {
  switch (habit.cadence) {
    case "weekday": return WEEKDAYS.includes(weekday);
    case "weekend": return WEEKEND.includes(weekday);
    case "rest": return weekday === 0;
    default: return true;
  }
}

/**
 * Scale a day's quests so the total lands near TARGET_DAY_XP, preserving the
 * ratios between them. Anchors are held at face value first — waking up is
 * worth what it is worth regardless of how much else is on the board — and
 * the remainder is distributed across the real work.
 */
function normaliseDay(quests) {
  if (!quests.length) return quests;
  const anchors = quests.filter((q) => q.anchor);
  const rest = quests.filter((q) => !q.anchor);

  const anchorXp = anchors.reduce((s, q) => s + q.xp, 0);
  const restRaw = rest.reduce((s, q) => s + q.xp, 0);
  const budget = Math.max(40, TARGET_DAY_XP - anchorXp);
  if (restRaw === 0) return quests;

  const factor = budget / restRaw;
  rest.forEach((q) => { q.xp = Math.max(5, Math.round(q.xp * factor / 5) * 5); });
  return quests;
}

export function buildTemplates(answers) {
  const picked = (answers.habits || []).map(habitOf).filter(Boolean);
  const out = {};

  for (let wd = 0; wd <= 6; wd++) {
    const forDay = picked
      .filter((h) => appliesOn(h, wd))
      .map((h) => ({
        key: h.key,
        title: h.title,
        detail: h.detail,
        stat: h.stat,
        xp: h.xp,
        slot: h.slot,
        mins: h.mins || 30,
        anchor: !!h.anchor,
      }))
      .sort((a, b) => a.slot - b.slot || a.key.localeCompare(b.key));

    out[wd] = normaliseDay(forDay);
  }
  return out;
}

/**
 * The values that climb. Only habits that carry a `scale` can ratchet, and
 * only one per stat — applyRatchet stamps a stat per day, so a second rule on
 * the same stat would never get its turn.
 */
export function buildProgression(answers) {
  const picked = (answers.habits || []).map(habitOf).filter(Boolean);
  const progression = {};
  const rules = [];
  const claimed = new Set();

  picked.forEach((h) => {
    if (!h.scale) return;
    progression[h.scale.key] = h.scale.start;
    if (claimed.has(h.stat)) return;
    claimed.add(h.stat);
    rules.push({
      stat: h.stat,
      field: h.scale.key,
      step: h.scale.step,
      cap: h.scale.cap,
      unit: h.scale.unit,
      label: h.scale.label,
    });
  });

  progression.ratchetedOn = {};
  return { progression, ratchetRules: rules };
}

/** Goals that carry a date become gates. Ranks scale with how far out they sit. */
export function buildGates(answers, todayKey) {
  const out = [];
  (answers.domains || []).forEach((key) => {
    const goal = (answers.goals || {})[key];
    if (!goal || !goal.text) return;
    const domain = DOMAINS.find((d) => d.key === key);
    out.push({
      id: `g_${key}`,
      name: goal.text.slice(0, 80),
      rank: goal.date ? rankForHorizon(todayKey, goal.date) : "C",
      date: goal.date || null,
      note: domain ? domain.label : "",
      cleared: false,
    });
  });
  return out.filter((g) => g.date);
}

/* A gate you can see the end of is a smaller gate than one a year out. */
function rankForHorizon(todayKey, dateStr) {
  const days = Math.round((new Date(dateStr) - new Date(todayKey)) / 86400000);
  if (days > 500) return "S";
  if (days > 240) return "A";
  if (days > 120) return "B";
  if (days > 45) return "C";
  return "D";
}

export function buildTraining(answers) {
  const split = SPLITS.find((s) => s.key === answers.trainSplit) || SPLITS[0];
  const out = {};
  for (let wd = 0; wd <= 6; wd++) {
    const group = split.groups ? split.groups[wd] : null;
    if (!group) {
      out[wd] = { name: "Rest", items: ["Walk", "Mobility", "Sleep"] };
      continue;
    }
    const names = GROUP_EXERCISES[group] || [];
    out[wd] = {
      name: group,
      exercises: names.map((name, i) => ({
        key: `${split.key}-${wd}-${i}`,
        name,
        group,
        kind: "load",
        sets: 3,
        repRange: [8, 12],
        step: 2.5,
        start: {},
      })),
    };
  }
  return out;
}

export function buildTargets(answers) {
  const t = answers.targets || {};
  return {
    kcal: Number(t.kcal) || 2200,
    protein: Number(t.protein) || 140,
    proteinTick: Math.round((Number(t.protein) || 140) * 0.85),
    water: Number(t.water) || 3,
    sleepBy: answers.sleep || "22:30",
  };
}

export function buildSchedule(answers) {
  const picked = (answers.habits || []).map(habitOf).filter(Boolean);
  /* Anything an hour or longer is treated as a commitment the day is built
     around, rather than something to slot into a gap. */
  const fixed = picked
    .filter((h) => (h.mins || 0) >= 60)
    .slice(0, 3)
    .map((h, i) => ({
      id: `f-${h.key}`,
      label: h.title,
      start: ["06:30", "09:30", "19:00"][i] || "15:00",
      mins: h.mins,
    }));

  return {
    wake: answers.wake || "06:00",
    sleep: answers.sleep || "22:30",
    fixed,
    questMins: 45,
  };
}

/** Everything at once. */
export function generateSystem(answers, todayKey) {
  const { progression, ratchetRules } = buildProgression(answers);
  return {
    templates: buildTemplates(answers),
    progression,
    ratchetRules,
    training: buildTraining(answers),
    gates: buildGates(answers, todayKey),
    targets: buildTargets(answers),
    schedule: buildSchedule(answers),
  };
}

/** A readable summary for the review step, before anything is committed. */
export function previewSystem(answers) {
  const templates = buildTemplates(answers);
  const weekday = templates[1] || [];
  const byStat = {};
  STATS.forEach((s) => (byStat[s] = 0));
  weekday.forEach((q) => { byStat[q.stat] += q.xp; });
  return {
    perDay: weekday.reduce((s, q) => s + q.xp, 0),
    count: weekday.length,
    byStat,
    weekend: (templates[6] || []).length,
  };
}
