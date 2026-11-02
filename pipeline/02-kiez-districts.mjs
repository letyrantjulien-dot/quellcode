// Step 2 · Give each pump its Ortsteil (Kiez) for the KIEZ-FUNK board.
//
// Reconstruction (2026-11) of the July 2026 backfill tool. Boundaries:
// "ALKIS Berlin Ortsteile" from the Berlin geodata infrastructure
// (gdi.berlin.de), licence Datenlizenz Deutschland Zero 2.0.
// Each pump is tested against the polygons (point in polygon, holes included).
//
// Input: pumps.json from step 1. Output: districts.sql (paste into the editor).
// Usage: node 02-kiez-districts.mjs [pumps.json] [out-dir]
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { UA, sqlText, inGeometry } from './lib.mjs';

export const WFS = process.env.ALKIS_WFS || 'https://gdi.berlin.de/services/wfs/alkis_ortsteile';

async function featureType() {
  const xml = await (await fetch(`${WFS}?service=WFS&request=GetCapabilities`, { headers: { 'user-agent': UA } })).text();
  const m = xml.match(/<(?:wfs:)?Name>([^<]+)<\/(?:wfs:)?Name>/);
  if (!m) throw new Error('No feature type in the WFS capabilities');
  return m[1];
}

export async function loadOrtsteile() {
  const type = await featureType();
  const url = `${WFS}?service=WFS&version=2.0.0&request=GetFeature&typeNames=${encodeURIComponent(type)}` +
    `&outputFormat=application/json&srsName=EPSG:4326`;
  const res = await fetch(url, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error('WFS answered ' + res.status);
  return res.json();
}

// The Ortsteil name sits in "nam" in the ALKIS layer; fall back to common names.
const nameOf = (f) => f.properties.nam ?? f.properties.name ?? f.properties.ortsteil ?? null;

export function assign(pumps, geojson) {
  const out = [];
  let unmatched = 0;
  for (const p of pumps) {
    const f = geojson.features.find((x) => x.geometry && inGeometry(p.lng, p.lat, x.geometry));
    if (!f) { unmatched++; continue; }
    out.push({ osm_id: p.osm_id, district: String(nameOf(f)).trim() });
  }
  return { rows: out, unmatched };
}

export function toSql({ rows, unmatched }) {
  return `-- Ortsteile from ALKIS Berlin (dl-de/zero-2.0). ${rows.length} pumps placed, ${unmatched} outside every polygon.\n` +
    rows.map((r) => `update pumps set district = ${sqlText(r.district)} where osm_id = ${r.osm_id};`).join('\n') +
    `\n\nselect district, count(*) from pumps group by 1 order by 2 desc;\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const pumps = JSON.parse(readFileSync(process.argv[2] || 'pumps.json', 'utf8'));
  const result = assign(pumps, await loadOrtsteile());
  writeFileSync(join(process.argv[3] || '.', 'districts.sql'), toSql(result));
  console.log(`${result.rows.length} pumps placed, ${result.unmatched} unmatched -> districts.sql`);
}
