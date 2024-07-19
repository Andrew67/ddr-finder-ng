import { useMemo } from "preact/hooks";
import type { ArcadeLocationWithDistance } from "../../api-types/nearby";

export type StaticMap = {
  lightThemeUrl: string;
  darkThemeUrl: string;
  width: number;
  height: number;
};

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

/** Builds a Mapbox Static Images API object from the given user and arcade locations */
export function useStaticMap(
  userLocation: Pick<GeolocationPosition, "coords"> | null,
  arcadeLocationFeatures: ArcadeLocationWithDistance[],
): StaticMap {
  // Screen width is captured only once (maxes out at 640px minus padding and border)
  // TODO: Fix the weird zone between 606 and 639 width
  const width = useMemo(() => Math.min(window.innerWidth, 640 - 32 - 2), []);
  const height = 208;

  const userLocationMarker = useMemo(() => {
    if (userLocation == null) return { light: "", dark: "" };

    // TODO: Round based on accuracy
    const lngFixed = userLocation.coords.longitude.toFixed(4);
    const latFixed = userLocation.coords.latitude.toFixed(4);

    return {
      light: `pin-s+${config.lightTheme.userLocation}(${lngFixed},${latFixed})`,
      dark: `pin-s+${config.darkTheme.userLocation}(${lngFixed},${latFixed})`,
    };
  }, [userLocation]);

  const arcadeLocationsToAdd = useMemo(() => {
    let locationsToAdd: Array<{
      coordinates: ArcadeLocationWithDistance["geometry"]["coordinates"];
      distanceKm: ArcadeLocationWithDistance["properties"]["distanceKm"];
    }> = [];

    // The first 5 locations get added to the map.
    // To keep it from zooming out too much, the distance is capped to 15km past the first 3 results,
    // unless result #2 already exceeded these bounds (sparse area).
    for (let i = 0; i < 5 && i < arcadeLocationFeatures.length; ++i) {
      const location = arcadeLocationFeatures[i];
      const coordinates = location.geometry.coordinates;
      const distanceKm = location.properties.distanceKm;
      if (i < 3 || distanceKm < 15 || locationsToAdd[1].distanceKm >= 15) {
        locationsToAdd.push({ coordinates, distanceKm });
      }
    }

    return locationsToAdd;
  }, [arcadeLocationFeatures]);

  const arcadeLocationMarkers = useMemo(
    () =>
      arcadeLocationsToAdd
        .map((location, index) => {
          const label = index + 1;
          const lngFixed = location.coordinates[0].toFixed(4);
          const latFixed = location.coordinates[1].toFixed(4);

          return {
            light: `pin-l-${label}+${config.lightTheme.arcadeLocation}(${lngFixed},${latFixed}),`,
            dark: `pin-l-${label}+${config.darkTheme.arcadeLocation}(${lngFixed},${latFixed}),`,
          };
        })
        .reduce(
          (previousValue, currentValue) => ({
            // Reverse order places closer locations higher in the Z-index by having them occur later
            light: `${currentValue.light}${previousValue.light}`,
            dark: `${currentValue.dark}${previousValue.dark}`,
          }),
          {
            light: "",
            dark: "",
          },
        ),
    [arcadeLocationsToAdd],
  );

  return useMemo(
    () => ({
      lightThemeUrl:
        userLocationMarker.light &&
        arcadeLocationMarkers.light &&
        `https://api.mapbox.com/styles/v1/${config.lightTheme.style}/static/${arcadeLocationMarkers.light}${userLocationMarker.light}/auto/${width}x${height}@2x?access_token=${config.accessToken}`,
      darkThemeUrl:
        userLocationMarker.dark &&
        arcadeLocationMarkers.dark &&
        `https://api.mapbox.com/styles/v1/${config.darkTheme.style}/static/${arcadeLocationMarkers.dark}${userLocationMarker.dark}/auto/${width}x${height}@2x?access_token=${config.accessToken}`,
      width,
      height,
    }),
    [userLocationMarker, arcadeLocationMarkers, width, height],
  );
}
