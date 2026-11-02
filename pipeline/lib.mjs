// Shared helpers for the Quellcode data pipeline. No dependencies (Node 18+).
export const OVERPASS = process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter';
export const UA = 'Quellcode data pipeline (InvisibleChaos, open source)';

export async function overpass(query) {
  const res = await fetch(OVERPASS, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': UA },
    body: 'data=' + encodeURIComponent(query),
  });
  if (!res.ok) throw new Error('Overpass answered ' + res.status);
  return res.json();
}

// Nodes carry lat/lon; ways and relations carry a center (out center).
export function point(el) {
  if (el.lat != null) return { lat: el.lat, lng: el.lon };
  if (el.center) return { lat: el.center.lat, lng: el.center.lon };
  return null;
}

// OSM ids are unique per type only; nodes keep their id, ways and
// relations get a sign/offset so they can share one bigint column.
export function osmKey(el) {
  if (el.type === 'node') return el.id;
  if (el.type === 'way') return -el.id;
  return -(1e12 + el.id);
}

export const sqlText = (v) => v == null || v === '' ? 'null' : "'" + String(v).replace(/'/g, "''") + "'";
export const sqlNum = (v) => v == null || !Number.isFinite(+v) ? 'null' : String(+v);
export const sqlBool = (v) => v == null ? 'null' : (v ? 'true' : 'false');

// Ray casting point-in-polygon on GeoJSON rings ([lng, lat]).
export function inRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
export function inGeometry(lng, lat, g) {
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  return polys.some(([outer, ...holes]) => inRing(lng, lat, outer) && !holes.some((h) => inRing(lng, lat, h)));
}
