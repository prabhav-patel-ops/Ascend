import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { load, save, emptyState } from "./store.js";
import {
  dateKey, shiftKey, generateDay, recomputeTotals, computeStreak,
  levelFromTotalXp, rankFromLevel, applyRatchet, daysBetween,
  pendingAlerts,
  sideXp, STATS, STAT_META,
} from "./engine.js";
import { Ico, chime } from "./ui.jsx";
import { quoteFor } from "./data.js";
import {
  mountFx, setFxLevel, setHaptics, haptic, lastPoint,
  burst, ring, floater, orb, combo as fxCombo, celebrate, collapse,
} from "./fx.js";
import { SignIn, Onboard } from "./screens/Welcome.jsx";
import { currentProfile, signOut, updateProfile } from "./profile.js";
import { generateSystem } from "./generate.js";
import Status from "./screens/Status.jsx";
import Quests from "./screens/Quests.jsx";
import Gates from "./screens/Gates.jsx";
import Dungeon from "./screens/Dungeon.jsx";
import Calendar from "./screens/Calendar.jsx";
import Focus from "./screens/Focus.jsx";
import Shadows from "./screens/Shadows.jsx";
import SystemChat from "./screens/System.jsx";
import Creed from "./screens/Creed.jsx";

const MAX_BACKFILL = 7;

/* A run of ticks inside this window reads as one push rather than four
   separate decisions, and the feedback escalates with it. Four seconds is
   long enough to cross a screen and short enough that walking away ends
   the chain. */
const COMBO_MS = 4000;

// structuredClone is missing on Safari before 15.4; JSON round-trip is enough
// here because the state holds nothing but plain data.
const clone = (o) =>
  typeof structuredClone === "function" ? structuredClone(o) : JSON.parse(JSON.stringify(o));

const CalIcon = () => (
  <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);

const FocusIcon = () => (
  <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="3.5" />
  </svg>
);

const CreedIcon = () => (
  <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
    <path d="M12 3s5 4.2 5 8.6a5 5 0 0 1-10 0C7 8.6 9.4 6.4 12 3z" />
    <path d="M12 20a2.6 2.6 0 0 0 2.6-2.6c0-1.6-2.6-3.6-2.6-3.6s-2.6 2-2.6 3.6A2.6 2.6 0 0 0 12 20z" />
  </svg>
);

const TABS = [
  { id: "status", label: "Status", icon: Ico.status },
  { id: "quests", label: "Quests", icon: Ico.quest },
  { id: "calendar", label: "Log", icon: CalIcon },
  { id: "gates", label: "Gates", icon: Ico.gate },
  { id: "dungeon", label: "Body", icon: Ico.body },
  { id: "focus", label: "Focus", icon: FocusIcon },
  { id: "creed", label: "Creed", icon: CreedIcon },
  { id: "shadows", label: "Shadows", icon: Ico.shadow },
  { id: "system", label: "System", icon: Ico.system },
];

/* The drifting field behind the board. Pure decoration, rendered once
   at the shell so no screen has to know about it, and animated only
   when fx.css says the level is "full". */
function Ambient() {
  return (
    <div className="fx-ambient" aria-hidden="true">
      <span className="fx-grid" />
      <span className="fx-bloom-1" />
      <span className="fx-bloom-2" />
      <span className="fx-bloom-3" />
    </div>
  );
}

export default function App() {
  const [profile, setProfile] = useState(() => currentProfile());
  const today = dateKey(new Date());

  if (!profile) return <SignIn onSignedIn={setProfile} />;
  if (!profile.onboarded) {
    return (
      <Onboard
        profile={profile}
        todayKey={today}
        onComplete={(answers) => {
          const system = generateSystem(answers, today);
          const fresh = emptyState();
          const next = {
            ...fresh,
            onboarded: true,
            answers,
            hunter: { name: answers.name || profile.name, createdAt: today },
            templates: system.templates,
            progression: system.progression,
            ratchetRules: system.ratchetRules,
            splits: system.training,
            gates: system.gates,
            settings: {
              ...fresh.settings,
              difficulty: answers.difficulty || "normal",
              targets: system.targets,
              schedule: system.schedule,
            },
          };
          save(profile.id, next);
          setProfile(updateProfile(profile.id, { onboarded: true, name: answers.name || profile.name }));
        }}
      />
    );
  }

  return <Hunter profile={profile} onSignOut={() => { signOut(); setProfile(null); }} />;
}

