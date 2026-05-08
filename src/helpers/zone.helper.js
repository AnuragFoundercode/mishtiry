/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg) => deg * (Math.PI / 180);

/**
 * Check if coordinates are within any active zone
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {Array} zones - Array of zone objects with center_lat, center_lng, radius_km
 * @returns {Object|null} - Matching zone or null
 */
const findZoneByCoordinates = (lat, lng, zones) => {
  for (const zone of zones) {
    const distance = calculateDistance(lat, lng, zone.center_lat, zone.center_lng);
    if (distance <= zone.radius_km) {
      return zone;
    }
  }
  return null;
};

module.exports = { calculateDistance, findZoneByCoordinates };
