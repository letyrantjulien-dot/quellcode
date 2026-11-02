// Offline test of the pipeline with small invented fixtures (no network).
import assert from 'node:assert/strict';
import * as P from './01-osm-pumps.mjs';
import * as K from './02-kiez-districts.mjs';
import * as F from './03-osm-fountains.mjs';

const osm = { elements: [
  { type: 'node', id: 1, lat: 52.54, lon: 13.41, tags: { man_made: 'water_well', pump: 'manual', ref: 'X 1', start_date: '1936' } },
  { type: 'way', id: 2, center: { lat: 52.50, lon: 13.42 }, tags: { man_made: 'water_well', pump: 'manual', 'addr:street': "O'Street" } },
  { type: 'node', id: 1, lat: 52.54, lon: 13.41, tags: {} },
] };
const pumps = P.toPumps(osm);
assert.equal(pumps.length, 2);
assert.equal(pumps[0].install_year, 1936);
assert.equal(pumps[1].osm_id, -2);
assert.match(P.toSql(pumps), /'O''Street'/);

const square = (n, x0, y0) => ({ type: 'Feature', properties: { nam: n + ' ' },
  geometry: { type: 'Polygon', coordinates: [[[x0, y0], [x0 + .1, y0], [x0 + .1, y0 + .1], [x0, y0 + .1], [x0, y0]]] } });
const geo = { features: [square('Nord', 13.35, 52.50), square('Süd', 13.35, 52.40)] };
const r = K.assign(pumps, geo);
assert.deepEqual(r.rows.map((x) => x.district), ['Nord', 'Nord']);
assert.equal(r.unmatched, 0);

const fountains = F.toFountains({ elements: [
  { type: 'node', id: 9, lat: 52.5, lon: 13.4, tags: { amenity: 'drinking_water', operator: 'Berliner Wasserbetriebe', seasonal: 'spring;summer', indoor: 'no' } },
] });
assert.equal(fountains[0].seasonal, true);
assert.equal(fountains[0].indoor, false);
assert.match(F.toSql(fountains), /Berliner Wasserbetriebe/);
console.log('pipeline test: all passed');
