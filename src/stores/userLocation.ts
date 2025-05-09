/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import { atom } from "nanostores";
import { $router } from "./router";
import {
  getCoordinateAccuracy,
  getNumDecimalDigits,
} from "../utils/getCoordinateAccuracy";
import { getCurrentPosition } from "@/utils/getCurrentPosition";
import { numDecimalDigits } from "@/utils/number";
import { redirectPage } from "@nanostores/router";

export type UserLocation = {
  latitude: string;
  longitude: string;
  accuracyMeters: number;
};

/**
 * User location can be fed either through the geolocation API or the router, hence this degree of indirection.
 * On the "nearby" page, this feeds into the URL and gets used for the API call.
 * On the "explore" page, this feeds into the distance information shown when looking at location details.
 */
export const $userLocation = atom<UserLocation | null>(null);

/**
 * Set to `true` when {@link getLocationFromGps}'s call into GPS hardware is running.
 */
export const $userLocationLoading = atom<boolean>(false);

/**
 * Non-zero value if {@link getLocationFromGps} fails.
 */
export const $userLocationError = atom<GeolocationPositionError["code"]>(0);

// Populates the location on the nearby page using the URL parameters when changed
$router.subscribe((page) => {
  // On the "explore" page, the parameters feed into `$mapLocation` instead
  if (page?.route !== "nearby") return;

  const ll = page?.search["ll"];
  if (!ll) return;

  // Input validation: both latitude and longitude provided
  let [latitude, longitude] = ll.split(",");
  if (!latitude || !longitude) return;

  // Input validation: numeric inputs provided
  const latitudeNumeric = Number(latitude);
  const longitudeNumeric = Number(longitude);
  if (isNaN(latitudeNumeric) || isNaN(longitudeNumeric)) return;

  // Input validation: latitude between +/- 90 and longitude between +/- 180
  if (latitudeNumeric < -90 || latitudeNumeric > 90) return;
  if (longitudeNumeric < -180 || longitudeNumeric > 180) return;

  // Compatibility: trim decimal digits if they exceed 4
  const latitudeNumDigits = numDecimalDigits(latitude);
  const longitudeNumDigits = numDecimalDigits(longitude);
  if (latitudeNumDigits > 4) latitude = latitudeNumeric.toFixed(4);
  if (longitudeNumDigits > 4) longitude = longitudeNumeric.toFixed(4);

  // If this is already our current location, don't reset it, we have better accuracy information already
  const currentLocation = $userLocation.get();
  if (
    currentLocation &&
    latitude === currentLocation.latitude &&
    longitude === currentLocation.longitude
  )
    return;

  const accuracyMeters = getCoordinateAccuracy(latitude, longitude);
  $userLocation.set({ latitude, longitude, accuracyMeters });
});

/**
 * Populates the store with the given location, adjusted for accuracy.
 * Provided to allow feeding Mapbox Geolocate updates into our state.
 *
 * If we're on the "nearby" page, also pushes it into the URL in case user performs browser navigations.
 */
export function setLocationManually(coords: GeolocationCoordinates) {
  const { latitude, longitude, accuracy } = coords;
  const numDecimalDigits = getNumDecimalDigits(latitude, accuracy);
  const latitudeFixed = latitude.toFixed(numDecimalDigits);
  const longitudeFixed = longitude.toFixed(numDecimalDigits);
  $userLocation.set({
    latitude: latitudeFixed,
    longitude: longitudeFixed,
    accuracyMeters: accuracy,
  });
  $userLocationError.set(0);

  const page = $router.get();
  if (page?.route === "nearby") {
    redirectPage($router, page.route, page.params, {
      ...page.search,
      ll: `${latitudeFixed},${longitudeFixed}`,
    });
  }
}

/**
 * Calls the browser geolocation API to get the user's location, then populates it into the store.
 */
export function getLocationFromGps() {
  $userLocationLoading.set(true);
  // Try first for freshest most accurate fast location
  getCurrentPosition({
    enableHighAccuracy: true,
    timeout: 3_000,
    maximumAge: 180_000, // 3 minutes
  })
    .catch((error: GeolocationPositionError) => {
      // Don't retry if error is permission denied
      if (error.code === GeolocationPositionError.PERMISSION_DENIED) {
        throw error;
      }

      // Otherwise retry with less accuracy, allowing older location
      return getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 7_000,
        maximumAge: 3_600_000, // 1 hour
      });
    })
    .then(
      ({ coords }: GeolocationPosition) => {
        setLocationManually(coords);
      },
      (error: GeolocationPositionError) => {
        $userLocationError.set(error.code);
      },
    )
    .finally(() => $userLocationLoading.set(false));
}

/**
 * Clears the location error potentially set by {@link getLocationFromGps}.
 * This is used because certain errors may show modals which require dismissal.
 */
export function clearLocationError() {
  $userLocationError.set(0);
}
