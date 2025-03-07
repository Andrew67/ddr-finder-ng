/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import { createFetcherStore } from "../fetcher.ts";
import type { NearbyApiResponse } from "../../api-types/nearby";
import { computed } from "nanostores";
import { $userLocation } from "../userLocation.ts";
import { $activeSourceId } from "../sources.ts";
import { $gameFilter } from "../gameFilter.ts";

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

const $filter = computed($gameFilter, (gameFilter) =>
  gameFilter.length === 0
    ? ""
    : `&filter=${encodeURIComponent(gameFilter.join(","))}`,
);

// TODO: Consider supported filters based on source `has` fields, not hard-coding this to ZIV only
const $zivFilter = computed([$src, $filter], (src, filter) =>
  src === "ziv" ? filter : "",
);

export const $nearbyArcades = createFetcherStore<NearbyApiResponse>([
  "/nearby/",
  $src,
  ".geojson?ll=",
  $ll,
  $zivFilter,
]);
