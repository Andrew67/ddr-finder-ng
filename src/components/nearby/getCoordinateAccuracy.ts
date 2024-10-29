function degToRad(degrees: number) {
  return degrees * (Math.PI / 180);
}

/**
 * Estimates the accuracy (in meters) for a set of latitude and longitude passed in as strings,
 * assuming they were formatted with the number of digits calculated by {@link getNumDecimalDigits}.
 * @see https://en.wikipedia.org/wiki/Decimal_degrees
 */
export function getCoordinateAccuracy(
  latitude: string,
  longitude: string,
): number {
  const latitudeRadians = degToRad(Number(latitude));
  const longitudeNumDecimalDigits = longitude.includes(".")
    ? longitude.split(".")[1].length
    : 1;

  return (
    (111_000 * Math.cos(latitudeRadians)) /
    Math.pow(10, longitudeNumDecimalDigits)
  );
}

/**
 * Calculates the number of digits to round coordinates to for a given accuracy (in meters), based on the latitude.
 * The accuracy can then be estimated using {@link getCoordinateAccuracy}.
 * It's also used to format coordinates for API calls, increasing the chances for re-using cached responses.
 * @see https://en.wikipedia.org/wiki/Decimal_degrees
 */
export function getNumDecimalDigits(
  latitude: number,
  accuracy: number,
): number {
  const latitudeRadians = degToRad(latitude);
  const numDigits = Math.log10(
    (111_000 * Math.cos(latitudeRadians)) / accuracy,
  );
  // Floor it to prevent overestimating accuracy later, and max it to prevent negative responses near 90º
  return Math.max(0, Math.floor(numDigits));
}
