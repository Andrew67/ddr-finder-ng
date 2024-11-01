/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import { createRouter } from "@nanostores/router";
import { pages } from "./pages.ts";
import { computed } from "nanostores";

export const $router = createRouter(
  Object.fromEntries(
    pages.map(({ page }) => [page ?? "home", `/app/${page}/`]),
  ),
);

export const $metadata = computed($router, (router) => {
  const pageRoute = router?.route;
  return pages.find(({ page }) => pageRoute === page);
});
