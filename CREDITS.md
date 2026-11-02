# Credits

Quellcode stands on the shoulders of giants. Here is whose.

## Code shipped with the app (`vendor/`)

| What | Version | Licence | Link |
|---|---|---|---|
| MapLibre GL JS (map engine) | 4.7.1 | BSD-3-Clause, see `vendor/LICENSE-maplibre-gl.txt` | https://maplibre.org |
| supabase-js (database client) | 2.117.3 | MIT | https://github.com/supabase/supabase-js |
| bundled with it: auth-js, functions-js, postgrest-js, realtime-js, storage-js, phoenix (Supabase) | 2.117.3 / 0.4.5 | MIT | https://github.com/supabase |
| bundled with it: iceberg-js | 0.8.1 | MIT | https://www.npmjs.com/package/iceberg-js |
| bundled with it: tslib | 2.8.1 | 0BSD | https://github.com/microsoft/tslib |

The supabase-js bundle was built with esbuild (MIT, https://esbuild.github.io). All its licences are in full in `vendor/LICENSE-supabase-js-bundle.txt`.

## Typefaces (`fonts/`, self-hosted, never fetched from a font service)

| Typeface | Designer | Licence | Link |
|---|---|---|---|
| Space Grotesk | Florian Karsten | SIL Open Font License 1.1, see `fonts/OFL-SpaceGrotesk.txt` | https://github.com/floriankarsten/space-grotesk |
| IBM Plex Mono | IBM | SIL Open Font License 1.1, see `fonts/OFL-IBMPlexMono.txt` | https://github.com/IBM/plex |

The font files come from the Fontsource packages (MIT, https://fontsource.org). Street names on the map use Noto Sans (SIL Open Font License 1.1), served with the tiles by OpenFreeMap.

## Data

| What | Source | Licence |
|---|---|---|
| Pump and drinking fountain locations | © OpenStreetMap contributors, https://www.openstreetmap.org/copyright | ODbL 1.0 |
| Ortsteil boundaries (KIEZ-FUNK board) | ALKIS Berlin Ortsteile, Geodateninfrastruktur Berlin, https://gdi.berlin.de | Datenlizenz Deutschland Zero 2.0 |
| ECHO water facts | Written for Quellcode; each card links its own source | MIT with this repository (sources keep their own terms) |
| Photos and stories sent through the app | The community; they live in the database, not in this repository | CC BY-SA 4.0 |

## Services the app talks to

| Service | What for | Link |
|---|---|---|
| OpenFreeMap | Vector map tiles and glyphs (map schema © OpenMapTiles, BSD-3-Clause / CC BY 4.0; map data © OpenStreetMap contributors, ODbL) | https://openfreemap.org |
| CARTO basemaps | Fallback raster map when the vector tiles fail (© CARTO, map data © OpenStreetMap contributors) | https://carto.com/attributions |
| Supabase | Database, moderator sign-in and photo storage | https://supabase.com |
| MyMemory (Translated) | Machine translation drafts in the moderator room only, always reviewed by a person | https://mymemory.translated.net |
| Netlify | Hosting of the live app | https://www.netlify.com |

The data pipeline (`pipeline/`) also asks the Overpass API (https://overpass-api.de) for OpenStreetMap data, once, when it is run by hand.

## Tests

The smoketest runs on jsdom (MIT, https://github.com/jsdom/jsdom).

## Links out

The app's Signalquelle menu links to the InvisibleChaos hub and to a Ko-fi page (https://ko-fi.com/invisiblechaos) for anyone who wants to send support. Neither is used for data.
