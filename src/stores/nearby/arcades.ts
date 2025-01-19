/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import { createFetcherStore } from "../fetcher.ts";
import type { NearbyApiResponse } from "../../api-types/nearby";
import { computed } from "nanostores";
import { $userLocation } from "../userLocation.ts";
import { $activeSourceId } from "../sources.ts";

const $ll = computed(
  $userLocation,
  (userLocation) =>
    userLocation &&
    encodeURIComponent(`${userLocation.latitude},${userLocation.longitude}`),
);

const $src = computed(
  $activeSourceId,
  (activeSourceId) => activeSourceId && encodeURIComponent(activeSourceId),
);

export const $nearbyArcades = createFetcherStore<NearbyApiResponse>([
  "/nearby/",
  $src,
  ".geojson?ll=",
  $ll,
  // TODO: Game filters
]);
