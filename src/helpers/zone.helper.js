/**
 * Check if a point (lat, lng) is inside a polygon
 * Uses ray casting algorithm
 */
const isPointInPolygon = (lat, lng, coordinates) => {
  let inside = false;
  for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
    const xi = coordinates[i].lat;
    const yi = coordinates[i].lng;
    const xj = coordinates[j].lat;
    const yj = coordinates[j].lng;

    const intersect = ((yi > lng) !== (yj > lng))
      && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
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

module.exports = { isPointInPolygon, getZonesForLocation };
