// Step 3 · Drinking fountains (Trinkbrunnen) for the separate layer.
//
// Reconstruction (2026-11) of the August 2026 fountain import. Keeps the
// operator (Berliner Wasserbetriebe = official drinking water) and the
// seasonal and indoor flags. Data: (c) OpenStreetMap contributors, ODbL 1.0.
//
// Output: fountains.sql (paste into the SQL editor).
// Usage: node 03-osm-fountains.mjs [out-dir]
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { overpass, point, osmKey, sqlText, sqlBool } from './lib.mjs';

export const QUERY = `[out:json][timeout:180];
area["boundary"="administrative"]["admin_level"="4"]["name"="Berlin"]->.berlin;
nwr["amenity"="drinking_water"](area.berlin);
out center tags;`;

const yesNo = (v) => v === 'yes' ? true : v === 'no' ? false : null;

export function toFountains(json) {
  const out = [];
  for (const el of json.elements || []) {
    const p = point(el);
    if (!p) continue;
    const t = el.tags || {};
    out.push({
      osm_id: osmKey(el), lat: p.lat, lng: p.lng,
      name: t.name || null, operator: t.operator || null,
      seasonal: t.seasonal ? t.seasonal !== 'no' : null,
      indoor: yesNo(t.indoor),
    });
  }
  return out;
}

export function toSql(rows) {
  return `-- Quellcode drinking fountains from OpenStreetMap (ODbL). ${rows.length} rows.\n` +
    `insert into fountains (osm_id, lat, lng, name, operator, seasonal, indoor) values\n` +
    rows.map((f) => `(${f.osm_id}, ${f.lat}, ${f.lng}, ${sqlText(f.name)}, ${sqlText(f.operator)}, ${sqlBool(f.seasonal)}, ${sqlBool(f.indoor)})`).join(',\n') +
    `\non conflict (osm_id) do nothing;\n\nselect count(*) from fountains;\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const rows = toFountains(await overpass(QUERY));
  writeFileSync(join(process.argv[2] || '.', 'fountains.sql'), toSql(rows));
  console.log(`${rows.length} fountains written to fountains.sql`);
}
