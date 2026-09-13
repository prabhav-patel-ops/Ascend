import React, { useState, useMemo } from "react";
import { Win } from "../ui.jsx";
import { MonarchCrest, RuneRing } from "../art.jsx";
import { DOMAINS, ANCHORS, SPLITS, STAT_HINT, domainOf } from "../catalog.js";
import { previewSystem } from "../generate.js";
import { DIFFICULTY, STAT_META, shiftKey } from "../engine.js";
import { listProfiles, createProfile, signIn, deleteProfile } from "../profile.js";

/* ---------------- sign in ----------------
   Worth being straight about what this is. There is no server behind it, so
   there is nothing to authenticate against — it picks which profile on this
   device you are using, and the copy says exactly that rather than implying a
   security the app does not have. */

export function SignIn({ onSignedIn }) {
  const [profiles, setProfiles] = useState(() => listProfiles());
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(() => listProfiles().length === 0);

  const create = () => {
    const clean = name.trim();
    if (!clean) return;
    const p = createProfile(clean);
    onSignedIn(p);
  };

  const remove = (id, label) => {
    if (!confirm(`Delete ${label} and everything they have logged? This cannot be undone.`)) return;
    deleteProfile(id);
    const left = listProfiles();
    setProfiles(left);
    if (left.length === 0) setAdding(true);
  };

  return (
    <div className="mn-welcome">
      <div className="mn-welcome-mark">
        <RuneRing size={190} className="mn-welcome-ring" />
        <MonarchCrest size={62} />
      </div>

      <h1 className="mn-welcome-title">ASCEND</h1>
      <p className="mn-welcome-sub">
        A system built around what you are actually working on. Answer some questions and it writes your board.
      </p>

      <Win tone="accent" title={adding ? "New profile" : "Who is this"}>
        {!adding && (
          <>
            {profiles.map((p) => (
              <div className="gate mn-rise" key={p.id}>
                <div className="gate-rank" data-rank={p.onboarded ? "C" : "E"}>{p.name.slice(0, 1).toUpperCase()}</div>
                <div className="gate-body">
                  <div className="gate-name">{p.name}</div>
                  <div className="gate-when">
                    {p.onboarded ? `Since ${p.createdAt}` : "Setup not finished"}
                  </div>
                </div>
                <button className="solid none" style={{ padding: "6px 12px" }} onClick={() => { signIn(p.id); onSignedIn(p); }}>
                  Open
                </button>
                <button
                  className="ghost none"
                  style={{ padding: "5px 9px", fontSize: 10, marginLeft: 6 }}
                  onClick={() => remove(p.id, p.name)}
                  aria-label={`Delete ${p.name}`}
                >
                  ×
                </button>
              </div>
            ))}
            <button className="ghost" style={{ marginTop: 10 }} onClick={() => setAdding(true)}>+ Someone else</button>
          </>
        )}

        {adding && (
          <>
            <label className="field">
              <span>What should the System call you</span>
              <input
                autoFocus
                value={name}
                placeholder="Your name"
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") create(); }}
              />
            </label>
            <div className="row" style={{ marginTop: 12 }}>
              {profiles.length > 0 && <button className="ghost" onClick={() => setAdding(false)}>Back</button>}
              <button className="solid none" disabled={!name.trim()} onClick={create}>Begin</button>
            </div>
          </>
        )}
      </Win>

      <p className="faint mn-welcome-note">
        This is a profile on this device, not an account. Nothing is uploaded and there is no password, because there
        is no server to check one against. Anyone using this browser can open any profile here. Export a backup before
        you clear browser data or move to another phone.
      </p>
    </div>
  );
}

/* ---------------- onboarding ---------------- */

const STEPS = ["Focus", "Goals", "Board", "Rhythm", "Standard", "Review"];

