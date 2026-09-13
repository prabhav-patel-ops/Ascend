import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { emptyState, hydrate } from "../src/store.js";
import { generateDay, shiftKey, recomputeTotals, computeStreak, dateKey } from "../src/engine.js";
import { generateSystem } from "../src/generate.js";
import { SignIn, Onboard } from "../src/screens/Welcome.jsx";

const ANSWERS = {
  name: "Test",
  domains: ["study", "fitness"],
  goals: { study: { text: "Pass the exam", date: "2026-12-01" } },
  habits: ["wake", "sleep", "review", "study-main", "study-problems", "study-second", "train", "cardio"],
  wake: "06:00", sleep: "22:30", trainSplit: "full",
  targets: { kcal: 2200, protein: 140, water: 3 }, difficulty: "normal",
};
import Status from "../src/screens/Status.jsx";
import Quests from "../src/screens/Quests.jsx";
import Gates from "../src/screens/Gates.jsx";
import Dungeon from "../src/screens/Dungeon.jsx";
import App from "../src/App.jsx";
import Calendar from "../src/screens/Calendar.jsx";
import Focus from "../src/screens/Focus.jsx";
import Shadows from "../src/screens/Shadows.jsx";
import SystemChat from "../src/screens/System.jsx";
import Creed from "../src/screens/Creed.jsx";
import { themeFromState, creedLine, creedDeck, CREED, CREED_THEMES } from "../src/creed.js";

const todayKey = "2026-08-31";
let pass = 0;
const t = (name, fn) => {
  try { fn(); pass++; }
  catch (e) { console.error(`FAIL  ${name}\n      ${e.message}`); process.exitCode = 1; }
};

/* Build a state with a month of plausible history. */
function seeded() {
  const system = generateSystem(ANSWERS, todayKey);
  const s = {
    ...emptyState(),
    onboarded: true,
    answers: ANSWERS,
    templates: system.templates,
    progression: system.progression,
    ratchetRules: system.ratchetRules,
    splits: system.training,
    gates: system.gates,
  };
  s.settings = { ...s.settings, targets: system.targets, schedule: system.schedule };
  s.hunter = { ...s.hunter, name: "Test", createdAt: "2026-08-01" };

  let prev = null;
  for (let i = 30; i >= 0; i--) {
    const k = shiftKey(todayKey, -i);
    const d = generateDay(k, s.templates, s.progression, prev);
    // clear most things, drop the odd one
    d.quests.forEach((q, j) => (q.done = (i + j) % 7 !== 0));
    s.days[k] = d;
    prev = d;
  }

  const totals = recomputeTotals(s.days, s.shadows, todayKey);
  s.totalXp = totals.totalXp;
  s.statXp = totals.statXp;
  s.streak = computeStreak(s.days, todayKey);

  s.shadows = [{ id: "s1", name: "First shipped project", stat: "INT", bonus: 6, date: "2026-08-14" }];
  s.cfHistory = [
    { date: "2026-08-02", rating: 1327 },
    { date: "2026-08-16", rating: 1361 },
    { date: "2026-08-30", rating: 1408 },
  ];
  s.body.weights = Array.from({ length: 12 }, (_, i) => ({
    date: shiftKey("2026-08-01", i * 2),
    kg: +(83.8 - i * 0.22).toFixed(1),
  }));
  s.body.waist = [
    { date: "2026-08-03", cm: 96 },
    { date: "2026-08-10", cm: 95 },
    { date: "2026-08-17", cm: 94.5 },
  ];
  s.body.meals[todayKey] = [
    { name: "Whey scoop", qty: "1 scoop", kcal: 120, protein: 24, carbs: 3, fat: 1.5 },
    { name: "Dal, cooked", qty: "150 g", kcal: 165, protein: 9, carbs: 24, fat: 3 },
  ];
  s.body.water[todayKey] = 2.25;
  s.body.sleep[todayKey] = { from: "22:00", to: "05:00", hours: 7 };
  s.body.training[todayKey] = { done: [0, 1, 3] };
  s.lastRatchet = { date: todayKey, items: [{ stat: "AGI", field: "cfBand", from: 1500, to: 1550, unit: "rating" }] };
  return s;
}

