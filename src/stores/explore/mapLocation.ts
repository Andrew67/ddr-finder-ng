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
 * TODO: Trim lat/lng digits based on zoom level
 * TODO: Centralize URL updating code, such that ll/z can be set on page load. Today, if we did that, they'd override source/filters from local storage
 */
export function setLocationFromMap(newLocation: MapLocation) {
  $mapLocation.set(newLocation);

  const page = $router.get();
  if (page?.route === "explore") {
    const latitudeFixed = newLocation.center.lat.toFixed(5);
    const longitudeFixed = newLocation.center.lng.toFixed(5);
    redirectPage($router, page.route, page.params, {
      ...page.search,
      ll: `${latitudeFixed},${longitudeFixed}`,
      z: newLocation.zoom.toFixed(1),
    });
  }
}
// TODO: Move map when URL changes
