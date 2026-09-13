/* Simulate real use through the same pipeline App.jsx runs, and report pacing.

   This has to build a system first. `DEFAULT_TEMPLATES` in data.js is
   deliberately empty — ASCEND generates a board per person rather than
   shipping one — so simulating against it generates zero quests a day and
   reports that a year of perfect compliance leaves you at level 1. The
   profile below is a plausible one, not anybody's: the point is to exercise
   generate.js and engine.js together on a board that actually has work in
   it, the way a real install does.                                          */
import {
  generateDay, shiftKey, recomputeTotals, computeStreak, applyRatchet,
  levelFromTotalXp, rankFromLevel, statTier, STATS,
} from "../src/engine.js";
import { generateSystem } from "../src/generate.js";

const START = "2026-09-01";

const ANSWERS = {
  name: "Sim",
  domains: ["study", "fitness"],
  goals: { study: { text: "Pass the exam", date: "2027-06-01" } },
  habits: ["wake", "sleep", "review", "study-main", "study-problems", "study-second", "train", "cardio"],
  wake: "06:00",
  sleep: "22:30",
  trainSplit: "full",
  targets: { kcal: 2200, protein: 140, water: 3 },
  difficulty: "normal",
};

function run(label, days, complianceFor) {
  const system = generateSystem(ANSWERS, START);
  const state = {
    days: {},
    progression: { ...system.progression },
    shadows: [],
    settings: { ratchetStreak: 5, targets: system.targets, schedule: system.schedule },
  };
  const marks = [];

  /* Whatever this profile's board actually climbs. MONARCH had `cfBand` and
     `hullPages` compiled in; here the fields come out of the generator, so
     the sim reports the first rule rather than naming one that may not
     exist for these answers. */
  const rule = (system.ratchetRules || [])[0] || null;

  for (let i = 0; i < days; i++) {
    const k = shiftKey(START, i);
    const prev = state.days[shiftKey(k, -1)] || null;
    const day = generateDay(k, system.templates, state.progression, prev);
    const p = complianceFor(i);
    day.quests.forEach((q) => (q.done = Math.random() < p));
    state.days[k] = day;

    const { prog } = applyRatchet(state.days, k, state.progression, state.settings, system.ratchetRules);
    state.progression = prog;

    if ([6, 29, 89, 179, 364].includes(i)) {
      const totals = recomputeTotals(state.days, state.shadows, shiftKey(k, 1));
      const { level } = levelFromTotalXp(totals.totalXp);
      marks.push({
        day: i + 1,
        level,
        rank: rankFromLevel(level),
        climb: rule ? state.progression[rule.field] : null,
        streak: computeStreak(state.days, k).current,
        tiers: Object.fromEntries(STATS.map((s) => [s, statTier(totals.statXp[s])])),
      });
    }
  }

  const climbLabel = rule ? `${rule.label || rule.field}`.slice(0, 6) : "climb";

  console.log(`\n${label}`);
  console.log(`  day    level  rank  ${climbLabel.padStart(6)}  streak  STR/AGI/INT/PER/VIT`);
  marks.forEach((m) => {
    const t = STATS.map((s) => String(m.tiers[s]).padStart(2)).join("/");
    console.log(
      `  ${String(m.day).padStart(3)}    ${String(m.level).padStart(4)}   ${m.rank}    ` +
      `${String(m.climb ?? "—").padStart(6)}    ${String(m.streak).padStart(4)}   ${t}`
    );
  });
  return { marks, rule };
}

const quests = generateSystem(ANSWERS, START).templates[new Date(START).getDay()]?.length ?? 0;
console.log(`Board generated from the sample answers: ${quests} quests on the first day.`);

const diligent = run("Diligent — clears about 92% of quests", 365, () => 0.92);
const realistic = run("Realistic — 80%, dipping to 55% in a bad fortnight", 365, (i) =>
  i > 120 && i < 135 ? 0.55 : 0.8
);
run("Struggling — about 55% throughout", 365, () => 0.55);

/* pacing assertions */
let bad = 0;
const check = (cond, msg) => { if (!cond) { console.error(`  PACING  ${msg}`); bad = 1; } };

const at = (r, day) => r.marks.find((m) => m.day === day);
const d30 = at(diligent, 30);
const d90 = at(diligent, 90);
const d365 = at(diligent, 365);

console.log("");
check(d30.level >= 6 && d30.level <= 20, `month one landed at level ${d30.level}, want 6–20`);
check(["C", "D"].includes(d90.rank), `three months landed at rank ${d90.rank}, want D or C`);
check(["A", "B"].includes(d365.rank), `one year landed at rank ${d365.rank}, want B or A`);

/* The board is supposed to get harder on its own as it is cleared. The
   specific numbers belong to whatever this profile generated, so the check
   is on the shape: it climbed, and it stopped at its cap. */
if (diligent.rule) {
  check(d365.climb > at(diligent, 7).climb, `${diligent.rule.field} never climbed over a diligent year`);
  check(d365.climb <= diligent.rule.cap, `${diligent.rule.field} passed its cap of ${diligent.rule.cap}`);
}

check(at(realistic, 365).level < d365.level, "realistic play should trail diligent play");

console.log(bad ? "\npacing needs adjusting" : "\npacing looks sane");
process.exitCode = bad;