const noop = () => {};
const props = (state) => ({
  state, todayKey,
  onToggle: noop, onExcuse: noop, onAddGate: noop, onClearGate: noop, onDeleteGate: noop,
  onLogRating: noop, onToggleExercise: noop, onLogSets: noop, onLogCardio: noop,
  onRenameExercise: noop, onAddMeal: noop, onRemoveMeal: noop, onSetWater: noop,
  onLogWeight: noop, onLogWaist: noop, onLogSleep: noop, onExtract: noop, onDismiss: noop,
  onSettings: noop, onImport: noop, onReset: noop, onProgression: noop,
  onStartSeason: noop, onSchedule: noop, onReminder: noop, onLogFocus: noop,
  alerts: [], setTab: noop, onAddExtra: noop, onRemoveExtra: noop,
  onCreedWatch: noop, onCreedPin: noop, flash: noop, onSignOut: noop,
});

const screens = { Status, Quests, Gates, Dungeon, Calendar, Focus, Shadows, SystemChat, Creed };

t("every screen renders against a month of history", () => {
  const s = seeded();
  Object.entries(screens).forEach(([name, C]) => {
    const html = renderToStaticMarkup(React.createElement(C, props(s)));
    assert.ok(html.length > 200, `${name} rendered almost nothing`);
  });
});

t("every screen renders on a completely fresh install", () => {
  const s = emptyState();
  s.days[todayKey] = generateDay(todayKey, s.templates, s.progression, null);
  Object.entries(screens).forEach(([name, C]) => {
    const html = renderToStaticMarkup(React.createElement(C, props(s)));
    assert.ok(html.length > 120, `${name} broke when empty`);
  });
});

t("Quests survives a day with no log at all", () => {
  const s = emptyState();
  const html = renderToStaticMarkup(React.createElement(Quests, props(s)));
  assert.match(html, /No log for this day|quest board/i);
});

t("Status shows level and rank", () => {
  const html = renderToStaticMarkup(React.createElement(Status, props(seeded())));
  assert.match(html, /Level/);
  assert.match(html, /Rank [EDCBAS]/);
});

t("Status reports the shadow bonus on the right stat", () => {
  const html = renderToStaticMarkup(React.createElement(Status, props(seeded())));
  assert.match(html, /\+6% from shadows/);
});

t("Quests renders penalty quests distinctly when they exist", () => {
  const s = seeded();
  const y = shiftKey(todayKey, -1);
  s.days[y].quests.forEach((q) => (q.done = false));
  s.days[y].quests.push({
    id: "extra", key: "study-deep", title: "Long deep block", detail: "",
    stat: "INT", xp: 40, slot: 5, done: false, penalty: false,
  });
  s.days[todayKey] = generateDay(todayKey, s.templates, s.progression, s.days[y]);
  const html = renderToStaticMarkup(React.createElement(Quests, props(s)));
  assert.match(html, /Penalty/);
});

t("Dungeon renders the split the profile generated", () => {
  const html = renderToStaticMarkup(React.createElement(Dungeon, props(seeded())));
  assert.match(html, /Full body/, "the chosen split shows on a training day");
});

t("Fuel totals reflect logged meals", () => {
  const s = seeded();
  const html = renderToStaticMarkup(React.createElement(Dungeon, props(s)));
  assert.ok(html.includes("Strength dungeon"), "defaults to the Train tab");
});

t("Gates lists the gates generated from the goals", () => {
  const html = renderToStaticMarkup(React.createElement(Gates, props(seeded())));
  assert.match(html, /Pass the exam/, "a dated goal became a gate");
});

t("Shadows lists an extracted project and its bonus", () => {
  const html = renderToStaticMarkup(React.createElement(Shadows, props(seeded())));
  assert.match(html, /limit order book/);
  assert.match(html, /\+6% INT/);
});

