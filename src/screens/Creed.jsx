import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Win } from "../ui.jsx";
import { CREED_THEMES, creedDeck, themeFromState } from "../creed.js";
import { canStoreClips, listClips, putClip, removeClip, clipUrl, storageUse, persistStorage, prettyBytes } from "../lib/media.js";
import { burst, ring, floater, lastPoint, fxOn } from "../fx.js";

/* ===================================================================
   Creed — the screen you open when the board is not the problem.

   Two halves, and they are deliberately different in kind.

   The line is generated. It comes from creed.js, it is deterministic on
   the date so it does not reshuffle under you mid-read, and the theme it
   opens on is inferred from your own board — a broken streak gets a
   different sentence than a clean fortnight.

   The shelf is yours. Speech clips come from two places: files dropped
   into `public/speeches/` and listed in its manifest, which ship with the
   build; and files you add on the device, which live in IndexedDB. The
   screen does not care which is which except when it has to tell you the
   truth about backups.

   One thing this screen deliberately does not do: award XP. A day's price
   is fixed by generate.js so that everybody's day is worth the same, and
   handing out experience for watching a video would break that invariant
   from the outside. Watching is tracked, and counted, and worth nothing to
   your level. That is the honest arrangement.
   =================================================================== */

const MANIFEST = "speeches/manifest.json";

function isAudio(type = "") {
  return String(type).startsWith("audio");
}

/* ---------- the line ---------- */

