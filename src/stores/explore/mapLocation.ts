/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import { persistentAtom } from "@nanostores/persistent";

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

// TODO: Update URL when map location changes
// TODO: Move map when URL changes
