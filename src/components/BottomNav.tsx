import type { h, FunctionComponent } from "preact";
import { useCallback } from "preact/hooks";
import { IconLocationSearch, IconMap2, IconMenu2 } from "@tabler/icons-preact";
import { $router } from "../stores/router.ts";
import { useStore } from "@nanostores/preact";
import { getPagePath } from "@nanostores/router";

export const BottomNav: FunctionComponent<{
  initialPage: string | undefined;
}> = ({ initialPage = "" }) => {
  const pageRoute = useStore($router)?.route ?? initialPage;

  const activeLinkClasses = useCallback(
    (page: string) => (page === pageRoute ? "active bg-base-200" : ""),
    [pageRoute],
  );

  return (
    <nav class="btm-nav relative short:btm-nav-xs bg-base-300">
      <a
        href={getPagePath($router, "nearby")}
        class={activeLinkClasses("nearby") + " short:flex-row"}
      >
        <IconLocationSearch aria-hidden="true" />
        <span className="btm-nav-label">Nearby</span>
      </a>
      <a
        href={getPagePath($router, "explore")}
        class={activeLinkClasses("explore") + " short:flex-row"}
      >
        <IconMap2 aria-hidden="true" />
        <span class="btm-nav-label">Explore</span>
      </a>
      <a
        href={getPagePath($router, "menu")}
        class={activeLinkClasses("menu") + " short:flex-row"}
      >
        <IconMenu2 aria-hidden="true" />
        <span class="btm-nav-label">Menu</span>
      </a>
    </nav>
  );
};
