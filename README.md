# Quellcode

**A community map of Berlin's hand water pumps.** Berlin has more than two thousand street pumps (Straßenbrunnen), built as emergency water supply. Nobody keeps a public record of which ones still give water. Quellcode is a map where anyone standing at a pump can check it, take its photo and leave a story about it.

Live app: https://quellcode-berlin.netlify.app · Version 1.45.0 · Five languages: German, English, French, Russian, Turkish.

It runs in any modern browser, phone first, and installs as a Progressive Web App (offline shell, cached map tiles of the areas you visited). Contributions only open when your phone says you are within 30 metres of the pump.

## What it does

- **The map.** About 2,000 pumps from OpenStreetMap, coloured by their last check: water, no water, missing, or still unchecked.
- **Check, photo, story.** On site, one tap reports the status. Photos are re-encoded in the browser before upload (max 1600 px), which strips EXIF and GPS data. Stories and photos are anonymous and wait for a moderator before they appear, shared under CC BY-SA 4.0.
- **KIEZ-FUNK.** Coverage per Ortsteil, built from the official ALKIS boundaries. It shows which neighbourhoods are checked and where broken pumps cluster.
- **ECHO.** The counter of unchecked pumps reads as a year: it started at 1968, and every first check of a pump opens the year below it, with one water fact for that year. The pump that opened a year gives it its face (its first photo). This repository carries three sample cards; the full archive lives in the app.
- **Time-lapse.** Inside ECHO, ZEITRAFFER replays the map's story: every checked pump flashes once, in the order it was first checked, while the year counts down. Pick a speed and a format (9:16, 16:9 or 1:1) and record a video on your own device, to share or save.
- **Journal, gallery, bearing.** Read all stories, browse all photos, or let the PEILUNG arrow lead you to the nearest unchecked pump.
- **Drinking fountains.** A separate layer of drinking fountains, telling the official Berliner Wasserbetriebe ones from the rest. Street pumps are not drinking water; the app says so.
- **Kontrollraum** (`admin.html`). The moderator room: review queues, translation drafts, and a printable report of broken pumps per district for the Bezirksamt.

## Run your own

1. **Database.** Create a Supabase project. In its SQL editor, run `db/schema.sql`, then `db/sample-data.sql` if you want test rows. In Authentication, create one moderator user and keep public sign-ups switched off: every signed-in user is a moderator.
2. **Configuration.** Copy `config.example.js` to `config.js` and fill in your project address and its publishable key. Never put a secret or service role key there.
3. **Deploy.** The app is a static folder with no build step. Upload it to any static host (Netlify, GitHub Pages, your own server). Keep `config.js` next to `index.html`.
4. **Pumps.** Run the pipeline (below) to load the pumps and fountains, or add your own.

### Data pipeline (`pipeline/`)

Three small Node scripts (Node 18 or later, no dependencies). Each writes a `.sql` file that the database owner pastes into the SQL editor, so no script ever needs a key.

| Step | Script | Source |
|---|---|---|
| 1 | `01-osm-pumps.mjs` writes `pumps.json` and `pumps.sql` | OpenStreetMap through the Overpass API (ODbL) |
| 2 | `02-kiez-districts.mjs` writes `districts.sql` | ALKIS Berlin Ortsteile, gdi.berlin.de (Datenlizenz Deutschland Zero 2.0) |
| 3 | `03-osm-fountains.mjs` writes `fountains.sql` | OpenStreetMap through the Overpass API (ODbL) |

These scripts are a clean reconstruction (November 2026) of one-off import tools that ran in July and August 2026 and were not kept. The OSM query may return a slightly different count from the first import. `node pipeline/test.mjs` checks them offline.

### Tests

`tests/smoketest.cjs` loads the app in jsdom with a stub database, opens every panel and guide in all five languages, and fails on any error. Run `npm install` then `npm test` in `tests/`.

## Privacy and legal

No accounts for visitors, no tracking, no ads. Progress and settings stay on the device. Contributions are anonymous; photos lose their metadata before upload.

Quellcode is an InvisibleChaos app. Legal notice, privacy and ethics live on the InvisibleChaos hub:
- Impressum: https://invisiblechaos.netlify.app/impressum.html
- Datenschutz: https://invisiblechaos.netlify.app/datenschutz.html
- Ethos: https://invisiblechaos.netlify.app/ethos.html

## Press

Berliner Zeitung, Open Source, 3 October 2026: [„Für den Notfall und mehr: Von Berlins Schwengelpumpen, einer Krähe und dem toten Klaus"](https://www.berliner-zeitung.de/article/fuer-den-notfall-und-mehr-von-berlins-schwengelpumpen-einer-kraehe-und-dem-toten-klaus-10444069)

As declared to the newsroom: „Dieser Text wurde mit Claude, einer KI von Anthropic, geschrieben. Recherche, Daten und Thesen stammen vom Autor, der alle Angaben geprüft hat." (This text was written with Claude, an AI by Anthropic. The research, data and arguments are the author's, who checked every fact.)

## Licence and credits

Code: MIT, © 2026 Julien Le Tyrant / InvisibleChaos (see `LICENSE`). Libraries, typefaces, data and services keep their own licences: see `CREDITS.md`.

## How it was made

Built with AI assistance (Claude, by Anthropic). Every file is reviewed, credited and maintained by a person, and this repository is the maintained home of Quellcode, not a dump.

Written by Julien and Claude the AI
