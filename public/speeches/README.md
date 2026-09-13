# Speeches that ship with the build

Anything listed here appears on the Creed tab for **every profile on this build**, on every
device it is installed to. This is the right place for the handful of clips that are worth
carrying everywhere.

Files added from inside the app instead (Creed → *Add files*) live in IndexedDB on that one
device. Those are the right place for everything else — they cost the build nothing and they do
not have to be downloaded by anyone who never watches them.

## Adding one

1. Drop the file in this folder. `.mp4` and `.webm` for video, `.mp3` / `.m4a` for audio.
2. Add an entry to `manifest.json`.

```json
{
  "clips": [
    {
      "id": "first-hour",
      "name": "The first hour decides the day",
      "speaker": "Notes to self",
      "file": "first-hour.mp4",
      "poster": "first-hour.jpg",
      "secs": 214
    }
  ]
}
```

| field | required | what it is |
|---|---|---|
| `id` | yes | Permanent. The watch count is keyed on it — changing one orphans that history, exactly like a habit key. |
| `name` | yes | What shows on the shelf. |
| `file` | yes | Filename inside this folder. Nothing else in the path. |
| `speaker` | no | Second line on the row. |
| `poster` | no | A still, also in this folder, shown before play. |
| `secs` | no | Length, if you know it. |
| `type` | no | Only needed if the extension is unusual. Anything starting `audio` renders an audio player. |

An empty `clips` array, a missing file, or invalid JSON all mean the same thing to the app —
there are no bundled clips — and none of them show as an error.

## Two things worth knowing before you add a lot

**Size.** Every file here is downloaded as part of the app on a device that installs it, and it
sits in the repo and in every deploy. A 300MB folder is a 300MB app. Past three or four short
clips, add them from inside the app instead.

**Caching.** These are *not* precached with the app shell — that would block the install on
hundreds of megabytes. They are cached the first time each one plays (see `runtimeCaching` in
`vite.config.js`), so a clip works offline after it has been watched once, and not before.

## Copyright

A downloaded speech is somebody's work. Files kept on your own device for your own use are your
business. Committing one to this folder puts a copy into every deploy of this app, which is
publishing it — so put a clip here only if it is yours, licensed, or public domain. Everything
the app ships with in text form (`src/creed.js`) was written for it for exactly this reason.
