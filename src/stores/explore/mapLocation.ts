/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import { persistentAtom } from "@nanostores/persistent";
import { $router } from "../router.ts";
import { redirectPage } from "@nanostores/router";

export type MapLocation = {
  center: {
    lat: number;
    lng: number;
  };
  zoom: number;
};

/** TODO: Dynamic digits based on zoom level */
const LAT_LNG_DIGITS = 5;

/**
 * On the "explore" page, this feeds into the URL and gets used for moving the map.
 * Saves the last location to local storage to be used on next app open.
 */
export const $mapLocation = persistentAtom<MapLocation>(
  "ng-map-last-view",
  {
    // Default: zoomed out US/Mexico/Canada view, centered on Dallas, TX, US
    center: { lat: 32.7157, lng: -96.8088 },
    zoom: 3,
  },
  {
    encode: JSON.stringify,
    decode: JSON.parse,
    listen: false,
  },
);

/**
 * Flow map movement events back into our state and the URL.
 * TODO: Centralize URL updating code, such that ll/z can be set on page load. Today, if we did that, they'd override source/filters from local storage
 */
export function setLocationFromMap(newLocation: MapLocation) {
  $mapLocation.set(newLocation);

  const page = $router.get();
  if (page?.route === "explore") {
    const latitudeFixed = newLocation.center.lat.toFixed(LAT_LNG_DIGITS);
    const longitudeFixed = newLocation.center.lng.toFixed(LAT_LNG_DIGITS);
    redirectPage($router, page.route, page.params, {
      ...page.search,
      ll: `${latitudeFixed},${longitudeFixed}`,
      z: newLocation.zoom.toFixed(1),
    });
  }
}

// Moves the map on the explore page using the URL parameters when changed
$router.subscribe((page) => {
  // On the "nearby" page, the parameters feed into `$userLocation` instead
  if (page?.route !== "explore") return;

  const ll = page?.search["ll"];
  const z = page?.search["z"];
  if (!ll || !z) return;

  // Input validation: both latitude and longitude provided
  let [latitude, longitude] = ll.split(",");
  if (!latitude || !longitude) return;

  // Input validation: numeric inputs provided
  const latitudeNumeric = Number(latitude);
  const longitudeNumeric = Number(longitude);
  let zoomNumeric = Number(z);
  if (isNaN(latitudeNumeric) || isNaN(longitudeNumeric) || isNaN(zoomNumeric))
    return;

  // Input validation: latitude between +/- 90 and longitude between +/- 180
  if (latitudeNumeric < -90 || latitudeNumeric > 90) return;
  if (longitudeNumeric < -180 || longitudeNumeric > 180) return;

  // Compatibility: clamp zoom to between 1 and 22
  if (zoomNumeric < 1) zoomNumeric = 1;
  if (zoomNumeric > 22) zoomNumeric = 22;

  // If this is already our current location, don't set it
  const currentLocation = $mapLocation.get();
  if (
    latitudeNumeric.toFixed(LAT_LNG_DIGITS) ===
      currentLocation.center.lat.toFixed(LAT_LNG_DIGITS) &&
    longitudeNumeric.toFixed(LAT_LNG_DIGITS) ===
      currentLocation.center.lng.toFixed(LAT_LNG_DIGITS) &&
    zoomNumeric.toFixed(1) === currentLocation.zoom.toFixed(1)
  )
    return;

  $mapLocation.set({
    center: { lat: latitudeNumeric, lng: longitudeNumeric },
    zoom: zoomNumeric,
  });
});
