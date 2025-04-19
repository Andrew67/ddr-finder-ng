/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import { atom, computed } from "nanostores";
import { distance } from "@turf/distance";

import type { ArcadeLocation } from "../../api-types/all";
import type { ArcadeLocationWithDistance } from "../../api-types/nearby";
import { $userLocation } from "../userLocation.ts";

export const $selectedArcade = atom<ArcadeLocation | null>(null);

// TODO: Sync selected arcade into/out of URL

export const $selectedArcadeWithDistance = computed(
  [$selectedArcade, $userLocation],
  (selectedArcade, userLocation) => {
    if (!selectedArcade) return null;

    const userCoordinates = userLocation && [
      Number(userLocation.longitude),
      Number(userLocation.latitude),
    ];
    const distanceKm = userCoordinates
      ? distance(userCoordinates, selectedArcade.geometry.coordinates)
      : -1;

    return {
      ...selectedArcade,
      // Required due to the runtime version doing some sort of prototype inheritance
      geometry: { ...selectedArcade.geometry },
      properties: {
        ...selectedArcade.properties,
        distanceKm,
      },
    } satisfies ArcadeLocationWithDistance;
  },
);