function Hunter({ profile, onSignOut }) {
  const [state, setState] = useState(() => load(profile.id));
  const [tab, setTab] = useState("quests");
  const [levelUp, setLevelUp] = useState(null);
  const [levelDown, setLevelDown] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const todayKey = useMemo(() => dateKey(new Date()), []);

  const flash = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  /* ---- every mutation re-derives totals from the day log, then persists ---- */
  const commit = useCallback(
    (mutate) => {
      setState((prev) => {
        const draft = mutate(clone(prev));

        const { prog, raised } = applyRatchet(draft.days, todayKey, draft.progression, draft.settings, draft.ratchetRules);
        draft.progression = prog;
        if (raised.length) draft.lastRatchet = { date: todayKey, items: raised };

        const totals = recomputeTotals(draft.days, draft.shadows, todayKey, draft.settings.difficulty);
        draft.totalXp = totals.totalXp;
        draft.statXp = totals.statXp;
        draft.streak = computeStreak(draft.days, todayKey);

        const lvl = levelFromTotalXp(draft.totalXp).level;
        const seen = draft.seenLevel || 1;
        if (lvl > seen) {
          const rank = rankFromLevel(lvl);
          const prevRank = rankFromLevel(seen);
          draft.seenLevel = lvl;
          setLevelUp({ level: lvl, rankUp: rank !== prevRank ? rank : null });
          if (draft.settings.soundOn) chime("level");
        } else if (lvl < seen) {
          // Regression is shown, not swallowed. A silent demotion teaches nothing.
          const rank = rankFromLevel(lvl);
          const prevRank = rankFromLevel(seen);
          draft.seenLevel = lvl;
          setLevelDown({
            level: lvl,
            from: seen,
            rankDown: rank !== prevRank ? rank : null,
            days: totals.chargedDays,
          });
          if (draft.settings.soundOn) chime("penalty");
        }

        save(profile.id, draft);
        return draft;
      });
    },
    [todayKey, profile.id]
  );

  /* ---- generate today, and backfill up to a week of missed days ---- */
  useEffect(() => {
    commit((d) => {
      if (!d.hunter.createdAt) d.hunter.createdAt = todayKey;

      const logged = Object.keys(d.days).sort();
      const last = logged.length ? logged[logged.length - 1] : todayKey;
      const gap = Math.min(MAX_BACKFILL, Math.max(0, daysBetween(last, todayKey)));

      for (let i = gap; i >= 0; i--) {
        const k = shiftKey(todayKey, -i);
        if (d.days[k]) continue;
        d.days[k] = generateDay(k, d.templates, d.progression, d.days[shiftKey(k, -1)]);
      }
      return d;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- effects ----
     The FX layer is mounted once and told what the settings say. Nothing
     below is load bearing: with `fx: "off"` every call returns without
     touching the DOM, and the app behaves identically. */

  useEffect(() => mountFx(), []);

  useEffect(() => {
    setFxLevel(state.settings.fx || "full");
    setHaptics(state.settings.hapticsOn !== false);
  }, [state.settings.fx, state.settings.hapticsOn]);

  useEffect(() => { if (levelUp) celebrate(levelUp.rankUp ? "#ffc24b" : "#6fa8ff"); }, [levelUp]);
  useEffect(() => { if (levelDown) collapse(); }, [levelDown]);

  /* The tick happens inside a state updater that never saw the event, so
     the flourish reads the last touch point from fx.js and fires from
     here — outside the updater, which has to stay pure. */
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const comboRef = useRef({ n: 0, at: 0 });

  const questFx = useCallback((q) => {
    if (typeof window === "undefined") return;
    const x = lastPoint.x || window.innerWidth / 2;
    const y = lastPoint.y || window.innerHeight / 2;
    const color = STAT_META[q.stat]?.color || "#6fa8ff";

    const now = Date.now();
    const n = now - comboRef.current.at < COMBO_MS ? comboRef.current.n + 1 : 1;
    comboRef.current = { n, at: now };

    burst(x, y, { count: 13 + n * 3, color, speed: 210 + n * 22, life: 0.62 });
    ring(x, y, { from: 4, to: 44 + n * 6, color, life: 0.46 });
    floater(x, y - 16, `+${q.xp} ${q.stat}`, { color });
    orb(x, y, ".topbar .rank-glyph", { color });
    haptic(n >= 3 ? [10, 26, 14] : 14);
    fxCombo(n);
  }, []);

  /* ---- quests ---- */

  const onToggle = useCallback(
    (dk, qid) => {
      /* Read the outgoing value before committing, so the sound and the
         flourish fire exactly once even when React double-invokes the
         updater in development. */
      const before = stateRef.current?.days?.[dk]?.quests?.find((x) => x.id === qid);
      const clearing = !!before && !before.done;

      commit((d) => {
        const day = d.days[dk];
        if (!day) return d;
        const q = day.quests.find((x) => x.id === qid);
        if (!q) return d;
        q.done = !q.done;
        if (q.done) q.excused = false;
        return d;
      });

      if (clearing) {
        if (stateRef.current?.settings?.soundOn) chime("quest");
        questFx(before);
        flash(`${before.stat} +${before.xp}`);
      }
    },
    [commit, flash, questFx]
  );

  const onExcuse = useCallback(
    (dk, qid) => {
      commit((d) => {
        const q = d.days[dk]?.quests.find((x) => x.id === qid);
        if (q) q.excused = !q.excused;
        return d;
      });
      flash("Excused, no penalty");
    },
    [commit, flash]
  );

  /* ---- gates ---- */

  const onAddGate = useCallback((g) => commit((d) => { d.gates.push(g); return d; }), [commit]);

  const onClearGate = useCallback((id) => {
    commit((d) => {
      const g = d.gates.find((x) => x.id === id);
      if (g) { g.cleared = true; g.clearedOn = todayKey; }
      return d;
    });
    flash("Gate cleared");
  }, [commit, flash, todayKey]);

  const onDeleteGate = useCallback(
    (id) => commit((d) => { d.gates = d.gates.filter((x) => x.id !== id); return d; }),
    [commit]
  );

  const onLogRating = useCallback((rating) => {
    commit((d) => {
      d.cfHistory = d.cfHistory || [];
      d.cfHistory = d.cfHistory.filter((h) => h.date !== todayKey);
      d.cfHistory.push({ date: todayKey, rating });
      d.cfHistory.sort((a, b) => (a.date < b.date ? -1 : 1));
      return d;
    });
    flash(`Rating logged: ${rating}`);
  }, [commit, flash, todayKey]);

  /* ---- body ---- */

  const onToggleExercise = useCallback((dk, idx) => {
    commit((d) => {
      const cur = d.body.training[dk] || { done: [] };
      cur.done = cur.done.includes(idx) ? cur.done.filter((i) => i !== idx) : [...cur.done, idx];
      d.body.training[dk] = cur;
      return d;
    });
  }, [commit]);

  /* Logged-load days write a set list per exercise key. The whole list is
     replaced on every edit so adding, removing and editing a set are one path. */
  const onLogSets = useCallback((dk, exKey, sets) => {
    commit((d) => {
      const cur = d.body.training[dk] || { done: [], sets: {} };
      d.body.training[dk] = { ...cur, done: cur.done || [], sets: { ...(cur.sets || {}), [exKey]: sets } };
      return d;
    });
  }, [commit]);

  const onLogCardio = useCallback((dk, exKey, cardio) => {
    commit((d) => {
      const cur = d.body.training[dk] || { done: [], sets: {} };
      d.body.training[dk] = { ...cur, done: cur.done || [], sets: { ...(cur.sets || {}), [exKey]: { cardio } } };
      return d;
    });
  }, [commit]);

  /* The split ships with a best guess at each exercise name. Renaming keeps the
     key, so the history and the progression built on it survive the correction. */
  const onRenameExercise = useCallback((exKey, name) => {
    commit((d) => {
      d.body.exNames = { ...(d.body.exNames || {}) };
      const clean = String(name || "").trim();
      if (clean) d.body.exNames[exKey] = clean;
      else delete d.body.exNames[exKey];
      return d;
    });
  }, [commit]);

  const onAddMeal = useCallback((dk, meal) => {
    commit((d) => {
      d.body.meals[dk] = [...(d.body.meals[dk] || []), meal];
      return d;
    });
    flash(`${meal.name} added`);
  }, [commit, flash]);

  const onRemoveMeal = useCallback((dk, i) => {
    commit((d) => {
      d.body.meals[dk] = (d.body.meals[dk] || []).filter((_, j) => j !== i);
      return d;
    });
  }, [commit]);

  const onSetWater = useCallback(
    (dk, v) => commit((d) => { d.body.water[dk] = Math.max(0, +v.toFixed(2)); return d; }),
    [commit]
  );

  const onLogWeight = useCallback((dk, kg) => {
    commit((d) => {
      const arr = d.body.weights.filter((x) => x.date !== dk);
      arr.push({ date: dk, kg });
      arr.sort((a, b) => (a.date < b.date ? -1 : 1));
      d.body.weights = arr;
      return d;
    });
    flash(`Weight logged: ${kg} kg`);
  }, [commit, flash]);

  const onLogWaist = useCallback((dk, cm) => {
    commit((d) => {
      const arr = d.body.waist.filter((x) => x.date !== dk);
      arr.push({ date: dk, cm });
      arr.sort((a, b) => (a.date < b.date ? -1 : 1));
      d.body.waist = arr;
      return d;
    });
    flash(`Waist logged: ${cm} cm`);
  }, [commit, flash]);

  const onLogSleep = useCallback((dk, s) => {
    commit((d) => { d.body.sleep[dk] = s; return d; });
    flash(`Sleep logged: ${s.hours} h`);
  }, [commit, flash]);

  /* ---- shadows and settings ---- */

  const onExtract = useCallback((s) => {
    commit((d) => { d.shadows.push({ ...s, date: todayKey }); return d; });
    flash("Arise.");
  }, [commit, flash, todayKey]);

  const onDismiss = useCallback(
    (id) => commit((d) => { d.shadows = d.shadows.filter((x) => x.id !== id); return d; }),
    [commit]
  );

  const onSettings = useCallback(
    (patch) => commit((d) => { d.settings = { ...d.settings, ...patch }; return d; }),
    [commit]
  );

  const onProgression = useCallback(
    (field, v) => commit((d) => { d.progression[field] = v; return d; }),
    [commit]
  );

  /* ---- creed ----
     Watching is counted and worth nothing. XP is priced by the engine so
     that every generated day costs the same; paying out for a video from
     out here would break that invariant from outside the one file that
     owns it. So this records what happened and stops. */

  const onCreedWatch = useCallback((id, name) => {
    if (!id) return;
    commit((d) => {
      const prev = d.creed.watched[id] || { count: 0 };
      d.creed.watched = {
        ...d.creed.watched,
        [id]: { count: (prev.count || 0) + 1, name: name || prev.name || "", lastAt: new Date().toISOString() },
      };
      return d;
    });
  }, [commit]);

  const onCreedPin = useCallback((text) => {
    const line = String(text || "").trim();
    if (!line) return;
    commit((d) => {
      d.creed.pinned = d.creed.pinned.includes(line)
        ? d.creed.pinned.filter((x) => x !== line)
        : [line, ...d.creed.pinned].slice(0, 40);
      return d;
    });
  }, [commit]);

  /* A day's note. Empty text removes the entry rather than storing a blank,
     so "days written" stays an honest count. */
  const onJournal = useCallback((dk, text) => {
    commit((d) => {
      const j = { ...d.body.journal };
      const clean = String(text || "").trim();
      if (clean) j[dk] = { text: clean, at: new Date().toISOString() };
      else delete j[dk];
      d.body.journal = j;
      return d;
    });
  }, [commit]);

  /* ---- side quests ----
     Priced by the engine rather than by the caller, so the board and this
     cannot drift apart on what a piece of work is worth. */
  const onAddExtra = useCallback((dk, task) => {
    commit((d) => {
      const day = d.days[dk];
      if (!day) return d;
      const entry = {
        id: `x${Date.now().toString(36)}`,
        title: String(task.title || "").trim().slice(0, 120) || "Side quest",
        stat: STATS.includes(task.stat) ? task.stat : "INT",
        sig: task.sig || "minor",
        mins: Math.max(0, Math.min(600, Math.round(Number(task.mins) || 0))),
        at: new Date().toISOString(),
      };
      entry.xp = sideXp(entry.sig, entry.mins);
      day.extras = [...(day.extras || []), entry];
      return d;
    });
    flash("Logged");
  }, [commit, flash]);

  const onRemoveExtra = useCallback((dk, id) => {
    commit((d) => {
      const day = d.days[dk];
      if (day) day.extras = (day.extras || []).filter((x) => x.id !== id);
      return d;
    });
  }, [commit]);

  /* ---- seasons, schedule, reminders, focus ---- */

  const onStartSeason = useCallback((season) => {
    commit((d) => {
      d.seasons = [...(d.seasons || []).filter((s) => s.id !== season.id), season];
      return d;
    });
  }, [commit]);

  const onSchedule = useCallback((patch) => {
    commit((d) => {
      d.settings = { ...d.settings, schedule: { ...d.settings.schedule, ...patch } };
      return d;
    });
  }, [commit]);

  const onReminder = useCallback((id, patch) => {
    commit((d) => {
      d.settings = {
        ...d.settings,
        reminders: (d.settings.reminders || []).map((r) => (r.id === id ? { ...r, ...patch } : r)),
      };
      return d;
    });
  }, [commit]);

  /* Minutes lost, stored per day so the calendar can show what a bad week cost.
     Clamped at zero and at a day, because a typo of 3000 would poison the
     weekly average for a fortnight. */
  const onLogFocus = useCallback((dk, id, mins) => {
    commit((d) => {
      const day = { ...(d.body.focus[dk] || {}) };
      const v = Math.max(0, Math.min(1440, Math.round(Number(mins) || 0)));
      if (v === 0) delete day[id];
      else day[id] = v;
      d.body.focus = { ...d.body.focus, [dk]: day };
      return d;
    });
  }, [commit]);

  const onImport = useCallback((next) => { save(profile.id, next); setState(next); flash("Backup restored"); }, [flash, profile.id]);
  /* A reset returns this profile to an unbuilt state and sends them back
     through setup, rather than leaving them on an empty board with no way to
     answer the questions again. */
  const onReset = useCallback(() => {
    const e = emptyState();
    save(profile.id, e);
    updateProfile(profile.id, { onboarded: false });
    location.reload();
  }, [profile.id]);

  const [nowMins, setNowMins] = useState(() => new Date().getHours() * 60 + new Date().getMinutes());
  useEffect(() => {
    const id = setInterval(() => setNowMins(new Date().getHours() * 60 + new Date().getMinutes()), 60000);
    return () => clearInterval(id);
  }, []);

  const [muted, setMuted] = useState([]);
  const alerts = useMemo(
    () => pendingAlerts(state, todayKey, nowMins).filter((a) => !muted.includes(a.id)),
    [state, todayKey, nowMins, muted]
  );

  /* Which way the tab bar moved decides which way the page slides, so
     forward and back feel different and the app keeps a sense of place. */
  const tabIndex = Math.max(0, TABS.findIndex((t) => t.id === tab));
  const lastTab = useRef(tabIndex);
  const dir = tabIndex >= lastTab.current ? 1 : -1;
  useEffect(() => { lastTab.current = tabIndex; }, [tabIndex]);

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const level = levelFromTotalXp(state.totalXp).level;
  const rank = rankFromLevel(level);

  const shared = {
    state, todayKey, onToggle, onExcuse, onAddGate, onClearGate, onDeleteGate, onLogRating,
    onToggleExercise, onLogSets, onLogCardio, onRenameExercise,
    onAddMeal, onRemoveMeal, onSetWater, onLogWeight, onLogWaist, onLogSleep,
    onExtract, onDismiss, onSettings, onImport, onReset, onProgression, flash, onSignOut,
    onStartSeason, onSchedule, onReminder, onLogFocus, onJournal, alerts, setTab,
    onAddExtra, onRemoveExtra, onCreedWatch, onCreedPin,
  };

  return (
    <div className="app">
      <Ambient />
      <header className="topbar" data-scrolled={scrolled}>
        <div className="rank-glyph" data-rank={rank}>{rank}</div>
        <div className="topbar-meta">
          <div className="topbar-name">{state.hunter.name}</div>
          <div className="topbar-sub">Level {level} · {state.streak.current} day streak</div>
        </div>
      </header>

      {alerts.length > 0 && (
        <div className="mn-alerts">
          {alerts.slice(0, 3).map((a) => (
            <button
              key={a.id}
              className="mn-alert mn-rise"
              data-level={a.level}
              onClick={() => { if (a.action) setTab(a.action); }}
            >
              <div className="mn-alert-body">
                <div className="mn-alert-title">{a.title}</div>
                <div className="mn-alert-text">{a.body}</div>
              </div>
              <span
                className="mn-alert-x"
                role="button"
                tabIndex={0}
                aria-label="Dismiss"
                onClick={(e) => { e.stopPropagation(); setMuted((m) => [...m, a.id]); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); setMuted((m) => [...m, a.id]); } }}
              >
                ×
              </span>
            </button>
          ))}
        </div>
      )}

      <main className="content mn-page" key={tab} style={{ "--dir": dir }}>
        {tab === "status" && <Status {...shared} />}
        {tab === "quests" && <Quests {...shared} />}
        {tab === "gates" && <Gates {...shared} />}
        {tab === "dungeon" && <Dungeon {...shared} />}
        {tab === "calendar" && <Calendar {...shared} />}
        {tab === "focus" && <Focus {...shared} />}
        {tab === "creed" && <Creed {...shared} />}
        {tab === "shadows" && <Shadows {...shared} />}
        {tab === "system" && <SystemChat {...shared} />}
      </main>

      <nav className="nav" style={{ "--mn-tabs": TABS.length, "--mn-active": tabIndex }}>
        <span className="mn-nav-pill" aria-hidden="true" />
        {TABS.map((t) => (
          <button key={t.id} data-on={tab === t.id} onClick={() => setTab(t.id)} aria-label={t.label}>
            <t.icon />
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>

      {toast && <div className="toast mn-toast">{toast}</div>}

      {levelDown && (
        <div className="levelup levelup--down mn-levelup mn-levelup--down" onClick={() => setLevelDown(null)}>
          <div className="mn-levelup__stage" aria-hidden="true">
            <span className="mn-levelup__ring" />
            <span className="mn-levelup__ring mn-levelup__ring--2" />
            <span className="mn-levelup__sweep" />
          </div>
          <div className="mn-levelup__body" style={{ textAlign: "center", padding: 24 }}>
            <div className="rank-glyph mn-levelup__glyph" data-rank={levelDown.rankDown || rank}>
              {levelDown.rankDown || rank}
            </div>
            <h2 style={{ color: "var(--blood)" }}>Level Lost</h2>
            <p style={{ marginTop: 18 }}>
              Level {levelDown.from} down to {levelDown.level}
            </p>
            {levelDown.rankDown && (
              <p style={{ color: "var(--blood)", fontSize: 16 }}>Demoted to rank {levelDown.rankDown}</p>
            )}
            <p className="faint" style={{ marginTop: 14, maxWidth: 300 }}>
              {levelDown.days} days of work charged back so far. Three clean days start forgiving it.
            </p>
            <button className="solid" style={{ marginTop: 22 }} onClick={() => setLevelDown(null)}>
              Understood
            </button>
          </div>
        </div>
      )}

      {levelUp && (
        <div className="levelup mn-levelup" onClick={() => setLevelUp(null)}>
          <div className="mn-levelup__stage" aria-hidden="true">
            <span className="mn-levelup__ring" />
            <span className="mn-levelup__ring mn-levelup__ring--2" />
            <span className="mn-levelup__sweep" />
          </div>
          <div className="mn-levelup__body" style={{ textAlign: "center", padding: 24 }}>
            <div className="rank-glyph mn-levelup__glyph" data-rank={levelUp.rankUp || rank}>
              {levelUp.rankUp || rank}
            </div>
            <h2>Level Up</h2>
            <p style={{ marginTop: 18 }}>You have reached level {levelUp.level}</p>
            {levelUp.rankUp && <p style={{ color: "var(--gold)", fontSize: 16 }}>Rank {levelUp.rankUp}</p>}
            <p className="faint" style={{ marginTop: 14, maxWidth: 300 }}>
              {quoteFor(levelUp.rankUp ? "rankUp" : "levelUp", String(levelUp.level))}
            </p>
            <button className="solid" style={{ marginTop: 22 }} onClick={() => setLevelUp(null)}>Continue</button>
          </div>
        </div>
      )}
    </div>
  );
}
