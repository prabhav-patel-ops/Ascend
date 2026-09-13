# ASCEND

A progression system that builds itself around whatever you are actually working on.

You sign in, answer a handful of questions, and it generates your board: daily quests, the
stats they train, deadlines to count down, a training split if you lift, and the numbers that
climb on their own as you keep clearing them.

Everything is local. There is no server and no account — see *Sign-in* below for exactly what
that does and does not mean.

---

## Running it

```
npm install
npm run dev      # http://localhost:5173
npm test         # 154 tests, plus a year-long pacing simulation
npm run build
```

---

## How a system gets built

```
onboarding answers  ->  generate.js  ->  templates, gates, split, progression
        |                    |
     catalog.js         engine.js runs them
   (the menu)         (unchanged per person)
```

**`catalog.js`** is the menu — eight domains, each with a handful of concrete habits. Nothing
in it is anyone's routine; it is what the wizard offers.

**`generate.js`** turns answers into a working system. One rule governs it:

> A generated day must be worth roughly the same as anyone else's generated day.

Clearing is a *ratio* and penalties are denominated in *days of work*. If someone who picks
twelve habits got a 600 XP day while someone who picks five got 250, they would be playing two
different games — the first levelling twice as fast and punished twice as hard for the same
proportional slip. So picked habits keep their relative weights and the whole day is scaled to
a common total. **What you choose changes the shape of a day, never its price.**

**`engine.js`** is identical for everybody: levels, ranks, the penalty model, streaks,
seasons, the calendar, training progression. It never knows whose board it is running.

---

## Sign-in — read this

It is a **profile on this device, not an account.**

There is no server, so there is nothing to authenticate against and nothing that follows you to
another phone. There is no password, because there would be nothing to check one against.
Anyone using this browser can open any profile listed on the sign-in screen.

The screen says so in those words rather than implying a security the app does not have.

What this buys you: several people can share a device with separate boards, and everything
works offline with no account to create.

What it costs you: clearing browser data destroys a profile. **Export a backup before you clear
site data or move to another device.**

Every read and write of a profile's data goes through `profile.js`, so putting a real backend
behind it later is a change in that one file.

---

## Layout

| file | what it owns |
|---|---|
| `src/catalog.js` | Domains, habits, training splits — the menu the wizard offers |
| `src/generate.js` | Answers to a working system, and the day-price invariant |
| `src/profile.js` | Profiles and the local save. The seam a real backend would slot into |
| `src/engine.js` | Levels, penalties, streaks, seasons, calendar, progression. Pure, tested |
| `src/store.js` | State shape and `hydrate()` migrations |
| `src/screens/Welcome.jsx` | Sign-in and the onboarding wizard |
| `src/platform.js` | What this device can actually do. The only file that changes going native |
| `src/fx.js` + `src/fx.css` | The game layer. Particles, the touch answer, shake, the living background |
| `src/creed.js` | The written bank behind the Creed tab, grouped by what a person opens it needing |
| `src/lib/media.js` | Speech clips as Blobs in IndexedDB. Never localStorage — see the file header |

---

## Motion

Three files, in ascending volume, all loaded in this order so the later ones win:

- **`theme.css`** — the event set pieces. Level up, extraction, the rank heat ramp.
- **`motion.css`** — the quiet everyday layer. How a tab change reads, how a card arrives.
- **`fx.css` + `fx.js`** — the game feel. Every touch answers, quests burst and fly to the rank
  glyph, chains count, the background drifts.

All of the third hangs off one switch, `<html data-fx>`, set from `settings.fx`:

| | |
|---|---|
| `full` | everything |
| `lite` | the answers, none of the ambience. No drift, no shake, no idle loop, half the particles |
| `off` | nothing moves. The app is identical, just still |

`prefers-reduced-motion` forces `off` regardless of the setting — it is the person's phone.

**Nothing in the motion layer is load bearing.** No screen imports `fx.js` to work, every
entry point in it is safe to call during SSR and returns quietly if the target is not on
screen, and deleting the whole file would cost the app nothing but the motion. Keep it that
way. Per frame, only `transform` and `opacity`.

---

## Creed

The motivational tab. Two halves that are deliberately different in kind.

**The line** is generated, from `creed.js`, deterministic on the date so it does not reshuffle
while you are reading it. The theme it opens on is inferred from your own board — a broken
streak gets a different sentence than a clean fortnight — until you pick one yourself.

**The shelf** is yours, and clips reach it two ways:

| | where it lives | who sees it | in the backup? |
|---|---|---|---|
| Dropped in `public/speeches/` and listed in its `manifest.json` | the build | every profile, every device | it is the build |
| Added in the app with *Add files* | IndexedDB on that device | that device | **no** — the watch log is, the file is not |

See `public/speeches/README.md` for the manifest format and the two things worth knowing
before adding a lot of them.

---

## Rules for changing this

- **A habit's `key` is permanent.** The log is keyed on it. Changing one orphans everybody's
  history for that habit.
- **Every state-shape change needs a `hydrate()` migration.** A save written by yesterday's
  build must load in today's without crashing and without silently losing a field.
- **Never add a "replace saved templates from the defaults" migration.** Templates are
  generated per person and are their data. A migration like that would silently overwrite a
  board somebody answered questions to build.
- **A missing number is a gap, not a zero.** Absent input must never read as a failed day.
- **Put logic in `engine.js` with a test,** not in a screen.
- **Nothing outside the engine awards XP.** The day-price invariant above is enforced in
  `generate.js` and priced in `engine.js`. Watching a speech is counted and worth nothing to
  your level, on purpose — paying out from a screen would break that invariant from outside the
  one file that owns it.
- **Effects are never load bearing.** If turning `settings.fx` off changes what the app *does*
  rather than only how it looks, the change belongs somewhere other than `fx.js`.

---

## Relationship to MONARCH

ASCEND started as a copy of MONARCH (`E:\Monarch`) and shares its engine. MONARCH is a
single-person build with its owner's routine compiled in; this is the general one. The two are
separate projects — nothing here writes to `E:\Monarch`.
