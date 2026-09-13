/* ============================================================
   ASCEND — the catalog

   Everything a generated system can be built out of. Nothing here is
   anyone's routine; it is the menu the onboarding wizard offers, and
   what someone picks becomes their board.

   Shape of a habit:

     key      stable id — the log is keyed on it, so it must never
              change once a board has been generated from it
     title    what appears on the board
     detail   the line under it. {token} interpolates from progression,
              so a habit can get harder without being rewritten
     stat     which of the five it trains
     xp       face value. Anchors 10-25, main blocks 45-60,
              secondary 25-35 — a day should land near 270
     slot     ordering through the day, 1 = first
     mins     rough duration, used by the schedule builder
     cadence  "daily" | "weekday" | "weekend" | "rest"
     scale    optional. Makes the habit ratchet: the named progression
              value climbs after a clean run, so the bar rises with you
   ============================================================ */

export const STAT_HINT = {
  STR: "Strength, training, physical output",
  AGI: "Speed, execution, thinking under pressure",
  INT: "Depth, study, knowledge",
  PER: "Perception, craft, judgement",
  VIT: "Health, recovery, consistency",
};

/* ---------- anchors ----------
   Offered to everyone regardless of domain, because a day needs edges. */

export const ANCHORS = [
  {
    key: "wake", title: "Wake on time", detail: "The day starts here.",
    stat: "VIT", xp: 10, slot: 1, mins: 0, cadence: "daily", anchor: true,
  },
  {
    key: "sleep", title: "Lights out on time", detail: "Seven hours is the floor, not the target.",
    stat: "VIT", xp: 15, slot: 9, mins: 0, cadence: "daily", anchor: true,
  },
  {
    key: "review", title: "Close the day", detail: "Two minutes. What moved, what did not.",
    stat: "PER", xp: 15, slot: 8, mins: 5, cadence: "daily",
  },
];

/* ---------- domains ---------- */