/** Word-by-word reveal. Split here so the CSS only has to count. */
function Line({ text }) {
  const words = String(text || "").split(" ");
  return (
    <p className="creed-line" key={text}>
      {words.map((w, i) => (
        <span key={`${i}-${w}`} style={{ "--i": Math.min(i, 40) }}>
          {w}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </p>
  );
}

function TheLine({ state, todayKey, pinned, onPin, flash }) {
  const suggested = themeFromState(state, todayKey);
  const [n, setN] = useState(0);

  /* The board's suggestion holds until you choose for yourself, and then
     your choice holds. Stored as null-or-a-choice rather than as a theme
     plus a "have they touched it" flag, so the two can never disagree —
     and derived during render, so a board that changes underneath an
     untouched screen still moves the suggestion. */
  const [choice, setChoice] = useState(null);
  const theme = choice ? choice.theme : suggested;
  const touched = choice !== null;

  const deck = useMemo(() => creedDeck(todayKey, theme), [todayKey, theme]);
  const entry = deck[((n % deck.length) + deck.length) % deck.length];
  const isPinned = pinned.includes(entry.text);

  const next = () => {
    setN((v) => v + 1);
    if (fxOn()) {
      const el = document.querySelector(".creed-card");
      const r = el?.getBoundingClientRect();
      if (r) ring(r.left + r.width / 2, r.top + r.height / 2, { from: 8, to: Math.max(r.width, 140) / 1.6, life: 0.5, width: 1.5, alpha: 0.5 });
    }
  };

  const pick = (id) => {
    setChoice({ theme: id === theme ? null : id });
    setN(0);
  };

  const themeMeta = CREED_THEMES.find((t) => t.id === theme);

  return (
    <Win title="The line" right={theme ? themeMeta?.label : "all"}>
      <div className="creed-card" data-theme={theme || "all"}>
        <span className="creed-mark" aria-hidden="true">&ldquo;</span>
        <Line text={entry.text} />
        <div className="creed-card-foot">
          <span className="creed-tag">{CREED_THEMES.find((t) => t.id === entry.theme)?.label}</span>
        </div>
      </div>

      {suggested && !touched && (
        <p className="faint creed-why">
          Opened on <b>{CREED_THEMES.find((t) => t.id === suggested)?.label.toLowerCase()}</b> because of where your board
          stands today. Pick another and it stays where you put it.
        </p>
      )}

      <div className="pill-row creed-themes">
        {CREED_THEMES.map((t) => (
          <button key={t.id} className="pill" data-on={theme === t.id} onClick={() => pick(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {themeMeta && <p className="faint creed-hint">{themeMeta.hint}</p>}

      <div className="row creed-actions">
        <button className="solid" onClick={next}>Next line</button>
        <button
          className="ghost"
          onClick={() => {
            onPin(entry.text);
            if (!isPinned) {
              floater(lastPoint.x || window.innerWidth / 2, lastPoint.y || 200, "Kept", { color: "#ffc24b" });
              burst(lastPoint.x, lastPoint.y, { count: 12, color: "#ffc24b", speed: 190, life: 0.6 });
            }
            flash?.(isPinned ? "Unpinned" : "Kept");
          }}
        >
          {isPinned ? "Unpin" : "Keep this"}
        </button>
      </div>
    </Win>
  );
}

/* ---------- the player ---------- */

function Player({ clip, watched, onWatched, onClose }) {
  const [src, setSrc] = useState(clip.url || null);
  const [failed, setFailed] = useState(false);
  const credited = useRef(false);

  /* A local clip is a blob in IndexedDB; a shipped one is just a path.
     The object URL is revoked on the way out — leaving it live pins the
     entire video in memory for as long as the tab is open.

     Nothing here resets state for a new clip, because the shelf keys this
     component on the clip id: a different clip is a different player, with
     a fresh `credited` and no chance of crediting the new one for the
     progress of the old. */
  useEffect(() => {
    if (clip.url) return undefined;

    let alive = true;
    let revoke = null;
    clipUrl(clip.id).then((r) => {
      if (!alive) { r?.revoke(); return; }
      if (r) { revoke = r.revoke; setSrc(r.url); }
      else setFailed(true);
    });
    return () => { alive = false; revoke?.(); };
  }, [clip.id, clip.url]);

  const credit = useCallback(() => {
    if (credited.current) return;
    credited.current = true;
    onWatched(clip);
  }, [clip, onWatched]);

  const Tag = isAudio(clip.type) ? "audio" : "video";

  return (
    <div className="creed-player mn-rise">
      <div className="creed-player-frame">
        {failed ? (
          <div className="empty" style={{ margin: 0 }}>
            That file could not be opened. It may have been added on another device, or removed.
          </div>
        ) : (
          src && (
            <Tag
              key={src}
              className="creed-video"
              src={src}
              poster={clip.poster || undefined}
              controls
              playsInline
              preload="metadata"
              onEnded={credit}
              onTimeUpdate={(e) => {
                /* Counted at four fifths, not at the end. Nobody watches
                   the closing three seconds of a speech. */
                const el = e.currentTarget;
                if (el.duration && el.currentTime / el.duration > 0.8) credit();
              }}
              onError={() => setFailed(true)}
            />
          )
        )}
      </div>

      <div className="creed-player-meta">
        <div>
          <div className="creed-clip-name">{clip.name}</div>
          <div className="faint" style={{ fontSize: 11 }}>
            {clip.speaker || (clip.shipped ? "Bundled with the app" : "On this device")}
            {watched?.count ? ` · watched ${watched.count}${watched.count === 1 ? " time" : " times"}` : ""}
          </div>
        </div>
        <button className="ghost" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

/* ---------- the shelf ---------- */

function Shelf({ creed, onWatched, flash }) {
  const [shipped, setShipped] = useState([]);
  const [local, setLocal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(null);
  const [use, setUse] = useState(null);
  const [note, setNote] = useState("");
  const fileRef = useRef(null);

  const refreshLocal = useCallback(async () => {
    const rows = await listClips();
    setLocal(rows.map((r) => ({ ...r, shipped: false })));
    setUse(await storageUse());
  }, []);

  /* The manifest is optional by design. No file, a 404 or a syntax error
     all mean the same thing — there are no bundled clips — and none of
     them should look like a broken screen. */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(MANIFEST, { cache: "no-cache" });
        if (res.ok) {
          const json = await res.json();
          const rows = (Array.isArray(json) ? json : json.clips || [])
            .filter((c) => c && c.file)
            .map((c, i) => ({
              id: c.id || `m${i}`,
              name: c.name || c.file,
              speaker: c.speaker || "",
              type: c.type || (/\.(mp3|m4a|aac|ogg|wav)$/i.test(c.file) ? "audio/mpeg" : "video/mp4"),
              secs: c.secs || 0,
              poster: c.poster ? `speeches/${c.poster}` : "",
              url: `speeches/${c.file}`,
              shipped: true,
            }));
          if (alive) setShipped(rows);
        }
      } catch {
        /* no manifest; the shelf is whatever is on the device */
      }
      await refreshLocal();
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, [refreshLocal]);

  const add = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;

    setNote(`Adding ${files.length} file${files.length === 1 ? "" : "s"}…`);
    await persistStorage();

    let ok = 0;
    for (const f of files) {
      const saved = await putClip(f);
      if (saved) ok++;
    }
    await refreshLocal();
    setNote(
      ok === files.length
        ? `Added ${ok}. They stay on this device and work offline.`
        : `Added ${ok} of ${files.length}. The rest were refused, most likely for space.`
    );
    flash?.(`${ok} added`);
  };

  const drop = async (clip) => {
    if (!confirm(`Remove "${clip.name}" from this device? The file itself is untouched.`)) return;
    await removeClip(clip.id);
    if (playing?.id === clip.id) setPlaying(null);
    await refreshLocal();
    setNote("Removed.");
  };

  const clips = [...shipped, ...local];
  const watchedTotal = Object.values(creed.watched || {}).reduce((a, w) => a + (w.count || 0), 0);

  return (
    <Win title="Speeches" right={clips.length ? `${clips.length} on the shelf` : undefined}>
      {playing && (
        <Player
          key={playing.id}
          clip={playing}
          watched={creed.watched?.[playing.id]}
          onWatched={onWatched}
          onClose={() => setPlaying(null)}
        />
      )}

      {loading && <div className="empty">Reading the shelf…</div>}

      {!loading && clips.length === 0 && (
        <div className="creed-empty">
          <p style={{ marginTop: 0 }}>Nothing on the shelf yet. There are two ways to fill it.</p>
          <ol className="creed-steps">
            <li>
              <b>Add from this device.</b> Pick video or audio files below. They are stored on the phone and play with
              the network off.
            </li>
            <li>
              <b>Ship them with the app.</b> Drop files into <code>public/speeches/</code> and list them in{" "}
              <code>public/speeches/manifest.json</code>. Those arrive for every profile on this build.
            </li>
          </ol>
        </div>
      )}

      {!loading && clips.length > 0 && (
        <div className="creed-shelf">
          {clips.map((c) => {
            const w = creed.watched?.[c.id];
            const on = playing?.id === c.id;
            return (
              <div className="creed-clip" key={c.id} data-on={on} data-fx-tap="">
                <button className="creed-clip-hit" onClick={() => setPlaying(on ? null : c)}>
                  <span className="creed-clip-play" aria-hidden="true">
                    {on ? (
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                        <rect x="6" y="5" width="4" height="14" rx="1" />
                        <rect x="14" y="5" width="4" height="14" rx="1" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                        <path d="M8 5.5v13l11-6.5z" />
                      </svg>
                    )}
                  </span>
                  <span className="creed-clip-body">
                    <span className="creed-clip-name">{c.name}</span>
                    <span className="creed-clip-sub">
                      {c.speaker || (c.shipped ? "bundled" : "on this device")}
                      {isAudio(c.type) ? " · audio" : ""}
                      {c.size ? ` · ${prettyBytes(c.size)}` : ""}
                      {w?.count ? ` · ${w.count}×` : ""}
                    </span>
                  </span>
                </button>
                {!c.shipped && (
                  <button className="ghost creed-clip-x" onClick={() => drop(c)} aria-label={`Remove ${c.name}`}>
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="row creed-actions">
        <button className="solid" disabled={!canStoreClips} onClick={() => fileRef.current?.click()}>
          Add files
        </button>
        {watchedTotal > 0 && (
          <span className="faint" style={{ fontSize: 11, alignSelf: "center" }}>
            {watchedTotal} played through
          </span>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="video/*,audio/*"
        multiple
        style={{ display: "none" }}
        onChange={add}
      />

      {note && <p className="faint" style={{ margin: "8px 0 0", color: "var(--gold)" }}>{note}</p>}

      {!canStoreClips && (
        <p className="faint" style={{ marginBottom: 0 }}>
          This browser will not let the app store files, so only clips bundled with the build will appear here.
        </p>
      )}

      <p className="faint creed-caveat">
        Clips you add are <b>not in the JSON backup</b> — an export stays a small text file you can email yourself.
        What you watched and when is in the backup; the files you re-add.
        {use ? ` Roughly ${prettyBytes(use.used)} used of ${prettyBytes(use.quota)} available.` : ""}
      </p>
    </Win>
  );
}

/* ---------- kept lines ---------- */

function Kept({ pinned, onPin }) {
  if (!pinned.length) return null;
  return (
    <Win title="Kept" right={`${pinned.length}`}>
      <div className="creed-kept">
        {pinned.map((text) => (
          <div className="kv creed-kept-row" key={text}>
            <span>{text}</span>
            <button className="ghost" onClick={() => onPin(text)} aria-label="Remove">×</button>
          </div>
        ))}
      </div>
    </Win>
  );
}

/* ---------- screen ---------- */

export default function Creed(props) {
  const { state, todayKey, onCreedWatch, onCreedPin, flash } = props;
  const creed = state.creed || { watched: {}, pinned: [] };
  const pinned = Array.isArray(creed.pinned) ? creed.pinned : [];

  const onWatched = useCallback(
    (clip) => {
      onCreedWatch?.(clip.id, clip.name);
      flash?.("Played through");
      if (fxOn()) {
        ring(window.innerWidth / 2, window.innerHeight * 0.4, { from: 10, to: 180, life: 0.7, width: 2, color: "#ffc24b", alpha: 0.5 });
      }
    },
    [onCreedWatch, flash]
  );

  return (
    <>
      <TheLine state={state} todayKey={todayKey} pinned={pinned} onPin={onCreedPin} flash={flash} />
      <Shelf creed={creed} onWatched={onWatched} flash={flash} />
      <Kept pinned={pinned} onPin={onCreedPin} />
    </>
  );
}
