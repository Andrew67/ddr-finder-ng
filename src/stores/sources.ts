/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import { createFetcherStore } from "./fetcher.ts";
import type { SourcesApiResponse } from "../api-types/sources";
import { computed } from "nanostores";
import { $router } from "./router.ts";

/** Metadata for the various arcade data sources */
export const $sources = createFetcherStore<SourcesApiResponse>([
  "/sources.json",
]);

export const $activeSource = computed([$sources, $router], (sources, page) => {
  if (!sources.data) return undefined;

  // Priority: `src` parameter in URL, followed by localStorage `datasrc` value
  // Exception: if `ll` parameter is set in URL, but not `src`, it implies a request for default `src`
  const urlSourceId = page?.search["src"];
  const localStorageSourceId = localStorage.getItem("datasrc");
  const defaultSourceId = sources.data.default;
  const hasLLParameter = Boolean(page?.search["ll"]);
  const activeSourceId =
    urlSourceId ?? (hasLLParameter ? defaultSourceId : localStorageSourceId);

  // Compatibility: drop to default data source if input is not in available sources
  if (activeSourceId && activeSourceId in sources.data.sources)
    return sources.data.sources[activeSourceId];
  return sources.data.sources[defaultSourceId];
});

export const $activeSourceId = computed(
  $activeSource,
  (activeSource) => activeSource?.id,
);
