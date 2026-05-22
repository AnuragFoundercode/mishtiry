/**
 * Check if a point (lat, lng) is inside a polygon
 * Uses ray casting algorithm
 */
const isPointInPolygon = (lat, lng, coordinates) => {
  let inside = false;
  for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
    const xi = coordinates[i].lng;  // x = longitude
    const yi = coordinates[i].lat;  // y = latitude
    const xj = coordinates[j].lng;
    const yj = coordinates[j].lat;

    const intersect = ((yi > lat) !== (yj > lat))
      && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

/**
 * Get all zones that contain a given location
 */
const getZonesForLocation = async (lat, lng, Zone) => {
  const zones = await Zone.findAll({ where: { is_active: true } });
  return zones.filter(zone => isPointInPolygon(lat, lng, zone.coordinates));
};

/**
 * Find first zone that contains the given coordinates from a pre-fetched list
 */
const findZoneByCoordinates = (lat, lng, zones) => {
  return zones.find(zone =>
    Array.isArray(zone.coordinates) && zone.coordinates.length >= 3
      ? isPointInPolygon(lat, lng, zone.coordinates)
      : false
  ) || null;
};

module.exports = { isPointInPolygon, getZonesForLocation, findZoneByCoordinates };