export function Onboard({ profile, todayKey, onComplete }) {
  const [step, setStep] = useState(0);
  const [a, setA] = useState(() => ({
    name: profile.name,
    domains: [],
    goals: {},
    habits: ANCHORS.map((h) => h.key),
    wake: "06:00",
    sleep: "22:30",
    trainSplit: "none",
    targets: { kcal: 2200, protein: 140, water: 3 },
    difficulty: "normal",
  }));

  const set = (patch) => setA((prev) => ({ ...prev, ...patch }));
  const chosen = a.domains.map(domainOf).filter(Boolean);

  const toggleDomain = (key) => {
    const has = a.domains.includes(key);
    if (!has && a.domains.length >= 4) return;
    const domains = has ? a.domains.filter((d) => d !== key) : [...a.domains, key];

    /* Dropping a domain takes its habits and its goal with it, so nothing
       invisible survives into the generated board. */
    const dead = has ? (domainOf(key)?.habits || []).map((h) => h.key) : [];
    setA((prev) => ({
      ...prev,
      domains,
      habits: prev.habits.filter((h) => !dead.includes(h)),
      goals: has ? Object.fromEntries(Object.entries(prev.goals).filter(([k]) => k !== key)) : prev.goals,
    }));
  };

  const toggleHabit = (key) => {
    setA((prev) => ({
      ...prev,
      habits: prev.habits.includes(key) ? prev.habits.filter((h) => h !== key) : [...prev.habits, key],
    }));
  };

  const preview = useMemo(() => previewSystem(a), [a]);
  const realHabits = a.habits.filter((k) => !ANCHORS.some((x) => x.key === k)).length;

  const canAdvance = [
    a.domains.length > 0,
    true,
    realHabits >= 2,
    true,
    true,
    true,
  ][step];

  const next = () => (step < STEPS.length - 1 ? setStep(step + 1) : onComplete(a));

  return (
    <div className="mn-onboard">
      <div className="mn-steps-rail">
        {STEPS.map((label, i) => (
          <div key={label} className="mn-step-dot" data-on={i <= step} data-now={i === step}>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="mn-page" style={{ "--dir": 1 }} key={step}>
        {step === 0 && (
          <Win tone="accent" title="What are you building" right={`${a.domains.length} of 4`}>
            <p className="faint" style={{ marginTop: 0 }}>
              Pick up to four. These decide what your board is made of and which stats it trains. You can change any of
              it later — this is a starting point, not a contract.
            </p>
            {DOMAINS.map((d) => {
              const on = a.domains.includes(d.key);
              return (
                <div
                  key={d.key}
                  className="quest mn-rise"
                  data-done={on}
                  onClick={() => toggleDomain(d.key)}
                  role="checkbox"
                  aria-checked={on}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleDomain(d.key); } }}
                >
                  <div className="qbox" style={on ? { background: STAT_META[d.stat].color, borderColor: STAT_META[d.stat].color } : undefined}>
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#060a14" strokeWidth="3.4" strokeLinecap="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                  <div className="qbody">
                    <div className="qtitle">{d.label}</div>
                    <div className="qdetail">{d.blurb}</div>
                    <div className="faint" style={{ fontSize: 10, marginTop: 2, color: STAT_META[d.stat].color }}>
                      Trains {d.stat} — {STAT_HINT[d.stat]}
                    </div>
                  </div>
                </div>
              );
            })}
          </Win>
        )}

        {step === 1 && (
          <Win tone="accent" title="What does winning look like">
            <p className="faint" style={{ marginTop: 0 }}>
              One sentence each, in your words. Give it a date and it becomes a gate — a deadline the app counts down
              and warns you about. Leave the date blank and it stays a direction rather than a deadline.
            </p>
            {chosen.map((d) => (
              <div key={d.key} style={{ marginBottom: 16 }}>
                <div className="faint" style={{ fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 5, color: STAT_META[d.stat].color }}>
                  {d.label}
                </div>
                <input
                  placeholder={d.goalPlaceholder}
                  value={a.goals[d.key]?.text || ""}
                  onChange={(e) => set({ goals: { ...a.goals, [d.key]: { ...a.goals[d.key], text: e.target.value } } })}
                />
                <label className="field" style={{ marginTop: 8 }}>
                  <span>By when (optional)</span>
                  <input
                    type="date"
                    value={a.goals[d.key]?.date || ""}
                    min={shiftKey(todayKey, 1)}
                    onChange={(e) => set({ goals: { ...a.goals, [d.key]: { ...a.goals[d.key], date: e.target.value } } })}
                  />
                </label>
              </div>
            ))}
          </Win>
        )}

        {step === 2 && (
          <>
            <Win tone="accent" title="Your daily board" right={`${realHabits} picked`}>
              <p className="faint" style={{ marginTop: 0 }}>
                What you are committing to on an ordinary day. Pick honestly — a board you clear four days a week beats
                one you clear none. Everything is weighted so a full day is worth the same whether you pick four things
                or ten.
              </p>
              {realHabits < 2 && <div className="empty">Pick at least two.</div>}
            </Win>

            {chosen.map((d) => (
              <Win key={d.key} title={d.label}>
                {d.habits.map((h) => {
                  const on = a.habits.includes(h.key);
                  return (
                    <div
                      key={h.key}
                      className="quest"
                      data-done={on}
                      onClick={() => toggleHabit(h.key)}
                      role="checkbox"
                      aria-checked={on}
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleHabit(h.key); } }}
                    >
                      <div className="qbox" style={on ? { background: STAT_META[h.stat].color, borderColor: STAT_META[h.stat].color } : undefined}>
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#060a14" strokeWidth="3.4" strokeLinecap="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </div>
                      <div className="qbody">
                        <div className="qtitle">{h.title}</div>
                        <div className="qdetail">{h.detail}</div>
                        <div className="faint" style={{ fontSize: 10, marginTop: 2 }}>
                          {h.stat} · {h.mins ? `${h.mins} min · ` : ""}
                          {h.cadence === "weekday" ? "weekdays" : h.cadence === "weekend" ? "weekends" : "every day"}
                          {h.scale ? " · gets harder over time" : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </Win>
            ))}

            <Win title="Every day, whatever else">
              {ANCHORS.map((h) => {
                const on = a.habits.includes(h.key);
                return (
                  <div key={h.key} className="quest" data-done={on} onClick={() => toggleHabit(h.key)} role="checkbox" aria-checked={on} tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleHabit(h.key); } }}>
                    <div className="qbox" style={on ? { background: STAT_META[h.stat].color, borderColor: STAT_META[h.stat].color } : undefined}>
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#060a14" strokeWidth="3.4" strokeLinecap="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </div>
                    <div className="qbody"><div className="qtitle">{h.title}</div><div className="qdetail">{h.detail}</div></div>
                  </div>
                );
              })}
            </Win>
          </>
        )}

        {step === 3 && (
          <>
            <Win tone="accent" title="Your day">
              <div className="row">
                <label className="field"><span>Wake</span>
                  <input type="time" value={a.wake} onChange={(e) => set({ wake: e.target.value })} />
                </label>
                <label className="field"><span>Lights out</span>
                  <input type="time" value={a.sleep} onChange={(e) => set({ sleep: e.target.value })} />
                </label>
              </div>
              <p className="faint" style={{ marginBottom: 0, marginTop: 10 }}>
                Used to lay your quests into the hours you are actually awake, and to set the reminder times you can
                export to your phone's calendar.
              </p>
            </Win>

            <Win title="Training split">
              <p className="faint" style={{ marginTop: 0 }}>
                If you lift, this sets up a session per day with every set logged and the weight climbing on its own.
              </p>
              <div className="pill-row">
                {SPLITS.map((sp) => (
                  <button key={sp.key} className="pill" data-on={a.trainSplit === sp.key} onClick={() => set({ trainSplit: sp.key })}>
                    {sp.label}
                  </button>
                ))}
              </div>
            </Win>

            {(a.domains.includes("health") || a.domains.includes("fitness")) && (
              <Win title="Daily targets">
                <div className="row">
                  <label className="field"><span>Calories</span>
                    <input type="number" step="50" value={a.targets.kcal}
                      onChange={(e) => set({ targets: { ...a.targets, kcal: +e.target.value || 2200 } })} />
                  </label>
                  <label className="field"><span>Protein g</span>
                    <input type="number" step="5" value={a.targets.protein}
                      onChange={(e) => set({ targets: { ...a.targets, protein: +e.target.value || 140 } })} />
                  </label>
                  <label className="field"><span>Water L</span>
                    <input type="number" step="0.5" value={a.targets.water}
                      onChange={(e) => set({ targets: { ...a.targets, water: +e.target.value || 3 } })} />
                  </label>
                </div>
              </Win>
            )}
          </>
        )}

        {step === 4 && (
          <Win tone="accent" title="How hard should this be">
            <p className="faint" style={{ marginTop: 0 }}>
              This sets the bar a day has to clear and what falling short costs. It is not a label — it changes the
              arithmetic, and it re-grades everything you have logged. Start lower than you think.
            </p>
            {Object.values(DIFFICULTY).map((d) => {
              const on = a.difficulty === d.key;
              return (
                <div key={d.key} className="quest" data-done={on} onClick={() => set({ difficulty: d.key })} role="radio" aria-checked={on} tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); set({ difficulty: d.key }); } }}>
                  <div className="qbox" style={on ? { background: "var(--rune)", borderColor: "var(--rune)" } : undefined}>
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#060a14" strokeWidth="3.4" strokeLinecap="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                  <div className="qbody"><div className="qtitle">{d.label}</div><div className="qdetail">{d.blurb}</div></div>
                </div>
              );
            })}
          </Win>
        )}

        {step === 5 && (
          <>
            <Win tone="accent" title="Your system" right={`${preview.perDay} xp a day`}>
              <p className="faint" style={{ marginTop: 0 }}>
                {preview.count} quests on a weekday, {preview.weekend} at the weekend. Everyone's day is worth about the
                same — what you picked changes its shape, not its price, so nobody levels faster by adding more boxes.
              </p>
              <div style={{ marginTop: 12 }}>
                {Object.entries(preview.byStat).filter(([, v]) => v > 0).map(([st, v]) => (
                  <div key={st} style={{ marginBottom: 8 }}>
                    <div className="stat-line" style={{ marginBottom: 3 }}>
                      <div className="stat-key" style={{ color: STAT_META[st].color, width: "auto", flex: 1, fontSize: 12 }}>{st}</div>
                      <div className="stat-num" style={{ fontSize: 13 }}>{v} xp</div>
                    </div>
                    <div className="stat-bar">
                      <i style={{ width: `${(v / Math.max(1, preview.perDay)) * 100}%`, background: STAT_META[st].color }} />
                    </div>
                  </div>
                ))}
              </div>
            </Win>

            <Win title="Gates from your goals">
              {Object.entries(a.goals).filter(([, g]) => g?.text && g?.date).length === 0 ? (
                <div className="empty">No dated goals. You can add gates any time from the Gates tab.</div>
              ) : (
                Object.entries(a.goals).filter(([, g]) => g?.text && g?.date).map(([k, g]) => (
                  <div className="kv" key={k}><span>{g.text}</span><b className="faint">{g.date}</b></div>
                ))
              )}
            </Win>
          </>
        )}
      </div>

      <div className="mn-onboard-nav">
        {step > 0 && <button className="ghost" onClick={() => setStep(step - 1)}>Back</button>}
        <button className="solid none" style={{ marginLeft: "auto" }} disabled={!canAdvance} onClick={next}>
          {step === STEPS.length - 1 ? "Build my system" : "Continue"}
        </button>
      </div>
    </div>
  );
}