export const DOMAINS = [
  {
    key: "study",
    label: "Study or exams",
    blurb: "A syllabus, a qualification, a subject you are going deep on.",
    stat: "INT",
    goalPlaceholder: "Finish the syllabus and pass in June",
    habits: [
      {
        key: "study-main", title: "Main study block", detail: "{studyPages} pages, worked problems count double.",
        stat: "INT", xp: 60, slot: 5, mins: 60, cadence: "daily",
        scale: { key: "studyPages", start: 12, step: 1, cap: 40, unit: "pages", label: "Pages per block" },
      },
      {
        key: "study-second", title: "Second study block", detail: "The derivation you owe from this morning.",
        stat: "INT", xp: 45, slot: 7, mins: 60, cadence: "weekday",
      },
      {
        key: "study-problems", title: "Problem set", detail: "{studyProblems} problems, timed, no notes.",
        stat: "PER", xp: 40, slot: 6, mins: 45, cadence: "daily",
        scale: { key: "studyProblems", start: 3, step: 1, cap: 12, unit: "problems", label: "Problems per set" },
      },
      {
        key: "study-revise", title: "Revision pass", detail: "Yesterday's material, from memory first.",
        stat: "INT", xp: 30, slot: 4, mins: 25, cadence: "daily",
      },
      {
        key: "study-deep", title: "Long deep block", detail: "Two hours uninterrupted. Blank paper, book closed.",
        stat: "INT", xp: 70, slot: 5, mins: 120, cadence: "weekend",
      },
    ],
  },
  {
    key: "code",
    label: "Coding or craft",
    blurb: "Problem solving, a language, a technical skill you are sharpening.",
    stat: "AGI",
    goalPlaceholder: "Reach a rating of 1900",
    habits: [
      {
        key: "code-problem", title: "Daily problem", detail: "Timebox {codeMins} minutes, then read the editorial and reimplement.",
        stat: "AGI", xp: 45, slot: 4, mins: 45, cadence: "daily",
        scale: { key: "codeMins", start: 45, step: 5, cap: 90, unit: "minutes", label: "Timebox" },
      },
      {
        key: "code-build", title: "Build block", detail: "Work on the project. Something that runs by the end.",
        stat: "AGI", xp: 55, slot: 6, mins: 90, cadence: "daily",
      },
      {
        key: "code-read", title: "Read someone else's code", detail: "Thirty minutes in a codebase you did not write.",
        stat: "PER", xp: 25, slot: 7, mins: 30, cadence: "weekday",
      },
      {
        key: "code-contest", title: "Timed round", detail: "Full contest clock. The clock is its own skill.",
        stat: "AGI", xp: 80, slot: 4, mins: 120, cadence: "weekend",
      },
      {
        key: "code-upsolve", title: "Upsolve", detail: "The ones you could not finish, while they are still in your head.",
        stat: "AGI", xp: 50, slot: 5, mins: 60, cadence: "weekend",
      },
    ],
  },
  {
    key: "fitness",
    label: "Training and strength",
    blurb: "The gym, the road, the mat. Anything with sets and progression.",
    stat: "STR",
    goalPlaceholder: "Bench my bodyweight for reps",
    habits: [
      {
        key: "train", title: "Training session", detail: "Log every set. The numbers are the point.",
        stat: "STR", xp: 50, slot: 2, mins: 75, cadence: "daily",
      },
      {
        key: "cardio", title: "Conditioning", detail: "{cardioMins} minutes, unbroken.",
        stat: "VIT", xp: 30, slot: 3, mins: 25, cadence: "daily",
        scale: { key: "cardioMins", start: 15, step: 1, cap: 45, unit: "minutes", label: "Conditioning length" },
      },
      {
        key: "mobility", title: "Mobility", detail: "Ten minutes. The thing you skip until it stops you.",
        stat: "VIT", xp: 20, slot: 8, mins: 10, cadence: "daily",
      },
      {
        key: "steps", title: "Move outside", detail: "A walk that is not to somewhere.",
        stat: "VIT", xp: 20, slot: 7, mins: 30, cadence: "daily",
      },
    ],
  },
  {
    key: "health",
    label: "Body and health",
    blurb: "Weight, food, sleep, water. The inputs everything else runs on.",
    stat: "VIT",
    goalPlaceholder: "Get to 72 kg without losing strength",
    habits: [
      {
        key: "protein", title: "Hit the protein floor", detail: "{proteinFloor} g minimum.",
        stat: "VIT", xp: 25, slot: 3, mins: 0, cadence: "daily",
        scale: { key: "proteinFloor", start: 120, step: 5, cap: 200, unit: "g", label: "Protein floor" },
      },
      { key: "water", title: "Water target", detail: "Through the day, not all at nine at night.", stat: "VIT", xp: 15, slot: 4, mins: 0, cadence: "daily" },
      { key: "weigh", title: "Weigh in", detail: "Morning, empty, same conditions.", stat: "PER", xp: 10, slot: 1, mins: 0, cadence: "daily" },
      { key: "nocturnal", title: "No food after the cutoff", detail: "The kitchen closes when you said it would.", stat: "VIT", xp: 20, slot: 8, mins: 0, cadence: "daily" },
    ],
  },
  {
    key: "career",
    label: "Career or applications",
    blurb: "Job hunt, admissions, portfolio, the people who need to know you exist.",
    stat: "PER",
    goalPlaceholder: "Land a role by March",
    habits: [
      {
        key: "apply", title: "Applications", detail: "Send {applyCount}, tailored, not sprayed.",
        stat: "PER", xp: 45, slot: 5, mins: 45, cadence: "weekday",
        scale: { key: "applyCount", start: 2, step: 1, cap: 8, unit: "sent", label: "Applications per day" },
      },
      { key: "outreach", title: "Reach out to one person", detail: "A real message to a real human.", stat: "PER", xp: 30, slot: 6, mins: 15, cadence: "weekday" },
      { key: "portfolio", title: "Portfolio work", detail: "The thing they will actually look at.", stat: "AGI", xp: 40, slot: 6, mins: 60, cadence: "daily" },
      { key: "interview-prep", title: "Interview prep", detail: "Out loud, timed, as if it counted.", stat: "PER", xp: 35, slot: 7, mins: 30, cadence: "weekday" },
    ],
  },
  {
    key: "build",
    label: "Building something",
    blurb: "A business, a product, a side project with users on the other end.",
    stat: "AGI",
    goalPlaceholder: "First ten paying customers",
    habits: [
      { key: "ship", title: "Ship something", detail: "Anything visible to someone who is not you.", stat: "AGI", xp: 60, slot: 5, mins: 90, cadence: "daily" },
      {
        key: "customers", title: "Talk to users", detail: "Conversations today: {customerCount}. Not a survey.",
        stat: "PER", xp: 45, slot: 6, mins: 45, cadence: "weekday",
        scale: { key: "customerCount", start: 1, step: 1, cap: 5, unit: "conversations", label: "Conversations per day" },
      },
      { key: "numbers", title: "Look at the numbers", detail: "The ones that would tell you it is not working.", stat: "PER", xp: 25, slot: 7, mins: 20, cadence: "weekday" },
      { key: "market", title: "Distribution work", detail: "Building it is half. This is the other half.", stat: "AGI", xp: 40, slot: 6, mins: 45, cadence: "daily" },
    ],
  },
  {
    key: "create",
    label: "Creative work",
    blurb: "Writing, music, art, film. Output that is judged on taste.",
    stat: "PER",
    goalPlaceholder: "Finish the first draft",
    habits: [
      {
        key: "make", title: "Make the thing", detail: "Target: {makeUnits} words or equivalent. Bad output beats none.",
        stat: "PER", xp: 60, slot: 5, mins: 90, cadence: "daily",
        scale: { key: "makeUnits", start: 500, step: 50, cap: 2000, unit: "words or equivalent", label: "Output per session" },
      },
      { key: "study-craft", title: "Study the craft", detail: "Something excellent, taken apart.", stat: "INT", xp: 30, slot: 6, mins: 30, cadence: "daily" },
      { key: "publish", title: "Put it in front of someone", detail: "Work nobody sees does not improve.", stat: "AGI", xp: 40, slot: 7, mins: 20, cadence: "weekend" },
      { key: "practice", title: "Deliberate practice", detail: "The part you are worst at, on purpose.", stat: "PER", xp: 35, slot: 4, mins: 30, cadence: "daily" },
    ],
  },
  {
    key: "mind",
    label: "Mind and discipline",
    blurb: "Attention, stillness, and the hours that disappear into a screen.",
    stat: "VIT",
    goalPlaceholder: "Get my screen time under two hours",
    habits: [
      {
        key: "focus-block", title: "One unbroken focus block", detail: "{focusMins} minutes, phone in another room.",
        stat: "AGI", xp: 45, slot: 5, mins: 50, cadence: "daily",
        scale: { key: "focusMins", start: 45, step: 5, cap: 120, unit: "minutes", label: "Block length" },
      },
      { key: "meditate", title: "Sit still", detail: "Ten minutes. Nothing to achieve.", stat: "VIT", xp: 25, slot: 1, mins: 10, cadence: "daily" },
      { key: "journal", title: "Write the day down", detail: "What happened, what it cost, what tomorrow needs.", stat: "PER", xp: 25, slot: 8, mins: 10, cadence: "daily" },
      { key: "screen-cap", title: "Stay under the screen cap", detail: "The number you set yourself, honestly logged.", stat: "VIT", xp: 30, slot: 8, mins: 0, cadence: "daily" },
      { key: "no-phone-morning", title: "No phone for the first hour", detail: "The first hour sets the rest.", stat: "VIT", xp: 25, slot: 1, mins: 0, cadence: "daily" },
    ],
  },
];

