/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import { computed } from "nanostores";
import { $userLocation } from "../userLocation.ts";
import { $nearbyArcades } from "./arcades.ts";

export type StaticMapProps = {
  lightThemeUrl: string;
  darkThemeUrl: string;
  width: number;
  height: number;
};

/** Mapbox config parameters */
const config = {
  accessToken:
    "pk.eyJ1IjoiYW5kcmV3NjciLCJhIjoiY2lxMDlvOHZoMDAxOWZxbm9tdnR1NjVubSJ9.35GV_5ZM6zS2R5KQCwBWqw",
  lightTheme: {
    style: "andrew67/clrwbi529011u01qseesn4gj9",
    userLocation: "b91c1c", // Tailwind CSS Red 700
    arcadeLocation: "a21caf", // Tailwind CSS Fuchsia 700
  },
  darkTheme: {
    style: "andrew67/clrwd8c0c014b01nl1nr0hj9k",
    userLocation: "fecaca", // Tailwind CSS Red 200
    arcadeLocation: "f5d0fe", // Tailwind CSS Fuchsia 200
  },
} as const;

const $userLocationMarker = computed($userLocation, (userLocation) => {
  if (userLocation == null) return { light: "", dark: "" };
  const { longitude, latitude } = userLocation;

  return {
    light: `pin-s+${config.lightTheme.userLocation}(${longitude},${latitude})`,
    dark: `pin-s+${config.darkTheme.userLocation}(${longitude},${latitude})`,
    position: `${longitude},${latitude}`,
  };
});

/**
 * The first 5 locations get added to the map.
 * To keep it from zooming out too much, the distance is capped to 15km past the first 3 results,
 * unless result #2 already exceeded these bounds (sparse area).
 */
export const $numLocationsToShow = computed($nearbyArcades, (nearbyArcades) => {
  const distancesKm: number[] = [];
  nearbyArcades.data?.features.slice(0, 5).forEach((location, index) => {
    const distanceKm = location.properties.distanceKm;
    if (index < 3 || distanceKm < 15 || distancesKm[1] >= 15) {
      distancesKm.push(distanceKm);
    }
  });
  return distancesKm.length;
});

const $arcadeLocationMarkers = computed(
  [$nearbyArcades, $numLocationsToShow],
  (nearbyArcades, numLocationsToShow) => {
    if (nearbyArcades.data == undefined)
      return { light: "", dark: "", loaded: false };

    const markers = { light: "", dark: "", loaded: true };
    nearbyArcades.data.features
      .slice(0, numLocationsToShow)
      .map((location, index) => {
        const label = index + 1;
        const lngFixed = location.geometry.coordinates[0].toFixed(4);
        const latFixed = location.geometry.coordinates[1].toFixed(4);

        return {
          light: `pin-l-${label}+${config.lightTheme.arcadeLocation}(${lngFixed},${latFixed}),`,
          dark: `pin-l-${label}+${config.darkTheme.arcadeLocation}(${lngFixed},${latFixed}),`,
        };
      })
      .forEach((locationMarker) => {
        // Reverse order places closer locations higher in the Z-index by having them occur later in the URL
        markers.light = `${locationMarker.light}${markers.light}`;
        markers.dark = `${locationMarker.dark}${markers.dark}`;
      });
    return markers;
  },
);

export const $staticMap = computed(
  [$userLocationMarker, $arcadeLocationMarkers],
  (userLocationMarker, arcadeLocationMarkers) => {
    // Screen width is captured when inputs change (maxes out at 640px minus padding and border)
    // TODO: Fix the weird zone between 606 and 639 width
    const width = Math.min(window.innerWidth, 640 - 32 - 2);
    const height = 208;

    // When no arcades are nearby, the `auto` map position zooms in too much. Let's zoom it out to show the search scope
    const hasNearbyArcades =
      arcadeLocationMarkers.loaded && arcadeLocationMarkers.light;
    const position = hasNearbyArcades
      ? "auto"
      : `${userLocationMarker.position},8`;

    return {
      lightThemeUrl:
        userLocationMarker.light &&
        // Loaded is used so that the user location map can still load when there's no arcades nearby
        arcadeLocationMarkers.loaded &&
        `https://api.mapbox.com/styles/v1/${config.lightTheme.style}/static/${arcadeLocationMarkers.light}${userLocationMarker.light}/${position}/${width}x${height}@2x?access_token=${config.accessToken}`,
      darkThemeUrl:
        userLocationMarker.dark &&
        arcadeLocationMarkers.loaded &&
        `https://api.mapbox.com/styles/v1/${config.darkTheme.style}/static/${arcadeLocationMarkers.dark}${userLocationMarker.dark}/${position}/${width}x${height}@2x?access_token=${config.accessToken}`,
      width,
      height,
    } as StaticMapProps;
  },
);
