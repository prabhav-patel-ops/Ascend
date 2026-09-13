/* ===================================================================
   creed.js — the long-form bank behind the Creed screen.

   Same rule as QUOTES in data.js: written for this app, not quoted from
   anyone. Speech transcripts are copyrighted, and a wall of somebody
   else's uncredited words would be both a legal problem and a worse fit
   than the register this app already speaks in.

   Grouped by what a person opens this screen needing. Someone who has
   just broken a streak needs a different sentence from someone stalling
   at the start, and that difference is the whole reason the tab filters
   rather than shuffling one undifferentiated pile.
   =================================================================== */

export const CREED_THEMES = [
  { id: "start", label: "Starting", hint: "For the days when the first move is the whole problem." },
  { id: "discipline", label: "Discipline", hint: "For when it comes down to doing it anyway." },
  { id: "pain", label: "Cost", hint: "For the part that is supposed to be hard." },
  { id: "consistency", label: "Repetition", hint: "For the long unremarkable middle." },
  { id: "focus", label: "Attention", hint: "For when the hours keep going somewhere else." },
  { id: "identity", label: "Who you are", hint: "For when the work has to outlast the mood." },
  { id: "setback", label: "After a fall", hint: "For a broken streak and a bad week." },
  { id: "time", label: "Time", hint: "For when it feels too late, or too slow." },
];

export const CREED = [
  /* ---- starting ---- */
  { theme: "start", text: "You do not need to feel like it. You need to begin badly and let the momentum arrive late." },
  { theme: "start", text: "The first repetition is the expensive one. Everything after it is cheaper than you think." },
  { theme: "start", text: "Waiting for certainty is a way of choosing nothing while feeling responsible." },
  { theme: "start", text: "Two minutes of the real thing beats an hour of preparing to do the real thing." },
  { theme: "start", text: "You are not lazy. You are unstarted. Those are different problems, and only one of them is about character." },
  { theme: "start", text: "Do it while it is still ugly. Polish is a reward for volume, not a prerequisite for it." },
  { theme: "start", text: "Nobody has ever been talked into motion. They moved, and the feeling followed." },
  { theme: "start", text: "The version of this you can do today is the only version that exists." },

  /* ---- discipline ---- */
  { theme: "discipline", text: "Motivation is weather. Discipline is architecture. Build something the weather cannot cancel." },
  { theme: "discipline", text: "The whole difference is what you do on the day you have a perfectly good excuse." },
  { theme: "discipline", text: "Standards you keep only when observed are not standards. They are performances." },
  { theme: "discipline", text: "Decide once, at a calm hour, and stop renegotiating it at the hour you are weakest." },
  { theme: "discipline", text: "You will not always want it. Build a system that does not ask whether you do." },
  { theme: "discipline", text: "Discipline is not severity. It is refusing to let one day's mood spend the progress of the next." },
  { theme: "discipline", text: "Every time you keep a promise to yourself, the next one costs less." },
  { theme: "discipline", text: "The work is boring by design. Boring is what repeatable looks like from the inside." },

  /* ---- cost ---- */
  { theme: "pain", text: "It is supposed to be hard. If it were easy it would not change anything about you." },
  { theme: "pain", text: "Comfort is a loan against a future you have not met, at a rate you cannot see." },
  { theme: "pain", text: "Choose your difficulty deliberately, or the world will assign you one." },
  { theme: "pain", text: "The set that hurts is the set that counts. The rest was arithmetic." },
  { theme: "pain", text: "Everything worth having is on the other side of something you would rather not do." },
  { theme: "pain", text: "You can have the outcome or the excuse. The price of one is giving up the other." },
  { theme: "pain", text: "Discomfort is information, not a verdict. Stay in it long enough to read it." },
  { theme: "pain", text: "None of this gets easier. You get harder to stop." },

  /* ---- repetition ---- */
  { theme: "consistency", text: "Nothing you do today will feel like it mattered. Do it anyway. That is what compounding feels like from the inside." },
  { theme: "consistency", text: "One good day is a mood. Thirty is a mechanism." },
  { theme: "consistency", text: "The unremarkable middle is where the entire result is actually manufactured." },
  { theme: "consistency", text: "Stop looking for the day it pays off. Look at the count." },
  { theme: "consistency", text: "Small and daily beats large and occasional, every time, without exception." },
  { theme: "consistency", text: "Progress is invisible at the scale you keep checking it. Widen the window." },
  { theme: "consistency", text: "You are building a floor, not a peak. Peaks fall off. Floors do not." },
  { theme: "consistency", text: "The goal is not a heroic week. It is a week you could survive repeating." },

  /* ---- attention ---- */
  { theme: "focus", text: "Attention is the only currency you cannot earn back. Every hour was spent, and something received it." },
  { theme: "focus", text: "You are not distracted. You are being harvested, by people who are extremely good at it." },
  { theme: "focus", text: "Depth is a skill and it atrophies. Every shallow hour is a repetition of the wrong thing." },
  { theme: "focus", text: "The feed is a gate you walk into voluntarily and leave weaker." },
  { theme: "focus", text: "One thing, badly, all the way through beats five things arranged neatly and abandoned." },
  { theme: "focus", text: "If you cannot sit with one problem for an hour, every problem worth solving is out of reach." },
  { theme: "focus", text: "Boredom is the doorway to concentration. Stop paying to avoid it." },
  { theme: "focus", text: "Protect the first two hours. Everything that wants them will still be there afterwards." },

  /* ---- who you are ---- */
  { theme: "identity", text: "You are not what you intend. You are the sum of what you logged." },
  { theme: "identity", text: "Stop trying to feel motivated. Become someone for whom this is simply what happens at six." },
  { theme: "identity", text: "Every repetition is a vote for who you are about to be. Count the ballots honestly." },
  { theme: "identity", text: "Do not ask whether you feel like it. Ask what someone who had already done this would do now." },
  { theme: "identity", text: "The person you are trying to become is built out of days that felt like nothing at the time." },
  { theme: "identity", text: "Your standards in private are your actual standards. The rest is marketing." },
  { theme: "identity", text: "You are allowed to be a beginner. You are not allowed to stay one on purpose." },
  { theme: "identity", text: "Become someone whose word to themselves is worth something. Everything else is downstream of that." },

  /* ---- after a fall ---- */
  { theme: "setback", text: "A lapse is data, not a verdict. The only question is what the next entry says." },
  { theme: "setback", text: "The streak is gone. The levels are not. Start the count again today, not Monday." },
  { theme: "setback", text: "You did not fail. You skipped an entry. Those are not the same size." },
  { theme: "setback", text: "Missing once is an accident. Missing twice is the start of a new habit. Do not let it be." },
  { theme: "setback", text: "Nobody who has done anything did it without weeks like this one. They are just not in the story." },
  { theme: "setback", text: "Guilt is not a payment. It costs you the next day as well. Log something and move." },
  { theme: "setback", text: "The floor is still where you left it. Stand on it." },
  { theme: "setback", text: "Coming back is not a fresh start. It is a resumption. You keep everything you already built." },

  /* ---- time ---- */
  { theme: "time", text: "It is late. It has always been late. Late is when almost everything worth doing got started." },
  { theme: "time", text: "In two years you will wish you had started today, exactly as you wished it two years ago." },
  { theme: "time", text: "The time it takes is not negotiable. Your presence for it is." },
  { theme: "time", text: "Everyone ahead of you started before they were ready, at a worse hour, with less." },
  { theme: "time", text: "You cannot compress the work. You can stop restarting the clock." },
  { theme: "time", text: "Slow is fine. Stopped is the only failure that actually costs you the outcome." },
  { theme: "time", text: "Comparison is a tax on progress you already made. Stop paying it." },
  { theme: "time", text: "The days are long and the years are short. Only one of those is worth optimising." },
];