/* `onSignOut` was threaded from App through `shared` into every screen and
   then rendered by none of them, so there was no way out of a profile once
   you were in one. A prop being passed proves nothing; this asserts the
   control is actually on screen. */
t("a signed-in board offers a way back out of itself", () => {
  const html = renderToStaticMarkup(React.createElement(Shadows, props(seeded())));
  assert.match(html, /Sign out/, "no control to leave the profile");
  assert.match(html, /deletes nothing/i, "it must not read like the erase button it sits above");
});

t("no screen leaks the string undefined or NaN into the markup", () => {
  const s = seeded();
  Object.entries(screens).forEach(([name, C]) => {
    const html = renderToStaticMarkup(React.createElement(C, props(s)));
    assert.ok(!/>\s*NaN\s*</.test(html), `${name} rendered NaN`);
    assert.ok(!/>\s*undefined\s*</.test(html), `${name} rendered undefined`);
  });
});

/* ---------- hydration of old or partial saves ---------- */

t("hydrate fills holes left by a partial save", () => {
  const partial = { statXp: { INT: 400 }, totalXp: 400, days: {} };
  const s = hydrate(partial);
  assert.equal(s.statXp.INT, 400);
  assert.equal(s.statXp.STR, 0, "missing stats default to zero");
  assert.ok(s.streak && typeof s.streak.current === "number");
  assert.ok(s.settings.targets.protein > 0);
  assert.ok(Array.isArray(s.gates));
  assert.ok(s.body.meals && s.body.sleep && s.body.training);
});

t("hydrate keeps user settings but restores missing ones", () => {
  const s = hydrate({ statXp: {}, settings: { targets: { protein: 180 } } });
  assert.equal(s.settings.targets.protein, 180, "user value survives");
  assert.ok(s.settings.targets.water > 0, "missing target restored");
  assert.equal(s.settings.ratchetStreak, 8, "missing setting restored");
});

t("hydrate survives rubbish", () => {
  assert.ok(hydrate(null).settings);
  assert.ok(hydrate("nonsense").settings);
  assert.ok(hydrate(42).settings);
});

t("a partial save renders every screen without throwing", () => {
  const s = hydrate({ statXp: { INT: 400 }, totalXp: 400, days: {} });
  Object.entries(screens).forEach(([name, C]) => {
    assert.doesNotThrow(() => renderToStaticMarkup(React.createElement(C, props(s))), `${name} broke`);
  });
});


t("System renders its empty state with prompt chips", () => {
  const html = renderToStaticMarkup(React.createElement(SystemChat, props(seeded())));
  assert.match(html, /Ask it something/);
  assert.match(html, /Pass the exam/, "the chips come from their own goals");
});

t("System survives a state with no days generated", () => {
  const bare = emptyState();
  const html = renderToStaticMarkup(React.createElement(SystemChat, props(bare)));
  assert.match(html, /Ask the System/);
});


t("the log renders a full month grid", () => {
  const html = renderToStaticMarkup(React.createElement(Calendar, props(seeded())));
  const cells = (html.match(/mn-cal-cell/g) || []).length;
  assert.equal(cells, 42, "six weeks, always");
  assert.match(html, /August 2026/);
});

t("Focus renders without a browser and never claims it can block", () => {
  const html = renderToStaticMarkup(React.createElement(Focus, props(seeded())));
  assert.match(html, /Focus block/);
  assert.ok(!/Block Instagram/i.test(html), "no button that would do nothing");
});

t("a season that was never opened offers to open one", () => {
  const s = seeded();
  s.seasons = [];
  const html = renderToStaticMarkup(React.createElement(Calendar, props(s)));
  assert.ok(html.includes("mn-cal-grid"), "defaults to the month view");
});

/* ---------- creed ---------- */

