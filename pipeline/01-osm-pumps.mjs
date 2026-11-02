// Step 1 · Berlin street pumps (Straßenbrunnen) from OpenStreetMap.
//
// Reconstruction (2026-11). The first import ran once in July 2026 from a
// one-off browser page that was not kept; this script does the same job in
// the open. Its query may not return exactly the same count as that import.
//
// Output: pumps.json (for step 2) and pumps.sql (paste into the SQL editor).
// No key is needed: the SQL is run by a person who owns the database.
// Data: (c) OpenStreetMap contributors, ODbL 1.0. Credit it wherever you use it.
//
// Usage: node 01-osm-pumps.mjs [out-dir]
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { overpass, point, osmKey, sqlText, sqlNum } from './lib.mjs';

export const QUERY = `[out:json][timeout:180];
area["boundary"="administrative"]["admin_level"="4"]["name"="Berlin"]->.berlin;
nwr["man_made"="water_well"]["pump"~"^(manual|yes)$"](area.berlin);
out center tags;`;

export function toPumps(json) {
  const seen = new Set();
  const out = [];
  for (const el of json.elements || []) {
    const p = point(el);
    const key = osmKey(el);
    if (!p || seen.has(key)) continue;
    seen.add(key);
    const t = el.tags || {};
    out.push({
      osm_id: key, lat: p.lat, lng: p.lng,
      ref: t.ref || null,
      model: t['pump:type'] || t.model || null,
      install_year: /^\d{4}$/.test(t.start_date || '') ? +t.start_date : null,
      address: [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' ') || null,
    });
  }
  return out;
}

export function toSql(pumps) {
  const rows = pumps.map((p) => `(${p.osm_id}, ${p.lat}, ${p.lng}, ${sqlText(p.ref)}, ${sqlText(p.model)}, ${sqlNum(p.install_year)}, ${sqlText(p.address)})`);
  return `-- Quellcode pumps from OpenStreetMap (ODbL). ${pumps.length} rows.\n` +
    `insert into pumps (osm_id, lat, lng, ref, model, install_year, address) values\n` +
    rows.join(',\n') + `\non conflict (osm_id) do nothing;\n\nselect count(*) from pumps;\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = process.argv[2] || '.';
  const pumps = toPumps(await overpass(QUERY));
  writeFileSync(join(dir, 'pumps.json'), JSON.stringify(pumps));
  writeFileSync(join(dir, 'pumps.sql'), toSql(pumps));
  console.log(`${pumps.length} pumps written to pumps.json and pumps.sql`);
}
