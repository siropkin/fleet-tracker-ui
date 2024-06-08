export const distanceConverter = (distance: number, units: string = 'NM') => {
  switch (units) {
    case 'KM':
      return distance;
    case 'M':
      return distance * 0.621371192;
    default:
    case 'NM':
      return distance * 0.539956803;
  }
};