t("the creed picks its opening theme from the board, not at random", () => {
  const fallen = { streak: { current: 0, best: 9 }, days: {}, body: { focus: {} } };
  assert.equal(themeFromState(fallen, todayKey), "setback", "a lost streak asks for a different sentence");

  const long = { streak: { current: 21, best: 21 }, days: {}, body: { focus: {} } };
  assert.equal(themeFromState(long, todayKey), "identity");

  const burning = { streak: { current: 2, best: 2 }, days: {}, body: { focus: { [todayKey]: { instagram: 140 } } } };
  assert.equal(themeFromState(burning, todayKey), "focus");

  assert.equal(themeFromState(null, todayKey), null, "no state, no opinion");
});

t("the line of the day is stable, and a theme filter never returns an empty deck", () => {
  assert.equal(creedLine("2026-08-31").text, creedLine("2026-08-31").text, "same day, same line");
  assert.notEqual(
    creedLine("2026-08-31").text,
    creedLine("2026-09-01").text,
    "a new day brings a new line"
  );

  CREED_THEMES.forEach((th) => {
    const deck = creedDeck(todayKey, th.id);
    assert.ok(deck.length > 1, `${th.id} has nothing in it`);
    assert.ok(deck.every((c) => c.theme === th.id), `${th.id} leaked another theme`);
    assert.equal(new Set(deck.map((c) => c.text)).size, deck.length, `${th.id} repeats a line`);
  });

  assert.ok(creedDeck(todayKey, "not-a-theme").length === CREED.length, "an unknown theme falls back to everything");
});

t("the creed screen renders its shelf and does not hide the backup caveat", () => {
  const html = renderToStaticMarkup(React.createElement(Creed, props(seeded())));
  assert.match(html, /Speeches/);
  assert.match(html, /not in the JSON backup/i, "it must say what an export does not contain");
});

t("the creed survives a save written before it existed", () => {
  const old = hydrate({ statXp: { INT: 400 }, totalXp: 400, days: {} });
  assert.ok(old.creed && old.creed.watched && Array.isArray(old.creed.pinned));
  assert.doesNotThrow(() => renderToStaticMarkup(React.createElement(Creed, props(old))));

  const mangled = hydrate({ statXp: {}, creed: { pinned: "not an array", watched: 7 } });
  assert.deepEqual(mangled.creed.pinned, []);
  assert.deepEqual(mangled.creed.watched, {});
});

t("the effects setting is restored and validated like every other one", () => {
  assert.equal(hydrate({ statXp: {} }).settings.fx, "full", "missing means full");
  assert.equal(hydrate({ statXp: {}, settings: { fx: "lite" } }).settings.fx, "lite", "a real choice survives");
  assert.equal(hydrate({ statXp: {}, settings: { fx: "sparkles" } }).settings.fx, "full", "rubbish is floored");
  assert.equal(hydrate({ statXp: {}, settings: { hapticsOn: false } }).settings.hapticsOn, false);
});

/* The whole tree, not one screen. Nothing else in the suite would notice a
   missing import or a bad prop inside App.jsx itself — which is exactly the
   kind of break that only shows up on the day it fires. */
t("the app shell opens on sign-in when the device has no profile", () => {
  const html = renderToStaticMarkup(React.createElement(App));
  assert.match(html, /ASCEND/);
  assert.ok(!html.includes("<nav"), "no board is shown before anyone has signed in");
});

t("sign-in offers to create the first profile and promises nothing it cannot keep", () => {
  const html = renderToStaticMarkup(React.createElement(SignIn, { onSignedIn: noop }));
  assert.match(html, /ASCEND/);
  assert.match(html, /not an account/i, "it must not imply a security it does not have");
  assert.ok(!/password/i.test(html.replace(/no password/i, "")), "no password field is offered");
});

t("onboarding opens on the focus step with nothing preselected", () => {
  const html = renderToStaticMarkup(
    React.createElement(Onboard, { profile: { id: "p1", name: "Test" }, todayKey, onComplete: noop })
  );
  assert.match(html, /What are you building/);
  assert.match(html, /Study or exams/);
  assert.match(html, /Training and strength/);
});

console.log(`\n${pass} passing`);
