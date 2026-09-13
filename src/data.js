/* ============================================================
   ASCEND — defaults

   Nothing in this file is anyone's routine. A person's board, their
   training split and the numbers that climb are all generated from
   what they answered at setup — see catalog.js and generate.js.

   What lives here is what is the same for everybody: the food table,
   the System's voice, the season and reminder scaffolding, and the
   neutral defaults a profile starts from before it is filled in.
   ============================================================ */

export const MISSION = {
  hunter: "Hunter",
  targets: { kcal: 2200, protein: 140, proteinTick: 119, water: 3, sleepBy: "22:30" },
};

/* Empty until a system is generated. A shared default here would mean
   handing every new person the same board, which is the thing this
   project exists to stop doing. */
export const DEFAULT_PROGRESSION = {};

export const DEFAULT_TEMPLATES = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

export const TRAINING = {};

export const SEEDS_VERSION = 1;
export const SEED_SESSIONS = {};

export const FOODS = [
  { name: "Roti / chapati", base: 1, unit: "piece", kcal: 104, protein: 3.1, carbs: 20, fat: 1.4 },
  { name: "Rice, cooked", base: 100, unit: "g", kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { name: "Dal, cooked", base: 150, unit: "g", kcal: 165, protein: 9, carbs: 24, fat: 3 },
  { name: "Rajma, cooked", base: 150, unit: "g", kcal: 190, protein: 11, carbs: 30, fat: 1.5 },
  { name: "Chana, boiled", base: 100, unit: "g", kcal: 164, protein: 9, carbs: 27, fat: 2.6 },
  { name: "Paneer", base: 100, unit: "g", kcal: 265, protein: 18, carbs: 3.4, fat: 21 },
  { name: "Curd / dahi", base: 100, unit: "g", kcal: 61, protein: 3.5, carbs: 4.7, fat: 3.3 },
  { name: "Greek yoghurt", base: 100, unit: "g", kcal: 59, protein: 10, carbs: 3.6, fat: 0.4 },
  { name: "Milk, toned", base: 250, unit: "ml", kcal: 145, protein: 8, carbs: 12, fat: 6.5 },
  { name: "Whey scoop", base: 1, unit: "scoop", kcal: 120, protein: 24, carbs: 3, fat: 1.5 },
  { name: "Egg, whole boiled", base: 1, unit: "egg", kcal: 78, protein: 6.3, carbs: 0.6, fat: 5.3 },
  { name: "Egg white", base: 1, unit: "white", kcal: 17, protein: 3.6, carbs: 0.2, fat: 0.1 },
  { name: "Soya chunks, dry", base: 50, unit: "g", kcal: 172, protein: 26, carbs: 16, fat: 0.5 },
  { name: "Tofu", base: 100, unit: "g", kcal: 144, protein: 15, carbs: 3, fat: 9 },
  { name: "Peanuts", base: 30, unit: "g", kcal: 170, protein: 7.7, carbs: 4.8, fat: 14 },
  { name: "Peanut butter", base: 30, unit: "g", kcal: 180, protein: 7.5, carbs: 6, fat: 15 },
  { name: "Almonds", base: 20, unit: "g", kcal: 116, protein: 4.2, carbs: 4.4, fat: 10 },
  { name: "Oats, dry", base: 50, unit: "g", kcal: 190, protein: 6.5, carbs: 33, fat: 3.5 },
  { name: "Poha, cooked", base: 200, unit: "g", kcal: 250, protein: 5, carbs: 48, fat: 4 },
  { name: "Upma", base: 200, unit: "g", kcal: 260, protein: 6, carbs: 42, fat: 7 },
  { name: "Idli", base: 2, unit: "piece", kcal: 116, protein: 4, carbs: 24, fat: 0.4 },
  { name: "Dosa, plain", base: 1, unit: "piece", kcal: 168, protein: 4, carbs: 29, fat: 4 },
  { name: "Sambar", base: 150, unit: "g", kcal: 105, protein: 5, carbs: 15, fat: 3 },
  { name: "Mixed sabji", base: 150, unit: "g", kcal: 120, protein: 3.5, carbs: 12, fat: 6.5 },
  { name: "Palak paneer", base: 150, unit: "g", kcal: 230, protein: 12, carbs: 9, fat: 17 },
  { name: "Chole", base: 150, unit: "g", kcal: 210, protein: 9, carbs: 28, fat: 7 },
  { name: "Khichdi", base: 250, unit: "g", kcal: 290, protein: 10, carbs: 48, fat: 6 },
  { name: "Sprouts salad", base: 100, unit: "g", kcal: 95, protein: 8, carbs: 15, fat: 0.6 },
  { name: "Banana", base: 1, unit: "medium", kcal: 105, protein: 1.3, carbs: 27, fat: 0.4 },
  { name: "Apple", base: 1, unit: "medium", kcal: 95, protein: 0.5, carbs: 25, fat: 0.3 },
  { name: "Orange", base: 1, unit: "medium", kcal: 62, protein: 1.2, carbs: 15, fat: 0.2 },
  { name: "Papaya", base: 150, unit: "g", kcal: 65, protein: 0.7, carbs: 16, fat: 0.4 },
  { name: "Cucumber", base: 100, unit: "g", kcal: 16, protein: 0.7, carbs: 3.6, fat: 0.1 },
  { name: "Salad, mixed raw", base: 150, unit: "g", kcal: 45, protein: 2, carbs: 8, fat: 0.5 },
  { name: "Ghee", base: 1, unit: "tsp", kcal: 45, protein: 0, carbs: 0, fat: 5 },
  { name: "Cooking oil", base: 1, unit: "tsp", kcal: 40, protein: 0, carbs: 0, fat: 4.5 },
  { name: "Brown bread", base: 2, unit: "slice", kcal: 160, protein: 6, carbs: 28, fat: 2.4 },
  { name: "Paratha, plain", base: 1, unit: "piece", kcal: 210, protein: 5, carbs: 30, fat: 8 },
  { name: "Besan chilla", base: 2, unit: "piece", kcal: 210, protein: 11, carbs: 24, fat: 8 },
  { name: "Moong dal chilla", base: 2, unit: "piece", kcal: 190, protein: 12, carbs: 22, fat: 6 },
  { name: "Buttermilk", base: 250, unit: "ml", kcal: 60, protein: 3, carbs: 6, fat: 2.5 },
  { name: "Lassi, sweet", base: 250, unit: "ml", kcal: 220, protein: 7, carbs: 32, fat: 6.5 },
  { name: "Tea with milk", base: 1, unit: "cup", kcal: 65, protein: 2, carbs: 8, fat: 2.5 },
  { name: "Coffee with milk", base: 1, unit: "cup", kcal: 70, protein: 2.5, carbs: 8, fat: 3 },
  { name: "Dry fruits mix", base: 30, unit: "g", kcal: 150, protein: 4, carbs: 15, fat: 9 },
  { name: "Makhana, roasted", base: 30, unit: "g", kcal: 105, protein: 3, carbs: 23, fat: 0.3 },
  { name: "Dark chocolate", base: 20, unit: "g", kcal: 120, protein: 1.5, carbs: 10, fat: 8 },
];

/* ---------- gates seeded from known dates ---------- */

/* Gates are generated from the goals someone gave at setup, and added to
   by hand afterwards. Nobody starts with someone else's deadlines. */
export const SEED_GATES = [];

export const SEED_SHADOWS = [];

export const SHADOW_PRESETS = [
  { name: "C++ limit order book engine", stat: "AGI", bonus: 6 },
  { name: "Delta-hedging simulator", stat: "INT", bonus: 6 },
  { name: "Implied vol solver", stat: "INT", bonus: 5 },
  { name: "Binomial pricer", stat: "INT", bonus: 4 },
  { name: "Alpha research pipeline", stat: "AGI", bonus: 5 },
  { name: "Portfolio optimiser", stat: "INT", bonus: 4 },
];

/* ---------- the System's voice ----------
   Written for this app rather than quoted from the manhwa. Lines from a
   copyrighted work cannot ship in something that gets deployed, and the
   register is the part that actually carries — flat, declarative, addressed to
   one person who already knows what they owe. Quoting someone else's dialogue
   would fit worse than this does.

   Grouped by when they earn their place. A line that appears at the wrong
   moment reads as decoration; the same line after a broken day reads as the
   System noticing.                                                            */

export const QUOTES = {
  daily: [
    "The gap between who you are and who you intend to be is measured in days like this one.",
    "Nobody is coming to raise the floor. Raise it.",
    "Strength is not granted. It is accumulated, quietly, by someone with nothing to prove that morning.",
    "The work does not care whether you feel ready.",
    "You are not behind. You are exactly as far along as the days you have actually done.",
    "Every level you have was bought at the price of a day you did not want to start.",
    "Discipline is what remains after motivation has finished making promises.",
    "The System does not reward intent.",
    "Repetition is the only magic that has ever worked.",
    "You do not rise to the occasion. You fall to the standard you kept when no one was watching.",
    "A hunter who trains only when it is convenient stays exactly the rank they started at.",
    "The hardest gate is the one that opens at five in the morning.",
  ],
  cleared: [
    "Day cleared. The floor is now higher than it was.",
    "Logged. This is what accumulation looks like from the inside — unremarkable.",
    "Nothing dramatic happened. That is the point.",
    "One more day the System could not fault.",
  ],
  broken: [
    "The day closed short. It has been charged. Nothing is owed beyond starting again.",
    "A lapse is data, not a verdict. What does tomorrow look like.",
    "You did not fail the system. You skipped an entry. Make the next one.",
    "The streak is gone. The levels are not.",
  ],
  levelUp: [
    "Level up. The bar moves with you — this is not a place to rest.",
    "Stronger than the version of you that started this week.",
    "Growth registered. It will not feel like anything. It never does.",
  ],
  rankUp: [
    "Rank promoted. Everything below this is now your baseline, not your ceiling.",
    "You have outgrown the person who set these targets. Set harder ones.",
  ],
  shadow: [
    "Arise.",
    "Shipped work never leaves you. It compounds.",
    "Extracted. It pays for itself from here on.",
  ],
  focus: [
    "The hours did not vanish. They were spent, and something received them.",
    "Attention is the only currency you cannot earn back.",
    "The feed is a gate you enter voluntarily and leave weaker.",
  ],
};

/** Deterministic pick, so the line of the day does not change on every render. */
export function quoteFor(bucket, seed = "") {
  const list = QUOTES[bucket] || QUOTES.daily;
  let h = 0;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return list[h % list.length];
}

/* ---------- seasons ----------
   Ninety days, because it is long enough that a bad week does not decide it and
   short enough to stay in view. The goals are deliberately few. A season with
   nine targets is a wish list; one with four is a commitment.                  */

export const SEASON_LENGTH = 90;

export const SEASON_GOAL_TYPES = [
  { type: "cleanDays", label: "Clean days", unit: "days", hint: "Days graded clean — everything chargeable, done." },
  { type: "clearedDays", label: "Days cleared", unit: "days", hint: "Days that met the clear bar for your difficulty." },
  { type: "training", label: "Training sessions", unit: "sessions", hint: "Days with anything logged in the dungeon." },
  { type: "shadows", label: "Shadows extracted", unit: "shipped", hint: "Projects finished and extracted during the season." },
  { type: "gates", label: "Gates cleared", unit: "gates", hint: "Deadlines met inside the window." },
  { type: "level", label: "Reach level", unit: "level", hint: "Absolute level by the end of the season." },
  { type: "statXp", label: "Stat experience", unit: "xp", hint: "Total experience in one stat." },
  { type: "streak", label: "Best streak", unit: "days", hint: "Longest unbroken run reached during the season." },
];

export function defaultSeason(startKey, endKey) {
  return {
    id: `s-${startKey}`,
    name: "Season I — Foundation",
    startKey,
    endKey,
    goals: [
      { key: "g1", type: "clearedDays", label: "Clear 70 of 90 days", target: 70 },
      { key: "g2", type: "training", label: "Train 75 sessions", target: 75 },
      { key: "g3", type: "shadows", label: "Ship 3 projects", target: 3 },
      { key: "g4", type: "streak", label: "Hold a 21 day streak", target: 21 },
    ],
  };
}

/* ---------- reminders ----------
   Exported to the phone's calendar as repeating events with alarms, because
   that is the only thing that rings when the app is closed. Times are the
   defaults; they are editable in the app.                                     */

export const DEFAULT_REMINDERS = [
  { id: "wake", title: "Rise", body: "The day is generated. Open the board.", time: "05:00", mins: 15, on: true },
  { id: "train", title: "Dungeon", body: "Training block. Log every set.", time: "06:00", mins: 75, on: true },
  { id: "study", title: "Deep work", body: "The block that actually moves the rating.", time: "09:30", mins: 120, on: true },
  { id: "checkin", title: "Midday check", body: "Where does the board stand.", time: "13:00", mins: 10, on: false },
  { id: "close", title: "Close the day", body: "Anything still open closes in three hours.", time: "19:00", mins: 15, on: true },
  { id: "sleep", title: "Lights out", body: "Seven hours is part of the work.", time: "22:00", mins: 10, on: true },
];

/* ---------- focus ----------
   The app cannot block anything. It can hold you to a number you set yourself
   and show you the cost, which is a different mechanism and an honest one.     */

export const FOCUS_TARGETS = [
  { id: "instagram", label: "Instagram", cap: 20 },
  { id: "chess", label: "Chess", cap: 30 },
  { id: "youtube", label: "YouTube", cap: 30 },
  { id: "other", label: "Other scrolling", cap: 15 },
];
