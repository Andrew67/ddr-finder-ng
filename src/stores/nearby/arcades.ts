import { createFetcherStore } from "../fetcher.ts";
import type { NearbyApiResponse } from "../../api-types/nearby";
import { computed } from "nanostores";
import { $userLocation } from "../userLocation.ts";

const $ll = computed(
  $userLocation,
  (userLocation) =>
    userLocation &&
    encodeURIComponent(`${userLocation.latitude},${userLocation.longitude}`),
);

export const $nearbyArcades = createFetcherStore<NearbyApiResponse>([
  "/nearby/",
  "ziv", // TODO: Read source from user settings / URL
  ".geojson?ll=",
  $ll,
  // TODO: URL builder (source, game filters)
]);
