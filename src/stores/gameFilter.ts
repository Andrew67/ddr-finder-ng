/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import { computed } from "nanostores";
import { $router } from "./router";
import { redirectPage } from "@nanostores/router";

// TODO: Consider supported filters for current data source and ignore them
const ALLOWED_FILTERS = ["ddr", "piu", "smx"];
const allowed = (value: string) => ALLOWED_FILTERS.includes(value);

export const $gameFilter = computed([$router], (page) => {
  // Priority: `games` parameter in URL, followed by localStorage `gameFilters` value
  // Exception: if `ll` parameter is set in URL, but not `games`, it implies a request for default `games`
  const urlFilterString = page?.search["games"];

  // Compatibility parse for DDR only filter setting
  let localStorageFilterString = localStorage.getItem("game-filter");
  if (
    localStorageFilterString == null &&
    localStorage.getItem("filter-ddr-only") === "true"
  )
    localStorageFilterString = "ddr";

  const hasLLParameter = Boolean(page?.search["ll"]);
  const activeFilterString =
    urlFilterString ?? (hasLLParameter ? null : localStorageFilterString);

  return activeFilterString
    ? activeFilterString.split(",").filter(allowed).sort()
    : [];
});

/**
 * Sets the selected source ID into the URL and into localStorage for later
 */
export const setGameFilter = (gameFilter: string[]) => {
  const gameFilterString = gameFilter.join(",");
  localStorage.setItem("game-filter", gameFilterString);
  // Compatibility set for DDR only filter setting
  localStorage.setItem("filter-ddr-only", String(gameFilterString === "ddr"));

  const page = $router.get();
  if (page) {
    const newSearch = page.search;
    if (gameFilter.length === 0) delete newSearch.games;
    else newSearch.games = gameFilterString;

    redirectPage($router, page.route, page.params, newSearch);
  }
};

// Auto-sets the active source ID into the URL if no parameters are currently set, such as from a fresh launch.
// This avoids the edge case where active ID was loaded from localStorage successfully but unset when `ll` is set.
const $gameFilterRouter = computed(
  [$gameFilter, $router],
  (activeFilter, router) => ({ activeFilter, router }),
);
$gameFilterRouter.subscribe(({ activeFilter, router: page }) => {
  if (!page) return;
  if (page.route !== "nearby" && page.route !== "explore") return;
  if (page.search["ll"] || page.search["games"]) return;
  if (activeFilter.length !== 0) setGameFilter(activeFilter);
});