/** Stable hash, so a seed always maps to the same line. */
function hashOf(seed) {
  let h = 0;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function poolFor(theme) {
  const pool = theme ? CREED.filter((c) => c.theme === theme) : CREED;
  return pool.length ? pool : CREED;
}

/**
 * The line for a seed. Deterministic, so the line of the day is the same
 * every time the screen is opened and a different one tomorrow.
 */
export function creedLine(seed = "", theme = null) {
  const list = poolFor(theme);
  return list[hashOf(seed) % list.length];
}

/**
 * The bank as an ordered deck, rotated by the seed. The screen's next
 * button walks this rather than rolling dice, so you never get the same
 * line twice in a row and you see all of them before any repeat.
 */
export function creedDeck(seed = "", theme = null) {
  const list = poolFor(theme).slice();
  const start = hashOf(seed) % list.length;
  return list.slice(start).concat(list.slice(0, start));
}

/**
 * Which theme the board itself suggests. A broken streak asks for a
 * different sentence than a clean fortnight, and picking it from the
 * state is the difference between a quote screen and one that is paying
 * attention. Returns null when nothing in particular stands out.
 */
export function themeFromState(state, todayKey) {
  if (!state) return null;
  const streak = state.streak?.current ?? 0;
  const best = state.streak?.best ?? 0;
  const day = state.days?.[todayKey];

  if (best >= 3 && streak === 0) return "setback";
  if (day && day.quests?.length && !day.quests.some((q) => q.done)) return "start";

  const focus = state.body?.focus?.[todayKey] || {};
  const lost = Object.values(focus).reduce((a, b) => a + (Number(b) || 0), 0);
  if (lost >= 90) return "focus";

  if (streak >= 14) return "identity";
  if (streak >= 5) return "consistency";
  return null;
}
