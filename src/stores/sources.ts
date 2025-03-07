/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import { createFetcherStore } from "./fetcher.ts";
import type { SourcesApiResponse } from "../api-types/sources";
import { computed } from "nanostores";
import { $router } from "./router.ts";
import { redirectPage } from "@nanostores/router";

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

/**
 * Sets the selected source ID into the URL and into localStorage for later
 */
export const setActiveSourceId = (sourceId: string) => {
  localStorage.setItem("datasrc", sourceId);

  const page = $router.get();
  const defaultSourceId = $sources.get().data?.default;
  if (page) {
    const newSearch = page.search;
    if (sourceId === defaultSourceId) delete newSearch.src;
    else newSearch.src = sourceId;

    redirectPage($router, page.route, page.params, newSearch);
  }
};

// Auto-sets the active source ID into the URL if no parameters are currently set, such as from a fresh launch.
// This avoids the edge case where active ID was loaded from localStorage successfully but unset when `ll` is set.
const $activeSourceRouter = computed(
  [$activeSource, $router],
  (activeSource, router) => ({ activeSource, router }),
);
$activeSourceRouter.subscribe(({ activeSource, router: page }) => {
  if (!page) return;
  if (page.route !== "nearby" && page.route !== "explore") return;
  if (page.search["ll"] || page.search["src"]) return;
  if (activeSource) setActiveSourceId(activeSource.id);
});