export function domainOf(key) {
  return DOMAINS.find((d) => d.key === key) || null;
}

/** Every habit in the catalog, anchors included, keyed for lookup. */
export function allHabits() {
  const out = new Map();
  ANCHORS.forEach((h) => out.set(h.key, h));
  DOMAINS.forEach((d) => d.habits.forEach((h) => out.set(h.key, { ...h, domain: d.key })));
  return out;
}

export function habitOf(key) {
  return allHabits().get(key) || null;
}

/* ---------- training splits ----------
   Offered when someone says they train. The logged shape is
   kept — every set records load and reps — but which split is theirs. */

export const SPLITS = [
  {
    key: "none", label: "I do not train", days: 0,
    build: () => ({}),
  },
  {
    key: "full", label: "Full body, 3 days", days: 3,
    groups: { 1: "Full body", 3: "Full body", 5: "Full body" },
  },
  {
    key: "upper-lower", label: "Upper / lower, 4 days", days: 4,
    groups: { 1: "Upper", 2: "Lower", 4: "Upper", 5: "Lower" },
  },
  {
    key: "ppl", label: "Push / pull / legs, 6 days", days: 6,
    groups: { 1: "Push", 2: "Pull", 3: "Legs", 4: "Push", 5: "Pull", 6: "Legs" },
  },
  {
    key: "bro", label: "Body part split, 5 days", days: 5,
    groups: { 1: "Chest and triceps", 2: "Back and biceps", 3: "Legs", 4: "Shoulders", 5: "Arms and core" },
  },
  {
    key: "bodyweight", label: "Bodyweight, no gym", days: 5,
    groups: { 1: "Push and core", 2: "Legs", 3: "Pull", 4: "Conditioning", 5: "Full body" },
  },
];

/* Starter exercises per group. Loads are left empty on purpose — the first
   session you log sets the baseline, and a number nobody chose is worse than
   a blank. */
export const GROUP_EXERCISES = {
  "Push": ["Bench press", "Overhead press", "Incline dumbbell press", "Triceps pushdown"],
  "Pull": ["Barbell row", "Lat pulldown", "Face pull", "Biceps curl"],
  "Legs": ["Squat", "Romanian deadlift", "Leg press", "Calf raise"],
  "Upper": ["Bench press", "Barbell row", "Overhead press", "Lat pulldown"],
  "Lower": ["Squat", "Romanian deadlift", "Leg curl", "Calf raise"],
  "Full body": ["Squat", "Bench press", "Barbell row", "Overhead press"],
  "Chest and triceps": ["Bench press", "Incline dumbbell press", "Decline press", "Triceps pushdown"],
  "Back and biceps": ["Deadlift", "Lat pulldown", "Barbell row", "Biceps curl"],
  "Shoulders": ["Overhead press", "Lateral raise", "Rear delt fly", "Shrug"],
  "Arms and core": ["Biceps curl", "Triceps extension", "Hanging leg raise", "Plank"],
  "Push and core": ["Push-ups", "Pike push-ups", "Dips", "Plank"],
  "Conditioning": ["Burpees", "Mountain climbers", "Jump rope", "High knees"],
};
