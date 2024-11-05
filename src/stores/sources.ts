/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import { createFetcherStore } from "./fetcher.ts";
import type { SourcesApiResponse } from "../api-types/sources";
import { computed } from "nanostores";

/** Metadata for the various arcade data sources */
export const $sources = createFetcherStore<SourcesApiResponse>([
  "/sources.json",
]);

export const $activeSource = computed($sources, (sources) => {
  // TODO: Feed source from URL
  return (
    sources.data?.sources["ziv"] ?? sources.data?.sources[sources.data.default]
  );
});
