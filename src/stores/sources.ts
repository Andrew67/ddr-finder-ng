/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import { createFetcherStore } from "./fetcher.ts";
import type { SourcesApiResponse } from "../api-types/sources";
import { computed } from "nanostores";

/** Metadata for the various arcade data sources */
export const $sources = createFetcherStore<SourcesApiResponse>([
  "/sources.json",
]);

export const $activeSourceId = computed($sources, (sources) => {
  // TODO: Read source from URL
  return sources.data?.default;
});

export const $activeSource = computed(
  [$sources, $activeSourceId],
  (sources, activeSourceId) => {
    return sources.data?.sources[activeSourceId ?? sources.data.default];
  },
);
