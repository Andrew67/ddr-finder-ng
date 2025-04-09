/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import { computed } from "nanostores";
import { createRouter } from "@nanostores/router";
import { persistentAtom } from "@nanostores/persistent";

import { pages } from "./pages";

export const $router = createRouter(
  Object.fromEntries(
    pages.map(({ page }) => [page ?? "home", `/app/${page}/`]),
  ),
);

export const $metadata = computed($router, (router) => {
  const pageRoute = router?.route;
  return pages.find(({ page }) => pageRoute === page);
});

/**
 * The last used "experience" (Nearby or Explore).
 * Used for re-opening to `/app` path auto-restore.
 */
export const $lastUsedExperience = persistentAtom<string>("last-used-page", "");
$router.subscribe((page) => {
  const route = page?.route;
  if (route === "nearby" || route === "explore") $lastUsedExperience.set(route);
});
