/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import { degreesToRadians } from "@turf/helpers";

import { numDecimalDigits } from "./number";

/**
 * Estimates the accuracy (in meters) for a set of latitude and longitude passed in as strings,
 * assuming they were formatted with the number of digits calculated by {@link getNumDecimalDigits}.
 * @see https://en.wikipedia.org/wiki/Decimal_degrees
 */
export function getCoordinateAccuracy(
  latitude: string,
  longitude: string,
): number {
  const latitudeRadians = degreesToRadians(Number(latitude));
  const longitudeNumDecimalDigits = numDecimalDigits(longitude);

  return Math.round(
    (111_000 * Math.cos(latitudeRadians)) /
      Math.pow(10, longitudeNumDecimalDigits),
  );
}

/**
 * Calculates the number of digits to round coordinates to for a given accuracy (in meters), based on the latitude.
 * The accuracy can then be estimated using {@link getCoordinateAccuracy}.
 * It's also used to format coordinates for API calls, increasing the chances for re-using cached responses.
 *
 * Capped at 4 digits as the practical limit the APIs accept (4.35~11.1 meter accuracy).
 * @see https://en.wikipedia.org/wiki/Decimal_degrees
 */
export function getNumDecimalDigits(
  latitude: number,
  accuracy: number,
): number {
  const latitudeRadians = degreesToRadians(latitude);
  const numDigits = Math.log10(
    (111_000 * Math.cos(latitudeRadians)) / accuracy,
  );

  // Round (originally floor was selected but in some cases it may be worth overestimating accuracy slightly).
  // Max it to prevent negative responses near 90º.
  // Min it to cap it at 4 digits per API requirements (practical limits of GPS and our use-case).
  return Math.min(Math.max(0, Math.round(numDigits)), 4);
}
