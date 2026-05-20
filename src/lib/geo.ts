// Approximate bounding box for Romorantin-Lanthenay (Loir-et-Cher, France)
// Center ~ 47.3573°N, 1.7415°E
export const ROMORANTIN_BBOX = {
  minLat: 47.30,
  maxLat: 47.41,
  minLng: 1.68,
  maxLng: 1.82,
};

export const ROMORANTIN_CENTER = { lat: 47.3573, lng: 1.7415 };

export function isInRomorantin(lat: number, lng: number): boolean {
  return (
    lat >= ROMORANTIN_BBOX.minLat &&
    lat <= ROMORANTIN_BBOX.maxLat &&
    lng >= ROMORANTIN_BBOX.minLng &&
    lng <= ROMORANTIN_BBOX.maxLng
  );
}

// Haversine distance in meters
export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
