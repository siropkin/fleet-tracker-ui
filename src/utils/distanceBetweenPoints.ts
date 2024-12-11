import { distanceConverter } from '@utils/distanceConverter';

// Earth's radius in kilometers
const EARTH_RADIUS = 6371;

const degreesToRadians = (deg: number) => deg * (Math.PI / 180);

export const distanceBetweenPoints = (point1, point2, units: string = 'NM') => {
  // Convert the differences in coordinates from degrees to radians
  const latDiff = degreesToRadians(point2.lat - point1.lat);
  const lonDiff = degreesToRadians(point2.lon - point1.lon);

  // Use the haversine formula to calculate the great circle distance
  const a =
    Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
    Math.cos((point1.lat * Math.PI) / 180) *
      Math.cos((point2.lat * Math.PI) / 180) *
      Math.sin(lonDiff / 2) *
      Math.sin(lonDiff / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Calculate the distance
  const distance = EARTH_RADIUS * c;
  return distanceConverter(distance, units);
};
