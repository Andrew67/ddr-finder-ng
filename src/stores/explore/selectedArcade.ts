/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import { atom, computed } from "nanostores";

import type { ArcadeLocation } from "../../api-types/all";
import type { ArcadeLocationWithDistance } from "../../api-types/nearby";
import { $userLocation } from "../userLocation.ts";

export const $selectedArcade = atom<ArcadeLocation | null>(null);

// TODO: Sync selected arcade into/out of URL

export const $selectedArcadeWithDistance = computed(
  [$selectedArcade, $userLocation],
  (selectedArcade, userLocation) => {
    if (!selectedArcade) return null;
    return {
      ...selectedArcade,
      geometry: { ...selectedArcade.geometry },
      properties: {
        ...selectedArcade.properties,
        // TODO: Calculate distance from user location
        distanceKm: -1,
      },
    } satisfies ArcadeLocationWithDistance;
  },
);
